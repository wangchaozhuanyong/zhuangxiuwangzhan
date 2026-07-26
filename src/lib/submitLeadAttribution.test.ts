import { describe, expect, it } from "vitest";
import { normalizeLeadAttribution } from "../../supabase/functions/submit-lead/service.ts";

describe("submit-lead attribution", () => {
  it("normalizes first and last touch fields with bounded values", () => {
    const attribution = normalizeLeadAttribution({
      firstTouch: {
        source: " google ",
        medium: "cpc",
        campaign: "search-zh",
        landingPage: "/zh/services/renovation",
        gclid: "first-click",
      },
      lastTouch: {
        source: "telegram",
        medium: "social",
        campaign: "follow-up",
      },
    });

    expect(attribution).toMatchObject({
      firstTouchSource: "google",
      firstTouchCampaign: "search-zh",
      lastTouchSource: "telegram",
      lastTouchCampaign: "follow-up",
      landingPage: "/zh/services/renovation",
      gclid: "first-click",
    });
  });
});
