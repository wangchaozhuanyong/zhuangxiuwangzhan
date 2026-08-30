import { lazy, type ComponentType } from "react";
import { Navigate, Route, useParams } from "react-router-dom";
import { LanguageRouteSync, LegacyLanguageRedirect, ProductsToMaterialsRedirect, RootLanguageRedirect } from "@/components/LanguageRouteSync";

type PageModule = { default: ComponentType };
type StyleModule = typeof import("*.css");

// Every public route loads the same canonical bundle. Keeping a single module
// prevents route visit order from changing the CSS cascade in the SPA.
const loadPublicPageStyles = () => import("@/styles/routes/public-pages.css");

const lazyPublicPage = (
  loader: () => Promise<PageModule>,
) => lazy(async () => {
  const [pageModule] = await Promise.all([
    loader(),
    loadPublicPageStyles() as Promise<StyleModule>,
  ]);
  return pageModule;
});

const Index = lazyPublicPage(() => import("@/pages/Index"));
const About = lazyPublicPage(() => import("@/pages/About"));
const Services = lazyPublicPage(() => import("@/pages/Services"));
const ServiceDetail = lazyPublicPage(() => import("@/pages/ServiceDetail"));
const Materials = lazyPublicPage(() => import("@/pages/Materials"));
const Promotions = lazyPublicPage(() => import("@/pages/Promotions"));
const Locations = lazyPublicPage(() => import("@/pages/Locations"));
const MaterialCategoryPage = lazyPublicPage(() => import("@/pages/MaterialCategoryPage"));
const MaterialSubcategoryPage = lazyPublicPage(() => import("@/pages/MaterialSubcategoryPage"));
const MaterialDetail = lazyPublicPage(() => import("@/pages/MaterialDetail"));
const Projects = lazyPublicPage(() => import("@/pages/Projects"));
const ProjectDetail = lazyPublicPage(() => import("@/pages/ProjectDetail"));
const BeforeAfter = lazyPublicPage(() => import("@/pages/BeforeAfter"));
const Process = lazyPublicPage(() => import("@/pages/Process"));
const FAQ = lazyPublicPage(() => import("@/pages/FAQ"));
const Contact = lazyPublicPage(() => import("@/pages/Contact"));
const Quote = lazyPublicPage(() => import("@/pages/Quote"));
const Blog = lazyPublicPage(() => import("@/pages/Blog"));
const BlogDetail = lazyPublicPage(() => import("@/pages/BlogDetail"));
const LocationPage = lazyPublicPage(() => import("@/pages/LocationPage"));
const LandingPage = lazyPublicPage(() => import("@/pages/LandingPage"));
const CmsDynamicPage = lazyPublicPage(() => import("@/pages/CmsDynamicPage"));
const Privacy = lazyPublicPage(() => import("@/pages/Privacy"));
const Terms = lazyPublicPage(() => import("@/pages/Terms"));
const OldHouseRenovation = lazyPublicPage(() => import("@/pages/OldHouseRenovation"));

const landingToServiceSlugs: Record<string, string> = {
  "office-renovation": "office-renovation",
  "shop-renovation": "shop-renovation",
  "bathroom-renovation": "bathroom",
  "old-house-renovation": "old-house",
  "custom-built-in": "builtin",
  "warehouse-shelving": "warehouse",
  "kitchen-cabinet": "kitchen",
  "flooring": "flooring",
};
const NotFound = lazyPublicPage(() => import("@/pages/NotFound"));

const withLanguageSync = (page: JSX.Element) => (
  <>
    <LanguageRouteSync />
    {page}
  </>
);

const LandingPageRoute = () => {
  const { lang, slug } = useParams<{ lang: string; slug: string }>();
  const serviceSlug = slug ? landingToServiceSlugs[slug] : null;
  if (serviceSlug && (lang === "en" || lang === "zh")) {
    return <Navigate to={`/${lang}/services/${serviceSlug}`} replace />;
  }
  return withLanguageSync(<LandingPage />);
};

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
    <Route path="/:lang/products" element={<ProductsToMaterialsRedirect />} />
    <Route path="/:lang/products/:slug" element={<ProductsToMaterialsRedirect />} />
    <Route path="/:lang/promotions" element={withLanguageSync(<Promotions />)} />
    <Route path="/:lang/projects" element={withLanguageSync(<Projects />)} />
    <Route path="/:lang/projects/:slug" element={withLanguageSync(<ProjectDetail />)} />
    <Route path="/:lang/before-after" element={withLanguageSync(<BeforeAfter />)} />
    <Route path="/:lang/process" element={withLanguageSync(<Process />)} />
    <Route path="/:lang/faq" element={withLanguageSync(<FAQ />)} />
    <Route path="/:lang/contact" element={withLanguageSync(<Contact />)} />
    <Route path="/:lang/quote" element={withLanguageSync(<Quote />)} />
    <Route path="/:lang/blog" element={withLanguageSync(<Blog />)} />
    <Route path="/:lang/blog/:slug" element={withLanguageSync(<BlogDetail />)} />
    <Route path="/:lang/locations" element={withLanguageSync(<Locations />)} />
    <Route path="/:lang/locations/:slug" element={withLanguageSync(<LocationPage />)} />
    <Route path="/:lang/landing/:slug" element={<LandingPageRoute />} />
    <Route path="/:lang/privacy" element={withLanguageSync(<Privacy />)} />
    <Route path="/:lang/terms" element={withLanguageSync(<Terms />)} />
    <Route path="/about" element={<LegacyLanguageRedirect />} />
    <Route path="/services/*" element={<LegacyLanguageRedirect />} />
    <Route path="/materials/*" element={<LegacyLanguageRedirect />} />
    <Route path="/products/*" element={<LegacyLanguageRedirect />} />
    <Route path="/promotions" element={<LegacyLanguageRedirect />} />
    <Route path="/projects/*" element={<LegacyLanguageRedirect />} />
    <Route path="/before-after" element={<LegacyLanguageRedirect />} />
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
