import { describe, expect, it } from "vitest";
import { materialMalayTerms, materialTerminologyIssues, reviewedMaterialMalayTerm, reviewedMaterialMalayText } from "../../supabase/functions/_shared/material-terminology.mjs";
import { translateDisplayText, translateMaterialCategory, translateMaterialColor, translateMaterialTexture, translateMaterialType } from "./displayLabels";
import { localizeMalayContent } from "./malayContent";
import { materialDetailPageText } from "./materialDetailPageText";

describe("reviewed material terminology", () => {
  it.each([
    ["Tempered", "Terbaja"], ["Whole House Custom", "Tempahan Khas Seluruh Rumah"],
    ["Smooth", "Licin"], ["Timber", "Kayu"], ["Marble Look", "Corak Marmar"],
    ["Herringbone", "Corak Tulang Ikan"], ["Sliding Barn", "Pintu Gelangsar Gaya Bangsal"],
    ["Lime Wash", "Kemasan Sapuan Kapur"], ["Walnut", "Walnut"], ["Ash Grey", "Kelabu Abu"],
  ])("keeps the material meaning of %s through both fallback passes", (source, expected) => {
    expect(translateDisplayText(source, "ms")).toBe(expected);
    expect(translateDisplayText(localizeMalayContent(source), "ms")).toBe(expected);
    expect(translateDisplayText(source, "en")).toBe(source);
  });

  it("uses the field meaning, handles source formatting, and does not guess unknown terms", () => {
    expect(translateMaterialTexture(" TEMPERED ", "ms")).toBe("Terbaja");
    expect(translateMaterialCategory("whole-house-custom", "ms")).toBe("Tempahan Khas Seluruh Rumah");
    expect(translateMaterialColor("Ash Grey", "ms")).toBe("Kelabu Abu");
    for (const render of [translateMaterialType, translateMaterialTexture, translateMaterialColor]) {
      expect(render("Unreviewed new specification", "ms")).toBe(materialDetailPageText.ms.specificationPending);
    }
    expect(translateMaterialTexture("Tempered", "zh")).toBe("钢化");
    expect(translateMaterialTexture("Smooth", "zh")).toBe("光滑");
    expect(translateMaterialType("Timber", "en")).toBe("Timber");
  });

  it("does not translate fragments inside prose or mutate stable data", () => {
    const text = "Tempered glass should be confirmed against the approved specification.";
    expect(reviewedMaterialMalayText(text)).toBeUndefined();
    const source = { slug: "Tempered", type: "Timber", texture: "Tempered", href: "/en/materials/Tempered" };
    expect(localizeMalayContent(source)).toEqual({ ...source, texture: "Terbaja" });
    expect(source.texture).toBe("Tempered");
  });

  it("keeps every reviewed term idempotent through the fallback path", () => {
    for (const [field, terms] of Object.entries(materialMalayTerms)) for (const [source, target] of Object.entries(terms)) {
      expect(reviewedMaterialMalayTerm(field as keyof typeof materialMalayTerms, source)).toBe(target);
      expect(reviewedMaterialMalayTerm(field as keyof typeof materialMalayTerms, target)).toBe(target);
    }
  });

  it("returns actionable unknown fields and preserves the separate furniture catalog", () => {
    expect(materialTerminologyIssues({ category: "Flooring", material_type: "New composite", color: "", texture: null }))
      .toEqual([{ field: "material_type", value: "New composite" }]);
    expect(materialTerminologyIssues({ category: "furniture", material_type: "Supplier-specific furniture" })).toEqual([]);
  });
});
