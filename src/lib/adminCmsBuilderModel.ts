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
  content_zh: Record<string, any>;
  content_en: Record<string, any>;
  settings: Record<string, any>;
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
  snapshot: Record<string, any>;
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

export const prettyJson = (value: unknown) => JSON.stringify(value || {}, null, 2);

export const parseJson = (value: string, label: string) => {
  try {
    return value.trim() ? JSON.parse(value) : {};
  } catch {
    throw new Error(`${label} 不是合法 JSON，请检查逗号、引号和括号。`);
  }
};

export const makeSectionKey = (type: string) => `${type.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString().slice(-6)}`;

