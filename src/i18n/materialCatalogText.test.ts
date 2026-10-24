import { describe, expect, it } from "vitest";
import { materialsData } from "@/data/materials";
import { materialCatalogText } from "./materialCatalogText";
import { translateDisplayText } from "./displayLabels";

const descriptions = materialsData.flatMap((category) => [category, ...category.subcategories]);

describe("complete material fallback descriptions", () => {
  it("covers every category and subcategory, with no stale source keys", () => {
    expect(materialsData).toHaveLength(9);
    expect(descriptions).toHaveLength(52);
    expect(Object.values(materialCatalogText.en).sort()).toEqual(descriptions.map((item) => item.description).sort());
    for (const language of ["zh", "ms"] as const) {
      expect(Object.keys(materialCatalogText[language]).sort()).toEqual(Object.keys(materialCatalogText.en).sort());
    }
  });

  it.each(descriptions.map((item) => [item.slug, item.description]))("localizes %s as whole prose and keeps its English source", (_slug, source) => {
    const original = source;
    const zh = translateDisplayText(source, "zh");
    const ms = translateDisplayText(source, "ms");
    expect(zh).toMatch(/[\u3400-\u9fff]/);
    expect(zh).not.toMatch(/[A-Za-z]/);
    expect(ms).not.toMatch(/[\u3400-\u9fff]/);
    expect(ms).not.toBe(source);
    expect(ms.length).toBeGreaterThan(15);
    expect(translateDisplayText(source, "en")).toBe(original);
    expect(translateDisplayText(zh, "zh")).toBe(zh);
    expect(source).toBe(original);
  });

  it("matches the complete fallback sentence despite surrounding whitespace or case", () => {
    const source = "Thin, premium slabs for feature counters, splashbacks, and wall surfaces.";
    expect(translateDisplayText(`  ${source.toUpperCase()}  `, "zh"))
      .toBe("轻薄的大规格瓷质板材，可用于台面、防溅挡板和墙面饰面。");
    expect(translateDisplayText(`${source} Additional unreviewed CMS information.`, "zh"))
      .toBe(`${source} Additional unreviewed CMS information.`);
  });
});
