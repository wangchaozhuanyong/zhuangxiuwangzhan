import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicContentStatusText } from "@/i18n/publicContentStatusText";
import { getPublicRoutePrefetchTasks } from "@/lib/publicRoutePrefetch";
import { getLanguageFromPath } from "@/i18n/routes";
import { isFurnitureListingPath } from "@/lib/publicScrollRestoration";
import { PUBLIC_MOTION } from "@/lib/publicMotion";
import { PublicRouteTransitionFrame } from "@/components/PublicRouteTransitionFrame";



const isInViewport = (image: HTMLImageElement) => {
  const rect = image.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
    && rect.right > 0 && rect.left < window.innerWidth;
};

/** One readiness owner for all public routes; keep the last complete scene while preparing. */
export function PublicRouteImageGate({ children, routeKey, onCancel }: { children: ReactNode; routeKey: string; onCancel?: (route: string) => void }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const presentedRoute = useRef<string | null>(null);
  const frameRef = useRef<PublicRouteTransitionFrame>(null);
  const showBrandScreen = !presentedRoute.current;
  const scope = useRef({ routeKey, regionOnly: false });
  if (scope.current.routeKey !== routeKey) {
    const previousPath = presentedRoute.current?.split("?")[0];
    const nextPath = routeKey.split("?")[0];
    scope.current = {
      routeKey,
      regionOnly: !!previousPath && !!document.querySelector("#main-content [data-public-results]") &&
        (previousPath === nextPath || isFurnitureListingPath(previousPath) && isFurnitureListingPath(nextPath)),
    };
  }
  const { regionOnly } = scope.current;
  const [feedbackRoute, setFeedbackRoute] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ routeKey, status: "waiting" as "waiting" | "ready" | "timeout" });
  const status = state.routeKey === routeKey ? state.status : "waiting";
  const contentRef = useRef<HTMLDivElement>(null);
  const blocked = status !== "ready";

  useLayoutEffect(() => {
    const content = regionOnly ? contentRef.current?.querySelector<HTMLElement>("[data-public-results]") : contentRef.current;
    content?.toggleAttribute("inert", blocked);
    content?.setAttribute("aria-busy", String(blocked));
    if (!blocked) {
      presentedRoute.current = routeKey;
      window.dispatchEvent(new Event("public-route-ready"));
      if (!showBrandScreen && !regionOnly && !window.location.hash && !document.documentElement.dataset.menuOpen && document.documentElement.dataset.navigationType !== "pop") {
        document.getElementById("main-content")?.focus({ preventScroll: true });
      }
      return;
    }
    // Keep navigation available during SPA transitions, including the mobile dock.
    document.documentElement.dataset.publicRouteLoading = showBrandScreen ? "true" : "navigation";
    return () => {
      delete document.documentElement.dataset.publicRouteLoading;
      content?.removeAttribute("inert");
    };
  }, [blocked, regionOnly, routeKey, showBrandScreen]);

  useLayoutEffect(() => {
    const main = contentRef.current;
    if (!main) return;
    const feedback = window.setTimeout(() => setFeedbackRoute(routeKey), PUBLIC_MOTION.feedbackDelay);
    let stopped = false;
    let settled = false;
    let readyFrames = 0;
    let layoutRestored = false;
    const failedImages = new WeakSet<HTMLImageElement>();
    let frame = 0;
    const decoded = new WeakMap<HTMLImageElement, string>();
    const decoding = new WeakMap<HTMLImageElement, string>();
    const pathname = routeKey.split("?")[0];
    const routeQueries = getPublicRoutePrefetchTasks(pathname, getLanguageFromPath(pathname) || language).map(({ queryKey }) => queryKey);
    const brandContainer = showBrandScreen ? document.querySelector(".scheme-a-chrome__brand") : null;

    const check = () => {
      if (stopped || settled) return;
      if (main.querySelector('[data-route-pending="true"]')) { readyFrames = 0; main.dataset.routeWaitReason = "route"; return; }
      const pendingQuery = routeQueries.find((key) => {
        const query = queryClient.getQueryCache().find({ queryKey: key, exact: true });
        return query?.isActive() && query.state.status === "pending";
      });
      if (pendingQuery) { readyFrames = 0; main.dataset.routeWaitReason = `data:${pendingQuery[1]}`; return; }
      if (!layoutRestored) {
        layoutRestored = true;
        window.dispatchEvent(new Event("public-route-layout"));
      }
      // Site settings can replace the fallback logo element after mount.
      const brand = brandContainer?.querySelector<HTMLImageElement>("img");
      const images = [...main.querySelectorAll<HTMLImageElement>("img"), ...(brand ? [brand] : [])]
        .filter((image) => !image.classList.contains("smart-image-previous") && isInViewport(image));
      const ready = images.every((image) => {
        if (failedImages.has(image) || image.dataset.imageState === "error") return true; // The image owns its retry UI.
        const selected = image.currentSrc || image.src;
        if (!image.complete || image.naturalWidth === 0 || !selected) { main.dataset.routeWaitReason = "image-transfer"; return false; }
        if (image.dataset.imageState) {
          main.dataset.routeWaitReason = "image-decode";
          return image.dataset.imageState === "loaded" && image.dataset.decodedSrc === selected;
        }
        if (decoded.get(image) === selected) return true;
        if (decoding.get(image) !== selected) {
          decoding.set(image, selected);
          void Promise.resolve(typeof image.decode === "function" ? image.decode() : undefined).then(() => {
            if (stopped || (image.currentSrc || image.src) !== selected) return;
            decoded.set(image, selected);
            schedule();
          }, () => {
            if (stopped) return;
            decoding.delete(image);
            failedImages.add(image);
            schedule();
          });
        }
        return false;
      });
      if (!ready) readyFrames = 0;
      if (ready && ++readyFrames < 2) { schedule(); return; }
      if (ready) {
        delete main.dataset.routeWaitReason;
        settled = true;
        window.clearTimeout(timeout);
        window.clearTimeout(feedback);
        setState({ routeKey, status: "ready" });
      }
    };
    const schedule = () => {
      if (stopped || settled || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; check(); });
    };
    const timeout = window.setTimeout(() => {
      check();
      // Slow is not failed. Keep a recoverable waiting state; never expose an empty hero automatically.
      if (!settled) setState({ routeKey, status: "timeout" });
    }, PUBLIC_MOTION.timeout);
    const observer = new MutationObserver(schedule);
    const unsubscribeQueries = queryClient.getQueryCache().subscribe(schedule);
    observer.observe(main, { childList: true, subtree: true, attributes: true,
      attributeFilter: ["data-image-state", "data-decoded-src", "data-route-pending", "src", "srcset", "sizes", "media"] });
    if (brandContainer) observer.observe(brandContainer, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-image-state", "data-decoded-src", "src", "srcset"] });
    const imageError = (event: Event) => {
      if (event.target instanceof HTMLImageElement) failedImages.add(event.target);
      schedule();
    };
    main.addEventListener("load", schedule, true);
    main.addEventListener("error", imageError, true);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    // Synchronous check avoids a loading flash for cached, already decoded content.
    check();
    schedule();
    return () => {
      stopped = true;
      observer.disconnect();
      unsubscribeQueries();
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.clearTimeout(feedback);
      main.removeEventListener("load", schedule, true);
      main.removeEventListener("error", imageError, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [language, queryClient, routeKey, showBrandScreen, attempt]);

  const copy = publicContentStatusText[language];
  const retry = () => {
    setState({ routeKey, status: "waiting" });
    setAttempt((value) => value + 1);
    const images = [...(contentRef.current?.querySelectorAll<HTMLImageElement>(".smart-image") || [])];
    const brand = document.querySelector<HTMLImageElement>(".scheme-a-chrome__brand img");
    if (showBrandScreen && brand) images.push(brand);
    images.filter((image) => isInViewport(image) && image.dataset.imageState !== "loaded")
      .forEach((image) => image.dispatchEvent(new Event("public-image-retry")));
    const pathname = routeKey.split("?")[0];
    getPublicRoutePrefetchTasks(pathname, getLanguageFromPath(pathname) || language).forEach(({ queryKey }) => {
      void queryClient.refetchQueries({ queryKey, exact: true, type: "active" });
    });
  };
  const cancel = () => {
    const previous = frameRef.current?.previousRoute;
    if (previous && onCancel) onCancel(previous);
    else setState({ routeKey, status: "ready" });
  };
  return (
    <PublicRouteTransitionFrame ref={frameRef} routeKey={routeKey} pending={blocked} regionOnly={regionOnly}>
      <div ref={contentRef} className="public-route-content" data-route-visual-state={status}
        aria-hidden={blocked && !regionOnly || undefined} aria-busy={blocked || undefined}>
        {children}
      </div>
      {blocked && (showBrandScreen || feedbackRoute === routeKey) ? (
        <div className={showBrandScreen ? "scheme-a-page-loader scheme-a-page-loader--overlay" : "public-route-feedback"}
          role="status" aria-live="polite" aria-busy={status === "waiting"} data-route-loader={showBrandScreen ? "initial" : "navigation"}>
          {showBrandScreen ? <div className="scheme-a-page-loader__brand"><p>{copy.loaderBrand}</p><strong><span>FLASH</span><em>CAST</em></strong><span>{copy.loaderPending}</span></div> : <span className="sr-only">{copy.loaderRoutePending}</span>}
          {status === "waiting" ? <i aria-hidden="true" /> : (
            <div className="public-route-feedback__recovery">
              <p>{copy.loaderTimeout}</p>
              <div className="scheme-a-page-loader__actions">
                <button type="button" onClick={retry}>{copy.loaderRetry}</button>
                <button type="button" onClick={cancel}>{showBrandScreen ? copy.loaderContinue : copy.loaderCancel}</button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </PublicRouteTransitionFrame>
  );
}
