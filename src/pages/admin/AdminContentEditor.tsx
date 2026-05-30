import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateAdminContentLists, invalidatePublishedContent } from "@/lib/adminInvalidate";
import { useAdminEditorRows } from "@/lib/adminQueries";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  translateDisplayText,
  translateFieldLabel,
  translateLocationLabel,
  translateProjectType,
  translateStatusLabel,
} from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";
import { getAdminLang } from "@/lib/adminLocale";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminImageUpload from "./AdminImageUpload";
import AdminProjectImages from "./AdminProjectImages";
import { FaqListEditor, ProjectCardsEditor, TextListEditor } from "@/components/admin/StructuredArrayEditors";
import { AdminFieldLabel } from "@/components/admin/AdminHelpTip";
import { getAdminFieldHelp, getAdminTableHelp } from "@/lib/adminHelpText";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

const editableTables = new Set([
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
  "translation_jobs",
]);

const contentFields = ["title_zh", "excerpt_zh", "content_zh", "seo_title_zh", "seo_description_zh", "alt_zh"];
const englishFields = ["title_en", "excerpt_en", "content_en", "seo_title_en", "seo_description_en", "alt_en"];

const tableFields: Record<string, string[]> = {
  hero_slides: [
    "button_label_zh",
    "button_label_en",
    "button_url",
    "status",
    "sort_order",
  ],
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
  testimonials: ["customer_name", "content_zh", "content_en", "rating", "project_id", "status", "sort_order"],
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
  landing_pages: [...contentFields, "benefits_zh", "faqs_zh", ...englishFields, "benefits_en", "faqs_en", "slug", "hero_image_url", "related_projects", "status", "sort_order"],
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
  translation_jobs: ["table_name", "record_id", "status", "error_message", "regenerated_at", "created_at", "updated_at"],
};

