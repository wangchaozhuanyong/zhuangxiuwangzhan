import { useEffect, useState, type ComponentType } from "react";

/** Optional intent listeners should not compete with the first successful page. */
export default function PublicRoutePrefetchGate() {
  const [Prefetch, setPrefetch] = useState<ComponentType | null>(null);
  useEffect(() => {
    let disposed = false;
    let started = false;
    let recovering = false;
    let recoveryPath = "";
    let stopRecovery: (() => void) | undefined;
    const load = () => {
      if (started) return;
      started = true;
      stopRecovery?.();
      void import("./PublicRouteEnhancements").then(({ default: Component }) => {
        if (!disposed) setPrefetch(() => Component);
      }).catch(() => { started = false; });
    };
    const recover = () => {
      const path = location.pathname + location.search;
      if (started || recovering && recoveryPath === path) return;
      stopRecovery?.();
      recoveryPath = path;
      recovering = true;
      void import("@/lib/publicRouteAssetRecovery").then(({ observeRecoveredPublicAssets }) => {
        if (!disposed && !started && recoveryPath === path) stopRecovery = observeRecoveredPublicAssets(load);
      }).catch(() => { if (recoveryPath === path) recovering = false; });
    };
    const ready = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.degraded === false) load();
      else if (event instanceof CustomEvent && event.detail?.degraded === true) recover();
    };
    window.addEventListener("public-route-ready", ready);
    if (document.querySelector('.public-route-content[data-route-visual-state="ready"]')) load();
    else if (document.querySelector('.public-route-content[data-route-visual-state="degraded"]')) recover();
    return () => { disposed = true; stopRecovery?.(); window.removeEventListener("public-route-ready", ready); };
  }, []);
  return Prefetch ? <Prefetch /> : null;
}
