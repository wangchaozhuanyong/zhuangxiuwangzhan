import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";

const render = async (path: string, cmsFaqs?: Record<string, unknown>, failed = false) => {
  const shell = '<!doctype html><html lang="en"><head><title>App</title></head><body><div id="root"></div></body></html>';
  const slug = path.split("/").at(-1);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (failed && url.pathname.endsWith("/services")) return new Response("unavailable", { status: 503 });
    const rows = cmsFaqs && url.pathname.endsWith("/services") && url.searchParams.get("slug") === `eq.${slug}`
      ? [{ id: "fixture-service", slug, status: "published", title_en: "Published service", title_zh: "已发布服务", ...cmsFaqs }]
      : [];
    return new Response(JSON.stringify(rows), { headers: { "content-type": "application/json" } });
  }));
  const response = await onRequest({
    request: new Request(`https://flashcast.com.my${path}`),
    env: { VITE_SUPABASE_URL: "https://fixture.supabase.co", VITE_SUPABASE_ANON_KEY: "fixture-public-key", ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) } },
    next: async () => new Response(shell),
  } as Parameters<typeof onRequest>[0]);
  const html = await response.text();
  const script = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  const graph = JSON.parse(script || "{}")["@graph"] || [];
  return { html, status: response.status, faq: graph.find((item: { "@type": string }) => item["@type"] === "FAQPage")?.mainEntity || [] };
};

afterEach(() => vi.unstubAllGlobals());

describe("old-house visible FAQ / server schema source parity", () => {
  it.each(["en", "zh"] as const)("uses the published %s locale and the same plain text as the visible FAQ", async (language) => {
    const question = language === "zh" ? "测试中文问题" : "Test published question";
    const answer = language === "zh" ? "测试中文回答" : "Test published answer";
    const result = await render(`/${language}/services/old-house`, {
      [`faqs_${language}`]: [{ q: `<b>${question}</b>`, a: `<p>${answer}</p>` }, null, { q: "Incomplete" }],
      [`faqs_${language === "en" ? "zh" : "en"}`]: [{ q: "Other locale", a: "Other locale answer" }],
    });
    expect(result.faq).toEqual([{ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }]);
    expect(result.html).not.toContain("Other locale answer");
    expect(result.html).toContain(`https://flashcast.com.my/${language}/services/old-house`);
  });

  it.each(["en", "zh"] as const)("omits %s FAQ schema for an empty or unavailable published locale", async (language) => {
    for (const value of [[], null, "invalid", [{ q: "Incomplete" }]]) {
      const result = await render(`/${language}/services/old-house`, { [`faqs_${language}`]: value,
        [`faqs_${language === "en" ? "zh" : "en"}`]: [{ q: "Other locale", a: "Other answer" }] });
      expect(result.faq).toEqual([]);
      expect(result.html).not.toContain("Other answer");
    }
  });

  it.each(["en", "zh"] as const)("matches the reviewed visible %s fallback when the public read fails", async (language) => {
    const result = await render(`/${language}/services/old-house`, undefined, true);
    expect(result.status).toBe(200);
    expect(result.faq.map((item: { name: string }) => item.name)).toEqual(oldHouseRenovationPageText[language].faqs.map(({ q }) => q));
  });

  it.each(["en", "zh"] as const)("retains source parity for %s when no CMS row is available", async (language) => {
    const result = await render(`/${language}/services/old-house`);
    expect(result.faq.map((item: { name: string }) => item.name)).toEqual(oldHouseRenovationPageText[language].faqs.map(({ q }) => q));
    expect(result.faq).toHaveLength(5);
  });

  it.each(["en", "zh"] as const)("keeps other %s service FAQs sourced from their CMS row", async (language) => {
    const result = await render(`/${language}/services/kitchen`, { faqs_en: [{ q: "Fixture kitchen FAQ", a: "Fixture kitchen answer" }], faqs_zh: [{ q: "Fixture kitchen FAQ", a: "Fixture kitchen answer" }] });
    expect(result.faq).toEqual([{ "@type": "Question", name: "Fixture kitchen FAQ", acceptedAnswer: { "@type": "Answer", text: "Fixture kitchen answer" } }]);
    expect(result.html).not.toContain(oldHouseRenovationPageText[language].faqs[4].q);
  });
});
