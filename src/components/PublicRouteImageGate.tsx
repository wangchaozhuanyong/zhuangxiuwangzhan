import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicContentStatusText } from "@/i18n/publicContentStatusText";
import { getPublicBoot } from "@/lib/publicBoot";
import { isFurnitureListingPath } from "@/lib/publicScrollRestoration";
import { isPublicLanguageUpdate, isSamePublicBusinessPath } from "@/lib/publicRouteScope";
import { PUBLIC_MOTION } from "@/lib/publicMotion";
import { PublicRouteTransitionFrame } from "@/components/PublicRouteTransitionFrame";
import { PublicLoadingBar } from "@/components/PublicLoadingBar";



const isInViewport = (image: HTMLImageElement) => {
  const rect = image.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
    && rect.right > 0 && rect.left < window.innerWidth;
};

/** One readiness owner for all public routes; prepare the destination before revealing it. */
export function PublicRouteImageGate({ children, routeKey, onCancel }: { children: ReactNode; routeKey: string; onCancel?: (route: string) => void }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const boot = getPublicBoot();
  const presentedRoute = useRef<string | null>(null);
  const frameRef = useRef<PublicRouteTransitionFrame>(null);
  const showBrandScreen = !presentedRoute.current && boot?.state !== "ready" && boot?.state !== "degraded";
  const scope = useRef({ routeKey, regionOnly: false, languageUpdate: false });
  if (scope.current.routeKey !== routeKey) {
    const previousPath = presentedRoute.current?.split("?")[0];
    const retiringPath = scope.current.routeKey.split("?")[0];
    const nextPath = routeKey.split("?")[0];
    scope.current = {
      routeKey,
      languageUpdate: !!previousPath && isSamePublicBusinessPath(previousPath, nextPath)
        && isPublicLanguageUpdate(retiringPath, nextPath),
      regionOnly: !!previousPath && !!document.querySelector("#main-content [data-public-results]") &&
        (isSamePublicBusinessPath(previousPath, nextPath) || isFurnitureListingPath(previousPath) && isFurnitureListingPath(nextPath)),
    };
  }
  const { regionOnly, languageUpdate } = scope.current;
  const localFeedback = regionOnly || languageUpdate;
  const [feedbackCycle, setFeedbackCycle] = useState<number | null>(null);
  const [finishedFeedbackCycle, setFinishedFeedbackCycle] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [resumeCycle, setResumeCycle] = useState(0);
  const newDeadline = () => showBrandScreen && boot ? boot.deadline : performance.now() + PUBLIC_MOTION.timeout;
  const owner = useRef({ routeKey, attempt, resumeCycle, cycle: 0, deadline: newDeadline() });
  if (owner.current.routeKey !== routeKey || owner.current.attempt !== attempt || owner.current.resumeCycle !== resumeCycle) {
    const resetDeadline = owner.current.routeKey !== routeKey || owner.current.attempt !== attempt;
    owner.current = { routeKey, attempt, resumeCycle, cycle: owner.current.cycle + 1,
      deadline: resetDeadline ? newDeadline() : owner.current.deadline };
  }
  const { cycle, deadline } = owner.current;
  const [state, setState] = useState({ cycle, status: "waiting" as "waiting" | "handoff" | "ready" | "timeout" | "degraded" });
  const status = state.cycle === cycle ? state.status : "waiting";
  const contentRef = useRef<HTMLDivElement>(null);
  const blocked = status === "waiting" || status === "timeout";
  const presenting = status === "waiting" || status === "handoff";
  const currentCycle = useRef(cycle);
  currentCycle.current = cycle;
  const emitted = useRef<number | null>(null);
  const restored = useRef<number | null>(null);
  const departingCycle = useRef<number | null>(null);
  const readinessCheck = useRef<(() => void) | undefined>(undefined);

  useLayoutEffect(() => {
    const content = regionOnly ? contentRef.current?.querySelector<HTMLElement>("[data-public-results]") : contentRef.current;
    content?.toggleAttribute("inert", blocked && (!languageUpdate || regionOnly));
    content?.setAttribute("aria-busy", String(blocked));
    if (!blocked) {
      if (emitted.current === cycle) return;
      emitted.current = cycle;
      const release = () => {
        if (currentCycle.current !== cycle || !contentRef.current?.isConnected) return;
        content?.removeAttribute("inert");
        content?.setAttribute("aria-busy", "false");
        presentedRoute.current = routeKey;
        if (status === "handoff") setState({ cycle, status: "ready" });
        window.dispatchEvent(new CustomEvent("public-route-ready", { detail: { routeKey, attempt, degraded: status === "degraded" } }));
        if (!localFeedback && !window.location.hash && !document.documentElement.dataset.menuOpen
          && (showBrandScreen || document.documentElement.dataset.navigationType !== "pop")) {
          document.getElementById("main-content")?.focus({ preventScroll: true });
        }
      };
      if (showBrandScreen && boot) {
        void boot.complete(status === "degraded");
        release();
      }
      else {
        window.dispatchEvent(new Event("public-scene-prepare"));
        // DOM entrance motion is decorative; ready content accepts input now.
        release();
      }
      return;
    }
    // Keep navigation available during SPA transitions, including the mobile dock.
    if (showBrandScreen) boot?.hold();
    document.documentElement.dataset.publicRouteLoading = showBrandScreen ? "true" : "navigation";
    return () => {
      if (!boot || document.documentElement.dataset.publicRouteLoading === "navigation") delete document.documentElement.dataset.publicRouteLoading;
      content?.removeAttribute("inert");
    };
  }, [blocked, regionOnly, languageUpdate, localFeedback, routeKey, showBrandScreen, boot, cycle, attempt, status]);

  useLayoutEffect(() => {
    const main = contentRef.current;
    if (!main || !blocked) return;
    const feedback = window.setTimeout(() => {
      if (!showBrandScreen) setFeedbackCycle(cycle);
    }, PUBLIC_MOTION.feedbackDelay);
    let stopped = false;
    let settled = false;
    let readyFrames = 0;
    const failedImages = new WeakSet<HTMLImageElement>();
    let frame = 0;
    const decoded = new WeakMap<HTMLImageElement, string>();
    const decoding = new WeakMap<HTMLImageElement, string>();
    const brandContainer = showBrandScreen ? document.querySelector(".scheme-a-chrome__brand") : null;

    const check = () => {
      if (stopped || settled) return;
      const expired = performance.now() >= deadline;
      const wait = (reason: string) => {
        readyFrames = 0;
        main.dataset.routeWaitReason = reason;
        if (expired) setState((previous) => previous.cycle === cycle && previous.status === "timeout"
          ? previous : { cycle, status: "timeout" });
      };
      // History can change before Router renders the destination. Cached data
      // from the retiring route must not reopen its scene during that gap.
      if (departingCycle.current === cycle) { wait("route"); return; }
      if (boot && !boot.stylesReady) { wait("stylesheet"); return; }
      if (main.querySelector('[data-route-pending="true"]') || brandContainer?.closest('[data-route-pending="true"]')) { wait("route"); return; }
      if (restored.current !== cycle) {
        restored.current = cycle;
        window.dispatchEvent(new CustomEvent("public-route-layout", { detail: { routeKey, attempt } }));
      }
      // Site settings can replace the fallback logo element after mount.
      const brand = brandContainer?.querySelector<HTMLImageElement>("img");
      const images = [...main.querySelectorAll<HTMLImageElement>('img[data-critical-image="true"]'), ...(brand ? [brand] : [])]
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
            update();
          }, () => {
            if (stopped) return;
            decoding.delete(image);
            failedImages.add(image);
            update();
          });
        }
        return false;
      });
      if (!ready) readyFrames = 0;
      if (ready && showBrandScreen && ++readyFrames < 2) { schedule(); return; }
      if (ready || expired) {
        delete main.dataset.routeWaitReason;
        settled = true;
        window.clearTimeout(timeout);
        window.clearTimeout(feedback);
        setState({ cycle, status: ready ? "handoff" : "degraded" });
      }
    };
    const schedule = () => {
      if (stopped || settled || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; check(); });
    };
    // Resolve dependency events immediately rather than waiting for a paint.
    const update = () => { check(); schedule(); };
    readinessCheck.current = update;
    // The same deadline is checked again after every dependency change, including
    // data that arrives after timeout and starts a new image/decode wait.
    const timeout = window.setTimeout(update, Math.max(0, deadline - performance.now()));
    const observer = new MutationObserver(update);
    observer.observe(main, { childList: true, subtree: true, attributes: true,
      attributeFilter: ["data-image-state", "data-decoded-src", "data-route-pending", "src", "srcset", "sizes", "media"] });
    if (brandContainer) observer.observe(brandContainer, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-image-state", "data-decoded-src", "src", "srcset"] });
    const brandHeader = brandContainer?.closest("header");
    if (brandHeader) observer.observe(brandHeader, { attributes: true, attributeFilter: ["data-route-pending"] });
    const imageError = (event: Event) => {
      if (event.target instanceof HTMLImageElement) failedImages.add(event.target);
      update();
    };
    main.addEventListener("load", update, true);
    main.addEventListener("error", imageError, true);
    window.addEventListener("resize", schedule);
    window.addEventListener("public-assets-change", update);
    window.addEventListener("scroll", schedule, { passive: true });
    // Synchronous check avoids a loading flash for cached, already decoded content.
    check();
    // A full-page wait must be covered in this commit, before the browser paints.
    // Only local results retain delayed feedback; they do not hide the whole page.
    if (!settled && !showBrandScreen && !localFeedback) setFeedbackCycle(cycle);
    schedule();
    return () => {
      stopped = true;
      if (readinessCheck.current === update) readinessCheck.current = undefined;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.clearTimeout(feedback);
      main.removeEventListener("load", update, true);
      main.removeEventListener("error", imageError, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("public-assets-change", update);
      window.removeEventListener("scroll", schedule);
    };
  }, [routeKey, showBrandScreen, localFeedback, attempt, boot, blocked, cycle, deadline]);

  const copy = publicContentStatusText[language];
  const retry = () => {
    if (showBrandScreen) boot?.retry();
    setState({ cycle, status: "waiting" });
    setAttempt((value) => value + 1);
    const images = [...(contentRef.current?.querySelectorAll<HTMLImageElement>(".smart-image") || [])];
    const brand = document.querySelector<HTMLImageElement>(".scheme-a-chrome__brand img");
    if (showBrandScreen && brand) images.push(brand);
    images.filter((image) => isInViewport(image) && image.dataset.imageState !== "loaded")
      .forEach((image) => image.dispatchEvent(new Event("public-image-retry")));
    const predicate = (query: { isActive: () => boolean; queryKey: readonly unknown[]; state: { status: string; data: unknown } }) =>
      query.isActive() && ["published", "site-settings"].includes(String(query.queryKey[0])) && (query.state.status !== "success" || query.state.data === undefined);
    void queryClient.cancelQueries({ predicate }).then(() => queryClient.refetchQueries({ predicate, type: "active" }));
  };
  const cancel = () => {
    const previous = frameRef.current?.previousRoute;
    if (previous && onCancel) onCancel(previous);
    else setState({ cycle, status: "degraded" });
  };
  useLayoutEffect(() => {
    if (!showBrandScreen || !boot || !blocked) return;
    return boot.claim({ retry, continue: cancel, timeout: () => readinessCheck.current?.() });
    // Recovery handlers belong to this route/attempt; the boot owns its deadline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boot, showBrandScreen, routeKey, attempt, blocked]);
  return (
    <>
      <PublicRouteTransitionFrame ref={frameRef} routeKey={routeKey} pending={blocked} preserveContent={languageUpdate && !regionOnly} regionOnly={localFeedback} initial={showBrandScreen}
        onCancelDeparture={() => {
          // The router may not have rendered the departing destination yet.
          // Selecting this URL again must release that retired readiness cycle.
          if (departingCycle.current !== cycle) return;
          departingCycle.current = null;
          // Returning to the retiring route wakes readiness without a retry deadline.
          setResumeCycle((value) => value + 1);
        }}
        onBeforeCommit={() => {
          departingCycle.current = cycle;
          setFeedbackCycle(cycle);
          setFinishedFeedbackCycle(null);
          // Retire the outgoing data before history changes; its cached data
          // cannot release the new destination during asynchronous Router commit.
          setState({ cycle, status: "waiting" });
        }}>
        <div ref={contentRef} className="public-route-content" data-route-visual-state={status}
          aria-hidden={blocked && !localFeedback || undefined} aria-busy={blocked || undefined}>
          {children}
        </div>
      </PublicRouteTransitionFrame>
      {(showBrandScreen ? !boot && (blocked || status === "handoff")
        : status === "timeout" || feedbackCycle === cycle && finishedFeedbackCycle !== cycle && (blocked || localFeedback)) ? (
        <div className={showBrandScreen ? "scheme-a-page-loader scheme-a-page-loader--overlay"
          : localFeedback ? "public-route-feedback" : "scheme-a-page-loader scheme-a-page-loader--overlay scheme-a-page-loader--navigation"}
          role="status" aria-live="polite" aria-busy={presenting} data-route-loader={showBrandScreen ? "initial" : "navigation"}
          data-feedback-scope={localFeedback ? "region" : "page"}>
          {localFeedback && status !== "timeout" && <PublicLoadingBar key={cycle} complete={status !== "waiting"}
            onFinished={() => setFinishedFeedbackCycle(cycle)} />}
          {!localFeedback ? <div className="scheme-a-page-loader__brand"><p>{copy.loaderBrand}</p><strong><span>FLASH</span><em>CAST</em></strong><span>{copy.loaderPending}</span>
            {status !== "timeout" && <PublicLoadingBar key={cycle} complete={status !== "waiting"}
              onFinished={() => setFinishedFeedbackCycle(cycle)} />}
          </div> : <span className="sr-only">{copy.loaderRoutePending}</span>}
          {status === "timeout" && (
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
    </>
  );
}
