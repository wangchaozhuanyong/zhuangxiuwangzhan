import { beforeEach, describe, expect, it, vi } from "vitest";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ requireSupabase: () => ({ functions: { invoke } }) }));
import { invokeSubmitLeadFunction } from "@/backend/modules/leads/repository/leadRepository";
beforeEach(() => invoke.mockReset());
const id = "a054622a-7a86-4c12-a4ae-3fcf9bbc0409";
describe("saved lead receipt", () => {
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
