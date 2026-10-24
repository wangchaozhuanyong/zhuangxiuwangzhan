export type TelegramRequestResult = { ok: true } | { ok: false; error: string };

// Include the acknowledgement body in the deadline: headers alone cannot confirm acceptance.
const TELEGRAM_REQUEST_TIMEOUT_MS = 3_500;

export async function sendTelegramRequest(
  token: string,
  chatId: string,
  message: string,
): Promise<TelegramRequestResult> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new DOMException("Notification request timed out", "AbortError"));
    }, TELEGRAM_REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      (async (): Promise<TelegramRequestResult> => {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
          signal: controller.signal,
        });
        if (!response.ok) return { ok: false, error: "Telegram notification acceptance could not be confirmed" };
        const body: unknown = await response.json();
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return { ok: false, error: "Telegram notification acknowledgement could not be verified" };
        }
        const record = body as { ok?: unknown; result?: { message_id?: unknown } };
        const id = record.result?.message_id;
        if (record.ok !== true || typeof id !== "number" || !Number.isSafeInteger(id) || id < 0) {
          return { ok: false, error: "Telegram notification acknowledgement could not be verified" };
        }
        return { ok: true };
      })(),
      deadline,
    ]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error && error.name === "AbortError"
        ? "Telegram notification timed out; check the recipient before retrying"
        : "Telegram notification acceptance could not be confirmed",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
