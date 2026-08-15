import { lazy, Suspense, useEffect, useRef, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import DynamicBrandHead from "@/components/DynamicBrandHead";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { PublicChromeProvider, usePublicChrome } from "@/contexts/PublicChromeContext";
import { stripLanguagePrefix } from "@/i18n/routes";
import { adminRouteText } from "@/i18n/adminRouteText";
import { initAnalytics, trackPageView } from "@/lib/analytics";
import { getAdminLang } from "@/lib/adminLocale";
import { publicRoutes } from "@/routes/publicRoutes";
import ScrollToTop from "./components/ScrollToTop";

const AdminRouteTree = lazy(() => import("@/routes/AdminRouteTree"));
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminUiProviders = lazy(() => import("@/components/admin/AdminUiProviders"));

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
  return (
    <main className="min-h-screen pt-site-header" role="status" aria-live="polite" aria-busy="true">
      <div className="mx-auto grid min-h-[70vh] w-full max-w-[90rem] animate-pulse grid-cols-1 border-x border-border bg-card lg:grid-cols-2">
        <div className="min-h-[24rem] bg-muted" />
        <div className="flex flex-col justify-center gap-4 p-8 lg:p-16">
          <span className="h-3 w-24 bg-muted" />
          <span className="h-12 w-4/5 bg-muted" />
          <span className="h-4 w-3/5 bg-muted" />
        </div>
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
  const { theme } = usePublicChrome();

  return (
    <div
      className="forest-site-shell"
      data-theme={theme}
      data-surface={surface}
      data-header-overlay="false"
      data-product-detail={productDetail ? "true" : "false"}
    >
      {children}
    </div>
  );
};

const AppShell = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminLoginRoute = /^\/admin\/?$/.test(location.pathname);
  const publicPath = stripLanguagePrefix(location.pathname);
  const isHomeRoute = !isAdminRoute && publicPath === "/";
  const isProductDetailRoute = !isAdminRoute && /^\/products\/[^/]+$/.test(publicPath);
  const mobileActionBarMode = isHomeRoute || publicPath === "/contact"
    ? "scroll-up"
    : publicPath === "/quote"
      ? "always"
      : "hidden";
  const publicMainClass = isAdminRoute
    ? undefined
    : isHomeRoute
      ? "public-main public-main--home"
      : "public-main public-main--subpage";
  const publicMainTransitionClass = !isAdminRoute ? "public-main-transition" : undefined;
  const mainContentClass = [publicMainClass, publicMainTransitionClass].filter(Boolean).join(" ") || undefined;
  const mainContentKey = isAdminRoute ? "admin-main-content" : location.pathname;
  const forestSurface = publicPath.startsWith("/products") || publicPath.startsWith("/materials")
    ? "timber"
    : publicPath.startsWith("/promotions") || publicPath.startsWith("/contact") || publicPath.startsWith("/quote")
      ? "forest"
      : publicPath.startsWith("/services") || publicPath.startsWith("/process")
        ? "graphite"
        : "stone";

  return (
    <PublicChromeProvider
      isAdminRoute={isAdminRoute}
      isHomeRoute={isHomeRoute}
      mobileActionBarMode={mobileActionBarMode}
    >
      <DynamicBrandHead />
      <ScrollToTop />
      {!isAdminRoute && (
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg">
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
        <PublicSiteShell surface={forestSurface} productDetail={isProductDetailRoute}>
          {!isProductDetailRoute ? <Navbar /> : null}
          <PublicPageFrame isAdminRoute={false}>
            <div key={mainContentKey} id="main-content" tabIndex={-1} className={mainContentClass} data-forest-surface={forestSurface}>
              <AppErrorBoundary isAdminRoute={false}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>{publicRoutes}</Routes>
                </Suspense>
              </AppErrorBoundary>
            </div>
            <Footer />
            <FloatingCTA />
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
