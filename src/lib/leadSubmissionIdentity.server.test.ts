import { webcrypto } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitLead } from "../../supabase/functions/submit-lead/service";
import type { SubmitBody, SubmitLeadClient } from "../../supabase/functions/submit-lead/types";
import { acceptanceSourcePath, FORMAL_LEAD_SOURCE_FILTER, isStoredLeadTest, LEAD_TESTS } from "../../supabase/functions/_shared/lead-test-contract";
import { formatAdminSystemLogRow } from "@/lib/adminSystemLogDisplay";
import type { SystemLogRow } from "@/backend/modules/system/service/systemEventService";

type Form = "contact" | "quote";
type Row = Record<string, unknown> & { id: string };
const nonce = "687a6f77-cf04-4a87-a955-a1e74260d301";
const secondNonce = "687a6f77-cf04-4a87-a955-a1e74260d302";
const payload = (type: Form, submissionId: string | undefined = nonce): SubmitBody => ({
  type, name: "Synthetic non-customer fixture", phone: "+60110000000", email: "fixture@example.invalid",
  projectType: "Renovation", location: "Fixture location", message: "Synthetic message for isolated execution", details: "Synthetic details for isolated execution",
  sourcePath: `/en/${type}`, elapsedMs: 4_000, ...(submissionId ? { submissionId } : {}),
});
const request = (subject = false, aal = "aal2") => new Request("https://fixture.invalid/submit-lead", {
  headers: subject ? { Authorization: `Bearer fixture.${btoa(JSON.stringify({ sub: "synthetic-user", aal }))}.fixture` } : {},
});
const table = (type: Form) => type === "contact" ? "leads" : "quote_requests";

