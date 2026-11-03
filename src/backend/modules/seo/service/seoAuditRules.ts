import type { AdminSeoAuditRow } from "./seoAuditService";

export type AdminSeoIssueCategory = "zh" | "geo" | "ai" | "technical" | "en";
export type AdminSeoIssueSeverity = "missing" | "suggestion" | "error";
export type AdminSeoIssueKey =
  | "missingZhTitle" | "zhTitleNoChinese" | "zhTitleTooLong"
  | "missingZhDescription" | "zhDescriptionNoChinese" | "zhDescriptionTooShort"
  | "missingZhKeywords" | "missingGeoTerms" | "zhDescriptionWeakAi"
  | "missingImageAltZh" | "missingSlug" | "duplicateSlug"
  | "missingEnTitle" | "enTitleTooLong" | "missingEnDescription" | "enDescriptionTooShort";

export type AdminSeoAuditIssue = {
  key: AdminSeoIssueKey;
  category: AdminSeoIssueCategory;
  severity: AdminSeoIssueSeverity;
};

export type CheckedAdminSeoRow<T extends AdminSeoAuditRow = AdminSeoAuditRow> = T & { issues: AdminSeoAuditIssue[] };

export const adminSeoPageTables = new Set(["site_pages", "cms_pages"]);
const geoRequiredTables = new Set(["site_pages", "cms_pages", "services", "service_areas", "landing_pages"]);
const geoTerms = ["吉隆坡", "雪兰莪", "巴生谷", "马来西亚", "Kuala Lumpur", "Selangor", "Klang Valley", "KL"];
const readText = (row: AdminSeoAuditRow, key: string) => String(row[key] || "").trim();
const hasChinese = (value: string) => /[\u4e00-\u9fff]/.test(value);

export function buildAdminSeoIssues(row: AdminSeoAuditRow): AdminSeoAuditIssue[] {
  // An unread source is not a content record and must never become field alerts.
  if (row.error || row.status === "error") return [];
  const issues: AdminSeoAuditIssue[] = [];
  const add = (key: AdminSeoIssueKey, category: AdminSeoIssueCategory, severity: AdminSeoIssueSeverity) =>
    issues.push({ key, category, severity });
  const zhTitle = readText(row, "seo_title_zh");
  const zhDescription = readText(row, "seo_description_zh");
  const zhKeywords = readText(row, "seo_keywords_zh");
  const enTitle = readText(row, "seo_title_en");
  const enDescription = readText(row, "seo_description_en");
  const geoText = [zhTitle, zhDescription, zhKeywords, readText(row, "title_zh"), readText(row, "path"), readText(row, "slug")].join(" ").toLowerCase();
  const image = readText(row, "image_url") || readText(row, "cover_image_url") || readText(row, "hero_image_url");

  if (!zhTitle) add("missingZhTitle", "zh", "missing");
  if (zhTitle && !hasChinese(zhTitle)) add("zhTitleNoChinese", "zh", "error");
  if (zhTitle.length > 40) add("zhTitleTooLong", "zh", "suggestion");
  if (!zhDescription) add("missingZhDescription", "zh", "missing");
  if (zhDescription && !hasChinese(zhDescription)) add("zhDescriptionNoChinese", "zh", "error");
  if (zhDescription && zhDescription.length < 55) add("zhDescriptionTooShort", "zh", "suggestion");
  if (adminSeoPageTables.has(row.table) && !zhKeywords) add("missingZhKeywords", "zh", "suggestion");
  if (geoRequiredTables.has(row.table) && !geoTerms.some((term) => geoText.includes(term.toLowerCase()))) {
    add("missingGeoTerms", "geo", "suggestion");
  }
  if (zhDescription && !/[，。、；：,.]/.test(zhDescription)) add("zhDescriptionWeakAi", "ai", "suggestion");
  if (image && Object.prototype.hasOwnProperty.call(row, "alt_zh") && !readText(row, "alt_zh")) {
    add("missingImageAltZh", "ai", "missing");
  }
  if (!adminSeoPageTables.has(row.table) && !row.slug) add("missingSlug", "technical", "missing");
  if (!enTitle) add("missingEnTitle", "en", "missing");
  if (enTitle.length > 70) add("enTitleTooLong", "en", "suggestion");
  if (!enDescription) add("missingEnDescription", "en", "missing");
  if (enDescription && enDescription.length < 80) add("enDescriptionTooShort", "en", "suggestion");
  return issues;
}

export function checkAdminSeoRows<T extends AdminSeoAuditRow>(rows: T[]): CheckedAdminSeoRow<T>[] {
  const records = rows.filter((row) => !row.error && row.status !== "error");
  const slugs = new Map<string, number>();
  // Duplicate checks apply to the selected scope, so archived history cannot
  // make a current record look like a conflicting public entry.
  for (const row of records) {
    if (row.slug) {
      const key = `${row.table}:${row.slug}`;
      slugs.set(key, (slugs.get(key) || 0) + 1);
    }
  }
  return records.map((row) => {
    const issues = buildAdminSeoIssues(row);
    if (row.slug && (slugs.get(`${row.table}:${row.slug}`) || 0) > 1) {
      issues.push({ key: "duplicateSlug", category: "technical", severity: "error" });
    }
    return { ...row, issues };
  });
}
