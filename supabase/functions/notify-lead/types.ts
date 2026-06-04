import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type NotifyLeadClient = SupabaseClient;

export type NotifyLeadType = "contact" | "quote";

export type NotifyLeadRequest = {
  type: NotifyLeadType;
  id: string;
};

export type NotifyLeadResult = {
  status?: number;
  body: Record<string, unknown>;
};

export type TelegramSettings = {
  enabled: boolean;
  token?: string | null;
  chatId?: string | null;
};

export type DeliveryResult = {
  skipped?: boolean;
  ok?: boolean;
  reason?: string;
  status?: number;
  error?: string;
};

export type NotificationSettingsRow = {
  telegram_enabled?: boolean | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
};
