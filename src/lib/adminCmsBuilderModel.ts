export type CmsPage = {
  id?: string;
  page_key: string;
  path: string;
  title_zh?: string | null;
  title_en?: string | null;
  seo_title_zh?: string | null;
  seo_title_en?: string | null;
  seo_description_zh?: string | null;
  seo_description_en?: string | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
  updated_at?: string | null;
};

export type CmsSection = {
  id?: string;
  page_id: string;
  section_key: string;
  section_type: string;
  title_zh?: string | null;
  title_en?: string | null;
  content_zh: Record<string, unknown>;
  content_en: Record<string, unknown>;
  settings: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  sort_order: number;
  updated_at?: string | null;
};

export type CmsTemplate = {
  template_key: string;
  label: string;
  description?: string | null;
};

export type CmsRevision = {
  id: string;
  entity_table: "cms_pages" | "cms_sections" | "cms_content_entries";
  entity_id: string;
  action: string;
  version: number | null;
  snapshot: Record<string, unknown>;
  created_at: string;
};


export const emptyPage: CmsPage = {
  page_key: "",
  path: "/",
  title_zh: "",
  title_en: "",
  seo_title_zh: "",
  seo_title_en: "",
  seo_description_zh: "",
  seo_description_en: "",
  status: "draft",
  sort_order: 0,
};

const STATIC_ROUTE_PREFIXES = [
  "/about",
  "/services",
  "/materials",
  "/projects",
  "/process",
  "/faq",
  "/contact",
  "/quote",
  "/blog",
  "/locations",
  "/landing",
  "/privacy",
  "/terms",
];

export const normalizeCmsPageKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-");

export const isValidCmsPageKey = (value: string) => /^[a-z0-9][a-z0-9_-]*$/.test(value);

export const normalizeCmsPagePath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "/";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
};

export const cmsPathHasLanguagePrefix = (value: string) => /^\/(zh|en)(\/|$)/.test(normalizeCmsPagePath(value));

export const buildCmsLocalizedPath = (path: string, language: "zh" | "en") => {
  const normalizedPath = normalizeCmsPagePath(path);
  return `/${language}${normalizedPath === "/" ? "" : normalizedPath}`;
};

export const isCmsPathHandledByStaticRoute = (path: string) => {
  const normalizedPath = normalizeCmsPagePath(path);
  return STATIC_ROUTE_PREFIXES.some((route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`));
};

export const createCmsPageDraft = (existingCount = 0, now = Date.now()): CmsPage => {
  const suffix = String(now).slice(-6);
  return {
    ...emptyPage,
    page_key: `custom_page_${suffix}`,
    path: `/custom-page-${suffix}`,
    title_zh: "新页面草稿",
    title_en: "New draft page",
    sort_order: existingCount * 10 + 10,
  };
};

export const shouldAutoSelectFirstCmsPage = (selectedPageId: string | null, dirty: boolean, firstPageId?: string | null) =>
  !selectedPageId && !dirty && Boolean(firstPageId);

export const prettyJson = (value: unknown) => JSON.stringify(value || {}, null, 2);

export const parseJson = (value: string, label: string) => {
  try {
    return value.trim() ? JSON.parse(value) : {};
  } catch {
    throw new Error(`${label} 不是合法 JSON，请检查逗号、引号和括号。`);
  }
};

export const makeSectionKey = (type: string) => `${type.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString().slice(-6)}`;
