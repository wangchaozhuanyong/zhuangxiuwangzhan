import { requireSupabase } from "@/lib/supabase";
import { adminDayStartIso, adminSince24hIso, type AdminWorkflowFilter } from "@/lib/adminLeadWorkflow";

export type LeadUpdatePatch = Record<string, unknown>;

export type AdminLeadListRepositoryInput = {
  page: number;
  pageSize: number;
  status?: string;
  workflow?: AdminWorkflowFilter;
  search?: string;
};

export type AdminListPage<T> = {
  rows: T[];
  count: number;
  page: number;
  pageSize: number;
};

const applySearch = (query: any, fields: string[], search?: string) => {
  if (!search) return query;
  return query.or(fields.map((field) => `${field}.ilike.%${search}%`).join(","));
};

const applyLeadWorkflowFilter = (query: any, workflow?: AdminWorkflowFilter) => {
  if (!workflow || workflow === "all") return query;
  const now = new Date();

  if (workflow === "today") return query.gte("created_at", adminDayStartIso(now));
  if (workflow === "due_followups") return query.not("next_follow_up_at", "is", null).lte("next_follow_up_at", now.toISOString());
  if (workflow === "stale24") return query.eq("status", "new").lt("created_at", adminSince24hIso(now));
  if (workflow === "to_quote") return query.in("status", ["contacted", "site_visit_scheduled"]);

  return query;
};

export async function updateLeadRecord(leadId: string, patch: LeadUpdatePatch) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
  if (error) throw error;

  return true;
}

export async function invokeSubmitLeadFunction(body: Record<string, unknown>) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke("submit-lead", { body });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as { ok?: boolean; id?: string };
}

export async function fetchAdminLeadList<T extends Record<string, any>>(input: AdminLeadListRepositoryInput): Promise<AdminListPage<T>> {
  const supabase = requireSupabase();
  const from = input.page * input.pageSize;
  const to = from + input.pageSize - 1;

  let query = supabase.from("leads").select("*", { count: "exact" });
  if (input.status && input.status !== "all") query = query.eq("status", input.status as any);
  query = applyLeadWorkflowFilter(query, input.workflow);
  query = applySearch(query, ["name", "phone", "email", "location", "source_path", "project_type"], input.search);
  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as unknown as T[],
    count: count ?? (data?.length || 0),
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function fetchAdminLeadDetail(leadId: string) {
  const supabase = requireSupabase();
  const [{ data: lead, error: leadError }, { data: followups }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", leadId).single(),
    supabase.from("lead_followups").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }),
  ]);

  if (leadError) throw leadError;
  return { lead, followups: followups ?? [] };
}

export async function fetchAdminLeadReportRows(startIso?: string | null) {
  const supabase = requireSupabase();
  let query = supabase
    .from("leads")
    .select("id,name,status,source,source_path,project_type,location,deal_value,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (startIso) query = query.gte("created_at", startIso);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
