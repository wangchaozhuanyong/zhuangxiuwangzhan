import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import DynamicBrandHead from "@/components/DynamicBrandHead";
import { LanguageRouteSync, LegacyLanguageRedirect, RootLanguageRedirect } from "@/components/LanguageRouteSync";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import FAQ from "./pages/FAQ";
import AdminRoute from "./pages/admin/AdminRoute";

// Lazy-load all non-homepage routes
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Materials = lazy(() => import("./pages/Materials"));
const MaterialCategoryPage = lazy(() => import("./pages/MaterialCategoryPage"));
const MaterialSubcategoryPage = lazy(() => import("./pages/MaterialSubcategoryPage"));
const MaterialDetail = lazy(() => import("./pages/MaterialDetail"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Process = lazy(() => import("./pages/Process"));
const Contact = lazy(() => import("./pages/Contact"));
const Quote = lazy(() => import("./pages/Quote"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const LocationPage = lazy(() => import("./pages/LocationPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const OldHouseRenovation = lazy(() => import("./pages/OldHouseRenovation"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminContentEditor = lazy(() => import("./pages/admin/AdminContentEditor"));
const AdminNotificationSettings = lazy(() => import("./pages/admin/AdminNotificationSettings"));
const AdminTranslationJobs = lazy(() => import("./pages/admin/AdminTranslationJobs"));
const AdminWebsiteSettings = lazy(() => import("./pages/admin/AdminWebsiteSettings"));
const AdminLeadList = lazy(() => import("./pages/admin/AdminLeadList"));
const AdminLeadDetail = lazy(() => import("./pages/admin/AdminLeadDetail"));
const AdminQuoteList = lazy(() => import("./pages/admin/AdminQuoteList"));
const AdminQuoteDetail = lazy(() => import("./pages/admin/AdminQuoteDetail"));
const AdminComingSoon = lazy(() => import("./pages/admin/AdminComingSoon"));
const AdminBusinessContent = lazy(() => import("./pages/admin/AdminBusinessContent").then((module) => ({ default: () => <module.AdminBusinessList module="services" /> })));
const AdminServiceEditor = lazy(() => import("./pages/admin/AdminBusinessContent").then((module) => ({ default: () => <module.AdminBusinessEditor module="services" /> })));
const AdminProjectList = lazy(() => import("./pages/admin/AdminBusinessContent").then((module) => ({ default: () => <module.AdminBusinessList module="projects" /> })));
const AdminProjectEditor = lazy(() => import("./pages/admin/AdminBusinessContent").then((module) => ({ default: () => <module.AdminBusinessEditor module="projects" /> })));
const AdminMaterialList = lazy(() => import("./pages/admin/AdminBusinessContent").then((module) => ({ default: () => <module.AdminBusinessList module="materials" /> })));
const AdminMaterialEditor = lazy(() => import("./pages/admin/AdminBusinessContent").then((module) => ({ default: () => <module.AdminBusinessEditor module="materials" /> })));
const AdminBlogList = lazy(() => import("./pages/admin/AdminBusinessContent").then((module) => ({ default: () => <module.AdminBusinessList module="blog_posts" /> })));
const AdminBlogEditor = lazy(() => import("./pages/admin/AdminBusinessContent").then((module) => ({ default: () => <module.AdminBusinessEditor module="blog_posts" /> })));
const AdminMediaLibrary = lazy(() => import("./pages/admin/AdminMediaLibrary"));
const AdminSeoManager = lazy(() => import("./pages/admin/AdminSeoManager"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminHomeSections = lazy(() => import("./pages/admin/AdminSimpleCms").then((module) => ({ default: () => <module.default module="home_sections" /> })));
const AdminFaqs = lazy(() => import("./pages/admin/AdminSimpleCms").then((module) => ({ default: () => <module.default module="faqs" /> })));
const AdminBeforeAfter = lazy(() => import("./pages/admin/AdminSimpleCms").then((module) => ({ default: () => <module.default module="before_after_items" /> })));
const AdminBrandPartners = lazy(() => import("./pages/admin/AdminSimpleCms").then((module) => ({ default: () => <module.default module="brand_partners" /> })));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppShell = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHomeRoute = /^\/(en|zh)\/?$/.test(location.pathname);

  return (
    <>
      <DynamicBrandHead />
      <ScrollToTop />
      {!isAdminRoute && (
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg">
          {language === "zh" ? "跳到主要内容" : "Skip to main content"}
        </a>
      )}
      {!isAdminRoute && <Navbar />}
      <div id="main-content" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<RootLanguageRedirect />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminWebsiteSettings /></AdminRoute>} />
            <Route path="/admin/leads" element={<AdminRoute><AdminLeadList /></AdminRoute>} />
            <Route path="/admin/leads/:id" element={<AdminRoute><AdminLeadDetail /></AdminRoute>} />
            <Route path="/admin/quotes" element={<AdminRoute><AdminQuoteList /></AdminRoute>} />
            <Route path="/admin/quotes/:id" element={<AdminRoute><AdminQuoteDetail /></AdminRoute>} />
            <Route path="/admin/home" element={<AdminRoute><AdminHomeSections /></AdminRoute>} />
            <Route path="/admin/about" element={<AdminRoute><AdminComingSoon /></AdminRoute>} />
            <Route path="/admin/faqs" element={<AdminRoute><AdminFaqs /></AdminRoute>} />
            <Route path="/admin/before-after" element={<AdminRoute><AdminBeforeAfter /></AdminRoute>} />
            <Route path="/admin/brand-partners" element={<AdminRoute><AdminBrandPartners /></AdminRoute>} />
            <Route path="/admin/services" element={<AdminRoute><AdminBusinessContent /></AdminRoute>} />
            <Route path="/admin/services/new" element={<AdminRoute><AdminServiceEditor /></AdminRoute>} />
            <Route path="/admin/services/:id" element={<AdminRoute><AdminServiceEditor /></AdminRoute>} />
            <Route path="/admin/projects" element={<AdminRoute><AdminProjectList /></AdminRoute>} />
            <Route path="/admin/projects/new" element={<AdminRoute><AdminProjectEditor /></AdminRoute>} />
            <Route path="/admin/projects/:id" element={<AdminRoute><AdminProjectEditor /></AdminRoute>} />
            <Route path="/admin/materials" element={<AdminRoute><AdminMaterialList /></AdminRoute>} />
            <Route path="/admin/materials/new" element={<AdminRoute><AdminMaterialEditor /></AdminRoute>} />
            <Route path="/admin/materials/:id" element={<AdminRoute><AdminMaterialEditor /></AdminRoute>} />
            <Route path="/admin/blog" element={<AdminRoute><AdminBlogList /></AdminRoute>} />
            <Route path="/admin/blog/new" element={<AdminRoute><AdminBlogEditor /></AdminRoute>} />
            <Route path="/admin/blog/:id" element={<AdminRoute><AdminBlogEditor /></AdminRoute>} />
            <Route path="/admin/media" element={<AdminRoute><AdminMediaLibrary /></AdminRoute>} />
            <Route path="/admin/seo" element={<AdminRoute><AdminSeoManager /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotificationSettings /></AdminRoute>} />
            <Route path="/admin/content/leads" element={<Navigate to="/admin/leads" replace />} />
            <Route path="/admin/content/leads/:id" element={<Navigate to="/admin/leads" replace />} />
            <Route path="/admin/content/quote_requests" element={<Navigate to="/admin/quotes" replace />} />
            <Route path="/admin/content/quote_requests/:id" element={<Navigate to="/admin/quotes" replace />} />
            <Route path="/admin/content/translation_jobs" element={<AdminRoute><AdminTranslationJobs /></AdminRoute>} />
            <Route path="/admin/content/translation_jobs/:id" element={<AdminRoute><AdminTranslationJobs /></AdminRoute>} />
            <Route path="/admin/content/:type/:id?" element={<AdminRoute><AdminContentEditor /></AdminRoute>} />
            <Route path="/:lang" element={<><LanguageRouteSync /><Index /></>} />
            <Route path="/:lang/about" element={<><LanguageRouteSync /><About /></>} />
            <Route path="/:lang/services" element={<><LanguageRouteSync /><Services /></>} />
            <Route path="/:lang/services/old-house" element={<><LanguageRouteSync /><OldHouseRenovation /></>} />
            <Route path="/:lang/services/:slug" element={<><LanguageRouteSync /><ServiceDetail /></>} />
            <Route path="/:lang/materials" element={<><LanguageRouteSync /><Materials /></>} />
            <Route path="/:lang/materials/category/:categorySlug" element={<><LanguageRouteSync /><MaterialCategoryPage /></>} />
            <Route path="/:lang/materials/category/:categorySlug/:subcategorySlug" element={<><LanguageRouteSync /><MaterialSubcategoryPage /></>} />
            <Route path="/:lang/materials/:slug" element={<><LanguageRouteSync /><MaterialDetail /></>} />
            <Route path="/:lang/projects" element={<><LanguageRouteSync /><Projects /></>} />
            <Route path="/:lang/projects/:slug" element={<><LanguageRouteSync /><ProjectDetail /></>} />
            <Route path="/:lang/process" element={<><LanguageRouteSync /><Process /></>} />
            <Route path="/:lang/faq" element={<><LanguageRouteSync /><FAQ /></>} />
            <Route path="/:lang/contact" element={<><LanguageRouteSync /><Contact /></>} />
            <Route path="/:lang/quote" element={<><LanguageRouteSync /><Quote /></>} />
            <Route path="/:lang/blog" element={<><LanguageRouteSync /><Blog /></>} />
            <Route path="/:lang/blog/:slug" element={<><LanguageRouteSync /><BlogDetail /></>} />
            <Route path="/:lang/locations/:slug" element={<><LanguageRouteSync /><LocationPage /></>} />
            <Route path="/:lang/landing/:slug" element={<><LanguageRouteSync /><LandingPage /></>} />
            <Route path="/:lang/privacy" element={<><LanguageRouteSync /><Privacy /></>} />
            <Route path="/:lang/terms" element={<><LanguageRouteSync /><Terms /></>} />
            <Route path="/about" element={<LegacyLanguageRedirect />} />
            <Route path="/services/*" element={<LegacyLanguageRedirect />} />
            <Route path="/materials/*" element={<LegacyLanguageRedirect />} />
            <Route path="/projects/*" element={<LegacyLanguageRedirect />} />
            <Route path="/process" element={<LegacyLanguageRedirect />} />
            <Route path="/faq" element={<LegacyLanguageRedirect />} />
            <Route path="/contact" element={<LegacyLanguageRedirect />} />
            <Route path="/quote" element={<LegacyLanguageRedirect />} />
            <Route path="/blog/*" element={<LegacyLanguageRedirect />} />
            <Route path="/locations/*" element={<LegacyLanguageRedirect />} />
            <Route path="/landing/*" element={<LegacyLanguageRedirect />} />
            <Route path="/privacy" element={<LegacyLanguageRedirect />} />
            <Route path="/terms" element={<LegacyLanguageRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && !isHomeRoute && <FloatingCTA />}
    </>
  );
};

const App = () => (
  <LanguageProvider>
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </LanguageProvider>
);

export default App;
