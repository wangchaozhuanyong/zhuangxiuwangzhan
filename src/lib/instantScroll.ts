import { PUBLIC_MOTION, prefersReducedMotion } from "@/lib/publicMotion";

type ScrollBlock = ScrollLogicalPosition;

const runWithInstantScroll = (callback: () => void) => {
  const root = document.documentElement;
  const previousValue = root.style.getPropertyValue("scroll-behavior");
  const previousPriority = root.style.getPropertyPriority("scroll-behavior");

  root.style.setProperty("scroll-behavior", "auto", "important");
  try {
    callback();
  } finally {
    if (previousValue) {
      root.style.setProperty("scroll-behavior", previousValue, previousPriority);
    } else {
      root.style.removeProperty("scroll-behavior");
    }
  }
};

export const scrollWindowToImmediately = (top: number) => {
  runWithInstantScroll(() => {
    window.scrollTo({
      top: Math.max(0, Math.round(top)),
      left: 0,
      behavior: "auto",
    });
  });
};

export const focusElementImmediately = (target: HTMLElement, block: ScrollBlock = "center") => {
  runWithInstantScroll(() => {
    target.scrollIntoView({
      behavior: "auto",
      block,
      inline: "nearest",
    });
  });
  target.focus({ preventScroll: true });
};

export const focusElementByIdWhenReady = (id: string, block: ScrollBlock = "center") => {
  window.setTimeout(() => {
    const target = document.getElementById(id);
    if (target instanceof HTMLElement) focusElementImmediately(target, block);
  }, 0);
};

let cancelSmoothScroll = () => {};

/** Bounded, interruptible scrolling shared by anchors and the footer return action. */
export const scrollWindowToSmoothly = (top: number) => {
  cancelSmoothScroll();
  const target = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight));
  if (prefersReducedMotion()) { scrollWindowToImmediately(target); return; }
  const start = window.scrollY;
  const startedAt = performance.now();
  let frame = 0;
  const cancel = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("pointerdown", cancel);
    window.removeEventListener("keydown", cancel);
  };
  cancelSmoothScroll = cancel;
  const tick = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / PUBLIC_MOTION.scroll);
    scrollWindowToImmediately(start + (target - start) * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) frame = requestAnimationFrame(tick);
    else cancel();
  };
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("pointerdown", cancel, { passive: true });
  window.addEventListener("keydown", cancel);
  frame = requestAnimationFrame(tick);
};
