import { useLayoutEffect, useState, type RefObject } from "react";
import { QUOTE_FORM_ID } from "@/lib/quoteFormTarget";

const modalContent = '[role="dialog"][aria-modal="true"],[role="alertdialog"][aria-modal="true"],dialog[open]';
const fixedRecoveryContent = '[data-interaction-feedback],.public-route-feedback__recovery,.public-update-notice';
const recoveryContent = '[data-interaction-feedback],.public-route-feedback__recovery,.public-update-notice,.smart-image-failure';
const focusedInput = 'input:not([type="hidden"]):not(:disabled),textarea:not(:disabled),select:not(:disabled),[role="textbox"],[contenteditable]:not([contenteditable="false"])';
const isEditingInput = (element: HTMLElement) => {
  if (element instanceof HTMLInputElement) return !element.disabled && !element.readOnly
    && ["text", "search", "email", "tel", "url", "password", "number"].includes(element.type);
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  return element.matches('[role="textbox"]:not([aria-readonly="true"]),[contenteditable]:not([contenteditable="false"])');
};
const formControls = `${focusedInput},button:not(:disabled),a[href],[role="button"]`;
const formContainersSelector = `#${QUOTE_FORM_ID},.fc-route-contact-form form`;
// Radix also marks visible triggers as closed; only closed content hides its descendants.
const closedPanel = '[data-state="closed"]:not(:is(button,a[href],[role="button"],input,select,textarea))';
const primaryActions = '.scheme-a-public-shell :is(button,[role="button"],[data-ui="button"],'
  + 'a[class*="button"],a.public-contact-row,input[type="submit"],input[type="button"],a[href^="https://wa.me/"],'
  + 'a[href^="tel:"],a[href*="/quote"],a[href="#landing-quote"]),'
  + ':is(.scheme-a-actions,.actions,[class*="__actions"],[class*="-actions"],.fc-route-action-panel,.fc-furniture-pagination) a[href]';

type Bounds = Pick<DOMRect, "left" | "right" | "top" | "bottom" | "width" | "height">;
const unshifted = (box: Bounds, lift: number): Bounds => ({
  left: box.left, right: box.right, top: box.top + lift, bottom: box.bottom + lift,
  width: box.width, height: box.height,
});
const intersects = (left: Bounds, right: Bounds) => left.width > 0 && left.height > 0
  && right.width > 0 && right.height > 0 && left.left < right.right && left.right > right.left
  && left.top < right.bottom && left.bottom > right.top;

/** Find the nearest free position above the corner, with extra room before returning. */
const findLift = (box: Bounds, actions: Bounds[], current: number, top: number) => {
  const clear = (lift: number, gap = 8) => actions.every((action) =>
    box.right + gap <= action.left || box.left - gap >= action.right
    || box.bottom - lift + gap <= action.top || box.top - lift - gap >= action.bottom);
  const maximum = Math.max(0, box.top - top);
  if (clear(0, current ? 16 : 8)) return 0;
  if (current > 0 && current <= maximum && clear(current)) return current;
  return [0, ...actions.map((action) => box.bottom - action.top + 8)]
    .filter((lift) => lift >= 0 && lift <= maximum).sort((a, b) => a - b)
    .find((lift) => clear(lift));
};

const isVisibleElement = (element: HTMLElement, cache: WeakMap<HTMLElement, boolean>) => {
  if (!element.isConnected || element.closest(`[aria-hidden="true"],[hidden],[inert],${closedPanel},dialog:not([open])`)) return false;
  const box = element.getBoundingClientRect();
  if (box.width <= 0 || box.height <= 0 || box.bottom <= 0 || box.right <= 0
    || box.top >= window.innerHeight || box.left >= window.innerWidth) return false;
  for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
    const cached = cache.get(ancestor);
    if (cached !== undefined) {
      if (!cached) return false;
      continue;
    }
    const style = getComputedStyle(ancestor);
    const visible = !(style.visibility === "hidden" || style.visibility === "collapse" || style.display === "none"
      || style.opacity === "0" || style.contentVisibility === "hidden");
    cache.set(ancestor, visible);
    if (!visible) return false;
  }
  return true;
};

/** Fixed public chrome follows scroll direction, not passing page buttons.
 * Dialogs, recovery actions and active input still take priority. The legacy
 * avoid/reposition modes remain available for content-bound promotions. */
