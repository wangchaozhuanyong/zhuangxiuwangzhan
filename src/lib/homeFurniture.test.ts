import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPublishedHomeSectionRow,
  fetchPublishedMaterialRowsByCategory,
} from "@/backend/modules/cms/repository/publicContentRepository";
import { getPublishedHomeFurniture } from "./furnitureCatalog";
import { furnitureCatalog, getFurnitureProduct, type FurnitureMaterialRow, type FurnitureProduct } from "./furnitureCatalogPresentation";
import type { FurnitureCatalogOverride } from "./furnitureCatalogOverrides";
import { mapHomeFurnitureSeed, selectHomeFurniture } from "./homeFurniture";

vi.mock("@/backend/modules/cms/repository/publicContentRepository", () => ({
  fetchPublishedMaterialRowsByCategory: vi.fn(),
  fetchPublishedMaterialBySlugAndCategory: vi.fn(),
  fetchPublishedHomeSectionRow: vi.fn(),
}));

const chair = "lc-40108-1-seater-pu-lounge-chair-cream";
const dining = "danu-6-seater-sintered-stone-dining-set-cream";
const table = "a05-smart-charging-bedside-table-white";
const desk = "std-2501-compact-study-desk";

const override = (slug: string, enabled: boolean): FurnitureCatalogOverride => ({
  slug, enabled, name_zh: "已保存的家具", name_en: "Saved furniture", shortDescription_zh: "不应注入的简介", shortDescription_en: "Summary must not be injected",
  description_zh: "不应注入的正文", description_en: "Body must not be injected", price: "RM 999", images: ["/saved-furniture.webp"],
});

const managed = (slug: string): FurnitureProduct => ({
  slug, name: `Managed ${slug}`, images: [`/${slug}.webp`], sourceImages: [], sourceUrl: `admin-material:${slug}`,
  shortDescription: "Private summary", description: "Private body", sku: "PRIVATE-SKU", price: "RM 900", sourceCategories: [], managedCategoryKey: "living", localized: true,
});

describe("compact homepage furniture projection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchPublishedMaterialRowsByCategory).mockResolvedValue([]);
    vi.mocked(fetchPublishedHomeSectionRow).mockResolvedValue(null);
  });

  it("keeps the four preferred products and reviewed bilingual display labels", () => {
    const seed = mapHomeFurnitureSeed([], null);
    expect(seed.en.map((card) => card.slug)).toEqual([chair, dining, table, desk]);
    expect(seed.zh.map((card) => card.slug)).toEqual([chair, dining, table, desk]);
    expect(seed.en.find((card) => card.slug === dining)?.name).toContain("catalogue reference");
    expect(seed.zh.find((card) => card.slug === dining)?.name).toContain("目录标示");
    expect(seed.zh[0].name).toContain("休闲椅");
    expect(seed.en[0].name).toContain("Lounge Chair");
    expect(seed.en[0].categoryKey).toBeTruthy();
  });

  it("applies hidden state and saved bilingual names/images before selecting cards", () => {
    const setting = { items_zh: [override(chair, false), override(dining, true)] };
    const seed = mapHomeFurnitureSeed([], setting);
    for (const language of ["en", "zh"] as const) {
      expect(seed[language]).toHaveLength(4);
      expect(seed[language].some((card) => card.slug === chair)).toBe(false);
      expect(seed[language][0]).toMatchObject({ slug: dining, image: "/saved-furniture.webp", name: language === "en" ? "Saved furniture" : "已保存的家具" });
      for (const card of seed[language]) expect(Object.keys(card).sort()).toEqual(["categoryKey", "image", "name", "slug"]);
    }
    expect(JSON.stringify(seed)).not.toContain("RM 999");
    expect(JSON.stringify(seed)).not.toContain("must not be injected");
  });

  it("fills preferred gaps only from unique published products with images", () => {
    const input = [
      managed("replacement-a"),
      { ...managed("no-image"), images: [] },
      getFurnitureProduct(table)!,
      managed("replacement-a"),
      { ...managed("replacement-b"), images: [], sourceImages: ["/source-fallback.webp"] },
      managed("replacement-c"),
      managed("surplus"),
    ];
    const before = JSON.stringify(input);
    const cards = selectHomeFurniture(input, "en");
    expect(cards.map((card) => card.slug)).toEqual([table, "replacement-a", "replacement-b", "replacement-c"]);
    expect(cards[2].image).toBe("/source-fallback.webp");
    expect(cards[1].categoryKey).toBe("living");
    expect(JSON.stringify(cards)).not.toContain("PRIVATE-SKU");
    expect(JSON.stringify(cards)).not.toContain("Private body");
    expect(JSON.stringify(cards)).not.toContain("Private summary");
    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not refill hidden catalog products and supports published managed summaries", () => {
    const hidden = { items_zh: furnitureCatalog.products.map((product) => override(product.slug, false)) };
    expect(mapHomeFurnitureSeed([], hidden)).toEqual({ en: [], zh: [] });
    const row = {
      id: "managed", slug: "managed-chair", category: "furniture", subcategory: "dining", image_url: "/managed-chair.webp",
      title_en: "Managed chair", title_zh: "后台餐椅", excerpt_en: "", excerpt_zh: "", content_en: "Body", content_zh: "正文",
    } as FurnitureMaterialRow;
    const seed = mapHomeFurnitureSeed([row], hidden);
    expect(seed.en).toEqual([{ slug: "managed-chair", name: "Managed chair", image: "/managed-chair.webp", categoryKey: "dining" }]);
    expect(seed.zh).toEqual([{ slug: "managed-chair", name: "后台餐椅", image: "/managed-chair.webp", categoryKey: "dining" }]);
  });

  it.each(["en", "zh"] as const)("matches the current published reader in %s and forwards cancellation", async (language) => {
    const setting = { items_zh: [override(chair, false), override(dining, true)] };
    vi.mocked(fetchPublishedHomeSectionRow).mockResolvedValue(setting as never);
    const controller = new AbortController();
    expect(await getPublishedHomeFurniture(language, controller.signal)).toEqual(mapHomeFurnitureSeed([], setting)[language]);
    expect(fetchPublishedMaterialRowsByCategory).toHaveBeenCalledWith("furniture", controller.signal);
    expect(fetchPublishedHomeSectionRow).toHaveBeenCalledWith("furniture_catalog", controller.signal);
  });

  it("surfaces failed visibility reads instead of selecting an unverified static fallback", async () => {
    vi.mocked(fetchPublishedHomeSectionRow).mockRejectedValue(new Error("Visibility unavailable"));
    await expect(getPublishedHomeFurniture("en")).rejects.toThrow("Visibility unavailable");
  });
});
