import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translateStatusLabel } from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";
import { getAdminLang } from "@/lib/adminLocale";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAdminTranslationJobs } from "@/lib/adminQueries";
import { toast } from "@/hooks/use-toast";
import { classifyTranslationFailure, friendlyTranslationError, translationTableLabels } from "@/lib/adminTranslation";

const copy = {
  en: {
    title: "Translation Records",
    description: "This page only shows automatic English generation records. Edit real content in the related content editor.",
    searchPlaceholder: "Search source, content name, status, or error...",
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
    retryBlocked: "This record is missing the source content needed for retry.",
    completed: "Completed",
    failed: "Failed",
    processing: "Processing",
    retryAllFailed: "Retry All Failed",
    retryAllConfirm: "Retry all failed English generation records? Existing English may be regenerated for these records.",
    failureGroups: "Failure Groups",
    allFailureGroups: "All failure groups",
    retryProgress: (done: number, total: number, failed: number) => `Retrying ${done}/${total}, failed ${failed}`,
    editContent: "Review Content",
  },
  zh: {
    title: "翻译记录",
    description: "这里不是编辑英文的地方，只用来查看自动生成英文有没有成功、哪里失败，以及手动重试。",
    searchPlaceholder: "搜索来源、内容名称、状态或错误...",
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
    retryBlocked: "这条记录缺少可重试的来源内容，不能重试。",
    completed: "已完成",
    failed: "失败",
    processing: "处理中",
    retryAllFailed: "一键重试全部失败",
    retryAllConfirm: "确定要重试全部失败的英文生成记录吗？这些记录会重新生成英文，请重试后人工检查一下。",
    failureGroups: "失败分组",
    allFailureGroups: "全部失败原因",
    retryProgress: (done: number, total: number, failed: number) => `正在重试 ${done}/${total}，失败 ${failed}`,
    editContent: "复核内容",
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

const buildRecordEditHref = (table: string | null, id: string | null) => {
  if (!table || !id) return null;
  const directRoutes: Record<string, string> = {
    services: "/admin/services",
    projects: "/admin/projects",
    materials: "/admin/materials",
    blog_posts: "/admin/blog",
  };
  const base = directRoutes[table] || `/admin/content/${table}`;
  return `${base}/${id}`;
};

const AdminTranslationJobs = () => {
  const lang = getAdminLang();
  const t = copy[lang];
  const queryClient = useQueryClient();
  const { data: jobs = [], isFetching, error, refetch } = useAdminTranslationJobs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [failureGroupFilter, setFailureGroupFilter] = useState("all");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryAllBusy, setRetryAllBusy] = useState(false);
  const [retryAllProgress, setRetryAllProgress] = useState<{ total: number; done: number; failed: number } | null>(null);
  const message = error instanceof Error ? error.message : error ? String(error) : "";

  const summary = useMemo(
    () => ({
      total: jobs.length,
      completed: jobs.filter((job) => job.status === "completed").length,
      failed: jobs.filter((job) => job.status === "failed").length,
      processing: jobs.filter((job) => job.status === "queued" || job.status === "processing").length,
    }),
    [jobs],
  );

  const failedJobs = useMemo(() => jobs.filter((job) => job.status === "failed"), [jobs]);
  const failureGroups = useMemo(() => {
    const groups = new Map<string, number>();
    for (const job of failedJobs) {
      const group = classifyTranslationFailure(job.error_message);
      groups.set(group, (groups.get(group) || 0) + 1);
    }
    return Array.from(groups.entries())
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));
  }, [failedJobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const friendlyReason = friendlyTranslationError(job.error_message);
      const group = classifyTranslationFailure(job.error_message);
      const matchesFailureGroup = failureGroupFilter === "all" || group === failureGroupFilter;
      const haystack = [job.table_name, job.record_label, job.status, job.error_message, friendlyReason, group].join(" ").toLowerCase();
      return matchesStatus && matchesFailureGroup && (!query || haystack.includes(query));
    });
  }, [failureGroupFilter, jobs, search, statusFilter]);

  const refreshJobs = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "translation_jobs"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "content_health"] }),
    ]);
  };

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
    await refreshJobs();
  };

  const retryAllFailed = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const targets = failedJobs.filter((job) => job.table_name && job.record_id);
    if (!targets.length) {
      toast({ title: t.retryBlocked, variant: "destructive" });
      return;
    }
    if (!window.confirm(t.retryAllConfirm)) return;

    setRetryAllBusy(true);
    setRetryAllProgress({ total: targets.length, done: 0, failed: 0 });
    let failed = 0;
    for (const job of targets) {
      const { error: retryError } = await supabase.functions.invoke("generate-english-content", {
        body: { table: job.table_name, id: job.record_id, force: true },
      });
      if (retryError) failed += 1;
      setRetryAllProgress((current) => current ? { ...current, done: current.done + 1, failed } : current);
    }
    setRetryAllBusy(false);
    toast({ title: `失败重试完成：成功 ${targets.length - failed} 条，失败 ${failed} 条。` });
    await refreshJobs();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.title}
        description={t.description}
        helpText="这里是自动英文生成记录。正文、标题、SEO 等内容要回到服务、案例、材料、博客或 CMS 页面里修改。"
        actions={
          <Button type="button" onClick={() => void retryAllFailed()} disabled={!isSupabaseConfigured || retryAllBusy || failedJobs.length === 0}>
            {retryAllBusy && retryAllProgress ? t.retryProgress(retryAllProgress.done, retryAllProgress.total, retryAllProgress.failed) : t.retryAllFailed}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label={t.record} value={summary.total} helpText="最近读取到的英文生成记录数量。" />
        <AdminStatCard label={t.completed} value={summary.completed} helpText="已经成功生成过英文的记录，建议抽查英文质量。" />
        <AdminStatCard label={t.failed} value={summary.failed} helpText="失败后可以单条重试，也可以一键重试全部失败。" />
        <AdminStatCard label={t.processing} value={summary.processing} helpText="排队中或生成中的任务。" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
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
          <select
            value={failureGroupFilter}
            onChange={(event) => setFailureGroupFilter(event.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t.allFailureGroups}</option>
            {failureGroups.map(({ group, count }) => (
              <option key={group} value={group}>
                {group}（{count}）
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

      {failureGroups.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">{t.failureGroups}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {failureGroups.map(({ group, count }) => (
              <Button
                key={group}
                type="button"
                size="sm"
                variant={failureGroupFilter === group ? "default" : "outline"}
                onClick={() => {
                  setFailureGroupFilter(group);
                  setStatusFilter("failed");
                }}
              >
                {group} · {count}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">点某个失败原因，可以只看这一类记录；修复配置或网络后，再用“一键重试全部失败”。</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredJobs.map((job) => {
          const editHref = buildRecordEditHref(job.table_name, job.record_id);
          const failureGroup = classifyTranslationFailure(job.error_message);
          return (
            <article key={job.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{getTableLabel(job.table_name, lang)}</p>
                    {job.status === "failed" && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">{failureGroup}</span>}
                  </div>
                  <p className="mt-1 text-sm text-foreground">
                    {t.record}: {job.record_label || "-"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.status}: {translateStatusLabel("translation_jobs", job.status || "queued", lang)}</p>
                </div>
                <div className="flex flex-col gap-2 text-xs text-muted-foreground md:items-end">
                  <p>{t.created}: {formatDateTime(job.created_at, "-")}</p>
                  <p>{t.updated}: {formatDateTime(job.updated_at, "-")}</p>
                  <p>{t.regenerated}: {formatDateTime(job.regenerated_at, t.notRegenerated)}</p>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {editHref && (
                      <Button asChild type="button" variant="ghost" size="sm">
                        <Link to={editHref}>{t.editContent}</Link>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void retryJob(job)}
                      disabled={!isSupabaseConfigured || retryingId === job.id || retryAllBusy || !job.table_name || !job.record_id}
                    >
                      {retryingId === job.id ? t.retrying : t.retry}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-3 rounded-lg bg-muted/70 p-3 text-sm text-muted-foreground">
                {t.error}: {job.error_message ? friendlyTranslationError(job.error_message) : t.noError}
              </p>
            </article>
          );
        })}
        {!isFetching && filteredJobs.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.empty}</div>
        )}
      </div>
    </div>
  );
};

export default AdminTranslationJobs;
