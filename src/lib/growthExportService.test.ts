import { describe, expect, it } from "vitest";
import { buildGrowthExportRows, resolveGrowthExportWindow } from "../../supabase/functions/growth-export/service.ts";

describe("growth-export service", () => {
  it("returns anonymized attribution without direct customer PII", async () => {
    const rows = await buildGrowthExportRows(
      [
        {
          id: "lead-1",
          name: "Customer Name",
          phone: "+60123456789",
          email: "customer@example.com",
          message: "Private renovation details",
          location: "Petaling Jaya, Selangor",
          project_type: "Residential renovation",
          status: "contacted",
          lead_quality: "high",
          first_touch_source: "google",
          first_touch_medium: "cpc",
          first_touch_campaign: "search-zh",
          gclid: "click-1",
          landing_page: "https://flashcast.com.my/zh/services/renovation?phone=private",
          deal_value: 12000,
          created_at: "2026-07-26T01:00:00Z",
        },
      ],
      [],
    );

    expect(rows[0]).toMatchObject({
      record_type: "lead",
      qualified: true,
      project_type: "residential_renovation",
      location_region: "selangor",
      first_touch_source: "google",
      landing_page: "/zh/services/renovation",
      value_myr: 12000,
    });
    const serialized = JSON.stringify(rows[0]);
    expect(serialized).not.toContain("Customer Name");
    expect(serialized).not.toContain("+60123456789");
    expect(serialized).not.toContain("customer@example.com");
    expect(serialized).not.toContain("Private renovation details");
  });

  it("blocks export windows longer than 90 days", () => {
    expect(() =>
      resolveGrowthExportWindow({
        startDate: "2026-01-01",
        endDate: "2026-07-26",
      }),
    ).toThrow(/90 days/);
  });
});
