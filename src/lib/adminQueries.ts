import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminAboutEditorData,
  fetchAdminHomeEditorData,
  fetchAdminUsers,
  fetchNotificationSettings,
  fetchTranslationJobs,
} from "@/lib/adminEditorData";
import {
  adminDayStartIso,
  adminSince24hIso,
  normalizeAdminWorkflowFilter,
  type AdminLeadListKind,
  type AdminWorkflowFilter,
} from "@/lib/adminLeadWorkflow";
import {
  buildAdminLeadReport,
  getAdminLeadReportStartIso,
  normalizeAdminLeadReportPeriod,
  type AdminLeadReportPeriod,
} from "@/lib/adminLeadReports";
import { buildMediaAssetInsert, type AdminUploadedMedia } from "@/lib/adminMedia";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Language } from "@/i18n/routes";

const enabled = isSupabaseConfigured && Boolean(supabase);
const ADMIN_LIST_STALE_TIME = 5 * 60 * 1000;
const ADMIN_HEAVY_STALE_TIME = 10 * 60 * 1000;
const ADMIN_QUERY_GC_TIME = 30 * 60 * 1000;
export const ADMIN_DEFAULT_PAGE_SIZE = 30;
const ADMIN_MAX_PAGE_SIZE = 80;
const COUNT_ONLY_SELECT = "id";

export type AdminListQuery = {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  workflow?: AdminWorkflowFilter | string;
};

export type AdminListPage<T> = {
  rows: T[];
  count: number;
  page: number;
  pageSize: number;
};

const clampPage = (value?: number) => Math.max(0, Number.isFinite(value || 0) ? Math.floor(value || 0) : 0);

const clampPageSize = (value?: number) => {
  if (!Number.isFinite(value || 0)) return ADMIN_DEFAULT_PAGE_SIZE;
  return Math.min(ADMIN_MAX_PAGE_SIZE, Math.max(10, Math.floor(value || ADMIN_DEFAULT_PAGE_SIZE)));
};

const normalizeAdminSearch = (value?: string) =>
  String(value || "")
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 60);

const applyAdminSearch = (query: any, fields: string[], search?: string) => {
  const q = normalizeAdminSearch(search);
  if (!q) return query;
  return query.or(fields.map((field) => `${field}.ilike.%${q}%`).join(","));
};

const applyAdminWorkflowFilter = (
  query: any,
  kind: AdminLeadListKind | undefined,
  workflow: AdminWorkflowFilter | undefined,
) => {
  if (!kind || !workflow || workflow === "all") return query;
  const now = new Date();

  if (workflow === "today") {
    return query.gte("created_at", adminDayStartIso(now));
  }

  if (workflow === "due_followups") {
    return query.not("next_follow_up_at", "is", null).lte("next_follow_up_at", now.toISOString());
  }

  if (workflow === "stale24") {
    const since24h = adminSince24hIso(now);
    return kind === "leads"
      ? query.eq("status", "new").lt("created_at", since24h)
      : query.in("status", ["pending", "contacted"]).lt("created_at", since24h);
  }

  if (workflow === "to_quote") {
    return kind === "leads"
      ? query.in("status", ["contacted", "site_visit_scheduled"])
      : query.in("status", ["pending", "contacted", "site_visit_scheduled"]);
  }

  return query;
};

async function fetchAdminListPage<T>({
  table,
  kind,
  select,
  page,
  pageSize,
  status,
  workflow,
  search,
  searchFields,
  orders,
}: {
  table: string;
  kind?: AdminLeadListKind;
  select: string;
  page?: number;
  pageSize?: number;
  status?: string;
  workflow?: AdminWorkflowFilter;
  search?: string;
  searchFields: string[];
  orders: Array<{ column: string; options?: Record<string, unknown> }>;
}): Promise<AdminListPage<T>> {
  const safePage = clampPage(page);
  const safePageSize = clampPageSize(pageSize);
  const from = safePage * safePageSize;
  const to = from + safePageSize - 1;

  let query = supabase!.from(table).select(select, { count: "exact" });
  if (status && status !== "all") query = query.eq("status", status);
  query = applyAdminWorkflowFilter(query, kind, workflow);
  query = applyAdminSearch(query, searchFields, search);
  orders.forEach(({ column, options }) => {
    query = query.order(column, options as any);
  });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return {
    rows: (data ?? []) as T[],
    count: count ?? (data?.length || 0),
    page: safePage,
    pageSize: safePageSize,
  };
}

