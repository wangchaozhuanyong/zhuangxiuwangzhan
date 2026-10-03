import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { useCallback } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import {
  adminContentHealthCoreText,
  adminContentHealthFieldLabels,
  adminContentHealthSourceLabels,
} from "@/i18n/adminContentHealthText";
import { fetchAdminContentHealthRows } from "@/backend/modules/cms/repository/contentHealthRepository";
import { getAdminLang, useAdminLang, type AdminLang } from "@/lib/adminLocale";
import { adminQueriesEnabled } from "@/lib/adminQueryCore";

const enabled = adminQueriesEnabled;
const ADMIN_HEAVY_STALE_TIME = 10 * 60 * 1000;
const ADMIN_QUERY_GC_TIME = 30 * 60 * 1000;

const isBlankAdminValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
};

type HealthSource = {
  table: string;
  editBase: string;
  frontBase?: string;
  titleFields: string[];
  requiredFields: string[];
  englishFields: string[];
  seoFields: string[];
  imageFields: string[];
};

type HealthSourceRows = {
  source: HealthSource;
  rows: Array<Record<string, unknown>> | null;
};

const healthSources: HealthSource[] = [
  {
    table: "services",
    editBase: "/admin/services",
    frontBase: "/services",
    titleFields: ["title_zh", "title_en", "slug"],
    requiredFields: [
      "title_zh",
      "excerpt_zh",
      "content_zh",
      "alt_zh",
      "suitable_for_zh",
      "common_projects_zh",
      "scope_items_zh",
      "process_steps_zh",
      "faqs_zh",
      "slug",
      "status",
    ],
    englishFields: [
      "title_en",
      "excerpt_en",
      "content_en",
      "alt_en",
      "suitable_for_en",
      "common_projects_en",
      "scope_items_en",
      "process_steps_en",
      "faqs_en",
    ],
    seoFields: ["seo_title_zh", "seo_description_zh", "seo_title_en", "seo_description_en"],
    imageFields: ["image_url"],
  },
  {
    table: "projects",
    editBase: "/admin/projects",
    frontBase: "/projects",
    titleFields: ["title_zh", "title_en", "slug"],
    requiredFields: ["title_zh", "slug", "status"],
    englishFields: ["title_en", "excerpt_en", "content_en", "client_need_en"],
    seoFields: ["seo_title_zh", "seo_description_zh", "seo_title_en", "seo_description_en"],
    imageFields: ["image_url"],
  },
  {
    table: "materials",
    editBase: "/admin/materials",
    frontBase: "/materials",
    titleFields: ["title_zh", "title_en", "slug"],
    requiredFields: ["title_zh", "slug", "status"],
    englishFields: ["title_en", "excerpt_en", "content_en"],
    seoFields: ["seo_title_zh", "seo_description_zh", "seo_title_en", "seo_description_en"],
    imageFields: ["image_url"],
  },
  {
    table: "blog_posts",
    editBase: "/admin/blog",
    frontBase: "/blog",
    titleFields: ["title_zh", "title_en", "slug"],
    requiredFields: ["title_zh", "slug", "status"],
    englishFields: ["title_en", "excerpt_en", "content_en"],
    seoFields: ["seo_title_zh", "seo_description_zh", "seo_title_en", "seo_description_en"],
    imageFields: ["cover_image_url"],
  },
  {
    table: "site_pages",
    editBase: "/admin/pages",
    titleFields: ["title_zh", "title_en", "page_key", "path"],
    requiredFields: ["page_key", "status"],
    englishFields: ["title_en", "description_en", "content_en"],
    seoFields: ["seo_title_zh", "seo_description_zh", "seo_title_en", "seo_description_en"],
    imageFields: ["image_url"],
  },
  {
    table: "home_sections",
    editBase: "/admin/home",
    titleFields: ["title_zh", "title_en", "section_key"],
    requiredFields: ["section_key", "status"],
    englishFields: ["title_en", "subtitle_en", "content_en", "items_en"],
    seoFields: [],
    imageFields: ["image_url"],
  },
  {
    table: "about_sections",
    editBase: "/admin/about",
    titleFields: ["title_zh", "title_en", "section_key"],
    requiredFields: ["section_key", "status"],
    englishFields: ["title_en", "subtitle_en", "content_en", "items_en"],
    seoFields: [],
    imageFields: ["image_url"],
  },
  {
    table: "faqs",
    editBase: "/admin/faqs",
    titleFields: ["question_zh", "question_en", "page_key"],
    requiredFields: ["question_zh", "answer_zh", "page_key", "status"],
    englishFields: ["question_en", "answer_en"],
    seoFields: [],
    imageFields: [],
  },
  {
    table: "cta_blocks",
    editBase: "/admin/home",
    titleFields: ["title_zh", "title_en", "block_key"],
    requiredFields: ["block_key", "status"],
    englishFields: ["title_en", "description_en", "primary_label_en", "secondary_label_en"],
    seoFields: [],
    imageFields: ["image_url"],
  },
  {
    table: "cms_pages",
    editBase: "/admin/cms",
    titleFields: ["title_zh", "title_en", "page_key", "path"],
    requiredFields: ["page_key", "path", "status"],
    englishFields: ["title_en", "seo_title_en", "seo_description_en"],
    seoFields: ["seo_title_zh", "seo_description_zh", "seo_title_en", "seo_description_en"],
    imageFields: [],
  },
];