const arrayLikeFields = new Set([
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

const jsonFields = new Set(["faqs_zh", "faqs_en", "projects", "process_steps_zh", "process_steps_en", "related_projects"]);
const imageFields = new Set(["image_url", "cover_image_url", "hero_image_url"]);

// materials.recommended_pairing_zh/en are TEXT columns (not text[]). Keep them as textarea.
const longTextFields = new Set(["recommended_pairing_zh", "recommended_pairing_en", "note_zh", "note_en"]);
const autoTranslateTables = new Set(["services", "projects", "blog_posts", "materials", "testimonials", "hero_slides", "service_areas", "landing_pages"]);
const readOnlyTables = new Set(["translation_jobs"]);
const readOnlyFields = new Set(["created_at", "updated_at", "regenerated_at"]);

const humanize = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const copy = {
  en: {
    unsupported: (table: string) => "Unsupported table: " + table,
    saving: "Saving...",
    saved: "Saved.",
    generating: "Generating English...",
    generatingEnglish: "Saved. Generating English...",
    generationFailed: (message: string) => "Saved, but English generation failed: " + message,
    generated: "Saved and English generated. You can review or manually edit the English fields below.",
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
    regenerate: "Regenerate English",
  },
  zh: {
    unsupported: (table: string) => "不支持的数据表：" + table,
    saving: "保存中...",
    saved: "已保存",
    generating: "正在生成英文...",
    generatingEnglish: "已保存，正在生成英文...",
    generationFailed: (message: string) => "已保存，但英文生成失败：" + message,
    generated: "已保存并生成英文。你可以在下面查看或手动修改英文内容。",
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
    regenerate: "重新生成英文",
  },
};

const tableLabels: Record<string, { en: string; zh: string }> = {
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
  translation_jobs: { en: "Translation Jobs", zh: "翻译任务" },
};

const fieldLabels: Record<string, { en: string; zh: string }> = {
  title: { en: "Title", zh: "标题" },
  excerpt: { en: "Excerpt", zh: "摘要" },
  content: { en: "Content", zh: "内容" },
  seo_title: { en: "SEO Title", zh: "SEO 标题" },
  seo_description: { en: "SEO Description", zh: "SEO 描述" },
  alt: { en: "Alt Text", zh: "图片说明" },
  button_label: { en: "Button Label", zh: "按钮文案" },
  button_url: { en: "Button URL", zh: "按钮链接" },
  slug: { en: "Slug", zh: "链接标识" },
  image_url: { en: "Image URL", zh: "图片链接" },
  cover_image_url: { en: "Cover Image URL", zh: "封面图链接" },
  hero_image_url: { en: "Hero Image URL", zh: "主视觉图链接" },
  status: { en: "Status", zh: "状态" },
  sort_order: { en: "Sort Order", zh: "排序" },
  suitable_for: { en: "Suitable For", zh: "适用场景" },
  common_projects: { en: "Common Projects", zh: "常见项目" },
  scope_items: { en: "Scope Items", zh: "范围项目" },
  faqs: { en: "FAQs", zh: "常见问题" },
  client_need: { en: "Client Need", zh: "客户需求" },
  highlights: { en: "Highlights", zh: "亮点" },
  location: { en: "Location", zh: "地点" },
  area: { en: "Area", zh: "区域" },
  duration: { en: "Duration", zh: "工期" },
  budget: { en: "Budget", zh: "预算" },
  project_type: { en: "Project Type", zh: "项目类型" },
  materials: { en: "Materials", zh: "材料" },
  scope: { en: "Scope", zh: "范围" },
  suitable_spaces: { en: "Suitable Spaces", zh: "适用空间" },
  pros: { en: "Pros", zh: "优点" },
  cons: { en: "Cons", zh: "缺点" },
  recommended_pairing: { en: "Recommended Pairing", zh: "推荐搭配" },
  note: { en: "Note", zh: "备注" },
  category: { en: "Category", zh: "分类" },
  subcategory: { en: "Subcategory", zh: "子分类" },
  material_type: { en: "Material Type", zh: "材料类型" },
  color: { en: "Color", zh: "颜色" },
  texture: { en: "Texture", zh: "纹理" },
  reference_price: { en: "Reference Price", zh: "参考价格" },
  customer_name: { en: "Customer Name", zh: "客户姓名" },
  customer_phone: { en: "Customer Phone", zh: "客户电话" },
  customer_email: { en: "Customer Email", zh: "客户邮箱" },
  phone: { en: "Phone", zh: "电话" },
  email: { en: "Email", zh: "邮箱" },
  name: { en: "Name", zh: "姓名" },
  message: { en: "Message", zh: "留言" },
  source: { en: "Source", zh: "来源" },
  source_path: { en: "Source Path", zh: "来源路径" },
  notes: { en: "Notes", zh: "备注" },
  area_name: { en: "Area Name", zh: "区域名称" },
  construction_notes: { en: "Construction Notes", zh: "施工说明" },
  property_types: { en: "Property Types", zh: "房产类型" },
  common_needs: { en: "Common Needs", zh: "常见需求" },
  benefits: { en: "Benefits", zh: "优势" },
  related_projects: { en: "Related Projects", zh: "相关项目" },
  published_at: { en: "Published At", zh: "发布时间" },
  tags: { en: "Tags", zh: "标签" },
  rating: { en: "Rating", zh: "评分" },
  project_id: { en: "Project ID", zh: "项目 ID" },
  table_name: { en: "Table Name", zh: "表名" },
  record_id: { en: "Record ID", zh: "记录 ID" },
  error_message: { en: "Error Message", zh: "错误信息" },
  regenerated_at: { en: "Regenerated At", zh: "重新生成时间" },
  property_size: { en: "Property Size", zh: "面积/户型" },
  estimated_budget: { en: "Estimated Budget", zh: "预算预估" },
  quoted_amount: { en: "Quoted Amount", zh: "报价金额" },
  valid_until: { en: "Valid Until", zh: "有效期" },
  project_details: { en: "Project Details", zh: "项目详情" },
  attachments: { en: "Attachments", zh: "附件" },
};

const statusLabels: Record<string, Record<string, { en: string; zh: string }>> = {
  default: {
    draft: { en: "Draft", zh: "草稿" },
    published: { en: "Published", zh: "已发布" },
    archived: { en: "Archived", zh: "已归档" },
  },
  leads: {
    new: { en: "New", zh: "新咨询" },
    contacted: { en: "Contacted", zh: "已联系" },
    site_visit_scheduled: { en: "Site Visit Scheduled", zh: "已安排上门" },
    quoted: { en: "Quoted", zh: "已报价" },
    converted: { en: "Converted", zh: "已成交" },
    closed: { en: "Closed", zh: "已关闭" },
    spam: { en: "Spam", zh: "垃圾咨询" },
  },
  quote_requests: {
    pending: { en: "Pending", zh: "待处理" },
    contacted: { en: "Contacted", zh: "已联系" },
    site_visit_scheduled: { en: "Site Visit Scheduled", zh: "已安排上门" },
    quoted: { en: "Quoted", zh: "已报价" },
    accepted: { en: "Accepted", zh: "已接受" },
    rejected: { en: "Rejected", zh: "已拒绝" },
    closed: { en: "Closed", zh: "已关闭" },
  },
  translation_jobs: {
    processing: { en: "Processing", zh: "处理中" },
    completed: { en: "Completed", zh: "已完成" },
    failed: { en: "Failed", zh: "失败" },
  },
};

const locationLabels: Record<string, { en: string; zh: string }> = {
  "kuala-lumpur": { en: "Kuala Lumpur", zh: "吉隆坡" },
  selangor: { en: "Selangor", zh: "雪兰莪" },
  "petaling-jaya": { en: "Petaling Jaya", zh: "八打灵再也" },
  cheras: { en: "Cheras", zh: "蕉赖" },
  "mont-kiara": { en: "Mont Kiara", zh: "满家乐" },
  bangsar: { en: "Bangsar", zh: "孟沙" },
  "subang-jaya": { en: "Subang Jaya", zh: "梳邦再也" },
  puchong: { en: "Puchong", zh: "蒲种" },
  "shah-alam": { en: "Shah Alam", zh: "莎阿南" },
  "setia-alam": { en: "Setia Alam", zh: "实达阿南" },
};

const readLabel = (map: Record<string, { en: string; zh: string }>, value: string, language: Language) => {
  const key = value.trim().toLowerCase();
  return map[key]?.[language] || value;
};

const getTableLabel = (table: string, language: Language) => tableLabels[table]?.[language] || humanize(table);

const getRecordLabel = (row: Record<string, any>, type: string, language: Language) => {
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

  const text = row.title_zh || row.title_en || row.name || row.customer_name || row.id;
  return translateDisplayText(String(text || ""), language);
};

const getRecordMeta = (row: Record<string, any>, type: string, language: Language) => {
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

  if (type === "translation_jobs") return row.error_message || row.record_id || (language === "zh" ? "翻译任务" : "Translation job");
  return translateStatusLabel(type, row.status || "saved", language);
};

const parseFieldValue = (field: string, value: any) => {
  if (arrayLikeFields.has(field)) {
    if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
    return String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
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

const formatFieldValue = (field: string, value: any) => {
  if (arrayLikeFields.has(field)) return Array.isArray(value) ? value.join("\n") : value || "";
  if (jsonFields.has(field)) return typeof value === "string" ? value : JSON.stringify(value || [], null, 2);
  return value || "";
};

const arrayValue = (field: string, value: any) => {
  if (Array.isArray(value)) return value;
  if (jsonFields.has(field)) {
    try {
      const parsed = value ? JSON.parse(String(value)) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
};

const csvEscape = (value: any) => {
  const text = Array.isArray(value) || (value && typeof value === "object") ? JSON.stringify(value) : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
};

const exportRowsAsCsv = (type: string, fields: string[], rows: any[]) => {
  const csv = [
    fields.map(csvEscape).join(","),
    ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const statusOptions: Record<string, string[]> = {
  leads: ["new", "contacted", "site_visit_scheduled", "quoted", "converted", "closed", "spam"],
  quote_requests: ["pending", "contacted", "site_visit_scheduled", "quoted", "accepted", "rejected", "closed"],
  translation_jobs: ["processing", "completed", "failed"],
  default: ["draft", "published", "archived"],
};

const listContentTables = new Set(["services", "projects", "materials", "blog_posts"]);

const AdminContentEditor = () => {
  const { type = "projects", id } = useParams<{ type: string; id?: string }>();
  const queryClient = useQueryClient();
  const lang = getAdminLang();
  const t = copy[lang];
  const [record, setRecord] = useState<Record<string, any>>({});
  const recordDirtyRef = useRef(false);
  const [recordDirty, setRecordDirty] = useState(false);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const setRecordField = useCallback((patch: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
    recordDirtyRef.current = true;
    setRecordDirty(true);
    setRecord((prev) => (typeof patch === "function" ? patch(prev) : { ...prev, ...patch }));
  }, []);
  useUnsavedChangesWarning(recordDirty);
  const canEdit = editableTables.has(type);
  const { data: rows = [], isFetching, error: rowsError, refetch } = useAdminEditorRows(type, canEdit);
  const isLoading = isFetching;

  const refreshContentCaches = useCallback(() => {
    void invalidatePublishedContent(queryClient);
    if (listContentTables.has(type)) void invalidateAdminContentLists(queryClient);
  }, [queryClient, type]);

  const visibleFields = useMemo(() => tableFields[type] || [...contentFields, ...englishFields, "slug", "status", "sort_order"], [type]);
  const availableStatuses = statusOptions[type] || statusOptions.default;
  const statusOptionLabels = useMemo(
    () => availableStatuses.map((option) => ({ value: option, label: translateStatusLabel(type, option, lang) })),
    [availableStatuses, lang, type],
  );
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !query || visibleFields.some((field) => String(row[field] ?? "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter, visibleFields]);

  useEffect(() => {
    recordDirtyRef.current = false;
    setRecordDirty(false);
  }, [id, type]);

  useEffect(() => {
    if (rowsError) {
      setStatus(rowsError instanceof Error ? rowsError.message : String(rowsError));
      return;
    }
    if (recordDirtyRef.current) return;
    if (id && rows.length) {
      setRecord(rows.find((item) => item.id === id) || {});
    } else if (!id) {
      setRecord({});
    }
  }, [id, rows, rowsError]);

  const save = async () => {
    setStatus(t.saving);
    const payload = { ...record };
    for (const field of Object.keys(payload)) {
      payload[field] = parseFieldValue(field, payload[field]);
    }

    let savedRecord: Record<string, any>;
    try {
      savedRecord = await saveAdminRecord({
        table: type,
        payload,
        id: record.id,
        expectedUpdatedAt: record.updated_at || null,
        queryClient,
      });
    } catch (error) {
      setStatus(formatAdminMutationError(error));
      return;
    }

    recordDirtyRef.current = false;
    setRecordDirty(false);
    setRecord(savedRecord);

    const hasChineseContent = Object.keys(payload).some((field) => field.endsWith("_zh") && payload[field]);
    if (autoTranslateTables.has(type) && hasChineseContent) {
      setStatus(t.generatingEnglish);
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: type, id: savedRecord.id },
      });

      if (translationError) {
        setStatus(t.generationFailed(translationError.message));
        return;
      }

      const { data: translatedRecord } = await supabase!.from(type).select("*").eq("id", savedRecord.id).single();
      if (translatedRecord) {
        recordDirtyRef.current = false;
        setRecordDirty(false);
        setRecord(translatedRecord);
      }
      setStatus(t.generated);
      refreshContentCaches();
      await refetch();
      return;
    }

    setStatus(t.saved);
    refreshContentCaches();
    void queryClient.invalidateQueries({ queryKey: ["admin", type, "rows"] });
    await refetch();
  };

  const regenerateEnglish = async () => {
    if (!record.id) {
      setStatus(t.saveFirst);
      return;
    }

    setStatus(t.generating);
    const { error } = await supabase!.functions.invoke("generate-english-content", {
      body: { table: type, id: record.id, force: true },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    const { data: translatedRecord } = await supabase!.from(type).select("*").eq("id", record.id).single();
      if (translatedRecord) {
        recordDirtyRef.current = false;
        setRecordDirty(false);
        setRecord(translatedRecord);
      }
    setStatus(t.regenerated);
    refreshContentCaches();
    void queryClient.invalidateQueries({ queryKey: ["admin", type, "rows"] });
    await refetch();
  };

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">{t.unsupported(type)}</div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-display mb-3 text-lg font-bold">{tableLabels[type]?.[lang] || type}</h2>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">{getAdminTableHelp(type)}</p>
          {!readOnlyTables.has(type) && (
            <Button
              className="mb-4 w-full"
              onClick={() => {
                recordDirtyRef.current = false;
                setRecordDirty(false);
                setRecord({ status: type === "leads" ? "new" : type === "quote_requests" ? "pending" : "draft", sort_order: 0 });
              }}
            >
              {t.createRecord}
            </Button>
          )}
          <div className="mb-4 space-y-2">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.searchPlaceholder} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">{t.allStatuses}</option>
              {statusOptionLabels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button className="w-full" variant="outline" onClick={() => void refetch()} disabled={isLoading || !isSupabaseConfigured}>
              {isLoading ? t.refreshing : t.refresh}
            </Button>
          </div>
          {(type === "leads" || type === "quote_requests") && (
            <Button className="mb-4 w-full" variant="outline" onClick={() => exportRowsAsCsv(type, visibleFields, filteredRows)} disabled={filteredRows.length === 0}>
              {t.exportCsv}
            </Button>
          )}
          <p className="mb-3 text-xs text-muted-foreground">{t.showing(filteredRows.length, rows.length)}</p>
          <div className="space-y-2">
            {filteredRows.map((row) => (
              <button
                key={row.id}
                className="block w-full rounded-lg border border-border p-3 text-left text-sm hover:bg-muted"
                onClick={() => {
                  recordDirtyRef.current = false;
                  setRecordDirty(false);
                  setRecord(row);
                }}
              >
                <span className="font-medium">{getRecordLabel(row, type, lang)}</span>
                <span className="block text-xs text-muted-foreground">{getRecordMeta(row, type, lang)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">{t.bilingualTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.bilingualDesc}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={regenerateEnglish} disabled={!isSupabaseConfigured || !record.id}>
                {t.regenerate}
              </Button>
              <Button onClick={save} disabled={!isSupabaseConfigured || readOnlyTables.has(type)}>
                {t.save}
              </Button>
            </div>
          </div>
          {(type === "leads" || type === "quote_requests") && (
            <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground">{t.leadTip}</div>
          )}
          {status && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{status}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            {visibleFields.map((field) => {
              const label = translateFieldLabel(field, lang);
              const isWide =
                field.includes("content") ||
                field.includes("description") ||
                arrayLikeFields.has(field) ||
                jsonFields.has(field) ||
                imageFields.has(field);

              return (
                <div key={field} className={isWide ? "md:col-span-2" : ""}>
                  {readOnlyFields.has(field) ? (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <Input value={formatFieldValue(field, record[field])} readOnly className="bg-muted text-muted-foreground" />
                    </>
                  ) : field === "faqs_zh" || field === "faqs_en" ? (
                    <FaqListEditor label={label} helpText={getAdminFieldHelp(field)} value={arrayValue(field, record[field])} onChange={(value) => setRecordField({ [field]: value })} />
                  ) : field === "projects" ? (
                    <ProjectCardsEditor
                      label={label}
                      helpText={getAdminFieldHelp(field)}
                      value={arrayValue(field, record[field])}
                      onChange={(value) => setRecordField({ [field]: value })}
                      folder={`${type}/${record.id || "draft"}/projects`}
                      metaKey="type"
                      metaLabel="项目类型"
                    />
                  ) : field === "related_projects" ? (
                    <ProjectCardsEditor
                      label={label}
                      helpText={getAdminFieldHelp(field)}
                      value={arrayValue(field, record[field])}
                      onChange={(value) => setRecordField({ [field]: value })}
                      folder={`${type}/${record.id || "draft"}/related-projects`}
                      metaKey="location"
                      metaLabel="项目地点"
                    />
                  ) : arrayLikeFields.has(field) ? (
                    <TextListEditor label={label} helpText={getAdminFieldHelp(field)} value={arrayValue(field, record[field])} onChange={(value) => setRecordField({ [field]: value })} />
                  ) : field.includes("content") || field.includes("description") || longTextFields.has(field) ? (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <Textarea rows={5} value={formatFieldValue(field, record[field])} onChange={(event) => setRecordField({ [field]: event.target.value })} />
                    </>
                  ) : jsonFields.has(field) ? (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <Textarea rows={4} value={formatFieldValue(field, record[field])} onChange={(event) => setRecordField({ [field]: event.target.value })} />
                    </>
                  ) : imageFields.has(field) ? (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <div className="space-y-3">
                        <Input value={formatFieldValue(field, record[field])} onChange={(event) => setRecordField({ [field]: event.target.value })} />
                        <AdminImageUpload value={record[field]} folder={`${type}/${record.id || "draft"}`} onUploaded={(url) => setRecordField({ [field]: url })} />
                      </div>
                    </>
                  ) : (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <Input value={formatFieldValue(field, record[field])} onChange={(event) => setRecordField({ [field]: event.target.value })} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {type === "projects" && <AdminProjectImages projectId={record.id} />}
        </div>
      </div>
  );
};

export default AdminContentEditor;
