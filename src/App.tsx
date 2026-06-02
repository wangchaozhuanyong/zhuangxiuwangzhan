import { Suspense, useEffect, useRef, type ReactNode } from "react";
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
import { adminRoutes } from "@/routes/adminRoutes";
import { publicRoutes } from "@/routes/publicRoutes";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => {
  const { language } = useLanguage();
  const label = language === "zh" ? "页面加载中" : "Loading page";

  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite" aria-label={label}>
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
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
            <Routes>
              {publicRoutes}
              {adminRoutes}
            </Routes>
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
