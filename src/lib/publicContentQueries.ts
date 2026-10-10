import type { QueryKey } from "@tanstack/react-query";
import type { Language } from "@/i18n/routes";
import type { OptionalHomeSection } from "./homeOptionalSections";
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
  getPublishedHomeOptionalSectionVisibility,
  getPublishedProcessSteps,
  getPublishedSitePage,
} from "@/lib/homeContentApi";

import { publicContentQueryKeys as keys } from "./publicContentQueryKeys";
export { readPublicContentQueryKey } from "./publicContentQueryKeys";
export type { PublicContentQueryParameters } from "./publicContentQueryKeys";

const query = <T>(queryKey: QueryKey, read: (signal: AbortSignal) => Promise<T>) => ({
  queryKey, queryFn: ({ signal }: { signal: AbortSignal }) => read(signal),
});

export const publicContentQueries = {
  homeFurniture: (language: Language) =>
    query(keys.homeFurniture.key(language), (signal) => import("./furnitureCatalog").then(({ getPublishedHomeFurniture }) => getPublishedHomeFurniture(language, signal))),
  homeJournal: (language: Language) =>
    query(keys.homeJournal.key(language), (signal) => getPublishedHomeJournal(language, signal)),
  homeServiceAreas: (language: Language) =>
    query(keys.homeServiceAreas.key(language), (signal) => getPublishedHomeServiceAreas(language, signal)),
  homeBundle: (language: Language) =>
    query(keys.homeBundle.key(language), (signal) => getPublishedHomeContentBundle(language, signal)),
  homeOptionalSectionVisibility: (sectionKey: OptionalHomeSection) =>
    query(keys.homeOptionalSectionVisibility.key(sectionKey), (signal) => getPublishedHomeOptionalSectionVisibility(sectionKey, signal)),
  services: (language: Language) =>
    query(keys.services.key(language), (signal) => getPublishedServices(language, signal)),
  serviceSummaries: (language: Language, limit?: number) =>
    query(keys.serviceSummaries.key(language, limit ?? "all"), (signal) => getPublishedServiceSummaries(language, limit, signal)),
  projectSummaries: (language: Language, limit?: number) =>
    query(keys.projectSummaries.key(language, limit ?? "all"), (signal) => getPublishedProjectSummaries(language, limit, signal)),
  materials: (language: Language) =>
    query(keys.materials.key(language), (signal) => getPublishedMaterials(language, signal)),
  managedFurnitureProducts: (language: Language) =>
    query(keys.managedFurnitureProducts.key(language), (signal) => import("./furnitureCatalog").then(({ getPublishedManagedFurnitureProducts }) => getPublishedManagedFurnitureProducts(language, signal))),
  furnitureCatalog: (language: Language) =>
    query(keys.furnitureCatalog.key(language), (signal) => import("./furnitureCatalog").then(({ getPublishedFurnitureCatalog }) => getPublishedFurnitureCatalog(language, signal))),
  furnitureProduct: (slug: string | undefined, language: Language) =>
    query(keys.furnitureProduct.key(slug, language), (signal) => import("./furnitureCatalog").then(({ getPublishedFurnitureProductBySlug }) => getPublishedFurnitureProductBySlug(slug!, language, signal))),
  managedFurnitureProduct: (slug: string | undefined, language: Language) =>
    query(keys.managedFurnitureProduct.key(slug, language), (signal) => import("./furnitureCatalog").then(({ getPublishedManagedFurnitureProductBySlug }) => getPublishedManagedFurnitureProductBySlug(slug!, language, signal))),
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
