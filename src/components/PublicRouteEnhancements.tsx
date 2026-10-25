import { lazy, Suspense, useEffect, useState } from "react";
import PublicRoutePrefetch from "./PublicRoutePrefetch";

const PublicCinematicMotion = lazy(() => import("@/components/PublicCinematicMotion"));

const PublicCinematicMotionGate = () => {
  const [shouldLoadMotion, setShouldLoadMotion] = useState(false);

  useEffect(() => {
    const desktopMotion = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let idleCallbackId: number | null = null;
    let fallbackTimer = 0;

    const cancelScheduledLoad = () => {
      if (idleCallbackId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleCallbackId);
      }
      window.clearTimeout(fallbackTimer);
      idleCallbackId = null;
      fallbackTimer = 0;
    };

    const syncMotionPreference = () => {
      cancelScheduledLoad();
      if (!desktopMotion.matches || reducedMotion.matches) {
        setShouldLoadMotion(false);
        return;
      }

      const enableMotion = () => setShouldLoadMotion(true);
      if (typeof window.requestIdleCallback === "function") {
        idleCallbackId = window.requestIdleCallback(enableMotion, { timeout: 800 });
      } else {
        fallbackTimer = window.setTimeout(enableMotion, 120);
      }
    };

    desktopMotion.addEventListener("change", syncMotionPreference);
    reducedMotion.addEventListener("change", syncMotionPreference);
    syncMotionPreference();

    return () => {
      cancelScheduledLoad();
      desktopMotion.removeEventListener("change", syncMotionPreference);
      reducedMotion.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  if (!shouldLoadMotion) return null;

  return (
    <Suspense fallback={null}>
      <PublicCinematicMotion />
    </Suspense>
  );
};

export default function PublicRouteEnhancements() {
  return <><PublicRoutePrefetch /><PublicCinematicMotionGate /></>;
}
