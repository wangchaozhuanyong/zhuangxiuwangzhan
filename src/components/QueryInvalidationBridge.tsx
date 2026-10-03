import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_INVALIDATION_EVENT, parseQueryInvalidationNotice, type QueryInvalidationNotice } from "@/lib/queryInvalidationEvents";

/** Cross-tab messages contain resource names only, never records or search terms. */
export default function QueryInvalidationBridge() {
  const client = useQueryClient();
  useEffect(() => {
    const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("flashcast-query-updates") : null;
    const storageKey = "flashcast:query-update";
    const receive = (value: unknown) => {
      const notice = parseQueryInvalidationNotice(value);
      if (!notice) return;
      const keys = notice.resources.map((resource) => ["admin", resource]);
      if (notice.published) keys.push(["published"]);
      if (notice.settings) keys.push(["site-settings"]);
      void Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
    };
    const send = (event: Event) => {
      const notice = (event as CustomEvent<QueryInvalidationNotice>).detail;
      if (channel) channel.postMessage(notice);
      else { try { window.localStorage.setItem(storageKey, JSON.stringify({ notice, at: Date.now() })); } catch { /* Optional cross-tab transport. */ } }
    };
    const storage = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) return;
      try { receive(JSON.parse(event.newValue).notice); } catch { /* Ignore invalid optional messages. */ }
    };
    if (channel) channel.onmessage = (event) => receive(event.data);
    window.addEventListener(QUERY_INVALIDATION_EVENT, send);
    window.addEventListener("storage", storage);
    return () => { channel?.close(); window.removeEventListener(QUERY_INVALIDATION_EVENT, send); window.removeEventListener("storage", storage); };
  }, [client]);
  return null;
}
