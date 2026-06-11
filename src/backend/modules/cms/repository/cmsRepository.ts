import { requireSupabase } from "@/lib/supabase";
import type { CmsPage, CmsRevision, CmsSection, CmsTemplate } from "@/lib/adminCmsBuilderModel";

export async function fetchAdminCmsPages() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []) as CmsPage[];
}

export async function fetchAdminCmsSectionTemplates() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("cms_section_templates").select("*").order("sort_order");

  if (error) throw error;
  return (data || []) as CmsTemplate[];
}

export async function fetchAdminCmsSections(pageId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("cms_sections")
    .select("*")
    .eq("page_id", pageId)
    .is("deleted_at", null)
    .order("sort_order")
    .order("created_at");

  if (error) throw error;
  return (data || []) as CmsSection[];
}

export async function fetchAdminCmsRevisions(entityIds: string[]) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("cms_revisions")
    .select("*")
    .in("entity_id", entityIds)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data || []) as CmsRevision[];
}

export async function fetchAdminSimpleCmsRows(table: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).select("*").order("sort_order").order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchAdminEditorRows(table: string, limit: number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false }).limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchAdminContentRecord<T extends Record<string, unknown>>(table: string, id: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).select("*").eq("id", id).single();

  if (error) throw error;
  return data as T | null;
}

export async function invokeAdminContentEnglishGeneration(table: string, id: string, force: boolean) {
  const supabase = requireSupabase();
  const { error } = await supabase.functions.invoke("generate-english-content", {
    body: { table, id, force },
  });

  if (error) throw error;
  return true;
}
