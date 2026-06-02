import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildLeadTelegramMessage } from "../_shared/admin-notification-format.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getServiceRoleKey = () =>
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

const getTelegramSettings = async (supabase: ReturnType<typeof createClient>) => {
  const { data } = await supabase
    .from("notification_settings")
    .select("telegram_enabled,telegram_bot_token,telegram_chat_id")
    .eq("id", "default")
    .maybeSingle();

  return {
    enabled: data?.telegram_enabled ?? Boolean(Deno.env.get("TELEGRAM_BOT_TOKEN") && Deno.env.get("TELEGRAM_CHAT_ID")),
    token: data?.telegram_bot_token || Deno.env.get("TELEGRAM_BOT_TOKEN"),
    chatId: data?.telegram_chat_id || Deno.env.get("TELEGRAM_CHAT_ID"),
  };
};

const cleanValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(cleanValue).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
};

const sendTelegramMessage = async (message: string, settings: Awaited<ReturnType<typeof getTelegramSettings>>) => {
  const token = settings.token?.trim();
  const chatId = settings.chatId?.trim();

  if (!settings.enabled) {
    return {
      skipped: true,
      reason: "Telegram notification is disabled",
    };
  }

  if (!token || !chatId) {
    return {
      skipped: true,
      reason: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured",
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    return {
      skipped: false,
      ok: false,
      error: await response.text(),
    };
  }

  return {
    skipped: false,
    ok: true,
  };
};

const sendLeadWebhook = async (
  type: "contact" | "quote",
  id: string,
  table: string,
  data: Record<string, unknown>,
  summary: string,
) => {
  const webhookUrl = Deno.env.get("LEAD_NOTIFICATION_WEBHOOK_URL")?.trim();
  if (!webhookUrl) {
    return {
      skipped: true,
      reason: "LEAD_NOTIFICATION_WEBHOOK_URL is not configured",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "flashcast_website",
        type,
        id,
        table,
        summary,
        lead: data,
        submitted_at: cleanValue(data.created_at) || cleanValue(data.inserted_at) || null,
      }),
    });

    if (!response.ok) {
      return {
        skipped: false,
        ok: false,
        status: response.status,
        error: await response.text(),
      };
    }

    return { skipped: false, ok: true, status: response.status };
  } catch (error) {
    return {
      skipped: false,
      ok: false,
      error: error instanceof Error ? error.message : "Webhook request failed",
    };
  }
};

const logSystemEvent = async (
  supabase: ReturnType<typeof createClient>,
  severity: "warn" | "error",
  message: string,
  metadata: Record<string, unknown>,
) => {
  const { error } = await supabase.from("system_event_logs").insert({
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
};

const shouldLogDeliveryResult = (result: { skipped?: boolean; ok?: boolean; reason?: string }) =>
  result.ok === false || (result.skipped === true && result.reason !== "Telegram notification is disabled");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { type, id } = await req.json();
    if (type !== "contact" && type !== "quote") {
      return Response.json({ error: "Invalid notification type" }, { status: 400, headers: corsHeaders });
    }

    const serviceRoleKey = getServiceRoleKey();
    if (!serviceRoleKey) {
      return Response.json({ error: "Service role key is not configured" }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const table = type === "quote" ? "quote_requests" : "leads";
    const { data, error } = await supabase.from(table).select("*").eq("id", id).single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    const telegramMessage = buildLeadTelegramMessage(type, data);
    const telegramSettings = await getTelegramSettings(supabase);
    const telegramResult = await sendTelegramMessage(telegramMessage, telegramSettings);
    const webhookResult = await sendLeadWebhook(type, id, table, data, telegramMessage);

    if (shouldLogDeliveryResult(telegramResult)) {
      await logSystemEvent(
        supabase,
        telegramResult.ok === false ? "error" : "warn",
        `Lead Telegram notification was not delivered for ${type}:${id}`,
        { channel: "telegram", type, id, table, result: telegramResult },
      );
    }

    if (webhookResult.ok === false) {
      await logSystemEvent(
        supabase,
        "error",
        `Lead webhook notification was not delivered for ${type}:${id}`,
        { channel: "webhook", type, id, table, result: webhookResult },
      );
    }

    return Response.json(
      {
        ok: true,
        telegram: telegramResult,
        webhook: webhookResult,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to notify lead",
      },
      { status: 500, headers: corsHeaders },
    );
  }
});
