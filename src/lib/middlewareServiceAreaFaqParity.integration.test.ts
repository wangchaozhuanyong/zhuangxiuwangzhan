import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

type Question = { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } };
type Schema = { "@type": string; mainEntity?: Question[]; "@graph"?: Schema[] };
const shell = '<!doctype html><html><head><title>Fixture</title></head><body><div id="root"></div></body></html>';
let fixtureId = 0;

async function render(language: "en" | "zh", fields: Record<string, unknown>, rowAvailable = true) {
  const sourceUrl = `http://127.0.0.1:49499/faq-fixture-${++fixtureId}`;
  const pending: Promise<unknown>[] = [];
  const reads = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    expect(request.method).toBe("GET");
    const url = new URL(request.url);
    expect(url.origin).toBe("http://127.0.0.1:49499");
    const rows = rowAvailable && url.pathname.endsWith("/service_areas") && url.searchParams.get("slug") === "eq.bangsar"
      ? [{ id: "fixture-bangsar", slug: "bangsar", status: "published", title_en: "Bangsar", title_zh: "孟沙", ...fields }]
      : [];
    return new Response(JSON.stringify(rows), { headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", reads);
  const response = await onRequest({
    request: new Request(`https://flashcast.com.my/${language}/locations/bangsar`),
    env: {
      VITE_SUPABASE_URL: sourceUrl, VITE_SUPABASE_ANON_KEY: "local-public-placeholder", CF_PAGES_COMMIT_SHA: `faq-fixture-${fixtureId}`,
      ASSETS: { fetch: async (input: Request | string | URL) => {
        expect(input instanceof Request ? input.method : "GET").toBe("GET");
        return new Response(shell, { headers: { "content-type": "text/html" } });
      } },
    },
    next: async () => new Response(shell),
    waitUntil: (task: Promise<unknown>) => pending.push(task),
  } as Parameters<typeof onRequest>[0]);
  const html = await response.text();
  await Promise.all(pending);
  const document = new DOMParser().parseFromString(html, "text/html");
  const faq = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap(script => { const schema = JSON.parse(script.textContent || "{}") as Schema; return schema["@graph"] || [schema]; })
    .filter(schema => schema["@type"] === "FAQPage");
  expect(reads).toHaveBeenCalled();
  return { response, faq };
}

afterEach(() => vi.unstubAllGlobals());

describe("service-area visible FAQ / original Edge schema parity", () => {
  it.each(["en", "zh"] as const)("uses the same %s display projection for English fallback copy and HTML", async language => {
    const englishFaq = { q: "<b>Can an F&B or retail fit-out in Bangsar be discussed?</b>", a: "<p>Retail fit-out</p>" };
    const result = await render(language, {
      [`faqs_${language}`]: [englishFaq, null, { q: "Incomplete" }],
      [`faqs_${language === "en" ? "zh" : "en"}`]: [{ q: "Other locale", a: "Other locale answer" }],
    });
    expect(result.response.status).toBe(200);
    expect(result.faq).toHaveLength(1);
    expect(result.faq[0].mainEntity).toEqual([{
      "@type": "Question",
      name: language === "zh" ? "Can an F&B or 零售装修施工 in 孟沙 be discussed?" : "Can an F&B or retail fit-out in Bangsar be discussed?",
      acceptedAnswer: { "@type": "Answer", text: language === "zh" ? "零售装修施工" : "Retail fit-out" },
    }]);
  });

  it("retains published Chinese questions and cleans their HTML without replacing them with the other locale", async () => {
    const result = await render("zh", { faqs_zh: [{ q: "<b>如何安排材料送达？</b>", a: "<p>先确认通道、时间和物业要求。</p>" }], faqs_en: [{ q: "Other locale", a: "Other answer" }] });
    expect(result.faq).toHaveLength(1);
    expect(result.faq[0].mainEntity).toEqual([{ "@type": "Question", name: "如何安排材料送达？", acceptedAnswer: { "@type": "Answer", text: "先确认通道、时间和物业要求。" } }]);
  });

  it.each(["en", "zh"] as const)("does not inject a %s FAQ for an empty, invalid or markup-only locale", async language => {
    for (const value of [[], null, "invalid", [{ q: "Incomplete" }], [{ q: "<br>", a: "<p></p>" }]]) {
      const result = await render(language, { [`faqs_${language}`]: value, [`faqs_${language === "en" ? "zh" : "en"}`]: [{ q: "Other locale", a: "Other answer" }] });
      expect(result.faq).toEqual([]);
    }
  });

  it.each(["en", "zh"] as const)("does not invent a %s fallback FAQ when the published row and static manifest have none", async language => {
    const result = await render(language, {}, false);
    expect(result.response.status).toBe(200);
    expect(result.faq).toEqual([]);
  });
});
