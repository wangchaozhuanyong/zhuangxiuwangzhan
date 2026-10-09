import { describe, expect, it } from "vitest";
import { acceptanceSourcePath, LEAD_TESTS, readLeadTest } from "../../supabase/functions/_shared/lead-test-contract";
import { FORMAL_LEAD_SOURCE_FILTER, isLeadTestPage, isStoredLeadTest } from "./leadTest";
import { buildAdminLeadReport } from "./adminLeadReports";

describe("bounded lead test contract", () => {
  it("recognizes only the correct route, marker and form pair", () => {
    expect(readLeadTest("/zh/quote?fc_test=fc_paid_20261008_T01", "quote").test).toEqual(LEAD_TESTS.fc_paid_20261008_T01);
    expect(readLeadTest("/en/contact?fc_test=fc_paid_20261008_T02", "contact").test).toEqual(LEAD_TESTS.fc_paid_20261008_T02);
    for (const path of ["/zh/quote?fc_test=unknown", "/zh/quote?fc_test=", "/zh/quote?fc_test=fc_paid_20261008_T01&fc_test=fc_paid_20261008_T01", "/zh/contact?fc_test=fc_paid_20261008_T01", LEAD_TESTS.fc_paid_20261008_T01.sourcePath, "//example.org/zh/quote?fc_test=fc_paid_20261008_T01"]) {
      expect(readLeadTest(path, "quote").valid).toBe(false);
    }
  });
  it("does not classify ordinary UTM test traffic or missing source as TEST", () => {
    expect(readLeadTest("/", "quote")).toEqual({ valid: true, test: null });
    expect(readLeadTest("/zh/quote?utm_medium=test", "quote").test).toBeNull();
    expect(readLeadTest("https://flashcast.com.my/zh/quote", "quote").valid).toBe(true);
    expect(isLeadTestPage("/zh/quote?utm_medium=test")).toBe(false);
    expect(isStoredLeadTest(null)).toBe(false);
    expect(isStoredLeadTest("/zh/quote?fc_test=fc_paid_20261008_T01")).toBe(false);
  });
  it("keeps null-source customers while excluding exactly the server-assigned pair", () => {
    expect(FORMAL_LEAD_SOURCE_FILTER).toContain("source_path.is.null");
    const report = buildAdminLeadReport({ period: "all", leads: [
      { id: "customer", source_path: null },
      { id: "test", source_path: LEAD_TESTS.fc_paid_20261008_T02.sourcePath, status: "converted", deal_value: 9000 },
    ], quotes: [
      { id: "customer-quote", source_path: "/zh/quote?utm_medium=test" },
      { id: "test-quote", source_path: LEAD_TESTS.fc_paid_20261008_T01.sourcePath, status: "accepted", quoted_amount: 9000 },
    ] });
    expect(report.totals).toMatchObject({ submitted: 2, leads: 1, quotes: 1, won: 0, wonValue: 0, quotedValue: 0 });
  });
  it("excludes only complete server acceptance markers alongside the fixed TEST pair", () => {
    const marker = acceptanceSourcePath("contact", "e356c239-6bfb-8a94-93dd-01a489891234");
    expect(isStoredLeadTest(marker)).toBe(true);
    for (const path of [`${marker}/extra`, marker.replace("/contact/", "/other/"), marker.replace("/__internal_test__/", "/abinternalXtestyz/"), "/en/contact?internal=true", "/__internal_test__/acceptance/en/contact/not-a-uuid"]) {
      expect(isStoredLeadTest(path)).toBe(false);
    }
    expect(buildAdminLeadReport({ period: "all", leads: [{ id: "internal", source_path: marker }, { id: "customer", source_path: null }], quotes: [] }).totals.submitted).toBe(1);
    expect(readLeadTest(marker, "contact").valid).toBe(false);
  });
});
