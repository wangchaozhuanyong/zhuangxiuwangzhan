import { lazy, Suspense, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, useLocation, useNavigationType } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { SchemeAFooter, SchemeAFooterPrelude, SchemeANavbar } from "@/components/scheme-a/SchemeAPublicChrome";
import DynamicBrandHead from "@/components/DynamicBrandHead";
import MobileBottomDock from "@/components/MobileBottomDock";
import PublicUpdateNotice from "@/components/PublicUpdateNotice";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { PublicChromeProvider, usePublicChrome } from "@/contexts/PublicChromeContext";
import { stripLanguagePrefix } from "@/i18n/routes";
import { adminRouteText } from "@/i18n/adminRouteText";
import { initAnalytics, trackPageView } from "@/lib/analytics";
import { getAdminLang } from "@/lib/adminLocale";
import { focusElementByIdWhenReady } from "@/lib/instantScroll";
import { publicRoutes } from "@/routes/publicRoutes";
import ScrollToTop from "./components/ScrollToTop";

const AdminRouteTree = lazy(() => import("@/routes/AdminRouteTree"));
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminUiProviders = lazy(() => import("@/components/admin/AdminUiProviders"));
const PublicCinematicMotion = lazy(() => import("@/components/PublicCinematicMotion"));

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
      staleTime: 2 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => {
  const { language } = useLanguage();

  return (
    <main className="scheme-a-page-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="scheme-a-page-loader__brand">
        <p>INTERIOR &amp; RENOVATION</p>
        <strong><span>FLASH</span><em>CAST</em></strong>
        <span>{language === "zh" ? "空间正在显影" : "Bringing the space into focus"}</span>
        <i aria-hidden="true" />
      </div>
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

const AnalyticsRouteTracker = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const path = `${location.pathname}${location.search}`;
    const timer = window.setTimeout(() => {
      trackPageView({
        path,
        title: document.title,
        language,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [language, location.pathname, location.search]);

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
      data-theme="dark"
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
  const location = useLocation();
  const navigationType = useNavigationType();
  const { language } = useLanguage();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminLoginRoute = /^\/admin\/?$/.test(location.pathname);
  const publicPath = stripLanguagePrefix(location.pathname);
  const isHomeRoute = !isAdminRoute && publicPath === "/";
  const isProductDetailRoute = !isAdminRoute && /^\/products\/[^/]+$/.test(publicPath);
  const publicMainClass = isAdminRoute
    ? undefined
    : isHomeRoute
      ? "public-main public-main--home"
      : "public-main public-main--subpage";
  const publicMainTransitionClass = !isAdminRoute ? "public-main-transition" : undefined;
  const mainContentClass = [publicMainClass, publicMainTransitionClass].filter(Boolean).join(" ") || undefined;
  const mainContentKey = isAdminRoute ? "admin-main-content" : location.pathname;
  const publicSurface = publicPath.startsWith("/landing/") ? "campaign" : "scheme-a";

  useEffect(() => {
    document.documentElement.dataset.navigationType = navigationType.toLowerCase();

    return () => {
      delete document.documentElement.dataset.navigationType;
    };
  }, [navigationType]);

  return (
    <PublicChromeProvider
      isAdminRoute={isAdminRoute}
      routeKey={location.pathname}
      mobileActionBarMode={isAdminRoute ? "hidden" : "scroll-up"}
    >
      <DynamicBrandHead />
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
          <PublicCinematicMotionGate />
          <PublicPageFrame isAdminRoute={false}>
            <div key={mainContentKey} id="main-content" tabIndex={-1} className={mainContentClass} data-public-surface={publicSurface}>
              <AppErrorBoundary isAdminRoute={false}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>{publicRoutes}</Routes>
                </Suspense>
              </AppErrorBoundary>
            </div>
            <SchemeAFooterPrelude />
            <SchemeAFooter />
            <PublicUpdateNotice />
            <MobileBottomDock />
          </PublicPageFrame>
        </PublicSiteShell>
      )}
    </PublicChromeProvider>
  );
};

const App = () => (
  <LanguageProvider>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnalyticsRouteTracker />
          <AppShell />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </LanguageProvider>
);

export default App;
