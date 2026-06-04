import type { MaintenanceClient, MaintenanceMetrics, ReminderItem, TelegramSettings } from "./types.ts";

export async function fetchMaintenanceSettings(client: MaintenanceClient) {
  const { data, error } = await client
    .from("notification_settings")
    .select("telegram_enabled,telegram_bot_token,telegram_chat_id,maintenance_reminders_enabled,maintenance_reminder_day,maintenance_reminder_time,maintenance_timezone")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as TelegramSettings | null;
}

export async function fetchReminderItems(client: MaintenanceClient, includeMonthly: boolean) {
  const frequencies = includeMonthly ? ["weekly", "monthly"] : ["weekly"];
  const { data, error } = await client
    .from("maintenance_reminder_items")
    .select("id,category,title,description,frequency,sort_order")
    .eq("active", true)
    .in("frequency", frequencies)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as ReminderItem[];
}

const countRows = async (client: MaintenanceClient, table: string, configure?: (query: any) => any) => {
  let query = client.from(table).select("id", { count: "exact", head: true });
  if (configure) query = configure(query);
  const { count, error } = await query;
  if (error) return null;
  return count || 0;
};

export async function collectMaintenanceMetrics(client: MaintenanceClient): Promise<MaintenanceMetrics> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    newLeads,
    newLeadsOlderThan24h,
    pendingQuotes,
    pendingQuotesOlderThan24h,
    leadsThisWeek,
    quotesThisWeek,
    publishedProjects,
    publishedBlogs,
    publishedMaterials,
    publishedAreas,
  ] = await Promise.all([
    countRows(client, "leads", (q) => q.eq("status", "new")),
    countRows(client, "leads", (q) => q.eq("status", "new").lt("created_at", since24h)),
    countRows(client, "quote_requests", (q) => q.eq("status", "pending")),
    countRows(client, "quote_requests", (q) => q.eq("status", "pending").lt("created_at", since24h)),
    countRows(client, "leads", (q) => q.gte("created_at", since7d)),
    countRows(client, "quote_requests", (q) => q.gte("created_at", since7d)),
    countRows(client, "projects", (q) => q.eq("status", "published")),
    countRows(client, "blog_posts", (q) => q.eq("status", "published")),
    countRows(client, "materials", (q) => q.eq("status", "published")),
    countRows(client, "service_areas", (q) => q.eq("status", "published")),
  ]);

  return {
    newLeads,
    newLeadsOlderThan24h,
    pendingQuotes,
    pendingQuotesOlderThan24h,
    leadsThisWeek,
    quotesThisWeek,
    publishedProjects,
    publishedBlogs,
    publishedMaterials,
    publishedAreas,
  };
}

export async function insertMaintenanceReminderFailureEvent(
  client: MaintenanceClient,
  severity: "warn" | "error",
  message: string,
  metadata: Record<string, unknown>,
) {
  const { error } = await client.from("system_event_logs").insert({
    event_type: "maintenance_reminder_delivery_failed",
    severity,
    source: "edge_function",
    message,
    metadata: {
      category: "notifications",
      categoryLabel: "通知",
      ...metadata,
    },
  });

  if (error) console.error("Failed to write system event log", error.message);
}

export function updateMaintenanceLastSentAt(client: MaintenanceClient, sentAt: string) {
  return client.from("notification_settings").update({ maintenance_last_sent_at: sentAt }).eq("id", "default");
}
