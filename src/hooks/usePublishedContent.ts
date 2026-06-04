import { useQuery } from "@tanstack/react-query";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  getPublishedHeroSlides,
  getPublishedLandingPageBySlug,
  getPublishedMaterialBySlug,
  getPublishedMaterials,
  getPublishedProjectBySlug,
  getPublishedProjectSummaries,
  getPublishedServiceBySlug,
  getPublishedServiceAreaBySlug,
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
import { isSupabaseConfigured } from "@/lib/supabase";

const STALE = 5 * 60 * 1000;
const GC = 30 * 60 * 1000;

const queryDefaults = {
  staleTime: STALE,
  gcTime: GC,
  refetchOnWindowFocus: false as const,
};

type PublicQueryOptions = {
  enabled?: boolean;
};

const isEnabled = (options?: PublicQueryOptions) => options?.enabled ?? true;
const isSupabaseQueryEnabled = (options?: PublicQueryOptions) => isEnabled(options) && isSupabaseConfigured;

export function usePublishedHomeContentBundle(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "home_bundle", language],
    queryFn: () => getPublishedHomeContentBundle(language),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedServices(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "services", language],
    queryFn: () => getPublishedServices(language),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedServiceSummaries(language: "en" | "zh", limit?: number, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "service_summaries", language, limit ?? "all"],
    queryFn: () => getPublishedServiceSummaries(language, limit),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedProjectSummaries(language: "en" | "zh", limit?: number, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "project_summaries", language, limit ?? "all"],
    queryFn: () => getPublishedProjectSummaries(language, limit),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedMaterials(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "materials", language],
    queryFn: () => getPublishedMaterials(language),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedBlogPosts(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "blog", language],
    queryFn: () => getPublishedBlogPosts(language),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedFaqs(language: "en" | "zh", pageKey = "general", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "faqs", language, pageKey],
    queryFn: () => getPublishedFaqs(language, pageKey),
    enabled: isEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedHeroSlides(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "hero_slides", language],
    queryFn: () => getPublishedHeroSlides(language),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedTestimonials(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "testimonials", language],
    queryFn: () => getPublishedTestimonials(language),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedBrandPartners(options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "brand_partners"],
    queryFn: () => getPublishedBrandPartners(),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedBeforeAfterItems(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "before_after", language],
    queryFn: () => getPublishedBeforeAfterItems(language),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedHomeSection(language: "en" | "zh", sectionKey: string, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "home_section", language, sectionKey],
    queryFn: () => getPublishedHomeSection(language, sectionKey),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedProcessSteps(language: "en" | "zh", options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "process_steps", language],
    queryFn: () => getPublishedProcessSteps(language),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedCtaBlock(language: "en" | "zh", blockKey: string, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "cta", language, blockKey],
    queryFn: () => getPublishedCtaBlock(language, blockKey),
    enabled: isSupabaseQueryEnabled(options),
    retry: false,
    ...queryDefaults,
  });
}

export function usePublishedAboutSection(language: "en" | "zh", sectionKey: string, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "about_section", language, sectionKey],
    queryFn: () => getPublishedAboutSection(language, sectionKey),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedSitePage(language: "en" | "zh", pageKey: string, options?: PublicQueryOptions) {
  return useQuery({
    queryKey: ["published", "site_page", language, pageKey],
    queryFn: () => getPublishedSitePage(language, pageKey),
    enabled: isSupabaseQueryEnabled(options),
    ...queryDefaults,
  });
}

export function usePublishedProjectBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "project", slug, language],
    queryFn: () => getPublishedProjectBySlug(slug!, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedMaterialBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "material", slug, language],
    queryFn: () => getPublishedMaterialBySlug(slug!, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedBlogPostBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "blog_post", slug, language],
    queryFn: () => getPublishedBlogPostBySlug(slug!, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedServiceAreaBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "service_area", slug, language],
    queryFn: () => getPublishedServiceAreaBySlug(slug!, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedServiceBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "service", slug, language],
    queryFn: () => getPublishedServiceBySlug(slug!, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}

export function usePublishedLandingPageBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "landing", slug, language],
    queryFn: () => getPublishedLandingPageBySlug(slug!, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}
