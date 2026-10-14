import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPublicBoot } from "@/lib/publicBoot";
import { isFurnitureListingPath } from "@/lib/publicScrollRestoration";
import { isPublicLanguageUpdate, isSamePublicBusinessPath } from "@/lib/publicRouteScope";
import { PUBLIC_MOTION } from "@/lib/publicMotion";
import { PublicRouteTransitionFrame } from "@/components/PublicRouteTransitionFrame";
import { PublicInitialLoader } from "@/components/PublicInitialLoader";
import { PublicRouteFeedback } from "@/components/PublicRouteFeedback";
import { getPublicImageSelectedSource, hasDecodedPublicImage, rememberDecodedPublicImage } from "@/lib/publicImageDecodeCache";
const isInViewport = (image: HTMLImageElement) => {
  const rect = image.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
    && rect.right > 0 && rect.left < window.innerWidth;
};
const visibleCriticalImages = (main: HTMLElement) => [...main.querySelectorAll<HTMLImageElement>('img[data-critical-image="true"]')]
  .filter((image) => !image.classList.contains("smart-image-previous") && isInViewport(image));
const imageConfiguration = (main: HTMLElement) => JSON.stringify([
  window.innerWidth, window.innerHeight, window.devicePixelRatio,
  visibleCriticalImages(main).map((image) => [image.src, image.srcset, image.sizes,
    [...(image.closest("picture")?.querySelectorAll("source") || [])]
      .map((source) => [source.media, source.srcset, source.sizes, source.type])]),
]);

