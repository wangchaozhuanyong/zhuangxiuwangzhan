import { withReadSignal } from "@/lib/readRequest";
import { FORMAL_LEAD_SOURCE_FILTER } from "@/lib/leadTest";
import { requireSupabase } from "@/lib/supabase";
import { adminDayStartIso, adminSince24hIso, type AdminWorkflowFilter } from "@/lib/adminLeadWorkflow";
import type { Database } from "@/lib/database.types";

type LeadStatus = NonNullable<Database["public"]["Tables"]["leads"]["Row"]["status"]>;

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

export type SubmitLeadReceipt = { ok: true; id: string; deduplicated?: boolean; internal?: boolean };

export async function invokeSubmitLeadFunction(body: Record<string, unknown>) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke("submit-lead", { body });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  if (!data || data.ok !== true || typeof data.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
    throw new Error("The submission could not be confirmed.");
  }
  return { ok: true, id: data.id, deduplicated: data.deduplicated === true, internal: data.internal === true } satisfies SubmitLeadReceipt;
}

export async function fetchAdminLeadList<T extends Record<string, unknown>>(input: AdminLeadListRepositoryInput, signal?: AbortSignal): Promise<AdminListPage<T>> {
  const supabase = requireSupabase();
  const from = input.page * input.pageSize;
  const to = from + input.pageSize - 1;

  let query = supabase.from("leads").select("*", { count: "exact" });
  if (input.status && input.status !== "all") query = query.eq("status", input.status as LeadStatus);
  if (input.workflow && input.workflow !== "all") {
    const now = new Date();
    if (input.workflow === "today") query = query.gte("created_at", adminDayStartIso(now));
    if (input.workflow === "due_followups") {
      query = query.not("next_follow_up_at", "is", null).lte("next_follow_up_at", now.toISOString());
    }
    if (input.workflow === "stale24") query = query.eq("status", "new").lt("created_at", adminSince24hIso(now));
    if (input.workflow === "to_quote") query = query.in("status", ["contacted", "site_visit_scheduled"]);
  }
  if (input.search) {
    query = query.or(
      ["name", "phone", "email", "location", "source_path", "project_type"]
        .map((field) => `${field}.ilike.%${input.search}%`)
        .join(","),
    );
  }
  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await withReadSignal(query.range(from, to), signal);
  if (error) throw error;

  return {
    rows: (data ?? []) as unknown as T[],
    count: count ?? (data?.length || 0),
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function fetchAdminLeadDetail(leadId: string, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const [{ data: lead, error: leadError }, { data: followups, error: followupError }] = await Promise.all([
    withReadSignal(supabase.from("leads").select("*").eq("id", leadId).single(), signal),
    withReadSignal(supabase.from("lead_followups").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }), signal),
  ]);

  if (leadError) throw leadError;
  if (followupError) throw followupError;
  return { lead, followups: followups ?? [] };
}

export async function fetchAdminLeadReportRows(startIso?: string | null, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const pageSize = 500;
  const readUntil = new Date().toISOString();
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase.from("leads")
      .select("id,name,status,source,source_path,project_type,location,deal_value,created_at")
      .or(FORMAL_LEAD_SOURCE_FILTER)
      .lte("created_at", readUntil)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (startIso) query = query.gte("created_at", startIso);
    const { data, error } = await withReadSignal(query.range(offset, offset + pageSize - 1), signal);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}
