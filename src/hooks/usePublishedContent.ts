import { useQuery } from "@tanstack/react-query";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  getPublishedHeroSlides,
  getPublishedLandingPageBySlug,
  getPublishedMaterialBySlug,
  getPublishedMaterials,
  getPublishedProjectBySlug,
  getPublishedProjects,
  getPublishedServiceAreaBySlug,
  getPublishedServices,
  getPublishedTestimonials,
} from "@/lib/contentApi";
import {
  getPublishedBeforeAfterItems,
  getPublishedBrandPartners,
  getPublishedAboutSection,
  getPublishedCtaBlock,
  getPublishedFaqs,
  getPublishedHomeSection,
  getPublishedProcessSteps,
} from "@/lib/homeContentApi";
import { isSupabaseConfigured } from "@/lib/supabase";

const STALE = 5 * 60 * 1000;
const GC = 30 * 60 * 1000;

const queryDefaults = {
  staleTime: STALE,
  gcTime: GC,
  refetchOnWindowFocus: false as const,
};

export function usePublishedServices(language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "services", language],
    queryFn: () => getPublishedServices(language),
    ...queryDefaults,
  });
}

export function usePublishedProjects(language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "projects", language],
    queryFn: () => getPublishedProjects(language),
    ...queryDefaults,
  });
}

export function usePublishedMaterials(language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "materials", language],
    queryFn: () => getPublishedMaterials(language),
    ...queryDefaults,
  });
}

export function usePublishedBlogPosts(language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "blog", language],
    queryFn: () => getPublishedBlogPosts(language),
    ...queryDefaults,
  });
}

export function usePublishedFaqs(language: "en" | "zh", pageKey = "general") {
  return useQuery({
    queryKey: ["published", "faqs", language, pageKey],
    queryFn: () => getPublishedFaqs(language, pageKey),
    ...queryDefaults,
  });
}

export function usePublishedHeroSlides(language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "hero_slides", language],
    queryFn: () => getPublishedHeroSlides(language),
    enabled: isSupabaseConfigured,
    ...queryDefaults,
  });
}

export function usePublishedTestimonials(language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "testimonials", language],
    queryFn: () => getPublishedTestimonials(language),
    enabled: isSupabaseConfigured,
    ...queryDefaults,
  });
}

export function usePublishedBrandPartners() {
  return useQuery({
    queryKey: ["published", "brand_partners"],
    queryFn: () => getPublishedBrandPartners(),
    enabled: isSupabaseConfigured,
    ...queryDefaults,
  });
}

export function usePublishedBeforeAfterItems(language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "before_after", language],
    queryFn: () => getPublishedBeforeAfterItems(language),
    enabled: isSupabaseConfigured,
    ...queryDefaults,
  });
}

export function usePublishedHomeSection(language: "en" | "zh", sectionKey: string) {
  return useQuery({
    queryKey: ["published", "home_section", language, sectionKey],
    queryFn: () => getPublishedHomeSection(language, sectionKey),
    enabled: isSupabaseConfigured,
    ...queryDefaults,
  });
}

export function usePublishedProcessSteps(language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "process_steps", language],
    queryFn: () => getPublishedProcessSteps(language),
    enabled: isSupabaseConfigured,
    ...queryDefaults,
  });
}

export function usePublishedCtaBlock(language: "en" | "zh", blockKey: string) {
  return useQuery({
    queryKey: ["published", "cta", language, blockKey],
    queryFn: () => getPublishedCtaBlock(language, blockKey),
    enabled: isSupabaseConfigured,
    retry: false,
    ...queryDefaults,
  });
}

export function usePublishedAboutSection(language: "en" | "zh", sectionKey: string) {
  return useQuery({
    queryKey: ["published", "about_section", language, sectionKey],
    queryFn: () => getPublishedAboutSection(language, sectionKey),
    enabled: isSupabaseConfigured,
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

export function usePublishedLandingPageBySlug(slug: string | undefined, language: "en" | "zh") {
  return useQuery({
    queryKey: ["published", "landing", slug, language],
    queryFn: () => getPublishedLandingPageBySlug(slug!, language),
    enabled: Boolean(slug),
    ...queryDefaults,
  });
}
