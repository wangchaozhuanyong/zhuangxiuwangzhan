import { getLanguageFromPath, stripLanguagePrefix } from "@/i18n/routes";
import { landingToServiceSlugs, publicPageModules } from "./publicPageModules";

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

export function prefetchPublicPageModule(pathname: string): Promise<unknown> {
  const page = getPublicPageName(pathname);
  return page ? publicPageModules[page]() : Promise.resolve();
}
