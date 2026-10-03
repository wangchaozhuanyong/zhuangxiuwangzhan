import { withReadSignal } from "@/lib/readRequest";
import { requireSupabase } from "@/lib/supabase";
import type { CmsPage, CmsRevision, CmsSection, CmsTemplate } from "@/lib/adminCmsBuilderModel";

export async function fetchAdminCmsPages(signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await withReadSignal(supabase
    .from("cms_pages")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order")
    .order("updated_at", { ascending: false }), signal);

  if (error) throw error;
  return (data || []) as CmsPage[];
}

export async function fetchAdminCmsSectionTemplates(signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await withReadSignal(supabase.from("cms_section_templates").select("*").order("sort_order"), signal);

  if (error) throw error;
  return (data || []) as CmsTemplate[];
}

export async function fetchAdminCmsSections(pageId: string, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await withReadSignal(supabase
    .from("cms_sections")
    .select("*")
    .eq("page_id", pageId)
    .is("deleted_at", null)
    .order("sort_order")
    .order("created_at"), signal);

  if (error) throw error;
  return (data || []) as CmsSection[];
}

export async function fetchAdminCmsRevisions(entityIds: string[], signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await withReadSignal(supabase
    .from("cms_revisions")
    .select("*")
    .in("entity_id", entityIds)
    .order("created_at", { ascending: false })
    .limit(30), signal);

  if (error) throw error;
  return (data || []) as CmsRevision[];
}

export async function fetchAdminSimpleCmsRows(table: string, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await withReadSignal(supabase.from(table).select("*").order("sort_order").order("created_at", { ascending: false }), signal);

  if (error) throw error;
  return data || [];
}

export async function fetchAdminEditorRows(table: string, limit: number, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await withReadSignal(supabase.from(table).select("*").order("created_at", { ascending: false }).limit(limit), signal);

  if (error) throw error;
  return data || [];
}

export async function fetchAdminContentRecord<T extends Record<string, unknown>>(table: string, id: string, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await withReadSignal(supabase.from(table).select("*").eq("id", id).single(), signal);

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
