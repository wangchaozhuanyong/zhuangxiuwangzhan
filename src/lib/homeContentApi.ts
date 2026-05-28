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
