import type { ComponentType } from "react";

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
