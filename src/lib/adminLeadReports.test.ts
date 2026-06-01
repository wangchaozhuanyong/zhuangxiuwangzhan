import { describe, expect, it } from "vitest";
import {
  buildAdminLeadReport,
  getAdminLeadReportStartIso,
  normalizeAdminLeadReportPeriod,
} from "@/lib/adminLeadReports";

describe("adminLeadReports", () => {
  it("normalizes report period values", () => {
    expect(normalizeAdminLeadReportPeriod("30d")).toBe("30d");
    expect(normalizeAdminLeadReportPeriod("all")).toBe("all");
    expect(normalizeAdminLeadReportPeriod("bad")).toBe("90d");
  });

  it("computes period start for date-range queries", () => {
    expect(getAdminLeadReportStartIso("all", new Date("2026-06-01T00:00:00.000Z"))).toBeNull();
    expect(getAdminLeadReportStartIso("30d", new Date("2026-06-01T00:00:00.000Z"))).toBe("2026-05-02T00:00:00.000Z");
  });

  it("builds source summaries and a renovation conversion funnel", () => {
    const report = buildAdminLeadReport({
      language: "zh",
      now: new Date("2026-06-01T12:00:00.000Z"),
      period: "90d",
      leads: [
        {
          id: "lead-1",
          status: "converted",
          source_path: "/zh/contact",
          project_type: "Residential Renovation",
          deal_value: 12000,
          created_at: "2026-05-15T08:00:00.000Z",
        },
        {
          id: "lead-old",
          status: "new",
          source_path: "/zh/contact",
          created_at: "2025-12-01T08:00:00.000Z",
        },
      ],
      quotes: [
        {
          id: "quote-1",
          status: "accepted",
          source_path: "/zh/quote?source=project&title=Mont%20Kiara%20Condo&projectType=Residential%20Renovation",
          project_type: "Residential Renovation",
          quoted_amount: 18000,
          created_at: "2026-05-20T08:00:00.000Z",
        },
        {
          id: "quote-2",
          status: "pending",
          source_path: "/zh/quote?source=service&title=全屋装修",
          project_type: "Residential Renovation",
          created_at: "2026-05-21T08:00:00.000Z",
        },
      ],
    });

    expect(report.totals.submitted).toBe(3);
    expect(report.totals.won).toBe(2);
    expect(report.totals.wonValue).toBe(30000);
    expect(report.funnel.map((stage) => stage.count)).toEqual([3, 2, 2, 2]);
    expect(report.sourceRows.map((row) => row.label)).toContain("装修案例：Mont Kiara Condo");
    expect(report.projectTypeRows[0]).toMatchObject({
      label: "Residential Renovation",
      total: 3,
      won: 2,
    });
  });
});
