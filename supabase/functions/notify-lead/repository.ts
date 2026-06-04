import type { NotificationSettingsRow, NotifyLeadClient, NotifyLeadType } from "./types.ts";

export async function fetchTelegramSettingsRow(client: NotifyLeadClient): Promise<NotificationSettingsRow | null> {
  const { data } = await client
    .from("notification_settings")
    .select("telegram_enabled,telegram_bot_token,telegram_chat_id")
    .eq("id", "default")
    .maybeSingle();

  return data || null;
}

export async function fetchLeadNotificationRecord(client: NotifyLeadClient, type: NotifyLeadType, id: string) {
  const table = type === "quote" ? "quote_requests" : "leads";
  const { data, error } = await client.from(table).select("*").eq("id", id).single();

  if (error) throw error;
  return {
    table,
    data: data as Record<string, unknown>,
  };
}

export async function insertNotificationFailureEvent(
  client: NotifyLeadClient,
  severity: "warn" | "error",
  message: string,
  metadata: Record<string, unknown>,
) {
  const { error } = await client.from("system_event_logs").insert({
    event_type: "lead_notification_delivery_failed",
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
