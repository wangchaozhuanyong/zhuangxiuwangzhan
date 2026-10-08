import { withReadSignal } from "@/lib/readRequest";
import { FORMAL_LEAD_SOURCE_FILTER } from "@/lib/leadTest";
import { requireSupabase } from "@/lib/supabase";
import { adminDayStartIso, adminSince24hIso, type AdminWorkflowFilter } from "@/lib/adminLeadWorkflow";
import type { Database } from "@/lib/database.types";

type QuoteStatus = NonNullable<Database["public"]["Tables"]["quote_requests"]["Row"]["status"]>;

export type QuoteUpdatePatch = Record<string, unknown>;

export type AdminQuoteListRepositoryInput = {
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

export async function fetchAdminQuoteList<T extends Record<string, unknown>>(input: AdminQuoteListRepositoryInput, signal?: AbortSignal): Promise<AdminListPage<T>> {
  const supabase = requireSupabase();
  const from = input.page * input.pageSize;
  const to = from + input.pageSize - 1;

  let query = supabase.from("quote_requests").select("*", { count: "exact" });
  if (input.status && input.status !== "all") query = query.eq("status", input.status as QuoteStatus);
  if (input.workflow && input.workflow !== "all") {
    const now = new Date();
    if (input.workflow === "today") query = query.gte("created_at", adminDayStartIso(now));
    if (input.workflow === "due_followups") {
      query = query.not("next_follow_up_at", "is", null).lte("next_follow_up_at", now.toISOString());
    }
    if (input.workflow === "stale24") query = query.in("status", ["pending", "contacted"]).lt("created_at", adminSince24hIso(now));
    if (input.workflow === "to_quote") query = query.in("status", ["pending", "contacted", "site_visit_scheduled"]);
  }
  if (input.search) {
    query = query.or(
      ["customer_name", "customer_phone", "customer_email", "location", "project_type", "source_path"]
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

export async function fetchAdminQuoteDetail(quoteRequestId: string, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const [{ data: quote, error: quoteError }, { data: followups, error: followupError }] = await Promise.all([
    withReadSignal(supabase.from("quote_requests").select("*").eq("id", quoteRequestId).single(), signal),
    withReadSignal(supabase.from("lead_followups").select("*").eq("quote_request_id", quoteRequestId).order("created_at", { ascending: false }), signal),
  ]);

  if (quoteError) throw quoteError;
  if (followupError) throw followupError;
  return { quote, followups: followups ?? [] };
}

export async function fetchAdminQuoteReportRows(startIso?: string | null, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const pageSize = 500;
  const readUntil = new Date().toISOString();
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase.from("quote_requests")
      .select("id,customer_name,status,source_path,project_type,location,quoted_amount,created_at")
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
