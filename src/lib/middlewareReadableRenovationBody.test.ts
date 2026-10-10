import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

type ServiceRow = Record<string, unknown>;
type ScriptDom = { window: { document: Document; close: () => void } };
const JSDOM = createRequire(import.meta.url)("jsdom").JSDOM as new (
  html: string,
  options?: { runScripts?: "dangerously" },
) => ScriptDom;

const publishedRenovation = (overrides: Partial<ServiceRow> = {}): ServiceRow => ({
  id: "fixture-renovation",
  slug: "renovation",
  status: "published",
  title_en: "Residential renovation",
  title_zh: "住宅装修",
  seo_title_en: "Residential renovation | FLASH CAST",
  seo_title_zh: "住宅装修 | FLASH CAST",
  seo_description_en: "Plan a residential renovation with FLASH CAST.",
  seo_description_zh: "与 FLASH CAST 规划住宅装修。",
  content_en: "<h2>Planning scope</h2><p>Kitchen &amp; bathroom coordination.</p><script>alert(1)</script><img src=x onerror=alert(2)>",
  content_zh: "<h2>规划范围</h2><p>厨房与浴室协调。</p><script>alert(1)</script><img src=x onerror=alert(2)>",
  updated_at: "2026-09-29T00:00:00Z",
  ...overrides,
});

const publishedKitchen = (): ServiceRow => publishedRenovation({
  id: "fixture-kitchen",
  slug: "kitchen",
  title_en: "Custom kitchen",
  title_zh: "定制厨房",
  seo_title_en: "Custom kitchen | FLASH CAST",
  seo_title_zh: "定制厨房 | FLASH CAST",
  seo_description_en: "Plan the custom kitchen scope.",
  seo_description_zh: "规划定制厨房范围。",
  excerpt_en: "Kitchen cabinet and appliance planning.",
  excerpt_zh: "厨房橱柜与家电规划。",
  content_en: "<h2>Kitchen scope</h2><p>Cabinet installation coordination.</p>",
  content_zh: "<h2>厨房范围</h2><p>橱柜安装协调。</p>",
});

const render = async (pathname: string, row: ServiceRow) => {
  const shell = "<!doctype html><html lang=\"en\"><head><title>App</title></head><body><div id=\"root\"></div></body></html>";
  const responseFetch = vi.fn(async () => new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } }));
  const env = {
    VITE_SUPABASE_URL: "https://flashcast-fixture.supabase.co",
    VITE_SUPABASE_ANON_KEY: "fixture-public-key",
    ASSETS: { fetch: responseFetch },
  };
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const slug = url.searchParams.get("slug")?.replace(/^eq\./, "");
    return new Response(JSON.stringify(slug === String(row.slug) ? [row] : []), {
      headers: { "content-type": "application/json" },
    });
  }));

  const request = new Request(`https://flashcast.com.my${pathname}`, { headers: { "accept-language": pathname.startsWith("/zh/") ? "zh-CN" : "en" } });
  const response = await onRequest({ request, env, next: async () => new Response(shell) } as Parameters<typeof onRequest>[0]);
  return response.text();
};

afterEach(() => vi.unstubAllGlobals());

describe("renovation no-script body summary", () => {
  it.each([
    ["/en/services/renovation", "Kitchen &amp; bathroom coordination."],
    ["/zh/services/renovation", "厨房与浴室协调。"],
  ])("renders only the matching published locale for %s", async (path, expectedText) => {
    const html = await render(path, publishedRenovation());
    expect(html).toContain('data-flashcast-readable-body');
    expect(html).not.toContain('data-flashcast-readable-service-body');
    expect(html).toContain(expectedText);
    expect(html).not.toContain("alert(1)");
    expect(html).not.toContain("onerror");
    expect(html).toContain('id="root"></div>');

    const jsEnabled = new JSDOM(`${html}<script>document.documentElement.dataset.scripted = "true";</script>`, { runScripts: "dangerously" });
    expect(jsEnabled.window.document.documentElement.dataset.scripted).toBe("true");
    expect(jsEnabled.window.document.querySelector("[data-flashcast-readable-body]")).toBeNull();
    const noJs = new JSDOM(html);
    expect(noJs.window.document.querySelector("[data-flashcast-readable-body]")?.textContent).toContain(expectedText.replaceAll("&amp;", "&"));
    expect(noJs.window.document.title).toBe(path.startsWith("/zh/") ? "闪铸装修 | 住宅装修 | FLASH CAST" : "Residential renovation | FLASH CAST");
    expect(noJs.window.document.querySelector("meta[name=description]")?.getAttribute("content")).toBe(path.startsWith("/zh/") ? "与 FLASH CAST 规划住宅装修。 闪铸装饰、闪铸设计和闪铸装修是 FLASH CAST 的中文品牌名称。" : "Plan a residential renovation with FLASH CAST.");
    jsEnabled.window.close();
    noJs.window.close();
  });

  it("does not use a renovation row to enrich a different kitchen route", async () => {
    const html = await render("/en/services/kitchen", publishedRenovation());
    expect(html).not.toContain("data-flashcast-readable-body");
    expect(html).not.toContain("data-flashcast-readable-service-body");
    expect(html).not.toContain("Kitchen &amp; bathroom coordination.");
  });

  it.each([
    ["/en/services/kitchen", "Cabinet installation coordination.", "Kitchen cabinet and appliance planning.", "Custom kitchen | FLASH CAST"],
    ["/zh/services/kitchen", "橱柜安装协调。", "厨房橱柜与家电规划。", "定制厨房 | FLASH CAST"],
  ])("renders only the matching kitchen row for %s without renovation content", async (path, body, excerpt, title) => {
    const html = await render(path, publishedKitchen());
    const noJs = new JSDOM(html);
    const main = noJs.window.document.querySelector("[data-flashcast-readable-body]");
    expect(main?.textContent).toContain(body);
    expect(main?.textContent).toContain(excerpt);
    expect(noJs.window.document.title).toBe(title);
    expect(html).not.toContain("Kitchen &amp; bathroom coordination.");
    expect(html).not.toContain("厨房与浴室协调。");
    expect(html).not.toContain("data-flashcast-readable-service-body");
    noJs.window.close();
  });

  it("does not enrich a non-published or mismatched row", async () => {
    const draft = await render("/en/services/renovation", publishedRenovation({ status: "draft" }));
    const mismatch = await render("/en/services/renovation", publishedRenovation({ slug: "kitchen" }));
    expect(draft).not.toContain("data-flashcast-readable-service-body");
    expect(mismatch).not.toContain("data-flashcast-readable-service-body");
    expect(draft).not.toContain("data-flashcast-readable-body");
    expect(mismatch).not.toContain("data-flashcast-readable-body");
  });

  it("does not substitute the other language when the matching body is absent", async () => {
    const row = publishedRenovation({ content_en: "", content_zh: "仅中文正文。" });
    const html = await render("/en/services/renovation", row);
    expect(html).not.toContain("data-flashcast-readable-service-body");
    expect(html).not.toContain("data-flashcast-readable-body");
    expect(html).not.toContain("仅中文正文。");
  });
});
