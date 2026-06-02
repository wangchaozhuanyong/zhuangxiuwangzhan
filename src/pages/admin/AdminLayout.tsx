import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import AdminConfirmProvider from "@/components/admin/AdminConfirmProvider";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import SmartImage from "@/components/SmartImage";
import { supabase } from "@/lib/supabase";
import {
  adminPublicSitePath,
  applyAdminTheme,
  clearAdminTheme,
  getAdminLang,
  getAdminTheme,
  setAdminLang,
  setAdminTheme,
  type AdminLang,
  type AdminTheme,
} from "@/lib/adminLocale";
import { useAdminDefaultContentSeed } from "@/lib/adminDefaultContent";
import {
  ADMIN_BUILD_VERSION,
  ADMIN_ENTRY_RE,
  ADMIN_TITLE_SUFFIX,
  BUILD_CHECK_INTERVAL_MS,
  NAV_COLLAPSED_KEY,
  NAV_EXPANDED_KEY,
  copy,
  ensureAdminFormAccessibility,
  getAdminActiveNavHelp,
  getCurrentAdminEntry,
  isAdminNavItemActive,
  navGroups,
  readExpandedGroups,
  readNavCollapsed,
  type AdminCopy,
  type NavItem,
} from "@/lib/adminLayoutConfig";
import { canAdminRoleAccess } from "@/lib/adminRoleAccess";
import { addCacheBuster, fallbackSiteSettings, fetchSiteSettings } from "@/lib/siteSettingsApi";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";

