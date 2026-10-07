import "@/lib/publicQuerySeed";
import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { useQueryClient } from "@tanstack/react-query";
import { publicContentQueries } from "@/lib/publicContentQueries";
import type { getPublishedBlogPosts } from "@/lib/contentApi";
import { isSupabaseConfigured } from "@/lib/supabaseConfig";
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

export function usePublishedHomeFurniture(language: "en" | "zh") {
  return useQuery({ ...publicContentQueries.homeFurniture(language), ...queryDefaults });
}

export function usePublishedHomeJournal(language: "en" | "zh") {
  return useQuery({ ...publicContentQueries.homeJournal(language), ...queryDefaults });
}

export function usePublishedHomeServiceAreas(language: "en" | "zh") {
  return useQuery({ ...publicContentQueries.homeServiceAreas(language), ...queryDefaults });
}

export function usePublishedHomeContentBundle(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.homeBundle(language),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedServices(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.services(language),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedServiceSummaries(language: "en" | "zh", limit?: number, options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.serviceSummaries(language, limit),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedProjectSummaries(language: "en" | "zh", limit?: number, options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.projectSummaries(language, limit),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedMaterials(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.materials(language),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedManagedFurnitureProducts(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.managedFurnitureProducts(language),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedFurnitureCatalog(language: "en" | "zh") {
  return useQuery({ ...publicContentQueries.furnitureCatalog(language), ...queryDefaults });
}

export function usePublishedFurnitureProduct(slug: string | undefined, language: "en" | "zh") {
  return useQuery({ ...publicContentQueries.furnitureProduct(slug, language), enabled: Boolean(slug), ...queryDefaults });
}

export function usePublishedManagedFurnitureProductBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    ...publicContentQueries.managedFurnitureProduct(slug, language),
    enabled: isSupabaseConfigured && Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedProductHighlights(language: "en" | "zh", limit = 4, options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.productHighlights(language, limit),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedBlogPosts(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.blogPosts(language),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedFaqs(language: "en" | "zh", pageKey = "general", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.faqs(language, pageKey),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedHeroSlides(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.heroSlides(language),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedTestimonials(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.testimonials(language),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedBrandPartners(options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.brandPartners(),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedBeforeAfterItems(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.beforeAfterItems(language),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedHomeSection(language: "en" | "zh", sectionKey: string, options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.homeSection(language, sectionKey),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedProcessSteps(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.processSteps(language),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedCtaBlock(language: "en" | "zh", blockKey: string, options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.ctaBlock(language, blockKey),
    enabled: isSupabaseQueryEnabled(options),
    retry: false,
    ...queryDefaults,
  });
}

export function usePublishedAboutSection(language: "en" | "zh", sectionKey: string, options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.aboutSection(language, sectionKey),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedSitePage(language: "en" | "zh", pageKey: string, options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.sitePage(language, pageKey),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedProjectBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    ...publicContentQueries.project(slug, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedMaterialBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    ...publicContentQueries.material(slug, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedBlogPostBySlug(slug: string | undefined, language: "en" | "zh") {
  const queryClient = useQueryClient();
  const listKey = publicContentQueries.blogPosts(language).queryKey;
  return useQuery({
    ...publicContentQueries.blogPost(slug, language),
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
    ...publicContentQueries.serviceArea(slug, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedServiceAreas(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    ...publicContentQueries.serviceAreas(language),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedServiceBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    ...publicContentQueries.service(slug, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedLandingPageBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    ...publicContentQueries.landingPage(slug, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}
