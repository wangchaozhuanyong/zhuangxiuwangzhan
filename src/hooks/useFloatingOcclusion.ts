import { useLayoutEffect, useState, type RefObject } from "react";

const protectedContent = ':is(#main-content,.scheme-a-public-shell) :is(p,h1,h2,h3,h4,h5,h6,li,dt,dd,pre,blockquote,td,th,summary,figcaption,label,button,a,input,select,textarea,[role="button"],[role="textbox"],[contenteditable="true"]),[role="dialog"],[data-interaction-feedback],.public-update-notice';

/** Floating promotions yield to readable text and controls on every route.
 * Keep their geometry while hidden so scrolling can restore them without
 * shrinking page content or maintaining a list of route exceptions. */
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
      // A focused action remains available until the user finishes with it.
      if (entry.contains(document.activeElement)) { setObstructed(false); return; }
      const box = entry.getBoundingClientRect();
      const collision = box.width > 0 && box.height > 0 && Array.from(document.querySelectorAll<HTMLElement>(protectedContent)).some(element => {
        if (entry.contains(element) || element.closest('[aria-hidden="true"], [hidden]')) return false;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || rect.left >= box.right || rect.right <= box.left || rect.top >= box.bottom || rect.bottom <= box.top) return false;
        const style = getComputedStyle(element);
        return style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
      });
      setObstructed(collision);
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
    const main = document.getElementById("main-content");
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (main) resize?.observe(main);
    resize?.observe(entry);
    const changes = new MutationObserver(schedule);
    changes.observe(document.body, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ["aria-hidden", "hidden", "class", "style", "open"] });
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
      resize?.disconnect();
      changes.disconnect();
    };
  }, [ref, routeKey]);
  return obstructed;
}
