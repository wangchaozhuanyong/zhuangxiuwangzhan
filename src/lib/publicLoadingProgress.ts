import { prefersReducedMotion } from "./publicMotion";

export const PUBLIC_LOADING_PROGRESS = { finish: 250, fade: 140 } as const;

/** Visual waiting feedback only. A readiness owner must explicitly complete it. */
export function startPublicLoadingProgress(track: HTMLElement) {
  let value = prefersReducedMotion() ? 0.5 : 0.08;
  let interval = 0;
  let timer = 0;
  let completion: Promise<void> | undefined;
  let resolveCompletion: (() => void) | undefined;
  let transitionEnd: ((event: TransitionEvent) => void) | undefined;
  const settle = () => {
    window.clearTimeout(timer);
    if (transitionEnd) track.removeEventListener("transitionend", transitionEnd);
    resolveCompletion?.();
  };
  const paint = () => track.style.setProperty("--loading-progress", String(value));
  const pause = () => { window.clearInterval(interval); interval = 0; };
  const resume = () => {
    if (interval || completion || prefersReducedMotion()) return;
    interval = window.setInterval(() => {
      // Never reach the end or move backwards while dependencies are pending.
      value += (0.9 - value) * 0.12;
      paint();
    }, 250);
  };
  paint();
  resume();
  return {
    pause,
    resume,
    complete() {
      if (completion) return completion;
      pause();
      value = 1;
      paint();
      completion = new Promise<void>((resolve) => {
        resolveCompletion = resolve;
        if (prefersReducedMotion()) resolve();
        else {
          // CSS begins on a paint frame. Wait for the actual full-bar frame,
          // with a bounded fallback when transitions are disabled/unavailable.
          transitionEnd = (event) => {
            if (event.target !== track || event.propertyName !== "transform" || event.pseudoElement !== "::after") return;
            const transform = getComputedStyle(track, "::after").transform;
            if (transform === "none" || Number.parseFloat(transform.split("(")[1] ?? "") === 1) settle();
          };
          track.addEventListener("transitionend", transitionEnd);
          timer = window.setTimeout(settle, PUBLIC_LOADING_PROGRESS.finish);
        }
      });
      return completion;
    },
    cancel() {
      pause();
      settle();
    },
  };
}
