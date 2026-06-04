import { describe, expect, it } from "vitest";
import { mergeMaterialCategoriesWithFallback, type MaterialCatalogCategory } from "@/lib/materialCatalog";

describe("mergeMaterialCategoriesWithFallback", () => {
  it("keeps fallback subcategories and items when published content only contains one material", () => {
    const publishedCategory: MaterialCatalogCategory = {
      name: "Flooring",
      slug: "flooring",
      description: "Published flooring description",
      image: "/published-flooring.webp",
      subcategories: [
        {
          name: "SPC Vinyl",
          slug: "spc-vinyl",
          description: "Published SPC description",
          image: "/published-spc.webp",
        },
      ],
      items: [
        {
          id: "published-spc",
          name: "Published SPC",
          slug: "spc-flooring-natural-oak",
          category: "Flooring",
          subcategory: "spc-vinyl",
          type: "SPC Vinyl",
          color: "Natural Oak",
          texture: "Wood Grain",
          suitableSpaces: ["Living Room"],
          recommendedPairing: "Published pairing",
          description: "Published material description",
          note: "Published note",
          image: "/published-material.webp",
        },
      ],
    };

    const [flooring] = mergeMaterialCategoriesWithFallback([publishedCategory]).filter((category) => category.slug === "flooring");

    expect(flooring?.description).toBe("Published flooring description");
    expect(flooring?.subcategories.some((subcategory) => subcategory.slug === "laminate")).toBe(true);
    expect(flooring?.items.some((item) => item.slug === "laminate-grey-stone")).toBe(true);
    expect(flooring?.items.find((item) => item.slug === "spc-flooring-natural-oak")?.description).toBe("Published material description");
  });

  it("returns the local fallback catalog when no published categories are available", () => {
    const categories = mergeMaterialCategoriesWithFallback(undefined);

    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((category) => category.slug === "flooring")).toBe(true);
  });
});
