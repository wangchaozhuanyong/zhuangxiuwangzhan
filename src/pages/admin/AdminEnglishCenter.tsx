import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getAdminHealthFieldLabel, useAdminContentHealth, useAdminTranslationJobs } from "@/lib/adminQueries";
import { friendlyTranslationError, translationEnabledTables } from "@/lib/adminTranslation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type BatchProgress = {
  total: number;
  done: number;
  success: number;
  failed: number;
  currentTitle: string;
  failures: string[];
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
    if (!isSupabaseConfigured || !supabase) return false;
    const key = `${table}:${id}`;
    setBusyId(key);
    const { error } = await supabase.functions.invoke("generate-english-content", {
      body: { table, id, force },
    });
    setBusyId(null);

    if (error) {
      toast({ title: "英文生成失败", description: friendlyTranslationError(error.message), variant: "destructive" });
      return false;
    }
    toast({ title: force ? "已强制重新生成英文" : "已发起自动英文生成" });
    await refreshTranslationData();
    return true;
  };

  const batchGenerate = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const targets = missingEnglish.slice(0, batchLimit);
    if (!targets.length) return;
    setBatchBusy(true);
    setBatchProgress({ total: targets.length, done: 0, success: 0, failed: 0, currentTitle: targets[0]?.title || "", failures: [] });
    let successCount = 0;
    let failedCount = 0;

    for (const item of targets) {
      setBatchProgress((current) => current ? { ...current, currentTitle: item.title } : current);
      const { error } = await supabase.functions.invoke("generate-english-content", {
        body: { table: item.table, id: item.id, force: false },
      });
      if (error) {
        failedCount += 1;
      } else {
        successCount += 1;
      }
      setBatchProgress((current) => {
        if (!current) return current;
        const reason = error ? `${item.title}：${friendlyTranslationError(error.message)}` : "";
        return {
          ...current,
          done: current.done + 1,
          success: current.success + (error ? 0 : 1),
          failed: current.failed + (error ? 1 : 0),
          failures: reason ? [...current.failures, reason] : current.failures,
        };
      });
    }
    setBatchBusy(false);
    toast({ title: `批量英文生成完成：成功 ${successCount} 条，失败 ${failedCount} 条。` });
    await refreshTranslationData();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="英文生成中心"
        description="这里专门处理英文站内容。系统会找出缺英文的服务、案例、材料、博客和页面内容，你可以单条生成，也可以批量生成。"
        helpText="默认只填空的英文字段，不覆盖人工改过的英文。强制重新生成才会覆盖已有英文。"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? "扫描中..." : "重新扫描"}
            </Button>
            <Button type="button" onClick={() => void batchGenerate()} disabled={batchBusy || missingEnglish.length === 0}>
              {batchBusy ? `生成中 ${batchPercent}%` : "批量生成缺失英文"}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="缺英文内容" value={missingEnglish.length} helpText="这些内容的英文标题、摘要或正文还没补齐。" />
        <AdminStatCard label="失败记录" value={failedJobs.length} helpText="最近自动英文生成失败的记录数量。" href="/admin/content/translation_jobs" />
        <AdminStatCard label="处理中" value={runningJobs.length} helpText="正在排队或生成中的英文任务数量。" href="/admin/content/translation_jobs" />
        <AdminStatCard label="待人工复核" value={completedJobs.length} helpText="机器已经生成过英文，建议人工抽查标题、正文和 SEO。" />
        <AdminStatCard label="可批量处理" value={Math.min(missingEnglish.length, batchLimit)} helpText={`为了避免一次请求太多，批量按钮每次最多处理 ${batchLimit} 条。`} />
      </div>

      {batchProgress && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">批量生成进度</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {batchBusy ? `正在处理：${batchProgress.currentTitle || "-"}` : "本轮批量生成已完成。"}
              </p>
            </div>
            <p className="text-sm font-semibold">
              {batchProgress.done}/{batchProgress.total} · 成功 {batchProgress.success} · 失败 {batchProgress.failed}
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${batchPercent}%` }} />
          </div>
          {batchProgress.failures.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold">本轮失败原因</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {batchProgress.failures.slice(0, 6).map((failure) => <li key={failure}>{failure}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-xl font-bold">质量检查提醒</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-semibold">优先处理已发布内容</p>
            <p className="mt-1 text-muted-foreground">当前已发布但缺英文：{publishedMissingEnglish} 条。英文站会优先受这些内容影响。</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-semibold">机器翻译需要人工看一眼</p>
            <p className="mt-1 text-muted-foreground">自动英文适合快速补齐，正式 SEO 标题和描述建议人工复核。</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-sm">
            <p className="font-semibold">失败可以集中重试</p>
            <p className="mt-1 text-muted-foreground">失败记录请到翻译记录页按原因分组处理，支持一键重试失败项。</p>
          </div>
        </div>
      </div>

      {reviewJobs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">最近生成，建议人工复核</h2>
              <p className="mt-1 text-sm text-muted-foreground">点“去复核”会回到原内容编辑页，检查英文标题、正文和 SEO 是否自然。</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/content/translation_jobs">查看全部记录</Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {reviewJobs.map((job) => {
              const href = buildRecordEditHref(job.table_name, job.record_id);
              return (
                <article key={job.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="font-semibold">{job.record_label || job.record_id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{job.table_name} · {job.regenerated_at ? new Date(job.regenerated_at).toLocaleString() : "刚生成"}</p>
                  {href && (
                    <Button asChild className="mt-3" size="sm" variant="outline">
                      <Link to={href}>去复核</Link>
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-xl font-bold">缺英文内容</h2>
        <p className="mt-1 text-sm text-muted-foreground">先处理已发布内容，再处理草稿内容。英文生成完成后，可以回到原编辑页手动微调。</p>
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
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">缺失字段：{item.missingEnglish.map(getAdminHealthFieldLabel).join("、")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={item.editHref}>编辑</Link>
                  </Button>
                  <Button type="button" size="sm" onClick={() => void generateEnglish(item.table, item.id, false)} disabled={busyId === key || batchBusy}>
                    {busyId === key ? "生成中..." : "自动生成英文"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm("这会覆盖已有英文内容，确定要强制重新生成吗？")) {
                        void generateEnglish(item.table, item.id, true);
                      }
                    }}
                    disabled={busyId === key || batchBusy}
                  >
                    强制重新生成
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
        {missingEnglish.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">暂时没有缺英文的内容。</div>}
      </div>
    </div>
  );
}
