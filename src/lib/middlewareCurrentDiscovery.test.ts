import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { sourceKinds, type PublicSourceTable } from "@/lib/publicContentQualification.mjs";

const site = "https://flashcast.com.my";
const { reviewedTaxonomy, incompleteTaxonomy } = vi.hoisted(() => ({
  reviewedTaxonomy: "/materials/category/bathroom/shower-screen",
  incompleteTaxonomy: "/materials/category/bathroom/anti-slip-tile",
}));
vi.mock("../../functions/seo-manifest.json", () => {
  const origin = "https://flashcast.com.my";
  const fixed = ["/en/about", "/zh/about", "/en/furniture/product/catalogue", "/zh/furniture/product/catalogue",
    "/en/furniture/product/catalogue-%E6%A4%85", "/zh/furniture/product/catalogue-%E6%A4%85",
    "/en/furniture/product/catalogue-%e6%a4%85", "/zh/furniture/product/catalogue-%e6%a4%85",
    "/en/furniture/product/catalogue-%25e6%25a4%2585", "/en/furniture/product/another-%E6%A4%85",
  ].map(path => [path, { owned_static: true }]);
  const materialEntries = [reviewedTaxonomy, incompleteTaxonomy].flatMap(path => {
    const publishedMalay = path === reviewedTaxonomy;
    const locales = publishedMalay ? ["en", "zh", "ms"] : ["en", "zh"];
    const href = (locale: string) => `${origin}/${locale}${path}`;
    return locales.map(lang => [`/${lang}${path}`, {
      owned_static: false, source_kind: "material_taxonomy", lang, path,
      title: lang === "ms" ? "Sekatan Kaca Pancuran | Bilik Mandi" : "Material category",
      description: lang === "ms" ? "Pilihan sekatan kaca pancuran." : "Material category description.",
      canonical: href(lang), ogImage: origin + "/og-image.webp",
      hreflang: { en: href("en"), zh: href("zh"), xDefault: href("en"), ...(publishedMalay ? { ms: href("ms") } : {}) },
    }]);
  });
  return { default: Object.fromEntries([...fixed, ...materialEntries]) };
});
type Row = Record<string, unknown> & { id: string };
const tables = Object.keys(sourceKinds) as PublicSourceTable[];
const prefixes: Record<PublicSourceTable, string> = { projects: "/projects", blog_posts: "/blog", materials: "/materials", service_areas: "/locations", landing_pages: "/landing", services: "/services", site_pages: "", cms_pages: "" };
const row = (table: PublicSourceTable, index: number): Row => ({
  id: String(index).padStart(8, "0"), status: "published", slug: `current-${table}-${index}`, path: `/current-${table}-${index}`,
  title_en: "Current English title", title_zh: "当前中文标题", content_en: "Published English body", content_zh: "已发布中文正文", category: "flooring",
  cms_sections: [{ status: "published", content_en: { rich_text: "Published child" }, content_zh: { rich_text: "已发布子块" } }],
});
const records = (count = 0) => Object.fromEntries(tables.map(table => [table, Array.from({ length: count }, (_, i) => row(table, i + 1))])) as Record<PublicSourceTable, Row[]>;
const xml = (paths: string[]) => `<urlset>${paths.map(path => `<url><loc>${site}${path}</loc></url>`).join("")}</urlset>`;
const staticPaths = ["/en/about", "/zh/about", "/en/furniture/product/catalogue", "/zh/furniture/product/catalogue", ...tables.map(table => `/en${prefixes[table]}${prefixes[table] ? "/withdrawn" : "/withdrawn-" + table}`)];

