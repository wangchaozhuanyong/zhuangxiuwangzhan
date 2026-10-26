import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { classifyInquirySource, mergeInquirySources } from "./inquirySource";
import { buildInquirySourcePath, readInquirySources } from "./inquirySourcePath";
import { readLeadTest, isEnglishAcceptancePage } from "../../supabase/functions/_shared/lead-test-contract";
import { formatSourcePath } from "./leadSourceText";
import { buildAdminLeadReport } from "./adminLeadReports";
import { resolveSiteSettings } from "./siteSettingsApi";
import { withInquiryWhatsAppHref } from "./contactLinks";
import { contactEntryText } from "@/i18n/contactEntryText";

const origin = "https://flashcast.com.my/en/contact";
beforeEach(() => { window.sessionStorage.clear(); window.history.replaceState({}, "", "/en/contact"); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("browser enquiry source references", () => {
  it.each([
    ["?utm_source=google&utm_medium=cpc", "", "google_paid"],
    ["?utm_source=chatgpt&utm_medium=cpc", "", "chatgpt_paid"],
    ["?gclid=EAIaIQobChMI_Synthetic012345", "", "google_paid"],
    ["?gbraid=0AAAA_Synthetic01234567890", "", "google_paid"],
    ["?wbraid=0AAAA_Synthetic01234567890", "", "google_paid"],
    ["?utm_source=Google&utm_medium=organic", "", "google_organic"],
    ["?utm_source=chatgpt&utm_medium=referral", "", "chatgpt_referral"],
    ["", "https://www.google.com.my/search?q=private", "google_organic"],
    ["", "https://chatgpt.com/c/private", "chatgpt_referral"],
    ["", "https://chat.openai.com/", "chatgpt_referral"],
    ["", "https://example.org/?email=private", "other_referral"],
    ["", "https://flashcast.com.my/zh", "unknown"],
    ["", "javascript:alert(1)", "unknown"],
    ["", "https://name:password@google.com/", "unknown"],
    ["?utm_source=chatgpt", "", "unknown"],
    ["?utm_source=google", "", "unknown"],
    ["?utm_source=chatgpt&utm_medium=cpc&gclid=EAIaIQobChMI_Synthetic012345", "", "unknown"],
    ["?utm_source=google&utm_source=chatgpt&utm_medium=cpc", "", "unknown"],
    ["?gclid=short", "", "unknown"],
    ["?gclid=abc%20defghijklmnopqrstuvwxyz", "", "unknown"],
  ])("classifies only bounded evidence %s", (query, referrer, result) => {
    expect(classifyInquirySource(origin + query, referrer)).toBe(result);
  });
  it("does not accept lookalike Google hosts, non-web URLs or direct visits as ads", () => {
    expect(classifyInquirySource(origin, "https://google.com.attacker.invalid/")).toBe("other_referral");
    expect(classifyInquirySource("javascript:alert(1)", "https://google.com")).toBe("unknown");
    expect(classifyInquirySource(origin)).toBe("unknown");
    expect(mergeInquirySources({ first: "google_paid", last: "chatgpt_paid" }, "unknown")).toEqual({ first: "google_paid", last: "chatgpt_paid" });
  });
  it("restores across pages, languages and module reload; preserves first, updates latest only for a known touch", async () => {
    vi.resetModules(); const a = await import("./inquirySource");
    window.history.replaceState({}, "", "/en?utm_source=chatgpt&utm_medium=cpc&email=private%40example.invalid"); a.captureInquirySources(true);
    window.history.pushState({}, "", "/zh/services/builtin"); a.captureInquirySources();
    window.history.pushState({}, "", "/ms/quote"); a.captureInquirySources();
    vi.resetModules(); const b = await import("./inquirySource");
    expect(b.currentInquirySources()).toEqual({ first: "chatgpt_paid", last: "chatgpt_paid" });
    window.history.pushState({}, "", "/en?utm_source=google&utm_medium=cpc"); b.captureInquirySources();
    window.history.pushState({}, "", "/zh/contact"); b.captureInquirySources();
    expect(b.currentInquirySources()).toEqual({ first: "chatgpt_paid", last: "google_paid" });
    const stored = window.sessionStorage.getItem(b.INQUIRY_SESSION_KEY)!;
    expect(Object.keys(JSON.parse(stored)).sort()).toEqual(["first", "last", "seenAt", "version"]);
    expect(stored).not.toMatch(/email|example|utm_|gclid|contact|builtin/);
  });
  it("expires at thirty minutes and rejects corrupt/future storage after a new document", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.resetModules();
    const a = await import("./inquirySource"); a.captureInquirySources();
    window.sessionStorage.setItem(a.INQUIRY_SESSION_KEY, JSON.stringify({ version: 1, first: "google_paid", last: "google_paid", seenAt: Date.now() }));
    vi.advanceTimersByTime(a.INQUIRY_SESSION_MS);
    vi.resetModules(); const b = await import("./inquirySource");
    expect(b.currentInquirySources().last).toBe("unknown");
    window.sessionStorage.setItem(b.INQUIRY_SESSION_KEY, "{broken"); expect(b.currentInquirySources().last).toBe("unknown");
    window.sessionStorage.setItem(b.INQUIRY_SESSION_KEY, JSON.stringify({ version: 1, first: "google_paid", last: "google_paid", seenAt: Date.now() + 100 }));
    expect(b.currentInquirySources().last).toBe("unknown");
  });
  it("retains same-document memory when storage is disabled without blocking enquiries", async () => {
    vi.resetModules(); const a = await import("./inquirySource");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw Error("disabled"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw Error("disabled"); });
    window.history.replaceState({}, "", "/en?utm_source=google&utm_medium=cpc"); a.captureInquirySources(true);
    window.history.replaceState({}, "", "/ms/contact"); a.captureInquirySources();
    expect(a.currentInquirySources().last).toBe("google_paid");
  });
  it("stores whole encoded source/context parameters within300 and excludes arbitrary queries, PII and click IDs", () => {
    const source = buildInquirySourcePath("/zh/quote?source=service&title=" + encodeURIComponent("定制柜".repeat(100)) + "&context=Kitchen&gclid=EAIaIQobChMI_Synthetic012345&email=private@example.invalid&token=secret", { first: "chatgpt_paid", last: "google_paid" });
    expect(source.length).toBeLessThanOrEqual(300);
    const url = new URL(source, origin);
    expect(url.searchParams.get("source")).toBe("service");
    expect(url.searchParams.get("title")).toMatch(/^定制柜/);
    expect(source).not.toMatch(/gclid|email|token|private|Synthetic/);
    expect(decodeURIComponent(source)).not.toContain("�");
    expect(readInquirySources(source)).toEqual({ first: "chatgpt_paid", last: "google_paid" });
    expect(buildInquirySourcePath("/en/contact?source=service&title=name%40example.invalid")).not.toContain("example");
    expect(buildInquirySourcePath("/en/contact?title=PrivateName&context=PrivateContext")).not.toMatch(/Private/);
    const businessContext = buildInquirySourcePath("/en/quote?source=service&title=Kitchen%20%26%20Bath&context=Design%20%26%20Build");
    expect(new URL(businessContext, origin).searchParams.get("title")).toBe("Kitchen & Bath");
    expect(new URL(businessContext, origin).searchParams.get("context")).toBe("Design & Build");
    const emoji = buildInquirySourcePath("/zh/quote?source=service&title=" + encodeURIComponent("🛠".repeat(120)));
    expect(emoji.length).toBeLessThanOrEqual(300); expect(decodeURIComponent(emoji)).not.toContain("�");
  });
  it("does not replace a known paid touch with the stale document referrer on reload", async () => {
    vi.resetModules(); const a = await import("./inquirySource");
    window.sessionStorage.setItem(a.INQUIRY_SESSION_KEY, JSON.stringify({version:1,first:"chatgpt_paid",last:"google_paid",seenAt:Date.now()}));
    vi.spyOn(document, "referrer", "get").mockReturnValue("https://chatgpt.com/c/synthetic");
    vi.stubGlobal("performance", {getEntriesByType:()=>[{type:"reload"}]});
    a.captureInquirySources(true);
    expect(a.currentInquirySources()).toEqual({first:"chatgpt_paid",last:"google_paid"});
  });
  it("retains TEST/acceptance rules including malformed marker rejection", () => {
    const valid = buildInquirySourcePath("/en/quote?fc_test=fc_paid_20261008_T01&title=" + "x".repeat(500));
    expect(valid.length).toBeLessThanOrEqual(300); expect(readLeadTest(valid, "quote").test?.type).toBe("quote");
    for (const input of ["/en/quote?fc_test=" + "x".repeat(1000), "/en/quote?fc_test=fc_paid_20261008_T01&fc_test=fc_paid_20261008_T01", "/__internal_test__/fc-paid-20261008/T01"]) {
      const result = buildInquirySourcePath(input); expect(result.length).toBeLessThanOrEqual(300); expect(readLeadTest(result, "quote").valid).toBe(false);
    }
    expect(isEnglishAcceptancePage(buildInquirySourcePath("/en/contact"), "contact")).toBe(true);
  });
  it.each(["en", "zh", "ms"] as const)("preserves WhatsApp business number, message and encoding with %s source text", (language) => {
    window.history.replaceState({}, "", `/${language}/services/builtin?utm_source=chatgpt&utm_medium=cpc&gclid=invalid`);
    window.history.replaceState({}, "", `/${language}/services/builtin?utm_source=chatgpt&utm_medium=cpc`);
    const original = contactEntryText[language].message("Kitchen & cabinets");
    const href = resolveSiteSettings({ whatsapp_number: "601128853888" }, language).whatsapp_url(original);
    const url = new URL(href); expect(url.pathname).toBe("/601128853888");
    const text = url.searchParams.get("text")!; expect(text.startsWith(original + "\n\n")).toBe(true);
    expect(text).toContain(language === "zh" ? "ChatGPT广告" : language === "ms" ? "Iklan ChatGPT" : "ChatGPT ad");
    expect(withInquiryWhatsAppHref(href, language)).toBe(href);
    expect(text).not.toMatch(/gclid|utm_|invalid/);
  });
  it("formats channels for all admin surfaces and separates same-title report rows", () => {
    const a = buildInquirySourcePath("/en/quote?source=service&title=Kitchen", { first: "chatgpt_paid", last: "chatgpt_paid" });
    const b = buildInquirySourcePath("/en/quote?source=service&title=Kitchen", { first: "google_paid", last: "google_paid" });
    expect(formatSourcePath(a, "zh")).toContain("ChatGPT广告"); expect(formatSourcePath(a, "zh")).toContain("Kitchen");
    expect(formatSourcePath("/ms/contact", "zh")).toContain("不确定");
    const report = buildAdminLeadReport({ leads: [], quotes: [{ id: "a", source_path: a }, { id: "b", source_path: b }, { id: "legacy", source_path: "/en/quote?source=service&title=Kitchen" }], period: "all", language: "zh" });
    expect(report.sourceRows).toHaveLength(3);
    expect(report.sourceRows.some(x => x.label.includes("不确定"))).toBe(true);
  });
});
