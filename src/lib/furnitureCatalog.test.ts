import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPublishedMaterialBySlugAndCategory,
  fetchPublishedMaterialRowsByCategory,
} from "@/backend/modules/cms/repository/publicContentRepository";
import type { Database } from "@/lib/database.types";
import {
  furnitureCatalog,
  getFurnitureProduct,
  getManagedFurnitureProductsForCategory,
  getPublishedManagedFurnitureProductBySlug,
  getPublishedManagedFurnitureProducts,
} from "@/lib/furnitureCatalog";

vi.mock("@/backend/modules/cms/repository/publicContentRepository", () => ({
  fetchPublishedMaterialRowsByCategory: vi.fn(),
  fetchPublishedMaterialBySlugAndCategory: vi.fn(),
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
  beforeEach(() => vi.clearAllMocks());

  it("maps published furniture into the selected category in both languages", async () => {
    vi.mocked(fetchPublishedMaterialRowsByCategory).mockResolvedValue([managedRow]);

    const chinese = await getPublishedManagedFurnitureProducts("zh");
    const english = await getPublishedManagedFurnitureProducts("en");

    expect(fetchPublishedMaterialRowsByCategory).toHaveBeenCalledWith("furniture");
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

    expect(fetchPublishedMaterialBySlugAndCategory).toHaveBeenCalledWith(managedRow.slug, "furniture");
    expect(detail?.images).toEqual(["/chair-cover.webp", "/chair-side.webp", "/chair-back.webp"]);
  });
});
