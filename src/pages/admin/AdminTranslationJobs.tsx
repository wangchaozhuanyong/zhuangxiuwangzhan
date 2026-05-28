import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translateStatusLabel } from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";
import { AdminFilters, AdminPageShell } from "./AdminPageShell";

type TranslationJob = {
  id: string;
  table_name: string | null;
  record_id: string | null;
  status: string | null;
  error_message: string | null;
  regenerated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const tableLabels: Record<string, { en: string; zh: string }> = {
  hero_slides: { en: "Hero Slides", zh: "首页幻灯片" },
  services: { en: "Services", zh: "服务项目" },
  projects: { en: "Projects", zh: "装修案例" },
  materials: { en: "Materials", zh: "材料库" },
  blog_posts: { en: "Blog Posts", zh: "博客文章" },
  testimonials: { en: "Testimonials", zh: "客户评价" },
  service_areas: { en: "Service Areas", zh: "服务区域" },
  landing_pages: { en: "Landing Pages", zh: "落地页" },
  project_images: { en: "Project Images", zh: "案例图片" },
};

const copy = {
  en: {
    title: "Translation Jobs",
    description: "Review translation generation status and errors. Jobs are read-only logs created by the translation function.",
    searchPlaceholder: "Search table, record ID, or error...",
    allStatuses: "All statuses",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    empty: "No translation jobs found.",
    showing: (filtered: number, total: number) => `Showing ${filtered} of ${total} latest jobs`,
    table: "Table",
    record: "Record ID",
    status: "Status",
    error: "Error",
    created: "Created",
    updated: "Updated",
    regenerated: "Regenerated",
    noError: "No error",
    notRegenerated: "Not regenerated",
  },
  zh: {
    title: "翻译任务",
    description: "查看英文生成任务的状态和错误信息。这里是翻译函数生成的只读日志。",
    searchPlaceholder: "搜索表名、记录 ID 或错误...",
    allStatuses: "全部状态",
    refresh: "刷新",
    refreshing: "刷新中...",
    empty: "暂无翻译任务。",
    showing: (filtered: number, total: number) => `显示 ${filtered} / ${total} 条最新任务`,
    table: "表",
    record: "记录 ID",
    status: "状态",
    error: "错误",
    created: "创建时间",
    updated: "更新时间",
    regenerated: "重新生成时间",
    noError: "无错误",
    notRegenerated: "尚未重新生成",
  },
};

const statuses = ["queued", "processing", "completed", "failed"];

const formatDateTime = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getTableLabel = (table: string | null, language: Language) => {
  if (!table) return "-";
  return tableLabels[table]?.[language] || table.replace(/_/g, " ");
};

const AdminTranslationJobs = () => {
  const lang: Language = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsLoading(true);
    setMessage("");
    const { data, error } = await supabase!
      .from("translation_jobs")
      .select("id, table_name, record_id, status, error_message, regenerated_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setJobs((data || []) as TranslationJob[]);
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const haystack = [job.table_name, job.record_id, job.status, job.error_message].join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [jobs, search, statusFilter]);

  return (
    <AdminLayout>
      <AdminPageShell
        title={t.title}
        description={t.description}
        actions={
          <Button variant="outline" onClick={() => void loadJobs()} disabled={isLoading || !isSupabaseConfigured}>
            {isLoading ? t.refreshing : t.refresh}
          </Button>
        }
      >
        <div className="space-y-4">
          <AdminFilters>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.searchPlaceholder} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">{t.allStatuses}</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {translateStatusLabel("translation_jobs", status, lang)}
                </option>
              ))}
            </select>
          </AdminFilters>
          {message && <div className="rounded-lg bg-muted p-3 text-sm">{message}</div>}
          <p className="text-xs text-muted-foreground">{t.showing(filteredJobs.length, jobs.length)}</p>

          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <article key={job.id} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{getTableLabel(job.table_name, lang)}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{job.record_id || "-"}</p>
                  </div>
                  <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {translateStatusLabel("translation_jobs", job.status || "queued", lang)}
                  </span>
                </div>
                <dl className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{t.created}</dt>
                    <dd>{formatDateTime(job.created_at, "-")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{t.updated}</dt>
                    <dd>{formatDateTime(job.updated_at, "-")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{t.regenerated}</dt>
                    <dd>{formatDateTime(job.regenerated_at, t.notRegenerated)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{t.error}</dt>
                    <dd className="break-words">{job.error_message || t.noError}</dd>
                  </div>
                </dl>
              </article>
            ))}
            {!isLoading && filteredJobs.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.empty}</div>
            )}
          </div>
        </div>
      </AdminPageShell>
    </AdminLayout>
  );
};

export default AdminTranslationJobs;