const ControlButton = ({
  active,
  children,
  onClick,
  label,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    aria-pressed={active}
    aria-label={label}
    onClick={onClick}
    className={cn(
      "h-10 min-w-10 rounded-full px-3 text-xs font-semibold transition-colors",
      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground",
    )}
  >
    {children}
  </button>
);

const AdminLayout = () => {
  const location = useLocation();
  const { role } = useAdminAuth();
  const [adminLang, setAdminLangState] = useState<AdminLang>(() => getAdminLang());
  const [theme, setTheme] = useState<AdminTheme>(() => getAdminTheme());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(() => readNavCollapsed());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => readExpandedGroups());
  const [adminBrandIconFailed, setAdminBrandIconFailed] = useState(false);
  const seedSummary = useAdminDefaultContentSeed({ enabled: location.pathname === "/admin/dashboard" });
  const lastBuildCheckAtRef = useRef(0);
  const pendingAdminLangRef = useRef(adminLang);
  const t = copy[adminLang];
  const { data: adminSiteSettings = fallbackSiteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000,
    placeholderData: fallbackSiteSettings,
  });
  const adminBrandIconSrc = addCacheBuster(
    adminSiteSettings.favicon_url || adminSiteSettings.logo_url || "",
    adminSiteSettings.updated_at,
  );

  useEffect(() => {
    setAdminBrandIconFailed(false);
  }, [adminBrandIconSrc]);

  useEffect(() => {
    let cancelled = false;

    const checkFreshBuild = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastBuildCheckAtRef.current < BUILD_CHECK_INTERVAL_MS) return;
      lastBuildCheckAtRef.current = now;

      try {
        const response = await fetch(`/admin?version_check=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const html = await response.text();
        const latestEntry = html.match(ADMIN_ENTRY_RE)?.[0] || "";
        const currentEntry = getCurrentAdminEntry();

        if (!cancelled && latestEntry && currentEntry && latestEntry !== currentEntry) {
          window.location.reload();
        }
      } catch {
        // Keep the admin usable if the lightweight version check fails.
      }
    };

    void checkFreshBuild(true);
    const onFocus = () => {
      if (document.visibilityState === "hidden") return;
      void checkFreshBuild();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const copyText = useMemo(
    () => (key: keyof AdminCopy) => {
      const value = t[key];
      return typeof value === "string" ? value : String(key);
    },
    [t],
  );

  const visibleNavGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => canAdminRoleAccess(role, item.allowedRoles)),
        }))
        .filter((group) => group.items.length > 0),
    [role],
  );

  const activeGroupKeys = useMemo(
    () =>
      visibleNavGroups
        .filter((group) => group.items.some((item) => item.path.split("#")[0] === location.pathname))
        .map((group) => group.key),
    [location.pathname, visibleNavGroups],
  );

  useLayoutEffect(() => {
    applyAdminTheme(theme, adminLang);
    setAdminTheme(theme);
  }, [theme, adminLang]);

  useEffect(() => {
    return () => clearAdminTheme();
  }, []);

  useEffect(() => {
    if (!activeGroupKeys.length) return;
    setExpandedGroups({ [activeGroupKeys[0]]: true });
  }, [activeGroupKeys]);

  useEffect(() => {
    const keys = Object.entries(expandedGroups)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);
    try {
      window.localStorage.setItem(NAV_EXPANDED_KEY, JSON.stringify(keys));
    } catch {
      // Keep the admin usable in browser modes that block localStorage writes.
    }
  }, [expandedGroups]);

  useEffect(() => {
    try {
      window.localStorage.setItem(NAV_COLLAPSED_KEY, navCollapsed ? "1" : "0");
    } catch {
      // Navigation state is optional; a storage failure should not break language switching.
    }
  }, [navCollapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash]);

  const activeNavLabel = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isAdminNavItemActive(item.path, location.pathname, location.hash)) return copyText(item.key);
      }
    }
    return copyText("title");
  }, [copyText, location.hash, location.pathname]);

  const activeNavKey = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isAdminNavItemActive(item.path, location.pathname, location.hash)) return item.key;
      }
    }
    return "dashboard" as const;
  }, [location.hash, location.pathname]);

  useEffect(() => {
    document.title = `${activeNavLabel} | ${ADMIN_TITLE_SUFFIX}`;
  }, [activeNavLabel]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    const browserWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const clearScheduledScan = () => {
      if (idleId !== null) {
        browserWindow.cancelIdleCallback?.(idleId);
        idleId = null;
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const scheduleAccessibilityScan = (force = false) => {
      if (cancelled || idleId !== null || timeoutId !== null) return;
      const run = () => {
        idleId = null;
        timeoutId = null;
        if (!cancelled) ensureAdminFormAccessibility(main, force);
      };

      if (browserWindow.requestIdleCallback) {
        idleId = browserWindow.requestIdleCallback(run, { timeout: 900 });
        return;
      }

      timeoutId = window.setTimeout(run, 120);
    };

    scheduleAccessibilityScan(true);
    const observer = new MutationObserver(() => scheduleAccessibilityScan(false));
    observer.observe(main, { childList: true, subtree: true });
    return () => {
      cancelled = true;
      clearScheduledScan();
      observer.disconnect();
    };
  }, [location.pathname, location.hash, adminLang]);

  const activeNavHelp = useMemo(() => getAdminActiveNavHelp(activeNavKey, adminLang), [activeNavKey, adminLang]);

  const websitePath = adminPublicSitePath(adminLang);

  const changeLanguage = (nextLanguage: AdminLang) => {
    if (pendingAdminLangRef.current === nextLanguage) return;
    pendingAdminLangRef.current = nextLanguage;
    setAdminLangState(nextLanguage);
    setAdminLang(nextLanguage);
  };

  const NavLink = ({ item, compact }: { item: NavItem; compact: boolean }) => {
    const isActive = isAdminNavItemActive(item.path, location.pathname, location.hash);
    const label = copyText(item.key);
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        title={label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex min-h-10 min-w-0 items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-sm font-semibold transition-colors",
          isActive
            ? "border border-accent/25 bg-accent/15 text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/76 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          compact && "mx-auto h-10 w-10 justify-center px-0",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-accent" : "text-sidebar-foreground/58 group-hover:text-sidebar-accent-foreground")} />
        <span className={cn("truncate", compact && "sr-only")}>{label}</span>
      </Link>
    );
  };

  const Nav = ({ variant }: { variant: "desktop" | "mobile" }) => {
    const compact = variant === "desktop" && navCollapsed;
    return (
      <aside
        className={cn(
          "flex h-full min-h-0 flex-col border-sidebar-border bg-sidebar text-sidebar-foreground",
          variant === "desktop" ? "border-r transition-[width] duration-200" : "w-full",
          variant === "desktop" && (compact ? "w-[76px]" : "w-[280px]"),
        )}
      >
        <div className={cn("flex min-h-[76px] items-center gap-3 border-b border-sidebar-border px-4", compact && "justify-center px-3")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-sm font-bold tracking-wide text-primary-foreground">
            {adminBrandIconSrc && !adminBrandIconFailed ? (
              <SmartImage
                src={adminBrandIconSrc}
                alt=""
                className="h-full w-full object-contain p-1.5"
                width={40}
                height={40}
                resize="contain"
                sizes="40px"
                onError={() => setAdminBrandIconFailed(true)}
              />
            ) : (
              "FC"
            )}
          </div>
          <div className={cn("min-w-0 flex-1", compact && "sr-only")}>
                <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{t.brand}</p>
                <p className="truncate text-sm font-semibold text-sidebar-foreground">{t.title}</p>
                <p className="mt-1 truncate text-[10px] font-semibold text-sidebar-foreground/45">v{ADMIN_BUILD_VERSION}</p>
              </div>
          {variant === "desktop" && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={navCollapsed ? t.expandNav : t.collapseNav}
              title={navCollapsed ? t.expandNav : t.collapseNav}
              className={cn("h-9 w-9 shrink-0 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", compact && "hidden")}
              onClick={() => setNavCollapsed((value) => !value)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {variant === "desktop" && compact && (
          <div className="border-b border-sidebar-border px-3 py-3">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t.expandNav}
              title={t.expandNav}
              className="h-10 w-10 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => setNavCollapsed(false)}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        <nav className={cn("min-h-0 flex-1 overflow-y-auto px-3 py-4", compact ? "space-y-4" : "space-y-2.5")} aria-label={t.menu}>
          {visibleNavGroups.map((group) => {
            const groupLabel = copyText(group.key);
            const GroupIcon = group.icon;
            const isExpanded = Boolean(expandedGroups[group.key]);

            if (compact) {
              return (
                <div key={group.key} className="space-y-1 border-t border-sidebar-border/70 pt-4 first:border-t-0 first:pt-0">
                  <p className="sr-only">{groupLabel}</p>
                  {group.items.map((item) => (
                    <NavLink key={item.path} item={item} compact />
                  ))}
                </div>
              );
            }

            return (
              <div
                key={group.key}
                className={cn(
                  "rounded-xl border border-transparent transition-colors",
                  isExpanded && "border-sidebar-border bg-sidebar-accent/35 p-1.5",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isExpanded && "bg-sidebar text-sidebar-foreground shadow-sm",
                  )}
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedGroups((prev) => {
                      if (prev[group.key]) return {};
                      return { [group.key]: true };
                    })
                  }
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GroupIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{groupLabel}</span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                </button>
                {isExpanded && (
                  <div className="ml-5 mt-1.5 space-y-1 border-l border-sidebar-border pl-2">
                    {group.items.map((item) => (
                      <NavLink key={item.path} item={item} compact={false} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminConfirmProvider />
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen">
          <Nav variant="desktop" />
        </div>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
            <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-lg lg:hidden">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">{t.menu}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] max-w-[88vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
                    <SheetTitle className="sr-only">{t.brand}</SheetTitle>
                    <SheetDescription className="sr-only">{t.subtitle}</SheetDescription>
                    <Nav variant="mobile" />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t.currentPage}</p>
                  <div className="flex items-center gap-2 truncate text-base font-semibold leading-6 sm:text-lg">
                    <span className="truncate">{activeNavLabel}</span>
                    <AdminHelpTip text={activeNavHelp} />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <div className="hidden min-h-12 items-center gap-1 rounded-full border border-border bg-muted/60 p-1 sm:inline-flex" aria-label={t.language}>
                  <ControlButton active={adminLang === "zh"} label="中文" onClick={() => changeLanguage("zh")}>
                    中
                  </ControlButton>
                  <ControlButton active={adminLang === "en"} label="英文" onClick={() => changeLanguage("en")}>
                    EN
                  </ControlButton>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  aria-label={theme === "dark" ? t.lightTheme : t.darkTheme}
                  title={theme === "dark" ? t.lightTheme : t.darkTheme}
                  onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                <Button asChild variant="outline" className="hidden h-10 rounded-lg px-4 md:inline-flex">
                  <Link to={websitePath}>
                    <ExternalLink className="h-4 w-4" />
                    {t.backToWebsite}
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg px-3 sm:px-4"
                  onClick={async () => {
                    await supabase?.auth.signOut();
                    window.location.href = "/admin";
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.signOut}</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1480px] space-y-5">
              {seedSummary.status === "error" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {t.seedError(seedSummary.error || "Unknown error")}
                </div>
              )}

              <Suspense
                fallback={
                  <div className="space-y-4">
                    <Skeleton className="h-9 w-64 max-w-full" />
                    <Skeleton className="h-52 w-full rounded-lg" />
                    <Skeleton className="h-52 w-full rounded-lg" />
                  </div>
                }
              >
                <div data-admin-language={adminLang} className="min-w-0 [&_a.inline-flex]:min-h-10 [&_button]:min-h-10">
                  <Outlet />
                </div>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
