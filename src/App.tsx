import { lazy, Suspense, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Routes, useLocation, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { SchemeAFooter, SchemeAFooterPrelude, SchemeANavbar } from "@/components/scheme-a/SchemeAPublicChrome";
import DynamicBrandHead from "@/components/DynamicBrandHead";
import MobileBottomDock from "@/components/MobileBottomDock";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { getInitialPublicTheme, PublicChromeProvider, usePublicChrome } from "@/contexts/PublicChromeContext";
import { getLanguageFromPath, stripLanguagePrefix } from "@/i18n/routes";
import { adminRouteText } from "@/i18n/adminRouteText";
import { createPublicPageViewLifecycle } from "@/lib/analytics";
import { createAnalyticsRouterWindow } from "@/lib/analyticsRouterWindow";
import { recordWebsiteVisit } from "@/lib/websiteVisits";
import { getAdminLang } from "@/lib/adminPreferences";
import { focusElementByIdWhenReady } from "@/lib/instantScroll";
import { BOTTOM_NAV_SCROLL_INTENT, isFurnitureListingPath } from "@/lib/publicScrollRestoration";
import { publicRoutes } from "@/routes/publicRoutes";
import { PublicRouteImageGate } from "@/components/PublicRouteImageGate";
import { publicContentStatusText } from "@/i18n/publicContentStatusText";
import FurnitureFloatingLink from "@/components/FurnitureFloatingLink";
import PublicRoutePrefetch from "@/components/PublicRoutePrefetch";
import { publicMotionStyle } from "@/lib/publicMotion";
import ScrollToTop from "./components/ScrollToTop";
import NavigationProtectionProvider from "@/components/NavigationProtectionProvider";
import { INTERACTION_POLICY } from "@/lib/interactionPolicy";
import QueryInvalidationBridge from "@/components/QueryInvalidationBridge";
import RouteReadFeedback from "@/components/RouteReadFeedback";

const AdminRouteTree = lazy(() => import("@/routes/AdminRouteTree"));
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminUiProviders = lazy(() => import("@/components/admin/AdminUiProviders"));
const PublicCinematicMotion = lazy(() => import("@/components/PublicCinematicMotion"));
const PublicUpdateNotice = lazy(() => import("@/components/PublicUpdateNotice"));

const PublicCinematicMotionGate = () => {
  const [shouldLoadMotion, setShouldLoadMotion] = useState(false);

  useEffect(() => {
    const desktopMotion = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let idleCallbackId: number | null = null;
    let fallbackTimer = 0;

    const cancelScheduledLoad = () => {
      if (idleCallbackId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleCallbackId);
      }
      window.clearTimeout(fallbackTimer);
      idleCallbackId = null;
      fallbackTimer = 0;
    };

    const syncMotionPreference = () => {
      cancelScheduledLoad();
      if (!desktopMotion.matches || reducedMotion.matches) {
        setShouldLoadMotion(false);
        return;
      }

      const enableMotion = () => setShouldLoadMotion(true);
      if (typeof window.requestIdleCallback === "function") {
        idleCallbackId = window.requestIdleCallback(enableMotion, { timeout: 800 });
      } else {
        fallbackTimer = window.setTimeout(enableMotion, 120);
      }
    };

    desktopMotion.addEventListener("change", syncMotionPreference);
    reducedMotion.addEventListener("change", syncMotionPreference);
    syncMotionPreference();

    return () => {
      cancelScheduledLoad();
      desktopMotion.removeEventListener("change", syncMotionPreference);
      reducedMotion.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  if (!shouldLoadMotion) return null;

  return (
    <Suspense fallback={null}>
      <PublicCinematicMotion />
    </Suspense>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: INTERACTION_POLICY.defaultStaleTime,
      gcTime: INTERACTION_POLICY.gcTime,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: { retry: false },
  },
});
queryClient.setQueryDefaults(["published"], { staleTime: INTERACTION_POLICY.publicStaleTime, refetchOnWindowFocus: true });
queryClient.setQueryDefaults(["admin"], { refetchOnWindowFocus: true });

const PageLoader = () => {
  const { language } = useLanguage();

  return (
    <main className="fc-route-page min-h-screen" role="status" aria-live="polite" aria-busy="true" data-route-pending="true">
      <span className="sr-only">{publicContentStatusText[language].loaderRoutePending}</span>
    </main>
  );
};

const AdminPageLoader = () => {
  const label = adminRouteText[getAdminLang()].checking;

  return (
    <main
      className="flex min-h-screen items-center justify-center overflow-x-clip bg-background px-3 py-6 text-foreground sm:px-4 sm:py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 text-center shadow-sm sm:p-8">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </main>
  );
};

const analyticsRouterWindow = typeof window === "undefined" ? undefined : createAnalyticsRouterWindow(window);

const AnalyticsRouteTracker = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const routeLanguage = getLanguageFromPath(location.pathname) || language;
  const [tracker] = useState(() => createPublicPageViewLifecycle((pathname) => {
    void recordWebsiteVisit(pathname);
  }));

  useEffect(() => tracker.start(), [tracker]);

  useEffect(() => {
    tracker.updateRoute(`${location.pathname}${location.search}`, routeLanguage);
    return tracker.cancelPending;
  }, [tracker, routeLanguage, location.pathname, location.search]);

  return null;
};

const PublicPageFrame = ({ isAdminRoute, children }: { isAdminRoute: boolean; children: ReactNode }) => {
  const { menuOpen } = usePublicChrome();
  const frameRef = useRef<HTMLDivElement>(null);
  const shouldInert = !isAdminRoute && menuOpen;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    if (shouldInert) {
      frame.setAttribute("inert", "");
    } else {
      frame.removeAttribute("inert");
    }

    return () => {
      frame.removeAttribute("inert");
    };
  }, [shouldInert]);

  return (
    <div
      ref={frameRef}
      className="public-page-frame"
      aria-hidden={shouldInert ? true : undefined}
      data-menu-inert={shouldInert ? "true" : undefined}
    >
      {children}
    </div>
  );
};

