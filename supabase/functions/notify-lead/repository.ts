import type { NotificationDeliveryEvent, NotificationSettingsRow, NotifyLeadClient, NotifyLeadType } from "./types.ts";

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

export async function insertNotificationDeliveryEvent(
  client: NotifyLeadClient,
  event: NotificationDeliveryEvent,
): Promise<boolean> {
  try {
    const { error } = await client.from("system_event_logs").insert({
      ...event,
      source: "notify-lead",
      metadata: {
        category: "notifications",
        categoryLabel: "通知",
        ...event.metadata,
      },
    });
    if (!error) return true;
  } catch {
    // Keep the saved lead and provider result even when receipt persistence fails.
  }

  console.error("Failed to write notification system event log");
  return false;
}
