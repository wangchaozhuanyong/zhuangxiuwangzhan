import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyLead } from "../../supabase/functions/notify-lead/service";
import type { DeliveryResult, NotifyLeadClient, NotifyLeadType } from "../../supabase/functions/notify-lead/types";
import { formatAdminSystemLogRow } from "@/lib/adminSystemLogDisplay";
import type { SystemLogRow } from "@/backend/modules/system/service/systemEventService";

const TELEGRAM_FIXTURE_URL = "https://api.telegram.org/botfixture-token/sendMessage";
const WEBHOOK_FIXTURE_URL = "https://notification.fixture.invalid/hook";
const id = "ca0acfd9-bb80-4c02-bf3c-11c810dab117";
let environment: Record<string, string>;
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function memoryClient(type: NotifyLeadType, options: { missing?: boolean; logError?: boolean; logThrows?: boolean; disabled?: boolean; unconfigured?: boolean } = {}) {
  const table = type === "quote" ? "quote_requests" : "leads";
  const savedRecord = Object.freeze({
    id,
    name: "Synthetic notification fixture",
    customer_name: "Synthetic notification fixture",
    phone: "+60 12-000 0000",
    customer_phone: "+60 12-000 0000",
    email: "fixture@example.invalid",
    customer_email: "fixture@example.invalid",
    message: "Synthetic notification only; never a real customer",
    source_path: `/en/${type}`,
    created_at: "2026-10-09T00:00:00Z",
  });
  const logs: Record<string, unknown>[] = [];
  const client = {
    from: vi.fn((target: string) => {
      expect([table, "notification_settings", "system_event_logs"]).toContain(target);
      return {
        insert: vi.fn(async (row: Record<string, unknown>) => {
          // Notification delivery must never update or delete the already saved lead.
          expect(target).toBe("system_event_logs");
          if (options.logThrows) throw new Error("Sensitive database fixture error");
          if (options.logError) return { error: { message: "Sensitive database fixture error" } };
          logs.push(row);
          return { error: null };
        }),
        select: () => ({ eq: () => ({
          single: async () => ({ data: options.missing ? null : savedRecord, error: options.missing ? { message: "Sensitive database fixture error" } : null }),
          maybeSingle: async () => ({
            data: {
              telegram_enabled: !options.disabled,
              telegram_bot_token: options.unconfigured ? null : "fixture-token",
              telegram_chat_id: options.unconfigured ? null : "fixture-channel",
            },
            error: null,
          }),
        }) }),
      };
    }),
  };
  return { client: client as unknown as NotifyLeadClient, logs, savedRecord };
}

const receipts = (body: Record<string, unknown>) => ({
  telegram: body.telegram as DeliveryResult,
  webhook: body.webhook as DeliveryResult,
});

function stubProvider(handler: (channel: "telegram" | "webhook", init: RequestInit) => Response | Promise<Response>) {
  const provider = vi.fn(async (url: string | URL | Request, init: RequestInit) => {
    expect([TELEGRAM_FIXTURE_URL, WEBHOOK_FIXTURE_URL]).toContain(String(url));
    return handler(String(url) === TELEGRAM_FIXTURE_URL ? "telegram" : "webhook", init);
  });
  vi.stubGlobal("fetch", provider);
  return provider;
}

