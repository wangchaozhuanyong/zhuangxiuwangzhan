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
  "sort_order",
].join(",");

const applyLimit = <T extends { limit: (count: number) => T }>(query: T, limit?: number) =>
  limit && limit > 0 ? query.limit(limit) : query;

export const hasPublicContentDatabaseClient = () => isSupabaseConfigured;

const getPublicContentClient = async () => {
  if (!isSupabaseConfigured) return null;
  return (await import("@/lib/supabase")).supabase;
};

async function fetchPublishedProjectSummaryRowsBySelect(select: string, limit?: number) {
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
  const { data, error } = await query;
  if (error) return null;
  return data || [];
}

export async function fetchPublishedProjectSummaryRows(limit?: number) {
  return fetchPublishedProjectSummaryRowsBySelect(PROJECT_SUMMARY_SELECT, limit);
}

export async function fetchPublishedProjectSummaryRowsWithContent(limit?: number) {
  return fetchPublishedProjectSummaryRowsBySelect(PROJECT_SUMMARY_WITH_CONTENT_SELECT, limit);
}

export async function fetchPublishedServiceSummaryRows(limit?: number) {
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
  const { data, error } = await query;
  if (error) return null;
  return data || [];
}

export async function fetchPublishedHeroSlideRows() {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function fetchPublishedTestimonialRows() {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function fetchPublishedServiceRows() {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) return null;
  return data || [];
}

export async function fetchPublishedServiceRowBySlug(slug: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("services").select("*").eq("status", "published").eq("slug", slug).maybeSingle();
  if (error) return null;
  return data || null;
}

export async function fetchPublishedProjectRowBySlug(slug: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_images(*)")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data || null;
}

export async function fetchPublishedMaterialRows(limit?: number) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const query = applyLimit(
    supabase.from("materials").select("*").eq("status", "published").order("sort_order"),
    limit,
  );
  const { data, error } = await query;
  if (error) return null;
  return data || [];
}

export async function fetchPublishedMaterialRowBySlug(slug: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  if (!data || !Object.prototype.hasOwnProperty.call(data, "price_mode")) return data || null;

  const { data: gallery, error: galleryError } = await supabase
    .from("material_images")
    .select("*")
    .eq("material_id", data.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return galleryError ? data : { ...data, material_images: gallery || [] };
}

export async function fetchPublishedBlogPostRows() {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("blog_posts").select("*").eq("status", "published").order("published_at", byCreatedAtDesc);
  if (error) return null;
  return data || [];
}

export async function fetchPublishedBlogPostRowBySlug(slug: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("blog_posts").select("*").eq("status", "published").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function fetchPublishedServiceAreaRowBySlug(slug: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("service_areas").select("*").eq("status", "published").eq("slug", slug).maybeSingle();
  if (error) return null;
  return data || null;
}

export async function fetchPublishedServiceAreaRows() {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("service_areas")
    .select("*")
    .eq("status", "published")
    .order("sort_order");
  if (error) return null;
  return data || [];
}

export async function fetchPublishedLandingPageRowBySlug(slug: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("landing_pages").select("*").eq("status", "published").eq("slug", slug).maybeSingle();
  if (error) return null;
  return data || null;
}

export async function fetchPublicHomeBundleData() {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_public_home_bundle");
  if (error) return null;
  return data || null;
}

export async function fetchPublishedBrandPartnerRows() {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("brand_partners")
    .select("id,name,logo_url,website_url")
    .eq("status", "published")
    .order("sort_order");
  if (error) return [];
  return data || [];
}

export async function fetchPublishedBeforeAfterRows() {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("before_after_items").select("*").eq("status", "published").order("sort_order");
  if (error) return [];
  return data || [];
}

export async function fetchPublishedFaqRows(pageKey: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("faqs").select("*").eq("status", "published").eq("page_key", pageKey).order("sort_order");
  if (error) return [];
  return data || [];
}

export async function fetchPublishedHomeSectionRow(sectionKey: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("home_sections")
    .select("*")
    .eq("status", "published")
    .eq("section_key", sectionKey)
    .order("sort_order")
    .limit(1);
  if (error) return null;
  return (data || [])[0] || null;
}

export async function fetchPublishedProcessStepRows() {
  const supabase = await getPublicContentClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("process_steps")
    .select("*")
    .eq("status", "published")
    .order("sort_order")
    .order("step_number");
  if (error) return [];
  return data || [];
}

export async function fetchPublishedCtaBlockRow(blockKey: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("cta_blocks")
    .select("*")
    .eq("status", "published")
    .eq("block_key", blockKey)
    .limit(1);
  if (error) return null;
  return (data || [])[0] || null;
}

export async function fetchPublishedAboutSectionRow(sectionKey: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("about_sections")
    .select("*")
    .eq("status", "published")
    .eq("section_key", sectionKey)
    .order("sort_order")
    .limit(1);
  if (error) return null;
  return (data || [])[0] || null;
}

export async function fetchPublishedLegacySitePageRow(pageKey: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_pages").select("*").eq("status", "published").eq("page_key", pageKey).limit(1);
  if (error) return null;
  return (data || [])[0] || null;
}

export async function fetchPublishedCmsPageByPageKey(pageKey: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*, cms_sections(*)")
    .eq("status", "published")
    .is("deleted_at", null)
    .eq("page_key", pageKey)
    .limit(1);
  if (error) return null;
  return (data || [])[0] || null;
}

export async function fetchPublishedCmsPageByPath(path: string) {
  const supabase = await getPublicContentClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*, cms_sections(*)")
    .eq("status", "published")
    .is("deleted_at", null)
    .eq("path", path)
    .limit(1);
  if (error) throw error;
  return (data || [])[0] || null;
}
