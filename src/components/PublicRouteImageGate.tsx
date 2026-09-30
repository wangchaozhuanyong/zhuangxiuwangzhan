import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicContentStatusText } from "@/i18n/publicContentStatusText";
import { getPublicRoutePrefetchTasks } from "@/lib/publicRoutePrefetch";
import { getLanguageFromPath } from "@/i18n/routes";

const MAX_WAIT_MS = 5000;
let hasMountedPublicRoute = false;

const isInViewport = (image: HTMLImageElement) => {
  const rect = image.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
    && rect.right > 0 && rect.left < window.innerWidth;
};

/** Every route waits for its visible images; only the first visit shows the brand. */
export function PublicRouteImageGate({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [showBrandScreen] = useState(() => !hasMountedPublicRoute);
  const [state, setState] = useState({ routeKey, status: "waiting" as "waiting" | "ready" | "timeout" });
  const status = state.routeKey === routeKey ? state.status : "waiting";
  const contentRef = useRef<HTMLDivElement>(null);
  const blocked = status !== "ready";

  useLayoutEffect(() => {
    hasMountedPublicRoute = true;
  }, []);

  useLayoutEffect(() => {
    const content = contentRef.current;
    content?.toggleAttribute("inert", blocked);
    if (!blocked) return;
    // Keep navigation available during SPA transitions, including the mobile dock.
    document.documentElement.dataset.publicRouteLoading = showBrandScreen ? "true" : "navigation";
    return () => {
      delete document.documentElement.dataset.publicRouteLoading;
      content?.removeAttribute("inert");
    };
  }, [blocked, showBrandScreen]);

  useLayoutEffect(() => {
    const main = contentRef.current;
    if (!main) return;
    let stopped = false;
    let settled = false;
    let frame = 0;
    const decoded = new WeakMap<HTMLImageElement, string>();
    const decoding = new WeakMap<HTMLImageElement, string>();
    const pathname = routeKey.split("?")[0];
    const routeQueries = getPublicRoutePrefetchTasks(pathname, getLanguageFromPath(pathname) || language).map(({ queryKey }) => queryKey);
    const brandContainer = showBrandScreen ? document.querySelector(".scheme-a-chrome__brand") : null;

    const check = () => {
      if (stopped || settled) return;
      if (main.querySelector('[data-route-pending="true"]')) { main.dataset.routeWaitReason = "route"; return; }
      const pendingQuery = routeQueries.find((key) => {
        const query = queryClient.getQueryCache().find({ queryKey: key, exact: true });
        return query?.isActive() && query.state.status === "pending";
      });
      if (pendingQuery) { main.dataset.routeWaitReason = `data:${pendingQuery[1]}`; return; }
      // Site settings can replace the fallback logo element after mount.
      const brand = brandContainer?.querySelector<HTMLImageElement>("img");
      const images = [...main.querySelectorAll<HTMLImageElement>("img"), ...(brand ? [brand] : [])]
        .filter((image) => !image.classList.contains("smart-image-previous") && isInViewport(image));
      const ready = images.every((image) => {
        if (image.dataset.imageState === "error") return true; // The image owns its retry UI.
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
          });
        }
        return false;
      });
      if (ready) {
        delete main.dataset.routeWaitReason;
        settled = true;
        window.clearTimeout(timeout);
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
    }, MAX_WAIT_MS);
    const observer = new MutationObserver(schedule);
    const unsubscribeQueries = queryClient.getQueryCache().subscribe(schedule);
    observer.observe(main, { childList: true, subtree: true, attributes: true,
      attributeFilter: ["data-image-state", "data-decoded-src", "data-route-pending", "src", "srcset", "sizes", "media"] });
    if (brandContainer) observer.observe(brandContainer, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-image-state", "data-decoded-src", "src", "srcset"] });
    main.addEventListener("load", schedule, true);
    main.addEventListener("error", schedule, true);
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
      main.removeEventListener("load", schedule, true);
      main.removeEventListener("error", schedule, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [language, queryClient, routeKey, showBrandScreen]);

  const copy = publicContentStatusText[language];
  return (
    <>
      <div ref={contentRef} className="public-route-content" data-route-visual-state={status} aria-hidden={blocked || undefined} aria-busy={blocked || undefined}>
        {children}
      </div>
      {blocked ? (
        <div className={showBrandScreen ? "scheme-a-page-loader scheme-a-page-loader--overlay" : "public-route-loader"}
          role="status" aria-live="polite" aria-busy={status === "waiting"} data-route-loader={showBrandScreen ? "initial" : "navigation"}>
          <div className={showBrandScreen ? "scheme-a-page-loader__brand" : "public-route-loader__progress"}>
            {showBrandScreen ? <><p>{copy.loaderBrand}</p><strong><span>FLASH</span><em>CAST</em></strong><span>{copy.loaderPending}</span></> : <span className="sr-only">{copy.loaderRoutePending}</span>}
            {status === "waiting" ? <i aria-hidden="true" /> : (
              <div className="scheme-a-page-loader__actions">
                <button type="button" onClick={() => window.location.reload()}>{copy.loaderRetry}</button>
                <button type="button" onClick={() => setState({ routeKey, status: "ready" })}>{copy.loaderContinue}</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
