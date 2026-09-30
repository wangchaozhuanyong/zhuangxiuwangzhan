import { describe, expect, it } from "vitest";
import { isReviewedMaterialConceptImage, localMediaPath, resolveReviewedBlogCover, resolveReviewedImageSource, resolveReviewedMaterialImage, reviewedComparisonRoom, wardrobeCover } from "./reviewedContentMedia.mjs";

describe("reviewed content media", () => {
  it("corrects only the reviewed wardrobe article and legacy cover", () => {
    expect(resolveReviewedBlogCover("custom-wardrobe-price-malaysia", "/images/services/kitchen-renovation.webp")).toBe(wardrobeCover);
    expect(resolveReviewedBlogCover("another-article", "/images/services/kitchen-renovation.webp")).toBe("/images/services/kitchen-renovation.webp");
    expect(resolveReviewedBlogCover("custom-wardrobe-price-malaysia", "/images/new-cms-cover.webp")).toBe("/images/new-cms-cover.webp");
  });
  it("normalizes known storage paths without rewriting unrelated hosts", () => {
    expect(localMediaPath("https://example.supabase.co/storage/v1/render/image/public/site-images/materials/laminate-grey-stone.webp?width=600")).toBe("/images/materials/laminate-grey-stone.webp");
    expect(localMediaPath("https://supplier.example/materials/laminate-grey-stone.webp")).toBe("https://supplier.example/materials/laminate-grey-stone.webp");
  });
  it("gives flooring and countertop their own concept images", () => {
    const legacy = "/images/materials/laminate-grey-stone.webp";
    expect(resolveReviewedMaterialImage(legacy, "laminate-grey-stone")).toContain("grey-stone-floor.webp");
    expect(resolveReviewedMaterialImage(legacy, "sintered-stone-grey")).toContain("grey-stone-counter.webp");
    expect(resolveReviewedMaterialImage(legacy, "sintered-stone")).toContain("grey-stone-counter.webp");
    expect(resolveReviewedMaterialImage(legacy, "unknown-material")).toBe("");
  });
  it("preserves real furniture photos and future material uploads", () => {
    const furniture = "/images/furniture/assets/8fc6125492be2f99b8a2.webp";
    expect(resolveReviewedImageSource(furniture)).toBe(furniture);
    expect(resolveReviewedMaterialImage(furniture, "laminate-grey-stone")).toBe(furniture);
    expect(resolveReviewedMaterialImage("/images/materials/new-sample.webp", "laminate-grey-stone")).toBe("/images/materials/new-sample.webp");
  });
  it("labels the approved replacement palettes consistently", () => {
    for (const source of ["category-kitchen-cabinets", "kitchen-melamine-cabinets", "category-flooring", "spc-vinyl-natural-oak"]) {
      expect(isReviewedMaterialConceptImage(resolveReviewedMaterialImage(`/images/materials/${source}.webp`))).toBe(true);
    }
    expect(isReviewedMaterialConceptImage("/images/furniture/assets/8fc6125492be2f99b8a2.webp")).toBe(false);
  });
  it("keeps paired comparisons limited to the same reviewed room", () => {
    expect(reviewedComparisonRoom("/images/before-after/before-kitchen.webp", "/images/before-after/after-kitchen.webp")).toBe("kitchen");
    expect(reviewedComparisonRoom("/images/before-after/before-kitchen.webp", "/images/before-after/after-living.webp")).toBeUndefined();
  });
});
