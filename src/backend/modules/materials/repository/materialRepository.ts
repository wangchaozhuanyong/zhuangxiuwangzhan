import type { QueryClient } from "@tanstack/react-query";
import { saveAdminRecord } from "@/lib/adminMutation";
import { requireSupabase } from "@/lib/supabase";

export type SaveMaterialRecordInput = {
  payload: Record<string, unknown>;
  id?: string | null;
  expectedUpdatedAt?: string | null;
  action: "insert" | "update" | "publish";
  queryClient?: QueryClient;
};

export type AdminMaterialListInput = {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
};

const applySearch = (query: any, fields: string[], search?: string) => {
  if (!search) return query;
  return query.or(fields.map((field) => `${field}.ilike.%${search}%`).join(","));
};

export async function findMaterialIdsBySlug(slug: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("materials").select("id").eq("slug", slug).limit(1);
  if (error) throw error;

  return (data || []).map((row) => String(row.id));
}

export async function fetchAdminMaterialList<T extends Record<string, any>>(input: AdminMaterialListInput) {
  const supabase = requireSupabase();
  const from = input.page * input.pageSize;
  const to = from + input.pageSize - 1;

  let query = supabase
    .from("materials")
    .select("id,title_zh,title_en,slug,status,sort_order,category,subcategory,material_type,image_url,updated_at,created_at", { count: "exact" });
  if (input.status && input.status !== "all") query = query.eq("status", input.status as any);
  query = applySearch(query, ["title_zh", "title_en", "slug", "category", "subcategory", "material_type"], input.search);
  query = query.order("sort_order", { ascending: true }).order("updated_at", { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as T[], count: count ?? (data?.length || 0), page: input.page, pageSize: input.pageSize };
}

export async function fetchAdminMaterialDetail(materialId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("materials").select("*").eq("id", materialId).single();
  if (error) throw error;
  return data;
}

export async function fetchAdminMaterialRows(limit: number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export function saveMaterialRecord(input: SaveMaterialRecordInput) {
  return saveAdminRecord({
    table: "materials",
    payload: input.payload,
    id: input.id,
    expectedUpdatedAt: input.expectedUpdatedAt,
    action: input.action,
    queryClient: input.queryClient,
  });
}

export async function invokeMaterialEnglishGeneration(materialId: string, force: boolean) {
  const supabase = requireSupabase();
  const { error } = await supabase.functions.invoke("generate-english-content", {
    body: { table: "materials", id: materialId, force },
  });

  if (error) throw error;
  return true;
}
