import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getServiceContextLinks } from "@/i18n/serviceContextLinks";

const PRIORITY_SERVICE_SLUGS = ["renovation", "kitchen", "bathroom", "office-renovation", "shop-renovation", "old-house", "builtin"] as const;
const sitemap = readFileSync(resolve(process.cwd(), "public/sitemap.xml"), "utf8");

describe("service context links", () => {
  it.each(PRIORITY_SERVICE_SLUGS)("keeps English and Chinese link destinations aligned for %s", (slug) => {
    const englishLinks = getServiceContextLinks(slug, "en");
    const chineseLinks = getServiceContextLinks(slug, "zh");

    expect(englishLinks).toHaveLength(6);
    expect(chineseLinks.map((item) => item.href)).toEqual(englishLinks.map((item) => item.href));
    expect(new Set(englishLinks.map((item) => item.href)).size).toBe(englishLinks.length);
    expect(englishLinks.every((item) => item.href.startsWith("/") && !item.href.startsWith("//"))).toBe(true);
    englishLinks.forEach((item) => {
      expect(sitemap).toContain(`<loc>https://flashcast.com.my/en${item.href}</loc>`);
      expect(sitemap).toContain(`<loc>https://flashcast.com.my/zh${item.href}</loc>`);
    });
  });

  it("does not invent contextual links for services outside the current delivery batch", () => {
    expect(getServiceContextLinks("design", "en")).toEqual([]);
  });
});
