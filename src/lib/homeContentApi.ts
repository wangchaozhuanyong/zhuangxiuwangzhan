import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type PublishedBrandPartner = {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
};

export type PublishedBeforeAfterItem = {
  id: string;
  title: string;
  location: string;
  description: string;
  before_image_url: string;
  after_image_url: string;
  alt: string;
};

export type PublishedFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export type PublishedHomeSection = {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  image_url?: string | null;
  items: any[];
};

export type PublishedProcessStep = {
  id: string;
  step_number: number;
  sort_order?: number;
  title: string;
  description: string;
  icon_key?: string | null;
};

export type PublishedCtaBlock = {
  id: string;
  block_key: string;
  title: string;
  description: string;
  primary_label: string;
  primary_url: string;
  secondary_label: string;
  secondary_url: string;
  image_url?: string | null;
};

export type PublishedAboutSection = {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  image_url?: string | null;
  items: any[];
};

export type PublishedSitePage = {
  id: string;
  page_key: string;
  path: string;
  title: string;
  subtitle: string;
  description: string;
  content: string;
  cta_title: string;
  cta_description: string;
  image_url?: string | null;
  alt: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  items: any[];
};

export const getPublishedBrandPartners = async (): Promise<PublishedBrandPartner[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase!
    .from("brand_partners")
    .select("id,name,logo_url,website_url")
    .eq("status", "published")
    .order("sort_order");

  if (error) return [];
  return data || [];
};

export const getPublishedBeforeAfterItems = async (language: "en" | "zh"): Promise<PublishedBeforeAfterItem[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase!
    .from("before_after_items")
    .select("*")
    .eq("status", "published")
    .order("sort_order");

  if (error) return [];

  return (data || [])
    .filter((item) => item.before_image_url && item.after_image_url)
    .map((item) => ({
      id: item.id,
      title: language === "zh" ? item.title_zh || item.title_en : item.title_en || item.title_zh,
      location: item.location || "",
      description: language === "zh" ? item.description_zh || item.description_en : item.description_en || item.description_zh,
      before_image_url: item.before_image_url,
      after_image_url: item.after_image_url,
      alt: language === "zh" ? item.alt_zh || item.title_zh || item.title_en : item.alt_en || item.title_en || item.title_zh,
    }));
};

export const getPublishedFaqs = async (language: "en" | "zh", pageKey = "general"): Promise<PublishedFaq[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase!
    .from("faqs")
    .select("*")
    .eq("status", "published")
    .eq("page_key", pageKey)
    .order("sort_order");

  if (error) return [];

  return (data || []).map((item) => ({
    id: item.id,
    category: item.page_key || "general",
    question: language === "zh" ? item.question_zh || item.question_en : item.question_en || item.question_zh,
    answer: language === "zh" ? item.answer_zh || item.answer_en : item.answer_en || item.answer_zh,
  }));
};

export const getPublishedHomeSection = async (
  language: "en" | "zh",
  sectionKey: string,
): Promise<PublishedHomeSection | null> => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase!
    .from("home_sections")
    .select("*")
    .eq("status", "published")
    .eq("section_key", sectionKey)
    .order("sort_order")
    .limit(1);
  if (error) return null;
  const row: any = (data || [])[0];
  if (!row) return null;
  return {
    id: row.id,
    section_key: row.section_key,
    title: language === "zh" ? row.title_zh || row.title_en || "" : row.title_en || row.title_zh || "",
    subtitle: language === "zh" ? row.subtitle_zh || row.subtitle_en || "" : row.subtitle_en || row.subtitle_zh || "",
    content: language === "zh" ? row.content_zh || row.content_en || "" : row.content_en || row.content_zh || "",
    image_url: row.image_url,
    items: (language === "zh" ? row.items_zh || row.items_en : row.items_en || row.items_zh) || [],
  };
};

export const getPublishedProcessSteps = async (language: "en" | "zh"): Promise<PublishedProcessStep[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!
    .from("process_steps")
    .select("*")
    .eq("status", "published")
    .order("sort_order")
    .order("step_number");
  if (error) return [];
  return (data || []).map((row: any) => ({
    id: row.id,
    step_number: Number(row.step_number || 0),
    sort_order: Number(row.sort_order ?? row.step_number ?? 0),
    title: language === "zh" ? row.title_zh || row.title_en || "" : row.title_en || row.title_zh || "",
    description: language === "zh" ? row.description_zh || row.description_en || "" : row.description_en || row.description_zh || "",
    icon_key: row.icon_key || null,
  }));
};

export const getPublishedCtaBlock = async (language: "en" | "zh", blockKey: string): Promise<PublishedCtaBlock | null> => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase!
    .from("cta_blocks")
    .select("*")
    .eq("status", "published")
    .eq("block_key", blockKey)
    .limit(1);
  if (error) return null;
  const row: any = (data || [])[0];
  if (!row) return null;
  return {
    id: row.id,
    block_key: row.block_key,
    title: language === "zh" ? row.title_zh || row.title_en || "" : row.title_en || row.title_zh || "",
    description: language === "zh" ? row.description_zh || row.description_en || "" : row.description_en || row.description_zh || "",
    primary_label: language === "zh" ? row.primary_label_zh || row.primary_label_en || "" : row.primary_label_en || row.primary_label_zh || "",
    primary_url: row.primary_url || "/quote",
    secondary_label: language === "zh" ? row.secondary_label_zh || row.secondary_label_en || "" : row.secondary_label_en || row.secondary_label_zh || "",
    secondary_url: row.secondary_url || "",
    image_url: row.image_url || null,
  };
};

