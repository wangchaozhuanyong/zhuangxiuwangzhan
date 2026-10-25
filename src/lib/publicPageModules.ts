import type { ComponentType } from "react";
import { getLanguageFromPath, stripLanguagePrefix } from "@/i18n/routes";

type PageModule = { default: ComponentType };

// Keep one canonical CSS bundle, including when an intended route is warmed
// before navigation. Visit order must not change the public style cascade.
const loadPublicPageStyles = () => import("@/styles/routes/public-pages.css");

/** Share successful/in-flight imports with React.lazy without retaining a
 * failed speculative request as the result of a later real navigation. */
export function createPublicPageLoader(
  loadPage: () => Promise<PageModule>,
  loadStyles: () => Promise<unknown> = loadPublicPageStyles,
) {
  let pending: Promise<PageModule> | undefined;
  return () => {
    if (!pending) {
      pending = Promise.all([loadPage(), loadStyles()])
        .then(([page]) => page)
        .catch((error: unknown) => {
          pending = undefined;
          throw error;
        });
    }
    return pending;
  };
}

// This registry is shared by route rendering and intent-based prefetch. These
// are dynamic imports: creating the registry does not download every page.
export const publicPageModules = {
  Index: createPublicPageLoader(() => import("@/pages/Index")),
  About: createPublicPageLoader(() => import("@/pages/About")),
  Services: createPublicPageLoader(() => import("@/pages/Services")),
  ServiceDetail: createPublicPageLoader(() => import("@/pages/ServiceDetail")),
  Materials: createPublicPageLoader(() => import("@/pages/Materials")),
  FurnitureShowcase: createPublicPageLoader(() => import("@/pages/FurnitureShowcase")),
  FurnitureProductDetail: createPublicPageLoader(() => import("@/pages/FurnitureProductDetail")),
  Promotions: createPublicPageLoader(() => import("@/pages/Promotions")),
  Locations: createPublicPageLoader(() => import("@/pages/Locations")),
  MaterialCategoryPage: createPublicPageLoader(() => import("@/pages/MaterialCategoryPage")),
  MaterialSubcategoryPage: createPublicPageLoader(() => import("@/pages/MaterialSubcategoryPage")),
  MaterialDetail: createPublicPageLoader(() => import("@/pages/MaterialDetail")),
  Projects: createPublicPageLoader(() => import("@/pages/Projects")),
  ProjectDetail: createPublicPageLoader(() => import("@/pages/ProjectDetail")),
  BeforeAfter: createPublicPageLoader(() => import("@/pages/BeforeAfter")),
  Process: createPublicPageLoader(() => import("@/pages/Process")),
  FAQ: createPublicPageLoader(() => import("@/pages/FAQ")),
  Contact: createPublicPageLoader(() => import("@/pages/Contact")),
  Quote: createPublicPageLoader(() => import("@/pages/Quote")),
  Blog: createPublicPageLoader(() => import("@/pages/Blog")),
  BlogDetail: createPublicPageLoader(() => import("@/pages/BlogDetail")),
  LocationPage: createPublicPageLoader(() => import("@/pages/LocationPage")),
  LandingPage: createPublicPageLoader(() => import("@/pages/LandingPage")),
  CmsDynamicPage: createPublicPageLoader(() => import("@/pages/CmsDynamicPage")),
  Privacy: createPublicPageLoader(() => import("@/pages/Privacy")),
  Terms: createPublicPageLoader(() => import("@/pages/Terms")),
  OldHouseRenovation: createPublicPageLoader(() => import("@/pages/OldHouseRenovation")),
  NotFound: createPublicPageLoader(() => import("@/pages/NotFound")),
};

export const landingToServiceSlugs: Record<string, string> = {
  "office-renovation": "office-renovation",
  "shop-renovation": "shop-renovation",
  "bathroom-renovation": "bathroom",
  "old-house-renovation": "old-house",
  "custom-built-in": "builtin",
  "warehouse-shelving": "warehouse",
  "kitchen-cabinet": "kitchen",
  "flooring": "flooring",
};

type PublicPageName = keyof typeof publicPageModules;
const directoryPages: Record<string, PublicPageName> = {
  about: "About", services: "Services", materials: "Materials", products: "Materials",
  furniture: "FurnitureShowcase", promotions: "Promotions", locations: "Locations",
  projects: "Projects", "before-after": "BeforeAfter", process: "Process", faq: "FAQ",
  contact: "Contact", quote: "Quote", blog: "Blog", privacy: "Privacy", terms: "Terms",
};

/** Resolve only known public route shapes; unmatched paths retain the CMS
 * fallback, and admin/external/unprefixed paths never warm public modules. */
export function getPublicPageName(pathname: string): PublicPageName | null {
  if (!getLanguageFromPath(pathname)) return null;
  const segments = stripLanguagePrefix(pathname).split("/").filter(Boolean);
  const [section, slug] = segments;
  if (!segments.length) return "Index";
  if (segments.length === 1) return Object.prototype.hasOwnProperty.call(directoryPages, section)
    ? directoryPages[section] : "CmsDynamicPage";
  if (section === "materials" && slug === "category") {
    if (segments.length === 3) return "MaterialCategoryPage";
    if (segments.length === 4) return "MaterialSubcategoryPage";
  }
  if (section === "furniture") {
    if (slug === "product" && segments.length === 3) return "FurnitureProductDetail";
    if (segments.length <= 3) return "FurnitureShowcase";
  }
  if (segments.length !== 2) return "CmsDynamicPage";
  switch (section) {
    case "services": return slug === "old-house" ? "OldHouseRenovation" : "ServiceDetail";
    case "materials":
    case "products": return "MaterialDetail";
    case "projects": return "ProjectDetail";
    case "blog": return "BlogDetail";
    case "locations": return "LocationPage";
    case "landing": {
      const service = Object.prototype.hasOwnProperty.call(landingToServiceSlugs, slug) ? landingToServiceSlugs[slug] : undefined;
      return service === "old-house" ? "OldHouseRenovation" : service ? "ServiceDetail" : "LandingPage";
    }
    default: return "CmsDynamicPage";
  }
}

export function prefetchPublicPageModule(pathname: string) {
  const page = getPublicPageName(pathname);
  return page ? publicPageModules[page]() : Promise.resolve();
}