export type AdminMediaAsset = {
  id: string;
  file_url: string;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  poster_url?: string | null;
  duration_seconds?: number | null;
  original_file_path?: string | null;
  original_mime_type?: string | null;
  original_size_bytes?: number | null;
  original_width?: number | null;
  original_height?: number | null;
  processing_status?: string | null;
  usage_type: string | null;
  folder: string | null;
  alt_zh: string | null;
  alt_en: string | null;
  created_at: string | null;
};

export function useAdminLeads(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  const workflow = normalizeAdminWorkflowFilter(options.workflow, "leads");
  return useQuery({
    queryKey: ["admin", "leads", { page, pageSize, status: options.status || "all", workflow, search }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () =>
      fetchAdminListPage<Record<string, any>>({
        table: "leads",
        kind: "leads",
        select: "*",
        page,
        pageSize,
        status: options.status,
        workflow,
        search,
        searchFields: ["name", "phone", "email", "location", "source_path", "project_type"],
        orders: [{ column: "created_at", options: { ascending: false } }],
      }),
  });
}

export function useAdminQuotes(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  const workflow = normalizeAdminWorkflowFilter(options.workflow, "quote_requests");
  return useQuery({
    queryKey: ["admin", "quotes", { page, pageSize, status: options.status || "all", workflow, search }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () =>
      fetchAdminListPage<Record<string, any>>({
        table: "quote_requests",
        kind: "quote_requests",
        select: "*",
        page,
        pageSize,
        status: options.status,
        workflow,
        search,
        searchFields: ["customer_name", "customer_phone", "customer_email", "location", "project_type", "source_path"],
        orders: [{ column: "created_at", options: { ascending: false } }],
      }),
  });
}

export function useAdminMediaAssets(options: Omit<AdminListQuery, "status"> & { usageType?: string } = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  const usageType = options.usageType || "all";
  return useQuery({
    queryKey: ["admin", "media_assets", { page, pageSize, usageType, search }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: async () => {
      let query = supabase!
        .from("media_assets")
        .select(
          "id,file_url,file_path,file_name,mime_type,size_bytes,width,height,poster_url,duration_seconds,original_file_path,original_mime_type,original_size_bytes,original_width,original_height,processing_status,usage_type,folder,alt_zh,alt_en,created_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false });
      if (usageType !== "all") query = query.eq("usage_type", usageType);
      query = applyAdminSearch(query, ["file_name", "folder", "usage_type", "mime_type", "alt_zh", "alt_en"], search);
      const from = page * pageSize;
      const { data, error, count } = await query.range(from, from + pageSize - 1);
      if (error) throw error;
      return {
        rows: (data ?? []) as AdminMediaAsset[],
        count: count ?? (data?.length || 0),
        page,
        pageSize,
      };
    },
  });
}

export function useCreateAdminMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ url, upload, usageType = "general", folder = "media" }: { url: string; upload?: AdminUploadedMedia; usageType?: string; folder?: string }) => {
      const { data: userData } = await supabase!.auth.getUser();
      const { error } = await supabase!.from("media_assets").insert({
        ...buildMediaAssetInsert({
          url,
          upload,
          usageType,
          folder,
          createdBy: userData.user?.id || null,
        }),
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media_assets"] }),
  });
}

export function useUpdateAdminMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: Pick<AdminMediaAsset, "id" | "alt_zh" | "alt_en" | "usage_type" | "folder">) => {
      const { error } = await supabase!
        .from("media_assets")
        .update({
          alt_zh: asset.alt_zh || null,
          alt_en: asset.alt_en || null,
          usage_type: asset.usage_type || null,
          folder: asset.folder || null,
        })
        .eq("id", asset.id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media_assets"] }),
  });
}

