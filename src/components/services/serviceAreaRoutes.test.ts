import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { onRequest } from "../../../functions/_middleware";
import { findServiceAreaRoute } from "@/lib/serviceAreaRoutes";
import pageText from "./serviceAreaPageText.json";
import { stripHtml } from "@/lib/text";

const origin = "https://flashcast.com.my";
const paths = Object.keys(pageText);
const klLockPath = "/locations/kuala-lumpur/digital-lock";

const generated = vi.hoisted(() => ({ manifest: {} as Record<string, { noIndex?: boolean }>, sitemap: "" }));
vi.mock("../../../functions/seo-manifest.json", async (importOriginal) => {
  const { default: previous } = await importOriginal<{ default: Record<string, unknown> }>();
  const { execFileSync } = await import("node:child_process");
  Object.assign(generated, JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { buildQualifiedManifest } from './scripts/generate-seo-manifest.mjs';
    import { buildQualifiedSitemap } from './scripts/generate-sitemap.mjs';
    import { sourceKinds } from './src/lib/publicContentQualification.mjs';
    const rows = Object.fromEntries(Object.keys(sourceKinds).map(table => [table, []]));
    const manifest = await buildQualifiedManifest({
      complete: true, rows, readAt: '2026-11-14T00:00:00Z', sourceHash: 'fixture', sourceVersion: 'fixture',
    });
    const sitemap = buildQualifiedSitemap(manifest);
    console.log(JSON.stringify({ manifest: Object.fromEntries(Object.entries(manifest)
      .filter(([path]) => path.split('/').length === 5 && path.includes('/locations/'))), sitemap }));
  `], { cwd: process.cwd(), env: { ...process.env, VITE_SITE_URL: "https://flashcast.com.my" }, encoding: "utf8" })));
  return { default: { ...previous, ...generated.manifest } };
});

afterEach(() => vi.unstubAllGlobals());

async function readEdge(path: string) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { headers: { "content-type": "application/json" } })));
  return onRequest({
    request: new Request(origin + path),
    env: { VITE_SUPABASE_URL: "https://c1-fixture.example", VITE_SUPABASE_ANON_KEY: "fixture" },
    next: async () => new Response('<!doctype html><html lang="en"><head><title>FLASH CAST</title></head><body><div id="root"></div></body></html>', {
      headers: { "content-type": "text/html" },
    }),
  } as Parameters<typeof onRequest>[0]);
}

describe("C1 service and area routes", () => {
  it("keeps the six unsuperseded approved bilingual records verbatim", () => {
    const document = readFileSync("docs/seo/cross-pages-batch-2.md", "utf8");
    const sections = [...document.matchAll(/^## `(\/locations\/[^`]+)`\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
    expect(sections).toHaveLength(7);
    for (const [, path, section] of sections.filter(([, path]) => path !== klLockPath)) {
      const approved = Object.assign({}, ...[...section.matchAll(/```json\s*\n([\s\S]*?)\n```/g)]
        .map(([, json]) => JSON.parse(json)));
      expect(Object.keys(approved).sort()).toEqual(["en", "zh"]);
      expect(pageText[path as keyof typeof pageText]).toEqual(approved);
      expect(approved.en.body).toHaveLength(4);
      expect(approved.zh.body).toHaveLength(4);
    }
  });

  it.each(paths.flatMap(path => Object.entries(pageText[path as keyof typeof pageText])
    .map(([language, expected]) => ({ path, language, expected }))))(
    "serves qualified metadata for $language$path", async ({ path, language, expected }) => {
      const [, , area, service] = path.split("/");
      const route = findServiceAreaRoute(area, service);
      expect(route?.path).toBe(path);
      if (["condo-renovation", "landed-house-renovation"].includes(service)) expect(route?.parentService).toBe("renovation");
      const localizedPath = "/" + language + path;
      const languages = Object.keys(pageText[path as keyof typeof pageText]);
      const meta = generated.manifest[localizedPath];
      expect(meta).toMatchObject({
        title: expected.title, description: expected.description, canonical: origin + localizedPath,
        available_locales: [...languages], source_complete: true, qualification: "eligible", owned_static: true,
        hreflang: Object.fromEntries(languages.map(locale => [locale, origin + "/" + locale + path])),
      });
      expect(meta.noIndex).not.toBe(true);
      expect(generated.sitemap).toContain("<loc>" + origin + localizedPath + "</loc>");

      const response = await readEdge(localizedPath);
      const html = await response.text();
      expect(response.status).toBe(200);
      expect(html).toContain('<title data-rh="true">' + expected.title + "</title>");
      expect(html).toContain('rel="canonical" href="' + origin + localizedPath + '"');
      if (languages.includes("ms")) expect(html).toContain('hreflang="ms-MY" href="' + origin + "/ms" + path + '"');
      else expect(html).not.toContain('hreflang="ms-MY"');
      expect(html).not.toMatch(/name="robots" content="noindex/);
      for (const schema of ["Service", "FAQPage", "BreadcrumbList"]) expect(html).toContain('"@type":"' + schema + '"');
      const faqs = "faqs" in expected ? expected.faqs : [{ question: expected.question, answer: expected.answer }];
      for (const { question } of faqs) expect(html).toContain(question.replace(/&/g, "\\u0026"));

      const doc = new DOMParser().parseFromString(html, "text/html");
      const readable = doc.querySelector("noscript[data-flashcast-geo-summary] [data-flashcast-readable-body]");
      expect(readable?.querySelector("h1")?.textContent).toBe(expected.heading);
      if ("sections" in expected) {
        const headings = Array.from(readable?.querySelectorAll("h2") || [], node => node.textContent);
        expect(headings).toEqual(expect.arrayContaining(expected.sections.map(section => section.heading)));
        expect(headings.filter(heading => /[?？]$/.test(heading || "")).length).toBeGreaterThanOrEqual(2);
        const text = Array.from(readable?.querySelectorAll("h1,h2,h3,p,li") || [], node => node.textContent?.trim()).join(" ");
        expect([...text].length).toBeGreaterThanOrEqual(language === "zh" ? 2500 : 4000);
        if (language === "en") expect(text.trim().split(/\s+/).length).toBeGreaterThanOrEqual(600);
        const links = Array.from(readable?.querySelectorAll("a[href]") || [], node => node.getAttribute("href"));
        expect(links).toEqual(expect.arrayContaining(expected.models.map(model =>
          `https://locks.flashcast.com.my/${language}/lock/${model.slug}/`
        )));
      } else {
        const overview = readable?.querySelector("section");
        expect(overview?.querySelector("h2")?.textContent).toBe(expected.bodyHeading);
        expect(Array.from(overview?.querySelectorAll("p") ?? [], node => node.textContent)).toEqual(expected.body.map(stripHtml));
        expect(overview?.innerHTML).not.toContain("&lt;p&gt;");
      }
      expect(Array.from(readable?.querySelectorAll("section:last-child h3") || [], node => node.textContent))
        .toEqual(faqs.map(item => item.question));
    },
  );

  it.each(paths.filter(path => !("ms" in pageText[path as keyof typeof pageText])))(
    "excludes untranslated Malay %s and retains the existing noindex fallback", async path => {
      const localizedPath = "/ms" + path;
      expect(generated.manifest[localizedPath]).toBeUndefined();
      expect(generated.sitemap).not.toContain("<loc>" + origin + localizedPath + "</loc>");
      const response = await readEdge(localizedPath);
      expect(response.status).toBe(200);
      const document = new DOMParser().parseFromString(await response.text(), "text/html");
      expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toMatch(/\bnoindex\b/);
    },
  );

  it.each([
    "/en/locations/kuala-lumpur/nonexistent",
    "/en/locations/nowhere/kitchen-renovation",
    "/en/locations/kuala-lumpur/kitchen-renovation/extra",
  ])("returns HTTP 404 for %s", async (path) => {
    const response = await readEdge(path);
    expect(response.status).toBe(404);
    const html = await response.text();
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).not.toContain("data-flashcast-readable-body");
  });

  it.each([
    "/en/locations/kuala-lumpur", "/zh/locations/kuala-lumpur",
    "/en/services/kitchen", "/zh/services/kitchen",
  ])("keeps existing HTTP 200 for %s", async (path) => {
    const response = await readEdge(path);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('rel="canonical" href="' + origin + path + '"');
  });

  it("rejects existing area and service slugs in an unapproved combination", () => {
    expect(findServiceAreaRoute("selangor", "kitchen-renovation")).toBeNull();
  });
});
