import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translateStatusLabel } from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";
import { getAdminLang } from "@/lib/adminLocale";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminTranslationJobs } from "@/lib/adminQueries";

const tableLabels: Record<string, { en: string; zh: string }> = {
  hero_slides: { en: "Hero Buttons", zh: "首页首屏按钮" },
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
  const lang = getAdminLang();
  const t = copy[lang];
  const { data: jobs = [], isFetching, error, refetch } = useAdminTranslationJobs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const message = error instanceof Error ? error.message : error ? String(error) : "";

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const haystack = [job.table_name, job.record_id, job.status, job.error_message].join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [jobs, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="font-display text-2xl font-bold">{t.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.searchPlaceholder} />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t.allStatuses}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {translateStatusLabel("translation_jobs", status, lang)}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching || !isSupabaseConfigured}>
            {isFetching ? t.refreshing : t.refresh}
          </Button>
        </div>
        {message && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
        <p className="mt-4 text-xs text-muted-foreground">{t.showing(filteredJobs.length, jobs.length)}</p>
      </div>

      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <article key={job.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold">{getTableLabel(job.table_name, lang)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.record}: {job.record_id || "-"} · {translateStatusLabel("translation_jobs", job.status || "queued", lang)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>{t.created}: {formatDateTime(job.created_at, "-")}</p>
                <p>{t.updated}: {formatDateTime(job.updated_at, "-")}</p>
                <p>{t.regenerated}: {formatDateTime(job.regenerated_at, t.notRegenerated)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t.error}: {job.error_message || t.noError}
            </p>
          </article>
        ))}
        {!isFetching && filteredJobs.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.empty}</div>
        )}
      </div>
    </div>
  );
};

export default AdminTranslationJobs;
