import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const enabled = isSupabaseConfigured && Boolean(supabase);
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
  label: string;
  editBase: string;
  frontBase?: string;
  titleFields: string[];
  requiredFields: string[];
  englishFields: string[];
  seoFields: string[];
  imageFields: string[];
};

const healthSources: HealthSource[] = [
  {
    table: "services",
    label: "服务项目",
    editBase: "/admin/services",
    frontBase: "/services",
    titleFields: ["title_zh", "title_en", "slug"],
    requiredFields: ["title_zh", "slug", "status"],
    englishFields: ["title_en", "excerpt_en", "content_en"],
    seoFields: ["seo_title_zh", "seo_description_zh", "seo_title_en", "seo_description_en"],
    imageFields: ["image_url"],
  },
  {
    table: "projects",
    label: "装修案例",
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
    label: "材料库",
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
    label: "博客文章",
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
    label: "页面内容",
    editBase: "/admin/pages",
    titleFields: ["title_zh", "title_en", "page_key", "path"],
    requiredFields: ["page_key", "status"],
    englishFields: ["title_en", "description_en", "content_en"],
    seoFields: ["seo_title_zh", "seo_description_zh", "seo_title_en", "seo_description_en"],
    imageFields: ["image_url"],
  },
  {
    table: "home_sections",
    label: "首页区块",
    editBase: "/admin/home",
    titleFields: ["title_zh", "title_en", "section_key"],
    requiredFields: ["section_key", "status"],
    englishFields: ["title_en", "subtitle_en", "content_en", "items_en"],
    seoFields: [],
    imageFields: ["image_url"],
  },
  {
    table: "about_sections",
    label: "关于区块",
    editBase: "/admin/about",
    titleFields: ["title_zh", "title_en", "section_key"],
    requiredFields: ["section_key", "status"],
    englishFields: ["title_en", "subtitle_en", "content_en", "items_en"],
    seoFields: [],
    imageFields: ["image_url"],
  },
  {
    table: "faqs",
    label: "常见问题",
    editBase: "/admin/faqs",
    titleFields: ["question_zh", "question_en", "page_key"],
    requiredFields: ["question_zh", "answer_zh", "page_key", "status"],
    englishFields: ["question_en", "answer_en"],
    seoFields: [],
    imageFields: [],
  },
  {
    table: "cta_blocks",
    label: "行动引导",
    editBase: "/admin/home",
    titleFields: ["title_zh", "title_en", "block_key"],
    requiredFields: ["block_key", "status"],
    englishFields: ["title_en", "description_en", "primary_label_en", "secondary_label_en"],
    seoFields: [],
    imageFields: ["image_url"],
  },
  {
    table: "cms_pages",
    label: "通用 CMS 页面",
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

const adminHealthFieldLabels: Record<string, string> = {
  alt_en: "英文图片说明",
  alt_zh: "中文图片说明",
  answer_en: "英文答案",
  answer_zh: "中文答案",
  block_key: "区块标识",
  content_en: "英文正文",
  content_zh: "中文正文",
  cover_image_url: "封面图片",
  description_en: "英文说明",
  description_zh: "中文说明",
  excerpt_en: "英文摘要",
  excerpt_zh: "中文摘要",
  image_url: "图片",
  items_en: "英文列表内容",
  page_key: "页面标识",
  path: "前台路径",
  primary_label_en: "英文主按钮文案",
  question_en: "英文问题",
  question_zh: "中文问题",
  secondary_label_en: "英文次按钮文案",
  section_key: "模块标识",
  seo_description_en: "英文 SEO 描述",
  seo_description_zh: "中文 SEO 描述",
  seo_title_en: "英文 SEO 标题",
  seo_title_zh: "中文 SEO 标题",
  slug: "链接标识",
  status: "发布状态",
  title_en: "英文标题",
  title_zh: "中文标题",
};

export const getAdminHealthFieldLabel = (field: string) =>
  adminHealthFieldLabels[field] ||
  field
    .replace(/_zh$/, "（中文）")
    .replace(/_en$/, "（英文）")
    .replace(/_/g, " ");

const formatHealthIssue = (type: string, field: string) => `${type}：${getAdminHealthFieldLabel(field)}`;

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

const buildHealthItem = (source: HealthSource, row: Record<string, unknown>): AdminContentHealthItem => {
  const title = source.titleFields.map((field) => row[field]).find((value) => !isBlankAdminValue(value));
  const missingRequired = source.requiredFields.filter((field) => isBlankAdminValue(row[field]));
  const missingEnglish = source.englishFields.filter((field) => isBlankAdminValue(row[field]));
  const missingSeo = source.seoFields.filter((field) => isBlankAdminValue(row[field]));
  const missingMedia =
    source.imageFields.length > 0 && source.imageFields.every((field) => isBlankAdminValue(row[field]))
      ? source.imageFields
      : [];
  const issues = [
    ...missingRequired.map((field) => formatHealthIssue("必填缺失", field)),
    ...missingEnglish.map((field) => formatHealthIssue("英文缺失", field)),
    ...missingSeo.map((field) => formatHealthIssue("SEO 缺失", field)),
    ...missingMedia.map((field) => formatHealthIssue("图片缺失", field)),
  ];

  return {
    id: String(row.id || `${source.table}-${String(title || "row")}`),
    table: source.table,
    tableLabel: source.label,
    title: String(title || "未命名内容"),
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
  return useQuery({
    queryKey: ["admin", "content_health"],
    enabled: enabled && options.enabled !== false,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_HEAVY_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: async (): Promise<AdminContentHealthItem[]> => {
      const results = await Promise.all(
        healthSources.map(async (source) => {
          const { data, error } = await supabase!
            .from(source.table)
            .select(healthSelectFields(source))
            .order("updated_at", { ascending: false, nullsFirst: false })
            .limit(300);
          if (error) {
            return [
              buildHealthItem(source, {
                id: `${source.table}-error`,
                status: "error",
                title_zh: `${source.label} 读取失败`,
                updated_at: null,
              }),
            ];
          }
          const rows = (data || []) as unknown as Array<Record<string, unknown>>;
          return rows.map((row) => buildHealthItem(source, row));
        }),
      );
      return results.flat();
    },
  });
}
