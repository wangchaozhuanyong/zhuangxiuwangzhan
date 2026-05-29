import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type PublicChromeContextValue = {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  /** 是否显示移动端底部固定行动栏（非后台且菜单未打开） */
  showMobileActionBar: boolean;
};

const PublicChromeContext = createContext<PublicChromeContextValue | null>(null);

export function PublicChromeProvider({
  isAdminRoute,
  children,
}: {
  isAdminRoute: boolean;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const showMobileActionBar = !isAdminRoute && !menuOpen;

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
