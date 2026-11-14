import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../../functions/_middleware";
import { findServiceAreaRoute } from "@/lib/serviceAreaRoutes";
import pageText from "./serviceAreaPageText.json";

const origin = "https://flashcast.com.my";
const paths = Object.keys(pageText);
const languages = ["en", "zh", "ms"] as const;

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
  it.each(paths.flatMap(path => languages.map(language => ({ path, language }))))(
    "serves qualified metadata for $language$path", async ({ path, language }) => {
      const [, , area, service] = path.split("/");
      const route = findServiceAreaRoute(area, service);
      expect(route?.path).toBe(path);
      const localizedPath = "/" + language + path;
      const expected = pageText[path as keyof typeof pageText][language];
      const meta = generated.manifest[localizedPath];
      expect(meta).toMatchObject({
        title: expected.title, description: expected.description, canonical: origin + localizedPath,
        available_locales: [...languages], source_complete: true, qualification: "eligible", owned_static: true,
        hreflang: { en: origin + "/en" + path, zh: origin + "/zh" + path, ms: origin + "/ms" + path },
      });
      expect(meta.noIndex).not.toBe(true);
      expect(generated.sitemap).toContain("<loc>" + origin + localizedPath + "</loc>");

      const response = await readEdge(localizedPath);
      const html = await response.text();
      expect(response.status).toBe(200);
      expect(html).toContain('<title data-rh="true">' + expected.title + "</title>");
      expect(html).toContain('rel="canonical" href="' + origin + localizedPath + '"');
      expect(html).toContain('hreflang="ms-MY" href="' + origin + "/ms" + path + '"');
      expect(html).not.toMatch(/name="robots" content="noindex/);
      for (const schema of ["Service", "FAQPage", "BreadcrumbList"]) expect(html).toContain('"@type":"' + schema + '"');
      expect(html).toContain(expected.question.replace(/&/g, "\\u0026"));
    },
  );

  it.each([
    "/en/locations/kuala-lumpur/nonexistent",
    "/en/locations/nowhere/kitchen-renovation",
    "/en/locations/kuala-lumpur/kitchen-renovation/extra",
  ])("returns HTTP 404 for %s", async (path) => {
    const response = await readEdge(path);
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('name="robots" content="noindex, nofollow"');
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