async function readDiscovery(rows = records(), options: { cap?: number; failureTable?: PublicSourceTable; later?: boolean; malformed?: unknown; hidden?: boolean; hiddenSlug?: string; overrides?: Record<string, unknown>[]; extraStaticPaths?: string[]; extraStaticXml?: string; noConfig?: boolean; asset?: "sitemap.xml" | "llms.txt" } = {}) {
  const emptyTerminals = new Set<string>();
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const table = url.pathname.split("/").pop() as PublicSourceTable | "home_sections";
    if (table === "home_sections") return new Response(JSON.stringify(options.overrides || options.hidden || options.hiddenSlug ? [{ items_zh: options.overrides || [{ slug: options.hiddenSlug || "catalogue", enabled: false, name_zh: "", name_en: "", shortDescription_zh: "", shortDescription_en: "", description_zh: "", description_en: "", price: "", images: [] }] }] : []));
    const cursor = url.searchParams.get("id")?.slice(3) || "";
    if (table === options.failureTable && (!options.later || cursor)) return new Response("unavailable", { status: 503 });
    if (options.malformed !== undefined && table === "projects") return new Response(JSON.stringify(options.malformed));
    const data = (rows[table] || []).filter(item => item.id > cursor).slice(0, Math.min(options.cap || 500, Number(url.searchParams.get("limit") || 500)));
    if (!data.length) emptyTerminals.add(table);
    return new Response(JSON.stringify(data));
  });
  vi.stubGlobal("fetch", fetcher);
  const builtXml = xml([...staticPaths, ...(options.extraStaticPaths || [])]);
  const env = { ...(options.noConfig ? {} : { VITE_SUPABASE_URL: "https://fixture.supabase.co", VITE_SUPABASE_ANON_KEY: "fixture-public-key" }),
    ASSETS: { fetch: async (request: Request) => new Response(request.url.endsWith("/sitemap.xml")
      ? builtXml.replace("</urlset>", `${options.extraStaticXml || ""}</urlset>`)
      : "# FLASH CAST\n\n## Canonical URL List\n- stale\n\n## Notes For AI Assistants\nUse official sources.") },
  };
  const response = await onRequest({ request: new Request(`${site}/${options.asset || "sitemap.xml"}`), env, next: async () => new Response("") } as Parameters<typeof onRequest>[0]);
  return { response, text: await response.text(), emptyTerminals, fetcher };
}
afterEach(() => vi.unstubAllGlobals());
describe("complete current runtime discovery", () => {
  it.each([100, 1000])("reads all eight sources through empty terminal pages at server cap %s", async cap => {
    const result = await readDiscovery(records(551), { cap });
    expect(result.response.status).toBe(200);
    expect(result.emptyTerminals.size).toBe(8);
    const locations = [...result.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    expect(locations).toHaveLength(8 * 551 * 2 + 4);
    for (const table of tables) for (const language of ["en", "zh"]) {
      const path = prefixes[table] ? `${prefixes[table]}/current-${table}-551` : `/current-${table}-551`;
      expect(locations).toContain(`${site}/${language}${path}`);
    }
    expect(result.text).not.toContain("withdrawn");
  });
  for (const table of tables) for (const later of [false, true]) {
    it(`rejects ${table} ${later ? "later-page" : "initial"} failure without stale URLs`, async () => {
      const result = await readDiscovery(records(2), { cap: 1, failureTable: table, later });
      expect(result.response.status).toBe(503);
      expect(result.response.headers.get("cache-control")).toBe("no-store");
      expect(result.text).not.toContain("<loc>");
    });
  }
  it.each([null, {}, [null], [{ id: "1", slug: "wrong/path", status: "published" }]])("rejects malformed source %j", async malformed => {
    expect((await readDiscovery(records(), { malformed })).response.status).toBe(503);
  });
  it("treats missing access as unknown, not successful empty publication", async () => {
    const result = await readDiscovery(records(), { noConfig: true });
    expect(result.response.status).toBe(503);
    expect(result.fetcher).not.toHaveBeenCalled();
  });
  it("uses only complete locale bodies, published CMS children and the first current owner", async () => {
    const rows = records();
    rows.blog_posts = [{ ...row("blog_posts", 1), content_zh: "" }];
    rows.cms_pages = [{ ...row("cms_pages", 1), cms_sections: [{ status: "draft", content_en: { rich_text: "Not published" } }] }];
    rows.site_pages = [{ ...row("site_pages", 1), path: "/blog/current-blog_posts-1" }];
    let result = await readDiscovery(rows);
    expect(result.text).toContain(`${site}/en/blog/current-blog_posts-1`);
    expect(result.text).not.toContain(`${site}/zh/blog/current-blog_posts-1`);
    expect(result.text).not.toContain("current-cms_pages-1");
    rows.blog_posts[0].content_en = "";
    result = await readDiscovery(rows);
    expect(result.text).not.toContain("current-blog_posts-1");
    rows.blog_posts[0].content_en = "Restored body";
    rows.blog_posts[0].content_zh = "恢复的正文";
    expect((await readDiscovery(rows)).text).toContain(`${site}/zh/blog/current-blog_posts-1`);
  });
  it("keeps exact route templates in complete reads without treating them as documents", async () => {
    const rows = records();
    rows.site_pages = [{ ...row("site_pages", 1), path: "/services/:slug" }];
    rows.cms_pages = [{ ...row("cms_pages", 1), path: "/materials/category/:categorySlug" }];
    const result = await readDiscovery(rows);
    expect(result.response.status).toBe(200);
    expect(result.emptyTerminals.size).toBe(8);
    expect(result.text).not.toContain(":slug");
    expect(result.text).not.toContain(":categorySlug");
  });
  it("preserves independent catalogue providers but honors Admin disable overrides", async () => {
    const visible = await readDiscovery();
    expect(visible.text).toContain(`${site}/en/furniture/product/catalogue`);
    const hidden = await readDiscovery(records(), { hidden: true });
    expect(hidden.text).not.toContain("furniture/product/catalogue");
    expect(hidden.text).toContain(`${site}/en/about`);
  });
  it("keeps built material taxonomy and its Malay alternates in complete live discovery", async () => {
    const rows = records();
    rows.site_pages = [{ ...row("site_pages", 1), path: reviewedTaxonomy }];
    const extraStaticXml = ["en", "zh", "ms"].map(lang =>
      `<url><loc>${site}/${lang}${reviewedTaxonomy}</loc><xhtml:link rel="alternate" hreflang="ms-MY" href="${site}/ms${reviewedTaxonomy}" /></url>`).join("");
    const result = await readDiscovery(rows, { extraStaticXml, extraStaticPaths: ["/ms" + incompleteTaxonomy] });
    expect(result.response.status).toBe(200);
    const blocks = [...result.text.matchAll(/<url>[\s\S]*?<\/url>/g)].map(match => match[0]);
    for (const lang of ["en", "zh", "ms"]) {
      const matching = blocks.filter(block => block.includes(`<loc>${site}/${lang}${reviewedTaxonomy}</loc>`));
      expect(matching).toHaveLength(1);
      expect(matching[0]).toContain(`hreflang="ms-MY" href="${site}/ms${reviewedTaxonomy}"`);
    }
    expect(result.text).not.toContain("/ms" + incompleteTaxonomy);
  });
  it("keeps an unqualified Malay taxonomy route renderable but noindexed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([])));
    const next = async () => new Response('<html lang="en"><head><title>App</title></head><body><div id="root"></div></body></html>', { headers: { "content-type": "text/html" } });
    const request = (path: string) => onRequest({
      request: new Request(site + path), next, env: { VITE_SUPABASE_URL: "https://taxonomy-fixture.supabase.co", VITE_SUPABASE_ANON_KEY: "fixture", ASSETS: { fetch: next } },
    } as Parameters<typeof onRequest>[0]);
    const qualified = await request("/ms" + reviewedTaxonomy);
    const unqualified = await request("/ms" + incompleteTaxonomy);
    expect(qualified.status).toBe(200);
    expect(unqualified.status).toBe(200);
    const localized = await qualified.text();
    const fallback = await unqualified.text();
    expect(localized).toContain("Sekatan Kaca Pancuran");
    expect(localized).toContain(`hreflang="ms-MY" href="${site}/ms${reviewedTaxonomy}"`);
    expect(localized).not.toContain("noindex");
    expect(fallback).toContain('content="noindex, follow"');
    expect(fallback).not.toContain('hreflang="ms-MY"');
  });
  it.each(["sitemap.xml", "llms.txt"] as const)("omits legal paths in %s after combining static and published CMS data", async (asset) => {
    const rows = records();
    rows.site_pages = [
      { ...row("site_pages", 1), path: "/privacy" },
      { ...row("site_pages", 2), path: "/terms" },
      { ...row("site_pages", 3), path: "/privacy-notice" },
    ];
    const legalPaths = ["/en/privacy", "/zh/privacy", "/en/terms", "/zh/terms"];
    const result = await readDiscovery(rows, { asset, extraStaticPaths: legalPaths });
    expect(result.response.status).toBe(200);
    const locations = asset === "sitemap.xml"
      ? [...result.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
      : result.text.split("## Canonical URL List\n")[1].split("\n## Notes")[0].split("\n").map((line) => line.slice(2));
    for (const path of legalPaths) expect(locations).not.toContain(`${site}${path}`);
    expect(locations).toContain(`${site}/en/privacy-notice`);
    expect(locations).toContain(`${site}/zh/about`);
  });
  it.each(["sitemap.xml", "llms.txt"] as const)("withdraws equivalent encoded furniture URLs from %s without hiding other identities", async (asset) => {
    const equivalents = ["en", "zh"].flatMap((language) => [
      `/${language}/furniture/product/catalogue-%E6%A4%85`,
      `/${language}/furniture/product/catalogue-%e6%a4%85`,
    ]);
    const separate = ["/en/furniture/product/catalogue-%25e6%25a4%2585", "/en/furniture/product/another-%E6%A4%85"];
    const options = { asset, extraStaticPaths: [...equivalents, ...separate] };
    const visible = await readDiscovery(records(), options);
    for (const path of [...equivalents, ...separate]) expect(visible.text).toContain(`${site}${path}`);
    const hidden = await readDiscovery(records(), { ...options, hiddenSlug: "catalogue-%e6%a4%85" });
    expect(hidden.response.status).toBe(200);
    for (const path of equivalents) expect(hidden.text).not.toContain(`${site}${path}`);
    for (const path of separate) expect(hidden.text).toContain(`${site}${path}`);
    expect(hidden.text).toContain(`${site}/en/about`);
    const disabled = { slug: "catalogue-%e6%a4%85", enabled: false, name_zh: "", name_en: "", shortDescription_zh: "", shortDescription_en: "", description_zh: "", description_en: "", price: "", images: [] };
    const enabled = { ...disabled, slug: "catalogue-椅", enabled: true };
    const enabledAgain = await readDiscovery(records(), { ...options, overrides: [disabled, enabled] });
    for (const path of equivalents) expect(enabledAgain.text).toContain(`${site}${path}`);
    const disabledAgain = await readDiscovery(records(), { ...options, overrides: [enabled, disabled] });
    for (const path of equivalents) expect(disabledAgain.text).not.toContain(`${site}${path}`);
  });
  it("returns the same qualified set in AI discovery and sitemap without stale counts", async () => {
    const rows = records(1);
    const sitemap = await readDiscovery(rows);
    const ai = await readDiscovery(rows, { asset: "llms.txt" });
    const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    expect(ai.response.status).toBe(200);
    for (const url of urls) expect(ai.text).toContain(`- ${url}`);
    expect(ai.text).not.toContain("- stale");
    expect(ai.text).toContain("- blog: 2 localized URLs");
  });
});
