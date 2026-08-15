import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

type PublicChromeContextValue = {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  hasImmersiveHero: boolean;
  registerImmersiveHero: (id: symbol) => () => void;
  /** 是否显示移动端底部固定行动栏（非后台且菜单未打开） */
  showMobileActionBar: boolean;
};

type MobileActionBarMode = "hidden" | "scroll-up" | "always";

const PUBLIC_THEME_STORAGE_KEY = "flashcast-public-theme";

export const getInitialPublicTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "dark";
  try {
    const storedTheme = window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  } catch {
    // 浏览器禁止本地存储时，继续使用默认深色主题。
  }
  return "dark";
};

const PublicChromeContext = createContext<PublicChromeContextValue | null>(null);

export function PublicChromeProvider({
  isAdminRoute,
  isHomeRoute,
  mobileActionBarMode = "hidden",
  children,
}: {
  isAdminRoute: boolean;
  isHomeRoute: boolean;
  mobileActionBarMode?: MobileActionBarMode;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialPublicTheme);
  const [homeHeroPassed, setHomeHeroPassed] = useState(false);
  const [mobileScrollingUp, setMobileScrollingUp] = useState(false);
  const lastMobileScrollY = useRef(0);
  const homeHeroPassedRef = useRef(false);
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
      homeHeroPassedRef.current = false;
      setHomeHeroPassed(false);
      setMobileScrollingUp(false);
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    let heroObserver: IntersectionObserver | null = null;
    let heroMountObserver: MutationObserver | null = null;
    let scrollFrame = 0;

    const setHeroPassed = (passed: boolean) => {
      homeHeroPassedRef.current = passed;
      setHomeHeroPassed((current) => current === passed ? current : passed);
      if (!passed) {
        setMobileScrollingUp((current) => current ? false : current);
      }
    };

    const updateScrollDirection = () => {
      scrollFrame = 0;
      const currentScrollY = window.scrollY;

      if (isHomeRoute && !heroObserver) {
        const hero = document.querySelector<HTMLElement>("[data-immersive-hero='true'], .forest-home-hero");
        if (hero) {
          const rect = hero.getBoundingClientRect();
          const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
          const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;
          setHeroPassed(rect.top < 0 && visibleRatio <= 0.24);
        }
      }

      const canReveal = isHomeRoute ? homeHeroPassedRef.current : currentScrollY > 96;
      if (!canReveal || currentScrollY <= 24) {
        setMobileScrollingUp((current) => current ? false : current);
        lastMobileScrollY.current = currentScrollY;
        return;
      }

      const scrollDelta = currentScrollY - lastMobileScrollY.current;
      if (Math.abs(scrollDelta) < 8) return;
      // 手机上手指向上滑时页面内容上移，浏览器的 scrollY 会增加。
      const contentMovingUp = scrollDelta > 0;
      setMobileScrollingUp((current) => current === contentMovingUp ? current : contentMovingUp);
      lastMobileScrollY.current = currentScrollY;
    };

    const scheduleScrollDirection = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(updateScrollDirection);
    };

    const stop = () => {
      heroObserver?.disconnect();
      heroObserver = null;
      heroMountObserver?.disconnect();
      heroMountObserver = null;
      window.removeEventListener("scroll", scheduleScrollDirection);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    };

    const observeHero = () => {
      if (heroObserver) return true;
      const hero = document.querySelector<HTMLElement>("[data-immersive-hero='true'], .forest-home-hero");
      if (!hero) return false;

      if ("IntersectionObserver" in window) {
        heroObserver = new IntersectionObserver(([entry]) => {
          if (!entry) return;
          setHeroPassed(entry.boundingClientRect.top < 0 && entry.intersectionRatio <= 0.24);
        }, { threshold: [0, 0.24, 1] });
        heroObserver.observe(hero);
      } else {
        const rect = hero.getBoundingClientRect();
        setHeroPassed(rect.top < 0 && rect.bottom <= rect.height * 0.24);
      }
      return true;
    };

    const start = () => {
      stop();
      lastMobileScrollY.current = window.scrollY;
      setMobileScrollingUp(false);
      if (!mobileQuery.matches) {
        setHeroPassed(false);
        return;
      }

      if (isHomeRoute && !observeHero() && "MutationObserver" in window) {
        heroMountObserver = new MutationObserver(() => {
          if (!observeHero()) return;
          heroMountObserver?.disconnect();
          heroMountObserver = null;
        });
        heroMountObserver.observe(document.getElementById("root") || document.body, {
          childList: true,
          subtree: true,
        });
      } else if (!isHomeRoute) {
        setHeroPassed(false);
      }
      window.addEventListener("scroll", scheduleScrollDirection, { passive: true });
    };

    start();
    mobileQuery.addEventListener("change", start);

    return () => {
      mobileQuery.removeEventListener("change", start);
      stop();
    };
  }, [isHomeRoute, mobileActionBarMode]);

  const showMobileActionBar =
    !isAdminRoute
    && !menuOpen
    && (
      mobileActionBarMode === "always"
      || (mobileActionBarMode === "scroll-up" && mobileScrollingUp && (!isHomeRoute || homeHeroPassed))
    );

  useLayoutEffect(() => {
    if (isAdminRoute) {
      delete document.documentElement.dataset.publicTheme;
      delete document.documentElement.dataset.theme;
      document.documentElement.style.removeProperty("color-scheme");
      return;
    }

    document.documentElement.dataset.publicTheme = theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, theme);
    } catch {
      // 存储不可用不应影响主题切换本身。
    }

    return () => {
      delete document.documentElement.dataset.publicTheme;
      delete document.documentElement.dataset.theme;
      document.documentElement.style.removeProperty("color-scheme");
    };
  }, [isAdminRoute, theme]);

  useEffect(() => {
    if (menuOpen) {
      document.documentElement.dataset.menuOpen = "true";
    } else {
      delete document.documentElement.dataset.menuOpen;
    }
    return () => {
      delete document.documentElement.dataset.menuOpen;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (showMobileActionBar) {
      document.documentElement.dataset.mobileActionBar = "true";
    } else {
      delete document.documentElement.dataset.mobileActionBar;
    }
    return () => {
      delete document.documentElement.dataset.mobileActionBar;
    };
  }, [showMobileActionBar]);

  const value = useMemo(
    () => ({
      menuOpen,
      setMenuOpen,
      theme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      hasImmersiveHero,
      registerImmersiveHero,
      showMobileActionBar,
    }),
    [hasImmersiveHero, menuOpen, registerImmersiveHero, showMobileActionBar, theme],
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
