import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translateStatusLabel } from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";
import { getAdminLang } from "@/lib/adminLocale";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAdminTranslationJobs } from "@/lib/adminQueries";
import { toast } from "@/hooks/use-toast";
import { friendlyTranslationError, translationTableLabels } from "@/lib/adminTranslation";

const copy = {
  en: {
    title: "Translation Records",
    description: "This page only shows automatic English generation records. Edit real content in the related content editor.",
    searchPlaceholder: "Search table, content name, record ID, or error...",
    allStatuses: "All statuses",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    empty: "No translation records found.",
    showing: (filtered: number, total: number) => `Showing ${filtered} of ${total} latest records`,
    table: "Source",
    record: "Content",
    status: "Status",
    error: "Plain reason",
    created: "Created",
    updated: "Updated",
    regenerated: "Generated",
    noError: "No error",
    notRegenerated: "Not generated yet",
    retry: "Regenerate English",
    retrying: "Generating...",
    retryOk: "English generation has been retried.",
    retryBlocked: "This record has no source table or record ID.",
  },
  zh: {
    title: "翻译记录",
    description: "这里不是编辑英文的地方，只用来查看自动生成英文有没有成功、哪里失败，以及手动重试。",
    searchPlaceholder: "搜索来源、内容名称、记录 ID 或错误...",
    allStatuses: "全部状态",
    refresh: "刷新",
    refreshing: "刷新中...",
    empty: "暂无翻译记录。",
    showing: (filtered: number, total: number) => `显示 ${filtered} / ${total} 条最新记录`,
    table: "来源",
    record: "内容",
    status: "状态",
    error: "白话原因",
    created: "创建时间",
    updated: "更新时间",
    regenerated: "生成时间",
    noError: "没有错误",
    notRegenerated: "还没有生成",
    retry: "重新生成英文",
    retrying: "生成中...",
    retryOk: "已重新发起英文生成。",
    retryBlocked: "这条记录没有来源表或记录 ID，不能重试。",
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
  if (language === "zh") return translationTableLabels[table] || table.replace(/_/g, " ");
  return table.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const AdminTranslationJobs = () => {
  const lang = getAdminLang();
  const t = copy[lang];
  const queryClient = useQueryClient();
  const { data: jobs = [], isFetching, error, refetch } = useAdminTranslationJobs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const message = error instanceof Error ? error.message : error ? String(error) : "";

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const haystack = [job.table_name, job.record_id, job.record_label, job.status, job.error_message].join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [jobs, search, statusFilter]);

  const retryJob = async (job: (typeof jobs)[number]) => {
    if (!job.table_name || !job.record_id) {
      toast({ title: t.retryBlocked, variant: "destructive" });
      return;
    }
    setRetryingId(job.id);
    const { error: retryError } = await supabase!.functions.invoke("generate-english-content", {
      body: { table: job.table_name, id: job.record_id, force: true },
    });
    setRetryingId(null);

    if (retryError) {
      toast({ title: "英文生成失败", description: friendlyTranslationError(retryError.message), variant: "destructive" });
      return;
    }

    toast({ title: t.retryOk });
    await queryClient.invalidateQueries({ queryKey: ["admin", "translation_jobs"] });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.title}
        description={t.description}
        helpText="这里是自动英文生成记录。正文、标题、SEO 等内容要回到服务、案例、材料、博客或 CMS 页面里修改。"
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
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
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{getTableLabel(job.table_name, lang)}</p>
                <p className="mt-1 text-sm text-foreground">
                  {t.record}: {job.record_label || job.record_id || "-"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t.status}: {translateStatusLabel("translation_jobs", job.status || "queued", lang)}</p>
              </div>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground md:items-end">
                <p>{t.created}: {formatDateTime(job.created_at, "-")}</p>
                <p>{t.updated}: {formatDateTime(job.updated_at, "-")}</p>
                <p>{t.regenerated}: {formatDateTime(job.regenerated_at, t.notRegenerated)}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void retryJob(job)}
                  disabled={!isSupabaseConfigured || retryingId === job.id || !job.table_name || !job.record_id}
                >
                  {retryingId === job.id ? t.retrying : t.retry}
                </Button>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-muted/70 p-3 text-sm text-muted-foreground">
              {t.error}: {job.error_message ? friendlyTranslationError(job.error_message) : t.noError}
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
