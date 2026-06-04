import { lazy, Suspense, useEffect, useRef, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import DynamicBrandHead from "@/components/DynamicBrandHead";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { PublicChromeProvider, usePublicChrome } from "@/contexts/PublicChromeContext";
import { stripLanguagePrefix } from "@/i18n/routes";
import { initAnalytics, trackPageView } from "@/lib/analytics";
import { publicRoutes } from "@/routes/publicRoutes";
import ScrollToTop from "./components/ScrollToTop";

const AdminRouteTree = lazy(() => import("@/routes/AdminRouteTree"));
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLogin"));

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
  const label = language === "zh" ? "页面加载中" : "Loading page";

  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-6 py-24"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={language === "zh" ? "页面加载中" : label}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-card border border-border bg-card/95 px-6 py-8 text-center shadow-luxury">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" aria-hidden="true" />
        <div className="space-y-2">
          <p className="text-base font-semibold text-foreground">
            {language === "zh" ? "正在加载页面内容" : "Loading page content"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {language === "zh" ? "请稍等，页面正在准备。" : "Please wait while the page is prepared."}
          </p>
        </div>
      </div>
    </div>
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

const AppShell = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminLoginRoute = /^\/admin\/?$/.test(location.pathname);
  const publicPath = stripLanguagePrefix(location.pathname);
  const isHomeRoute = !isAdminRoute && publicPath === "/";
  const suppressMobileActionBar = !isAdminRoute && (publicPath === "/quote" || publicPath === "/contact");
  const publicMainClass = isAdminRoute
    ? undefined
    : isHomeRoute
      ? "public-main public-main--home"
      : "public-main public-main--subpage";
  const publicMainTransitionClass = !isAdminRoute ? "public-main-transition" : undefined;
  const mainContentClass = [publicMainClass, publicMainTransitionClass].filter(Boolean).join(" ") || undefined;
  const mainContentKey = isAdminRoute ? "admin-main-content" : location.pathname;

  return (
    <PublicChromeProvider isAdminRoute={isAdminRoute} isHomeRoute={isHomeRoute} suppressMobileActionBar={suppressMobileActionBar}>
      <DynamicBrandHead />
      <ScrollToTop />
      {!isAdminRoute && (
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg">
          {language === "zh" ? "跳到主要内容" : "Skip to main content"}
        </a>
      )}
      {!isAdminRoute && <Navbar />}
      <PublicPageFrame isAdminRoute={isAdminRoute}>
        <div key={mainContentKey} id="main-content" tabIndex={-1} className={mainContentClass}>
          <AppErrorBoundary isAdminRoute={isAdminRoute}>
          <Suspense fallback={<PageLoader />}>
            {isAdminRoute ? (
              isAdminLoginRoute ? (
                <AdminLoginPage />
              ) : (
                <AdminRouteTree />
              )
            ) : (
              <Routes>
                {publicRoutes}
              </Routes>
            )}
          </Suspense>
          </AppErrorBoundary>
        </div>
        {!isAdminRoute && <Footer />}
        {!isAdminRoute && <FloatingCTA />}
      </PublicPageFrame>
    </PublicChromeProvider>
  );
};

const App = () => (
  <LanguageProvider>
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnalyticsRouteTracker />
          <AppShell />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </LanguageProvider>
);

export default App;
