import { TextEncoder as NodeTextEncoder } from "node:util";
import { describe, expect, it } from "vitest";

Object.defineProperty(globalThis, "TextEncoder", {
  configurable: true,
  value: NodeTextEncoder,
});
Object.defineProperty(globalThis, "Uint8Array", {
  configurable: true,
  value: new NodeTextEncoder().encode("").constructor,
});

const loadSeoMaterialPages = () => import("../../scripts/seo-material-pages.mjs");

const publishedRows = [
  { slug: "bathroom-tile", category: "Bathroom", subcategory: "Anti-Slip Tile" },
  { slug: "acoustic-panel", category: "Wall & Panels", subcategory: "Acoustic Wall Panel" },
  { slug: "acrylic-door", category: "Kitchen Cabinets", subcategory: "Acrylic Cabinets" },
];

describe("material SEO taxonomy", () => {
  it("adds CMS-derived subcategories without duplicating static taxonomy", async () => {
    const { loadMaterialSeoCategories } = await loadSeoMaterialPages();
    const categories = await loadMaterialSeoCategories(publishedRows);
    const bathroom = categories.find((category: { slug: string }) => category.slug === "bathroom");
    const kitchen = categories.find((category: { slug: string }) => category.slug === "kitchen-cabinets");

    expect(bathroom?.subcategories).toEqual(expect.arrayContaining([
      expect.objectContaining({
        slug: "anti-slip-tile",
        title_en: "Anti-Slip Tile | Bathroom",
        title_zh: "防滑砖 | 浴室",
      }),
    ]));
    expect(kitchen?.subcategories.filter((subcategory: { slug: string }) => subcategory.slug === "acrylic-cabinets")).toHaveLength(1);
  });

  it("exposes CMS-derived taxonomy paths to sitemap and manifest generators", async () => {
    const { loadMaterialSeoPaths } = await loadSeoMaterialPages();
    const paths = await loadMaterialSeoPaths(publishedRows);

    expect(paths).toContain("/materials/category/bathroom/anti-slip-tile");
    expect(paths).toContain("/materials/category/wall-panels/acoustic-wall-panel");
    expect(new Set(paths).size).toBe(paths.length);
  });
});