function memory(options: { role?: string | null; active?: boolean; userId?: string; authInvalid?: boolean; permissionsFail?: boolean; readFails?: boolean; insertFails?: boolean; notifyFails?: boolean; notifyBadAck?: boolean; notifyTimeout?: boolean; logFails?: boolean; providerRejected?: boolean; race?: boolean } = {}) {
  const rows = { leads: new Map<string, Row>(), quote_requests: new Map<string, Row>() };
  const calls = { limits: 0, inserts: 0, notifications: 0, identities: 0 };
  const logs: Array<Record<string, unknown>> = [];
  const releaseReads: Array<() => void> = [];
  let raceReads = options.race ? 2 : 0;
  const client = {
    auth: { getUser: async () => { calls.identities++; return { data: { user: options.authInvalid ? null : { id: options.userId ?? "synthetic-user" } }, error: options.authInvalid ? { message: "Synthetic invalid session" } : null }; } },
    rpc: async () => { calls.limits++; return { data: "accepted", error: null }; },
    from: (name: string) => ({
      insert: async (row: Row) => {
        if (name === "system_event_logs") {
          if (options.logFails) return { error: { message: "Synthetic log failure" } };
          logs.push(row); return { error: null };
        }
        calls.inserts++;
        if (options.insertFails) return { error: { code: "synthetic_failure" } };
        const target = rows[name as keyof typeof rows];
        if (target.has(row.id)) return { error: { code: "23505" } };
        target.set(row.id, row); return { error: null };
      },
      select: () => ({ eq: (_field: string, id: string) => ({ maybeSingle: async () => {
        if (name === "admin_users") return { data: options.role === null ? null : { role: options.role ?? "super_admin", active: options.active ?? true }, error: options.permissionsFail ? { message: "Synthetic permission-query failure" } : null };
        if (options.readFails) return { data: null, error: { message: "Synthetic storage unavailable" } };
        if (raceReads > 0) {
          raceReads--;
          await new Promise<void>(resolve => { releaseReads.push(resolve); if (releaseReads.length === 2) releaseReads.forEach(release => release()); });
          return { data: null, error: null };
        }
        return { data: rows[name as keyof typeof rows].get(id) ?? null, error: null };
      } }) }),
    }),
    functions: { invoke: async () => {
      calls.notifications++;
      if (options.notifyTimeout) return new Promise(() => undefined);
      return {
        data: options.notifyBadAck ? { error: "Synthetic invalid acknowledgement" } : { ok: true, telegram: { ok: !options.providerRejected } },
        error: options.notifyFails ? { message: "Synthetic notification failure; secret=must-not-persist" } : null,
      };
    } },
  };
  return { client: client as unknown as SubmitLeadClient, rows, calls, logs };
}
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("Deno", { env: { get: () => undefined } });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Network is prohibited in this fixture"); }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe.each(["contact", "quote"] as const)("%s stable logical submission", type => {
  it("acknowledges retry/reload/response loss without another limiter call, insertion or notification", async () => {
    const state = memory();
    const first = await submitLead(request(), payload(type), state.client);
    const retry = await submitLead(request(), payload(type), state.client);
    expect(first.body).toEqual({ ok: true, id: expect.any(String) });
    expect(retry.body).toEqual({ ok: true, id: first.body.id, deduplicated: true });
    expect(state.calls).toMatchObject({ limits: 1, inserts: 1, notifications: 1 });
    expect(state.rows[table(type)].size).toBe(1);
    // Subsequent workflow changes do not invalidate the original immutable submission identity.
    state.rows[table(type)].get(first.body.id!)!.status = "converted";
    expect((await submitLead(request(), payload(type), state.client)).body.deduplicated).toBe(true);
  });
  it("keeps distinct nonces and legacy no-key submissions as distinct requests", async () => {
    const state = memory();
    const results = await Promise.all([nonce, secondNonce].map(key => submitLead(request(), payload(type, key), state.client)));
    expect(results[0].body.id).not.toBe(results[1].body.id);
    const legacy = payload(type); delete legacy.submissionId;
    const oldFirst = await submitLead(request(), legacy, state.client);
    const oldSecond = await submitLead(request(), legacy, state.client);
    expect(oldFirst.body.id).not.toBe(oldSecond.body.id);
    expect(state.rows[table(type)].size).toBe(4);
  });
  it("fails closed on nonce reuse with any changed submitted identity field", async () => {
    const edits: Record<string, string> = { name: "Another fixture", phone: "+60110000001", email: "other@example.invalid", projectType: "Other", location: "Other location", sourcePath: `/en/${type}?utm_source=other` };
    if (type === "contact") edits.message = "Another synthetic message";
    else { edits.propertySize = "1000"; edits.budget = "Other budget"; edits.details = "Another synthetic description"; }
    for (const [field, value] of Object.entries(edits)) {
      const state = memory();
      await submitLead(request(), payload(type), state.client);
      const changed = await submitLead(request(), { ...payload(type), [field]: value }, state.client);
      expect(changed.status, field).toBe(409);
      expect(changed.body.ok).toBeUndefined();
      expect(state.calls).toMatchObject({ limits: 1, inserts: 1, notifications: 1 });
    }
  });
  it("recovers primary-key races only after a complete matching readback, with one save and notification", async () => {
    const state = memory({ race: true });
    const results = await Promise.all([submitLead(request(), payload(type), state.client), submitLead(request(), payload(type), state.client)]);
    expect(results.every(result => result.body.ok)).toBe(true);
    expect(results[0].body.id).toBe(results[1].body.id);
    expect(results.filter(result => result.body.deduplicated)).toHaveLength(1);
    expect(state.rows[table(type)].size).toBe(1);
    expect(state.calls.notifications).toBe(1);
  });
  it("rejects a concurrent different payload instead of acknowledging another request's save", async () => {
    const state = memory({ race: true });
    const results = await Promise.all([
      submitLead(request(), payload(type), state.client),
      submitLead(request(), { ...payload(type), name: "Different simultaneous fixture" }, state.client),
    ]);
    expect(results.filter(result => result.body.ok)).toHaveLength(1);
    expect(results.filter(result => result.status === 409)).toHaveLength(1);
    expect(state.rows[table(type)].size).toBe(1);
    expect(state.calls.notifications).toBe(1);
  });
  it("normalizes nonce case and cleanable whitespace while rejecting invalid retry fields", async () => {
    const state = memory();
    const first = await submitLead(request(), payload(type), state.client);
    const retry = await submitLead(request(), { ...payload(type, nonce.toUpperCase()), name: ` ${payload(type).name} ` }, state.client);
    expect(retry.body).toEqual({ ok: true, id: first.body.id, deduplicated: true });
    expect((await submitLead(request(), { ...payload(type), phone: "invalid" }, state.client)).status).toBe(400);
    expect(state.calls).toMatchObject({ limits: 1, inserts: 1, notifications: 1 });
  });
  it("does not acknowledge unproven storage and preserves a saved request after notification failure", async () => {
    for (const options of [{ readFails: true }, { insertFails: true }]) {
      const state = memory(options);
      expect((await submitLead(request(), payload(type), state.client)).status).toBe(500);
      expect(state.calls.notifications).toBe(0);
    }
    const state = memory({ notifyFails: true });
    expect((await submitLead(request(), payload(type), state.client)).body.ok).toBe(true);
    expect((await submitLead(request(), payload(type), state.client)).body.deduplicated).toBe(true);
    expect(state.calls.notifications).toBe(1);
  });
  it("correlates transport errors and invalid top-level acknowledgements without saving private errors or retrying", async () => {
    for (const options of [{ notifyFails: true }, { notifyBadAck: true }]) {
      const state = memory(options);
      const first = await submitLead(request(), payload(type), state.client);
      expect(first.body.ok).toBe(true);
      expect(state.logs).toHaveLength(1);
      expect(state.logs[0]).toMatchObject({
        event_type: "lead_notification_delivery_failed", source: "submit-lead", severity: "warn",
        metadata: { type, id: first.body.id, table: table(type), channel: "dispatch", delivery_status: "unknown", retry_policy: "manual_verify", reason: "dispatch_error" },
      });
      expect(JSON.stringify(state.logs)).not.toContain("secret=");
      expect(JSON.stringify(state.logs)).not.toContain("Synthetic");
      const logRow = { ...state.logs[0], id: "synthetic-log", created_at: "2026-10-09T00:00:00Z" } as unknown as SystemLogRow;
      const chinese = formatAdminSystemLogRow(logRow, "zh");
      const english = formatAdminSystemLogRow(logRow, "en");
      expect(chinese.source).toBe("表单提交");
      expect(chinese.message).toBe("通知处理结果尚未确认。再次发送前，请核对已保存线索和通知记录。");
      expect(english.source).toBe("Form submission");
      expect(english.message).toBe("Notification processing could not be confirmed. Check the saved lead and notification records before retrying.");
      expect(Object.values(chinese).join(" ")).not.toContain("submit-lead");
      expect(Object.values(chinese).join(" ")).not.toContain("Lead notification dispatch");
      expect(Object.values(chinese).join(" ")).not.toContain("未知来源");
      expect((await submitLead(request(), payload(type), state.client)).body.deduplicated).toBe(true);
      expect(state.calls.notifications).toBe(1);
      expect(state.logs).toHaveLength(1);
    }
  });
  it("correlates the bounded dispatch timeout as unknown without erasing saved data or resending", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const state = memory({ notifyTimeout: true });
    const pending = submitLead(request(), payload(type), state.client);
    // SHA hashing runs on a native promise; let the actual repository invocation start first.
    for (let i = 0; i < 100 && state.calls.notifications === 0; i++) await new Promise<void>(resolve => setImmediate(resolve));
    expect(state.calls.notifications).toBe(1);
    await vi.advanceTimersByTimeAsync(2_500);
    const first = await pending;
    expect(first.body.ok).toBe(true);
    expect(state.rows[table(type)].size).toBe(1);
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0]).toMatchObject({ source: "submit-lead", metadata: { type, id: first.body.id, table: table(type), channel: "dispatch", delivery_status: "unknown", retry_policy: "manual_verify", reason: "dispatch_timeout" } });
    expect((await submitLead(request(), payload(type), state.client)).body.deduplicated).toBe(true);
    expect(state.calls.notifications).toBe(1);
    expect(state.logs).toHaveLength(1);
  });
  it("acknowledges storage if the dispatch-status log write fails, and does not treat nested provider rejection as a bad dispatch", async () => {
    const failedLog = memory({ notifyFails: true, logFails: true });
    const first = await submitLead(request(), payload(type), failedLog.client);
    expect(first.body.ok).toBe(true);
    expect(failedLog.rows[table(type)].size).toBe(1);
    expect((await submitLead(request(), payload(type), failedLog.client)).body.deduplicated).toBe(true);
    expect(failedLog.calls.notifications).toBe(1);
    const nestedFailure = memory({ providerRejected: true });
    expect((await submitLead(request(), payload(type), nestedFailure.client)).body.ok).toBe(true);
    expect(nestedFailure.logs).toHaveLength(0);
  });
  it("rejects invalid nonces rather than silently falling back to non-idempotent storage", async () => {
    for (const key of ["", null, "invalid", "00000000-0000-0000-0000-000000000000"]) {
      const state = memory();
      const result = await submitLead(request(), { ...payload(type), submissionId: key } as SubmitBody, state.client);
      expect(result.status).toBe(400);
      expect(state.calls).toMatchObject({ limits: 0, inserts: 0, notifications: 0 });
    }
  });
  it("assigns trusted internal-normal only after real fixture authentication and preserves notification", async () => {
    const state = memory();
    const first = await submitLead(request(true), payload(type), state.client);
    const retry = await submitLead(request(true), payload(type), state.client);
    expect(first.body.internal).toBe(true);
    expect(retry.body).toMatchObject({ internal: true, deduplicated: true, id: first.body.id });
    const marker = state.rows[table(type)].get(first.body.id!)!.source_path;
    expect(marker).toBe(acceptanceSourcePath(type, first.body.id!));
    expect(isStoredLeadTest(String(marker))).toBe(true);
    expect(state.calls).toMatchObject({ limits: 1, inserts: 1, notifications: 1, identities: 2 });
  });
  it("retains ordinary-customer semantics for verified noneligible users", async () => {
    for (const options of [{ role: "editor" }, { active: false }, { role: null }, { role: "super_admin" }]) {
      const state = memory(options);
      const req = request(true, options.role === "super_admin" ? "aal1" : "aal2");
      const result = await submitLead(req, payload(type), state.client);
      expect(result.body.ok).toBe(true);
      expect(result.body.internal).toBeUndefined();
      expect(state.rows[table(type)].get(result.body.id!)!.source_path).toBe(`/en/${type}`);
    }
  });
  it("fails closed for invalid subject-bearing sessions and unavailable permission verification", async () => {
    for (const [options, status] of [[{ authInvalid: true }, 401], [{ permissionsFail: true }, 500]] as const) {
      const state = memory(options);
      expect((await submitLead(request(true), payload(type), state.client)).status).toBe(status);
      expect(state.calls).toMatchObject({ limits: 0, inserts: 0, notifications: 0 });
    }
  });
  it("does not trust client flags, UTM/internal query or a forged stored source", async () => {
    const state = memory();
    const result = await submitLead(request(), { ...payload(type), sourcePath: `/en/${type}?internal=true&utm_medium=test`, internal: true } as unknown as SubmitBody, state.client);
    expect(result.body.internal).toBeUndefined();
    expect(isStoredLeadTest(String(state.rows[table(type)].get(result.body.id!)!.source_path))).toBe(false);
    const forged = await submitLead(request(true), { ...payload(type), sourcePath: acceptanceSourcePath(type, nonce) }, state.client);
    expect(forged.status).toBe(400);
  });
  it("preserves the bounded fixed TEST identity and strict authorization rules", async () => {
    const fixed = type === "quote" ? LEAD_TESTS.fc_paid_20261008_T01 : LEAD_TESTS.fc_paid_20261008_T02;
    const data = { ...payload(type), name: "[TEST] Synthetic fixture", phone: "+60 11-2885 3888", message: "TEST 非客户咨询 synthetic fixture", details: "TEST 非客户咨询 synthetic fixture", sourcePath: `/en/${type}?fc_test=fc_paid_20261008_${type === "quote" ? "T01" : "T02"}` } as unknown as SubmitBody;
    expect((await submitLead(request(), data, memory().client)).status).toBe(401);
    expect((await submitLead(request(true), data, memory({ role: "editor" }).client)).status).toBe(403);
    const state = memory();
    expect((await submitLead(request(true), data, state.client)).body).toEqual({ ok: true, id: fixed.id });
    expect((await submitLead(request(true), data, state.client)).body).toEqual({ ok: true, id: fixed.id, deduplicated: true });
    expect(state.calls.notifications).toBe(1);
  });
});

