import { describe, expect, it } from "vitest";
import text from "@/i18n/customCabinetsText.json";
import { execFileSync } from "node:child_process";

describe("cabinet landing page discovery", () => {
  const staticManifest = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", "import {buildStaticManifest} from './scripts/seo-static-pages.mjs'; console.log(JSON.stringify(Object.fromEntries(Object.entries(buildStaticManifest()).filter(([path])=>path.endsWith('/custom-cabinets')))));"], { cwd: process.cwd(), encoding: "utf8" }));
  // Verify the actual generators with a complete deterministic snapshot; do not
  // require unrelated CMS snapshots to be refreshed in a feature commit.
  const generated = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
    import {buildQualifiedManifest} from './scripts/generate-seo-manifest.mjs';
    import {buildQualifiedSitemap} from './scripts/generate-sitemap.mjs';
    import {buildQualifiedLlms} from './scripts/generate-llms.mjs';
    const rows=Object.fromEntries(['projects','blog_posts','materials','service_areas','landing_pages','services','site_pages','cms_pages'].map(key=>[key,[]]));
    const all=await buildQualifiedManifest({complete:true,rows,readAt:'2026-10-29T00:00:00Z',sourceHash:'0'.repeat(64),sourceVersion:'fixture'});
    const manifest=Object.fromEntries(Object.entries(all).filter(([path])=>path.endsWith('/custom-cabinets')));
    console.log(JSON.stringify({manifest,sitemap:buildQualifiedSitemap(manifest),llms:buildQualifiedLlms(manifest)}));
  `], { cwd: process.cwd(), encoding: "utf8" }));
  const { manifest: qualified, sitemap, llms } = generated;
  it.each(["zh", "en", "ms"] as const)("keeps %s metadata, qualification and discovery aligned", (language) => {
    const path = `/${language}/custom-cabinets`;
    const meta = staticManifest[path];
    expect(meta.title).toBe(text[language].metaTitle);
    expect(meta.description).toBe(text[language].metaDescription);
    expect(meta.schemaType).toBe("Service");
    expect(meta.faqs).toEqual(text[language].faqs);
    expect(meta.canonical).toBe(`https://flashcast.com.my${path}`);
    expect(qualified[path]).toMatchObject({ qualification: "eligible", source_complete: true });
    expect(Object.keys(qualified[path].hreflang).sort()).toEqual(["en", "ms", "xDefault", "zh"]);
    expect(sitemap).toContain(`<loc>${meta.canonical}</loc>`);
    expect(llms).toContain(meta.canonical);
  });
});
