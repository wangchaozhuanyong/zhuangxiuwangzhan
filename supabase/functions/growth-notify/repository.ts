import type { GrowthNotifyClient } from "./types.ts";

export async function fetchGrowthTelegramSettings(client: GrowthNotifyClient) {
  const { data, error } = await client
    .from("notification_settings")
    .select("telegram_enabled,telegram_bot_token,telegram_chat_id")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function insertGrowthNotificationEvent(
  client: GrowthNotifyClient,
  eventType: string,
  severity: "info" | "warn" | "error",
  message: string,
  metadata: Record<string, unknown>,
) {
  const { error } = await client.from("system_event_logs").insert({
    event_type: eventType,
    severity,
    source: "managed_growth",
    message,
    metadata: {
      category: "managed_growth",
      categoryLabel: "推广托管",
      ...metadata,
    },
  });
  if (error) throw error;
}