export function useDeleteAdminMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase!.from("media_assets").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media_assets"] }),
  });
}

export type AdminDashboardStats = {
  counts: Record<string, number>;
  recentLeads: unknown[];
  recentQuotes: unknown[];
};

const isBlankAdminValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
};

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: async (): Promise<AdminDashboardStats> => {
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const todayIso = dayStart.toISOString();
      const monthIso = monthStart.toISOString();

      const [
        newLeads,
        pendingQuotes,
        staleLeads,
        staleQuotes,
        failedTranslations,
        projects,
        services,
        blog,
        seoMissing,
        todayLeads,
        monthQuotes,
        monthLeads,
        dueLeadFollowUps,
        dueQuoteFollowUps,
        toQuote,
        leads,
        quotes,
      ] = await Promise.all([
        supabase!.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "new"),
        supabase!.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "pending"),
        supabase!.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "new").lt("created_at", since24h),
        supabase!.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).in("status", ["pending", "contacted"]).lt("created_at", since24h),
        supabase!.from("translation_jobs").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "failed"),
        supabase!.from("projects").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "published"),
        supabase!.from("services").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "published"),
        supabase!.from("blog_posts").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).eq("status", "published"),
        supabase!.from("services").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).or("seo_title_zh.is.null,seo_description_zh.is.null"),
        supabase!.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).gte("created_at", todayIso),
        supabase!.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).gte("created_at", monthIso),
        supabase!.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).gte("created_at", monthIso),
        supabase!.from("leads").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).not("next_follow_up_at", "is", null).lte("next_follow_up_at", now.toISOString()),
        supabase!.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).not("next_follow_up_at", "is", null).lte("next_follow_up_at", now.toISOString()),
        supabase!.from("quote_requests").select(COUNT_ONLY_SELECT, { count: "exact", head: true }).in("status", ["pending", "contacted", "site_visit_scheduled"]),
        supabase!.from("leads").select("id,name,phone,status,created_at,source_path,next_follow_up_at").order("created_at", { ascending: false }).limit(10),
        supabase!.from("quote_requests").select("id,customer_name,customer_phone,status,created_at,project_type,source_path,next_follow_up_at").order("created_at", { ascending: false }).limit(10),
      ]);

      return {
        counts: {
          todayLeads: todayLeads.count || 0,
          newLeads: newLeads.count || 0,
          pendingQuotes: pendingQuotes.count || 0,
          staleLeads: staleLeads.count || 0,
          staleQuotes: staleQuotes.count || 0,
          dueLeadFollowUps: dueLeadFollowUps.count || 0,
          dueQuoteFollowUps: dueQuoteFollowUps.count || 0,
          dueFollowUps: (dueLeadFollowUps.count || 0) + (dueQuoteFollowUps.count || 0),
          monthLeads: monthLeads.count || 0,
          monthQuotes: monthQuotes.count || 0,
          toQuote: toQuote.count || 0,
          staleUnfollowed: (staleLeads.count || 0) + (staleQuotes.count || 0),
          failedTranslations: failedTranslations.count || 0,
          projects: projects.count || 0,
          services: services.count || 0,
          blog: blog.count || 0,
          seoMissing: seoMissing.count || 0,
        },
        recentLeads: leads.data || [],
        recentQuotes: quotes.data || [],
      };
    },
  });
}

