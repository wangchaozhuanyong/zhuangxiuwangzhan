import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const labelMap: Record<string, string> = {
  name: "姓名",
  phone: "电话",
  email: "邮箱",
  message: "留言内容",
  project_type: "项目类型",
  location: "所在地区",
  source_path: "来源页面",
  customer_name: "姓名",
  customer_phone: "电话",
  customer_email: "邮箱",
  property_size: "房屋面积",
  estimated_budget: "预算",
  quoted_amount: "报价金额",
  valid_until: "报价有效期",
  project_details: "项目详情",
  status: "状态",
  notes: "备注",
  area: "区域",
  budget: "预算",
  size: "面积",
  details: "详情",
};

const telegramKeyMap: Record<string, string> = {
  contact: "新线索来了",
  quote: "新报价请求来了",
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

const formatSummaryLines = (type: string, data: Record<string, unknown>) => {
  const preferredKeys =
    type === "quote"
      ? [
          "customer_name",
          "customer_phone",
          "customer_email",
          "project_type",
          "location",
          "property_size",
          "estimated_budget",
          "quoted_amount",
          "valid_until",
          "source_path",
          "project_details",
          "message",
          "notes",
        ]
      : [
          "name",
          "phone",
          "email",
          "project_type",
          "location",
          "source_path",
          "message",
          "notes",
        ];

  const seen = new Set<string>();
  const lines = preferredKeys
    .map((key) => {
      seen.add(key);
      const value = cleanValue(data[key]);
      if (!value) return "";
      return `${labelMap[key] || key}：${value}`;
    })
    .filter(Boolean);

  for (const [key, value] of Object.entries(data)) {
    if (seen.has(key)) continue;
    if (!labelMap[key]) continue;
    const cleaned = cleanValue(value);
    if (!cleaned) continue;
    lines.push(`${labelMap[key]}：${cleaned}`);
  }

  return lines;
};

const truncateText = (text: string, limit = 3800) =>
  text.length <= limit ? text : `${text.slice(0, limit - 20)}\n\n[消息已截断]`;

const buildTelegramMessage = (type: string, data: Record<string, unknown>) => {
  const title = telegramKeyMap[type] || "FLASH CAST 新线索";
  const lines = formatSummaryLines(type, data);

  const message = [
    "FLASH CAST",
    title,
    `编号：${cleanValue(data.id) || "-"}`,
    `提交时间：${cleanValue(data.created_at) || cleanValue(data.inserted_at) || "-"}`,
    "",
    ...lines,
  ].join("\n");

  return truncateText(message);
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
      "Content-Type": "application/json",
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

    const telegramMessage = buildTelegramMessage(type, data);
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
