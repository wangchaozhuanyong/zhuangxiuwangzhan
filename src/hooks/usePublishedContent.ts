import "@/lib/publicQuerySeed";
import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { useQueryClient } from "@tanstack/react-query";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
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
  getPublishedCtaBlock,
  getPublishedFaqs,
  getPublishedHomeContentBundle,
  getPublishedHomeSection,
  getPublishedProcessSteps,
  getPublishedSitePage,
} from "@/lib/homeContentApi";
import { isSupabaseConfigured } from "@/lib/supabaseConfig";
import { getPublishedFurnitureCatalog, getPublishedFurnitureProductBySlug, getPublishedManagedFurnitureProductBySlug, getPublishedManagedFurnitureProducts } from "@/lib/furnitureCatalog";
import { INTERACTION_POLICY } from "@/lib/interactionPolicy";

const STALE = INTERACTION_POLICY.publicStaleTime;
const GC = INTERACTION_POLICY.gcTime;

const queryDefaults = {
  staleTime: STALE,
  gcTime: GC,
  refetchOnWindowFocus: true as const,
};

type PublicQueryOptions = {
  enabled?: boolean;
};

const isEnabled = (options?: PublicQueryOptions) => options?.enabled ?? true;
const isSupabaseQueryEnabled = (options?: PublicQueryOptions) => isEnabled(options) && isSupabaseConfigured;

export function usePublishedHomeContentBundle(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "home_bundle", language],
    queryFn: ({ signal }) => getPublishedHomeContentBundle(language, signal),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedServices(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "services", language],
    queryFn: ({ signal }) => getPublishedServices(language, signal),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedServiceSummaries(language: "en" | "zh", limit?: number, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "service_summaries", language, limit ?? "all"],
    queryFn: ({ signal }) => getPublishedServiceSummaries(language, limit, signal),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedProjectSummaries(language: "en" | "zh", limit?: number, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "project_summaries", language, limit ?? "all"],
    queryFn: ({ signal }) => getPublishedProjectSummaries(language, limit, signal),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedMaterials(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "materials", language],
    queryFn: ({ signal }) => getPublishedMaterials(language, signal),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedManagedFurnitureProducts(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "furniture", language],
    queryFn: ({ signal }) => getPublishedManagedFurnitureProducts(language, signal),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedFurnitureCatalog(language: "en" | "zh") {
  return useQuery({ queryKey: ["published", "furniture_catalog", language],
    queryFn: ({ signal }) => getPublishedFurnitureCatalog(language, signal), ...queryDefaults });
}

export function usePublishedFurnitureProduct(slug: string | undefined, language: "en" | "zh") {
  return useQuery({ queryKey: ["published", "furniture_catalog", "detail", slug, language],
    queryFn: ({ signal }) => getPublishedFurnitureProductBySlug(slug!, language, signal), enabled: Boolean(slug), ...queryDefaults });
}

export function usePublishedManagedFurnitureProductBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "furniture", "detail", slug, language],
    queryFn: ({ signal }) => getPublishedManagedFurnitureProductBySlug(slug!, language, signal),
    enabled: isSupabaseConfigured && Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedProductHighlights(language: "en" | "zh", limit = 4, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "product_highlights", language, limit],
    queryFn: ({ signal }) => getPublishedProductHighlights(language, limit, signal),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedBlogPosts(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "blog", language],
    queryFn: ({ signal }) => getPublishedBlogPosts(language, signal),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedFaqs(language: "en" | "zh", pageKey = "general", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "faqs", language, pageKey],
    queryFn: ({ signal }) => getPublishedFaqs(language, pageKey, signal),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedHeroSlides(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "hero_slides", language],
    queryFn: ({ signal }) => getPublishedHeroSlides(language, signal),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedTestimonials(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "testimonials", language],
    queryFn: ({ signal }) => getPublishedTestimonials(language, signal),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedBrandPartners(options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "brand_partners"],
    queryFn: ({ signal }) => getPublishedBrandPartners(signal),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedBeforeAfterItems(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "before_after", language],
    queryFn: ({ signal }) => getPublishedBeforeAfterItems(language, signal),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedHomeSection(language: "en" | "zh", sectionKey: string, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "home_section", language, sectionKey],
    queryFn: ({ signal }) => getPublishedHomeSection(language, sectionKey, signal),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedProcessSteps(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "process_steps", language],
    queryFn: ({ signal }) => getPublishedProcessSteps(language, signal),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedCtaBlock(language: "en" | "zh", blockKey: string, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "cta", language, blockKey],
    queryFn: ({ signal }) => getPublishedCtaBlock(language, blockKey, signal),
    enabled: isSupabaseQueryEnabled(options),
    retry: false,
    ...queryDefaults,
  });
}

export function usePublishedAboutSection(language: "en" | "zh", sectionKey: string, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "about_section", language, sectionKey],
    queryFn: ({ signal }) => getPublishedAboutSection(language, sectionKey, signal),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedSitePage(language: "en" | "zh", pageKey: string, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "site_page", language, pageKey],
    queryFn: ({ signal }) => getPublishedSitePage(language, pageKey, signal),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedProjectBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "project", slug, language],
    queryFn: ({ signal }) => getPublishedProjectBySlug(slug!, language, signal),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedMaterialBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "material", slug, language],
    queryFn: ({ signal }) => getPublishedMaterialBySlug(slug!, language, signal),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedBlogPostBySlug(slug: string | undefined, language: "en" | "zh") {
  const queryClient = useQueryClient();
  const listKey = ["published", "blog", language];
  return useQuery({
    queryKey: ["published", "blog_post", slug, language],
    queryFn: ({ signal }) => getPublishedBlogPostBySlug(slug!, language, signal),
    enabled: Boolean(slug),
    // Only complete articles can seed the detail cache. Edge-injected listing
    // summaries have no body and must still fetch the actual article.
    initialData: () => {
      if (queryClient.getQueryState(listKey)?.isInvalidated) return undefined;
      return queryClient
        .getQueryData<Awaited<ReturnType<typeof getPublishedBlogPosts>>>(listKey)
        ?.find((post) => post.slug === slug && Boolean(post.content?.trim()));
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(listKey)?.dataUpdatedAt,
    ...queryDefaults,
  });
}

export function usePublishedServiceAreaBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "service_area", slug, language],
    queryFn: ({ signal }) => getPublishedServiceAreaBySlug(slug!, language, signal),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedServiceAreas(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "service_areas", language],
    queryFn: ({ signal }) => getPublishedServiceAreas(language, signal),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedServiceBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "service", slug, language],
    queryFn: ({ signal }) => getPublishedServiceBySlug(slug!, language, signal),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedLandingPageBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "landing", slug, language],
    queryFn: ({ signal }) => getPublishedLandingPageBySlug(slug!, language, signal),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}