export function useAdminLeadReport(options: { period?: AdminLeadReportPeriod | string; language?: Language } = {}) {
  const period = normalizeAdminLeadReportPeriod(options.period);
  const language = options.language || "zh";
  return useQuery({
    queryKey: ["admin", "lead-report", { period, language }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: async () => {
      const startIso = getAdminLeadReportStartIso(period);
      let leadsQuery = supabase!
        .from("leads")
        .select("id,name,status,source,source_path,project_type,location,deal_value,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      let quotesQuery = supabase!
        .from("quote_requests")
        .select("id,customer_name,status,source_path,project_type,location,quoted_amount,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (startIso) {
        leadsQuery = leadsQuery.gte("created_at", startIso);
        quotesQuery = quotesQuery.gte("created_at", startIso);
      }

      const [{ data: leads, error: leadsError }, { data: quotes, error: quotesError }] = await Promise.all([
        leadsQuery,
        quotesQuery,
      ]);
      if (leadsError) throw leadsError;
      if (quotesError) throw quotesError;

      return buildAdminLeadReport({
        leads: leads || [],
        quotes: quotes || [],
        period,
        language,
      });
    },
  });
}

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
  const sharedFields = [
    "id",
    "status",
    "updated_at",
    "created_at",
  ];
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
  if (source.table === "site_pages" || source.table === "home_sections" || source.table === "about_sections" || source.table === "faqs" || source.table === "cta_blocks" || source.table === "cms_pages") {
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
  const missingMedia = source.imageFields.length > 0 && source.imageFields.every((field) => isBlankAdminValue(row[field])) ? source.imageFields : [];
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

export function useAdminLead(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "leads", id],
    enabled: enabled && Boolean(id),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const [{ data: lead, error: leadError }, { data: followups }] = await Promise.all([
        supabase!.from("leads").select("*").eq("id", id!).single(),
        supabase!.from("lead_followups").select("*").eq("lead_id", id!).order("created_at", { ascending: false }),
      ]);
      if (leadError) throw leadError;
      return { lead, followups: followups ?? [] };
    },
  });
}

export function useAdminQuote(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "quotes", id],
    enabled: enabled && Boolean(id),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const [{ data: quote, error: quoteError }, { data: followups }] = await Promise.all([
        supabase!.from("quote_requests").select("*").eq("id", id!).single(),
        supabase!.from("lead_followups").select("*").eq("quote_request_id", id!).order("created_at", { ascending: false }),
      ]);
      if (quoteError) throw quoteError;
      return { quote, followups: followups ?? [] };
    },
  });
}

export type AdminServiceRow = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  slug: string;
  status: string | null;
  sort_order: number | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type AdminProjectImageRow = {
  image_url: string;
  image_type: "gallery" | "before" | "after" | "cover";
  sort_order: number;
  alt_zh?: string | null;
  alt_en?: string | null;
};

export type AdminProjectRow = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  slug: string;
  status: string | null;
  sort_order: number | null;
  location?: string | null;
  project_type?: string | null;
  image_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  project_images?: AdminProjectImageRow[] | null;
};

