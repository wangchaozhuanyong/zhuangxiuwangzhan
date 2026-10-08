import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAdminLeadDetail, fetchAdminLeadReportRows } from "./leadRepository";
import { fetchAdminQuoteDetail, fetchAdminQuoteReportRows } from "@/backend/modules/quotes/repository/quoteRepository";
import { FORMAL_LEAD_SOURCE_FILTER } from "@/lib/leadTest";

const state = vi.hoisted(() => ({ total: 1207, failOffset: -1, historyError: null as Error | null, calls: [] as Array<{ table: string; filter?: string; range?: [number, number]; orders: string[]; cutoff?: string; signal?: AbortSignal }> }));
vi.mock("@/lib/supabase", () => ({ requireSupabase: () => ({ from: (table: string) => {
  const call = { table, orders: [] as string[] } as typeof state.calls[number]; state.calls.push(call);
  const builder = {
    select: () => builder, eq: () => builder,
    or: (filter: string) => { call.filter = filter; return builder; },
    gte: () => builder,
    lte: (_field: string, cutoff: string) => { call.cutoff = cutoff; return builder; },
    order: (field: string) => { call.orders.push(field); return builder; },
    range: (from: number, to: number) => { call.range = [from, to]; return builder; },
    single: () => builder,
    abortSignal: (signal: AbortSignal) => { call.signal = signal; return builder; },
    then: (resolve: (value: unknown) => void) => {
      if (table === "lead_followups") return Promise.resolve({ data: null, error: state.historyError }).then(resolve);
      if (!call.range) return Promise.resolve({ data: { id: "fixture" }, error: null }).then(resolve);
      const [from, to] = call.range;
      const data = Array.from({ length: Math.max(0, Math.min(to + 1, state.total) - from) }, (_, i) => ({ id: `fixture-${from + i}`, created_at: "2026-10-01T00:00:00Z" }));
      return Promise.resolve({ data, error: from === state.failOffset ? new Error("Page failed") : null }).then(resolve);
    },
  };
  return builder;
} }) }));

beforeEach(() => { state.total = 1207; state.failOffset = -1; state.historyError = null; state.calls.length = 0; });

describe("CRM complete reads", () => {
  it.each([fetchAdminLeadReportRows, fetchAdminQuoteReportRows])("reads every report page with stable ordering and formal-source filtering", async read => {
    const signal = new AbortController().signal;
    const rows = await read("2026-10-01T00:00:00Z", signal);
    expect(rows).toHaveLength(1207);
    expect(new Set(rows.map(row => row.id)).size).toBe(1207);
    expect(state.calls.map(call => call.range)).toEqual([[0, 499], [500, 999], [1000, 1499]]);
    for (const call of state.calls) {
      expect(call.orders).toEqual(["created_at", "id"]);
      expect(call.filter).toBe(FORMAL_LEAD_SOURCE_FILTER);
      expect(call.signal).toBe(signal);
      expect(call.cutoff).toBe(state.calls[0]!.cutoff);
    }
  });
  it.each([fetchAdminLeadReportRows, fetchAdminQuoteReportRows])("rejects later-page failures instead of returning a successful truncated report", async read => {
    state.failOffset = 500;
    await expect(read()).rejects.toThrow("Page failed");
    expect(state.calls).toHaveLength(2);
  });
  it.each([fetchAdminLeadDetail, fetchAdminQuoteDetail])("propagates history failure instead of showing an empty timeline", async read => {
    state.historyError = new Error("Timeline unavailable");
    const signal = new AbortController().signal;
    await expect(read("fixture", signal)).rejects.toBe(state.historyError);
    expect(state.calls).toHaveLength(2);
    expect(state.calls.every(call => call.signal === signal)).toBe(true);
  });
});
