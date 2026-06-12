import { describe, expect, it } from "vitest";

import { gaMeasurementId, isAnalyticsEnabled } from "@/lib/analytics";

describe("analytics defaults", () => {
  it("keeps the GA4 measurement id configured by default", () => {
    expect(gaMeasurementId).toBe("G-K71PQ0MSV2");
    expect(isAnalyticsEnabled).toBe(true);
  });
});
