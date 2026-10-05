import { withReadSignal } from "@/lib/readRequest";
import { isSupabaseConfigured, requireSupabase, supabase } from "@/lib/supabase";

export type ProcessStepRow = {
  id?: string;
  updated_at?: string | null;
  step_number: number;
  title_zh?: string | null;
  title_en?: string | null;
  description_zh?: string | null;
  description_en?: string | null;
  icon_key?: string | null;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

export type FaqRow = {
  id?: string;
  updated_at?: string | null;
  page_key: string;
  question_zh?: string | null;
  answer_zh?: string | null;
  question_en?: string | null;
  answer_en?: string | null;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

export type CtaRow = {
  id?: string;
  updated_at?: string | null;
  block_key: string;
  title_zh?: string | null;
  title_en?: string | null;
  description_zh?: string | null;
  description_en?: string | null;
  primary_label_zh?: string | null;
  primary_label_en?: string | null;
  primary_url?: string | null;
  secondary_label_zh?: string | null;
  secondary_label_en?: string | null;
  secondary_url?: string | null;
  image_url?: string | null;
  status?: "draft" | "published" | "archived";
};

export type AboutSectionRow = {
  id?: string;
  updated_at?: string | null;
  section_key: string;
  title_zh?: string | null;
  title_en?: string | null;
  subtitle_zh?: string | null;
  subtitle_en?: string | null;
  content_zh?: string | null;
  content_en?: string | null;
  image_url?: string | null;
  items_zh?: unknown;
  items_en?: unknown;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

export const hasCompanyEditorDatabaseClient = () => isSupabaseConfigured && Boolean(supabase);

export async function fetchAboutSectionRecord(sectionKey: string, signal?: AbortSignal) {
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("about_sections").select("*").eq("section_key", sectionKey).order("sort_order").limit(1), signal);
  if (error) throw error;
  return (data || [])[0] || null;
}

export async function fetchEditorProcessSteps(signal?: AbortSignal) {
  const { data, error } = await withReadSignal(requireSupabase().from("process_steps").select("*").order("sort_order").order("step_number"), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchEditorFaqRows(pageKey: string, signal?: AbortSignal) {
  const { data, error } = await withReadSignal(requireSupabase().from("faqs").select("*").eq("page_key", pageKey).order("sort_order"), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchEditorCtaBlock(blockKey: string, signal?: AbortSignal) {
  const { data, error } = await withReadSignal(requireSupabase().from("cta_blocks").select("*").eq("block_key", blockKey).maybeSingle(), signal);
  if (error) throw error;
  return data || null;
}
