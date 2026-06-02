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
  const [subpageHeroPassed, setSubpageHeroPassed] = useState(false);

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

  useLayoutEffect(() => {
    if (isAdminRoute || isHomeRoute || suppressMobileActionBar) {
      setSubpageHeroPassed(false);
      return;
    }

    const updateSubpageHeroPassed = () => {
      const hero = document.querySelector<HTMLElement>(".page-hero");
      const fallbackTriggerY = Math.min(window.innerHeight * 0.45, 320);
      const heroTop = hero ? hero.getBoundingClientRect().top + window.scrollY : 0;
      const heroHeight = hero?.offsetHeight || fallbackTriggerY;
      const triggerY = hero ? heroTop + heroHeight * 0.82 : fallbackTriggerY;

      setSubpageHeroPassed(window.scrollY >= triggerY);
    };

    updateSubpageHeroPassed();
    const frame = window.requestAnimationFrame(updateSubpageHeroPassed);

    window.addEventListener("scroll", updateSubpageHeroPassed, { passive: true });
    window.addEventListener("resize", updateSubpageHeroPassed);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateSubpageHeroPassed);
      window.removeEventListener("resize", updateSubpageHeroPassed);
    };
  }, [isAdminRoute, isHomeRoute, suppressMobileActionBar]);

  const showMobileActionBar =
    !isAdminRoute && !suppressMobileActionBar && !menuOpen && (isHomeRoute ? homeHeroPassed : subpageHeroPassed);

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