/** One readiness owner for all public routes; prepare the destination before revealing it. */
export function PublicRouteImageGate({ children, routeKey, onCancel }: { children: ReactNode; routeKey: string; onCancel?: (route: string) => void }) {
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
  const presentedImages = useRef(new Map<string, string>());
  const [imageOnlyCycle, setImageOnlyCycle] = useState<number | null>(null);
  const blocked = status === "waiting" || status === "timeout";
  const imageOnly = status === "waiting" && imageOnlyCycle === cycle;
  const presenting = status === "waiting" || status === "handoff";
  const currentCycle = useRef(cycle);
  currentCycle.current = cycle;
  const emitted = useRef<number | null>(null);
  const restored = useRef<number | null>(null);
  const departingCycle = useRef<number | null>(null);
  const readinessCheck = useRef<(() => void) | undefined>(undefined);

  useLayoutEffect(() => {
    const content = regionOnly ? contentRef.current?.querySelector<HTMLElement>("[data-public-results]") : contentRef.current;
    content?.toggleAttribute("inert", blocked && !imageOnly && (!languageUpdate || regionOnly));
    content?.setAttribute("aria-busy", String(blocked));
    if (!blocked) {
      // Keep the last real wait reason until this ready/degraded DOM commit.
      // Dependency callbacks can finish before React commits their state.
      if (contentRef.current) delete contentRef.current.dataset.routeWaitReason;
      if (emitted.current === cycle) return;
      emitted.current = cycle;
      const release = () => {
        if (currentCycle.current !== cycle || !contentRef.current?.isConnected) return;
        content?.removeAttribute("inert");
        content?.setAttribute("aria-busy", "false");
        presentedRoute.current = routeKey;
        const main = contentRef.current;
        if (status !== "degraded" && visibleCriticalImages(main).every((image) => {
          const selected = getPublicImageSelectedSource(image);
          return image.complete && image.naturalWidth > 0 && selected && (image.dataset.imageState
            ? image.dataset.imageState === "loaded" && image.dataset.decodedSrc === selected
            : hasDecodedPublicImage(image));
        })) {
          presentedImages.current.delete(routeKey);
          presentedImages.current.set(routeKey, imageConfiguration(main));
          if (presentedImages.current.size > 64) presentedImages.current.delete(presentedImages.current.keys().next().value!);
        } else presentedImages.current.delete(routeKey);
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
  }, [blocked, imageOnly, regionOnly, languageUpdate, localFeedback, routeKey, showBrandScreen, boot, cycle, attempt, status]);

  useLayoutEffect(() => {
    const main = contentRef.current;
    if (!main || !blocked) return;
    const feedback = window.setTimeout(() => {
      if (!showBrandScreen) setFeedbackCycle(cycle);
    }, PUBLIC_MOTION.feedbackDelay);
    let stopped = false;
    let settled = false;
    let preservingImages = false;
    let readyFrames = 0;
    const failedImages = new WeakSet<HTMLImageElement>();
    let frame = 0;
    const decoded = new WeakMap<HTMLImageElement, string>();
    const decoding = new WeakMap<HTMLImageElement, string>();
    const brandContainer = showBrandScreen ? document.querySelector(".scheme-a-chrome__brand") : null;

    const check = () => {
      if (stopped || settled) return;
      preservingImages = false;
      const expired = performance.now() >= deadline;
      const wait = (reason: string) => {
        readyFrames = 0;
        setImageOnlyCycle((previous) => previous === cycle ? null : previous);
        if (!showBrandScreen && !localFeedback) setFeedbackCycle(cycle);
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
      const images = [...visibleCriticalImages(main), ...(brand && isInViewport(brand) ? [brand] : [])];
      const ready = images.every((image) => {
        if (failedImages.has(image) || image.dataset.imageState === "error") return true; // The image owns its retry UI.
        const selected = getPublicImageSelectedSource(image);
        if (!image.complete || image.naturalWidth === 0 || !selected) { main.dataset.routeWaitReason = "image-transfer"; return false; }
        if (image.dataset.imageState) {
          main.dataset.routeWaitReason = "image-decode";
          return image.dataset.imageState === "loaded" && image.dataset.decodedSrc === selected;
        }
        if (hasDecodedPublicImage(image)) return true;
        if (decoded.get(image) === selected) return true;
        if (decoding.get(image) !== selected) {
          decoding.set(image, selected);
          void Promise.resolve(typeof image.decode === "function" ? image.decode() : undefined).then(() => {
            if (stopped || getPublicImageSelectedSource(image) !== selected) return;
            decoded.set(image, selected);
            if (typeof image.decode === "function") rememberDecodedPublicImage(selected);
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
      if (!ready) {
        readyFrames = 0;
        // A remounted responsive image may select its cached candidate after
        // layout. Keep the already-known destination readable while its image
        // owns that real wait; never emit ready or invent decode evidence.
        const knownImages = !showBrandScreen && !localFeedback
          && presentedImages.current.get(routeKey) === imageConfiguration(main);
        if (knownImages) {
          preservingImages = true;
          setImageOnlyCycle(cycle);
          window.clearTimeout(feedback);
          setFeedbackCycle((previous) => previous === cycle ? null : previous);
        } else {
          setImageOnlyCycle((previous) => previous === cycle ? null : previous);
          if (!showBrandScreen && !localFeedback) setFeedbackCycle(cycle);
        }
      }
      if (ready && showBrandScreen && ++readyFrames < 2) { schedule(); return; }
      if (ready || expired) {
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
    let timeout = 0;
    const checkDeadline = () => {
      if (stopped || settled) return;
      const remaining = deadline - performance.now();
      // Browser timers can fire before a fractional deadline. Re-arm against
      // that same deadline rather than relying on a later dependency event.
      if (remaining > 0) timeout = window.setTimeout(checkDeadline, Math.ceil(remaining));
      else update();
    };
    timeout = window.setTimeout(checkDeadline, Math.max(0, Math.ceil(deadline - performance.now())));
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
    if (!settled && !showBrandScreen && !localFeedback && !preservingImages) setFeedbackCycle(cycle);
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
  const showInitialFeedback = showBrandScreen && !boot && (blocked || status === "handoff");
  const showNavigationFeedback = !showBrandScreen && !imageOnly && (status === "timeout"
    || feedbackCycle === cycle && finishedFeedbackCycle !== cycle && (blocked || localFeedback));
  return (
    <>
      <PublicRouteTransitionFrame ref={frameRef} routeKey={routeKey} pending={blocked} preserveContent={imageOnly || languageUpdate && !regionOnly} regionOnly={localFeedback} initial={showBrandScreen}
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
          // Retire only the old readiness cycle. Public links commit the target
          // DOM synchronously; only that target's actual dependencies may wait.
        }}>
        <div ref={contentRef} className="public-route-content" data-route-visual-state={status}
          data-route-presentation={imageOnly ? "image-only" : undefined}
          aria-hidden={blocked && !localFeedback && !imageOnly || undefined} aria-busy={blocked || undefined}>
          {children}
        </div>
      </PublicRouteTransitionFrame>
      {showInitialFeedback && <PublicInitialLoader busy={presenting} onRetry={retry} onContinue={cancel} />}
      {showNavigationFeedback && <PublicRouteFeedback key={cycle} scope={localFeedback ? "region" : "page"}
        busy={presenting} timedOut={status === "timeout"} onFinished={() => setFinishedFeedbackCycle(cycle)}
        onRetry={retry} onCancel={cancel} />}
    </>
  );
}
