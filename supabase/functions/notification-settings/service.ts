import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildTelegramTestMessage } from "../_shared/admin-notification-format.ts";
import { getSettings, upsertSettings } from "./repository.ts";
import type { NotificationSettingsActionResult, TelegramSettings } from "./types.ts";

type SupabaseClient = ReturnType<typeof createClient>;

const maskToken = (token?: string | null) => {
  if (!token) return "";
  if (token.length <= 12) return "********";
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
};

const sanitizeSettings = (settings: TelegramSettings | null) => ({
  telegram_enabled: Boolean(settings?.telegram_enabled),
  telegram_bot_token_masked: maskToken(settings?.telegram_bot_token),
  has_telegram_bot_token: Boolean(settings?.telegram_bot_token),
  telegram_chat_id: settings?.telegram_chat_id || "",
  maintenance_reminders_enabled: settings?.maintenance_reminders_enabled ?? true,
  maintenance_reminder_day: settings?.maintenance_reminder_day || "monday",
  maintenance_reminder_time: settings?.maintenance_reminder_time || "09:00",
  maintenance_timezone: settings?.maintenance_timezone || "Asia/Kuala_Lumpur",
  maintenance_last_sent_at: settings?.maintenance_last_sent_at || null,
});

const sendTelegramTest = async (settings: TelegramSettings) => {
  const token = settings.telegram_bot_token?.trim();
  const chatId = settings.telegram_chat_id?.trim();

  if (!token || !chatId) {
    return {
      ok: false,
      error: "Telegram Bot Token and Chat ID are required before testing",
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildTelegramTestMessage(),
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: await response.text(),
    };
  }

  return { ok: true };
};

const validReminderDays = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const isValidTimezone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

export async function handleNotificationSettingsAction(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
): Promise<NotificationSettingsActionResult> {
  const action = body.action || "get";

  if (action === "get") {
    const settings = await getSettings(supabase);
    return { status: 200, body: { ok: true, settings: sanitizeSettings(settings) } };
  }

  if (action === "save") {
    const current = await getSettings(supabase);
    const nextToken =
      typeof body.telegram_bot_token === "string" && body.telegram_bot_token.trim()
        ? body.telegram_bot_token.trim()
        : current?.telegram_bot_token || null;

    const payload = {
      id: "default",
      telegram_enabled: Boolean(body.telegram_enabled),
      telegram_bot_token: nextToken,
      telegram_chat_id: typeof body.telegram_chat_id === "string" ? body.telegram_chat_id.trim() : current?.telegram_chat_id || null,
      maintenance_reminders_enabled: body.maintenance_reminders_enabled ?? current?.maintenance_reminders_enabled ?? true,
      maintenance_reminder_day: typeof body.maintenance_reminder_day === "string" ? body.maintenance_reminder_day : current?.maintenance_reminder_day || "monday",
      maintenance_reminder_time: typeof body.maintenance_reminder_time === "string" ? body.maintenance_reminder_time : current?.maintenance_reminder_time || "09:00",
      maintenance_timezone: typeof body.maintenance_timezone === "string" ? body.maintenance_timezone : current?.maintenance_timezone || "Asia/Kuala_Lumpur",
    };

    if (payload.telegram_enabled && (!payload.telegram_bot_token || !payload.telegram_chat_id)) {
      return { status: 400, body: { error: "Telegram Bot Token and Chat ID are required before enabling notifications" } };
    }

    if (!validReminderDays.has(payload.maintenance_reminder_day)) {
      return { status: 400, body: { error: "Invalid maintenance reminder day" } };
    }

    if (!isValidTime(payload.maintenance_reminder_time)) {
      return { status: 400, body: { error: "Invalid maintenance reminder time. Use HH:mm." } };
    }

    if (!isValidTimezone(payload.maintenance_timezone)) {
      return { status: 400, body: { error: "Invalid maintenance reminder timezone" } };
    }

    const data = await upsertSettings(supabase, payload);
    return { status: 200, body: { ok: true, settings: sanitizeSettings(data) } };
  }

  if (action === "test") {
    const settings = await getSettings(supabase);
    const result = await sendTelegramTest(settings || {});
    return { status: result.ok ? 200 : 400, body: result };
  }

  return { status: 400, body: { error: "Unsupported action" } };
}
