import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactBody, QuoteBody, SubmitBody, SubmitLeadClient } from "../../supabase/functions/submit-lead/types";
import { LEAD_TESTS } from "../../supabase/functions/_shared/lead-test-contract";

const repository = vi.hoisted(() => ({
  consumeSubmissionAttempt: vi.fn(),
  createContactLead: vi.fn(), createQuoteRequest: vi.fn(), findSubmittedTest: vi.fn(), notifySubmittedLead: vi.fn(),
}));
vi.mock("../../supabase/functions/submit-lead/repository.ts", () => repository);
import { submitLead } from "../../supabase/functions/submit-lead/service";

const actor = (role: string | null = "super_admin", active = true, aal = "aal2") => {
  // Synthetic fixture only, never a usable account credential.
  const token = `fixture.${btoa(JSON.stringify({ aal }))}.fixture`;
  const req = new Request("https://flashcast.invalid/submit-lead", { headers: { Authorization: `Bearer ${token}` } });
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "fixture-admin" } }, error: null }) },
    from: vi.fn().mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: role ? { role, active } : null, error: null }) }) }) }),
  } as unknown as SubmitLeadClient;
  return { req, client };
};

function payload(type: "contact", test?: boolean): ContactBody;
function payload(type: "quote", test?: boolean): QuoteBody;
function payload(type: "quote" | "contact", test?: boolean): SubmitBody;
function payload(type: "quote" | "contact", test = true): SubmitBody {
  const fields = {
    name: test ? "[TEST] 非客户咨询" : "Customer fixture", phone: test ? "+60 11-2885 3888" : "+60 12-345 6789",
    sourcePath: test ? `/zh/${type}?fc_test=fc_paid_20261008_${type === "quote" ? "T01" : "T02"}` : `/zh/${type}`,
    elapsedMs: 4000, projectType: "Renovation", location: "Kuala Lumpur",
  };
  return type === "contact" ? { ...fields, type, message: "TEST、非客户咨询，通知验收" } : { ...fields, type, details: "TEST、非客户咨询，通知验收" };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("crypto", webcrypto);
  repository.consumeSubmissionAttempt.mockResolvedValue("accepted");
  repository.findSubmittedTest.mockResolvedValue(null);
  repository.createContactLead.mockResolvedValue(undefined);
  repository.createQuoteRequest.mockResolvedValue(undefined);
  repository.notifySubmittedLead.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllGlobals());

