import { beforeEach, describe, expect, it, vi } from "vitest";
import { addAdminQuoteFollowup, updateAdminQuote } from "./quoteService";
import { addAdminLeadFollowup } from "@/backend/modules/leads/service/leadService";

const { insertFollowup, persist, getUser, operations } = vi.hoisted(() => ({
  insertFollowup: vi.fn(),
  persist: vi.fn(),
  getUser: vi.fn(),
  operations: [] as string[],
}));

vi.mock("@/lib/supabase", () => ({
  requireSupabase: () => ({
    auth: { getUser },
    from: (table: string) => {
      if (table === "lead_followups") return { insert: insertFollowup };
      throw new Error("Unexpected test table");
    },
  }),
}));

vi.mock("@/backend/modules/system", async (original) => ({
  ...await original<typeof import("@/backend/modules/system")>(), persistAdminRecord: persist,
}));

const version = "2026-10-06T01:02:03.123456Z";
const nextFollowUpAt = "2026-10-06T03:00:00Z";

describe("CRM follows the versioned persistence public boundary", () => {
  beforeEach(() => {
    operations.length = 0;
    getUser.mockReset().mockResolvedValue({ data: { user: { id: "test-actor" } } });
    insertFollowup.mockReset().mockImplementation(async () => { operations.push("insert-followup"); return { error: null }; });
    persist.mockReset().mockImplementation(async ({ table, payload }) => { operations.push(`sync-${table}`); return { record: { ...payload, updated_at: "saved-version" } }; });
  });

  it.each([
    ["quote_requests", "quoteRequestId", addAdminQuoteFollowup],
    ["leads", "leadId", addAdminLeadFollowup],
  ] as const)("inserts one followup before a versioned %s date save", async (table, identity, add) => {
    const input = { leadId: "test-record", quoteRequestId: "test-record", followupType: "note", content: "  test note  ", nextFollowUpAt, expectedUpdatedAt: version };
    const result = await add(input);
    expect(result.record).toEqual({ next_follow_up_at: nextFollowUpAt, updated_at: "saved-version" });
    expect(insertFollowup).toHaveBeenCalledExactlyOnceWith({
      lead_id: identity === "leadId" ? "test-record" : null, quote_request_id: identity === "quoteRequestId" ? "test-record" : null,
      followup_type: "note", content: "test note", next_follow_up_at: nextFollowUpAt, created_by: "test-actor",
    });
    expect(persist).toHaveBeenCalledExactlyOnceWith({ table, id: "test-record", payload: { next_follow_up_at: nextFollowUpAt }, expectedUpdatedAt: version });
    expect(operations).toEqual(["insert-followup", `sync-${table}`]);
  });

  it("does not mutate a date when the followup has none", async () => {
    await expect(addAdminQuoteFollowup({ quoteRequestId: "test-quote", followupType: "note", content: "test note" })).resolves.toEqual({});
    expect(insertFollowup).toHaveBeenCalledTimes(1); expect(persist).not.toHaveBeenCalled();
  });

  it("returns an independent sync failure without losing or repeating the insert", async () => {
    const syncError = new Error("Sync unavailable"); persist.mockRejectedValue(syncError);
    await expect(addAdminQuoteFollowup({ quoteRequestId: "test-quote", followupType: "note", content: "test note", nextFollowUpAt, expectedUpdatedAt: version })).resolves.toEqual({ syncError });
    expect(insertFollowup).toHaveBeenCalledTimes(1); expect(persist).toHaveBeenCalledTimes(1);
  });

  it("does not write the record after a failed followup insert", async () => {
    const error = new Error("Insert unavailable"); insertFollowup.mockResolvedValue({ error });
    await expect(addAdminLeadFollowup({ leadId: "test-lead", followupType: "note", content: "test note", nextFollowUpAt, expectedUpdatedAt: version })).rejects.toBe(error);
    expect(persist).not.toHaveBeenCalled();
  });

  it("fails closed when the editor has no version", async () => {
    await expect(updateAdminQuote("test-quote", { status: "quoted" }, undefined)).rejects.toMatchObject({ code: "conflict" });
    expect(persist).not.toHaveBeenCalled();
  });

  it("forwards the editor version and propagates a stale-record rejection", async () => {
    const stale = new Error("Record changed"); persist.mockRejectedValue(stale);
    await expect(updateAdminQuote("test-quote", { status: "quoted" }, version)).rejects.toBe(stale);
    expect(persist).toHaveBeenCalledExactlyOnceWith({ table: "quote_requests", id: "test-quote", payload: { status: "quoted" }, expectedUpdatedAt: version });
  });
});
