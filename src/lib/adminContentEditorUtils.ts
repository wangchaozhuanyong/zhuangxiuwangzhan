import {
  translateDisplayText,
  translateLocationLabel,
  translateProjectType,
  translateStatusLabel,
} from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";

export const editableTables = new Set([
  "services",
  "projects",
  "blog_posts",
  "materials",
  "testimonials",
  "hero_slides",
  "service_areas",
  "landing_pages",
  "leads",
  "quote_requests",
]);

export const contentFields = ["title_zh", "excerpt_zh", "content_zh", "seo_title_zh", "seo_description_zh", "alt_zh"];
export const englishFields = ["title_en", "excerpt_en", "content_en", "seo_title_en", "seo_description_en", "alt_en"];

export const tableFields: Record<string, string[]> = {
  hero_slides: ["button_label_zh", "button_label_en", "button_url", "status", "sort_order"],
  services: [
    ...contentFields,
    "suitable_for_zh",
    "common_projects_zh",
    "scope_items_zh",
    "faqs_zh",
    ...englishFields,
    "suitable_for_en",
    "common_projects_en",
    "scope_items_en",
    "faqs_en",
    "slug",
    "image_url",
    "status",
    "sort_order",
  ],
  projects: [
    ...contentFields,
    "client_need_zh",
    "highlights_zh",
    ...englishFields,
    "client_need_en",
    "highlights_en",
    "slug",
    "location",
    "area",
    "duration",
    "budget",
    "project_type",
    "materials",
    "scope",
    "status",
    "sort_order",
  ],
  materials: [
    ...contentFields,
    "suitable_spaces_zh",
    "pros_zh",
    "cons_zh",
    "recommended_pairing_zh",
    "note_zh",
    ...englishFields,
    "suitable_spaces_en",
    "pros_en",
    "cons_en",
    "recommended_pairing_en",
    "note_en",
    "slug",
    "category",
    "subcategory",
    "material_type",
    "color",
    "texture",
    "reference_price",
    "image_url",
    "status",
    "sort_order",
  ],
  blog_posts: [...contentFields, ...englishFields, "slug", "category", "tags", "cover_image_url", "status", "published_at"],
  testimonials: ["customer_name", "content_zh", "content_en", "rating", "status", "sort_order"],
  service_areas: [
    ...contentFields,
    "construction_notes_zh",
    "property_types",
    "common_needs",
    "projects",
    "faqs_zh",
    ...englishFields,
    "construction_notes_en",
    "faqs_en",
    "slug",
    "area_name",
    "status",
    "sort_order",
  ],
  landing_pages: [
    ...contentFields,
    "benefits_zh",
    "faqs_zh",
    ...englishFields,
    "benefits_en",
    "faqs_en",
    "slug",
    "hero_image_url",
    "related_projects",
    "status",
    "sort_order",
  ],
  leads: ["name", "phone", "email", "project_type", "location", "message", "source", "source_path", "status", "notes", "created_at", "updated_at"],
  quote_requests: [
    "customer_name",
    "customer_phone",
    "customer_email",
    "project_type",
    "location",
    "property_size",
    "estimated_budget",
    "quoted_amount",
    "valid_until",
    "project_details",
    "attachments",
    "status",
    "notes",
    "source_path",
    "created_at",
    "updated_at",
  ],
};

export const arrayLikeFields = new Set([
  "materials",
  "scope",
  "tags",
  "suitable_for_zh",
  "suitable_for_en",
  "common_projects_zh",
  "common_projects_en",
  "scope_items_zh",
  "scope_items_en",
  "highlights_zh",
  "highlights_en",
  "suitable_spaces_zh",
  "suitable_spaces_en",
  "pros_zh",
  "pros_en",
  "cons_zh",
  "cons_en",
  "property_types",
  "common_needs",
  "benefits_zh",
  "benefits_en",
  "attachments",
]);

export const jsonFields = new Set(["faqs_zh", "faqs_en", "projects", "process_steps_zh", "process_steps_en", "related_projects"]);
export const imageFields = new Set(["image_url", "cover_image_url", "hero_image_url"]);

// materials.recommended_pairing_zh/en are TEXT columns (not text[]). Keep them as textarea.
export const longTextFields = new Set(["recommended_pairing_zh", "recommended_pairing_en", "note_zh", "note_en"]);
export const autoTranslateTables = new Set(["services", "projects", "blog_posts", "materials", "testimonials", "hero_slides", "service_areas", "landing_pages"]);
export const readOnlyTables = new Set<string>();
export const readOnlyFields = new Set(["created_at", "updated_at", "regenerated_at"]);

