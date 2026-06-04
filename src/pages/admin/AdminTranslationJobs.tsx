import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminTranslationJobsText } from "@/i18n/adminTranslationJobsText";
import { translateStatusLabel } from "@/i18n/displayLabels";
import type { Language } from "@/i18n/routes";
import { getAdminLang } from "@/lib/adminLocale";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminTranslationJobs } from "@/lib/adminSystemQueries";
import { toast } from "@/hooks/use-toast";
import { classifyTranslationFailure, friendlyTranslationError, translationTableLabels } from "@/lib/adminTranslation";
import { generateAdminEnglishContent } from "@/backend/modules/system/service/translationService";
import { formatUserFacingError } from "@/lib/userFacingText";

const statuses = ["queued", "processing", "completed", "failed"];

const formatText = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, String(value)), text);

const formatDateTime = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatGenerationError = (error: unknown) => friendlyTranslationError(error instanceof Error ? error.message : String(error || ""));

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
  const t = adminTranslationJobsText[lang];
  const queryClient = useQueryClient();
  const { data: jobs = [], isFetching, error, refetch } = useAdminTranslationJobs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [failureGroupFilter, setFailureGroupFilter] = useState("all");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryAllBusy, setRetryAllBusy] = useState(false);
  const [retryAllProgress, setRetryAllProgress] = useState<{ total: number; done: number; failed: number } | null>(null);
  const message = error ? formatUserFacingError(error, lang) : "";

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
    try {
      await generateAdminEnglishContent({ table: job.table_name, id: job.record_id, force: true });
      setRetryingId(null);
      toast({ title: t.retryOk });
      await refreshJobs();
    } catch (retryError) {
      setRetryingId(null);
      toast({ title: t.retryFailureTitle, description: formatGenerationError(retryError), variant: "destructive" });
      return;
    }
  };

  const retryAllFailed = async () => {
    if (!isSupabaseConfigured) return;
    const targets = failedJobs.filter((job) => job.table_name && job.record_id);
    if (!targets.length) {
      toast({ title: t.retryBlocked, variant: "destructive" });
      return;
    }
    const confirmed = await adminConfirm({
      title: t.retryAllConfirmTitle,
      description: t.retryAllConfirm,
      confirmLabel: t.retryAllConfirmLabel,
      confirmVariant: "default",
    });
    if (!confirmed) return;

    setRetryAllBusy(true);
    setRetryAllProgress({ total: targets.length, done: 0, failed: 0 });
    let failed = 0;
    for (const job of targets) {
      try {
        await generateAdminEnglishContent({ table: job.table_name!, id: job.record_id!, force: true });
      } catch {
        failed += 1;
      }
      setRetryAllProgress((current) => current ? { ...current, done: current.done + 1, failed } : current);
    }
    setRetryAllBusy(false);
    toast({ title: formatText(t.retryAllFinished, { success: targets.length - failed, failed }) });
    await refreshJobs();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.title}
        description={t.description}
        helpText={t.helpText}
        actions={
          <Button type="button" onClick={() => void retryAllFailed()} disabled={!isSupabaseConfigured || retryAllBusy || failedJobs.length === 0}>
            {retryAllBusy && retryAllProgress
              ? formatText(t.retryProgress, {
                  done: retryAllProgress.done,
                  total: retryAllProgress.total,
                  failed: retryAllProgress.failed,
                })
              : t.retryAllFailed}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label={t.record} value={summary.total} helpText={t.totalHelp} />
        <AdminStatCard label={t.completed} value={summary.completed} helpText={t.completedHelp} />
        <AdminStatCard label={t.failed} value={summary.failed} helpText={t.failedHelp} />
        <AdminStatCard label={t.processing} value={summary.processing} helpText={t.processingHelp} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div data-admin-filter-bar className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
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
          <select
            value={failureGroupFilter}
            onChange={(event) => setFailureGroupFilter(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        <p className="mt-4 text-xs text-muted-foreground">{formatText(t.showing, { filtered: filteredJobs.length, total: jobs.length })}</p>
      </div>

      {failureGroups.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">{t.failureGroups}</h2>
          <div data-admin-card-actions className="mt-4 flex flex-wrap gap-2">
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
          <p className="mt-3 text-sm text-muted-foreground">{t.failureGroupHelp}</p>
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
                  <div data-admin-card-actions className="flex flex-wrap gap-2 md:justify-end">
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