export const getPublishedAboutSection = async (
  language: "en" | "zh",
  sectionKey: string,
): Promise<PublishedAboutSection | null> => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase!
    .from("about_sections")
    .select("*")
    .eq("status", "published")
    .eq("section_key", sectionKey)
    .order("sort_order")
    .limit(1);
  if (error) return null;
  const row: any = (data || [])[0];
  if (!row) return null;
  return {
    id: row.id,
    section_key: row.section_key,
    title: language === "zh" ? row.title_zh || row.title_en || "" : row.title_en || row.title_zh || "",
    subtitle: language === "zh" ? row.subtitle_zh || row.subtitle_en || "" : row.subtitle_en || row.subtitle_zh || "",
    content: language === "zh" ? row.content_zh || row.content_en || "" : row.content_en || row.content_zh || "",
    image_url: row.image_url,
    items: (language === "zh" ? row.items_zh || row.items_en : row.items_en || row.items_zh) || [],
  };
};

export const getPublishedSitePage = async (
  language: "en" | "zh",
  pageKey: string,
): Promise<PublishedSitePage | null> => {
  if (!isSupabaseConfigured) return null;
  const legacyResponse = await supabase!
    .from("site_pages")
    .select("*")
    .eq("status", "published")
    .eq("page_key", pageKey)
    .limit(1);
  const row: any = legacyResponse.error ? null : (legacyResponse.data || [])[0];
  const legacy: PublishedSitePage | null = row
    ? {
        id: row.id,
        page_key: row.page_key,
        path: row.path || "",
        title: language === "zh" ? row.title_zh || row.title_en || "" : row.title_en || row.title_zh || "",
        subtitle: language === "zh" ? row.subtitle_zh || row.subtitle_en || "" : row.subtitle_en || row.subtitle_zh || "",
        description: language === "zh" ? row.description_zh || row.description_en || "" : row.description_en || row.description_zh || "",
        content: language === "zh" ? row.content_zh || row.content_en || "" : row.content_en || row.content_zh || "",
        cta_title: language === "zh" ? row.cta_title_zh || row.cta_title_en || "" : row.cta_title_en || row.cta_title_zh || "",
        cta_description: language === "zh" ? row.cta_description_zh || row.cta_description_en || "" : row.cta_description_en || row.cta_description_zh || "",
        image_url: row.image_url || null,
        alt: language === "zh" ? row.alt_zh || row.alt_en || "" : row.alt_en || row.alt_zh || "",
        seo_title: language === "zh" ? row.seo_title_zh || row.seo_title_en || "" : row.seo_title_en || row.seo_title_zh || "",
        seo_description: language === "zh" ? row.seo_description_zh || row.seo_description_en || "" : row.seo_description_en || row.seo_description_zh || "",
        seo_keywords: language === "zh" ? row.seo_keywords_zh || row.seo_keywords_en || "" : row.seo_keywords_en || row.seo_keywords_zh || "",
        items: (language === "zh" ? row.items_zh || row.items_en : row.items_en || row.items_zh) || [],
      }
    : null;

  const cmsResponse = await supabase!
    .from("cms_pages")
    .select("*, cms_sections(*)")
    .eq("status", "published")
    .is("deleted_at", null)
    .eq("page_key", pageKey)
    .limit(1);

  if (cmsResponse.error) return legacy;
  const cmsRow: any = (cmsResponse.data || [])[0];
  if (!cmsRow) return legacy;

  const sections = ((cmsRow.cms_sections || []) as any[])
    .filter((section) => section.status === "published" && !section.deleted_at)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const pickContent = (section: any) => (language === "zh" ? section?.content_zh || section?.content_en : section?.content_en || section?.content_zh) || {};
  const hero = sections.find((section) => String(section.section_type || "").toLowerCase() === "hero" || section.section_key === "hero");
  const richText = sections.find((section) => String(section.section_type || "").toLowerCase() === "rich_text");
  const cta = sections.find((section) => String(section.section_type || "").toLowerCase() === "cta" || String(section.section_key || "").includes("cta"));
  const heroContent = pickContent(hero);
  const richContent = pickContent(richText);
  const ctaContent = pickContent(cta);
  const heroSettings = hero?.settings || {};
  const ctaSettings = cta?.settings || {};

  return {
    id: cmsRow.id,
    page_key: cmsRow.page_key,
    path: cmsRow.path || legacy?.path || "",
    title: (language === "zh" ? cmsRow.title_zh || cmsRow.title_en : cmsRow.title_en || cmsRow.title_zh) || heroContent.title || legacy?.title || "",
    subtitle: heroContent.subtitle || legacy?.subtitle || "",
    description: heroContent.description || heroContent.excerpt || legacy?.description || "",
    content: richContent.content || heroContent.content || legacy?.content || "",
    cta_title: ctaContent.title || ctaSettings.title || legacy?.cta_title || "",
    cta_description: ctaContent.description || ctaSettings.description || legacy?.cta_description || "",
    image_url: heroContent.image_url || heroSettings.image_url || legacy?.image_url || null,
    alt: heroContent.alt || heroSettings.alt || legacy?.alt || "",
    seo_title: (language === "zh" ? cmsRow.seo_title_zh || cmsRow.seo_title_en : cmsRow.seo_title_en || cmsRow.seo_title_zh) || legacy?.seo_title || "",
    seo_description:
      (language === "zh" ? cmsRow.seo_description_zh || cmsRow.seo_description_en : cmsRow.seo_description_en || cmsRow.seo_description_zh) ||
      legacy?.seo_description ||
      "",
    seo_keywords: (language === "zh" ? cmsRow.seo_keywords_zh || cmsRow.seo_keywords_en : cmsRow.seo_keywords_en || cmsRow.seo_keywords_zh) || legacy?.seo_keywords || "",
    items: heroContent.items || richContent.items || legacy?.items || [],
  };
};
