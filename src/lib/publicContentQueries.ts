import type { QueryKey } from "@tanstack/react-query";
import type { Language } from "@/i18n/routes";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  getPublishedHomeJournal,
  getPublishedHomeServiceAreas,
  getPublishedHeroSlides,
  getPublishedLandingPageBySlug,
  getPublishedMaterialBySlug,
  getPublishedMaterials,
  getPublishedProjectBySlug,
  getPublishedProjectSummaries,
  getPublishedProductHighlights,
  getPublishedServiceBySlug,
  getPublishedServiceAreaBySlug,
  getPublishedServiceAreas,
  getPublishedServiceSummaries,
  getPublishedServices,
  getPublishedTestimonials,
} from "@/lib/contentApi";
import {
  getPublishedBeforeAfterItems,
  getPublishedBrandPartners,
  getPublishedAboutSection,
  getPublishedCmsPageByPath,
  getPublishedCtaBlock,
  getPublishedFaqs,
  getPublishedHomeContentBundle,
  getPublishedHomeSection,
  getPublishedProcessSteps,
  getPublishedSitePage,
} from "@/lib/homeContentApi";
import { getPublishedHomeFurniture, getPublishedFurnitureCatalog, getPublishedFurnitureProductBySlug, getPublishedManagedFurnitureProductBySlug, getPublishedManagedFurnitureProducts } from "@/lib/furnitureCatalog";

// Keys and readers are shared by hooks, route prefetch and HTML cache seeding.
// Only the key shape is decoded here; seed completeness stays in publicQuerySeed.
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

const keys = {
  homeFurniture: defineKey("home_furniture", ["language"]),
  homeJournal: defineKey("home_journal", ["language"]),
  homeServiceAreas: defineKey("home_service_areas", ["language"]),
  homeBundle: defineKey("home_bundle", ["language"]),
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
  for (const definition of Object.values(keys)) {
    const parameters = definition.read(key);
    if (parameters) return parameters;
  }
  return undefined;
}

const query = <T>(queryKey: QueryKey, read: (signal: AbortSignal) => Promise<T>) => ({
  queryKey, queryFn: ({ signal }: { signal: AbortSignal }) => read(signal),
});

export const publicContentQueries = {
  homeFurniture: (language: Language) =>
    query(keys.homeFurniture.key(language), (signal) => getPublishedHomeFurniture(language, signal)),
  homeJournal: (language: Language) =>
    query(keys.homeJournal.key(language), (signal) => getPublishedHomeJournal(language, signal)),
  homeServiceAreas: (language: Language) =>
    query(keys.homeServiceAreas.key(language), (signal) => getPublishedHomeServiceAreas(language, signal)),
  homeBundle: (language: Language) =>
    query(keys.homeBundle.key(language), (signal) => getPublishedHomeContentBundle(language, signal)),
  services: (language: Language) =>
    query(keys.services.key(language), (signal) => getPublishedServices(language, signal)),
  serviceSummaries: (language: Language, limit?: number) =>
    query(keys.serviceSummaries.key(language, limit ?? "all"), (signal) => getPublishedServiceSummaries(language, limit, signal)),
  projectSummaries: (language: Language, limit?: number) =>
    query(keys.projectSummaries.key(language, limit ?? "all"), (signal) => getPublishedProjectSummaries(language, limit, signal)),
  materials: (language: Language) =>
    query(keys.materials.key(language), (signal) => getPublishedMaterials(language, signal)),
  managedFurnitureProducts: (language: Language) =>
    query(keys.managedFurnitureProducts.key(language), (signal) => getPublishedManagedFurnitureProducts(language, signal)),
  furnitureCatalog: (language: Language) =>
    query(keys.furnitureCatalog.key(language), (signal) => getPublishedFurnitureCatalog(language, signal)),
  furnitureProduct: (slug: string | undefined, language: Language) =>
    query(keys.furnitureProduct.key(slug, language), (signal) => getPublishedFurnitureProductBySlug(slug!, language, signal)),
  managedFurnitureProduct: (slug: string | undefined, language: Language) =>
    query(keys.managedFurnitureProduct.key(slug, language), (signal) => getPublishedManagedFurnitureProductBySlug(slug!, language, signal)),
  productHighlights: (language: Language, limit = 4) =>
    query(keys.productHighlights.key(language, limit), (signal) => getPublishedProductHighlights(language, limit, signal)),
  blogPosts: (language: Language) =>
    query(keys.blogPosts.key(language), (signal) => getPublishedBlogPosts(language, signal)),
  faqs: (language: Language, pageKey = "general") =>
    query(keys.faqs.key(language, pageKey), (signal) => getPublishedFaqs(language, pageKey, signal)),
  heroSlides: (language: Language) =>
    query(keys.heroSlides.key(language), (signal) => getPublishedHeroSlides(language, signal)),
  testimonials: (language: Language) =>
    query(keys.testimonials.key(language), (signal) => getPublishedTestimonials(language, signal)),
  brandPartners: () =>
    query(keys.brandPartners.key(), (signal) => getPublishedBrandPartners(signal)),
  beforeAfterItems: (language: Language) =>
    query(keys.beforeAfterItems.key(language), (signal) => getPublishedBeforeAfterItems(language, signal)),
  homeSection: (language: Language, sectionKey: string) =>
    query(keys.homeSection.key(language, sectionKey), (signal) => getPublishedHomeSection(language, sectionKey, signal)),
  processSteps: (language: Language) =>
    query(keys.processSteps.key(language), (signal) => getPublishedProcessSteps(language, signal)),
  ctaBlock: (language: Language, blockKey: string) =>
    query(keys.ctaBlock.key(language, blockKey), (signal) => getPublishedCtaBlock(language, blockKey, signal)),
  aboutSection: (language: Language, sectionKey: string) =>
    query(keys.aboutSection.key(language, sectionKey), (signal) => getPublishedAboutSection(language, sectionKey, signal)),
  sitePage: (language: Language, pageKey: string) =>
    query(keys.sitePage.key(language, pageKey), (signal) => getPublishedSitePage(language, pageKey, signal)),
  project: (slug: string | undefined, language: Language) =>
    query(keys.project.key(slug, language), (signal) => getPublishedProjectBySlug(slug!, language, signal)),
  material: (slug: string | undefined, language: Language) =>
    query(keys.material.key(slug, language), (signal) => getPublishedMaterialBySlug(slug!, language, signal)),
  blogPost: (slug: string | undefined, language: Language) =>
    query(keys.blogPost.key(slug, language), (signal) => getPublishedBlogPostBySlug(slug!, language, signal)),
  serviceArea: (slug: string | undefined, language: Language) =>
    query(keys.serviceArea.key(slug, language), (signal) => getPublishedServiceAreaBySlug(slug!, language, signal)),
  serviceAreas: (language: Language) =>
    query(keys.serviceAreas.key(language), (signal) => getPublishedServiceAreas(language, signal)),
  service: (slug: string | undefined, language: Language) =>
    query(keys.service.key(slug, language), (signal) => getPublishedServiceBySlug(slug!, language, signal)),
  landingPage: (slug: string | undefined, language: Language) =>
    query(keys.landingPage.key(slug, language), (signal) => getPublishedLandingPageBySlug(slug!, language, signal)),
  cmsPage: (language: Language, path: string) =>
    query(keys.cmsPage.key(language, path), (signal) => getPublishedCmsPageByPath(language, path, signal)),
};
