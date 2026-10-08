import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import catalog from "@/data/furnitureCatalog.json";
import { furnitureText } from "@/i18n/furnitureText";

const shell = '<!doctype html><html><head><title>Fixture</title></head><body><div id="root"></div></body></html>';
const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
let fixtureId = 0;

class FixtureCache {
  entries = new Map<string, Response>();
  async match(request: Request) { return this.entries.get(request.url)?.clone(); }
  async put(request: Request, response: Response) { this.entries.set(request.url, response.clone()); }
}

function fixture({ overrides = [] as Record<string, unknown>[], materials = [] as Record<string, unknown>[], failedSetting = false } = {}) {
  const cache = new FixtureCache();
  const pending: Promise<unknown>[] = [];
  const sourceUrl = `https://furniture-${++fixtureId}.supabase.co`;
  Object.defineProperty(globalThis, "caches", { configurable: true, value: { default: cache } });
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const isSetting = url.pathname.endsWith("/home_sections") && url.searchParams.get("section_key") === "eq.furniture_catalog";
    if (isSetting && failedSetting) return new Response("Unavailable", { status: 503 });
    const rows = isSetting ? [{ items_zh: overrides, updated_at: "2026-10-08T00:00:00Z" }]
      : url.pathname.endsWith("/materials") ? materials
        : url.pathname.endsWith("/site_settings") ? [{ updated_at: "2026-10-08T00:00:00Z" }] : [];
    return new Response(JSON.stringify(rows), { headers: { "content-type": "application/json" } });
  }));
  return async (path: string) => {
    const response = await onRequest({ request: new Request(`https://flashcast.com.my${path}`), env: {
      VITE_SUPABASE_URL: sourceUrl, VITE_SUPABASE_ANON_KEY: "fixture-public-key", CF_PAGES_COMMIT_SHA: "fixture-pagination",
      ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) },
    }, next: async () => new Response(shell), waitUntil: (task: Promise<unknown>) => pending.push(task) } as Parameters<typeof onRequest>[0]);
    const html = await response.text();
    await Promise.all(pending.splice(0));
    return { response, html, document: new DOMParser().parseFromString(html, "text/html") };
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalCaches) Object.defineProperty(globalThis, "caches", originalCaches);
  else delete (globalThis as { caches?: unknown }).caches;
});

const productHrefs = (document: Document) => [...document.querySelectorAll('[data-flashcast-readable-furniture-listing] h2 a')].map(a => a.getAttribute("href"));

describe("furniture pagination in original Edge HTML", () => {
  it.each(["en", "zh"] as const)("keeps distinct %s page 1/3/9/14 identities, products, alternates and cache hits", async (language) => {
    const read = fixture();
    const seen = new Set<string>();
    for (const page of [1, 3, 9, 14]) {
      const search = page === 1 ? "" : `?page=${page}`;
      const path = `/${language}/furniture${search}`;
      const first = await read(path);
      expect(first.response.status).toBe(200);
      expect(first.response.headers.get("x-flashcast-html-cache")).toBe("miss");
      expect(first.document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://flashcast.com.my${path}`);
      expect(first.document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(`https://flashcast.com.my${path}`);
      for (const [locale, prefix] of [["en", "en"], ["zh-CN", "zh"], ["x-default", "en"]]) {
        expect(first.document.querySelector(`link[hreflang="${locale}"]`)?.getAttribute("href")).toBe(`https://flashcast.com.my/${prefix}/furniture${search}`);
      }
      const expected = catalog.products.slice((page - 1) * 18, page * 18).map(p => `/${language}/furniture/product/${encodeURIComponent(decodeURIComponent(p.slug))}`);
      expect(productHrefs(first.document)).toEqual(expected);
      expected.forEach(href => { expect(seen.has(href)).toBe(false); seen.add(href); });
      const links = [...first.document.querySelectorAll('[data-flashcast-readable-furniture-listing] nav a')].map(a => a.getAttribute("href"));
      expect(links).toContain(`/${language}/furniture`);
      if (page > 1) expect(links).toContain(`/${language}/furniture?page=${page - 1}`);
      expect(links).toContain(`/${language}/furniture?page=${page + 1}`);
      const hit = await read(`${path}${search ? "&" : "?"}utm_source=fixture`);
      expect(hit.response.headers.get("x-flashcast-html-cache")).toBe("hit");
      expect(hit.html).toBe(first.html);
      expect(first.html).toContain('id="root"></div>');
    }
  });

  it.each(["en", "zh"] as const)("uses current %s hidden products, edited fields and managed category membership before clamping", async (language) => {
    const managed = { id: "fixture-chair", slug: "fixture-published-chair", status: "published", category: "furniture", subcategory: "bedroom", material_type: "bed-frame", title_en: "Published <chair>", title_zh: "发布的<椅子>", excerpt_en: "Edited & approved", excerpt_zh: "已修改&审核", reference_price: "RM 120" };
    const baselineOverrides = catalog.products.map(p => ({ slug: p.slug, enabled: false, name_en: p.name, name_zh: p.name, shortDescription_en: p.shortDescription, shortDescription_zh: p.shortDescription, description_en: p.description, description_zh: p.description, price: p.price || "", images: p.images }));
    const read = fixture({ overrides: baselineOverrides, materials: [managed] });
    const { document, html } = await read(`/${language}/furniture/bedroom/bed-frame?page=999`);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://flashcast.com.my/${language}/furniture/bedroom/bed-frame`);
    expect(productHrefs(document)).toEqual([`/${language}/furniture/product/fixture-published-chair`]);
    expect(document.querySelector('[data-flashcast-readable-furniture-listing]')?.textContent).toContain(language === "en" ? "Published <chair>" : "发布的<椅子>");
    expect(document.querySelector("chair")).toBeNull();
    expect(html).not.toContain(`/furniture/product/${catalog.products[0].slug}`);
    const empty = await read(`/${language}/furniture/dining?page=3`);
    expect(productHrefs(empty.document)).toEqual([]);
    expect(empty.document.querySelector('[data-flashcast-readable-furniture-listing]')?.textContent).toContain(furnitureText[language].noProducts);
  });

  it("does not replace a failed published visibility read with unverified baseline links", async () => {
    const read = fixture({ failedSetting: true });
    const { document } = await read("/en/furniture?page=9");
    expect(document.querySelector('[data-flashcast-readable-furniture-listing]')).toBeNull();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://flashcast.com.my/en/furniture?page=9");
  });

  it.each(["0", "-2", "1.5", "invalid", "Infinity"])("normalizes invalid page %s to page one", async (value) => {
    const read = fixture();
    const { document } = await read(`/en/furniture?page=${value}`);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://flashcast.com.my/en/furniture");
    expect(productHrefs(document)).toEqual(catalog.products.slice(0, 18).map(p => `/en/furniture/product/${encodeURIComponent(decodeURIComponent(p.slug))}`));
  });
});
