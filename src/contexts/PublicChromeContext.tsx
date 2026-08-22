import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

type PublicChromeContextValue = {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  hasImmersiveHero: boolean;
  registerImmersiveHero: (id: symbol) => () => void;
  /** 是否显示移动端底部固定行动栏（非后台且菜单未打开） */
  showMobileActionBar: boolean;
};

type MobileActionBarMode = "hidden" | "scroll-up" | "always";

const MOBILE_SCROLL_TOP_RESET = 24;
const MOBILE_SCROLL_REVEAL_START = 96;
const MOBILE_SCROLL_DIRECTION_TRAVEL = 24;

export const getInitialPublicTheme = (): "dark" => "dark";

const PublicChromeContext = createContext<PublicChromeContextValue | null>(null);

export function PublicChromeProvider({
  isAdminRoute,
  routeKey,
  mobileActionBarMode = "hidden",
  children,
}: {
  isAdminRoute: boolean;
  routeKey: string;
  mobileActionBarMode?: MobileActionBarMode;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileScrollingUp, setMobileScrollingUp] = useState(false);
  const lastMobileScrollY = useRef(0);
  const pendingMobileDirection = useRef<-1 | 0 | 1>(0);
  const pendingMobileTravel = useRef(0);
  const immersiveHeroIds = useRef(new Set<symbol>());
  const [hasImmersiveHero, setHasImmersiveHero] = useState(false);

  const registerImmersiveHero = useCallback((id: symbol) => {
    immersiveHeroIds.current.add(id);
    setHasImmersiveHero(true);

    return () => {
      immersiveHeroIds.current.delete(id);
      setHasImmersiveHero(immersiveHeroIds.current.size > 0);
    };
  }, []);

  useLayoutEffect(() => {
    if (mobileActionBarMode !== "scroll-up") {
      setMobileScrollingUp(false);
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    let scrollFrame = 0;

    const updateScrollDirection = () => {
      scrollFrame = 0;
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastMobileScrollY.current;
      lastMobileScrollY.current = currentScrollY;

      if (currentScrollY <= MOBILE_SCROLL_TOP_RESET) {
        setMobileScrollingUp((current) => current ? false : current);
        pendingMobileDirection.current = 0;
        pendingMobileTravel.current = 0;
        return;
      }

      if (Math.abs(scrollDelta) < 1) return;
      // 手机上手指向上滑时页面内容上移，浏览器的 scrollY 会增加。
      const direction = scrollDelta > 0 ? 1 : -1;
      if (pendingMobileDirection.current !== direction) {
        pendingMobileDirection.current = direction;
        pendingMobileTravel.current = 0;
      }
      pendingMobileTravel.current += Math.abs(scrollDelta);

      if (pendingMobileTravel.current < MOBILE_SCROLL_DIRECTION_TRAVEL) return;
      pendingMobileTravel.current = 0;

      const showActions = direction > 0 && currentScrollY > MOBILE_SCROLL_REVEAL_START;
      setMobileScrollingUp((current) => current === showActions ? current : showActions);
    };

    const scheduleScrollDirection = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(updateScrollDirection);
    };

    const stop = () => {
      window.removeEventListener("scroll", scheduleScrollDirection);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    };

    const start = () => {
      stop();
      lastMobileScrollY.current = window.scrollY;
      pendingMobileDirection.current = 0;
      pendingMobileTravel.current = 0;
      setMobileScrollingUp(false);
      if (!mobileQuery.matches) return;
      window.addEventListener("scroll", scheduleScrollDirection, { passive: true });
    };

    start();
    mobileQuery.addEventListener("change", start);

    return () => {
      mobileQuery.removeEventListener("change", start);
      stop();
    };
  }, [mobileActionBarMode, routeKey]);

  const showMobileActionBar =
    !isAdminRoute
    && !menuOpen
    && (
      mobileActionBarMode === "always"
      || (mobileActionBarMode === "scroll-up" && mobileScrollingUp)
    );

  useLayoutEffect(() => {
    if (isAdminRoute) {
      delete document.documentElement.dataset.publicTheme;
      delete document.documentElement.dataset.theme;
      document.documentElement.style.removeProperty("color-scheme");
      return;
    }

    document.documentElement.dataset.publicTheme = "dark";
    document.documentElement.dataset.theme = "dark";
    // The public selector remains stable for legacy component compatibility,
    // while Scheme A itself uses light form controls and a warm paper canvas.
    document.documentElement.style.colorScheme = "light";

    return () => {
      delete document.documentElement.dataset.publicTheme;
      delete document.documentElement.dataset.theme;
      document.documentElement.style.removeProperty("color-scheme");
    };
  }, [isAdminRoute]);

  useLayoutEffect(() => {
    if (menuOpen) {
      document.documentElement.dataset.menuOpen = "true";
    } else {
      delete document.documentElement.dataset.menuOpen;
    }
    return () => {
      delete document.documentElement.dataset.menuOpen;
    };
  }, [menuOpen]);

  const value = useMemo(
    () => ({
      menuOpen,
      setMenuOpen,
      hasImmersiveHero,
      registerImmersiveHero,
      showMobileActionBar,
    }),
    [hasImmersiveHero, menuOpen, registerImmersiveHero, showMobileActionBar],
  );

  return <PublicChromeContext.Provider value={value}>{children}</PublicChromeContext.Provider>;
}

export function usePublicChrome() {
  const context = useContext(PublicChromeContext);
  if (!context) {
    throw new Error("usePublicChrome must be used within PublicChromeProvider");
  }
  return context;
}
