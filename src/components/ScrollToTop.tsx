import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import {
  hasBottomNavScrollIntent,
  isFurnitureListingPath,
  consumeFurnitureNavigationScroll,
  getPublicScrollTarget,
  getListingScrollPosition,
} from "@/lib/publicScrollRestoration";
import { scrollWindowToImmediately, scrollWindowToSmoothly } from "@/lib/instantScroll";

const MAX_RESTORE_FRAMES = 120;
// Session-only positions, including detail/back and each filtered listing entry.
const scrollPositions = new Map<string, number>();
const historyPositions = new Map<string, number>();

// Navigation targets use document layout, excluding temporary reveal transforms.
const getDocumentLayoutTop = (target: HTMLElement) => {
  let top = 0;
  let node: HTMLElement | null = target;
  while (node) {
    top += node.offsetTop;
    const parent = node.offsetParent;
    if (!(parent instanceof HTMLElement)) break;
    top += parent.clientTop;
    node = parent;
  }
  return top;
};

const getScrollPositionKey = (pathname: string) => {
  const viewport = window.matchMedia("(max-width: 767px)").matches
    ? "mobile"
    : "desktop";
  return `${viewport}:${pathname}`;
};

const restoreScrollPosition = (savedPosition: number) => {
  const targetPosition = Math.max(0, Math.round(savedPosition));
  let animationFrame = 0;
  let attempts = 0;
  let cancelled = false;

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("pointerdown", cancel);
    window.removeEventListener("keydown", cancel);
  };

  // 懒加载内容可能稍后撑高页面，短暂重试直到目标位置可达。
  const applyPosition = () => {
    if (cancelled) return;

    animationFrame = 0;
    attempts += 1;
    const maximumPosition = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    scrollWindowToImmediately(Math.min(targetPosition, maximumPosition));

    const pageCanReachTarget = maximumPosition >= targetPosition - 1;
    if (targetPosition === 0 || (pageCanReachTarget && attempts >= 2) || attempts >= MAX_RESTORE_FRAMES) {
      cancel();
      return;
    }

    animationFrame = window.requestAnimationFrame(applyPosition);
  };

  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("pointerdown", cancel, { passive: true });
  window.addEventListener("keydown", cancel);
  applyPosition();

  return cancel;
};

const ScrollToTop = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const previousRouteRef = useRef<typeof location | null>(null);
  const routeContextRef = useRef({ location, navigationType });
  routeContextRef.current = { location, navigationType };

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;

    const previousBehavior = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previousBehavior;
    };
  }, []);

  useLayoutEffect(() => {
    const routeContext = routeContextRef.current;
    document.documentElement.dataset.navigationType = routeContext.navigationType.toLowerCase();
    const { pathname, search, hash, key, state } = routeContext.location;
    const previous = previousRouteRef.current;
    previousRouteRef.current = routeContext.location;
    const isAdmin = pathname.startsWith("/admin");
    if (isAdmin && previous?.pathname === pathname) return;
    const furniturePosition = consumeFurnitureNavigationScroll(pathname);
    const positionKey = getScrollPositionKey(pathname + search);
    const isPop = routeContext.navigationType === "POP";
    const listingPosition = getListingScrollPosition(state);
    const shouldRestore = !isAdmin && (isPop || hasBottomNavScrollIntent(state) || listingPosition !== null);
    const savedPosition = isPop ? historyPositions.get(key) : listingPosition ?? scrollPositions.get(positionKey);
    const targetPosition = furniturePosition ?? (shouldRestore ? savedPosition ?? 0
      : previous?.pathname === pathname ? historyPositions.get(previous.key) ?? 0 : 0);
    let lastScroll = window.scrollY;
    let cancelRestoration = () => {};
    let interrupted = false;
    const record = () => { lastScroll = window.scrollY; };
    const interrupt = () => { interrupted = true; cancelRestoration(); };
    const restore = (smooth = false) => {
      if (interrupted) return;
      cancelRestoration();
      const results = document.querySelector<HTMLElement>("#main-content [data-public-results]");
      const paginationTarget = !shouldRestore && furniturePosition === null && search && isFurnitureListingPath(pathname) && results
        ? results.getBoundingClientRect().top + window.scrollY - 90 : undefined;
      let anchor: HTMLElement | null = null;
      try {
        const targetId = !isPop ? getPublicScrollTarget(state) : null;
        const fragmentId = hash ? decodeURIComponent(hash.slice(1)) : null;
        // POP restores the actual reading position, even when the entry has a fragment.
        if (!isPop || savedPosition === undefined) anchor = document.getElementById(targetId || fragmentId || "");
      } catch { /* Ignore malformed fragments. */ }
      const header = document.querySelector<HTMLElement>(".scheme-a-chrome");
      const offset = (header?.getBoundingClientRect().height ?? 70) + 20;
      const anchorTarget = anchor ? getDocumentLayoutTop(anchor) - offset : undefined;
      const position = anchorTarget ?? paginationTarget ?? targetPosition;
      cancelRestoration = smooth && anchor ? scrollWindowToSmoothly(position) : restoreScrollPosition(position);
      if (anchor) {
        const labelId = anchor.getAttribute("aria-labelledby")?.split(" ")[0];
        (labelId ? document.getElementById(labelId) : anchor)?.focus({ preventScroll: true });
      }
      record();
    };
    const restoreLayout = () => restore();
    // The shared readiness owner emits this after the destination layout exists,
    // before deciding which images intersect the restored viewport.
    window.addEventListener("public-route-layout", restoreLayout);
    // Destination content is inert during preparation; focus it once the gate unlocks.
    window.addEventListener("public-route-ready", restoreLayout);
    window.addEventListener("scroll", record, { passive: true });
    // A later readiness event must not undo a user's wheel, touch, or keyboard action.
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("pointerdown", interrupt, { passive: true });
    window.addEventListener("keydown", interrupt);
    const samePage = previous?.pathname === pathname && previous.search === search;
    restore(!isPop && samePage && !!(hash || getPublicScrollTarget(state)));
    return () => {
      cancelRestoration();
      window.removeEventListener("public-route-layout", restoreLayout);
      window.removeEventListener("public-route-ready", restoreLayout);
      window.removeEventListener("scroll", record);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("pointerdown", interrupt);
      window.removeEventListener("keydown", interrupt);
      if (!isAdmin) {
        historyPositions.set(key, Math.max(0, lastScroll));
        scrollPositions.set(positionKey, Math.max(0, lastScroll));
      }
    };
  }, [location.pathname, location.search, location.hash, location.key]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    const handleAnchor = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      if (link.getAttribute("aria-haspopup") === "dialog") return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash || url.hash === "#main-content") return;
      let target: HTMLElement | null;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
      if (!target) return;
      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    };
    // React handlers get first refusal (dialogs, form focus actions, and Router links).
    document.addEventListener("click", handleAnchor);
    return () => document.removeEventListener("click", handleAnchor);
  }, [location.pathname, location.search, navigate]);

  return null;
};

export default ScrollToTop;
