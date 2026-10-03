import { withReadSignal } from "@/lib/readRequest";
import { isSupabaseConfigured } from "@/lib/supabaseConfig";

const byCreatedAtDesc = { ascending: false };

const PROJECT_SUMMARY_SELECT = [
  "id",
  "slug",
  "title_en",
  "title_zh",
  "project_type",
  "location",
  "excerpt_en",
  "excerpt_zh",
  "image_url",
  "sort_order",
  "project_images(id,image_url,image_type,sort_order,alt_en,alt_zh)",
].join(",");

const PROJECT_SUMMARY_WITH_CONTENT_SELECT = [
  "id",
  "slug",
  "title_en",
  "title_zh",
  "project_type",
  "location",
  "excerpt_en",
  "excerpt_zh",
  "content_en",
  "content_zh",
  "image_url",
  "sort_order",
  "project_images(id,image_url,image_type,sort_order,alt_en,alt_zh)",
].join(",");

const SERVICE_SUMMARY_SELECT = [
  "id",
  "slug",
  "title_en",
  "title_zh",
  "excerpt_en",
  "excerpt_zh",
  "content_en",
  "content_zh",
  "image_url",
  "alt_en",
  "alt_zh",
  "sort_order",
].join(",");

const applyLimit = <T extends { limit: (count: number) => T }>(query: T, limit?: number) =>
  limit && limit > 0 ? query.limit(limit) : query;

export const hasPublicContentDatabaseClient = () => isSupabaseConfigured;

const getPublicContentClient = async () => {
  if (!isSupabaseConfigured) return null;
  return (await import("@/lib/supabase")).supabase;
};

async function fetchPublishedProjectSummaryRowsBySelect(select: string, limit?: number, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const query = applyLimit(
    supabase
      .from("projects")
      .select(select)
      .eq("status", "published")
      .order("sort_order", { ascending: true }),
    limit,
  );
  const { data, error } = await withReadSignal(query, signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedProjectSummaryRows(limit?: number, signal?: AbortSignal) {
  return fetchPublishedProjectSummaryRowsBySelect(PROJECT_SUMMARY_SELECT, limit, signal);
}

export async function fetchPublishedProjectSummaryRowsWithContent(limit?: number, signal?: AbortSignal) {
  return fetchPublishedProjectSummaryRowsBySelect(PROJECT_SUMMARY_WITH_CONTENT_SELECT, limit, signal);
}

export async function fetchPublishedServiceSummaryRows(limit?: number, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const query = applyLimit(
    supabase
      .from("services")
      .select(SERVICE_SUMMARY_SELECT)
      .eq("status", "published")
      .order("sort_order", { ascending: true }),
    limit,
  );
  const { data, error } = await withReadSignal(query, signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedHeroSlideRows(signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await withReadSignal(supabase
    .from("hero_slides")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true }), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedTestimonialRows(signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await withReadSignal(supabase
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true }), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedServiceRows(signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("services")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true }), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedServiceRowBySlug(slug: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("services").select("*").eq("status", "published").eq("slug", slug).maybeSingle(), signal);
  if (error) throw error;
  return data || null;
}

export async function fetchPublishedProjectRowBySlug(slug: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("projects")
    .select("*, project_images(*)")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle(), signal);
  if (error) throw error;
  return data || null;
}

export async function fetchPublishedMaterialRows(limit?: number, excludedCategory?: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  let query = supabase.from("materials").select("*").eq("status", "published").order("sort_order");
  if (excludedCategory) query = query.or(`category.is.null,category.neq.${excludedCategory}`);
  query = applyLimit(query, limit);
  const { data, error } = await withReadSignal(query, signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedMaterialRowsByCategory(category: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("materials")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false }), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedMaterialBySlugAndCategory(slug: string, category: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("materials")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .eq("slug", slug)
    .maybeSingle(), signal);
  if (error) throw error;
  if (!data) return null;

  const { data: gallery, error: galleryError } = await withReadSignal(supabase
    .from("material_images")
    .select("image_url,sort_order")
    .eq("material_id", data.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true }), signal);
  return galleryError ? data : { ...data, material_images: gallery || [] };
}

