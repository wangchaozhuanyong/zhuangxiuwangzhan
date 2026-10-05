import { beforeEach, describe, expect, it, vi } from "vitest";
import { addAdminQuoteFollowup } from "./quoteService";
import { addAdminLeadFollowup } from "@/backend/modules/leads/service/leadService";

const { insertFollowup, updateQuote, updateLead, getUser, operations } = vi.hoisted(() => ({
  insertFollowup: vi.fn(),
  updateQuote: vi.fn(),
  updateLead: vi.fn(),
  getUser: vi.fn(),
  operations: [] as string[],
}));

vi.mock("@/lib/supabase", () => ({
  requireSupabase: () => ({
    auth: { getUser },
    from: (table: string) => {
      if (table === "lead_followups") return { insert: insertFollowup };
      if (table === "quote_requests") return {
        update: (patch: Record<string, unknown>) => ({ eq: (column: string, value: unknown) => updateQuote(patch, column, value) }),
      };
      if (table === "leads") return {
        update: (patch: Record<string, unknown>) => ({ eq: (column: string, value: unknown) => updateLead(patch, column, value) }),
      };
      throw new Error("Unexpected test table");
    },
  }),
}));

describe("quote followups through the module public boundary", () => {
  beforeEach(() => {
    operations.length = 0;
    getUser.mockReset().mockResolvedValue({ data: { user: { id: "test-actor" } } });
    insertFollowup.mockReset().mockImplementation(async () => { operations.push("insert-followup"); return { error: null }; });
    updateQuote.mockReset().mockImplementation(async () => { operations.push("sync-quote"); return { error: null }; });
    updateLead.mockReset().mockImplementation(async () => { operations.push("sync-lead"); return { error: null }; });
  });

  it("preserves one insert before syncing the next followup date", async () => {
    const nextFollowUpAt = "2026-10-06T03:00:00Z";
    await expect(addAdminQuoteFollowup({ quoteRequestId: "test-quote", followupType: "note", content: "  test note  ", nextFollowUpAt })).resolves.toEqual({});
    expect(insertFollowup).toHaveBeenCalledExactlyOnceWith({
      lead_id: null, quote_request_id: "test-quote", followup_type: "note", content: "test note", next_follow_up_at: nextFollowUpAt, created_by: "test-actor",
    });
    expect(updateQuote).toHaveBeenCalledExactlyOnceWith({ next_follow_up_at: nextFollowUpAt }, "id", "test-quote");
    expect(operations).toEqual(["insert-followup", "sync-quote"]);
  });

  it("does not update the quote when there is no next followup date", async () => {
    await expect(addAdminQuoteFollowup({ quoteRequestId: "test-quote", followupType: "note", content: "test note" })).resolves.toEqual({});
    expect(insertFollowup).toHaveBeenCalledTimes(1);
    expect(updateQuote).not.toHaveBeenCalled();
  });

  it("keeps the successful followup when the quote date sync fails", async () => {
    const syncError = new Error("Sync unavailable");
    updateQuote.mockResolvedValue({ error: syncError });
    await expect(addAdminQuoteFollowup({ quoteRequestId: "test-quote", followupType: "note", content: "test note", nextFollowUpAt: "2026-10-06T03:00:00Z" })).resolves.toEqual({ syncError });
    expect(insertFollowup).toHaveBeenCalledTimes(1);
    expect(updateQuote).toHaveBeenCalledTimes(1);
  });

  it("propagates insert failure before any quote update", async () => {
    const error = new Error("Insert unavailable");
    insertFollowup.mockResolvedValue({ error });
    await expect(addAdminQuoteFollowup({ quoteRequestId: "test-quote", followupType: "note", content: "test note", nextFollowUpAt: "2026-10-06T03:00:00Z" })).rejects.toBe(error);
    expect(updateQuote).not.toHaveBeenCalled();
  });

  it("keeps lead identity and insert order through the same public boundary", async () => {
    const nextFollowUpAt = "2026-10-06T03:00:00Z";
    await expect(addAdminLeadFollowup({ leadId: "test-lead", followupType: "note", content: "  test note  ", nextFollowUpAt })).resolves.toEqual({});
    expect(insertFollowup).toHaveBeenCalledExactlyOnceWith({
      lead_id: "test-lead", quote_request_id: null, followup_type: "note", content: "test note", next_follow_up_at: nextFollowUpAt, created_by: "test-actor",
    });
    expect(updateLead).toHaveBeenCalledExactlyOnceWith({ next_follow_up_at: nextFollowUpAt }, "id", "test-lead");
    expect(updateQuote).not.toHaveBeenCalled();
    expect(operations).toEqual(["insert-followup", "sync-lead"]);
  });

  it("preserves a saved lead followup when its date sync fails", async () => {
    const syncError = new Error("Lead sync unavailable");
    updateLead.mockResolvedValue({ error: syncError });
    await expect(addAdminLeadFollowup({ leadId: "test-lead", followupType: "note", content: "test note", nextFollowUpAt: "2026-10-06T03:00:00Z" })).resolves.toEqual({ syncError });
    expect(insertFollowup).toHaveBeenCalledTimes(1);
    expect(updateLead).toHaveBeenCalledTimes(1);
  });
});
