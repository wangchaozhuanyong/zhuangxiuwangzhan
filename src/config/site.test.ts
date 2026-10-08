import { describe, expect, it } from "vitest";
import { safeSocialProfileUrl } from "./site";

describe("safeSocialProfileUrl", () => {
  it.each([
    ["facebook", "https://www.facebook.com/flashcast111"],
    ["instagram", "https://www.instagram.com/flashcast2025/"],
    ["tiktok", "https://www.tiktok.com/@flashcast121"],
    ["xiaohongshu", "https://www.xiaohongshu.com/user/profile/62088ac5000000001000ac0a"],
    ["xiaohongshu", "https://xhslink.cn/o/3o0hkmG1rpu"],
    ["facebook", "https://www.facebook.com/new-business"],
    ["instagram", "https://www.instagram.com/new_business/"],
    ["tiktok", "https://www.tiktok.com/@new_business"],
  ] as const)("accepts a configured %s account without a code-owned account list", (platform, url) => {
    expect(safeSocialProfileUrl(` ${url} `, platform)).toBe(url);
  });

  it.each([undefined, null, "", " ", "not-a-url", "https://www.facebook.com/", "https://www.facebook.com/not-created-yet/"])("omits empty, invalid and placeholder values: %s", value => {
    expect(safeSocialProfileUrl(value, "facebook")).toBe("");
  });

  it.each([
    "https://facebook.com.evil.example/flashcast/",
    "https://www.instagram.com/flashcast/",
    "http://www.facebook.com/flashcast/",
    "https://user:pass@www.facebook.com/flashcast/",
    "https://www.facebook.com:8443/flashcast/",
    "https://www.facebook.com/flashcast/?ref=tracking",
    "https://www.facebook.com/flashcast/#tracking",
    "javascript:alert(1)",
    "data:text/html,example",
  ])("rejects unsafe and cross-platform URLs: %s", url => {
    expect(safeSocialProfileUrl(url, "facebook")).toBe("");
  });

  it("requires a TikTok account path and rejects lookalike hosts", () => {
    expect(safeSocialProfileUrl("https://www.tiktok.com/explore", "tiktok")).toBe("");
    expect(safeSocialProfileUrl("https://www.tiktok.com/@flashcast121/video/123", "tiktok")).toBe("");
    expect(safeSocialProfileUrl("https://tiktok.com.evil.example/@flashcast121", "tiktok")).toBe("");
  });

  it("accepts only Xiaohongshu profile or official share paths", () => {
    expect(safeSocialProfileUrl("https://www.xiaohongshu.com/explore/62088ac5000000001000ac0a", "xiaohongshu")).toBe("");
    expect(safeSocialProfileUrl("https://xhslink.cn.evil.example/o/3o0hkmG1rpu", "xiaohongshu")).toBe("");
    expect(safeSocialProfileUrl("https://www.xiaohongshu.com/user/profile/62088ac5000000001000ac0a?xsec_source=app_share", "xiaohongshu")).toBe("");
  });
});
