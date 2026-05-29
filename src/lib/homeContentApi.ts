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
