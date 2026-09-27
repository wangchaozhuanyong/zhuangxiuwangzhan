import { afterEach, expect, it, vi } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { onRequest } from "../../functions/_middleware";
import { buildReadablePublicBody, sanitizeReadableContent } from "../../functions/readablePublicBody";
import { projectPublicMetadata } from "./projectPublicMetadata.mjs";
import { mapPublishedProjectDetail } from "./contentApi";
import fixture from "../test/fixtures/geo-public-source-binding.json";

const allRows = Object.values(fixture.tables).flat() as unknown as Record<string, unknown>[];
const requests: URL[] = [];
let revisionOverride: Record<string, unknown> | undefined;
let cacheOverride: { match: (r: Request) => Promise<Response | undefined>; put: (r: Request, s: Response) => Promise<void> } | undefined;
const pending: Promise<unknown>[] = [];
const assets = '<!doctype html><html><head><title>FLASH CAST</title></head><body><div id="root"></div></body></html>';
afterEach(async () => { await Promise.all(pending.splice(0)); vi.unstubAllGlobals(); requests.length = 0; revisionOverride = undefined; cacheOverride = undefined; });

async function edgePage(path: string, ua = "human-browser") {
  vi.stubGlobal("caches", cacheOverride ? { default: cacheOverride } : undefined);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input)); requests.push(url);
    const slug = url.searchParams.get("slug")?.replace(/^eq\./, "");
    const rows = slug ? allRows.filter(row => row.slug === slug).map(row => revisionOverride?.slug === row.slug ? revisionOverride : row) : [];
    return new Response(JSON.stringify(rows), { headers: { "content-type": "application/json" } });
  }));
  const res = await onRequest({ request: new Request(`https://flashcast.com.my${path}`, { headers: { "user-agent": ua } }), env: { CF_PAGES_COMMIT_SHA: "geo-test", VITE_SUPABASE_URL: `https://fixture-${path.split("/").pop()}.supabase.co`, VITE_SUPABASE_ANON_KEY: "test-public-key", ASSETS: { fetch: async () => new Response(assets, { headers: { "content-type": "text/html" } }) } }, next: async () => new Response(assets, { headers: { "content-type": "text/html" } }), waitUntil: (p: Promise<unknown>) => pending.push(p) } as never);
  expect(res.status).toBe(200);
  return res.text();
}

