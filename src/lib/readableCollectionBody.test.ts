import { describe, expect, it } from "vitest";
import { buildReadableCollectionBody, buildReadablePublicBody } from "../../functions/readablePublicBody";

const material = { status: "published", slug: "reviewed-panel", category: "whole-house-custom", subcategory: "solid-wood-finish", title_en: "Reviewed panel", title_zh: "已审核饰面", excerpt_en: "Published material summary", excerpt_zh: "已发布材料说明" };

describe("reviewed public collection fallback", () => {
  it("uses published English service rows and omits draft rows and unsafe slugs", () => {
    const body = buildReadableCollectionBody("/en/services", { services: [
      { status: "published", slug: "design", title_en: "Interior design", excerpt_en: "Published design scope" },
      { status: "draft", slug: "draft-service", title_en: "Unpublished service" },
      { status: "published", slug: "../admin", title_en: "Unsafe path" },
    ] });
    expect(body).toContain('/en/services/design');
    expect(body).toContain("Published design scope");
    expect(body).not.toContain("Unpublished service");
    expect(body).not.toContain("Unsafe path");
  });

  it.each(["en", "zh"] as const)("builds the reviewed material pages from the selected %s source", lang => {
    for (const suffix of ["", "/solid-wood-finish"]) {
      const body = buildReadableCollectionBody(`/${lang}/materials/category/whole-house-custom${suffix}`, { materials: [material] });
      expect(body).toContain(`/${lang}/materials/reviewed-panel`);
      expect(body).toContain(lang === "en" ? "Reviewed panel" : "已审核饰面");
      expect(body).toContain(lang === "en" ? "Published material summary" : "已发布材料说明");
      expect(body).not.toContain(lang === "en" ? "已审核饰面" : "Reviewed panel");
    }
  });

  it("preserves the bounded route and published-source requirements", () => {
    for (const path of ["/zh/services", "/en/materials", "/en/materials/category/flooring", "/en/admin"]) {
      expect(buildReadableCollectionBody(path, { materials: [material] })).toBe("");
    }
    expect(buildReadableCollectionBody("/en/services", { services: [{ status: "draft", slug: "design", title_en: "Draft" }] })).toBe("");
    expect(buildReadableCollectionBody("/en/materials/category/whole-house-custom", { materials: [{ ...material, status: "draft" }] })).toBe("");
  });

  it("escapes collection fields and sanitizes the reviewed office body", () => {
    const body = buildReadableCollectionBody("/en/services", { services: [{ status: "published", slug: "design", title_en: '<img src=x onerror="attack">Design', excerpt_en: "<script>attack</script>Visible" }] });
    expect(body).not.toContain("<img");
    expect(body).not.toContain("<script");
    const office = buildReadablePublicBody("/en/services/office-renovation", { status: "published", slug: "office-renovation", title_en: "Office renovation", content_en: '<p>Published office scope</p><script>attack</script>' });
    expect(office).toContain("Published office scope");
    expect(office).not.toContain("<script");
    expect(office).not.toContain("attack");
  });
});
