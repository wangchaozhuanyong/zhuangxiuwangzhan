import { useLayoutEffect, useState, type RefObject } from "react";
import { QUOTE_FORM_ID } from "@/lib/quoteFormTarget";

const modalContent = '[role="dialog"][aria-modal="true"],[role="alertdialog"][aria-modal="true"],dialog[open]';
const recoveryContent = '[data-interaction-feedback],.public-route-feedback__recovery,.public-update-notice,.smart-image-failure';
const focusedInput = 'input:not([type="hidden"]):not(:disabled),textarea:not(:disabled),select:not(:disabled),[role="textbox"],[contenteditable]:not([contenteditable="false"])';
const formControls = `${focusedInput},button:not(:disabled),a[href],[role="button"]`;
const formContainersSelector = `#${QUOTE_FORM_ID},.fc-route-contact-form form`;
// Radix also marks visible triggers as closed; only closed content hides its descendants.
const closedPanel = '[data-state="closed"]:not(:is(button,a[href],[role="button"],input,select,textarea))';
const primaryActions = '.scheme-a-public-shell :is(button,[role="button"],[data-ui="button"],'
  + 'a[class*="button"],a.public-contact-row,input[type="submit"],input[type="button"],a[href^="https://wa.me/"],'
  + 'a[href^="tel:"],a[href*="/quote"],a[href="#landing-quote"]),'
  + ':is(.scheme-a-actions,.actions,[class*="__actions"],[class*="-actions"],.fc-route-action-panel,.fc-furniture-pagination) a[href]';

const intersects = (left: DOMRect, right: DOMRect) => left.width > 0 && left.height > 0
  && right.width > 0 && right.height > 0 && left.left < right.right && left.right > right.left
  && left.top < right.bottom && left.bottom > right.top;

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

/** Keep the promotion stable during reading. Active dialogs, recovery actions,
 * focused inputs and overlapping primary controls take priority over this entry. */
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
      const cache = new WeakMap<HTMLElement, boolean>();
      const isVisible = (element: HTMLElement) => isVisibleElement(element, cache);

      const purchaseActionsVisible = Array.from(
        document.querySelectorAll<HTMLElement>(".fc-furniture-detail__actions"),
      ).some(isVisible);
      const actionObstructed = Array.from(document.querySelectorAll<HTMLElement>(primaryActions))
        .some((element) => !entry.contains(element) && !element.closest('[aria-disabled="true"]')
          && !element.matches(":disabled") && intersects(box, element.getBoundingClientRect()) && isVisible(element));
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

      const recoveryObstructed = Array.from(document.querySelectorAll<HTMLElement>(recoveryContent))
        .some((element) => intersects(box, element.getBoundingClientRect()) && isVisible(element));

      const active = document.activeElement;
      const inputObstructed = active instanceof HTMLElement && !entry.contains(active)
        && active.matches(focusedInput)
        && (window.matchMedia("(max-width: 767px)").matches || intersects(box, active.getBoundingClientRect()))
        && isVisible(active);

      const formContainers = document.querySelectorAll<HTMLElement>(formContainersSelector);
      const formObstructed = Array.from(formContainers)
        .filter((form) => intersects(box, form.getBoundingClientRect()))
        .flatMap((form) => Array.from(form.querySelectorAll<HTMLElement>(formControls)))
        .some((element) => !entry.contains(element) && !element.closest('[aria-disabled="true"]')
          && !element.matches(":disabled") && intersects(box, element.getBoundingClientRect()) && isVisible(element));

      const keyboardOpen = window.visualViewport && window.visualViewport.height < window.innerHeight - 120;
      setObstructed(purchaseActionsVisible || actionObstructed || modalOpen || overlayBlocking || recoveryObstructed || inputObstructed || formObstructed || Boolean(keyboardOpen));
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
