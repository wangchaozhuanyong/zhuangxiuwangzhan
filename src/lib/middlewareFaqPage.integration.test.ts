import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { faqPageText } from "@/i18n/faqPageText";
import { languageTag, type Language } from "@/i18n/languageDetection";

const shell = '<!doctype html><html lang="en"><head><title>App</title></head><body><div id="root"></div></body></html>';
const matches = {
  question: { question_en: "Published question?", question_zh: "已发布的问题？", question_ms: "Soalan diterbitkan?" },
  answer: { answer_en: "Public & confirmed <details>.", answer_zh: "公开且已确认。", answer_ms: "Awam dan disahkan." },
  home: { question_en: "Home question?", question_zh: "首页问题？", question_ms: "Soalan laman utama?" },
};
const rows = [
  { id: "home-1", page_key: "home", status: "published", ...matches.question, answer_en: "Duplicate home answer" },
  { id: "general-1", page_key: "general", status: "published", ...matches.question, ...matches.answer },
  { id: "home-2", page_key: "home", status: "published", ...matches.home, ...matches.answer },
  { id: "draft-1", page_key: "general", status: "draft", question_en: "Draft question?", answer_en: "Draft answer" },
];

async function render(language: Language, responseRows: typeof rows | null = rows) {
  const faqRequests: URL[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith("/faqs")) {
      faqRequests.push(url);
      if (!responseRows) return new Response("Unavailable", { status: 503 });
      return Response.json(responseRows);
    }
    return Response.json([]);
  }));
  const response = await onRequest({
    request: new Request(`https://flashcast.com.my/${language}/faq`),
    env: {
      VITE_SUPABASE_URL: "https://fixture-faq.supabase.co",
      VITE_SUPABASE_ANON_KEY: "fixture-public-key",
      ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) },
    },
    next: async () => new Response(shell),
  } as Parameters<typeof onRequest>[0]);
  const html = await response.text();
  const parser = new DOMParser();
  const page = parser.parseFromString(html, "text/html");
  const graph = JSON.parse(page.querySelector('script[type="application/ld+json"]')?.textContent || "{}")["@graph"] || [];
  const faq = graph.find((item: { "@type": string }) => item["@type"] === "FAQPage")?.mainEntity || [];
  const readable = parser.parseFromString(page.querySelector("noscript[data-flashcast-geo-summary]")?.innerHTML || "", "text/html");
  return { response, faqRequests, faq, readable, html };
}

afterEach(() => vi.unstubAllGlobals());

describe("FAQ page no-JavaScript HTML", () => {
  it.each(["en", "zh", "ms"] as const)("serves the same published %s list in the page and JSON-LD", async (language) => {
    const { response, faqRequests, faq, readable, html } = await render(language);
    const questions = [matches.question[`question_${language}`], matches.home[`question_${language}`]];
    const answer = matches.answer[`answer_${language}`];
    expect(response.status).toBe(200);
    expect(faqRequests).toHaveLength(1);
    expect(faqRequests[0].searchParams.get("status")).toBe("eq.published");
    expect(faqRequests[0].searchParams.get("page_key")).toBe("in.(general,home)");
    expect(faqRequests[0].searchParams.get("order")).toBe("sort_order.asc");
    const body = readable.querySelector("[data-flashcast-readable-body]");
    expect(body?.getAttribute("lang")).toBe(languageTag(language));
    expect(Array.from(body?.querySelectorAll("h2") || [], (element) => element.textContent)).toEqual(questions);
    expect(body?.querySelector("section p")?.textContent).toBe(answer);
    expect(body?.querySelector("details")).toBeNull();
    expect(faq).toEqual(questions.map((name) => ({
      "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text: answer },
    })));
    expect(html).not.toContain("Draft question?");
    expect(html).not.toContain("Duplicate home answer");
  });

  it.each([{ state: "empty", responseRows: [] }, { state: "unavailable", responseRows: null }])("keeps the localized fallback when published FAQs are $state", async ({ responseRows }) => {
    const { response, faq, readable } = await render("zh", responseRows);
    const fallbackQuestions = faqPageText.zh.categories.flatMap(({ items }) => items.map(({ q }) => q));
    expect(response.status).toBe(200);
    expect(Array.from(readable.querySelectorAll("main h3"), (element) => element.textContent)).toEqual(fallbackQuestions);
    expect(faq.map((item: { name: string }) => item.name)).toEqual(fallbackQuestions);
  });
});
