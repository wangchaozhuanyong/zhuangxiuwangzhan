import { requireSupabase } from "@/lib/supabase";
import { adminDayStartIso, adminSince24hIso, type AdminWorkflowFilter } from "@/lib/adminLeadWorkflow";

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

const applySearch = (query: any, fields: string[], search?: string) => {
  if (!search) return query;
  return query.or(fields.map((field) => `${field}.ilike.%${search}%`).join(","));
};

const applyQuoteWorkflowFilter = (query: any, workflow?: AdminWorkflowFilter) => {
  if (!workflow || workflow === "all") return query;
  const now = new Date();

  if (workflow === "today") return query.gte("created_at", adminDayStartIso(now));
  if (workflow === "due_followups") return query.not("next_follow_up_at", "is", null).lte("next_follow_up_at", now.toISOString());
  if (workflow === "stale24") return query.in("status", ["pending", "contacted"]).lt("created_at", adminSince24hIso(now));
  if (workflow === "to_quote") return query.in("status", ["pending", "contacted", "site_visit_scheduled"]);

  return query;
};

export async function updateQuoteRecord(quoteRequestId: string, patch: QuoteUpdatePatch) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("quote_requests").update(patch).eq("id", quoteRequestId);
  if (error) throw error;

  return true;
}

export async function fetchAdminQuoteList<T extends Record<string, any>>(input: AdminQuoteListRepositoryInput): Promise<AdminListPage<T>> {
  const supabase = requireSupabase();
  const from = input.page * input.pageSize;
  const to = from + input.pageSize - 1;

  let query = supabase.from("quote_requests").select("*", { count: "exact" });
  if (input.status && input.status !== "all") query = query.eq("status", input.status as any);
  query = applyQuoteWorkflowFilter(query, input.workflow);
  query = applySearch(query, ["customer_name", "customer_phone", "customer_email", "location", "project_type", "source_path"], input.search);
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
