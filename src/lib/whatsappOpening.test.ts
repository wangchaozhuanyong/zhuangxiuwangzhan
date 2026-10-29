import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Language } from "@/i18n/routes";

const expected: Record<Language, readonly [string, string, string]> = {
  zh: ["你好，我在谷歌看到您的公司，需要咨询装修方面的事情。", "你好，我在ChatGPT看到您的公司，需要咨询装修方面的事情。", "你好，需要咨询装修方面的事情。"],
  en: ["Hi, I found your company on Google and would like to ask about renovation.", "Hi, I found your company on ChatGPT and would like to ask about renovation.", "Hi, I'd like to ask about renovation."],
  ms: ["Hai, saya menemui syarikat anda di Google dan ingin bertanya tentang pengubahsuaian.", "Hai, saya menemui syarikat anda di ChatGPT dan ingin bertanya tentang pengubahsuaian.", "Hai, saya ingin bertanya tentang pengubahsuaian."],
};
beforeEach(() => { vi.resetModules(); window.sessionStorage.clear(); window.history.replaceState({}, "", "/zh/contact"); });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe("one default WhatsApp opening across public pages", () => {
  it.each(["zh", "en", "ms"] as const)("keeps exact %s wording for paid, organic, referral and unknown sources", async language => {
    const { resolveSiteSettings } = await import("./siteSettingsApi");
    const cases: readonly [string, number][] = [["google&u=cpc", 0], ["google&u=organic", 0], ["chatgpt&u=cpc", 1], ["chatgpt&u=referral", 1], ["google", 2], ["facebook&u=referral", 2], ["", 2]];
    for (const [source, index] of cases) {
      const query = source ? `?utm_source=${source.replace("&u=", "&utm_medium=")}` : "";
      window.history.replaceState({}, "", `/${language}/services/builtin${query}`);
      const settings = resolveSiteSettings({ whatsapp_number: "+60 11-2885 3888" }, language);
      for (const oldMessage of [undefined, "Kitchen, dimensions: __, budget: __", "Wardrobe & TV cabinet\n\n来源（浏览器参考）: 不确定"]) {
        const url = new URL(settings.whatsapp_url(oldMessage));
        expect(url.origin + url.pathname).toBe("https://wa.me/601128853888");
        expect(url.searchParams.get("text")).toBe(expected[language][index]);
      }
    }
  });

  it("uses latest known source through navigation, language changes and reload, without changing first touch", async () => {
    const source = await import("./inquirySource");
    const { resolveSiteSettings } = await import("./siteSettingsApi");
    window.history.replaceState({}, "", "/zh?utm_source=chatgpt&utm_medium=cpc"); source.captureInquirySources(true);
    window.history.replaceState({}, "", "/en/services/kitchen"); source.captureInquirySources();
    expect(new URL(resolveSiteSettings(null, "en").whatsapp_url()).searchParams.get("text")).toBe(expected.en[1]);
    window.history.replaceState({}, "", "/zh?utm_source=google&utm_medium=cpc"); source.captureInquirySources();
    window.history.replaceState({}, "", "/ms/quote"); source.captureInquirySources();
    expect(source.currentInquirySources()).toEqual({ first: "chatgpt_paid", last: "google_paid" });
    vi.resetModules();
    const reloaded = await import("./siteSettingsApi");
    expect(new URL(reloaded.resolveSiteSettings(null, "ms").whatsapp_url()).searchParams.get("text")).toBe(expected.ms[0]);
    const { readInquirySources, buildInquirySourcePath } = await import("./inquirySourcePath");
    expect(readInquirySources(buildInquirySourcePath("/ms/quote?source=service&title=Kitchen"))).toEqual({ first: "chatgpt_paid", last: "google_paid" });
  });

  it("degrades safely when storage is disabled and does not expose click IDs or query data", async () => {
    const source = await import("./inquirySource");
    const { resolveSiteSettings } = await import("./siteSettingsApi");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw Error("blocked"); });
    window.history.replaceState({}, "", "/zh?utm_source=chatgpt&utm_medium=cpc&email=synthetic%40example.invalid"); source.captureInquirySources(true);
    window.history.replaceState({}, "", "/zh/quote");
    expect(new URL(resolveSiteSettings(null, "zh").whatsapp_url()).searchParams.get("text")).toBe(expected.zh[1]);
    vi.resetModules();
    const reloaded = await import("./siteSettingsApi");
    expect(new URL(reloaded.resolveSiteSettings(null, "zh").whatsapp_url()).searchParams.get("text")).toBe(expected.zh[2]);
  });

  it("rewrites only business CMS links, remains idempotent and preserves explicit user text", async () => {
    const { withInquiryWhatsAppHref } = await import("./contactLinks");
    const { resolveSiteSettings } = await import("./siteSettingsApi");
    window.history.replaceState({}, "", "/zh?utm_source=chatgpt&utm_medium=cpc");
    for (const href of ["https://wa.me/601128853888?text=Old%20kitchen%20message", "https://api.whatsapp.com/send/?phone=601128853888&text=Old%20message"]) {
      const result = withInquiryWhatsAppHref(href, "zh");
      expect(new URL(result).searchParams.get("text")).toBe(expected.zh[1]);
      expect(withInquiryWhatsAppHref(result, "zh")).toBe(result);
    }
    for (const href of ["https://wa.me/601100000001?text=Customer", "https://api.whatsapp.com/send?phone=601100000001&text=Other", "https://api.whatsapp.com/send?phone=601128853888&phone=601100000001", "https://wa.me:444/601128853888", "https://example.org", "javascript:alert(1)"]) {
      expect(withInquiryWhatsAppHref(href, "zh")).toBe(href);
    }
    const authored = "我自己填写的需求 & 尺寸\n请保留这段话。";
    expect(new URL(resolveSiteSettings(null, "zh").whatsapp_url(authored, { mode: "user-composed" })).searchParams.get("text")).toBe(authored);
    expect(new URL(resolveSiteSettings({ whatsapp_number: "601100000002" }, "zh").whatsapp_url()).pathname).toBe("/601100000002");
    window.history.replaceState({}, "", "/admin/leads");
    const adminHref = "https://wa.me/601128853888?text=Keep%20admin%20message";
    expect(withInquiryWhatsAppHref(adminHref, "zh")).toBe(adminHref);
  });
});
