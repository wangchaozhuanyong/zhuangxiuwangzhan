import { afterEach, describe, expect, it, vi } from "vitest";
import { buildReadablePublicBody } from "../../functions/readablePublicBody";
import { onRequest } from "../../functions/_middleware";

const source = {
  en: "For warehouse-related needs, the confirmed scope is limited to racking, aisle planning, floor marking, and storage zoning; exact work is subject to a site review and quotation.",
  zh: "仓储相关服务仅限货架、通道规划、地面标线及存储分区，具体范围以现场评估与报价为准。",
};
const row = {
  slug: "selangor", status: "published", title_en: "Selangor", title_zh: "雪兰莪",
  seo_description_en: "Existing English summary.", seo_description_zh: "现有中文摘要。",
  content_en: `<p>Existing introduction &amp; planning.</p><p>${source.en}</p>`,
  content_zh: `<p>现有介绍。</p><p>${source.zh}</p>`,
};
afterEach(() => vi.unstubAllGlobals());

describe("Selangor warehouse same-language readable body", () => {
  it.each(["en", "zh"] as const)("links only the published %s source and preserves its text", lang => {
    const html = buildReadablePublicBody(`/${lang}/locations/selangor`, row);
    const document = new DOMParser().parseFromString(html, "text/html");
    const anchors = document.querySelectorAll("a");
    expect(anchors).toHaveLength(1);
    expect(anchors[0].getAttribute("href")).toBe(`/${lang}/services/warehouse`);
    expect(anchors[0].closest("p")?.textContent).toBe(source[lang]);
    expect(document.querySelector("p")?.textContent).toBe(row[`seo_description_${lang}`]);
    expect(document.querySelector("main")?.getAttribute("lang")).toBe(lang === "zh" ? "zh-CN" : "en");
    expect(html).not.toContain(source[lang === "zh" ? "en" : "zh"]);
  });

  it.each(["en", "zh"] as const)("does not broaden %s source or route eligibility", lang => {
    const key = `/${lang}/locations/selangor`;
    for (const candidate of [
      { ...row, status: "draft" }, { ...row, slug: "kuala-lumpur" },
      { ...row, [`content_${lang}`]: "Missing qualified scope" },
      { ...row, [`content_${lang}`]: `${source[lang]}\n\n${source[lang]}` },
      { ...row, [`content_${lang}`]: "" },
    ]) expect(buildReadablePublicBody(key, candidate)).toBe("");
    expect(buildReadablePublicBody(`/${lang}/locations/kuala-lumpur`, row)).toBe("");
    expect(buildReadablePublicBody(`/${lang}/locations/selangor`, null)).toBe("");
  });

  it("escapes source text and only creates the fixed approved href", () => {
    const html = buildReadablePublicBody("/en/locations/selangor", { ...row, title_en: '<b>Selangor</b>', content_en: `${source.en} <img src=x onerror=attack> & "quoted"` });
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
    expect(html).toContain("&amp; &quot;quoted&quot;");
    expect(html.match(/href=/g)).toHaveLength(1);
  });

  it.each(["en", "zh"] as const)("reaches the existing %s middleware noscript consumer without changing metadata", async lang => {
    const pending: Promise<unknown>[] = [];
    const sourceUrl = `http://127.0.0.1:49388/selangor-${lang}`;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(String(input), init);
      expect(request.method).toBe("GET");
      const url = new URL(request.url);
      expect(url.origin).toBe("http://127.0.0.1:49388");
      return new Response(JSON.stringify(url.pathname.endsWith("/service_areas") ? [row] : []), { headers: { "content-type": "application/json" } });
    }));
    const shell = '<html><head><title>Fixture</title></head><body><div id="root"></div></body></html>';
    const result = await onRequest({
      request: new Request(`https://flashcast.com.my/${lang}/locations/selangor`),
      env: { VITE_SUPABASE_URL: sourceUrl, VITE_SUPABASE_ANON_KEY: "local-public-placeholder", ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) } },
      next: async () => new Response(shell), waitUntil: (task: Promise<unknown>) => pending.push(task),
    } as Parameters<typeof onRequest>[0]);
    const html = await result.text();
    await Promise.all(pending);
    const document = new DOMParser().parseFromString(html, "text/html");
    const noscript = document.querySelector("noscript[data-flashcast-geo-summary]");
    expect(result.status).toBe(200);
    expect(noscript?.innerHTML).toContain(`href="/${lang}/services/warehouse"`);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://flashcast.com.my/${lang}/locations/selangor`);
    expect(document.querySelector('link[hreflang="en"]')?.getAttribute("href")).toBe("https://flashcast.com.my/en/locations/selangor");
    expect(document.querySelector('link[hreflang="zh-CN"]')?.getAttribute("href")).toBe("https://flashcast.com.my/zh/locations/selangor");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(row[`seo_description_${lang}`]);
  });
});
