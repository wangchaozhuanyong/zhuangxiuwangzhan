import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPublishedMaterialBySlugAndCategory,
  fetchPublishedMaterialRowsByCategory,
  fetchPublishedHomeSectionRow,
} from "@/backend/modules/cms/repository/publicContentRepository";
import type { Database } from "@/lib/database.types";
import {
  furnitureCatalog,
  getFurnitureProduct,
  getManagedFurnitureProductsForCategory,
  getPublishedManagedFurnitureProductBySlug,
  getPublishedManagedFurnitureProducts,
  getPublishedFurnitureCatalog,
  getPublishedFurnitureProductBySlug,
  localizeFurnitureProduct,
} from "@/lib/furnitureCatalog";

vi.mock("@/backend/modules/cms/repository/publicContentRepository", () => ({
  fetchPublishedMaterialRowsByCategory: vi.fn(),
  fetchPublishedMaterialBySlugAndCategory: vi.fn(),
  fetchPublishedHomeSectionRow: vi.fn(),
}));

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

const managedRow = {
  id: "managed-1",
  slug: "test-furniture-chair",
  category: "furniture",
  subcategory: "dining",
  material_type: "dining-chair",
  title_zh: "测试餐椅",
  title_en: "Test dining chair",
  excerpt_zh: "中文简介",
  excerpt_en: "English summary",
  content_zh: "中文详情",
  content_en: "English description",
  image_url: "/chair-cover.webp",
  price_mode: "from",
  price_min: 180,
  price_max: null,
  price_currency: "MYR",
  price_unit: "unit",
  reference_price: null,
  seo_title_zh: "餐椅 SEO",
  seo_title_en: "Chair SEO",
  seo_description_zh: "餐椅搜索简介",
  seo_description_en: "Chair search summary",
} as unknown as MaterialRow;

describe("published admin furniture catalog", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchPublishedHomeSectionRow).mockResolvedValue(null); });

  it("maps published furniture into the selected category in both languages", async () => {
    vi.mocked(fetchPublishedMaterialRowsByCategory).mockResolvedValue([managedRow]);

    const chinese = await getPublishedManagedFurnitureProducts("zh");
    const english = await getPublishedManagedFurnitureProducts("en");

    expect(fetchPublishedMaterialRowsByCategory).toHaveBeenCalledWith("furniture", undefined);
    expect(chinese[0]).toMatchObject({ name: "测试餐椅", price: "RM 180 / 件起", seoTitle: "餐椅 SEO" });
    expect(english[0]).toMatchObject({ name: "Test dining chair", price: "From RM 180 / unit", seoTitle: "Chair SEO" });
    expect(getManagedFurnitureProductsForCategory(chinese, "dining", "dining-chair")).toHaveLength(1);
    expect(getManagedFurnitureProductsForCategory(chinese, "bedroom")).toHaveLength(0);
  });

  it("preserves static product URLs when an admin record has the same slug", async () => {
    const staticProduct = furnitureCatalog.products[0];
    vi.mocked(fetchPublishedMaterialRowsByCategory).mockResolvedValue([{ ...managedRow, slug: staticProduct.slug }]);

    expect(await getPublishedManagedFurnitureProducts("en")).toEqual([]);
    expect(getFurnitureProduct(staticProduct.slug)).toBe(staticProduct);
  });

  it("loads the published detail gallery for an admin product", async () => {
    vi.mocked(fetchPublishedMaterialBySlugAndCategory).mockResolvedValue({
      ...managedRow,
      material_images: [
        { image_url: "/chair-back.webp", sort_order: 2 },
        { image_url: "/chair-side.webp", sort_order: 1 },
      ],
    });

    const detail = await getPublishedManagedFurnitureProductBySlug(managedRow.slug, "zh");

    expect(fetchPublishedMaterialBySlugAndCategory).toHaveBeenCalledWith(managedRow.slug, "furniture", undefined);
    expect(detail?.images).toEqual(["/chair-cover.webp", "/chair-side.webp", "/chair-back.webp"]);
  });

  it("shares bilingual edits, prices and images between the catalog and product detail", async () => {
    const baseline = furnitureCatalog.products[0];
    const override = { slug: baseline.slug, enabled: true, name_zh: "修改后家具", name_en: "Updated furniture", shortDescription_zh: "修改后简介", shortDescription_en: "Updated summary", description_zh: "修改后详情", description_en: "Updated detail", price: "RM475.00 – RM495.00", images: ["/updated.webp"] };
    vi.mocked(fetchPublishedMaterialRowsByCategory).mockResolvedValue([]);
    vi.mocked(fetchPublishedHomeSectionRow).mockResolvedValue({ items_zh: [override] } as never);
    for (const language of ["zh", "en"] as const) {
      const listing = (await getPublishedFurnitureCatalog(language)).find((item) => item.slug === baseline.slug);
      const detail = await getPublishedFurnitureProductBySlug(baseline.slug, language);
      expect(detail).toEqual(listing);
      expect(localizeFurnitureProduct(detail!, language).name).toBe(language === "zh" ? "修改后家具" : "Updated furniture");
      expect(detail?.price).toBe("RM475.00 – RM495.00");
      expect(detail?.images).toEqual(["/updated.webp"]);
    }
    override.enabled = false;
    expect((await getPublishedFurnitureCatalog("zh")).some((item) => item.slug === baseline.slug)).toBe(false);
    expect(await getPublishedFurnitureProductBySlug(baseline.slug, "en")).toBeNull();
    expect(getFurnitureProduct(baseline.slug)).toBe(baseline);
  });

  it("does not treat failed visibility reads as successful original content", async () => {
    vi.mocked(fetchPublishedHomeSectionRow).mockRejectedValue(new Error("Unavailable"));
    await expect(getPublishedFurnitureProductBySlug(furnitureCatalog.products[0].slug, "zh")).rejects.toThrow("Unavailable");
  });
});