export type AdminMaterialRow = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  slug: string;
  status: string | null;
  sort_order: number | null;
  category?: string | null;
  subcategory?: string | null;
  material_type?: string | null;
  image_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type AdminBlogRow = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  slug: string;
  status: string | null;
  sort_order: number | null;
  category?: string | null;
  published_at?: string | null;
  cover_image_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export function useAdminServices(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  return useQuery({
    queryKey: ["admin", "services", { page, pageSize, status: options.status || "all", search }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () =>
      fetchAdminListPage<AdminServiceRow>({
        table: "services",
        select: "id,title_zh,title_en,slug,status,sort_order,updated_at,created_at",
        page,
        pageSize,
        status: options.status,
        search,
        searchFields: ["title_zh", "title_en", "slug"],
        orders: [
          { column: "sort_order", options: { ascending: true } },
          { column: "updated_at", options: { ascending: false } },
        ],
      }),
  });
}

export function useAdminProjects(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  return useQuery({
    queryKey: ["admin", "projects", { page, pageSize, status: options.status || "all", search }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () =>
      fetchAdminListPage<AdminProjectRow>({
        table: "projects",
        select:
          "id,title_zh,title_en,slug,status,sort_order,location,project_type,image_url,updated_at,created_at,project_images(image_url,image_type,sort_order,alt_zh,alt_en)",
        page,
        pageSize,
        status: options.status,
        search,
        searchFields: ["title_zh", "title_en", "slug", "location", "project_type"],
        orders: [
          { column: "sort_order", options: { ascending: true } },
          { column: "updated_at", options: { ascending: false } },
        ],
      }),
  });
}

export function useAdminMaterials(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  return useQuery({
    queryKey: ["admin", "materials", { page, pageSize, status: options.status || "all", search }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () =>
      fetchAdminListPage<AdminMaterialRow>({
        table: "materials",
        select: "id,title_zh,title_en,slug,status,sort_order,category,subcategory,material_type,image_url,updated_at,created_at",
        page,
        pageSize,
        status: options.status,
        search,
        searchFields: ["title_zh", "title_en", "slug", "category", "subcategory", "material_type"],
        orders: [
          { column: "sort_order", options: { ascending: true } },
          { column: "updated_at", options: { ascending: false } },
        ],
      }),
  });
}

export function useAdminBlogPosts(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  return useQuery({
    queryKey: ["admin", "blog_posts", { page, pageSize, status: options.status || "all", search }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () =>
      fetchAdminListPage<AdminBlogRow>({
        table: "blog_posts",
        select: "id,title_zh,title_en,slug,status,sort_order,category,published_at,cover_image_url,updated_at,created_at",
        page,
        pageSize,
        status: options.status,
        search,
        searchFields: ["title_zh", "title_en", "slug", "category"],
        orders: [
          { column: "sort_order", options: { ascending: true } },
          { column: "published_at", options: { ascending: false, nullsFirst: false } },
          { column: "updated_at", options: { ascending: false } },
        ],
      }),
  });
}

export type AdminContentTable = "services" | "projects" | "materials" | "blog_posts";

export function useAdminServiceDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "services", "detail", id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase!.from("services").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminProjectDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "projects", "detail", id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase!.from("projects").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminMaterialDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "materials", "detail", id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase!.from("materials").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminBlogPostDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "blog_posts", "detail", id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase!.from("blog_posts").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminBusinessRecord(table: AdminContentTable, id: string | undefined) {
  return useQuery({
    queryKey: ["admin", table, "detail", id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase!.from(table).select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminTableRows(table: AdminContentTable, limit = 200) {
  return useQuery({
    queryKey: ["admin", table, "rows", { limit }],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type AdminSimpleCmsTable = "site_pages" | "home_sections" | "faqs" | "before_after_items" | "brand_partners";

export function useAdminSimpleCmsRows(table: AdminSimpleCmsTable) {
  return useQuery({
    queryKey: ["admin", table, "rows"],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from(table)
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminEditorRows(type: string, canLoad: boolean, limit = 50) {
  return useQuery({
    queryKey: ["admin", type, "rows", { limit }],
    enabled: enabled && canLoad && Boolean(type),
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from(type)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminProjectImages(projectId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "project_images", projectId],
    enabled: enabled && Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase!
        .from("project_images")
        .select("*")
        .eq("project_id", projectId!)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminHomeEditorData() {
  return useQuery({
    queryKey: ["admin", "home_editor"],
    enabled,
    queryFn: fetchAdminHomeEditorData,
  });
}

export function useAdminAboutEditorData() {
  return useQuery({
    queryKey: ["admin", "about_editor"],
    enabled,
    queryFn: fetchAdminAboutEditorData,
  });
}

export function useAdminNotificationSettings() {
  return useQuery({
    queryKey: ["admin", "notification_settings"],
    enabled,
    queryFn: fetchNotificationSettings,
  });
}

export function useAdminTranslationJobs(limit = 100) {
  return useQuery({
    queryKey: ["admin", "translation_jobs", { limit }],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () => fetchTranslationJobs(limit),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: fetchAdminUsers,
  });
}
