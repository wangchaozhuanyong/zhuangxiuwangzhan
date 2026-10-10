import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

type ServiceRow = Record<string, unknown>;
type ScriptDom = { window: { document: Document; close: () => void } };
const JSDOM = createRequire(import.meta.url)("jsdom").JSDOM as new (
  html: string, options?: { runScripts?: "dangerously" },
) => ScriptDom;
const fixturePath = "../../drafts/publishing/fc-20261010-paid-three-page-native-20261010/previews/kitchen/desired.json";
const reviewedKitchen = (): ServiceRow => (JSON.parse(readFileSync(new URL(fixturePath, import.meta.url), "utf8")) as { record: ServiceRow }).record;
const oldExcerpt = "根据真实现场规划厨房动线、收纳、橱柜、台面、家电点位、给排水、湿作状况与书面报价范围。";
let fixtureId = 0;

const render = async (lang: "en" | "zh", row: ServiceRow, slug = "kitchen") => {
  const shell = '<!doctype html><html lang="en"><head><title>App</title></head><body><div id="root"></div></body></html>';
  const calls: { url: URL; method: string }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    calls.push({ url, method: init?.method || "GET" });
    // Deliberately return even a wrong/draft row so the summary guard is tested.
    return new Response(JSON.stringify(url.pathname.endsWith("/services") ? [row] : []), {
      headers: { "content-type": "application/json" },
    });
  }));
  const before = JSON.stringify(row);
  const response = await onRequest({
    request: new Request(`https://flashcast.com.my/${lang}/services/${slug}`),
    env: {
      VITE_SUPABASE_URL: `https://kitchen-summary.example/fixture/${++fixtureId}`,
      VITE_SUPABASE_ANON_KEY: "fixture-public-key",
      ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) },
    },
    next: async () => new Response(shell),
  } as Parameters<typeof onRequest>[0]);
  const html = await response.text();
  expect(response.status).toBe(200);
  expect(JSON.stringify(row)).toBe(before);
  expect(calls.every(call => call.method === "GET")).toBe(true);
  const serviceReads = calls.filter(call => call.url.pathname.endsWith("/services"));
  expect(serviceReads).toHaveLength(1);
  expect(serviceReads[0].url.searchParams.get("status")).toBe("eq.published");
  expect(serviceReads[0].url.searchParams.get("slug")).toBe(`eq.${slug}`);
  return html;
};
const fallbackRow = () => ({ ...reviewedKitchen(), content_en: "", content_zh: "" });
const summary = (html: string) => new JSDOM(html);
const head = (html: string) => html.match(/<head>[\s\S]*?<\/head>/)?.[0];
afterEach(() => vi.unstubAllGlobals());

