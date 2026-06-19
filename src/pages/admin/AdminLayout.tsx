import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const AdminDefaultContentSeedStatus = lazy(() => import("@/components/admin/AdminDefaultContentSeedStatus"));
const ROUTE_SETTLE_MS = 260;
const PENDING_NAV_FALLBACK_MS = 2500;
const IDLE_PRELOAD_LIMIT = 8;

const adminRoutePreloaders: Array<[RegExp, () => Promise<unknown>]> = [
  [/^\/admin\/dashboard$/, () => import("@/pages/admin/AdminDashboard")],
  [/^\/admin\/content-health$/, () => import("@/pages/admin/AdminContentHealth")],
  [/^\/admin\/publish-center$/, () => import("@/pages/admin/AdminPublishCenter")],
  [/^\/admin\/english-center$/, () => import("@/pages/admin/AdminEnglishCenter")],
  [/^\/admin\/cms$/, () => import("@/pages/admin/AdminCmsBuilder")],
  [/^\/admin\/settings$/, () => import("@/pages/admin/AdminWebsiteSettings")],
  [/^\/admin\/leads(?:\/|$)/, () => import("@/pages/admin/AdminLeadList")],
  [/^\/admin\/quotes(?:\/|$)/, () => import("@/pages/admin/AdminQuoteList")],
  [/^\/admin\/lead-reports$/, () => import("@/pages/admin/AdminLeadReports")],
  [/^\/admin\/home$/, () => import("@/pages/admin/AdminHomeEditor")],
  [/^\/admin\/pages$/, () => import("@/pages/admin/AdminSimpleCms")],
  [/^\/admin\/about$/, () => import("@/pages/admin/AdminAboutEditor")],
  [/^\/admin\/faqs$/, () => import("@/pages/admin/AdminSimpleCms")],
  [/^\/admin\/before-after$/, () => import("@/pages/admin/AdminSimpleCms")],
  [/^\/admin\/brand-partners$/, () => import("@/pages/admin/AdminSimpleCms")],
  [/^\/admin\/services(?:\/|$)/, () => import("@/pages/admin/AdminServiceList")],
  [/^\/admin\/projects(?:\/|$)/, () => import("@/pages/admin/AdminProjectList")],
  [/^\/admin\/materials(?:\/|$)/, () => import("@/pages/admin/AdminMaterialList")],
  [/^\/admin\/blog(?:\/|$)/, () => import("@/pages/admin/AdminBlogList")],
  [/^\/admin\/media$/, () => import("@/pages/admin/AdminMediaLibrary")],
  [/^\/admin\/seo$/, () => import("@/pages/admin/AdminSeoManager")],
  [/^\/admin\/users$/, () => import("@/pages/admin/AdminUsers")],
  [/^\/admin\/notifications$/, () => import("@/pages/admin/AdminNotificationSettings")],
  [/^\/admin\/system-health$/, () => import("@/pages/admin/AdminSystemHealth")],
  [/^\/admin\/system-logs$/, () => import("@/pages/admin/AdminSystemLogs")],
  [/^\/admin\/content\/translation_jobs(?:\/|$)/, () => import("@/pages/admin/AdminTranslationJobs")],
  [/^\/admin\/content\//, () => import("@/pages/admin/AdminContentEditor")],
];

const preloadedAdminRoutes = new Set<string>();

const preloadAdminRoute = (path: string) => {
  const normalizedPath = path.split("#")[0] || path;
  if (preloadedAdminRoutes.has(normalizedPath)) return;
  const loader = adminRoutePreloaders.find(([pattern]) => pattern.test(normalizedPath))?.[1];
  if (!loader) return;

  preloadedAdminRoutes.add(normalizedPath);
  void loader().catch(() => {
    preloadedAdminRoutes.delete(normalizedPath);
  });
};

const getAdminRouteKey = (pathname: string, hash: string) => `${pathname}${hash}`;

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

const AdminTopProgress = ({ visible }: { visible: boolean }) => (
  <div
    aria-hidden="true"
    className={cn(
      "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden transition-opacity duration-150",
      visible ? "opacity-100" : "opacity-0",
    )}
  >
    <div data-admin-progress-bar className="h-full w-full origin-left bg-accent" />
  </div>
);

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
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);
  const [routeSettling, setRouteSettling] = useState(false);
  const lastBuildCheckAtRef = useRef(0);
  const pendingAdminLangRef = useRef(adminLang);
  const routeKey = getAdminRouteKey(location.pathname, location.hash);
  const previousRouteKeyRef = useRef(routeKey);
  const t = copy[adminLang];
  const showDefaultContentSeedStatus = location.pathname === "/admin/dashboard";
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

  useEffect(() => {
    if (!pendingNavPath || !isAdminNavItemActive(pendingNavPath, location.pathname, location.hash)) return;
    setPendingNavPath(null);
  }, [location.hash, location.pathname, pendingNavPath]);

  useEffect(() => {
    if (!pendingNavPath) return;
    const timeoutId = window.setTimeout(() => setPendingNavPath(null), PENDING_NAV_FALLBACK_MS);
    return () => window.clearTimeout(timeoutId);
  }, [pendingNavPath]);

  useEffect(() => {
    if (previousRouteKeyRef.current === routeKey) return;
    previousRouteKeyRef.current = routeKey;
    setRouteSettling(true);
    const timeoutId = window.setTimeout(() => setRouteSettling(false), ROUTE_SETTLE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [routeKey]);

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
  const skeletonMode = useMemo(() => getAdminSkeletonMode(activeNavKey), [activeNavKey]);
  const isAdminRouteBusy = Boolean(pendingNavPath) || routeSettling;

  const websitePath = adminPublicSitePath(adminLang);

  useEffect(() => {
    const currentGroupItems = visibleNavGroups
      .filter((group) => activeGroupKeys.includes(group.key))
      .flatMap((group) => group.items.map((item) => item.path));
    const priorityPaths = [
      ...currentGroupItems,
      "/admin/dashboard",
      "/admin/content-health",
      "/admin/leads",
      "/admin/quotes",
      "/admin/services",
      "/admin/projects",
      "/admin/media",
      "/admin/seo",
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
            <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-2 sm:min-h-[72px] sm:gap-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-lg lg:hidden">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">{t.menu}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[calc(100vw-1rem)] max-w-none border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:w-80">
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
                  className="h-10 w-10 rounded-lg px-0 sm:w-auto sm:px-4"
                  onClick={async () => {
                    await signOutAdmin();
                    window.location.href = "/admin";
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.signOut}</span>
                </Button>
              </div>
            </div>
            <AdminTopProgress visible={isAdminRouteBusy} />
          </header>

          <main className="min-w-0 px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
            <div className="mx-auto w-full max-w-[1480px] space-y-5">
              {showDefaultContentSeedStatus && (
                <Suspense fallback={null}>
                  <AdminDefaultContentSeedStatus formatError={t.seedError} />
                </Suspense>
              )}

              <Suspense
                fallback={<AdminPageSkeleton mode={skeletonMode} label={t.switchingPage} />}
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