const humanize = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const copy = {
  en: {
    unsupported: (table: string) => "Unsupported table: " + table,
    saving: "Saving...",
    saved: "Saved.",
    generating: "Generating English...",
    generatingEnglish: "Saved. Generating English...",
    generationFailed: (message: string) => "Saved, but English generation failed: " + message,
    generated: "Saved and English auto-generated. You can review or fine-tune the English fields below.",
    saveFirst: "Save this record before generating English.",
    regenerated: "English regenerated. Refresh or reselect the record to review it.",
    createRecord: "Create New Record",
    searchPlaceholder: "Search current list...",
    allStatuses: "All statuses",
    refresh: "Refresh List",
    refreshing: "Refreshing...",
    exportCsv: "Export Filtered CSV",
    showing: (filtered: number, total: number) => "Showing " + filtered + " of " + total + " latest records",
    bilingualTitle: "Chinese first, English reviewable",
    bilingualDesc: "Fill Chinese fields, save, then review or edit generated English fields.",
    leadTip: "Lead workflow tip: update the status and notes after call, WhatsApp follow-up, site visit scheduling, quotation, or closing.",
    save: "Save",
    regenerate: "Force Regenerate English",
  },
  zh: {
    unsupported: (table: string) => "不支持的数据表：" + table,
    saving: "保存中...",
    saved: "已保存",
    generating: "正在生成英文...",
    generatingEnglish: "已保存，正在生成英文...",
    generationFailed: (message: string) => "已保存，但英文生成失败：" + message,
    generated: "已保存并自动生成英文。你可以在下面查看或手动微调英文内容。",
    saveFirst: "请先保存这条记录，再生成英文。",
    regenerated: "英文已重新生成。请刷新或重新选择记录查看。",
    createRecord: "新建记录",
    searchPlaceholder: "搜索当前列表...",
    allStatuses: "全部状态",
    refresh: "刷新列表",
    refreshing: "刷新中...",
    exportCsv: "导出筛选后的 CSV",
    showing: (filtered: number, total: number) => "显示 " + filtered + " / " + total + " 条最新记录",
    bilingualTitle: "中文优先，英文可复查",
    bilingualDesc: "先填写中文字段并保存，然后查看或编辑系统生成的英文字段。",
    leadTip: "咨询处理提示：通话、WhatsApp 跟进、上门测量、报价或结案后，请更新状态和备注。",
    save: "保存",
    regenerate: "强制重新生成英文",
  },
};

export const tableLabels: Record<string, { en: string; zh: string }> = {
  hero_slides: { en: "Hero Buttons", zh: "首屏按钮" },
  services: { en: "Services", zh: "服务项目" },
  projects: { en: "Projects", zh: "装修案例" },
  materials: { en: "Materials", zh: "材料库" },
  blog_posts: { en: "Blog Posts", zh: "博客文章" },
  testimonials: { en: "Testimonials", zh: "客户评价" },
  service_areas: { en: "Service Areas", zh: "服务区域" },
  landing_pages: { en: "Landing Pages", zh: "落地页" },
  leads: { en: "Leads", zh: "客户咨询" },
  quote_requests: { en: "Quote Requests", zh: "报价请求" },
};

const getTableLabel = (table: string, language: Language) => tableLabels[table]?.[language] || humanize(table);

export const getRecordLabel = (row: Record<string, any>, type: string, language: Language) => {
  if (type === "leads") {
    const name = row.name || (language === "zh" ? "咨询" : "Lead");
    const phone = row.phone || (language === "zh" ? "无电话" : "No phone");
    return name + " · " + phone;
  }

  if (type === "quote_requests") {
    const name = row.customer_name || (language === "zh" ? "报价请求" : "Quote request");
    const phone = row.customer_phone || (language === "zh" ? "无电话" : "No phone");
    return name + " · " + phone;
  }

  if (type === "translation_jobs") {
    return getTableLabel(row.table_name || "translation", language) + " · " + translateStatusLabel("translation_jobs", row.status || "unknown", language);
  }

  const text = row.title_zh || row.title_en || row.name || row.customer_name;
  return text ? translateDisplayText(String(text), language) : getTableLabel(type, language);
};

export const getRecordMeta = (row: Record<string, any>, type: string, language: Language) => {
  if (type === "leads") {
    return (
      translateProjectType(row.project_type || (language === "zh" ? "常规" : "General"), language) +
      " · " +
      translateLocationLabel(row.location || (language === "zh" ? "未填写地点" : "No location"), language) +
      " · " +
      translateStatusLabel("leads", row.status || "new", language)
    );
  }

  if (type === "quote_requests") {
    return (
      translateProjectType(row.project_type || (language === "zh" ? "项目" : "Project"), language) +
      " · " +
      translateLocationLabel(row.location || (language === "zh" ? "未填写地点" : "No location"), language) +
      " · " +
      translateStatusLabel("quote_requests", row.status || "pending", language)
    );
  }

  if (type === "translation_jobs") return row.error_message || (language === "zh" ? "翻译记录" : "Translation record");
  return translateStatusLabel(type, row.status || "saved", language);
};

export const parseFieldValue = (field: string, value: any) => {
  if (arrayLikeFields.has(field)) {
    if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
    return String(value || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (jsonFields.has(field)) {
    if (typeof value !== "string") return value;
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return value;
    }
  }

  if (field === "sort_order" || field === "rating" || field === "quoted_amount") {
    return Number(value || 0);
  }

  return value;
};

export const formatFieldValue = (field: string, value: any) => {
  if (arrayLikeFields.has(field)) return Array.isArray(value) ? value.join("\n") : value || "";
  if (jsonFields.has(field)) return typeof value === "string" ? value : JSON.stringify(value || [], null, 2);
  return value || "";
};

export const arrayValue = (field: string, value: any) => {
  if (Array.isArray(value)) return value;
  if (jsonFields.has(field)) {
    try {
      const parsed = value ? JSON.parse(String(value)) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

const csvEscape = (value: any) => {
  const text = Array.isArray(value) || (value && typeof value === "object") ? JSON.stringify(value) : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
};

export const exportRowsAsCsv = (type: string, fields: string[], rows: any[]) => {
  const csv = [fields.map(csvEscape).join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const statusOptions: Record<string, string[]> = {
  leads: ["new", "contacted", "site_visit_scheduled", "quoted", "converted", "closed", "spam"],
  quote_requests: ["pending", "contacted", "site_visit_scheduled", "quoted", "accepted", "rejected", "closed"],
  default: ["draft", "published", "archived"],
};

export const listContentTables = new Set(["services", "projects", "materials", "blog_posts"]);
