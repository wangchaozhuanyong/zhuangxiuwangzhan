import { requireSupabase } from "@/lib/supabase";

const COUNT_ONLY_SELECT = "id";

export type AdminDashboardStatsData = {
  counts: Record<string, number>;
  recentLeads: unknown[];
  recentQuotes: unknown[];
};

const readCount = (result: { count: number | null }) => result.count || 0;

export async function fetchAdminDashboardStatsData(): Promise<AdminDashboardStatsData> {
  const supabase = requireSupabase();
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const todayIso = dayStart.toISOString();
  const monthIso = monthStart.toISOString();

  const [
    newLeads,
    pendingQuotes,
    staleLeads,
    staleQuotes,
    failedTranslations,
    projects,
    services,
    blog,
    seoMissing,
    todayLeads,
    monthQuotes,
    monthLeads,
    dueLeadFollowUps,
    dueQuoteFollowUps,
    toQuote,
    leads,
    quotes,
  ] = await Promise.all([
    supabase.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "new"),
    supabase.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "new").lt("created_at", since24h),
    supabase.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).in("status", ["pending", "contacted"]).lt("created_at", since24h),
    supabase.from("translation_jobs").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("projects").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "published"),
    supabase.from("services").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "published"),
    supabase.from("blog_posts").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "published"),
    supabase.from("services").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).or("seo_title_zh.is.null,seo_description_zh.is.null"),
    supabase.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).gte("created_at", todayIso),
    supabase.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).gte("created_at", monthIso),
    supabase.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).gte("created_at", monthIso),
    supabase.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).not("next_follow_up_at", "is", null).lte("next_follow_up_at", now.toISOString()),
    supabase.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).not("next_follow_up_at", "is", null).lte("next_follow_up_at", now.toISOString()),
    supabase.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).in("status", ["pending", "contacted", "site_visit_scheduled"]),
    supabase.from("leads").select("id,name,phone,status,created_at,source_path,next_follow_up_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("quote_requests").select("id,customer_name,customer_phone,status,created_at,project_type,source_path,next_follow_up_at").order("created_at", { ascending: false }).limit(10),
  ]);

  return {
    counts: {
      todayLeads: readCount(todayLeads),
      newLeads: readCount(newLeads),
      pendingQuotes: readCount(pendingQuotes),
      staleLeads: readCount(staleLeads),
      staleQuotes: readCount(staleQuotes),
      dueLeadFollowUps: readCount(dueLeadFollowUps),
      dueQuoteFollowUps: readCount(dueQuoteFollowUps),
      dueFollowUps: readCount(dueLeadFollowUps) + readCount(dueQuoteFollowUps),
      monthLeads: readCount(monthLeads),
      monthQuotes: readCount(monthQuotes),
      toQuote: readCount(toQuote),
      staleUnfollowed: readCount(staleLeads) + readCount(staleQuotes),
      failedTranslations: readCount(failedTranslations),
      projects: readCount(projects),
      services: readCount(services),
      blog: readCount(blog),
      seoMissing: readCount(seoMissing),
    },
    recentLeads: leads.data || [],
    recentQuotes: quotes.data || [],
  };
}
