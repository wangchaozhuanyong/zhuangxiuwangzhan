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

import { materialSubcategoryPageText } from "@/i18n/materialSubcategoryPageText";
import { translateDisplayText, translateMaterialSubcategory } from "@/i18n/displayLabels";

const currentTargetRows = [
  {
    "slug": "wardrobe-full-height",
    "category": "Whole House Custom",
    "subcategory": "Wardrobes",
    "excerpt_en": "A floor-to-ceiling wardrobe direction organised around hanging and folded storage for bedrooms and walk-in dressing areas.",
    "excerpt_zh": "从地面延伸至天花、按衣物类型规划挂放与叠放的定制衣柜方向，适合卧室和步入式衣帽区。"
  },
  {
    "slug": "display-storage-cabinet",
    "category": "Whole House Custom",
    "subcategory": "Storage Cabinets",
    "excerpt_en": "A custom cabinet direction combining glazed display, open shelves, and concealed storage for dining, living, and collection areas.",
    "excerpt_zh": "结合玻璃展示、开放层板与封闭收纳的定制柜方向，适合餐厅、客厅和收藏展示区域。"
  }
];

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


describe("selected material descriptions match the existing client", () => {
  it("uses the first published localized excerpt for exactly four URL/language combinations", async () => {
    const { loadMaterialSeoCategories } = await loadSeoMaterialPages();
    const categories = await loadMaterialSeoCategories(currentTargetRows);
    const custom = categories.find((x: {slug: string}) => x.slug === "whole-house-custom");
    for (const row of currentTargetRows) {
      const slug = row.subcategory.toLowerCase().replaceAll(" ", "-");
      const sub = custom?.subcategories.find((x: {slug: string}) => x.slug === slug);
      for (const lang of ["en", "zh"] as const) {
        const name = translateMaterialSubcategory(row.subcategory, lang);
        const expected = materialSubcategoryPageText[lang].metaDescription(translateDisplayText(row[`excerpt_${lang}`], lang), name);
        expect(sub?.[`description_${lang}`]).toBe(expected);
      }
    }
  });
  it("preserves first-row selection, all titles, unselected entries and paths", async () => {
    const { loadMaterialSeoCategories, loadMaterialSeoPaths } = await loadSeoMaterialPages();
    const base = await loadMaterialSeoCategories();
    const after = await loadMaterialSeoCategories([...currentTargetRows, {...currentTargetRows[0], excerpt_en: "Later row must not win."}]);
    const strip = (rows: Array<{slug: string; subcategories: Array<{slug: string}>}>) => rows.map((category) => ({...category, subcategories: category.subcategories.map((sub) => category.slug === "whole-house-custom" && ["wardrobes", "storage-cabinets"].includes(sub.slug) ? {...sub, description_en: "selected", description_zh: "selected"} : sub)}));
    expect(strip(after)).toEqual(strip(base));
    expect(await loadMaterialSeoPaths(currentTargetRows)).toEqual(await loadMaterialSeoPaths());
  });
  it("uses complete same-language fallback when there are no published rows", async () => {
    const { loadMaterialSeoCategories } = await loadSeoMaterialPages();
    const rows = await loadMaterialSeoCategories();
    const custom = rows.find((x: {slug: string}) => x.slug === "whole-house-custom");
    expect(custom.subcategories.find((x: {slug: string}) => x.slug === "wardrobes").description_zh).toBe("内嵌式衣柜与步入式衣帽间，可结合空间规划推拉门或平开门。 浏览 衣柜 材料选项，适用于吉隆坡装修项目。");
    expect(custom.subcategories.find((x: {slug: string}) => x.slug === "storage-cabinets").description_zh).toBe("适用于不同房间用途的多用途收纳规划。 浏览 收纳柜 材料选项，适用于吉隆坡装修项目。");
  });
});
