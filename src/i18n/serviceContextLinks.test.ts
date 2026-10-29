import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getServiceContextLinks } from "@/i18n/serviceContextLinks";

const PRIORITY_SERVICE_SLUGS = ["renovation", "kitchen", "bathroom", "office-renovation", "shop-renovation", "old-house", "builtin"] as const;
const sitemap = readFileSync(resolve(process.cwd(), "public/sitemap.xml"), "utf8");
// New static routes are generated at build time; avoid refreshing unrelated CMS
// snapshots just to register this feature. Full qualification is tested separately.
const staticRoutes: string[] = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", "import {buildStaticManifest} from './scripts/seo-static-pages.mjs'; console.log(JSON.stringify(Object.keys(buildStaticManifest())));"], { encoding: "utf8" }));

describe("service context links", () => {
  it.each(PRIORITY_SERVICE_SLUGS)("keeps English and Chinese link destinations aligned for %s", (slug) => {
    const englishLinks = getServiceContextLinks(slug, "en");
    const chineseLinks = getServiceContextLinks(slug, "zh");

    expect(englishLinks).toHaveLength(slug === "builtin" ? 7 : 6);
    expect(chineseLinks.map((item) => item.href)).toEqual(englishLinks.map((item) => item.href));
    expect(new Set(englishLinks.map((item) => item.href)).size).toBe(englishLinks.length);
    expect(englishLinks.every((item) => item.href.startsWith("/") && !item.href.startsWith("//"))).toBe(true);
    englishLinks.forEach((item) => {
      if (item.href === "/custom-cabinets") {
        expect(staticRoutes).toContain(`/en${item.href}`);
        expect(staticRoutes).toContain(`/zh${item.href}`);
      } else {
        expect(sitemap).toContain(`<loc>https://flashcast.com.my/en${item.href}</loc>`);
        expect(sitemap).toContain(`<loc>https://flashcast.com.my/zh${item.href}</loc>`);
      }
    });
  });

  it("includes the cabinet configurator in all three languages", () => {
    for (const language of ["zh", "en", "ms"] as const) {
      expect(getServiceContextLinks("builtin", language).filter((item) => item.href === "/custom-cabinets")).toHaveLength(1);
      expect(staticRoutes).toContain(`/${language}/custom-cabinets`);
    }
  });

  it("does not invent contextual links for services outside the current delivery batch", () => {
    expect(getServiceContextLinks("design", "en")).toEqual([]);
  });
});
