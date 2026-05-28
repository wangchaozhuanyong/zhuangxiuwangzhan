import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import { LanguageRouteSync, LegacyLanguageRedirect, RootLanguageRedirect } from "@/components/LanguageRouteSync";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";

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
const FAQ = lazy(() => import("./pages/FAQ"));
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
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppShell = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<RootLanguageRedirect />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminWebsiteSettings />} />
          <Route path="/admin/leads" element={<AdminLeadList />} />
          <Route path="/admin/leads/:id" element={<AdminLeadDetail />} />
          <Route path="/admin/quotes" element={<AdminQuoteList />} />
          <Route path="/admin/quotes/:id" element={<AdminQuoteDetail />} />
          <Route path="/admin/home" element={<AdminComingSoon />} />
          <Route path="/admin/about" element={<AdminComingSoon />} />
          <Route path="/admin/faqs" element={<AdminComingSoon />} />
          <Route path="/admin/services" element={<AdminBusinessContent />} />
          <Route path="/admin/services/new" element={<AdminServiceEditor />} />
          <Route path="/admin/services/:id" element={<AdminServiceEditor />} />
          <Route path="/admin/projects" element={<AdminProjectList />} />
          <Route path="/admin/projects/new" element={<AdminProjectEditor />} />
          <Route path="/admin/projects/:id" element={<AdminProjectEditor />} />
          <Route path="/admin/materials" element={<AdminMaterialList />} />
          <Route path="/admin/materials/new" element={<AdminMaterialEditor />} />
          <Route path="/admin/materials/:id" element={<AdminMaterialEditor />} />
          <Route path="/admin/blog" element={<AdminBlogList />} />
          <Route path="/admin/blog/new" element={<AdminBlogEditor />} />
          <Route path="/admin/blog/:id" element={<AdminBlogEditor />} />
          <Route path="/admin/media" element={<AdminMediaLibrary />} />
          <Route path="/admin/seo" element={<AdminComingSoon />} />
          <Route path="/admin/users" element={<AdminComingSoon />} />
          <Route path="/admin/notifications" element={<AdminNotificationSettings />} />
          <Route path="/admin/content/translation_jobs" element={<AdminTranslationJobs />} />
          <Route path="/admin/content/translation_jobs/:id" element={<AdminTranslationJobs />} />
          <Route path="/admin/content/:type/:id?" element={<AdminContentEditor />} />
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
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <FloatingCTA />}
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
