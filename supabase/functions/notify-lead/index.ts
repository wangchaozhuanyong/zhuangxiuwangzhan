import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const labelMap: Record<string, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  message: "Message",
  project_type: "Project Type",
  location: "Location",
  source_path: "Source Page",
  customer_name: "Name",
  customer_phone: "Phone",
  customer_email: "Email",
  property_size: "Property Size",
  estimated_budget: "Budget",
  quoted_amount: "Quoted Amount",
  valid_until: "Quote Valid Until",
  project_details: "Project Details",
  status: "Status",
  notes: "Notes",
  area: "Area",
  budget: "Budget",
  size: "Size",
  details: "Details",
};

const telegramKeyMap: Record<string, string> = {
  contact: "New Contact Lead",
  quote: "New Quote Request",
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
      const label = labelMap[key] || key;
      return `${label}: ${value}`;
    })
    .filter(Boolean);

  for (const [key, value] of Object.entries(data)) {
    if (seen.has(key)) continue;
    if (!labelMap[key]) continue;
    const cleaned = cleanValue(value);
    if (!cleaned) continue;
    lines.push(`${labelMap[key]}: ${cleaned}`);
  }

  return lines;
};

const truncateText = (text: string, limit = 3800) =>
  text.length <= limit ? text : `${text.slice(0, limit - 20)}\n\n[Message truncated]`;

const buildTelegramMessage = (type: string, data: Record<string, unknown>) => {
  const title = telegramKeyMap[type] || "New FLASH CAST Lead";
  const lines = formatSummaryLines(type, data);

  const message = [
    `FLASH CAST`,
    title,
    `Lead ID: ${cleanValue(data.id) || "-"}`,
    `Created At: ${cleanValue(data.created_at) || cleanValue(data.inserted_at) || "-"}`,
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

    return Response.json(
      {
        ok: true,
        telegram: telegramResult,
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
