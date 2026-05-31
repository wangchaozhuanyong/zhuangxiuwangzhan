import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, Database, HardDrive, ShieldCheck } from "lucide-react";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type HealthCheckValue = boolean | { ok?: boolean; count?: number; message?: string } | string | number | null;
type HealthPayload = {
  ok?: boolean;
  message?: string;
  checked_at?: string;
  checks?: Record<string, HealthCheckValue>;
};

const statusClass = (ok: boolean) =>
  ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-destructive/25 bg-destructive/10 text-destructive";

const parseCheckOk = (value: HealthCheckValue) => {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && "ok" in value) return Boolean(value.ok);
  return Boolean(value);
};

const describeCheck = (value: HealthCheckValue) => {
  if (value && typeof value === "object") {
    const parts = [];
    if ("count" in value && typeof value.count === "number") parts.push(`${value.count} 条`);
    if ("message" in value && value.message) parts.push(String(value.message));
    return parts.join("，") || JSON.stringify(value);
  }
  return String(value ?? "");
};

const CheckRow = ({ name, value }: { name: string; value: HealthCheckValue }) => {
  const ok = parseCheckOk(value);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{describeCheck(value) || (ok ? "正常" : "异常")}</p>
      </div>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(ok)}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {ok ? "正常" : "异常"}
      </span>
    </div>
  );
};

export default function AdminSystemHealth() {
  const healthQuery = useQuery({
    queryKey: ["admin", "system-health"],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase!.functions.invoke<HealthPayload>("health-check", { method: "GET" });
      if (error) throw error;
      return data || {};
    },
  });

  const tableQuery = useQuery({
    queryKey: ["admin", "system-health-counts"],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const tables = ["cms_pages", "cms_sections", "media_assets", "admin_audit_logs", "system_event_logs"] as const;
      const results = await Promise.all(
        tables.map(async (table) => {
          const { count, error } = await supabase!.from(table).select("id", { count: "exact", head: true });
          return { table, ok: !error, count: count ?? 0, message: error?.message || "" };
        }),
      );
      return results;
    },
  });

  const overallOk = useMemo(() => {
    if (healthQuery.isError || tableQuery.isError) return false;
    if (!healthQuery.data) return false;
    const checks = Object.values(healthQuery.data.checks || {});
    return Boolean(healthQuery.data.ok) && checks.every(parseCheckOk);
  }, [healthQuery.data, healthQuery.isError, tableQuery.isError]);

  if (!isSupabaseConfigured) {
    return (
      <AdminPageHeader
        title="系统健康"
        description="Supabase 环境变量还没配置，暂时不能检查线上数据库和存储。"
        helpText="这里用于检查后台底层服务是否正常。"
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="系统健康"
        description="集中检查后台、数据库、存储、日志和备份流程，方便上线前确认系统是否稳定。"
        helpText="绿色不代表永远不会出问题，但可以快速判断当前后台底层服务是否可用。"
        actions={
          <Button type="button" variant="outline" onClick={() => { void healthQuery.refetch(); void tableQuery.refetch(); }}>
            <Activity className="mr-2 h-4 w-4" />
            重新检查
          </Button>
        }
      />

      <div className={`rounded-lg border p-4 ${statusClass(overallOk)}`}>
        <div className="flex items-start gap-3">
          {overallOk ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : <AlertTriangle className="mt-0.5 h-5 w-5" />}
          <div>
            <p className="font-semibold">{overallOk ? "核心服务当前正常" : "核心服务需要检查"}</p>
            <p className="mt-1 text-sm">
              {healthQuery.data?.checked_at ? `最后检查时间：${new Date(healthQuery.data.checked_at).toLocaleString("zh-CN")}` : "正在读取健康检查结果。"}
            </p>
          </div>
        </div>
      </div>

      <AdminFormSection title="线上服务检查" description="来自 Supabase Edge Function 的健康检查结果。" helpText="检查 Edge Function、CMS 表、基础设置和图片存储桶是否正常。">
        <div className="space-y-3">
          {healthQuery.isLoading && <p className="text-sm text-muted-foreground">正在检查...</p>}
          {healthQuery.isError && <p className="text-sm text-destructive">健康检查失败：{healthQuery.error instanceof Error ? healthQuery.error.message : "未知错误"}</p>}
          {Object.entries(healthQuery.data?.checks || {}).map(([name, value]) => (
            <CheckRow key={name} name={name} value={value} />
          ))}
        </div>
      </AdminFormSection>

      <AdminFormSection title="后台数据量检查" description="快速看核心表是否能读取，以及数据量是否异常。" helpText="如果某个表读不到，通常说明权限、迁移或数据库状态有问题。">
        <div className="grid gap-3 md:grid-cols-2">
          {(tableQuery.data || []).map((item) => (
            <div key={item.table} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{item.table}</p>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.ok)}`}>{item.ok ? "可读取" : "异常"}</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{item.ok ? item.count : "-"}</p>
              {item.message && <p className="mt-1 text-xs text-destructive">{item.message}</p>}
            </div>
          ))}
        </div>
      </AdminFormSection>

      <AdminFormSection title="备份和恢复状态" description="后台不能只会保存内容，还要知道出问题后怎么恢复。" helpText="正式环境备份不要放在公开目录，也不要把 service role key 写进代码。">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <Database className="mb-3 h-5 w-5 text-accent" />
            <p className="font-semibold">数据库备份</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">发布前执行 `npm.cmd run backup:supabase`，有 service role key 时才能备份客户线索和后台日志。</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <HardDrive className="mb-3 h-5 w-5 text-accent" />
            <p className="font-semibold">文件备份</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">媒体文件会随备份脚本一起导出，图片上传只允许安全图片类型。</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <ShieldCheck className="mb-3 h-5 w-5 text-accent" />
            <p className="font-semibold">恢复验证</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">恢复前先跑 `npm.cmd run restore:backup:dry-run`，不要直接在正式库试恢复。</p>
          </div>
        </div>
      </AdminFormSection>
    </div>
  );
}