describe("submit-lead TEST isolation", () => {
  it.each(["quote", "contact"] as const)("shares the %s phone allowance across accepted display formats", async (type) => {
    const { client } = actor();
    const forms = ["+60 12-345 6789", "60123456789", "+6012 345-6789"];
    for (const phone of forms) {
      expect((await submitLead(new Request("https://fixture.invalid"), { ...payload(type, false), phone }, client)).body.ok).toBe(true);
    }
    const hashes = repository.consumeSubmissionAttempt.mock.calls.map((call) => call[3]);
    expect(new Set(hashes).size).toBe(1);
    const save = type === "quote" ? repository.createQuoteRequest : repository.createContactLead;
    expect(save.mock.calls.map((call) => call[1].phone)).toEqual(forms);
  });
  it.each(["ip_limit", "phone_limit"])("rejects %s without saving or notifying", async (outcome) => {
    repository.consumeSubmissionAttempt.mockResolvedValue(outcome);
    const { client } = actor();
    expect((await submitLead(new Request("https://fixture.invalid"), payload("contact", false), client)).status).toBe(429);
    expect(repository.createContactLead).not.toHaveBeenCalled();
    expect(repository.notifySubmittedLead).not.toHaveBeenCalled();
  });
  it("fails closed if the atomic limiter is unavailable", async () => {
    repository.consumeSubmissionAttempt.mockRejectedValue(new Error("fixture unavailable"));
    const { client } = actor();
    expect((await submitLead(new Request("https://fixture.invalid"), payload("quote", false), client)).status).toBe(500);
    expect(repository.createQuoteRequest).not.toHaveBeenCalled();
    expect(repository.notifySubmittedLead).not.toHaveBeenCalled();
  });
  it("rejects anonymous TEST before writing or notifying", async () => {
    const { client } = actor();
    const result = await submitLead(new Request("https://flashcast.invalid"), payload("quote"), client);
    expect(result.status).toBe(401);
    expect(repository.createQuoteRequest).not.toHaveBeenCalled();
    expect(repository.consumeSubmissionAttempt).not.toHaveBeenCalled();
    expect(repository.notifySubmittedLead).not.toHaveBeenCalled();
  });
  it.each([["super_admin", false, "aal2"], ["super_admin", true, "aal1"], ["editor", true, "aal2"], [null, true, "aal2"]] as const)(
    "rejects unauthorized actor role=%s active=%s assurance=%s", async (role, active, aal) => {
      const { req, client } = actor(role, active, aal);
      expect((await submitLead(req, payload("contact"), client)).status).toBe(403);
      expect(repository.createContactLead).not.toHaveBeenCalled();
    },
  );
  it("rejects invalid auth tokens", async () => {
    const { req, client } = actor();
    vi.mocked(client.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });
    expect((await submitLead(req, payload("quote"), client)).status).toBe(401);
  });
  it.each(["quote", "contact"] as const)("saves authorized %s TEST with canonical marker and retains notification", async (type) => {
    const { req, client } = actor();
    const test = type === "quote" ? LEAD_TESTS.fc_paid_20261008_T01 : LEAD_TESTS.fc_paid_20261008_T02;
    expect((await submitLead(req, payload(type), client)).body).toEqual({ ok: true, id: test.id });
    const save = type === "quote" ? repository.createQuoteRequest : repository.createContactLead;
    expect(save).toHaveBeenCalledWith(client, expect.objectContaining({ id: test.id, sourcePath: test.sourcePath }));
    expect(repository.notifySubmittedLead).toHaveBeenCalledExactlyOnceWith(client, type, test.id);
  });
  it("acknowledges an already saved TEST without rewriting or notifying twice", async () => {
    const { req, client } = actor();
    const test = LEAD_TESTS.fc_paid_20261008_T01;
    repository.findSubmittedTest.mockResolvedValue({ id: test.id, source_path: test.sourcePath });
    expect((await submitLead(req, payload("quote"), client)).body).toEqual({ ok: true, id: test.id });
    expect(repository.createQuoteRequest).not.toHaveBeenCalled();
    expect(repository.notifySubmittedLead).not.toHaveBeenCalled();
  });
  it("handles primary-key duplicate races without repeating notification", async () => {
    const { req, client } = actor();
    const test = LEAD_TESTS.fc_paid_20261008_T02;
    repository.findSubmittedTest.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: test.id, source_path: test.sourcePath });
    repository.createContactLead.mockRejectedValue({ code: "23505" });
    expect((await submitLead(req, payload("contact"), client)).body).toEqual({ ok: true, id: test.id });
    expect(repository.notifySubmittedLead).not.toHaveBeenCalled();
  });
  it("does not acknowledge an unverified save or notify after save failure", async () => {
    const { req, client } = actor();
    repository.createQuoteRequest.mockRejectedValue({ code: "other" });
    expect((await submitLead(req, payload("quote"), client)).status).toBe(500);
    expect(repository.notifySubmittedLead).not.toHaveBeenCalled();
  });
  it("does not permit forged stored markers or unmarked [TEST] submissions", async () => {
    const { req, client } = actor();
    expect((await submitLead(req, { ...payload("quote"), sourcePath: LEAD_TESTS.fc_paid_20261008_T01.sourcePath }, client)).status).toBe(400);
    expect((await submitLead(req, { ...payload("quote"), sourcePath: "/zh/quote" }, client)).status).toBe(400);
    expect(repository.createQuoteRequest).not.toHaveBeenCalled();
  });
  it("requires obvious TEST notes and only the approved company contact number", async () => {
    const { req, client } = actor();
    expect((await submitLead(req, { ...payload("quote"), phone: "+60 12-345 6789" }, client)).status).toBe(400);
    expect((await submitLead(req, { ...payload("quote"), details: "normal inquiry" }, client)).status).toBe(400);
  });
  it.each(["quote", "contact"] as const)("keeps ordinary %s submissions anonymous and normally notified", async (type) => {
    const { client } = actor();
    repository.notifySubmittedLead.mockRejectedValue(new Error("notification fixture failure"));
    const result = await submitLead(new Request("https://flashcast.invalid"), payload(type, false), client);
    expect(result.body.ok).toBe(true);
    expect(result.body.id).not.toBe(type === "quote" ? LEAD_TESTS.fc_paid_20261008_T01.id : LEAD_TESTS.fc_paid_20261008_T02.id);
    expect(client.auth.getUser).not.toHaveBeenCalled();
    expect(repository.notifySubmittedLead).toHaveBeenCalledOnce();
    const save = type === "quote" ? repository.createQuoteRequest : repository.createContactLead;
    expect(save).toHaveBeenCalledWith(client, expect.objectContaining({ sourcePath: `/zh/${type}` }));
  });
});
