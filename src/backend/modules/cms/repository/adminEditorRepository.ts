import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const hasAdminEditorDatabaseClient = () => isSupabaseConfigured && Boolean(supabase);

export async function ensureHomeSectionRecord(sectionKey: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("home_sections").select("*").eq("section_key", sectionKey).order("sort_order").limit(1);
  if (error) return null;
  const row = (data || [])[0];
  if (row) return row;
  const { data: inserted, error: insertError } = await supabase
    .from("home_sections")
    .insert({ section_key: sectionKey, status: "published", sort_order: 0 })
    .select("*")
    .single();
  if (insertError) return null;
  return inserted;
}

export async function ensureAboutSectionRecord(sectionKey: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("about_sections").select("*").eq("section_key", sectionKey).order("sort_order").limit(1);
  if (error) return null;
  const row = (data || [])[0];
  if (row) return row;
  const { data: inserted, error: insertError } = await supabase
    .from("about_sections")
    .insert({ section_key: sectionKey, status: "published", sort_order: 0 })
    .select("*")
    .single();
  if (insertError) return null;
  return inserted;
}

export async function fetchHomeEditorAuxiliaryRows() {
  const [steps, faqs, cta] = await Promise.all([
    supabase!.from("process_steps").select("*").order("sort_order").order("step_number"),
    supabase!.from("faqs").select("*").eq("page_key", "home").order("sort_order"),
    supabase!.from("cta_blocks").select("*").eq("block_key", "home_final").maybeSingle(),
  ]);

  return {
    processSteps: steps.data || [],
    faqRows: faqs.data || [],
    ctaBlock: cta.data || null,
  };
}

export async function fetchAboutEditorCtaBlock() {
  const { data } = await supabase!.from("cta_blocks").select("*").eq("block_key", "about_final").maybeSingle();
  return data || null;
}