it("separates forms and verified actors without matching by phone/content/time", async () => {
  const state = memory();
  const contact = await submitLead(request(), payload("contact"), state.client);
  const quote = await submitLead(request(), payload("quote"), state.client);
  expect(contact.body.id).not.toBe(quote.body.id);
  const firstActor = await submitLead(request(true), payload("contact"), memory({ userId: "actor-one" }).client);
  const secondActor = await submitLead(request(true), payload("contact"), memory({ userId: "actor-two" }).client);
  expect(firstActor.body.id).not.toBe(secondActor.body.id);
});
it("serializes exact canonical regex exclusion in the existing PostgREST OR expression", async () => {
  let requestedUrl = "";
  const client = createClient("https://fixture.invalid", "synthetic-anon", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (input) => {
    requestedUrl = String(input); return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
  } } });
  const result = await client.from("leads").select("id").or(FORMAL_LEAD_SOURCE_FILTER);
  expect(result.error).toBeNull();
  expect(new URL(requestedUrl).searchParams.get("or")).toBe(`(${FORMAL_LEAD_SOURCE_FILTER})`);
  expect(FORMAL_LEAD_SOURCE_FILTER).toContain('source_path.not.match."^/__internal_test__/acceptance/en/(quote|contact)/');
  expect(FORMAL_LEAD_SOURCE_FILTER).toContain('}$")');
});
