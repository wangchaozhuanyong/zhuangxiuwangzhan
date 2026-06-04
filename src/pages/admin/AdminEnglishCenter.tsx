import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { adminEnglishCenterText } from "@/i18n/adminEnglishCenterText";
import { getAdminHealthFieldLabel, useAdminContentHealth } from "@/lib/adminContentHealth";
import { getAdminLang } from "@/lib/adminLocale";
import { useAdminTranslationJobs } from "@/lib/adminSystemQueries";
import { friendlyTranslationError, translationEnabledTables } from "@/lib/adminTranslation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { generateAdminEnglishContent } from "@/backend/modules/system/service/translationService";

type BatchProgress = {
  total: number;
  done: number;
  success: number;
  failed: number;
  currentTitle: string;
  failures: string[];
};

type AdminEnglishCenterTextKey = keyof typeof adminEnglishCenterText;

const A = (key: AdminEnglishCenterTextKey) => adminEnglishCenterText[key][getAdminLang()];

const formatA = (key: AdminEnglishCenterTextKey, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));

const formatGenerationError = (error: unknown) => friendlyTranslationError(error instanceof Error ? error.message : String(error || ""));

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

export default function AdminEnglishCenter() {
  const queryClient = useQueryClient();
  const { data: items = [], isFetching, refetch } = useAdminContentHealth();
  const { data: jobs = [] } = useAdminTranslationJobs(100);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  const missingEnglish = useMemo(
    () => items.filter((item) => item.missingEnglish.length > 0 && translationEnabledTables.some((table) => table === item.table)),
    [items],
  );
  const failedJobs = jobs.filter((job) => job.status === "failed");
  const completedJobs = jobs.filter((job) => job.status === "completed");
  const runningJobs = jobs.filter((job) => job.status === "queued" || job.status === "processing");
  const reviewJobs = completedJobs.filter((job) => job.table_name && job.record_id).slice(0, 6);
  const publishedMissingEnglish = missingEnglish.filter((item) => item.status === "published").length;
  const batchLimit = 20;
  const batchPercent = batchProgress?.total ? Math.round((batchProgress.done / batchProgress.total) * 100) : 0;

  const refreshTranslationData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "content_health"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "translation_jobs"] }),
    ]);
  };

  const generateEnglish = async (table: string, id: string, force = false) => {
    if (!isSupabaseConfigured) return false;
    const key = `${table}:${id}`;
    setBusyId(key);
    try {
      await generateAdminEnglishContent({ table, id, force });
      setBusyId(null);
      toast({ title: force ? A("forcedRegenerated") : A("generationStarted") });
      await refreshTranslationData();
      return true;
    } catch (error) {
      setBusyId(null);
      toast({ title: A("generationFailed"), description: formatGenerationError(error), variant: "destructive" });
      return false;
    }
  };

  const batchGenerate = async () => {
    if (!isSupabaseConfigured) return;
    const targets = missingEnglish.slice(0, batchLimit);
    if (!targets.length) return;
    setBatchBusy(true);
    setBatchProgress({ total: targets.length, done: 0, success: 0, failed: 0, currentTitle: targets[0]?.title || "", failures: [] });
    let successCount = 0;
    let failedCount = 0;

    for (const item of targets) {
      setBatchProgress((current) => current ? { ...current, currentTitle: item.title } : current);
      let failureReason = "";
      try {
        await generateAdminEnglishContent({ table: item.table, id: item.id, force: false });
        successCount += 1;
      } catch (error) {
        failedCount += 1;
        failureReason = formatGenerationError(error);
      }
      setBatchProgress((current) => {
        if (!current) return current;
        const reason = failureReason ? `${item.title}: ${failureReason}` : "";
        return {
          ...current,
          done: current.done + 1,
          success: current.success + (failureReason ? 0 : 1),
          failed: current.failed + (failureReason ? 1 : 0),
          failures: reason ? [...current.failures, reason] : current.failures,
        };
      });
    }
    setBatchBusy(false);
    toast({ title: formatA("batchCompleted", { success: String(successCount), failed: String(failedCount) }) });
    await refreshTranslationData();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={A("pageTitle")}
        description={A("pageDescription")}
        helpText={A("pageHelpText")}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? A("scanning") : A("rescan")}
            </Button>
            <Button type="button" onClick={() => void batchGenerate()} disabled={batchBusy || missingEnglish.length === 0}>
              {batchBusy ? formatA("generatingPercent", { percent: String(batchPercent) }) : A("batchGenerateMissing")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label={A("missingEnglishContent")} value={missingEnglish.length} helpText={A("missingEnglishContentHelp")} />
        <AdminStatCard label={A("failedRecords")} value={failedJobs.length} helpText={A("failedRecordsHelp")} href="/admin/content/translation_jobs" />
        <AdminStatCard label={A("processing")} value={runningJobs.length} helpText={A("processingHelp")} href="/admin/content/translation_jobs" />
        <AdminStatCard label={A("needsReview")} value={completedJobs.length} helpText={A("needsReviewHelp")} />
        <AdminStatCard label={A("batchAvailable")} value={Math.min(missingEnglish.length, batchLimit)} helpText={formatA("batchAvailableHelp", { limit: String(batchLimit) })} />
      </div>

      {batchProgress && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">{A("batchProgressTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {batchBusy ? formatA("processingCurrent", { title: batchProgress.currentTitle || "-" }) : A("batchRoundCompleted")}
              </p>
            </div>
            <p className="text-sm font-semibold">
              {formatA("progressSummary", {
                done: String(batchProgress.done),
                total: String(batchProgress.total),
                success: String(batchProgress.success),
                failed: String(batchProgress.failed),
              })}
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${batchPercent}%` }} />
          </div>
          {batchProgress.failures.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold">{A("failureReasonsTitle")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {batchProgress.failures.slice(0, 6).map((failure) => <li key={failure}>{failure}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-xl font-bold">{A("qualityReminderTitle")}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-semibold">{A("prioritizePublishedTitle")}</p>
            <p className="mt-1 text-muted-foreground">{formatA("prioritizePublishedDescription", { count: String(publishedMissingEnglish) })}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-semibold">{A("machineTranslationReviewTitle")}</p>
            <p className="mt-1 text-muted-foreground">{A("machineTranslationReviewDescription")}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-semibold">{A("retryFailuresTitle")}</p>
            <p className="mt-1 text-muted-foreground">{A("retryFailuresDescription")}</p>
          </div>
        </div>
      </div>

      {reviewJobs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">{A("recentGeneratedTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{A("recentGeneratedDescription")}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
              <Link to="/admin/content/translation_jobs">{A("viewAllRecords")}</Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {reviewJobs.map((job) => {
              const href = buildRecordEditHref(job.table_name, job.record_id);
              return (
                <article key={job.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="font-semibold">{job.record_label || job.record_id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{job.table_name} · {job.regenerated_at ? new Date(job.regenerated_at).toLocaleString() : A("justGenerated")}</p>
                  {href && (
                    <Button asChild className="mt-3" size="sm" variant="outline">
                      <Link to={href}>{A("review")}</Link>
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-xl font-bold">{A("missingEnglishContent")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{A("missingEnglishSectionDescription")}</p>
      </div>

      <div className="grid gap-3">
        {missingEnglish.map((item) => {
          const key = `${item.table}:${item.id}`;
          return (
            <article key={key} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.title}</p>
                    <AdminStatusBadge status={item.status} />
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{item.tableLabel}</span>
                  </div>
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                    {formatA("missingFields", { fields: item.missingEnglish.map(getAdminHealthFieldLabel).join("、") })}
                  </p>
                </div>
                <div data-admin-card-actions className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={item.editHref}>{A("edit")}</Link>
                  </Button>
                  <Button type="button" size="sm" onClick={() => void generateEnglish(item.table, item.id, false)} disabled={busyId === key || batchBusy}>
                    {busyId === key ? A("generating") : A("autoGenerate")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void (async () => {
                        const confirmed = await adminConfirm({
                          title: A("forceDialogTitle"),
                          description: A("forceDialogDescription"),
                          confirmLabel: A("forceDialogConfirm"),
                        });
                        if (confirmed) {
                          void generateEnglish(item.table, item.id, true);
                        }
                      })();
                    }}
                    disabled={busyId === key || batchBusy}
                  >
                    {A("forceRegenerate")}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
        {missingEnglish.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">{A("noMissingEnglish")}</div>}
      </div>
    </div>
  );
}
