import { buildLeadTelegramMessage } from "../_shared/admin-notification-format.ts";
import {
  fetchLeadNotificationRecord,
  fetchTelegramSettingsRow,
  insertNotificationDeliveryEvent,
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

const NOTIFICATION_FETCH_TIMEOUT_MS = 3_500;

const fetchWithTimeout = async <T>(url: string, init: RequestInit, readResponse: (response: Response) => Promise<T>) => {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new DOMException("Notification request timed out", "AbortError"));
    }, NOTIFICATION_FETCH_TIMEOUT_MS);
  });

  try {
    // The deadline covers acknowledgement body reads, not only response headers.
    return await Promise.race([
      fetch(url, { ...init, signal: controller.signal }).then(readResponse),
      deadline,
    ]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

const isAbortError = (error: unknown) => error instanceof Error && error.name === "AbortError";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;

const readInteger = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;

const providerRejection = (channel: string, response: Response, body: Record<string, unknown>): DeliveryResult => ({
  skipped: false,
  ok: false,
  status: response.status,
  delivery_status: "rejected",
  error: `${channel} provider rejected the notification`,
  provider_error_code: readInteger(body.error_code),
  retry_after_seconds: readInteger(asRecord(body.parameters)?.retry_after),
  retry_policy: "manual_after_correction",
});

const unverifiedAcknowledgement = (channel: string, status: number): DeliveryResult => ({
  skipped: false,
  ok: false,
  status,
  delivery_status: "unknown",
  error: `${channel} notification acknowledgement could not be verified`,
  retry_policy: "manual_verify",
});

const httpFailure = (channel: string, status: number): DeliveryResult => ({
  skipped: false,
  ok: false,
  status,
  delivery_status: status >= 500 ? "unknown" : "rejected",
  error: status >= 500
    ? `${channel} notification acknowledgement could not be confirmed`
    : `${channel} notification request was not accepted`,
  retry_policy: status >= 500 ? "manual_verify" : "manual_after_correction",
});

const requestFailure = (channel: string, error: unknown): DeliveryResult => ({
  skipped: false,
  ok: false,
  delivery_status: "unknown",
  error: isAbortError(error) ? `${channel} notification timed out` : `${channel} notification request failed`,
  // A timeout or lost acknowledgement can occur after the provider accepted a message.
  // Never automatically retry an ambiguous outcome and create another notification.
  retry_policy: "manual_verify",
});

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
      delivery_status: "skipped",
      retry_policy: "none",
    };
  }

  if (!token || !chatId) {
    return {
      skipped: true,
      reason: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured",
      delivery_status: "skipped",
      retry_policy: "none",
    };
  }

  try {
    return await fetchWithTimeout<DeliveryResult>(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
      }),
    }, async (response) => {
      let body: Record<string, unknown> | null;
      try {
        body = asRecord(await response.json());
      } catch (error) {
        if (isAbortError(error)) throw error;
        return response.ok ? unverifiedAcknowledgement("Telegram", response.status) : httpFailure("Telegram", response.status);
      }

      if (body?.ok === false) return providerRejection("Telegram", response, body);
      if (!response.ok) return httpFailure("Telegram", response.status);

      // Bot API sendMessage succeeds only with ok:true and a Message result.
      const messageId = readInteger(asRecord(body?.result)?.message_id);
      if (body?.ok !== true || messageId === undefined) return unverifiedAcknowledgement("Telegram", response.status);

      return {
        skipped: false,
        ok: true,
        status: response.status,
        delivery_status: "provider_accepted",
        provider_message_id: messageId,
        retry_policy: "manual_verify",
      };
    });
  } catch (error) {
    return requestFailure("Telegram", error);
  }
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
      delivery_status: "skipped",
      retry_policy: "none",
    };
  }

  try {
    return await fetchWithTimeout<DeliveryResult>(webhookUrl, {
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
    }, async (response) => {
      const rawBody = await response.text();
      let body: Record<string, unknown> | null = null;
      if (rawBody.trim()) {
        try {
          body = asRecord(JSON.parse(rawBody));
        } catch {
          if (response.headers.get("content-type")?.toLowerCase().includes("json")) {
            return response.ok ? unverifiedAcknowledgement("Webhook", response.status) : httpFailure("Webhook", response.status);
          }
        }
      }
      if (body?.ok === false) return providerRejection("Webhook", response, body);
      if (!response.ok) return httpFailure("Webhook", response.status);

      return {
        skipped: false,
        ok: true,
        status: response.status,
        // The existing generic webhook also supports 204 and plain-text 2xx replies.
        // HTTP acceptance alone is not proof of downstream or recipient delivery.
        delivery_status: body?.ok === true ? "provider_accepted" : "http_accepted",
        provider_message_id: readInteger(body?.message_id ?? asRecord(body?.result)?.message_id),
        retry_policy: "manual_verify",
      };
    });
  } catch (error) {
    return requestFailure("Webhook", error);
  }
};

const shouldLogDeliveryResult = (result: DeliveryResult) =>
  result.ok !== undefined || (result.skipped === true && result.reason !== "Telegram notification is disabled");

export async function notifyLead(input: NotifyLeadRequest, client: NotifyLeadClient): Promise<NotifyLeadResult> {
  let leadRecord: Awaited<ReturnType<typeof fetchLeadNotificationRecord>>;
  try {
    leadRecord = await fetchLeadNotificationRecord(client, input.type, input.id);
  } catch {
    return { status: 400, body: { error: "Saved lead could not be loaded for notification" } };
  }

  const telegramMessage = buildLeadTelegramMessage(input.type, leadRecord.data);
  const telegramSettings = resolveTelegramSettings(await fetchTelegramSettingsRow(client));
  const [telegramResult, webhookResult] = await Promise.all([
    sendTelegramMessage(telegramMessage, telegramSettings),
    sendLeadWebhook(input.type, input.id, leadRecord.table, leadRecord.data, telegramMessage),
  ]);

  for (const [channel, result] of [["telegram", telegramResult], ["webhook", webhookResult]] as const) {
    const shouldRecord = channel === "telegram" ? shouldLogDeliveryResult(result) : result.ok !== undefined;
    if (!shouldRecord) continue;
    result.receipt_recorded = await insertNotificationDeliveryEvent(client, {
      event_type: result.ok ? "lead_notification_request_accepted" : "lead_notification_delivery_failed",
      severity: result.ok ? "info" : result.delivery_status === "unknown" || result.skipped ? "warn" : "error",
      message: result.ok
        ? "Lead notification request accepted; delivery is not verified."
        : "Lead notification acceptance could not be confirmed; the saved lead is retained.",
      metadata: { channel, type: input.type, id: input.id, table: leadRecord.table, result: { ...result } },
    });
  }

  return {
    body: {
      ok: true,
      telegram: telegramResult,
      webhook: webhookResult,
    },
  };
}
