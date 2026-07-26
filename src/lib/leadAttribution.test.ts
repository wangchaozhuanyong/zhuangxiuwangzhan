import { beforeEach, describe, expect, it } from "vitest";
import { captureLeadAttribution, getLeadAttribution } from "@/lib/leadAttribution";

const clearCookies = () => {
  document.cookie.split(";").forEach((part) => {
    const name = part.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
};

describe("lead attribution", () => {
  beforeEach(() => {
    clearCookies();
    Object.defineProperty(document, "referrer", { configurable: true, value: "" });
  });

  it("keeps the first campaign touch and updates the last campaign touch", () => {
    window.history.pushState(
      {},
      "",
      "/zh/services/renovation?utm_source=google&utm_medium=cpc&utm_campaign=search-zh&gclid=click-1",
    );
    captureLeadAttribution();

    window.history.pushState({}, "", "/zh/quote?utm_source=telegram&utm_medium=social&utm_campaign=follow-up");
    const attribution = getLeadAttribution();

    expect(attribution.firstTouch).toMatchObject({
      source: "google",
      medium: "cpc",
      campaign: "search-zh",
      landingPage: "/zh/services/renovation",
      gclid: "click-1",
    });
    expect(attribution.lastTouch).toMatchObject({
      source: "telegram",
      medium: "social",
      campaign: "follow-up",
      landingPage: "/zh/quote",
    });
    expect(attribution.gclid).toBe("click-1");
  });

  it("does not replace campaign attribution with an internal direct page", () => {
    window.history.pushState({}, "", "/en/contact?utm_source=google&utm_medium=cpc&utm_campaign=brand");
    captureLeadAttribution();
    window.history.pushState({}, "", "/en/quote");

    const attribution = getLeadAttribution();

    expect(attribution.firstTouch.campaign).toBe("brand");
    expect(attribution.lastTouch.campaign).toBe("brand");
    expect(attribution.landingPage).toBe("/en/contact");
  });

  it("persists the last non-direct campaign across an internal navigation", () => {
    window.history.pushState({}, "", "/en/?utm_source=google&utm_medium=cpc&utm_campaign=first-campaign");
    captureLeadAttribution();
    window.history.pushState(
      {},
      "",
      "/en/services/kitchen?utm_source=telegram&utm_medium=social&utm_campaign=later-campaign",
    );
    captureLeadAttribution();
    window.history.pushState({}, "", "/en/quote");

    const attribution = getLeadAttribution();

    expect(attribution.firstTouch.campaign).toBe("first-campaign");
    expect(attribution.lastTouch.campaign).toBe("later-campaign");
  });
});
