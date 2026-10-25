import { useEffect, useState, type ComponentType } from "react";

/** Optional intent listeners should not compete with the first successful page. */
export default function PublicRoutePrefetchGate() {
  const [Prefetch, setPrefetch] = useState<ComponentType | null>(null);
  useEffect(() => {
    let disposed = false;
    let started = false;
    const load = () => {
      if (started) return;
      started = true;
      void import("./PublicRouteEnhancements").then(({ default: Component }) => {
        if (!disposed) setPrefetch(() => Component);
      }).catch(() => { started = false; });
    };
    const ready = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.degraded === false) load();
    };
    window.addEventListener("public-route-ready", ready);
    if (document.querySelector('.public-route-content[data-route-visual-state="ready"]')) load();
    return () => { disposed = true; window.removeEventListener("public-route-ready", ready); };
  }, []);
  return Prefetch ? <Prefetch /> : null;
}
