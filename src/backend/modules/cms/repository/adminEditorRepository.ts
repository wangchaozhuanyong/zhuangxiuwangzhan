import { withReadSignal } from "@/lib/readRequest";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const hasAdminEditorDatabaseClient = () => isSupabaseConfigured && Boolean(supabase);

export async function fetchHomeSectionRecord(sectionKey: string, signal?: AbortSignal) {
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("home_sections").select("*").eq("section_key", sectionKey).order("sort_order").limit(1), signal);
  if (error) return null;
  return (data || [])[0] || null;
}

export async function fetchAboutSectionRecord(sectionKey: string, signal?: AbortSignal) {
  if (!supabase) return null;
  const { data, error } = await withReadSignal(supabase.from("about_sections").select("*").eq("section_key", sectionKey).order("sort_order").limit(1), signal);
  if (error) return null;
  return (data || [])[0] || null;
}

export async function fetchHomeEditorAuxiliaryRows(signal?: AbortSignal) {
  const [steps, faqs, cta] = await withReadSignal(Promise.all([
    supabase!.from("process_steps").select("*").order("sort_order").order("step_number"),
    supabase!.from("faqs").select("*").eq("page_key", "home").order("sort_order"),
    supabase!.from("cta_blocks").select("*").eq("block_key", "home_final").maybeSingle(),
  ]), signal);

  return {
    processSteps: steps.data || [],
    faqRows: faqs.data || [],
    ctaBlock: cta.data || null,
  };
}

export async function fetchAboutEditorCtaBlock(signal?: AbortSignal) {
  const { data } = await withReadSignal(supabase!.from("cta_blocks").select("*").eq("block_key", "about_final").maybeSingle(), signal);
  return data || null;
}
