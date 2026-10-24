import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleNotificationSettingsAction } from "../../supabase/functions/notification-settings/service";
import { runMaintenanceReminder } from "../../supabase/functions/maintenance-reminder/service";
import type { MaintenanceClient } from "../../supabase/functions/maintenance-reminder/types";

const fixture = vi.hoisted(() => ({
  settings: { telegram_enabled: true, telegram_bot_token: "fixture-token", telegram_chat_id: "fixture-recipient", maintenance_reminders_enabled: true },
  updated: vi.fn(), failed: vi.fn(),
}));
vi.mock("../../supabase/functions/notification-settings/repository", () => ({ getSettings: async () => fixture.settings, upsertSettings: vi.fn() }));
vi.mock("../../supabase/functions/maintenance-reminder/repository", () => ({
  fetchMaintenanceSettings: async () => fixture.settings, fetchReminderItems: async () => [],
  collectMaintenanceMetrics: async () => ({}), insertMaintenanceReminderFailureEvent: (...args: unknown[]) => fixture.failed(...args),
  updateMaintenanceLastSentAt: (...args: unknown[]) => fixture.updated(...args),
}));
const client = {} as MaintenanceClient;
const invoke = async (kind: "settings" | "maintenance") => {
  if (kind === "settings") {
    const result = await handleNotificationSettingsAction(client, { action: "test" });
    return { ok: result.body.ok, error: result.body.error, status: result.status };
  }
  const result = await runMaintenanceReminder({ includeMonthly: false, isTest: false, mode: "admin" }, client);
  return result.body.telegram as { ok: boolean; error?: string };
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
beforeEach(() => { vi.stubGlobal("Deno", { env: { get: () => undefined } }); fixture.settings.telegram_enabled = true; fixture.settings.maintenance_reminders_enabled = true; fixture.updated.mockReset(); fixture.failed.mockReset(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe.each(["settings", "maintenance"] as const)("%s Telegram completion", kind => {
  it("accepts a complete provider acknowledgement, including message id zero", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ ok: true, result: { message_id: 0 } })));
    expect((await invoke(kind)).ok).toBe(true);
    expect(fixture.updated).toHaveBeenCalledTimes(kind === "maintenance" ? 1 : 0);
  });
  it.each([{ ok: false, description: "fixture-token private-response" }, { ok: true }, { ok: true, result: { message_id: "1" } }, { ok: true, result: { message_id: -1 } }])("rejects incomplete or refused acknowledgement %j", async body => {
    vi.stubGlobal("fetch", vi.fn(async () => json(body)));
    const result = await invoke(kind); expect(result.ok).toBe(false); expect(fixture.updated).not.toHaveBeenCalled();
    expect(JSON.stringify({ result, failures: fixture.failed.mock.calls })).not.toMatch(/fixture-token|private-response/);
  });
  it("does not reflect a raw HTTP provider error into a response or system log", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("fixture-token private-response", { status: 503 })));
    const result = await invoke(kind); expect(result.ok).toBe(false); expect(fixture.updated).not.toHaveBeenCalled();
    expect(JSON.stringify({ result, failures: fixture.failed.mock.calls })).not.toMatch(/fixture-token|private-response/);
  });
  it("handles malformed JSON without claiming success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{malformed", { status: 200 })));
    expect((await invoke(kind)).ok).toBe(false); expect(fixture.updated).not.toHaveBeenCalled();
  });
  it.each(["headers", "body"] as const)("bounds a stalled response %s including body read", async phase => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(() => phase === "headers" ? new Promise<Response>(() => {}) : Promise.resolve(new Response(new ReadableStream(), { status: 200 }))));
    let settled: Awaited<ReturnType<typeof invoke>> | undefined;
    void invoke(kind).then(value => { settled = value; });
    await vi.advanceTimersByTimeAsync(3500);
    expect(settled).toMatchObject({ ok: false }); expect(fixture.updated).not.toHaveBeenCalled();
  });
  it("handles network rejection with a safe failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("fixture-token private-response"); }));
    const result = await invoke(kind); expect(result.ok).toBe(false);
    expect(JSON.stringify({ result, failures: fixture.failed.mock.calls })).not.toMatch(/fixture-token|private-response/);
  });
});

describe("maintenance test feedback", () => {
  it("returns an HTTP failure for rejected test notifications so the existing UI cannot show success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ ok: false })));
    const result = await runMaintenanceReminder({ includeMonthly: false, isTest: true, mode: "admin" }, client);
    expect(result).toMatchObject({ status: 400, body: { ok: false, telegram: { ok: false } } });
    expect(fixture.updated).not.toHaveBeenCalled();
  });
  it("returns an HTTP failure for a skipped test without calling a provider", async () => {
    fixture.settings.telegram_enabled = false;
    const provider = vi.fn(); vi.stubGlobal("fetch", provider);
    const result = await runMaintenanceReminder({ includeMonthly: false, isTest: true, mode: "admin" }, client);
    expect(result).toMatchObject({ status: 400, body: { ok: false, telegram: { skipped: true } } });
    expect(provider).not.toHaveBeenCalled(); expect(fixture.updated).not.toHaveBeenCalled();
  });
  it("preserves disabled scheduled reminders as a skip without calling a provider", async () => {
    fixture.settings.maintenance_reminders_enabled = false;
    const provider = vi.fn(); vi.stubGlobal("fetch", provider);
    const result = await runMaintenanceReminder({ includeMonthly: false, isTest: false, mode: "cron" }, client);
    expect(result.body).toMatchObject({ ok: true, skipped: true });
    expect(provider).not.toHaveBeenCalled(); expect(fixture.updated).not.toHaveBeenCalled();
  });
});
