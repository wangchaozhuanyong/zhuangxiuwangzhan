import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLanguageFromPath } from "@/i18n/routes";

/** Warm only the route the visitor points to, focuses, or touches. */
export default function PublicRoutePrefetch() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const warmRoute = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const target = new URL(link.href, window.location.href);
      const language = getLanguageFromPath(target.pathname);
      if (target.origin !== window.location.origin || !language || target.pathname === window.location.pathname) return;
      void import("@/lib/publicRoutePrefetch")
        .then(({ prefetchPublishedRouteContent }) => prefetchPublishedRouteContent(queryClient, target.pathname, language))
        .catch(() => { /* Prefetch failure must not prevent normal navigation. */ });
    };
    const events = ["pointerover", "focusin", "pointerdown"];
    events.forEach((event) => document.addEventListener(event, warmRoute, { passive: true }));
    return () => events.forEach((event) => document.removeEventListener(event, warmRoute));
  }, [queryClient]);
  return null;
}
