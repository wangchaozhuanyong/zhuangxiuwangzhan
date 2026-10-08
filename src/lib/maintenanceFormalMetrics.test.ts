import { describe, expect, it } from "vitest";
import { collectMaintenanceMetrics } from "../../supabase/functions/maintenance-reminder/repository";
import { FORMAL_LEAD_SOURCE_FILTER } from "./leadTest";
import type { MaintenanceClient } from "../../supabase/functions/maintenance-reminder/types";

describe("maintenance metrics source contract", () => {
  it("excludes TEST for every lead/quote metric without filtering content counts", async () => {
    const calls: { table: string; filters: string[] }[] = [];
    const client = { from: (table: string) => ({ select: () => {
      const call = { table, filters: [] as string[] }; calls.push(call);
      const q = { or: (filter: string) => { call.filters.push(filter); return q; },
        eq: () => q, lt: () => q, gte: () => q,
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ count: 1, error: null })),
      }; return q;
    } }) } as unknown as MaintenanceClient;
    const result = await collectMaintenanceMetrics(client);
    expect(result.newLeads).toBe(1);
    expect(calls).toHaveLength(10);
    for (const call of calls) expect(call.filters).toEqual(["leads", "quote_requests"].includes(call.table) ? [FORMAL_LEAD_SOURCE_FILTER] : []);
  });
});
