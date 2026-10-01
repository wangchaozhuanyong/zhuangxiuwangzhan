import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import {
  hasBottomNavScrollIntent,
  isFurnitureListingPath,
  consumeFurnitureNavigationScroll,
} from "@/lib/publicScrollRestoration";
import { scrollWindowToImmediately, scrollWindowToSmoothly } from "@/lib/instantScroll";

const MAX_RESTORE_FRAMES = 120;
// Session-only positions, including detail/back and each filtered listing entry.
const scrollPositions = new Map<string, number>();
const historyPositions = new Map<string, number>();

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
    const { pathname, search, key } = routeContext.location;
    const previous = previousRouteRef.current;
    previousRouteRef.current = routeContext.location;
    const isAdmin = pathname.startsWith("/admin");
    if (isAdmin && previous?.pathname === pathname) return;
    const furniturePosition = consumeFurnitureNavigationScroll(pathname);
    const positionKey = getScrollPositionKey(pathname + search);
    const shouldRestore = !isAdmin && (routeContext.navigationType === "POP" || hasBottomNavScrollIntent(routeContext.location.state));
    const savedPosition = routeContext.navigationType === "POP" ? historyPositions.get(key) : scrollPositions.get(positionKey);
    const targetPosition = furniturePosition ?? (shouldRestore ? savedPosition ?? 0
      : previous?.pathname === pathname ? historyPositions.get(previous.key) ?? 0 : 0);
    let lastScroll = window.scrollY;
    let cancelRestoration = () => {};
    const record = () => { lastScroll = window.scrollY; };
    const restore = () => {
      cancelRestoration();
      const results = document.querySelector<HTMLElement>("[data-public-results]");
      const paginationTarget = !shouldRestore && search && isFurnitureListingPath(pathname) && results
        ? results.getBoundingClientRect().top + window.scrollY - 90 : undefined;
      let anchor: HTMLElement | null = null;
      try { anchor = routeContext.location.hash ? document.getElementById(decodeURIComponent(routeContext.location.hash.slice(1))) : null; } catch { /* Ignore malformed fragments. */ }
      const anchorTarget = anchor ? anchor.getBoundingClientRect().top + window.scrollY - 90 : undefined;
      cancelRestoration = restoreScrollPosition(anchorTarget ?? paginationTarget ?? targetPosition);
      record();
    };
    // The shared readiness owner emits this after the destination layout exists,
    // before deciding which images intersect the restored viewport.
    window.addEventListener("public-route-layout", restore);
    window.addEventListener("scroll", record, { passive: true });
    restore();
    return () => {
      cancelRestoration();
      window.removeEventListener("public-route-layout", restore);
      window.removeEventListener("scroll", record);
      if (!isAdmin) {
        historyPositions.set(key, Math.max(0, lastScroll));
        scrollPositions.set(positionKey, Math.max(0, lastScroll));
      }
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    const handleAnchor = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash || url.hash === "#main-content") return;
      let target: HTMLElement | null;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
      if (!target) return;
      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
      scrollWindowToSmoothly(target.getBoundingClientRect().top + window.scrollY - 90);
      target.focus({ preventScroll: true });
    };
    document.addEventListener("click", handleAnchor, true);
    return () => document.removeEventListener("click", handleAnchor, true);
  }, [location.pathname, location.search, navigate]);

  return null;
};

export default ScrollToTop;