const PublicSiteShell = ({
  surface,
  productDetail,
  children,
}: {
  surface: string;
  productDetail: boolean;
  children: ReactNode;
}) => {
  const { hasImmersiveHero } = usePublicChrome();

  return (
    <div
      className="scheme-a-public-shell"
      style={publicMotionStyle}
      data-theme={getInitialPublicTheme()}
      data-surface={surface}
      data-header-overlay={hasImmersiveHero ? "true" : "false"}
      data-product-detail={productDetail ? "true" : "false"}
    >
      {children}
    </div>
  );
};

const handleSkipToMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  focusElementByIdWhenReady("main-content", "start");
};

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminLoginRoute = /^\/admin\/?$/.test(location.pathname);
  const publicPath = stripLanguagePrefix(location.pathname);
  const isHomeRoute = !isAdminRoute && publicPath === "/";
  const isProductDetailRoute = !isAdminRoute && (/^\/products\/[^/]+$/.test(publicPath) || /^\/furniture\/product\/[^/]+$/.test(publicPath));
  const isFurnitureListingRoute = !isAdminRoute && isFurnitureListingPath(location.pathname);
  const publicMainClass = isAdminRoute
    ? undefined
    : isHomeRoute
      ? "public-main public-main--home"
      : "public-main public-main--subpage";
  const mainContentClass = publicMainClass;
  const mainContentKey = isAdminRoute ? "admin-main-content" : isFurnitureListingRoute ? "furniture-listing" : publicPath;
  const publicSurface = publicPath.startsWith("/landing/") ? "campaign" : "scheme-a";

  return (
    <PublicChromeProvider
      isAdminRoute={isAdminRoute}
      routeKey={isAdminRoute ? location.pathname : publicPath}
      mobileActionBarMode={isAdminRoute ? "hidden" : "scroll-up"}
    >
      <DynamicBrandHead />
      <QueryInvalidationBridge />
      <RouteReadFeedback surface={isAdminRoute ? "admin" : "public"} />
      <ScrollToTop />
      {!isAdminRoute && (
        <a href="#main-content" onClick={handleSkipToMainContent} className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg">
          {language === "zh" ? "跳到主要内容" : "Skip to main content"}
        </a>
      )}
      {isAdminRoute ? (
        <PublicPageFrame isAdminRoute>
          <div key={mainContentKey} id="main-content" tabIndex={-1} className={mainContentClass}>
            <AppErrorBoundary isAdminRoute>
              <Suspense fallback={<AdminPageLoader />}>
                <AdminUiProviders>
                  {isAdminLoginRoute ? <AdminLoginPage /> : <AdminRouteTree />}
                </AdminUiProviders>
              </Suspense>
            </AppErrorBoundary>
          </div>
        </PublicPageFrame>
      ) : (
        <PublicSiteShell surface={publicSurface} productDetail={isProductDetailRoute}>
          <SchemeANavbar />
          <PublicRoutePrefetch />
          <PublicCinematicMotionGate />
          <PublicPageFrame isAdminRoute={false}>
            <PublicRouteImageGate routeKey={`${location.pathname}${location.search}`} onCancel={(route) => navigate(route, { replace: true, state: { scrollIntent: BOTTOM_NAV_SCROLL_INTENT } })}>
              <div key={mainContentKey} id="main-content" tabIndex={-1} className={mainContentClass} data-public-surface={publicSurface}>
                <AppErrorBoundary isAdminRoute={false}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>{publicRoutes}</Routes>
                  </Suspense>
                </AppErrorBoundary>
              </div>
              <SchemeAFooterPrelude />
              <SchemeAFooter />
            </PublicRouteImageGate>
            <FurnitureFloatingLink />
            <AppErrorBoundary isAdminRoute={false}><Suspense fallback={null}><PublicUpdateNotice /></Suspense></AppErrorBoundary>
            <MobileBottomDock />
          </PublicPageFrame>
        </PublicSiteShell>
      )}
    </PublicChromeProvider>
  );
};

const appRouter = createBrowserRouter([{ path: "*", element: <NavigationProtectionProvider><AnalyticsRouteTracker /><AppShell /></NavigationProtectionProvider> }], { window: analyticsRouterWindow });

const App = () => (
  <LanguageProvider>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={appRouter} />
      </QueryClientProvider>
    </HelmetProvider>
  </LanguageProvider>
);

export default App;
