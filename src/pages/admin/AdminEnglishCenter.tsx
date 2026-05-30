import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAdminContentHealth, useAdminTranslationJobs } from "@/lib/adminQueries";
import { translationEnabledTables } from "@/lib/adminTranslation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function AdminEnglishCenter() {
  const queryClient = useQueryClient();
  const { data: items = [], isFetching, refetch } = useAdminContentHealth();
  const { data: jobs = [] } = useAdminTranslationJobs(30);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const missingEnglish = useMemo(
    () => items.filter((item) => item.missingEnglish.length > 0 && translationEnabledTables.some((table) => table === item.table)),
    [items],
  );
  const failedJobs = jobs.filter((job) => job.status === "failed");

  const generateEnglish = async (table: string, id: string, force = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    const key = `${table}:${id}`;
    setBusyId(key);
    const { error } = await supabase.functions.invoke("generate-english-content", {
      body: { table, id, force },
    });
    setBusyId(null);

    if (error) {
      toast({ title: "英文生成失败", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: force ? "已强制重新生成英文" : "已发起自动英文生成" });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "content_health"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "translation_jobs"] }),
    ]);
  };

  const batchGenerate = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const targets = missingEnglish.slice(0, 20);
    if (!targets.length) return;
    setBatchBusy(true);
    for (const item of targets) {
      await supabase.functions.invoke("generate-english-content", {
        body: { table: item.table, id: item.id, force: false },
      });
    }
    setBatchBusy(false);
    toast({ title: `已发起 ${targets.length} 条英文生成` });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "content_health"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "translation_jobs"] }),
    ]);
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
              {batchBusy ? "生成中..." : "批量生成缺失英文"}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard label="缺英文内容" value={missingEnglish.length} helpText="这些内容的英文标题、摘要或正文还没补齐。" />
        <AdminStatCard label="失败记录" value={failedJobs.length} helpText="最近自动英文生成失败的记录数量。" href="/admin/content/translation_jobs" />
        <AdminStatCard label="可批量处理" value={Math.min(missingEnglish.length, 20)} helpText="为了避免一次请求太多，批量按钮每次最多处理 20 条。" />
      </div>

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
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">缺失字段：{item.missingEnglish.join("、")}</p>
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