for (const row of fixture.tables.projects) for (const lang of ["en", "zh"] as const) {
  it(`binds raw, OG, schema and frontend metadata for ${lang}/${row.slug}`, async () => {
    const expected = projectPublicMetadata(row, lang)!;
    expect(mapPublishedProjectDetail(row, lang).publicMetadata).toEqual(expected);
    expect(expected.title).toContain(lang === "zh" ? "设计效果图" : "Design rendering");
    expect(expected.title).not.toMatch(/Renovation Project|not completed|非完工/i);
    const path = `/${lang}/projects/${row.slug}`;
    const html = await edgePage(path);
    const dom = new JSDOM(html);
    const d = dom.window.document;
    expect(d.title).toBe(expected.title);
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) expect(d.querySelector(selector)?.getAttribute("content")).toBe(expected.description);
    expect(d.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(expected.title);
    expect(d.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://flashcast.com.my${path}`);
    const schemas = Array.from(d.querySelectorAll('script[type="application/ld+json"]')).map(n => JSON.parse((n as Node).textContent || "null"));
    expect(JSON.stringify(schemas)).toContain(expected.title);
    expect(JSON.stringify(schemas)).toContain(expected.description);
    dom.window.close();
  });
}

it("leaves non-target project metadata to the existing resolver", () => {
  expect(projectPublicMetadata({ ...fixture.tables.projects[0], slug: "other-project" }, "en")).toBeUndefined();
});

for (const [table, slug, kind] of [["services", "builtin", "services"], ["blog_posts", "renovation-materials-malaysia", "blog"], ["projects", "bangsar-walk-in-wardrobe-system", "projects"]] as const) for (const lang of ["en", "zh"] as const) {
  it(`renders primary content without JS, without JS-mode duplicate headings, for ${lang}/${kind}/${slug}`, async () => {
    const row = fixture.tables[table].find(row => row.slug === slug)!;
    const path = `/${lang}/${kind}/${slug}`;
    const html = await edgePage(path);
    const humanHtml = await edgePage(path, "Googlebot");
    expect(humanHtml).toBe(html);
    const noJs = new JSDOM(html);
    const js = new JSDOM(html, { runScripts: "dangerously", url: "https://flashcast.com.my" });
    const main = noJs.window.document.querySelector("main[data-flashcast-readable-body]")!;
    expect(main).not.toBeNull();
    expect(main.querySelectorAll("h1")).toHaveLength(1);
    expect(main.querySelector("h1")?.textContent).toBe(row[`title_${lang}`]);
    const original = new JSDOM(`<body>${row[`content_${lang}`]}</body>`);
    const normalize = (s: string) => s.replace(/\s+/g, "").trim();
    expect(normalize(main.textContent || "")).toContain(normalize(original.window.document.body.textContent || ""));
    expect(js.window.document.querySelector("main[data-flashcast-readable-body]")).toBeNull();
    expect(js.window.document.querySelectorAll("h1")).toHaveLength(0);
    expect(main.querySelectorAll("script,img,iframe,form,input")).toHaveLength(0);
    if (kind === "services") {
      const service = fixture.tables.services[0];
      for (const faq of service[`faqs_${lang}`]) expect(main.textContent).toContain(faq.q);
      for (const a of main.querySelectorAll("a[href]")) expect(a.getAttribute("href")).toMatch(new RegExp(`^/${lang}/`));
    }
    if (kind === "blog") {
      const metaReads = requests.filter(u => u.pathname.endsWith("/blog_posts") && u.searchParams.get("slug") === `eq.${slug}`);
      expect(metaReads.length).toBe(2); // One existing meta read per request; no extra fallback query.
      expect(metaReads[0].searchParams.get("select")).toContain("content_en,content_zh,status");
    }
    if (process.env.FLASHCAST_GEO_EVIDENCE_DIR) writeFileSync(`${process.env.FLASHCAST_GEO_EVIDENCE_DIR}/${lang}-${kind}-${slug}.html`, html);
    original.window.close(); noJs.window.close(); js.window.close();
  });
}

it("fails closed for draft, wrong slug, missing language/body, oversize and out-of-scope routes", () => {
  const row = fixture.tables.services[0];
  for (const [path, changed] of [["/en/services/builtin", { ...row, status: "draft" }], ["/en/services/builtin", { ...row, slug: "kitchen" }], ["/zh/services/builtin", { ...row, content_zh: "" }], ["/en/services/builtin", { ...row, content_en: "x".repeat(131073) }], ["/en/admin", row], ["/en/services/kitchen", row]] as const) expect(buildReadablePublicBody(path, changed)).toBe("");
});

it("does not label a service photo as a rendering when the published alt has no concept identity", () => {
  const row = { ...fixture.tables.services[0], alt_en: "Existing storage area photo", alt_zh: "现有收纳区域照片" };
  for (const lang of ["en", "zh"] as const) {
    const body = buildReadablePublicBody(`/${lang}/services/builtin`, row);
    expect(body).not.toContain(`<p>${lang === "zh" ? "设计效果图" : "Design rendering"}</p>`);
  }
});

for (const lang of ["en", "zh"] as const) {
  it(`preserves the published Builtin concept identity in ${lang} no-JS primary body`, () => {
    // Original body fixture intentionally excluded media fields. Use the current
    // published alt here, leaving its frozen 19-check baseline unchanged.
    const row = { ...fixture.tables.services[0],
      alt_en: "Italian-minimalist whole-house built-in cabinetry concept with a TV storage wall and kitchen tall units",
      alt_zh: "意式极简客厅与厨房的全屋定制柜体、电视收纳墙和厨房高柜概念示意图" };
    const body = buildReadablePublicBody(`/${lang}/services/builtin`, row);
    expect(body).toContain(`<p>${lang === "zh" ? "设计效果图" : "Design rendering"}</p>`);
  });
}

it("escapes content and strips executable attributes, unsafe URLs and nested no-script escapes", () => {
  const payload = '<h2 onclick="evil()">Title</h2><script>evil()</script><svg onload="evil()">bad</svg><img src=x onerror=evil()><a href="javascript&#58;evil()">one</a><a href="https://evil.example/en">two</a><a href="/zh/quote">three</a><a href="/en/quote?x=1&amp;y=2" onclick="evil()">four</a><p>&lt;img src=x onerror=evil()&gt;</p></noscript><script>bad()</script>';
  const out = sanitizeReadableContent(payload, "en");
  const dom = new JSDOM(`<body>${out}</body>`);
  expect(dom.window.document.querySelectorAll("script,svg,img,[onclick],[onerror]")).toHaveLength(0);
  expect(dom.window.document.querySelectorAll("a[href]")).toHaveLength(1);
  expect(dom.window.document.querySelector("a[href]")?.getAttribute("href")).toBe("/en/quote?x=1&y=2");
  expect(out).not.toContain("</noscript>");
  expect(dom.window.document.body.textContent).toContain("<img src=x onerror=evil()>");
  dom.window.close();
});

it("preserves all other robots lines and passes the inherited 75 path fixtures", () => {
  const actual = readFileSync(`${process.cwd()}/public/robots.txt`, "utf8");
  const groups = actual.split(/\n\s*\n/).filter(s => s.startsWith("User-agent:"));
  expect(groups).toHaveLength(15);
  let cases = 0;
  for (const group of groups) {
    const denied = [...group.matchAll(/^Disallow:\s*(.+)$/gm)].map(x => x[1]);
    for (const [path, allowed] of [["/en/services/builtin", true], ["/zh/services/builtin", true], ["/admin", false], ["/admin/", false], ["/admin/content", false]] as const) {
      expect(!denied.some(prefix => path.startsWith(prefix))).toBe(allowed); cases++;
    }
  }
  expect(cases).toBe(75);
  expect(actual).toContain("Content-Signal: search=yes,ai-input=yes,ai-train=yes");
  expect(actual).toContain("Sitemap: https://flashcast.com.my/sitemap.xml");
});

it("refreshes the same cached fallback from the updated CMS body without adding a second body query", async () => {
  const stored = new Map<string, Response>();
  cacheOverride = { match: async r => stored.get(r.url)?.clone(), put: async (r, s) => { stored.set(r.url, s.clone()); } };
  const path = "/en/services/builtin";
  const first = await edgePage(path);
  await Promise.all(pending.splice(0));
  revisionOverride = { ...fixture.tables.services[0], content_en: "<p>Revised public body fixture.</p>", updated_at: "2026-09-27T09:00:00Z", version: 999 };
  for (const key of stored.keys()) if (key.includes("__flashcast_html_fresh=1")) stored.delete(key);
  expect(await edgePage(path)).toBe(first); // Existing stale-while-revalidate contract is preserved.
  await Promise.all(pending.splice(0));
  const revised = await edgePage(path);
  expect(revised).toContain("Revised public body fixture.");
  expect(revised).not.toBe(first);
});
