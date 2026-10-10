import type { QueryKey } from "@tanstack/react-query";

// Hooks, route prefetch and HTML seed mappers share these cache identities.
// Keep this module free of data readers and static catalog dependencies.
type ParameterName = "language" | "slug" | "limit" | "pageKey" | "sectionKey" | "blockKey" | "path";
export type PublicContentQueryParameters = Partial<Record<ParameterName, unknown>> & { resource: string };

function defineKey(resource: string, dimensions: readonly ParameterName[], prefix: readonly string[] = []) {
  return {
    key: (...values: unknown[]): QueryKey => ["published", resource, ...prefix, ...values],
    read: (key: QueryKey): PublicContentQueryParameters | undefined => {
      if (key[0] !== "published" || key[1] !== resource || key.length !== dimensions.length + prefix.length + 2) return undefined;
      if (prefix.some((value, index) => key[index + 2] !== value)) return undefined;
      const parameters: PublicContentQueryParameters = { resource };
      dimensions.forEach((name, index) => { parameters[name] = key[index + prefix.length + 2]; });
      if (dimensions.includes("language") && parameters.language !== "en" && parameters.language !== "zh") return undefined;
      return parameters;
    },
  };
}

export const publicContentQueryKeys = {
  homeFurniture: defineKey("home_furniture", ["language"]),
  homeJournal: defineKey("home_journal", ["language"]),
  homeServiceAreas: defineKey("home_service_areas", ["language"]),
  homeBundle: defineKey("home_bundle", ["language"]),
  homeOptionalSectionVisibility: defineKey("home_optional_visibility", ["sectionKey"]),
  services: defineKey("services", ["language"]),
  serviceSummaries: defineKey("service_summaries", ["language", "limit"]),
  projectSummaries: defineKey("project_summaries", ["language", "limit"]),
  materials: defineKey("materials", ["language"]),
  managedFurnitureProducts: defineKey("furniture", ["language"]),
  furnitureCatalog: defineKey("furniture_catalog", ["language"]),
  furnitureProduct: defineKey("furniture_catalog", ["slug", "language"], ["detail"]),
  managedFurnitureProduct: defineKey("furniture", ["slug", "language"], ["detail"]),
  productHighlights: defineKey("product_highlights", ["language", "limit"]),
  blogPosts: defineKey("blog", ["language"]),
  faqs: defineKey("faqs", ["language", "pageKey"]),
  heroSlides: defineKey("hero_slides", ["language"]),
  testimonials: defineKey("testimonials", ["language"]),
  brandPartners: defineKey("brand_partners", []),
  beforeAfterItems: defineKey("before_after", ["language"]),
  homeSection: defineKey("home_section", ["language", "sectionKey"]),
  processSteps: defineKey("process_steps", ["language"]),
  ctaBlock: defineKey("cta", ["language", "blockKey"]),
  aboutSection: defineKey("about_section", ["language", "sectionKey"]),
  sitePage: defineKey("site_page", ["language", "pageKey"]),
  project: defineKey("project", ["slug", "language"]),
  material: defineKey("material", ["slug", "language"]),
  blogPost: defineKey("blog_post", ["slug", "language"]),
  serviceArea: defineKey("service_area", ["slug", "language"]),
  serviceAreas: defineKey("service_areas", ["language"]),
  service: defineKey("service", ["slug", "language"]),
  landingPage: defineKey("landing", ["slug", "language"]),
  cmsPage: defineKey("cms_path", ["language", "path"]),
};

export function readPublicContentQueryKey(key: QueryKey): PublicContentQueryParameters | undefined {
  for (const definition of Object.values(publicContentQueryKeys)) {
    const parameters = definition.read(key);
    if (parameters) return parameters;
  }
  return undefined;
}