beforeEach(() => {
  environment = { LEAD_NOTIFICATION_WEBHOOK_URL: WEBHOOK_FIXTURE_URL };
  vi.stubGlobal("Deno", { env: { get: (key: string) => environment[key] } });
  stubProvider((channel) => jsonResponse({ ok: true, result: { message_id: channel === "telegram" ? 9001 : 9002 } }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe.each(["quote", "contact"] as const)("English %s notification acknowledgement", (type) => {
  it("retains a correlatable provider receipt without claiming recipient delivery", async () => {
    const memory = memoryClient(type);
    const result = await notifyLead({ type, id }, memory.client);
    expect(result.body.ok).toBe(true);
    expect(receipts(result.body).telegram).toMatchObject({
      ok: true, status: 200, delivery_status: "provider_accepted", provider_message_id: 9001,
      retry_policy: "manual_verify", receipt_recorded: true,
    });
    expect(memory.logs).toHaveLength(2);
    expect(memory.logs[0]).toMatchObject({
      event_type: "lead_notification_request_accepted", severity: "info", source: "notify-lead",
      metadata: { id, type, channel: "telegram", result: { provider_message_id: 9001, delivery_status: "provider_accepted" } },
    });
    expect(JSON.stringify(memory.logs)).not.toContain("delivered");
    expect(memory.savedRecord.id).toBe(id);
  });

  it("handles HTTP 200 ok:false as business rejection and retains the saved lead", async () => {
    // Explicit JSON rejection also wins when a legacy provider omits a JSON content type.
    stubProvider(() => new Response(JSON.stringify({
      ok: false, error_code: 429, parameters: { retry_after: 8 },
      description: "fixture-token fixture-channel fixture@example.invalid +60 12-000 0000 sensitive body",
    }), { status: 200 }));
    const memory = memoryClient(type);
    const result = await notifyLead({ type, id }, memory.client);
    for (const receipt of Object.values(receipts(result.body))) {
      expect(receipt).toMatchObject({
        ok: false, status: 200, delivery_status: "rejected", provider_error_code: 429,
        retry_after_seconds: 8, retry_policy: "manual_after_correction", receipt_recorded: true,
      });
    }
    expect(memory.logs).toHaveLength(2);
    expect(memory.logs.every((log) => log.event_type === "lead_notification_delivery_failed")).toBe(true);
    const output = JSON.stringify({ body: result.body, logs: memory.logs });
    for (const privateValue of ["fixture-token", "fixture-channel", "fixture@example.invalid", "+60 12-000 0000", "sensitive body", WEBHOOK_FIXTURE_URL]) {
      expect(output).not.toContain(privateValue);
    }
    expect(memory.savedRecord.id).toBe(id);
  });

  it("maps accepted and unconfirmed receipts to readable bilingual admin messages", async () => {
    const memory = memoryClient(type);
    await notifyLead({ type, id }, memory.client);
    for (const language of ["en", "zh"] as const) {
      const display = formatAdminSystemLogRow({ ...memory.logs[0], id: "fixture-log", created_at: "2026-10-09T00:00:00Z" } as SystemLogRow, language);
      expect(display.eventType).toBe(language === "zh" ? "线索通知请求已接受" : "Lead notification request accepted");
      expect(display.message).toBe(language === "zh" ? "通知请求已接受，接收方是否收到仍未核实。" : "Notification request accepted. Recipient delivery is not verified.");
    }
    stubProvider(() => new Response("unconfirmed fixture response", { status: 503 }));
    await notifyLead({ type, id }, memory.client);
    for (const language of ["en", "zh"] as const) {
      const display = formatAdminSystemLogRow({ ...memory.logs[2], id: "fixture-log-unconfirmed", created_at: "2026-10-09T00:00:00Z" } as SystemLogRow, language);
      expect(display.eventType).toBe(language === "zh" ? "线索通知需核查" : "Lead notification needs attention");
      expect(display.message).toBe(language === "zh" ? "通知请求是否接受未能确认，已保存的线索仍保留。" : "Notification acceptance could not be confirmed. The saved lead is retained.");
    }
  });
});

describe("notification failure and compatibility boundaries", () => {
  it.each([400, 503])("does not copy a raw HTTP %s error body into the receipt or log", async (status) => {
    stubProvider(() => new Response("fixture-token fixture@example.invalid private response", { status }));
    const memory = memoryClient("quote");
    const result = await notifyLead({ type: "quote", id }, memory.client);
    for (const receipt of Object.values(receipts(result.body))) {
      expect(receipt).toMatchObject({ ok: false, status, delivery_status: status >= 500 ? "unknown" : "rejected" });
      if (status >= 500) expect(receipt.error).not.toContain("was not accepted");
    }
    expect(JSON.stringify({ body: result.body, logs: memory.logs })).not.toContain("private response");
    expect(memory.logs[0].severity).toBe(status >= 500 ? "warn" : "error");
  });

  it.each([
    { ok: true }, { ok: "true", result: { message_id: 1 } },
    { ok: true, result: { message_id: "fixture-message" } }, { ok: true, result: { message_id: -1 } },
  ])("does not accept a malformed Telegram acknowledgement %j", async (body) => {
    stubProvider((channel) => channel === "telegram" ? jsonResponse(body) : new Response(null, { status: 204 }));
    const memory = memoryClient("contact");
    const result = await notifyLead({ type: "contact", id }, memory.client);
    expect(receipts(result.body).telegram).toMatchObject({ ok: false, delivery_status: "unknown", retry_policy: "manual_verify" });
  });

  it("preserves Bot API message_id zero as provider acceptance, not delivered proof", async () => {
    stubProvider(() => jsonResponse({ ok: true, result: { message_id: 0 } }));
    const memory = memoryClient("contact");
    const result = await notifyLead({ type: "contact", id }, memory.client);
    expect(receipts(result.body).telegram).toMatchObject({ ok: true, delivery_status: "provider_accepted", provider_message_id: 0 });
  });

  it.each(["empty-204", "plain-text", "json-without-ok", "json-ok-without-id"])("retains the legacy webhook response contract: %s", async (mode) => {
    stubProvider((channel) => {
      if (channel === "telegram") return jsonResponse({ ok: true, result: { message_id: 9001 } });
      if (mode === "empty-204") return new Response(null, { status: 204 });
      if (mode === "plain-text") return new Response("accepted", { status: 200 });
      return jsonResponse(mode === "json-without-ok" ? { accepted: true } : { ok: true });
    });
    const memory = memoryClient("contact");
    const result = await notifyLead({ type: "contact", id }, memory.client);
    expect(receipts(result.body).webhook).toMatchObject({
      ok: true, delivery_status: mode === "json-ok-without-id" ? "provider_accepted" : "http_accepted",
      retry_policy: "manual_verify", receipt_recorded: true,
    });
    expect(receipts(result.body).webhook.provider_message_id).toBeUndefined();
  });

  it("treats invalid declared JSON as an unverified acknowledgement", async () => {
    stubProvider(() => new Response("{invalid private response", { status: 200, headers: { "Content-Type": "application/json" } }));
    const memory = memoryClient("contact");
    const result = await notifyLead({ type: "contact", id }, memory.client);
    expect(Object.values(receipts(result.body)).every((receipt) => receipt.delivery_status === "unknown")).toBe(true);
    expect(JSON.stringify(memory.logs)).not.toContain("private response");
  });

  it.each(["before-headers", "response-body"])("enforces the same 3.5 second deadline during %s without automatic retries", async (mode) => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const provider = stubProvider((_channel, init) => {
      signals.push(init.signal as AbortSignal);
      if (mode === "before-headers") return new Promise<Response>(() => {});
      return {
        ok: true, status: 200, headers: new Headers({ "Content-Type": "application/json" }),
        json: () => new Promise(() => {}), text: () => new Promise(() => {}),
      } as Response;
    });
    const memory = memoryClient("quote");
    let completed = false;
    const pending = notifyLead({ type: "quote", id }, memory.client).then((result) => { completed = true; return result; });
    await vi.advanceTimersByTimeAsync(3499);
    expect(completed).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const result = await pending;
    expect(Object.values(receipts(result.body)).every((receipt) => receipt.ok === false && receipt.delivery_status === "unknown" && receipt.retry_policy === "manual_verify")).toBe(true);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(memory.logs.every((log) => log.severity === "warn")).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps network failure ambiguous and never blindly resends", async () => {
    const provider = stubProvider(async () => { throw new Error("fixture-token private provider URL"); });
    const memory = memoryClient("contact");
    const result = await notifyLead({ type: "contact", id }, memory.client);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(Object.values(receipts(result.body)).every((receipt) => receipt.delivery_status === "unknown" && receipt.retry_policy === "manual_verify")).toBe(true);
    expect(JSON.stringify({ body: result.body, logs: memory.logs })).not.toContain("fixture-token");
  });

  it.each(["returned-error", "thrown-error"])("preserves the provider result when event persistence fails with %s", async (mode) => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const memory = memoryClient("contact", { logError: mode === "returned-error", logThrows: mode === "thrown-error" });
    const result = await notifyLead({ type: "contact", id }, memory.client);
    expect(Object.values(receipts(result.body)).every((receipt) => receipt.ok === true && receipt.receipt_recorded === false)).toBe(true);
    expect(memory.logs).toHaveLength(0);
    expect(memory.savedRecord.id).toBe(id);
    expect(consoleError.mock.calls).toEqual(Array(2).fill(["Failed to write notification system event log"]));
  });

  it("skips deliberately disabled or unavailable channels without a provider call", async () => {
    environment = {};
    const provider = stubProvider(() => { throw new Error("A disabled channel must not be called"); });
    const memory = memoryClient("contact", { disabled: true });
    const result = await notifyLead({ type: "contact", id }, memory.client);
    expect(Object.values(receipts(result.body)).every((receipt) => receipt.skipped && receipt.delivery_status === "skipped")).toBe(true);
    expect(provider).not.toHaveBeenCalled();
    expect(memory.logs).toHaveLength(0);
  });

  it("logs an enabled but unconfigured Telegram channel as skipped", async () => {
    environment = {};
    const provider = stubProvider(() => { throw new Error("An unconfigured channel must not be called"); });
    const memory = memoryClient("quote", { unconfigured: true });
    const result = await notifyLead({ type: "quote", id }, memory.client);
    expect(receipts(result.body).telegram).toMatchObject({ skipped: true, delivery_status: "skipped", receipt_recorded: true });
    expect(provider).not.toHaveBeenCalled();
    expect(memory.logs).toHaveLength(1);
  });

  it("rejects a missing saved lead before provider requests without exposing database errors", async () => {
    const provider = stubProvider(() => { throw new Error("A missing lead must not be sent"); });
    const memory = memoryClient("quote", { missing: true });
    const result = await notifyLead({ type: "quote", id }, memory.client);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Saved lead could not be loaded for notification");
    expect(provider).not.toHaveBeenCalled();
    expect(memory.logs).toHaveLength(0);
  });
});
