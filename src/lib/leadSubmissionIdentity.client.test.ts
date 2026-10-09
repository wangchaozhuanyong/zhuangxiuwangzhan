import { webcrypto } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const fields = { name: "Synthetic Fixture", phone: "+60110000000", message: "Synthetic local test, no customer data." };
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("crypto", webcrypto);
  window.sessionStorage.clear();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("English form submission identity", () => {
  it.each(["quote", "contact"] as const)("reuses the %s logical attempt across retries and reload without storing form values", async (type) => {
    const identity = await import("@/lib/leadSubmissionIdentity");
    const first = await identity.getLeadSubmissionId(type, `/en/${type}`, fields);
    expect(await identity.getLeadSubmissionId(type, `/en/${type}`, { ...fields })).toBe(first);
    vi.resetModules();
    const reloaded = await import("@/lib/leadSubmissionIdentity");
    expect(await reloaded.getLeadSubmissionId(type, `/en/${type}`, fields)).toBe(first);
    const stored = window.sessionStorage.getItem(`flashcast:lead-submission:${type}`)!;
    expect(Object.keys(JSON.parse(stored)).sort()).toEqual(["createdAt", "fingerprint", "submissionId"]);
    for (const value of Object.values(fields)) expect(stored).not.toContain(value);
  });
  it("creates distinct identities for changed submissions, routes and explicit new intent", async () => {
    const identity = await import("@/lib/leadSubmissionIdentity");
    const first = await identity.getLeadSubmissionId("contact", "/en/contact", fields);
    expect(await identity.getLeadSubmissionId("contact", "/en/contact", { ...fields, message: "Another independent inquiry." })).not.toBe(first);
    const next = await identity.getLeadSubmissionId("contact", "/en/contact?utm_medium=internal", fields);
    expect(next).not.toBe(first);
    identity.resetLeadSubmissionIdentity("contact");
    expect(await identity.getLeadSubmissionId("contact", "/en/contact?utm_medium=internal", fields)).not.toBe(next);
  });
  it("bounds retry identity to 30 minutes without extending it on each retry", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-09T15:00:00Z"));
    const identity = await import("@/lib/leadSubmissionIdentity");
    const first = await identity.getLeadSubmissionId("quote", "/en/quote", fields);
    vi.advanceTimersByTime(29 * 60_000);
    expect(await identity.getLeadSubmissionId("quote", "/en/quote", fields)).toBe(first);
    vi.advanceTimersByTime(60_000);
    expect(await identity.getLeadSubmissionId("quote", "/en/quote", fields)).not.toBe(first);
  });
  it("retains an in-memory identity when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const identity = await import("@/lib/leadSubmissionIdentity");
    const first = await identity.getLeadSubmissionId("contact", "/en/contact", fields);
    expect(await identity.getLeadSubmissionId("contact", "/en/contact", fields)).toBe(first);
  });
  it("does not alter fixed TEST or routes outside the authorized English scope", async () => {
    const identity = await import("@/lib/leadSubmissionIdentity");
    for (const path of ["/zh/quote", "/en/quote?fc_test=fc_paid_20261008_T01", "/en/quote/", "/en/contact"]) {
      expect(await identity.getLeadSubmissionId("quote", path, fields)).toBeUndefined();
    }
    expect(window.sessionStorage.length).toBe(0);
  });
  it("ignores corrupt or future-dated storage instead of reusing a foreign attempt", async () => {
    window.sessionStorage.setItem("flashcast:lead-submission:contact", "{broken");
    const identity = await import("@/lib/leadSubmissionIdentity");
    const first = await identity.getLeadSubmissionId("contact", "/en/contact", fields);
    const stored = JSON.parse(window.sessionStorage.getItem("flashcast:lead-submission:contact")!);
    window.sessionStorage.setItem("flashcast:lead-submission:contact", JSON.stringify({ ...stored, createdAt: Date.now() + 60_000 }));
    expect(await identity.getLeadSubmissionId("contact", "/en/contact", fields)).not.toBe(first);
  });
});
