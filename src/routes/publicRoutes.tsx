import { lazy, Suspense } from "react";
import { Navigate, Route, useLocation, useParams } from "react-router-dom";
import { LanguageRouteSync, LegacyLanguageRedirect, ProductsToMaterialsRedirect, RootLanguageRedirect } from "@/components/LanguageRouteSync";
import BlogArticleLoading from "@/components/blocks/BlogArticleLoading";
import { landingToServiceSlugs, publicPageModules } from "@/lib/publicPageModules";

const Index = lazy(publicPageModules.Index);
const About = lazy(publicPageModules.About);
const Services = lazy(publicPageModules.Services);
const ServiceDetail = lazy(publicPageModules.ServiceDetail);
const Materials = lazy(publicPageModules.Materials);
const FurnitureShowcase = lazy(publicPageModules.FurnitureShowcase);
const FurnitureProductDetail = lazy(publicPageModules.FurnitureProductDetail);
const Promotions = lazy(publicPageModules.Promotions);
const Locations = lazy(publicPageModules.Locations);
const MaterialCategoryPage = lazy(publicPageModules.MaterialCategoryPage);
const MaterialSubcategoryPage = lazy(publicPageModules.MaterialSubcategoryPage);
const MaterialDetail = lazy(publicPageModules.MaterialDetail);
const Projects = lazy(publicPageModules.Projects);
const ProjectDetail = lazy(publicPageModules.ProjectDetail);
const BeforeAfter = lazy(publicPageModules.BeforeAfter);
const Process = lazy(publicPageModules.Process);
const FAQ = lazy(publicPageModules.FAQ);
const Contact = lazy(publicPageModules.Contact);
const Quote = lazy(publicPageModules.Quote);
const Blog = lazy(publicPageModules.Blog);
const BlogDetail = lazy(publicPageModules.BlogDetail);
const LocationPage = lazy(publicPageModules.LocationPage);
const LandingPage = lazy(publicPageModules.LandingPage);
const CmsDynamicPage = lazy(publicPageModules.CmsDynamicPage);
const Privacy = lazy(publicPageModules.Privacy);
const Terms = lazy(publicPageModules.Terms);
const OldHouseRenovation = lazy(publicPageModules.OldHouseRenovation);
const NotFound = lazy(publicPageModules.NotFound);

const withLanguageSync = (page: JSX.Element) => (
  <LanguageRouteSync>{page}</LanguageRouteSync>
);

const LandingPageRoute = () => {
  const { lang, slug } = useParams<{ lang: string; slug: string }>();
  const location = useLocation();
  const serviceSlug = slug ? landingToServiceSlugs[slug] : null;
  if (serviceSlug && (lang === "en" || lang === "zh" || lang === "ms")) {
    return <Navigate to={{ pathname: `/${lang}/services/${serviceSlug}`, search: location.search, hash: location.hash }} replace />;
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
    <Route path="/:lang/furniture" element={withLanguageSync(<FurnitureShowcase />)} />
    <Route path="/:lang/furniture/product/:slug" element={withLanguageSync(<FurnitureProductDetail />)} />
    <Route path="/:lang/furniture/:category" element={withLanguageSync(<FurnitureShowcase />)} />
    <Route path="/:lang/furniture/:category/:subcategory" element={withLanguageSync(<FurnitureShowcase />)} />
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
    <Route path="/:lang/blog/:slug" element={withLanguageSync(<Suspense fallback={<BlogArticleLoading />}><BlogDetail /></Suspense>)} />
    <Route path="/:lang/locations" element={withLanguageSync(<Locations />)} />
    <Route path="/:lang/locations/:slug" element={withLanguageSync(<LocationPage />)} />
    <Route path="/:lang/landing/:slug" element={<LandingPageRoute />} />
    <Route path="/:lang/privacy" element={withLanguageSync(<Privacy />)} />
    <Route path="/:lang/terms" element={withLanguageSync(<Terms />)} />
    <Route path="/about" element={<LegacyLanguageRedirect />} />
    <Route path="/services/*" element={<LegacyLanguageRedirect />} />
    <Route path="/materials/*" element={<LegacyLanguageRedirect />} />
    <Route path="/furniture/*" element={<LegacyLanguageRedirect />} />
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
