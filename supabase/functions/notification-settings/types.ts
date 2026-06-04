export type TelegramSettings = {
  telegram_enabled?: boolean;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  maintenance_reminders_enabled?: boolean;
  maintenance_reminder_day?: string;
  maintenance_reminder_time?: string;
  maintenance_timezone?: string;
  maintenance_last_sent_at?: string | null;
};

export type NotificationSettingsActionResult = {
  status: number;
  body: Record<string, unknown>;
};
