import { beforeEach, describe, expect, it, vi } from "vitest";
import { FORMAL_LEAD_SOURCE_FILTER } from "./leadTest";

const queries = vi.hoisted(() => ({ calls: [] as Array<{ table: string; filters: string[] }> }));
vi.mock("@/lib/supabase", () => ({ requireSupabase: () => ({ from: (table: string) => {
  const entry = { table, filters: [] as string[] };
  queries.calls.push(entry);
  const result = Promise.resolve({ data: [], error: null, count: 0 });
  const builder = Object.assign(result, {
    select: () => builder, eq: () => builder, gte: () => builder, lt: () => builder,
    not: () => builder, lte: () => builder, in: () => builder, order: () => builder, limit: () => builder,
    or: (filter: string) => { entry.filters.push(filter); return builder; },
  });
  return builder;
} }) }));
import { fetchAdminDashboardStatsData } from "@/backend/modules/system/repository/dashboardRepository";
import { fetchAdminLeadReportRows } from "@/backend/modules/leads/repository/leadRepository";
import { fetchAdminQuoteReportRows } from "@/backend/modules/quotes/repository/quoteRepository";
beforeEach(() => { queries.calls.length = 0; });

describe("formal lead query boundaries", () => {
  it("filters TEST before report pagination, preserving null-source customers", async () => {
    await fetchAdminLeadReportRows();
    await fetchAdminQuoteReportRows();
    expect(queries.calls).toHaveLength(2);
    for (const query of queries.calls) expect(query.filters).toEqual([FORMAL_LEAD_SOURCE_FILTER]);
    expect(FORMAL_LEAD_SOURCE_FILTER).toMatch(/^source_path.is.null,source_path.not.in./);
  });
  it("filters every lead/quote dashboard count and recent row query, not unrelated content", async () => {
    await fetchAdminDashboardStatsData();
    const leadQueries = queries.calls.filter(query => ["leads", "quote_requests"].includes(query.table));
    expect(leadQueries).toHaveLength(12);
    for (const query of leadQueries) expect(query.filters).toEqual([FORMAL_LEAD_SOURCE_FILTER]);
    expect(queries.calls.filter(query => !["leads", "quote_requests"].includes(query.table))).toHaveLength(5);
  });
});
