import { requireSupabase } from "@/lib/supabase";

export type SaveNotificationSettingsRequest = {
  action: "save";
  telegram_enabled: boolean;
  telegram_bot_token: string;
  telegram_chat_id: string;
  maintenance_reminders_enabled: boolean;
  maintenance_reminder_day: string;
  maintenance_reminder_time: string;
  maintenance_timezone: string;
};

export type TestNotificationSettingsRequest = {
  action: "test";
};

export type MaintenanceReminderRequest = {
  test: boolean;
  include_monthly: boolean;
};

export async function invokeNotificationSettingsFunction(
  body: SaveNotificationSettingsRequest | TestNotificationSettingsRequest,
) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke("notification-settings", { body });
  if (error) throw error;

  return data;
}

export async function invokeMaintenanceReminderFunction(body: MaintenanceReminderRequest) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke("maintenance-reminder", { body });
  if (error) throw error;

  return data;
}
