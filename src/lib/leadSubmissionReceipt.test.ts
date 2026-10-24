import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ requireSupabase: () => ({ functions: { invoke } }) }));
import { invokeSubmitLeadFunction } from "@/backend/modules/leads/repository/leadRepository";
beforeEach(() => { invoke.mockReset(); });
afterEach(() => vi.useRealTimers());
const id = "a054622a-7a86-4c12-a4ae-3fcf9bbc0409";
describe("saved lead receipt", () => {
  it("ends a stalled SDK request without acknowledging a save or retrying it", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | null | undefined;
    const transport = vi.fn<typeof fetch>((_url, init) => {
      signal = init?.signal;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(new DOMException("Synthetic stalled request", "AbortError")), { once: true });
      });
    });
    const client = createClient("https://fixture.invalid", "synthetic-anon", {
      auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: transport },
    });
    invoke.mockImplementation((name, options) => client.functions.invoke(name, options));
    let outcome = "pending";
    const result = invokeSubmitLeadFunction({ type: "quote", submissionId: id });
    void result.then(() => { outcome = "acknowledged"; }, () => { outcome = "rejected"; });
    await vi.advanceTimersByTimeAsync(30_001);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(outcome).toBe("rejected");
    expect(signal?.aborted).toBe(true);
    await expect(result).rejects.toThrow();
  });

  it.each([null, {}, { ok: false, id }, { ok: true }, { ok: true, id: "" }, { ok: true, id: "customer@example.com" }])("rejects an unconfirmed response %j", async (data) => {
    invoke.mockResolvedValue({ data, error: null });
    await expect(invokeSubmitLeadFunction({ type: "quote" })).rejects.toThrow("could not be confirmed");
  });
  it("preserves typed server receipt flags and ignores truthy impersonation", async () => {
    invoke.mockResolvedValue({ data: { ok: true, id, internal: true, deduplicated: true }, error: null });
    expect(await invokeSubmitLeadFunction({ type: "contact" })).toEqual({ ok: true, id, internal: true, deduplicated: true });
    invoke.mockResolvedValue({ data: { ok: true, id, internal: "true", deduplicated: 1 }, error: null });
    expect(await invokeSubmitLeadFunction({ type: "contact" })).toEqual({ ok: true, id, internal: false, deduplicated: false });
  });
  it("propagates transport and business rejection without inventing a saved ID", async () => {
    invoke.mockResolvedValue({ data: { error: "Synthetic save failure" }, error: null });
    await expect(invokeSubmitLeadFunction({ type: "quote" })).rejects.toThrow("Synthetic save failure");
    invoke.mockResolvedValue({ data: null, error: new Error("Synthetic transport failure") });
    await expect(invokeSubmitLeadFunction({ type: "contact" })).rejects.toThrow("Synthetic transport failure");
  });
});
