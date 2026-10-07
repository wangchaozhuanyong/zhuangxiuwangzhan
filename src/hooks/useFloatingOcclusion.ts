import { useLayoutEffect, useState, type RefObject } from "react";

const modalContent = '[role="dialog"][aria-modal="true"],[role="alertdialog"][aria-modal="true"],dialog[open]';
const recoveryContent = '[data-interaction-feedback],.public-route-feedback__recovery,.public-update-notice';
const focusedInput = 'input:not([type="hidden"]):not(:disabled),textarea:not(:disabled),select:not(:disabled),[role="textbox"],[contenteditable]:not([contenteditable="false"])';

const intersects = (left: DOMRect, right: DOMRect) => left.width > 0 && left.height > 0
  && right.width > 0 && right.height > 0 && left.left < right.right && left.right > right.left
  && left.top < right.bottom && left.bottom > right.top;

const isVisible = (element: HTMLElement) => {
  if (!element.isConnected || element.closest('[aria-hidden="true"],[hidden],[inert],[data-state="closed"],dialog:not([open])')) return false;
  const box = element.getBoundingClientRect();
  if (box.width <= 0 || box.height <= 0 || box.bottom <= 0 || box.right <= 0
    || box.top >= window.innerHeight || box.left >= window.innerWidth) return false;
  for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
    const style = getComputedStyle(ancestor);
    if (style.visibility === "hidden" || style.visibility === "collapse" || style.display === "none"
      || style.opacity === "0" || style.contentVisibility === "hidden") return false;
  }
  return true;
};

/** Keep the promotion stable during reading. Only active dialogs, recovery
 * actions and a focused form control take priority over this shared entry. */
export function useFloatingOcclusion(ref: RefObject<HTMLElement>, routeKey: string) {
  const [obstructed, setObstructed] = useState(false);
  useLayoutEffect(() => {
    const entry = ref.current;
    if (!entry) return;
    let frame = 0;
    let disposed = false;
    const check = () => {
      frame = 0;
      if (disposed) return;
      const box = entry.getBoundingClientRect();
      const modalOpen = Array.from(document.querySelectorAll<HTMLElement>(modalContent)).some(isVisible);
      const recoveryObstructed = Array.from(document.querySelectorAll<HTMLElement>(recoveryContent))
        .some(element => isVisible(element) && intersects(box, element.getBoundingClientRect()));
      const active = document.activeElement;
      const inputObstructed = active instanceof HTMLElement && !entry.contains(active)
        && active.matches(focusedInput) && isVisible(active) && intersects(box, active.getBoundingClientRect());
      setObstructed(modalOpen || recoveryObstructed || inputObstructed);
    };
    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    document.addEventListener("load", schedule, true);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    document.addEventListener("transitionend", schedule, true);
    document.addEventListener("animationend", schedule, true);
    const main = document.getElementById("main-content");
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (main) resize?.observe(main);
    resize?.observe(entry);
    const changes = new MutationObserver(schedule);
    changes.observe(document.body, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ["aria-hidden", "aria-modal", "hidden", "inert", "class", "style", "open", "role", "data-state", "data-interaction-feedback"] });
    document.fonts?.ready.then(schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      document.removeEventListener("load", schedule, true);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
      document.removeEventListener("transitionend", schedule, true);
      document.removeEventListener("animationend", schedule, true);
      resize?.disconnect();
      changes.disconnect();
    };
  }, [ref, routeKey]);
  return obstructed;
}
