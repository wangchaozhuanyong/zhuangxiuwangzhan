export type SharedTelegramSettings = {
  enabled: boolean;
  token?: string | null;
  chatId?: string | null;
};

export type SharedTelegramSettingsRow = {
  telegram_enabled?: boolean | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
};

export type SharedDeliveryResult = {
  skipped?: boolean;
  ok?: boolean;
  reason?: string;
  status?: number;
  error?: string;
};

const NOTIFICATION_FETCH_TIMEOUT_MS = 3_500;
type DenoRuntime = { env?: { get?: (name: string) => string | undefined } };

const getRuntimeEnv = (name: string) =>
  (globalThis as typeof globalThis & { Deno?: DenoRuntime }).Deno?.env?.get?.(name);

const fetchWithTimeout = async (url: string, init: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NOTIFICATION_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const isAbortError = (error: unknown) => error instanceof Error && error.name === "AbortError";

export const resolveTelegramSettings = (row: SharedTelegramSettingsRow | null): SharedTelegramSettings => ({
  enabled: row?.telegram_enabled ?? Boolean(getRuntimeEnv("TELEGRAM_BOT_TOKEN") && getRuntimeEnv("TELEGRAM_CHAT_ID")),
  token: row?.telegram_bot_token || getRuntimeEnv("TELEGRAM_BOT_TOKEN"),
  chatId: row?.telegram_chat_id || getRuntimeEnv("TELEGRAM_CHAT_ID"),
});

export const sendTelegramMessage = async (
  message: string,
  settings: SharedTelegramSettings,
): Promise<SharedDeliveryResult> => {
  const token = settings.token?.trim();
  const chatId = settings.chatId?.trim();

  if (!settings.enabled) return { skipped: true, reason: "Telegram notification is disabled" };
  if (!token || !chatId) {
    return { skipped: true, reason: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured" };
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
      }),
    });
  } catch (error) {
    return {
      skipped: false,
      ok: false,
      error: isAbortError(error) ? "Telegram notification timed out" : "Telegram notification request failed",
    };
  }

  if (!response.ok) {
    return { skipped: false, ok: false, status: response.status, error: await response.text() };
  }
  return { skipped: false, ok: true, status: response.status };
};
