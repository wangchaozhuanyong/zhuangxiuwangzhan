import { INTERACTION_POLICY } from "@/lib/interactionPolicy";
import { useSiteSettingsQuery } from "@/hooks/useSiteSettings";
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useIsFetching } from "@tanstack/react-query";
import PublicUpdateNotice from "@/components/PublicUpdateNotice";
import { navigateDocumentSafely } from "@/lib/navigationProtection";
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
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import AdminConfirmProvider from "@/components/admin/AdminConfirmProvider";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import AdminPageSkeleton, { type AdminPageSkeletonMode } from "@/components/admin/AdminPageSkeleton";
import AdminRouteTransition from "@/components/admin/AdminRouteTransition";
import SmartImage from "@/components/SmartImage";
import { signOutAdmin } from "@/backend/modules/admin-auth/service/adminAuthService";
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
import {
  ADMIN_BUILD_VERSION,
  ADMIN_TITLE_SUFFIX,
  NAV_COLLAPSED_KEY,
  NAV_EXPANDED_KEY,
  copy,
  ensureAdminFormAccessibility,
  getAdminActiveNavHelp,
  isAdminNavItemActive,
  navGroups,
  readExpandedGroups,
  readNavCollapsed,
  type AdminCopy,
  type NavItem,
} from "@/lib/adminLayoutConfig";
import { canAdminRoleAccess } from "@/lib/adminRoleAccess";
import { addCacheBuster, fallbackSiteSettings } from "@/lib/siteSettingsApi";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/pages/admin/AdminAuthProvider";
import { adminMobileText } from "@/i18n/adminMobileText";
import { adminRouteDefinitions, getAdminRouteDefinition } from "@/routes/adminRouteDefinitions";

const AdminDefaultContentSeedStatus = lazy(() => import("@/components/admin/AdminDefaultContentSeedStatus"));
const IDLE_PRELOAD_LIMIT = 8;

const preloadedAdminRoutes = new Set<string>();

const preloadAdminRoute = (path: string) => {
  const normalizedPath = path.split("#")[0] || path;
  if (preloadedAdminRoutes.has(normalizedPath)) return;
  const loader = getAdminRouteDefinition(normalizedPath)?.load;
  if (!loader) return;

  preloadedAdminRoutes.add(normalizedPath);
  void loader().catch(() => {
    preloadedAdminRoutes.delete(normalizedPath);
  });
};

function AdminCodeLoading({ mode, label, onPending }: { mode: AdminPageSkeletonMode; label: string; onPending: (pending: boolean) => void }) {
  useEffect(() => { onPending(true); return () => onPending(false); }, [onPending]);
  return <AdminPageSkeleton mode={mode} label={label} />;
}

const getAdminSkeletonMode = (navKey: keyof AdminCopy): AdminPageSkeletonMode => {
  switch (navKey) {
    case "dashboard":
    case "leadReports":
    case "contentHealth":
    case "publishCenter":
    case "englishCenter":
      return "dashboard";
    case "home":
    case "about":
    case "cmsBuilder":
    case "pages":
    case "services":
    case "projects":
    case "materials":
    case "promotions":
    case "blog":
    case "websiteSettings":
    case "notificationSettings":
      return "form";
    case "media":
      return "media";
    case "systemHealth":
    case "systemLogs":
    case "users":
    case "translationJobs":
      return "settings";
    default:
      return "table";
  }
};

