import { buildLeadTelegramMessage } from "../_shared/admin-notification-format.ts";
import {
  fetchLeadNotificationRecord,
  fetchTelegramSettingsRow,
  insertNotificationFailureEvent,
} from "./repository.ts";
import type {
  DeliveryResult,
  NotificationSettingsRow,
  NotifyLeadClient,
  NotifyLeadRequest,
  NotifyLeadResult,
  TelegramSettings,
} from "./types.ts";

const cleanValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(cleanValue).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
};

const resolveTelegramSettings = (row: NotificationSettingsRow | null): TelegramSettings => ({
  enabled: row?.telegram_enabled ?? Boolean(Deno.env.get("TELEGRAM_BOT_TOKEN") && Deno.env.get("TELEGRAM_CHAT_ID")),
  token: row?.telegram_bot_token || Deno.env.get("TELEGRAM_BOT_TOKEN"),
  chatId: row?.telegram_chat_id || Deno.env.get("TELEGRAM_CHAT_ID"),
});

const sendTelegramMessage = async (message: string, settings: TelegramSettings): Promise<DeliveryResult> => {
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
  type: NotifyLeadRequest["type"],
  id: string,
  table: string,
  data: Record<string, unknown>,
  summary: string,
): Promise<DeliveryResult> => {
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

const shouldLogDeliveryResult = (result: DeliveryResult) =>
  result.ok === false || (result.skipped === true && result.reason !== "Telegram notification is disabled");

export async function notifyLead(input: NotifyLeadRequest, client: NotifyLeadClient): Promise<NotifyLeadResult> {
  let leadRecord: Awaited<ReturnType<typeof fetchLeadNotificationRecord>>;
  try {
    leadRecord = await fetchLeadNotificationRecord(client, input.type, input.id);
  } catch (error) {
    return { status: 400, body: { error: error instanceof Error ? error.message : String(error) } };
  }

  const telegramMessage = buildLeadTelegramMessage(input.type, leadRecord.data);
  const telegramSettings = resolveTelegramSettings(await fetchTelegramSettingsRow(client));
  const telegramResult = await sendTelegramMessage(telegramMessage, telegramSettings);
  const webhookResult = await sendLeadWebhook(input.type, input.id, leadRecord.table, leadRecord.data, telegramMessage);

  if (shouldLogDeliveryResult(telegramResult)) {
    await insertNotificationFailureEvent(
      client,
      telegramResult.ok === false ? "error" : "warn",
      `Lead Telegram notification was not delivered for ${input.type}:${input.id}`,
      { channel: "telegram", type: input.type, id: input.id, table: leadRecord.table, result: telegramResult },
    );
  }

  if (webhookResult.ok === false) {
    await insertNotificationFailureEvent(
      client,
      "error",
      `Lead webhook notification was not delivered for ${input.type}:${input.id}`,
      { channel: "webhook", type: input.type, id: input.id, table: leadRecord.table, result: webhookResult },
    );
  }

  return {
    body: {
      ok: true,
      telegram: telegramResult,
      webhook: webhookResult,
    },
  };
}
