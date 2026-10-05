import { withReadSignal } from "@/lib/readRequest";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type HomeSectionRow = {
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

export const hasHomeEditorDatabaseClient = () => isSupabaseConfigured && Boolean(supabase);

export async function fetchHomeSectionRecord(sectionKey: string, signal?: AbortSignal) {
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("home_sections").select("*").eq("section_key", sectionKey).order("sort_order").limit(1), signal);
  if (error) throw error;
  return (data || [])[0] || null;
}