const AdminTopProgress = ({ visible }: { visible: boolean }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
    if (!visible) return;
    const timer = window.setTimeout(() => setShow(true), INTERACTION_POLICY.feedbackDelay);
    return () => window.clearTimeout(timer);
  }, [visible]);
  return (
  <div
    aria-hidden="true"
    className={cn(
      "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden transition-opacity duration-150",
      show ? "opacity-100" : "opacity-0",
    )}
  >
    <div data-admin-progress-bar className="h-full w-full origin-left bg-accent" />
  </div>
);
};

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
  const [mobilePreferencesOpen, setMobilePreferencesOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(() => readNavCollapsed());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => readExpandedGroups());
  const [adminBrandIconFailed, setAdminBrandIconFailed] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const pendingReads = useIsFetching({ predicate: (query) => query.queryKey[0] === "admin" && query.getObserversCount() > 0 && query.state.data === undefined });
  const pendingAdminLangRef = useRef(adminLang);
  const routeKey = location.pathname;
  const t = copy[adminLang];
  const mobileText = adminMobileText[adminLang];
  const showDefaultContentSeedStatus = location.pathname === "/admin/dashboard";
  const { data: adminSiteSettings = fallbackSiteSettings } = useSiteSettingsQuery();
  const adminBrandIconSrc = addCacheBuster(
    adminSiteSettings.favicon_url || adminSiteSettings.logo_url || "",
    adminSiteSettings.updated_at,
  );

  useEffect(() => {
    setAdminBrandIconFailed(false);
  }, [adminBrandIconSrc]);


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

  useEffect(() => {
    if (!pendingNavPath || !isAdminNavItemActive(pendingNavPath, location.pathname, location.hash)) return;
    setPendingNavPath(null);
  }, [location.hash, location.pathname, pendingNavPath]);

  useEffect(() => {
    const clearPending = () => setPendingNavPath(null);
    window.addEventListener("flashcast-navigation-decision", clearPending);
    return () => window.removeEventListener("flashcast-navigation-decision", clearPending);
  }, []);

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
    document.title = `${activeNavLabel} | ${ADMIN_TITLE_SUFFIX[adminLang]}`;
  }, [activeNavLabel, adminLang]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    let forceScheduledScan = false;
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
      forceScheduledScan ||= force;
      if (cancelled || idleId !== null || timeoutId !== null) return;
      const run = () => {
        idleId = null;
        timeoutId = null;
        const forceScan = forceScheduledScan;
        forceScheduledScan = false;
        if (!cancelled) ensureAdminFormAccessibility(main, forceScan);
      };

      if (browserWindow.requestIdleCallback) {
        idleId = browserWindow.requestIdleCallback(run, { timeout: 900 });
        return;
      }

      timeoutId = window.setTimeout(run, 120);
    };

    scheduleAccessibilityScan(true);
    const observer = new MutationObserver((records) => {
      // Translated labels can commit after the layout's language effect.
      // Upgrade a queued scan so owned names follow the final visible copy.
      scheduleAccessibilityScan(records.some(({ type }) => type === "characterData"));
    });
    observer.observe(main, { childList: true, characterData: true, subtree: true });
    return () => {
      cancelled = true;
      clearScheduledScan();
      observer.disconnect();
    };
  }, [location.pathname, location.hash, adminLang]);

  const activeNavHelp = useMemo(() => getAdminActiveNavHelp(activeNavKey, adminLang), [activeNavKey, adminLang]);
  const skeletonMode = useMemo(() => getAdminSkeletonMode(activeNavKey), [activeNavKey]);
  const isAdminRouteBusy = Boolean(pendingNavPath) || codeLoading || pendingReads > 0;

  useEffect(() => { if (!isAdminRouteBusy) window.dispatchEvent(new CustomEvent("admin-route-layout", { detail: { routeKey: location.pathname + location.search } })); }, [isAdminRouteBusy, location.pathname, location.search]);

  const websitePath = adminPublicSitePath(adminLang);

  useEffect(() => {
    const currentGroupItems = visibleNavGroups
      .filter((group) => activeGroupKeys.includes(group.key))
      .flatMap((group) => group.items.map((item) => item.path));
    const priorityPaths = [
      ...currentGroupItems,
      adminRouteDefinitions.dashboard.fullPath,
      adminRouteDefinitions.contentHealth.fullPath,
      adminRouteDefinitions.leadList.fullPath,
      adminRouteDefinitions.quoteList.fullPath,
      adminRouteDefinitions.serviceList.fullPath,
      adminRouteDefinitions.projectList.fullPath,
      adminRouteDefinitions.mediaLibrary.fullPath,
      adminRouteDefinitions.seoManager.fullPath,
    ];
    const paths = Array.from(new Set(priorityPaths))
      .filter((path) => !isAdminNavItemActive(path, location.pathname, location.hash))
      .slice(0, IDLE_PRELOAD_LIMIT);

    if (!paths.length) return;

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    const browserWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const run = () => {
      idleId = null;
      timeoutId = null;
      if (cancelled) return;
      paths.forEach(preloadAdminRoute);
    };

    if (browserWindow.requestIdleCallback) {
      idleId = browserWindow.requestIdleCallback(run, { timeout: 1400 });
    } else {
      timeoutId = window.setTimeout(run, 500);
    }

    return () => {
      cancelled = true;
      if (idleId !== null) browserWindow.cancelIdleCallback?.(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [activeGroupKeys, location.hash, location.pathname, visibleNavGroups]);

  const changeLanguage = (nextLanguage: AdminLang) => {
    if (pendingAdminLangRef.current === nextLanguage) return;
    pendingAdminLangRef.current = nextLanguage;
    setAdminLangState(nextLanguage);
    setAdminLang(nextLanguage);
  };

  const NavLink = ({ item, compact, mobile }: { item: NavItem; compact: boolean; mobile?: boolean }) => {
    const isActive = isAdminNavItemActive(item.path, location.pathname, location.hash);
    const isPending = pendingNavPath === item.path && !isActive;
    const label = copyText(item.key);
    const Icon = item.icon;
    const startNavigation = () => {
      preloadAdminRoute(item.path);
      if (!isActive) setPendingNavPath(item.path);
      if (mobile) setMobileNavOpen(false);
    };

    return (
      <Link
        key={item.path}
        to={item.path}
        title={label}
        aria-current={isActive ? "page" : undefined}
        aria-busy={isPending ? true : undefined}
        data-pending={isPending ? "true" : undefined}
        onClick={startNavigation}
        onFocus={() => preloadAdminRoute(item.path)}
        onPointerEnter={() => preloadAdminRoute(item.path)}
        onTouchStart={() => preloadAdminRoute(item.path)}
        className={cn(
          "group relative flex min-h-10 min-w-0 items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-sm font-semibold transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/55",
          isActive
            ? "border border-accent/25 bg-accent/15 text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/76 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isPending && "border-accent/35 bg-accent/10 text-sidebar-accent-foreground shadow-sm",
          compact && "mx-auto h-10 w-10 justify-center px-0",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive || isPending ? "text-accent" : "text-sidebar-foreground/58 group-hover:text-sidebar-accent-foreground")} />
        <span className={cn("truncate", compact && "sr-only")}>{label}</span>
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent transition-opacity duration-150",
            isPending ? "opacity-100" : "opacity-0",
            compact && "right-1.5 top-1.5",
          )}
        />
      </Link>
    );
  };

  const Nav = ({ variant }: { variant: "desktop" | "mobile" }) => {
    const compact = variant === "desktop" && navCollapsed;
    return (
      <aside
        className={cn(
          "flex h-full min-h-0 flex-col border-sidebar-border bg-sidebar text-sidebar-foreground",
          variant === "desktop" ? "border-r transition-[width] duration-200 ease-out motion-reduce:transition-none" : "w-full",
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
                  "rounded-xl border border-transparent p-1 transition-colors duration-150",
                  isExpanded && "border-sidebar-border bg-sidebar-accent/35",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-sidebar-foreground transition-[background-color,color,box-shadow] duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/55",
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
                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="ml-5 mt-1.5 space-y-1 border-l border-sidebar-border pl-2">
                      {group.items.map((item) => (
                        <NavLink key={item.path} item={item} compact={false} mobile={variant === "mobile"} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    );
  };

  return (
    <div data-admin-shell className="min-h-screen overflow-x-clip bg-background text-foreground">
      <AdminConfirmProvider />
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen">
          <Nav variant="desktop" />
        </div>

        <div className="min-w-0 overflow-x-clip">
          <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
            <div className="flex min-h-14 items-center justify-between gap-2 px-4 py-1.5 md:min-h-[72px] md:gap-3 md:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={(open) => { setMobileNavOpen(open); if (open) setMobilePreferencesOpen(false); }}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-lg lg:hidden">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">{t.menu}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" closeLabel={mobileText.close} data-admin-mobile-sheet className="w-[calc(100vw-2rem)] max-w-sm border-sidebar-border bg-sidebar p-0 pb-[env(safe-area-inset-bottom)] text-sidebar-foreground sm:w-80">
                    <SheetTitle className="sr-only">{t.brand}</SheetTitle>
                    <SheetDescription className="sr-only">{t.subtitle}</SheetDescription>
                    <Nav variant="mobile" />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <p className="hidden text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:block">{t.currentPage}</p>
                  <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold leading-5 sm:gap-2 sm:text-lg sm:leading-6">
                    <span className="truncate">{activeNavLabel}</span>
                    <AdminHelpTip text={activeNavHelp} />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
                <Sheet open={mobilePreferencesOpen} onOpenChange={(open) => { setMobilePreferencesOpen(open); if (open) setMobileNavOpen(false); }}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-11 w-11 rounded-lg md:hidden" aria-label={mobileText.account}>
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" closeLabel={mobileText.close} data-admin-mobile-sheet className="mx-auto max-h-[85dvh] max-w-lg rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <SheetTitle className="pr-12">{mobileText.account}</SheetTitle>
                    <SheetDescription className="mt-1">{mobileText.accountDescription}</SheetDescription>
                    <div className="mt-5 space-y-4">
                      <div role="group" aria-label={t.language} className="grid grid-cols-2 gap-3">
                        <Button type="button" variant={adminLang === "zh" ? "default" : "outline"} aria-pressed={adminLang === "zh"} className="min-h-11" onClick={() => changeLanguage("zh")}>{mobileText.chinese}</Button>
                        <Button type="button" variant={adminLang === "en" ? "default" : "outline"} aria-pressed={adminLang === "en"} className="min-h-11" onClick={() => changeLanguage("en")}>{mobileText.english}</Button>
                      </div>
                      <Button type="button" variant="outline" className="min-h-11 w-full justify-start gap-3" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")}>
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{theme === "dark" ? t.lightTheme : t.darkTheme}
                      </Button>
                      <Button asChild variant="outline" className="min-h-11 w-full justify-start gap-3"><Link to={websitePath}><ExternalLink className="h-4 w-4" />{t.backToWebsite}</Link></Button>
                      <div className="border-t border-border pt-4"><Button type="button" variant="outline" className="min-h-11 w-full justify-start gap-3" onClick={async () => {
                        await navigateDocumentSafely(async () => { await signOutAdmin(); window.location.href = "/admin"; });
                      }}><LogOut className="h-4 w-4" />{t.signOut}</Button></div>
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="hidden min-h-12 items-center gap-1 rounded-full border border-border bg-muted/60 p-1 md:inline-flex" aria-label={t.language}>
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
                  className="hidden h-10 w-10 rounded-lg md:inline-flex"
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
                  className="hidden h-10 rounded-lg px-4 md:inline-flex"
                  onClick={async () => {
                    await navigateDocumentSafely(async () => { await signOutAdmin(); window.location.href = "/admin"; });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.signOut}</span>
                </Button>
              </div>
            </div>
            <AdminTopProgress visible={isAdminRouteBusy} />
          </header>

          <PublicUpdateNotice surface="admin" />
          <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <div className="mx-auto w-full max-w-[1480px] space-y-5">
              {showDefaultContentSeedStatus && (
                <Suspense fallback={null}>
                  <AdminDefaultContentSeedStatus formatError={t.seedError} />
                </Suspense>
              )}

              <Suspense
                fallback={<AdminCodeLoading mode={skeletonMode} label={t.switchingPage} onPending={setCodeLoading} />}
              >
                <AdminRouteTransition key={routeKey} routeKey={routeKey} busy={isAdminRouteBusy}>
                  <div
                    data-admin-language={adminLang}
                    className="min-w-0 overflow-x-clip [overflow-wrap:anywhere] [&_a.inline-flex]:min-h-10 [&_button]:min-h-10 max-md:[&_select]:min-h-10"
                  >
                    <Outlet />
                  </div>
                </AdminRouteTransition>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
