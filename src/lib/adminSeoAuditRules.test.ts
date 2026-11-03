import { describe, expect, it } from "vitest";
import { buildAdminSeoIssues, checkAdminSeoRows, type AdminSeoAuditRow } from "@/lib/adminSeoAudit";
import { adminSeoSources } from "@/backend/modules/seo/service/seoAuditService";
import { matchesAdminAuditScope, resolveAdminAuditScope } from "@/lib/adminAuditScope";

const record = (overrides: Partial<AdminSeoAuditRow> = {}): AdminSeoAuditRow => ({
  id: "published-service",
  table: "services",
  source: { ...adminSeoSources[2], label: "服务项目" },
  status: "published",
  slug: "kitchen",
  title_zh: "吉隆坡厨房装修",
  seo_title_zh: "吉隆坡厨房装修",
  seo_description_zh: "服务吉隆坡与雪兰莪的厨房装修，结合空间布局、收纳需求与材料选择安排施工。报价需要根据现场情况、尺寸、材料与审批条件确认。",
  seo_title_en: "Kitchen Renovation Kuala Lumpur",
  seo_description_en: "Kitchen renovation in Kuala Lumpur and Selangor, with layout planning, material selection and quotations based on the site conditions.",
  ...overrides,
});

describe("SEO audit issue classification", () => {
  it("keeps length and optional keyword prompts out of missing fields", () => {
    const issues = buildAdminSeoIssues(record({
      table: "site_pages", path: "/services", seo_keywords_zh: null,
      seo_title_en: "A".repeat(71), seo_description_zh: "吉隆坡厨房装修，按现场条件报价。",
    }));
    expect(issues.map((issue) => issue.key)).toEqual(expect.arrayContaining(["enTitleTooLong", "zhDescriptionTooShort", "missingZhKeywords"]));
    expect(issues.every((issue) => issue.severity === "suggestion")).toBe(true);
  });

  it("still reports real missing metadata, links and image descriptions", () => {
    const issues = buildAdminSeoIssues(record({
      seo_title_zh: "  ", seo_description_en: null, slug: "",
      image_url: "/fixture.webp", alt_zh: null,
    }));
    expect(issues.filter((issue) => issue.severity === "missing").map((issue) => issue.key)).toEqual([
      "missingZhTitle", "missingImageAltZh", "missingSlug", "missingEnDescription",
    ]);
  });

  it("treats region and punctuation heuristics as manual suggestions", () => {
    const issues = buildAdminSeoIssues(record({
      title_zh: "怡保厨房装修", seo_title_zh: "怡保厨房装修", slug: "ipoh-kitchen",
      seo_description_zh: "怡保厨房装修根据现场情况确认",
    }));
    expect(issues.find((issue) => issue.key === "missingGeoTerms")?.severity).toBe("suggestion");
    expect(issues.find((issue) => issue.key === "zhDescriptionWeakAi")?.severity).toBe("suggestion");
  });

  it("does not count unread source placeholders as records or missing fields", () => {
    const failed = record({ id: undefined, error: "private backend failure", status: undefined, seo_title_zh: undefined });
    expect(buildAdminSeoIssues(failed)).toEqual([]);
    expect(checkAdminSeoRows([failed])).toEqual([]);
  });

  it("checks duplicates within the chosen scope without archived false conflicts", () => {
    const rows = [record(), record({ id: "old-service", status: "archived" })];
    const active = rows.filter((row) => matchesAdminAuditScope(row.status, resolveAdminAuditScope("all")));
    expect(checkAdminSeoRows(active)[0].issues).toEqual([]);
    expect(checkAdminSeoRows(rows).every((row) => row.issues.some((issue) => issue.key === "duplicateSlug"))).toBe(true);
    expect(resolveAdminAuditScope("all_records")).toBe("all_records");
    expect(matchesAdminAuditScope("archived", "all_records")).toBe(true);
    expect(matchesAdminAuditScope("error", "all_records")).toBe(false);
  });

  it("keeps language mismatches distinct from missing or suggested copy", () => {
    const issues = buildAdminSeoIssues(record({ seo_title_zh: "English words only" }));
    expect(issues.find((issue) => issue.key === "zhTitleNoChinese")?.severity).toBe("error");
    expect(issues.some((issue) => issue.key === "missingZhTitle")).toBe(false);
  });
});
