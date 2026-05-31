import { lazy } from "react";
import { Route } from "react-router-dom";
import { LanguageRouteSync, LegacyLanguageRedirect, RootLanguageRedirect } from "@/components/LanguageRouteSync";
import Index from "@/pages/Index";
import FAQ from "@/pages/FAQ";

const About = lazy(() => import("@/pages/About"));
const Services = lazy(() => import("@/pages/Services"));
const ServiceDetail = lazy(() => import("@/pages/ServiceDetail"));
const Materials = lazy(() => import("@/pages/Materials"));
const MaterialCategoryPage = lazy(() => import("@/pages/MaterialCategoryPage"));
const MaterialSubcategoryPage = lazy(() => import("@/pages/MaterialSubcategoryPage"));
const MaterialDetail = lazy(() => import("@/pages/MaterialDetail"));
const Projects = lazy(() => import("@/pages/Projects"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const Process = lazy(() => import("@/pages/Process"));
const Contact = lazy(() => import("@/pages/Contact"));
const Quote = lazy(() => import("@/pages/Quote"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogDetail = lazy(() => import("@/pages/BlogDetail"));
const LocationPage = lazy(() => import("@/pages/LocationPage"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const CmsDynamicPage = lazy(() => import("@/pages/CmsDynamicPage"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const OldHouseRenovation = lazy(() => import("@/pages/OldHouseRenovation"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const withLanguageSync = (page: JSX.Element) => (
  <>
    <LanguageRouteSync />
    {page}
  </>
);

export const publicRoutes = (
  <>
    <Route path="/" element={<RootLanguageRedirect />} />
    <Route path="/:lang" element={withLanguageSync(<Index />)} />
    <Route path="/:lang/about" element={withLanguageSync(<About />)} />
    <Route path="/:lang/services" element={withLanguageSync(<Services />)} />
    <Route path="/:lang/services/old-house" element={withLanguageSync(<OldHouseRenovation />)} />
    <Route path="/:lang/services/:slug" element={withLanguageSync(<ServiceDetail />)} />
    <Route path="/:lang/materials" element={withLanguageSync(<Materials />)} />
    <Route path="/:lang/materials/category/:categorySlug" element={withLanguageSync(<MaterialCategoryPage />)} />
    <Route path="/:lang/materials/category/:categorySlug/:subcategorySlug" element={withLanguageSync(<MaterialSubcategoryPage />)} />
    <Route path="/:lang/materials/:slug" element={withLanguageSync(<MaterialDetail />)} />
    <Route path="/:lang/projects" element={withLanguageSync(<Projects />)} />
    <Route path="/:lang/projects/:slug" element={withLanguageSync(<ProjectDetail />)} />
    <Route path="/:lang/process" element={withLanguageSync(<Process />)} />
    <Route path="/:lang/faq" element={withLanguageSync(<FAQ />)} />
    <Route path="/:lang/contact" element={withLanguageSync(<Contact />)} />
    <Route path="/:lang/quote" element={withLanguageSync(<Quote />)} />
    <Route path="/:lang/blog" element={withLanguageSync(<Blog />)} />
    <Route path="/:lang/blog/:slug" element={withLanguageSync(<BlogDetail />)} />
    <Route path="/:lang/locations/:slug" element={withLanguageSync(<LocationPage />)} />
    <Route path="/:lang/landing/:slug" element={withLanguageSync(<LandingPage />)} />
    <Route path="/:lang/privacy" element={withLanguageSync(<Privacy />)} />
    <Route path="/:lang/terms" element={withLanguageSync(<Terms />)} />
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
    <Route path="/:lang/*" element={withLanguageSync(<CmsDynamicPage />)} />
    <Route path="*" element={<NotFound />} />
  </>
);
