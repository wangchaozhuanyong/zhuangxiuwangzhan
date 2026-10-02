import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";

const render = async (path: string, cmsFaq?: { q: string; a: string }) => {
  const shell = '<!doctype html><html lang="en"><head><title>App</title></head><body><div id="root"></div></body></html>';
  const slug = path.split("/").at(-1);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const rows = cmsFaq && url.pathname.endsWith("/services") && url.searchParams.get("slug") === `eq.${slug}`
      ? [{ id: "fixture-service", slug, status: "published", title_en: "Published service", title_zh: "已发布服务", faqs_en: [cmsFaq], faqs_zh: [cmsFaq] }]
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
  return { html, faq: graph.find((item: { "@type": string }) => item["@type"] === "FAQPage")?.mainEntity };
};

afterEach(() => vi.unstubAllGlobals());

describe("old-house visible FAQ / server schema source parity", () => {
  it.each(["en", "zh"] as const)("uses every visible %s FAQ even when the CMS row has stale questions", async (language) => {
    const result = await render(`/${language}/services/old-house`, { q: "Stale CMS question", a: "Stale CMS answer" });
    expect(result.faq).toEqual(oldHouseRenovationPageText[language].faqs.map(({ q, a }) => ({
      "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a },
    })));
    expect(result.faq).toHaveLength(5);
    expect(result.html).not.toContain("Stale CMS question");
    expect(result.html).toContain(`https://flashcast.com.my/${language}/services/old-house`);
  });

  it.each(["en", "zh"] as const)("retains source parity for %s when no CMS row is available", async (language) => {
    const result = await render(`/${language}/services/old-house`);
    expect(result.faq.map((item: { name: string }) => item.name)).toEqual(oldHouseRenovationPageText[language].faqs.map(({ q }) => q));
    expect(result.faq).toHaveLength(5);
  });

  it.each(["en", "zh"] as const)("keeps other %s service FAQs sourced from their CMS row", async (language) => {
    const result = await render(`/${language}/services/kitchen`, { q: "Fixture kitchen FAQ", a: "Fixture kitchen answer" });
    expect(result.faq).toEqual([{ "@type": "Question", name: "Fixture kitchen FAQ", acceptedAnswer: { "@type": "Answer", text: "Fixture kitchen answer" } }]);
    expect(result.html).not.toContain(oldHouseRenovationPageText[language].faqs[4].q);
  });
});
