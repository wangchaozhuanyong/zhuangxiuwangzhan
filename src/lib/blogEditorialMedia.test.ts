import { describe, expect, it } from "vitest";
import { findBlogConceptImage, getBlogEditorialMedia } from "./blogEditorialMedia";

describe("reviewed Blog media boundaries", () => {
  it.each([undefined, "other-article", "toString", "__proto__"])("does not opt unrelated slug %s into reviewed media", (slug) => {
    expect(getBlogEditorialMedia(slug)).toBeUndefined();
  });
  it("matches localized chapter headings but never guesses a similar topic", () => {
    expect(findBlogConceptImage("kitchen-cabinet-price-malaysia", "  Measure   the cabinet layout first  ", "en")?.id).toBe("kitchen-layout-measurement");
    expect(findBlogConceptImage("office-renovation-checklist-malaysia", "确认人数和工作方式", "zh")?.id).toBe("office-occupancy-layout");
    expect(findBlogConceptImage("office-renovation-checklist-malaysia", "Kitchen layout", "en")).toBeUndefined();
    expect(findBlogConceptImage("kitchen-cabinet-price-malaysia", "Confirm occupancy and work patterns", "en")).toBeUndefined();
  });
  it("keeps exact article-specific mobile sources outside generated responsive-image paths", () => {
    expect(getBlogEditorialMedia("kitchen-cabinet-price-malaysia")?.mobileHero).toMatch(/\/kitchen-cabinet-price-malaysia\/kitchen-cover-mobile-900.webp$/);
    expect(getBlogEditorialMedia("office-renovation-checklist-malaysia")?.mobileHero).toMatch(/\/office-renovation-checklist-malaysia\/office-cover-mobile-900.webp$/);
  });
});
