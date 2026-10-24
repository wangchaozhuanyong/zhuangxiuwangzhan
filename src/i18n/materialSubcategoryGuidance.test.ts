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
  it.each(["en", "zh", "ms"] as const)("builds a useful %s checklist and internal-link path", (language) => {
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

  it.each([...categories, "future-category"])("keeps %s Malay guidance out of the English branch", (categorySlug) => {
    const guidance = getMaterialSubcategoryGuidance(categorySlug, "Bahan", "Kemasan", "ms");
    expect(guidance.checklistTitle).toBe("Perkara yang perlu disahkan sebelum memilih Kemasan");
    expect(guidance.relatedTitle).toBe("Rancang langkah seterusnya untuk Kemasan");
    const copy = [guidance.checklistDescription, ...guidance.checklist.flatMap(item => [item.title, item.description]),
      guidance.relatedDescription, ...guidance.relatedLinks.flatMap(item => [item.label, item.title, item.description])].join(" ");
    expect(copy).not.toMatch(/What to confirm|should not be selected|Record the room|Plan the next step|Related service|Project enquiry|Compare materials by/);
    expect(copy).not.toMatch(/[\u3400-\u9fff]/);
    expect(guidance.relatedLinks[1].title).toMatch(/Pengubahsuaian|Perancangan|Reka bentuk|Perkhidmatan|Skop/);
  });

  it("uses conservative fallback guidance for an unknown CMS category", () => {
    const guidance = getMaterialSubcategoryGuidance("future-category", "Future Materials", "Future Finish", "en");

    expect(guidance.checklistTitle).toContain("Future Finish");
    expect(guidance.relatedLinks[0].href).toBe("/materials/category/future-category");
    expect(guidance.relatedLinks[1].href).toBe("/services/renovation");
  });
});
