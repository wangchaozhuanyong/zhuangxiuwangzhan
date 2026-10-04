import { describe, expect, it } from "vitest";
import { safeSocialProfileUrl } from "./site";

describe("safeSocialProfileUrl", () => {
  it("hides valid-looking social URLs until the owner confirms exact accounts", () => {
    expect(safeSocialProfileUrl("https://www.instagram.com/flashcast/", "instagram")).toBe("");
    expect(safeSocialProfileUrl("https://www.facebook.com/flashcast/", "facebook")).toBe("");
    expect(safeSocialProfileUrl("", "facebook")).toBe("");
  });

  it("accepts only the exact owner-confirmed profile on that platform's official HTTPS host", () => {
    const facebook = "https://www.facebook.com/flashcast/";
    const instagram = "https://www.instagram.com/flashcast/";
    expect(safeSocialProfileUrl(facebook, "facebook", [facebook])).toBe(facebook);
    expect(safeSocialProfileUrl(instagram, "instagram", [instagram])).toBe(instagram);
    expect(safeSocialProfileUrl("https://facebook.com.evil.example/flashcast/", "facebook", ["https://facebook.com.evil.example/flashcast/"])).toBe("");
    expect(safeSocialProfileUrl(instagram, "facebook", [instagram])).toBe("");
    expect(safeSocialProfileUrl("http://www.instagram.com/flashcast/", "instagram", ["http://www.instagram.com/flashcast/"])).toBe("");
    expect(safeSocialProfileUrl("https://user:pass@www.facebook.com/flashcast/", "facebook", ["https://user:pass@www.facebook.com/flashcast/"])).toBe("");
    expect(safeSocialProfileUrl("https://www.facebook.com/flashcast/?ref=unconfirmed", "facebook", ["https://www.facebook.com/flashcast/?ref=unconfirmed"])).toBe("");
  });
});
