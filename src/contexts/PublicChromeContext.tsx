import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

type PublicChromeContextValue = {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  /** 是否显示移动端底部固定行动栏（非后台且菜单未打开） */
  showMobileActionBar: boolean;
};

const PublicChromeContext = createContext<PublicChromeContextValue | null>(null);

export function PublicChromeProvider({
  isAdminRoute,
  isHomeRoute,
  suppressMobileActionBar = false,
  children,
}: {
  isAdminRoute: boolean;
  isHomeRoute: boolean;
  suppressMobileActionBar?: boolean;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [homeHeroPassed, setHomeHeroPassed] = useState(false);

  useLayoutEffect(() => {
    if (!isHomeRoute) {
      setHomeHeroPassed(false);
      return;
    }

    const updateHomeHeroPassed = () => {
      const hero = document.querySelector<HTMLElement>(".home-hero-section");
      const heroTop = hero ? hero.getBoundingClientRect().top + window.scrollY : 0;
      const heroHeight = hero?.offsetHeight || window.innerHeight;
      const triggerY = heroTop + heroHeight * 0.76;

      setHomeHeroPassed(window.scrollY >= triggerY);
    };

    updateHomeHeroPassed();
    const frame = window.requestAnimationFrame(updateHomeHeroPassed);

    window.addEventListener("scroll", updateHomeHeroPassed, { passive: true });
    window.addEventListener("resize", updateHomeHeroPassed);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateHomeHeroPassed);
      window.removeEventListener("resize", updateHomeHeroPassed);
    };
  }, [isHomeRoute]);

  const showMobileActionBar = !isAdminRoute && !suppressMobileActionBar && !menuOpen && (!isHomeRoute || homeHeroPassed);

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
      showMobileActionBar,
    }),
    [menuOpen, showMobileActionBar],
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