const healthSelectFields = (source: HealthSource) => {
  const sharedFields = ["id", "status", "updated_at", "created_at"];
  const fields = new Set([
    ...sharedFields,
    ...source.titleFields,
    ...source.requiredFields,
    ...source.englishFields,
    ...source.seoFields,
    ...source.imageFields,
  ]);
  if (source.frontBase) fields.add("slug");
  if (source.table === "site_pages" || source.table === "cms_pages") fields.add("path");
  return Array.from(fields).join(",");
};

const formatAdminContentHealthText = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

const getAdminContentHealthSourceLabel = (table: string, language: AdminLang) => {
  const labels = adminContentHealthSourceLabels[language] as Record<string, string>;
  return labels[table] || table;
};

const getLocalizedAdminHealthFieldLabel = (field: string, language: AdminLang) =>
  (adminContentHealthFieldLabels[language] as Record<string, string>)[field] ||
  field
    .replace(/_zh$/, adminContentHealthCoreText[language].chineseSuffix)
    .replace(/_en$/, adminContentHealthCoreText[language].englishSuffix)
    .replace(/_/g, " ");

export const getAdminHealthFieldLabel = (field: string) =>
  getLocalizedAdminHealthFieldLabel(field, getAdminLang());

const formatHealthIssue = (type: string, field: string, language: AdminLang) =>
  `${type}${adminContentHealthCoreText[language].issueSeparator}${getLocalizedAdminHealthFieldLabel(field, language)}`;

export type AdminContentHealthItem = {
  id: string;
  table: string;
  tableLabel: string;
  title: string;
  status: string;
  updated_at: string | null;
  editHref: string;
  frontHref: string | null;
  missingRequired: string[];
  missingEnglish: string[];
  missingSeo: string[];
  missingMedia: string[];
  issues: string[];
};

const buildEditHref = (source: HealthSource, row: Record<string, unknown>) => {
  const id = String(row.id || "");
  if (
    source.table === "site_pages" ||
    source.table === "home_sections" ||
    source.table === "about_sections" ||
    source.table === "faqs" ||
    source.table === "cta_blocks" ||
    source.table === "cms_pages"
  ) {
    return source.editBase;
  }
  return id ? `${source.editBase}/${id}` : source.editBase;
};

const buildFrontHref = (source: HealthSource, row: Record<string, unknown>) => {
  if (source.table === "site_pages") return String(row.path || "");
  if (!source.frontBase) return null;
  const slug = String(row.slug || "");
  return slug ? `${source.frontBase}/${slug}` : source.frontBase;
};

const buildHealthItem = (source: HealthSource, row: Record<string, unknown>, language: AdminLang): AdminContentHealthItem => {
  const text = adminContentHealthCoreText[language];
  const title = source.titleFields.map((field) => row[field]).find((value) => !isBlankAdminValue(value));
  const missingRequired = source.requiredFields.filter((field) => isBlankAdminValue(row[field]));
  const missingEnglish = source.englishFields.filter((field) => isBlankAdminValue(row[field]));
  const missingSeo = source.seoFields.filter((field) => isBlankAdminValue(row[field]));
  const missingMedia =
    source.imageFields.length > 0 && source.imageFields.every((field) => isBlankAdminValue(row[field]))
      ? source.imageFields
      : [];
  const issues = [
    ...missingRequired.map((field) => formatHealthIssue(text.requiredMissing, field, language)),
    ...missingEnglish.map((field) => formatHealthIssue(text.englishMissing, field, language)),
    ...missingSeo.map((field) => formatHealthIssue(text.seoMissing, field, language)),
    ...missingMedia.map((field) => formatHealthIssue(text.imageMissing, field, language)),
  ];

  return {
    id: String(row.id || `${source.table}-${String(title || "row")}`),
    table: source.table,
    tableLabel: getAdminContentHealthSourceLabel(source.table, language),
    title: String(title || text.unnamedContent),
    status: String(row.status || "draft"),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    editHref: buildEditHref(source, row),
    frontHref: buildFrontHref(source, row),
    missingRequired,
    missingEnglish,
    missingSeo,
    missingMedia,
    issues,
  };
};

export function useAdminContentHealth(options: { enabled?: boolean } = {}) {
  const language = useAdminLang();
  const select = useCallback((results: HealthSourceRows[]): AdminContentHealthItem[] =>
    results.flatMap(({ source, rows }) => rows
      ? rows.map((row) => buildHealthItem(source, row, language))
      : [buildHealthItem(source, {
        id: `${source.table}-error`,
        status: "error",
        title_zh: formatAdminContentHealthText(adminContentHealthCoreText[language].readFailed, {
          label: getAdminContentHealthSourceLabel(source.table, language),
        }),
        updated_at: null,
      }, language)]),
  [language]);

  return useQuery({
    queryKey: ["admin", "content_health"],
    enabled: enabled && options.enabled !== false,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_HEAVY_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    select,
    queryFn: async ({ signal }): Promise<HealthSourceRows[]> => {
      return Promise.all(
        healthSources.map(async (source) => {
          try {
            const rows = await fetchAdminContentHealthRows(source.table, healthSelectFields(source), signal);
            return { source, rows };
          } catch {
            return { source, rows: null };
          }
        }),
      );
    },
  });
}
