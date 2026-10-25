import { describe, expect, it, vi } from "vitest";
import { getPublishedMaterialBySlug, mapPublishedMaterialRows } from "./contentApi";
import { fetchPublishedMaterialRowBySlug, fetchPublishedMaterialRows, fetchPublishedMaterialRowsByCategory } from "@/backend/modules/cms/repository/publicContentRepository";

vi.mock("@/backend/modules/cms/repository/publicContentRepository", async original => ({
  ...await original<typeof import("@/backend/modules/cms/repository/publicContentRepository")>(),
  hasPublicContentDatabaseClient: () => true,
  fetchPublishedMaterialRowBySlug: vi.fn(), fetchPublishedMaterialRows: vi.fn(), fetchPublishedMaterialRowsByCategory: vi.fn(),
}));

describe("material detail request scope", () => {
  it("reads only the current category while preserving the existing displayed object", async () => {
    const row = { id: "one", slug: "oak", category: "Flooring", subcategory: "SPC", title_en: "Oak", content_en: "Full original body", image_url: "cover", price_mode: "reference" };
    const gallery = [{ id: "photo", image_url: "gallery", sort_order: 0 }];
    vi.mocked(fetchPublishedMaterialRowBySlug).mockResolvedValue({ ...row, material_images: gallery } as never);
    vi.mocked(fetchPublishedMaterialRowsByCategory).mockResolvedValue([row] as never);
    const result = await getPublishedMaterialBySlug("oak", "en");
    expect(fetchPublishedMaterialRows).not.toHaveBeenCalled();
    expect(fetchPublishedMaterialRowsByCategory).toHaveBeenCalledWith("Flooring", undefined, true);
    expect(result.category).toEqual(mapPublishedMaterialRows([row], "en")[0]);
    expect(result.material?.gallery).toHaveLength(1);
    expect(result.category?.items[0].gallery).toEqual([]);
    expect(result.category?.items[0].description).toBe("Full original body");
  });
});
