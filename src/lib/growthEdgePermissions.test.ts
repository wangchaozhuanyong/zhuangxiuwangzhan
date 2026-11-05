import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireGrowthAccess } from "../../supabase/functions/_shared/growth-access";
import { exportGrowthData, resolveGrowthExportWindow } from "../../supabase/functions/growth-export/service";
import { buildGrowthTelegramMessage, notifyGrowthEvent } from "../../supabase/functions/growth-notify/service";

const getUser = vi.fn(async () => ({ data: { user: { id: "fixture", app_metadata: { role: "admin" } } }, error: null }));
const readAdmin = vi.fn();
const client = {
  auth: { getUser },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: readAdmin }) }) }),
};

const adminRequest = (aal = "aal2") =>
  new Request("https://unit.test", { headers: { Authorization: `Bearer fixture.${btoa(JSON.stringify({ aal }))}.fixture` } });
const cronRequest = (value: string) =>
  new Request("https://unit.test", { headers: { "x-cron-secret": value } });

beforeEach(() => {
  getUser.mockClear();
  readAdmin.mockReset();
  const secrets: Record<string, string> = {
    GROWTH_EXPORT_SECRET: "fixture-export",
    GROWTH_NOTIFY_SECRET: "fixture-notify",
  };
  vi.stubGlobal("Deno", { env: { get: (name: string) => secrets[name] } });
});

afterEach(() => vi.unstubAllGlobals());

describe("growth functions use separately scoped authorization", () => {
  it("keeps a lead manager out of notifications and requires MFA to export", async () => {
    readAdmin.mockResolvedValue({ data: { active: true, role: "lead_manager" }, error: null });
    expect(await requireGrowthAccess(adminRequest(), client, "export")).toMatchObject({ ok: true, userId: "fixture" });
    expect(await requireGrowthAccess(adminRequest(), client, "notify")).toMatchObject({ ok: false, status: 403 });
    expect(await requireGrowthAccess(adminRequest("aal1"), client, "export")).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects a legacy app-metadata admin and allows a current super administrator", async () => {
    readAdmin.mockResolvedValue({ data: null, error: null });
    expect(await requireGrowthAccess(adminRequest(), client, "notify")).toMatchObject({ ok: false, status: 403 });
    readAdmin.mockResolvedValue({ data: { active: true, role: "super_admin" }, error: null });
    expect(await requireGrowthAccess(adminRequest(), client, "notify")).toMatchObject({ ok: true, userId: "fixture" });
  });

  it("rejects anonymous requests and keeps the two automation credentials separate", async () => {
    expect(await requireGrowthAccess(new Request("https://unit.test"), client, "export")).toMatchObject({ ok: false, status: 401 });
    expect(await requireGrowthAccess(cronRequest("fixture-export"), client, "export")).toMatchObject({ ok: true, mode: "cron" });
    expect(await requireGrowthAccess(cronRequest("fixture-export"), client, "notify")).toMatchObject({ ok: false, status: 401 });
    expect(await requireGrowthAccess(cronRequest("fixture-notify"), client, "notify")).toMatchObject({ ok: true, mode: "cron" });
    expect(await requireGrowthAccess(cronRequest("fixture-notify"), client, "export")).toMatchObject({ ok: false, status: 401 });
  });

  it("keeps export row limits bounded and rejects an unknown notification before delivery", () => {
    expect(resolveGrowthExportWindow({ limit: 10_000 }).limit).toBe(1_000);
    expect(() => resolveGrowthExportWindow({ limit: "invalid" })).toThrow("row limit");
    expect(() => buildGrowthTelegramMessage({ eventType: "unrecognized" })).toThrow("Invalid growth notification event type");
  });
});

describe("authorized growth operations retain their service behavior", () => {
  it("exports bounded de-identified data and records the authenticated actor", async () => {
    const fixture = {
      id: "fixture-id", name: "Private name", phone: "Private number", message: "Private details",
      created_at: "2026-10-25T10:00:00Z", gclid: "test-click", deal_value: "1200",
    };
    const leadQuery = { gte: vi.fn(), lte: vi.fn(), order: vi.fn(), limit: vi.fn() };
    leadQuery.gte.mockReturnValue(leadQuery);
    leadQuery.lte.mockReturnValue(leadQuery);
    leadQuery.order.mockReturnValue(leadQuery);
    leadQuery.limit.mockResolvedValueOnce({ data: [fixture], error: null }).mockResolvedValueOnce({ data: [], error: null });
    const audit = vi.fn().mockResolvedValue({ error: null });
    const db = {
      from: (table: string) => table === "system_event_logs" ? { insert: audit } : { select: () => leadQuery },
    } as unknown as Parameters<typeof exportGrowthData>[1];

    const result = await exportGrowthData({ startDate: "2026-10-24", endDate: "2026-10-26", limit: 2 }, db, "authorized-actor");
    expect(result.body).toMatchObject({ ok: true, records: [{ gclid: "test-click", value_myr: 1200 }] });
    expect(JSON.stringify(result.body)).not.toMatch(/fixture-id|Private name|Private number|Private details/);
    expect(leadQuery.limit).toHaveBeenCalledWith(2);
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({
      event_type: "managed_growth_export", actor_id: "authorized-actor", metadata: expect.objectContaining({ record_count: 1 }),
    }));
  });

  it("requires a provider acknowledgement before recording a notification as delivered", async () => {
    const audit = vi.fn().mockResolvedValue({ error: null });
    const settings = vi.fn().mockResolvedValue({ data: {
      telegram_enabled: true, telegram_bot_token: "fake-bot", telegram_chat_id: "fake-channel",
    }, error: null });
    const db = {
      from: (table: string) => table === "system_event_logs"
        ? { insert: audit }
        : { select: () => ({ eq: () => ({ maybeSingle: settings }) }) },
    } as unknown as Parameters<typeof notifyGrowthEvent>[1];
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ ok: true, result: { message_id: 123 } }))
      .mockResolvedValueOnce(Response.json({ ok: false }));
    vi.stubGlobal("fetch", fetch);

    const input = { eventType: "system_test", changeId: "fixture-change" };
    expect(await notifyGrowthEvent(input, db, "authorized-actor")).toMatchObject({ status: 200, body: { telegram: { ok: true } } });
    expect(await notifyGrowthEvent(input, db, "authorized-actor")).toMatchObject({ status: 502, body: { telegram: { ok: false } } });
    expect(audit).toHaveBeenNthCalledWith(1, expect.objectContaining({
      event_type: "managed_growth_system_test", actor_id: "authorized-actor",
      metadata: expect.objectContaining({ telegram_delivered: true }),
    }));
    expect(audit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      metadata: expect.objectContaining({ telegram_delivered: false }),
    }));
  });
});
