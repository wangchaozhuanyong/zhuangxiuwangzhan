import { describe, expect, it } from "vitest";
import { getMaterialSubcategoryGuidance } from "@/i18n/materialSubcategoryGuidance";

const categories = [
  "kitchen-cabinets",
  "whole-house-custom",
  "furniture",
  "bathroom",
  "countertops-stone-surfaces",
  "flooring",
  "doors-windows",
  "wall-panels",
  "art-paint",
] as const;

describe("material subcategory guidance", () => {
  it.each(["en", "zh"] as const)("builds a useful %s checklist and internal-link path", (language) => {
    for (const categorySlug of categories) {
      const guidance = getMaterialSubcategoryGuidance(
        categorySlug,
        language === "zh" ? "材料分类" : "Material Category",
        language === "zh" ? "材料子分类" : "Material Subcategory",
        language,
      );

      expect(guidance.checklist).toHaveLength(3);
      const minimumDescriptionLength = language === "zh" ? 45 : 70;
      expect(guidance.checklist.every((item) => item.description.length >= minimumDescriptionLength)).toBe(true);
      expect(guidance.relatedLinks).toHaveLength(4);
      expect(guidance.relatedLinks.map((item) => item.id)).toEqual([
        "parent-category",
        "related-service",
        "planning-guide",
        "project-enquiry",
      ]);
      expect(guidance.relatedLinks.every((item) => item.href.startsWith("/"))).toBe(true);
      expect(guidance.relatedLinks.some((item) => item.href === `/materials/category/${categorySlug}`)).toBe(true);
    }
  });

  it("uses conservative fallback guidance for an unknown CMS category", () => {
    const guidance = getMaterialSubcategoryGuidance("future-category", "Future Materials", "Future Finish", "en");

    expect(guidance.checklistTitle).toContain("Future Finish");
    expect(guidance.relatedLinks[0].href).toBe("/materials/category/future-category");
    expect(guidance.relatedLinks[1].href).toBe("/services/renovation");
  });
});
