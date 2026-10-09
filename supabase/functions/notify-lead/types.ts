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
  delivery_status?: "provider_accepted" | "http_accepted" | "rejected" | "unknown" | "skipped";
  provider_message_id?: number;
  provider_error_code?: number;
  retry_after_seconds?: number;
  retry_policy?: "manual_after_correction" | "manual_verify" | "none";
  receipt_recorded?: boolean;
};

export type NotificationDeliveryEvent = {
  event_type: "lead_notification_delivery_failed" | "lead_notification_request_accepted";
  severity: "info" | "warn" | "error";
  message: string;
  metadata: {
    channel: "telegram" | "webhook";
    type: NotifyLeadType;
    id: string;
    table: string;
    result: DeliveryResult;
  };
};

export type NotificationSettingsRow = {
  telegram_enabled?: boolean | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
};
