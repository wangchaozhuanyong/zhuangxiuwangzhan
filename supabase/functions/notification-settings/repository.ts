import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { TelegramSettings } from "./types.ts";

type SupabaseClient = ReturnType<typeof createClient>;

const SETTINGS_SELECT =
  "telegram_enabled,telegram_bot_token,telegram_chat_id,maintenance_reminders_enabled,maintenance_reminder_day,maintenance_reminder_time,maintenance_timezone,maintenance_last_sent_at";

export const getSettings = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("notification_settings")
    .select(SETTINGS_SELECT)
    .eq("id", "default")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as TelegramSettings | null;
};

export const upsertSettings = async (supabase: SupabaseClient, payload: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from("notification_settings")
    .upsert(payload, { onConflict: "id" })
    .select(SETTINGS_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as TelegramSettings;
};
