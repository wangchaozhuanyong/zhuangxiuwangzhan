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

export async function updateQuoteRecord(quoteRequestId: string, patch: QuoteUpdatePatch) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("quote_requests").update(patch).eq("id", quoteRequestId);
  if (error) throw error;

  return true;
}

export async function fetchAdminQuoteList<T extends Record<string, unknown>>(input: AdminQuoteListRepositoryInput): Promise<AdminListPage<T>> {
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

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as unknown as T[],
    count: count ?? (data?.length || 0),
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function fetchAdminQuoteDetail(quoteRequestId: string) {
  const supabase = requireSupabase();
  const [{ data: quote, error: quoteError }, { data: followups }] = await Promise.all([
    supabase.from("quote_requests").select("*").eq("id", quoteRequestId).single(),
    supabase.from("lead_followups").select("*").eq("quote_request_id", quoteRequestId).order("created_at", { ascending: false }),
  ]);

  if (quoteError) throw quoteError;
  return { quote, followups: followups ?? [] };
}

export async function fetchAdminQuoteReportRows(startIso?: string | null) {
  const supabase = requireSupabase();
  let query = supabase
    .from("quote_requests")
    .select("id,customer_name,status,source_path,project_type,location,quoted_amount,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (startIso) query = query.gte("created_at", startIso);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
