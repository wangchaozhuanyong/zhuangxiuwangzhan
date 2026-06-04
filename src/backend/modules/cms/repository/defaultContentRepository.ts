import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type DbRow = Record<string, any>;

export const hasDefaultContentDatabaseClient = () => isSupabaseConfigured && Boolean(supabase);

export async function fetchDefaultContentSeedRows(table: string, fields: string[]) {
  const { data, error } = await supabase!.from(table).select(fields.join(","));
  if (error) throw error;
  return (data || []) as DbRow[];
}

export async function insertDefaultContentSeedRow(table: string, row: DbRow) {
  const { error } = await supabase!.from(table).insert(row);
  if (error) throw error;
}

export async function updateDefaultContentSeedRow(table: string, id: string | number, patch: DbRow) {
  const { error } = await supabase!.from(table).update(patch).eq("id", id);
  if (error) throw error;
}

export async function countDefaultContentSeedRows(table: string, filter?: { key: string; value: string }) {
  let query = supabase!.from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter.key, filter.value);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function insertDefaultContentSeedRows(table: string, rows: DbRow[]) {
  const { error } = await supabase!.from(table).insert(rows);
  if (error) throw error;
}

export async function fetchDefaultContentProjects() {
  const { data, error } = await supabase!.from("projects").select("id,slug");
  if (error) throw error;
  return (data || []) as Array<{ id: string; slug: string }>;
}

export async function countDefaultContentProjectImages(projectId: string) {
  const { count, error } = await supabase!
    .from("project_images")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) throw error;
  return count || 0;
}

export async function insertDefaultContentProjectImages(rows: DbRow[]) {
  const { error } = await supabase!.from("project_images").insert(rows);
  if (error) throw error;
}

export async function fetchDefaultSiteSettings() {
  const { data, error } = await supabase!.from("site_settings").select("*").eq("id", "default").maybeSingle();
  if (error) throw error;
  return (data as DbRow | null) || null;
}

export async function insertDefaultSiteSettings(row: DbRow) {
  const { error } = await supabase!.from("site_settings").insert({ id: "default", ...row });
  if (error) throw error;
}

export async function updateDefaultSiteSettings(patch: DbRow) {
  const { error } = await supabase!.from("site_settings").update(patch).eq("id", "default");
  if (error) throw error;
}
