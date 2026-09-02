import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getLocationContextLinks } from "@/i18n/locationContextLinks";

const sitemap = readFileSync(resolve(process.cwd(), "public/sitemap.xml"), "utf8");

describe("location context links", () => {
  it("keeps English and Chinese link destinations aligned for kuala-lumpur", () => {
    const englishLinks = getLocationContextLinks("kuala-lumpur", "en");
    const chineseLinks = getLocationContextLinks("kuala-lumpur", "zh");

    expect(englishLinks).toHaveLength(13);
    expect(chineseLinks.map((item) => item.href)).toEqual(englishLinks.map((item) => item.href));
    expect(new Set(englishLinks.map((item) => item.href)).size).toBe(englishLinks.length);
    expect(englishLinks.every((item) => item.href.startsWith("/") && !item.href.startsWith("//"))).toBe(true);

    englishLinks.forEach((item) => {
      expect(sitemap).toContain(`<loc>https://flashcast.com.my/en${item.href}</loc>`);
      expect(sitemap).toContain(`<loc>https://flashcast.com.my/zh${item.href}</loc>`);
    });
  });

  it("does not invent contextual links for locations outside the current delivery batch", () => {
    expect(getLocationContextLinks("unknown-slug", "en")).toEqual([]);
  });
});