export function useFloatingOcclusion(ref: RefObject<HTMLElement>, routeKey: string, placement: boolean | "fixed" = false, enabled = true) {
  const [obstructed, setObstructed] = useState(false);
  useLayoutEffect(() => {
    if (!enabled) return;
    const entry = ref.current;
    if (!entry) return;
    const reposition = placement === true;
    const fixed = placement === "fixed";
    let frame = 0;
    let disposed = false;
    let lift = 0;
    let needsCompact = false;
    const check = () => {
      frame = 0;
      if (disposed) return;
      const compact = reposition && (needsCompact || entry.childElementCount > 1 && window.matchMedia("(max-width: 767px)").matches);
      if (entry.hasAttribute("data-compact") !== compact) entry.toggleAttribute("data-compact", compact);
      let box = entry.getBoundingClientRect();
      const cache = new WeakMap<HTMLElement, boolean>();
      const isVisible = (element: HTMLElement) => isVisibleElement(element, cache);

      const actions = fixed ? [] : Array.from(document.querySelectorAll<HTMLElement>(primaryActions))
        .filter((element) => !entry.contains(element) && !element.closest('[aria-disabled="true"]')
          // The contact stack moves down when the dock yields. Treating that
          // companion as a page action would keep the dock hidden forever.
          && (reposition || !element.closest(".fc-contact-stack"))
          && !element.matches(":disabled") && isVisible(element))
        .map((element) => element.getBoundingClientRect());
      const header = document.querySelector<HTMLElement>(".scheme-a-chrome");
      const top = Math.max(16, (header?.getBoundingClientRect().bottom ?? 0) + 12);
      let baseline = unshifted(box, lift);
      let nextLift = reposition ? findLift(baseline, actions, lift, top) : 0;
      // Very short viewports use the same compact row as mobile, for this route.
      if (reposition && nextLift === undefined && !entry.hasAttribute("data-compact")) {
        needsCompact = true;
        entry.setAttribute("data-compact", "");
        box = entry.getBoundingClientRect();
        baseline = unshifted(box, lift);
        nextLift = findLift(baseline, actions, lift, top);
      }
      const next = nextLift ?? Math.max(0, box.top + lift - top);
      if (next !== lift) {
        entry.style.setProperty("--fc-contact-lift", `${next}px`);
        lift = next;
      }
      const placed = unshifted(baseline, -lift);
      // Content-bound entries can still yield or move. Fixed public chrome
      // must not disappear each time an ordinary page action passes it.
      const actionObstructed = !fixed && !reposition && actions.some((bounds) => intersects(box, bounds));
      const priorityOverlap = (bounds: DOMRect) => intersects(baseline, bounds) || intersects(placed, bounds);
      const modalOpen = Array.from(document.querySelectorAll<HTMLElement>(modalContent)).some(isVisible);

      // Radix can remove the panel a frame before its decorative overlay.
      // aria-hidden overlays still receive clicks until that layer is gone.
      const overlayBlocking = Array.from(document.querySelectorAll<HTMLElement>("[data-dialog-overlay]"))
        .some((element) => {
          const bounds = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return bounds.width > 0 && bounds.height > 0 && style.visibility !== "hidden"
            && style.pointerEvents !== "none";
        });

      const recoveryObstructed = Array.from(document.querySelectorAll<HTMLElement>(fixed ? fixedRecoveryContent : recoveryContent))
        .some((element) => priorityOverlap(element.getBoundingClientRect()) && isVisible(element));

      const active = document.activeElement;
      const inputObstructed = active instanceof HTMLElement && !entry.contains(active)
        && (fixed ? isEditingInput(active) : active.matches(focusedInput))
        && (window.matchMedia("(max-width: 767px)").matches || priorityOverlap(active.getBoundingClientRect()))
        && isVisible(active);

      const formContainers = document.querySelectorAll<HTMLElement>(formContainersSelector);
      const formObstructed = !fixed && Array.from(formContainers)
        .filter((form) => priorityOverlap(form.getBoundingClientRect()))
        .flatMap((form) => Array.from(form.querySelectorAll<HTMLElement>(formControls)))
        .some((element) => !entry.contains(element) && !element.closest('[aria-disabled="true"]')
          && !element.matches(":disabled") && priorityOverlap(element.getBoundingClientRect()) && isVisible(element));

      const keyboardOpen = window.visualViewport && window.visualViewport.height < window.innerHeight - 120;
      setObstructed(actionObstructed || modalOpen || overlayBlocking || recoveryObstructed || inputObstructed || formObstructed || Boolean(keyboardOpen));
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
      attributes: true, attributeFilter: ["aria-hidden", "aria-modal", "hidden", "inert", "class", "style", "open", "role", "data-state", "data-interaction-feedback", "disabled", "aria-disabled", "type", "contenteditable"] });
    document.fonts?.ready.then(schedule);
    return () => {
      disposed = true;
      entry.style.removeProperty("--fc-contact-lift");
      entry.removeAttribute("data-compact");
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
  }, [ref, routeKey, placement, enabled]);
  return enabled && obstructed;
}
