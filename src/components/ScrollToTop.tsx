import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import {
  hasBottomNavScrollIntent,
  isBottomNavPath,
} from "@/lib/publicScrollRestoration";
import { scrollWindowToImmediately } from "@/lib/instantScroll";

const MAX_RESTORE_FRAMES = 120;
// 页面刷新后从顶部开始，只在当前 SPA 会话内保留五个标签页的位置。
const scrollPositions = new Map<string, number>();

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
  const navigationType = useNavigationType();
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
    const pathname = routeContext.location.pathname;
    const isRestorableRoute = isBottomNavPath(pathname);
    const positionKey = getScrollPositionKey(pathname);
    const shouldRestore = isRestorableRoute
      && (
        routeContext.navigationType === "POP"
        || hasBottomNavScrollIntent(routeContext.location.state)
      );
    const targetPosition = shouldRestore
      ? scrollPositions.get(positionKey) ?? 0
      : 0;
    const cancelRestoration = restoreScrollPosition(targetPosition);

    return () => {
      cancelRestoration();
      if (isRestorableRoute) {
        scrollPositions.set(positionKey, Math.max(0, window.scrollY));
      }
    };
  }, [location.pathname]);

  return null;
};

export default ScrollToTop;
