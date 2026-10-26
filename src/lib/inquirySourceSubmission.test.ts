import { readInquirySources } from "./inquirySourcePath";
import { webcrypto } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const wire = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/backend/modules/system", () => ({ AdminMutationError: Error, persistAdminRecord: vi.fn() }));
vi.mock("@/backend/modules/followups", () => ({ addLeadFollowup: vi.fn() }));
vi.mock("@/backend/modules/leads/repository/leadRepository", () => ({
  invokeSubmitLeadFunction: wire.invoke, fetchAdminLeadDetail: vi.fn(), fetchAdminLeadList: vi.fn(), fetchAdminLeadReportRows: vi.fn(),
}));
vi.mock("@/lib/turnstile", () => ({ getTurnstileToken: vi.fn(async () => undefined) }));
beforeEach(() => {
  vi.resetModules(); vi.stubGlobal("crypto", webcrypto); window.sessionStorage.clear();
  wire.invoke.mockReset().mockResolvedValue({ ok: true, id: "00000000-0000-4000-8000-000000000001" });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("existing submit-lead offline wire compatibility", () => {
  it.each([
    ["contact", "/en/contact"], ["quote", "/zh/quote"], ["quote", "/ms/landing/synthetic-campaign"],
  ])("bounds actual %s wire payload from %s without changing retries or guard fields", async (type, route) => {
    window.history.replaceState({}, "", "/en?utm_source=chatgpt&utm_medium=cpc");
    const source = await import("./inquirySource"); source.captureInquirySources(true);
    const service = await import("@/backend/modules/leads/service/leadService");
    window.history.replaceState({}, "", route);
    const sourcePath = route + "?source=service&title=" + encodeURIComponent("全屋定制".repeat(100)) + "&gclid=DO_NOT_SAVE&email=DO_NOT_SAVE";
    const payload = { name: "Offline Fixture", phone: "+60110000000", email: "fixture@example.invalid", message: "Offline synthetic non-customer enquiry.", details: "Offline synthetic non-customer enquiry.", projectType: "Kitchen Cabinet", location: "Kuala Lumpur", website: "", startedAt: Date.now() - 5000, sourcePath };
    const submit = type === "contact" ? service.submitContactLead : service.submitQuoteRequest;
    await submit(payload); await submit(payload);
    const first = wire.invoke.mock.calls[0][0], second = wire.invoke.mock.calls[1][0];
    expect(first.type).toBe(type); expect(first.sourcePath.length).toBeLessThanOrEqual(300);
    expect(first.sourcePath).not.toMatch(/gclid|email|DO_NOT_SAVE/);
    expect(readInquirySources(first.sourcePath).last).toBe("chatgpt_paid");
    expect(first.submissionId).toMatch(/^[a-f0-9-]{36}$/); expect(second.submissionId).toBe(first.submissionId);
    expect(first.website).toBe(""); expect(first.startedAt).toBe(payload.startedAt); expect(first.elapsedMs).toBeGreaterThanOrEqual(5000);
    expect(first.name).toBe(payload.name); expect(first.phone).toBe(payload.phone);
    console.info("INQUIRY_SYNTHETIC_PAYLOAD " + JSON.stringify({ route, offline_only: true, no_network: true, ...first }));
    wire.invoke.mockRejectedValueOnce(new Error("offline rejection"));
    await expect(submit(payload)).rejects.toThrow("offline rejection");
    await submit(payload); expect(wire.invoke.mock.calls[3][0].submissionId).toBe(first.submissionId);
  });
  it("keeps fixed TEST suppression, honeypot and original submission identity input", async () => {
    window.history.replaceState({}, "", "/en/quote");
    const service = await import("@/backend/modules/leads/service/leadService");
    await service.submitQuoteRequest({ name: "[TEST] Offline fixture", phone: "+60110000000", projectType: "Other", location: "Synthetic", details: "Offline fixture", sourcePath: "/en/quote?fc_test=fc_paid_20261008_T01", website: "synthetic trap", startedAt: Date.now() - 5000 });
    expect(wire.invoke.mock.calls[0][0]).toMatchObject({ submissionId: undefined, website: "synthetic trap" });
    expect(wire.invoke.mock.calls[0][0].sourcePath).toContain("fc_test=fc_paid_20261008_T01");
  });
  it("freezes attribution at submission start while the existing anti-bot token is pending", async () => {
    window.history.replaceState({}, "", "/en/contact?utm_source=chatgpt&utm_medium=cpc");
    const source = await import("./inquirySource"); source.captureInquirySources(true);
    const token = await import("@/lib/turnstile");
    vi.mocked(token.getTurnstileToken).mockClear();
    let finish!: (value: undefined) => void;
    vi.mocked(token.getTurnstileToken).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const service = await import("@/backend/modules/leads/service/leadService");
    const pending = service.submitContactLead({name:"Offline Fixture",phone:"+60110000000",message:"Offline synthetic enquiry.",website:"",startedAt:Date.now()-5000});
    await vi.waitFor(() => expect(token.getTurnstileToken).toHaveBeenCalled());
    window.history.replaceState({}, "", "/en?utm_source=google&utm_medium=cpc"); source.captureInquirySources();
    finish(undefined); await pending;
    expect(readInquirySources(wire.invoke.mock.calls[0][0].sourcePath).last).toBe("chatgpt_paid");
    expect(source.currentInquirySources().last).toBe("google_paid");
  });
  it("still submits via the existing service when all browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype,"getItem").mockImplementation(()=>{throw Error("disabled");});
    vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw Error("disabled");});
    window.history.replaceState({},"","/en?utm_source=google&utm_medium=cpc");
    const source=await import("./inquirySource");source.captureInquirySources(true);
    window.history.replaceState({},"","/en/contact");
    const service=await import("@/backend/modules/leads/service/leadService");
    await service.submitContactLead({name:"Offline Fixture",phone:"+60110000000",message:"Offline synthetic enquiry.",website:"",startedAt:Date.now()-5000});
    expect(readInquirySources(wire.invoke.mock.calls[0][0].sourcePath).last).toBe("google_paid");
  });
});
