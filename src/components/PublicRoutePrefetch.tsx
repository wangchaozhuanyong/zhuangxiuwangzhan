import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLanguageFromPath } from "@/i18n/routes";

type PrefetchConnection = { saveData?: boolean; effectiveType?: string };
const INTENT_COOLDOWN = 1_000;
const MAX_REMEMBERED_PATHS = 64;

/** Warm only the route the visitor points to, focuses, or touches. */
export default function PublicRoutePrefetch() {
  const queryClient = useQueryClient();
  useEffect(() => {
    // First-entry CSS and critical images own the network until the route gate
    // confirms real readiness. A degraded timeout is not successful readiness.
    let ready = Boolean(document.querySelector('.public-route-content[data-route-visual-state="ready"]'));
    const onRouteReady = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.degraded === false) ready = true;
    };
    window.addEventListener("public-route-ready", onRouteReady);
    const inFlight = new Set<string>();
    const warmedAt = new Map<string, number>();
    const warmRoute = (event: Event) => {
      if (!ready || !(event.target instanceof Element)) return;
      const connection = (navigator as Navigator & { connection?: PrefetchConnection }).connection;
      if (connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      // Crossing child nodes in the same link is not a new navigation intent.
      if (event.type === "pointerover" && event instanceof MouseEvent
        && event.relatedTarget instanceof Node && link.contains(event.relatedTarget)) return;
      const target = new URL(link.href, window.location.href);
      const language = getLanguageFromPath(target.pathname);
      if (target.origin !== window.location.origin || !language || target.pathname === window.location.pathname) return;
      const path = target.pathname;
      const now = Date.now();
      if (inFlight.has(path) || now - (warmedAt.get(path) ?? -Infinity) < INTENT_COOLDOWN) return;
      inFlight.add(path);
      warmedAt.delete(path);
      warmedAt.set(path, now);
      if (warmedAt.size > MAX_REMEMBERED_PATHS) warmedAt.delete(warmedAt.keys().next().value!);
      // Start code/CSS and data together. No navigation waits for speculation.
      void Promise.all([
        import("@/lib/publicPagePrefetch")
          .then(({ prefetchPublicPageModule }) => prefetchPublicPageModule(path)),
        import("@/lib/publicRoutePrefetch")
          .then(({ prefetchPublishedRouteContent }) => prefetchPublishedRouteContent(queryClient, path, language)),
      ]).catch(() => {
        // A later intent or React.lazy can retry a failed speculative import.
        warmedAt.delete(path);
      }).finally(() => inFlight.delete(path));
    };
    const events = ["pointerover", "focusin", "pointerdown"];
    events.forEach((event) => document.addEventListener(event, warmRoute, { passive: true }));
    return () => {
      events.forEach((event) => document.removeEventListener(event, warmRoute));
      window.removeEventListener("public-route-ready", onRouteReady);
    };
  }, [queryClient]);
  return null;
}
