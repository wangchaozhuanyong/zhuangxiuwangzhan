import type { QueryClient } from "@tanstack/react-query";
import { saveAdminRecord } from "@/lib/adminMutation";
import type { Database } from "@/lib/database.types";
import { requireSupabase } from "@/lib/supabase";

type ServiceStatus = NonNullable<Database["public"]["Tables"]["services"]["Row"]["status"]>;
type SearchableQuery = {
  or(filters: string): unknown;
};

export type SaveServiceRecordInput = {
  payload: Record<string, unknown>;
  id?: string | null;
  expectedUpdatedAt?: string | null;
  action: "insert" | "update" | "publish";
  queryClient?: QueryClient;
};

export type PublishServiceRecordInput = {
  record: Record<string, unknown>;
  nextStatus: ServiceStatus;
  expectedUpdatedAt?: string | null;
  approvalId?: string;
  source?: string;
};

export type PublishServiceRecordResult = {
  ok?: boolean;
  dry_run?: boolean;
  content_type?: string;
  action?: string;
  slug?: string;
  status?: ServiceStatus;
  existing_id?: string | null;
  saved_id?: string | null;
  saved_updated_at?: string | null;
  warnings?: string[];
  next_steps?: string[];
  saved_record?: Record<string, unknown> | null;
  error?: string;
};

export type AdminServiceListInput = {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
};

const applySearch = <TQuery extends SearchableQuery>(query: TQuery, fields: string[], search?: string): TQuery => {
  if (!search) return query;
  return query.or(fields.map((field) => `${field}.ilike.%${search}%`).join(",")) as TQuery;
};

export async function findServiceIdsBySlug(slug: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("services").select("id").eq("slug", slug).limit(1);
  if (error) throw error;

  return (data || []).map((row) => String(row.id));
}

export async function fetchAdminServiceList<T extends Record<string, unknown>>(input: AdminServiceListInput) {
  const supabase = requireSupabase();
  const from = input.page * input.pageSize;
  const to = from + input.pageSize - 1;

  let query = supabase
    .from("services")
    .select("id,title_zh,title_en,slug,status,sort_order,updated_at,created_at", { count: "exact" });
  if (input.status && input.status !== "all") query = query.eq("status", input.status as ServiceStatus);
  query = applySearch(query, ["title_zh", "title_en", "slug"], input.search);
  query = query.order("sort_order", { ascending: true }).order("updated_at", { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as T[], count: count ?? (data?.length || 0), page: input.page, pageSize: input.pageSize };
}

export async function fetchAdminServiceDetail(serviceId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("services").select("*").eq("id", serviceId).single();
  if (error) throw error;
  return data;
}

export async function fetchAdminServiceRows(limit: number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export function saveServiceRecord(input: SaveServiceRecordInput) {
  return saveAdminRecord({
    table: "services",
    payload: input.payload,
    id: input.id,
    expectedUpdatedAt: input.expectedUpdatedAt,
    action: input.action,
    queryClient: input.queryClient,
  });
}

export async function publishServiceRecord(input: PublishServiceRecordInput) {
  const supabase = requireSupabase();
  const body = {
    contentType: "service" as const,
    mode: "publish" as const,
    nextStatus: input.nextStatus,
    expectedUpdatedAt: input.expectedUpdatedAt || null,
    ownerApproved: true,
    explicitExecution: true,
    approvalId: input.approvalId,
    source: input.source,
    record: input.record,
  };
  const { data, error } = await supabase.functions.invoke<PublishServiceRecordResult>("content-publish", { body });
  if (error) throw error;
  if (!data?.ok) {
    throw new Error(data?.error || "Publish failed");
  }

  return data;
}

export async function invokeServiceEnglishGeneration(serviceId: string, force: boolean) {
  const supabase = requireSupabase();
  const { error } = await supabase.functions.invoke("generate-english-content", {
    body: { table: "services", id: serviceId, force },
  });

  if (error) throw error;
  return true;
}