describe("kitchen existing noscript summary fallback", () => {
  for (const lang of ["en", "zh"] as const) {
    it(`uses exact reviewed ${lang} title/excerpt when full body is absent`, async () => {
      const row = fallbackRow();
      const html = await render(lang, row);
      const dom = summary(html);
      const section = dom.window.document.querySelector('noscript[data-flashcast-geo-summary] > section[aria-label="Page summary"]');
      expect(section?.querySelector("h1")?.textContent).toBe(row[`title_${lang}`]);
      expect(section?.querySelector("p")?.textContent).toBe(row[`excerpt_${lang}`]);
      expect(section?.getAttribute("lang")).toBe(lang === "zh" ? "zh-CN" : "en");
      expect(section?.querySelector("a")?.getAttribute("href")).toBe(`https://flashcast.com.my/${lang}/services/kitchen`);
      expect(dom.window.document.querySelectorAll("noscript[data-flashcast-geo-summary]")).toHaveLength(1);
      expect(dom.window.document.querySelector("[data-flashcast-readable-body]")).toBeNull();
      if (lang === "zh") expect(section?.textContent).not.toContain(oldExcerpt);
      dom.window.close();
    });

    it.each(["", "   ", null])(`retains ${lang} metadata description fallback when excerpt is %j`, async excerpt => {
      const html = await render(lang, { ...fallbackRow(), [`excerpt_${lang}`]: excerpt });
      const dom = summary(html);
      expect(dom.window.document.querySelector('noscript section > p')?.textContent)
        .toBe(dom.window.document.querySelector('meta[name="description"]')?.getAttribute("content"));
      expect(dom.window.document.querySelector("noscript")?.textContent).not.toContain(reviewedKitchen()[`excerpt_${lang === "zh" ? "en" : "zh"}`]);
      dom.window.close();
    });

    it(`retains ${lang} metadata title fallback without crossing languages`, async () => {
      const html = await render(lang, { ...fallbackRow(), [`title_${lang}`]: "" });
      const dom = summary(html);
      expect(dom.window.document.querySelector("noscript h1")?.textContent).toBe(dom.window.document.title);
      expect(dom.window.document.querySelector("noscript")?.textContent).not.toContain(reviewedKitchen()[`title_${lang === "zh" ? "en" : "zh"}`]);
      dom.window.close();
    });

    it(`keeps all ${lang} head metadata unchanged when only public excerpt changes`, async () => {
      const row = fallbackRow();
      const before = await render(lang, row);
      const after = await render(lang, { ...row, [`excerpt_${lang}`]: "Candidate summary excerpt" });
      expect(head(after)).toBe(head(before));
      const dom = summary(after);
      for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
        expect(dom.window.document.querySelector(selector)?.getAttribute("content")).not.toBe("Candidate summary excerpt");
      }
      expect(dom.window.document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
      expect(dom.window.document.querySelectorAll('link[hreflang]')).toHaveLength(3);
      dom.window.close();
    });

    it(`preserves the existing complete ${lang} readable body and JS hides it`, async () => {
      const row = reviewedKitchen();
      const html = await render(lang, row);
      const noJs = summary(html);
      expect(noJs.window.document.querySelector("[data-flashcast-readable-body] h1")?.textContent).toBe(row[`title_${lang}`]);
      expect(noJs.window.document.querySelector("[data-flashcast-readable-body]")?.textContent).toContain(row[`excerpt_${lang}`]);
      expect(noJs.window.document.querySelector('section[aria-label="Page summary"]')).toBeNull();
      if (lang === "zh") expect(noJs.window.document.querySelector("noscript")?.textContent).not.toContain(oldExcerpt);
      const js = new JSDOM(`${html}<script>document.documentElement.dataset.scripted = "true";</script>`, { runScripts: "dangerously" });
      expect(js.window.document.documentElement.dataset.scripted).toBe("true");
      expect(js.window.document.querySelector("[data-flashcast-readable-body], section[aria-label='Page summary']")).toBeNull();
      expect(js.window.document.querySelectorAll("#root")).toHaveLength(1);
      noJs.window.close(); js.window.close();
    });
  }

  it.each([{ status: "draft" }, { slug: "other-service" }])("does not override the summary from an inadmissible row %j", async overrides => {
    const html = await render("en", { ...fallbackRow(), title_en: "Inadmissible heading", excerpt_en: "Inadmissible excerpt", ...overrides });
    const dom = summary(html);
    const section = dom.window.document.querySelector('noscript section[aria-label="Page summary"]');
    expect(section?.querySelector("p")?.textContent).toBe(dom.window.document.querySelector('meta[name="description"]')?.getAttribute("content"));
    expect(section?.textContent).not.toContain("Inadmissible excerpt");
    expect(section?.textContent).not.toContain("Inadmissible heading");
    dom.window.close();
  });

  it("does not change another service's existing summary fallback", async () => {
    const html = await render("en", { ...fallbackRow(), slug: "builtin", excerpt_en: "Other service excerpt" }, "builtin");
    const dom = summary(html);
    expect(dom.window.document.querySelector("noscript section > p")?.textContent)
      .toBe(dom.window.document.querySelector('meta[name="description"]')?.getAttribute("content"));
    expect(dom.window.document.querySelector("noscript")?.textContent).not.toContain("Other service excerpt");
    dom.window.close();
  });

  it("escapes both fields and keeps the existing fallback invisible when JS is enabled", async () => {
    const title = 'Kitchen & "title" <b>text</b>';
    const excerpt = '</noscript><script>window.injected = true</script><img src=x onerror=evil()> & "excerpt"';
    const html = await render("en", { ...fallbackRow(), title_en: title, excerpt_en: excerpt });
    const dom = summary(html);
    const section = dom.window.document.querySelector("noscript section");
    expect(section?.querySelector("h1")?.textContent).toBe(title);
    expect(section?.querySelector("p")?.textContent).toBe(excerpt);
    expect(section?.querySelectorAll("script,img,b,[onerror]")).toHaveLength(0);
    const js = new JSDOM(`${html}<script>document.documentElement.dataset.scripted = "true";</script>`, { runScripts: "dangerously" });
    expect(js.window.document.documentElement.dataset.scripted).toBe("true");
    expect(js.window.document.querySelector("noscript section")).toBeNull();
    expect(js.window.document.querySelector("script")?.textContent).not.toContain("window.injected = true");
    dom.window.close(); js.window.close();
  });
});
