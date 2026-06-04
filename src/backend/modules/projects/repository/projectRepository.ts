import type { QueryClient } from "@tanstack/react-query";
import { saveAdminRecord } from "@/lib/adminMutation";
import type { Database } from "@/lib/database.types";
import { requireSupabase } from "@/lib/supabase";

type ProjectImageInsert = Database["public"]["Tables"]["project_images"]["Insert"];
type ProjectImageUpdate = Database["public"]["Tables"]["project_images"]["Update"];

export type SaveProjectRecordInput = {
  payload: Record<string, unknown>;
  id?: string | null;
  expectedUpdatedAt?: string | null;
  action: "insert" | "update" | "publish";
  queryClient?: QueryClient;
};

export type AdminProjectListInput = {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
};

const applySearch = (query: any, fields: string[], search?: string) => {
  if (!search) return query;
  return query.or(fields.map((field) => `${field}.ilike.%${search}%`).join(","));
};

export async function findProjectIdsBySlug(slug: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("projects").select("id").eq("slug", slug).limit(1);
  if (error) throw error;

  return (data || []).map((row) => String(row.id));
}

export async function fetchAdminProjectList<T extends Record<string, any>>(input: AdminProjectListInput) {
  const supabase = requireSupabase();
  const from = input.page * input.pageSize;
  const to = from + input.pageSize - 1;

  let query = supabase
    .from("projects")
    .select(
      "id,title_zh,title_en,slug,status,sort_order,location,project_type,image_url,updated_at,created_at,project_images(image_url,image_type,sort_order,alt_zh,alt_en)",
      { count: "exact" },
    );
  if (input.status && input.status !== "all") query = query.eq("status", input.status as any);
  query = applySearch(query, ["title_zh", "title_en", "slug", "location", "project_type"], input.search);
  query = query.order("sort_order", { ascending: true }).order("updated_at", { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as T[], count: count ?? (data?.length || 0), page: input.page, pageSize: input.pageSize };
}

export async function fetchAdminProjectDetail(projectId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error) throw error;
  return data;
}

export async function fetchAdminProjectRows(limit: number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAdminProjectImages(projectId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("project_images").select("*").eq("project_id", projectId).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export function saveProjectRecord(input: SaveProjectRecordInput) {
  return saveAdminRecord({
    table: "projects",
    payload: input.payload,
    id: input.id,
    expectedUpdatedAt: input.expectedUpdatedAt,
    action: input.action,
    queryClient: input.queryClient,
  });
}

export async function invokeProjectEnglishGeneration(projectId: string, force: boolean) {
  const supabase = requireSupabase();
  const { error } = await supabase.functions.invoke("generate-english-content", {
    body: { table: "projects", id: projectId, force },
  });

  if (error) throw error;
  return true;
}

export async function createProjectImageRecord(payload: ProjectImageInsert) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("project_images").insert(payload);
  if (error) throw error;

  return true;
}

export async function updateProjectImageRecord(imageId: string, patch: ProjectImageUpdate) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("project_images").update(patch).eq("id", imageId);
  if (error) throw error;

  return true;
}

export async function resetProjectCoverRecords(projectId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("project_images")
    .update({ image_type: "gallery" })
    .eq("project_id", projectId)
    .eq("image_type", "cover");

  if (error) throw error;
  return true;
}

export async function deleteProjectImageRecord(imageId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("project_images").delete().eq("id", imageId);
  if (error) throw error;

  return true;
}
