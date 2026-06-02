import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getServiceRoleKey, requireAdminAccess, requireSuperAdminAccess } from "../_shared/admin-auth.ts";
import { buildTelegramTestMessage } from "../_shared/admin-notification-format.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TelegramSettings = {
  telegram_enabled?: boolean;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  maintenance_reminders_enabled?: boolean;
  maintenance_reminder_day?: string;
  maintenance_reminder_time?: string;
  maintenance_timezone?: string;
  maintenance_last_sent_at?: string | null;
};

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

const getSettings = async (supabase: ReturnType<typeof createClient>) => {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("telegram_enabled,telegram_bot_token,telegram_chat_id,maintenance_reminders_enabled,maintenance_reminder_day,maintenance_reminder_time,maintenance_timezone,maintenance_last_sent_at")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as TelegramSettings | null;
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const serviceRoleKey = getServiceRoleKey();
    if (!serviceRoleKey) {
      return Response.json({ error: "Service role key is not configured" }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const body = req.method === "GET" ? { action: "get" } : await req.json().catch(() => ({ action: "get" }));
    const action = body.action || "get";
    const adminCheck = await requireAdminAccess(req, supabase);
    const permissionCheck = action === "get" ? adminCheck : requireSuperAdminAccess(adminCheck);

    if (!permissionCheck.ok) {
      return Response.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status, headers: corsHeaders },
      );
    }

    if (action === "get") {
      const settings = await getSettings(supabase);
      return Response.json({ ok: true, settings: sanitizeSettings(settings) }, { headers: corsHeaders });
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
        return Response.json(
          { error: "Telegram Bot Token and Chat ID are required before enabling notifications" },
          { status: 400, headers: corsHeaders },
        );
      }

      if (!validReminderDays.has(payload.maintenance_reminder_day)) {
        return Response.json({ error: "Invalid maintenance reminder day" }, { status: 400, headers: corsHeaders });
      }

      if (!isValidTime(payload.maintenance_reminder_time)) {
        return Response.json({ error: "Invalid maintenance reminder time. Use HH:mm." }, { status: 400, headers: corsHeaders });
      }

      if (!isValidTimezone(payload.maintenance_timezone)) {
        return Response.json({ error: "Invalid maintenance reminder timezone" }, { status: 400, headers: corsHeaders });
      }

      const { data, error } = await supabase
        .from("notification_settings")
        .upsert(payload, { onConflict: "id" })
        .select("telegram_enabled,telegram_bot_token,telegram_chat_id,maintenance_reminders_enabled,maintenance_reminder_day,maintenance_reminder_time,maintenance_timezone,maintenance_last_sent_at")
        .single();

      if (error) throw new Error(error.message);
      return Response.json({ ok: true, settings: sanitizeSettings(data) }, { headers: corsHeaders });
    }

    if (action === "test") {
      const settings = await getSettings(supabase);
      const result = await sendTelegramTest(settings || {});
      const status = result.ok ? 200 : 400;
      return Response.json(result, { status, headers: corsHeaders });
    }

    return Response.json({ error: "Unsupported action" }, { status: 400, headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Notification settings request failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
