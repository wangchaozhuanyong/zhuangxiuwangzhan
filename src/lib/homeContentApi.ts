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

const pickLocalizedValue = <T = any>(row: any, field: string, language: "en" | "zh", fallback: T): T => {
  const value = row?.[`${field}_${language}`];
  return value === null || value === undefined || value === "" ? fallback : value;
};

const pickLocalizedText = (row: any, field: string, language: "en" | "zh", fallback = ""): string =>
  String(pickLocalizedValue(row, field, language, fallback) || "");

const pickLocalizedList = <T = any>(row: any, field: string, language: "en" | "zh"): T[] => {
  const value = row?.[`${field}_${language}`];
  return Array.isArray(value) ? value : [];
};

const pickLocalizedObject = (row: any, field: string, language: "en" | "zh"): Record<string, any> => {
  const value = row?.[`${field}_${language}`];
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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
      title: pickLocalizedText(item, "title", language),
      location: item.location || "",
      description: pickLocalizedText(item, "description", language),
      before_image_url: item.before_image_url,
      after_image_url: item.after_image_url,
      alt: pickLocalizedText(item, "alt", language, pickLocalizedText(item, "title", language)),
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
    question: pickLocalizedText(item, "question", language),
    answer: pickLocalizedText(item, "answer", language),
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
    title: pickLocalizedText(row, "title", language),
    subtitle: pickLocalizedText(row, "subtitle", language),
    content: pickLocalizedText(row, "content", language),
    image_url: row.image_url,
    items: pickLocalizedList(row, "items", language),
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
    title: pickLocalizedText(row, "title", language),
    description: pickLocalizedText(row, "description", language),
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
    title: pickLocalizedText(row, "title", language),
    description: pickLocalizedText(row, "description", language),
    primary_label: pickLocalizedText(row, "primary_label", language),
    primary_url: row.primary_url || "/quote",
    secondary_label: pickLocalizedText(row, "secondary_label", language),
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
    title: pickLocalizedText(row, "title", language),
    subtitle: pickLocalizedText(row, "subtitle", language),
    content: pickLocalizedText(row, "content", language),
    image_url: row.image_url,
    items: pickLocalizedList(row, "items", language),
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
        title: pickLocalizedText(row, "title", language),
        subtitle: pickLocalizedText(row, "subtitle", language),
        description: pickLocalizedText(row, "description", language),
        content: pickLocalizedText(row, "content", language),
        cta_title: pickLocalizedText(row, "cta_title", language),
        cta_description: pickLocalizedText(row, "cta_description", language),
        image_url: row.image_url || null,
        alt: pickLocalizedText(row, "alt", language),
        seo_title: pickLocalizedText(row, "seo_title", language),
        seo_description: pickLocalizedText(row, "seo_description", language),
        seo_keywords: pickLocalizedText(row, "seo_keywords", language),
        items: pickLocalizedList(row, "items", language),
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
  const pickContent = (section: any) => pickLocalizedObject(section, "content", language);
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
    title: pickLocalizedText(cmsRow, "title", language) || heroContent.title || legacy?.title || "",
    subtitle: heroContent.subtitle || legacy?.subtitle || "",
    description: heroContent.description || heroContent.excerpt || legacy?.description || "",
    content: richContent.content || heroContent.content || legacy?.content || "",
    cta_title: ctaContent.title || ctaSettings.title || legacy?.cta_title || "",
    cta_description: ctaContent.description || ctaSettings.description || legacy?.cta_description || "",
    image_url: heroContent.image_url || heroSettings.image_url || legacy?.image_url || null,
    alt: heroContent.alt || heroSettings.alt || legacy?.alt || "",
    seo_title: pickLocalizedText(cmsRow, "seo_title", language) || legacy?.seo_title || "",
    seo_description: pickLocalizedText(cmsRow, "seo_description", language) || legacy?.seo_description || "",
    seo_keywords: pickLocalizedText(cmsRow, "seo_keywords", language) || legacy?.seo_keywords || "",
    items: heroContent.items || richContent.items || legacy?.items || [],
  };
};