export async function fetchPublishedMaterialRowBySlug(slug: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("materials")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle(), signal);
  if (error) throw error;
  if (!data || !Object.prototype.hasOwnProperty.call(data, "price_mode")) return data || null;

  const { data: gallery, error: galleryError } = await withReadSignal(supabase
    .from("material_images")
    .select("*")
    .eq("material_id", data.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true }), signal);

  return galleryError ? data : { ...data, material_images: gallery || [] };
}

export async function fetchPublishedBlogPostRows(signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("blog_posts").select("*").eq("status", "published").order("published_at", byCreatedAtDesc), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedBlogPostRowBySlug(slug: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("blog_posts").select("*").eq("status", "published").eq("slug", slug).maybeSingle(), signal);
  if (error) throw error;
  return data || null;
}

export async function fetchPublishedServiceAreaRowBySlug(slug: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("service_areas").select("*").eq("status", "published").eq("slug", slug).maybeSingle(), signal);
  if (error) throw error;
  return data || null;
}

export async function fetchPublishedServiceAreaRows(signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("service_areas")
    .select("*")
    .eq("status", "published")
    .order("sort_order"), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedLandingPageRowBySlug(slug: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("landing_pages").select("*").eq("status", "published").eq("slug", slug).maybeSingle(), signal);
  if (error) throw error;
  return data || null;
}

export async function fetchPublicHomeBundleData(signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.rpc("get_public_home_bundle"), signal);
  if (error) throw error;
  return data || null;
}

export async function fetchPublishedBrandPartnerRows(signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await withReadSignal(supabase
    .from("brand_partners")
    .select("id,name,logo_url,website_url")
    .eq("status", "published")
    .order("sort_order"), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedBeforeAfterRows(signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await withReadSignal(supabase.from("before_after_items").select("*").eq("status", "published").order("sort_order"), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedFaqRows(pageKey: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await withReadSignal(supabase.from("faqs").select("*").eq("status", "published").eq("page_key", pageKey).order("sort_order"), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedHomeSectionRow(sectionKey: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("home_sections")
    .select("*")
    .eq("status", "published")
    .eq("section_key", sectionKey)
    .order("sort_order")
    .limit(1), signal);
  if (error) throw error;
  return (data || [])[0] || null;
}

export async function fetchPublishedProcessStepRows(signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await withReadSignal(supabase
    .from("process_steps")
    .select("*")
    .eq("status", "published")
    .order("sort_order")
    .order("step_number"), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchPublishedCtaBlockRow(blockKey: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("cta_blocks")
    .select("*")
    .eq("status", "published")
    .eq("block_key", blockKey)
    .limit(1), signal);
  if (error) throw error;
  return (data || [])[0] || null;
}

export async function fetchPublishedAboutSectionRow(sectionKey: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("about_sections")
    .select("*")
    .eq("status", "published")
    .eq("section_key", sectionKey)
    .order("sort_order")
    .limit(1), signal);
  if (error) throw error;
  return (data || [])[0] || null;
}

export async function fetchPublishedLegacySitePageRow(pageKey: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("site_pages").select("*").eq("status", "published").eq("page_key", pageKey).limit(1), signal);
  if (error) throw error;
  return (data || [])[0] || null;
}

export async function fetchPublishedCmsPageByPageKey(pageKey: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("cms_pages")
    .select("*, cms_sections(*)")
    .eq("status", "published")
    .is("deleted_at", null)
    .eq("page_key", pageKey)
    .limit(1), signal);
  if (error) throw error;
  return (data || [])[0] || null;
}

export async function fetchPublishedCmsPageByPath(path: string, signal?: AbortSignal) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase
    .from("cms_pages")
    .select("*, cms_sections(*)")
    .eq("status", "published")
    .is("deleted_at", null)
    .eq("path", path)
    .limit(1), signal);
  if (error) throw error;
  return (data || [])[0] || null;
}
