import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { projectSitePageBundleForPreload } from "../../functions/publicDataProjection";
import { mapSitePageRows } from "./homeContentApi";

const site = "https://flashcast.com.my";
const nativePaths = ["/blog", "/contact", "/faq", "/locations", "/materials", "/process", "/projects", "/quote", "/services"];
const shell = `<!doctype html><html lang="en"><head><title>App</title><link data-rh="true" rel="alternate" hreflang="ms-MY" href="${site}/ms/outdated"></head><body><div id="root"></div></body></html>`;

function pageRow(path: string, seoDescriptionMs = "Gambaran keseluruhan halaman ini.") {
  return {
    id: path, path, page_key: path.slice(1), status: "published",
    title_en: "Overview", seo_title_en: "Overview",
    title_zh: "概览", seo_title_zh: "概览",
    title_ms: "Gambaran keseluruhan", seo_title_ms: "Gambaran keseluruhan",
    seo_description_ms: seoDescriptionMs,
    content_en: "", content_zh: "", content_ms: "", items_en: [], items_ms: [],
  };
}

let fixtureId = 0;
async function request(path: string, rows: ReturnType<typeof pageRow>[]) {
  const apiUrl = `https://native-malay-discovery-${++fixtureId}.supabase.co`;
  const next = async () => path === "/sitemap.xml"
    ? new Response('<?xml version="1.0"?><urlset></urlset>', { headers: { "content-type": "application/xml" } })
    : new Response(shell, { headers: { "content-type": "text/html" } });
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (!url.pathname.endsWith("/site_pages") || url.searchParams.has("id")) return Response.json([]);
    const sourcePath = url.searchParams.get("path")?.slice(3);
    const pageKey = url.searchParams.get("page_key")?.slice(3);
    return Response.json(rows.filter((row) => (!sourcePath || row.path === sourcePath) && (!pageKey || row.page_key === pageKey)));
  }));
  return onRequest({
    request: new Request(site + path),
    env: { VITE_SUPABASE_URL: apiUrl, VITE_SUPABASE_ANON_KEY: "fixture", ASSETS: { fetch: next } },
    next,
  } as Parameters<typeof onRequest>[0]);
}

afterEach(() => vi.unstubAllGlobals());

describe("Malay discovery for native public pages", () => {
  it.each(nativePaths)("keeps reciprocal alternates and native metadata for %s", async (path) => {
    for (const lang of ["en", "zh", "ms"]) {
      const href = `/${lang}${path}`;
      const response = await request(href, [pageRow(path)]);
      const document = new DOMParser().parseFromString(await response.text(), "text/html");
      expect(response.status).toBe(200);
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(site + href);
      expect(document.querySelector('meta[name="robots"][content*="noindex"]')).toBeNull();
      for (const [tag, prefix] of [["en", "en"], ["zh-CN", "zh"], ["ms-MY", "ms"], ["x-default", "en"]]) {
        const alternate = document.querySelectorAll(`link[rel="alternate"][hreflang="${tag}"]`);
        expect(alternate).toHaveLength(1);
        expect(alternate[0].getAttribute("href")).toBe(`${site}/${prefix}${path}`);
      }
      if (lang === "ms") expect(document.title).toContain("Gambaran keseluruhan");
    }
  });

  it("keeps incomplete translations readable while omitting their alternate", async () => {
    const incomplete = pageRow("/faq", "");
    const english = await request("/en/faq", [incomplete]);
    expect(await english.text()).not.toContain('hreflang="ms-MY"');
    const malay = await request("/ms/faq", [incomplete]);
    expect(malay.status).toBe(200);
    expect(await malay.text()).toContain('content="noindex, follow"');
  });

  it("uses the same qualification for live sitemap discovery", async () => {
    const rows = nativePaths.map((path) => pageRow(path));
    rows.push(pageRow("/generic-cms-page"));
    rows.sort((a, b) => a.id.localeCompare(b.id));
    const response = await request("/sitemap.xml", rows);
    expect(response.status).toBe(200);
    const xml = await response.text();
    for (const path of nativePaths) {
      expect(xml).toContain(`<loc>${site}/ms${path}</loc>`);
      expect(xml).toContain(`hreflang="ms-MY" href="${site}/ms${path}"`);
    }
    expect(xml).not.toContain("/ms/generic-cms-page");
  });

  it("supplies the same result when React reads the live row or the projected seed", () => {
    for (const row of [pageRow("/services"), pageRow("/services", "")]) {
      const bundle = { site_pages: [row] };
      const seed = projectSitePageBundleForPreload(bundle);
      expect(mapSitePageRows(seed, "en")?.malayIndexable).toBe(Boolean(row.seo_description_ms));
      expect(mapSitePageRows(seed, "zh")?.malayIndexable).toBe(mapSitePageRows(bundle, "zh")?.malayIndexable);
    }
  });
});
