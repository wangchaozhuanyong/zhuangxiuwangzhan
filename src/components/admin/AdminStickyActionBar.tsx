import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
import { adminMobileText } from "@/i18n/adminMobileText";
import { getAdminLang } from "@/lib/adminLocale";
import { cn } from "@/lib/utils";

export default function AdminStickyActionBar({
  left,
  right,
  more,
  mobileSticky = false,
  className,
}: {
  left?: ReactNode;
  right?: ReactNode;
  more?: ReactNode;
  mobileSticky?: boolean;
  className?: string;
}) {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const marker = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const floating = mobileSticky && mobile;
  const [keyboardPaused, setKeyboardPaused] = useState(false);
  const keyboardPausedRef = useRef(false);
  const text = adminMobileText[getAdminLang()];

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const change = () => setMobile(query.matches);
    change();
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);

  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    if (!floating || !viewport) {
      keyboardPausedRef.current = false;
      setKeyboardPaused(false);
      return;
    }
    const shell = marker.current?.closest<HTMLElement>("[data-admin-shell]");
    let baselineWidth = window.innerWidth;
    let baselineHeight = viewport.height;
    let paused = false;
    let rotatedKeyboardHeight: number | null = null;
    const hasEditableFocus = () => {
      const field = document.activeElement;
      return field instanceof HTMLElement && shell?.contains(field) && field.matches("textarea:not(:disabled):not([readonly]), input:not(:disabled):not([readonly]):not([type='button']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='file']):not([type='hidden']):not([type='submit']):not([type='reset']):not([type='color']), [contenteditable='true']");
    };
    const update = () => {
      // Pinch zoom also shrinks visualViewport, but does not open a keyboard.
      if (Math.abs(viewport.scale - 1) > 0.02) return;
      if (Math.abs(window.innerWidth - baselineWidth) > 20) {
        baselineWidth = window.innerWidth;
        baselineHeight = Math.max(viewport.height, window.innerHeight);
        // With an open IME the new orientation has no confirmed full height yet.
        // Keep ordinary flow until the viewport expands again.
        rotatedKeyboardHeight = paused ? viewport.height : null;
        return;
      }
      const threshold = Math.max(120, baselineHeight * 0.2);
      if (paused) {
        const restored = rotatedKeyboardHeight === null
          ? viewport.height >= baselineHeight - threshold / 2
          : viewport.height >= rotatedKeyboardHeight + 120;
        if (restored) {
          paused = false;
          keyboardPausedRef.current = false;
          rotatedKeyboardHeight = null;
          baselineHeight = viewport.height;
          setKeyboardPaused(false);
        }
      } else if (hasEditableFocus() && baselineHeight - viewport.height >= threshold) {
        paused = true;
        // Other resize listeners run before React commits the new class.
        // Stop their manual scrolling in this same viewport event.
        keyboardPausedRef.current = true;
        setKeyboardPaused(true);
      } else if (!hasEditableFocus()) {
        baselineHeight = viewport.height;
      }
    };
    // Preserve the pre-focus height; Android may resize innerHeight along with IME.
    viewport.addEventListener("resize", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    return () => {
      viewport.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
    };
  }, [floating]);

  useLayoutEffect(() => {
    if (!floating || !bar.current) return;
    const shell = marker.current?.closest<HTMLElement>("[data-admin-shell]");
    const node = bar.current;
    const viewport = window.visualViewport;
    const measure = () => {
      if (keyboardPausedRef.current) {
        shell?.style.removeProperty("--admin-mobile-action-height");
        node.style.bottom = "";
        return;
      }
      shell?.style.setProperty("--admin-mobile-action-height", `${node.getBoundingClientRect().height}px`);
      // Portaling avoids the route transition's transform containing a fixed bar.
      node.style.bottom = `${viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0}px`;
    };
    const revealFocusedField = () => {
      measure();
      if (keyboardPausedRef.current) return;
      const field = document.activeElement;
      if (!(field instanceof HTMLElement) || !shell?.contains(field) || !field.matches("input, textarea, select, [contenteditable='true']")) return;
      const fieldRect = field.getBoundingClientRect();
      const visibleTop = (viewport?.offsetTop ?? 0) + 72;
      const visibleBottom = node.getBoundingClientRect().top - 12;
      // A tall editor cannot fit above the keyboard. Let native caret scrolling
      // handle it instead of moving its first lines behind the page header.
      if (fieldRect.height > visibleBottom - visibleTop) return;
      const overlap = fieldRect.bottom - visibleBottom;
      const scroll = Math.min(overlap, Math.max(0, fieldRect.top - visibleTop));
      if (scroll > 0) window.scrollBy({ top: scroll, behavior: "instant" });
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : undefined;
    observer?.observe(node);
    viewport?.addEventListener("resize", revealFocusedField);
    viewport?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    document.addEventListener("focusin", revealFocusedField);
    return () => {
      observer?.disconnect();
      shell?.style.removeProperty("--admin-mobile-action-height");
      viewport?.removeEventListener("resize", revealFocusedField);
      viewport?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      document.removeEventListener("focusin", revealFocusedField);
    };
  }, [floating, keyboardPaused]);

  const actions = (
    <div ref={bar} data-admin-mobile-bar={floating || undefined} data-admin-keyboard-paused={floating && keyboardPaused || undefined} role="group" aria-label={text.actions}
      className={floating ? cn("border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]", keyboardPaused ? "relative" : "fixed inset-x-0 bottom-0 z-30 shadow-lg") : "flex min-w-0 flex-wrap items-center gap-2"}>
      <div className={floating ? "mx-auto grid max-w-xl auto-cols-fr grid-flow-col items-stretch gap-3 [&_button]:h-full [&_button]:min-h-12 [&_button]:w-full [&_button]:whitespace-normal [&_a]:min-h-12 [&_a]:w-full [&_a]:whitespace-normal" : "flex flex-wrap items-center gap-2 [&_a]:min-h-11 [&_button]:min-h-11"}>{right}</div>
    </div>
  );
  return (
    <div ref={marker} data-admin-sticky-mobile={mobileSticky || undefined} className={cn(floating ? "relative mb-4" : "sticky top-16 z-30 -mx-4 mb-5 border-b border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:top-[72px] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8", className)}>
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">{left}</div>
          {floating && more && <AdminActionMenu>{more}</AdminActionMenu>}
        </div>
        {floating ? createPortal(actions, document.body) : <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}{more && <AdminActionMenu>{more}</AdminActionMenu>}</div>}
      </div>
    </div>
  );
}
