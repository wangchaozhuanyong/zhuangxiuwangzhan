import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileCheck2,
  HardDrive,
  History,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type HealthCheckValue = boolean | { ok?: boolean; count?: number; label?: string; message?: string } | string | number | null;

type TableCheck = {
  table: string;
  label: string;
  category: string;
  ok: boolean;
  count?: number;
  message?: string;
};

type HealthEventSummary = {
  id: string;
  event_type: string;
  severity: "debug" | "info" | "warn" | "error" | "critical";
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  age_hours?: number | null;
};

type BackupStatus = {
  ok: boolean;
  latest_backup: HealthEventSummary | null;
  latest_verify: HealthEventSummary | null;
  latest_restore_dry_run: HealthEventSummary | null;
  message: string;
};

type HealthPayload = {
  ok?: boolean;
  mode?: "admin" | "public";
  admin_role?: string | null;
  message?: string;
  checked_at?: string;
  checks?: Record<string, HealthCheckValue>;
  table_checks?: TableCheck[];
  backup_status?: BackupStatus | null;
  health_history?: HealthEventSummary[];
  reminders?: string[];
};

const RECENT_HOURS = 24 * 7;

const checkLabels: Record<string, string> = {
  edge_function: "Edge Function",
  storage_site_images: "图片存储桶",
};

const eventLabels: Record<string, string> = {
  backup_supabase_completed: "数据库和文件备份",
  backup_package_verified: "备份包验证",
  backup_restore_dry_run_completed: "恢复演练",
  system_health_check: "系统健康检查",
};

const statusClass = (ok: boolean) =>
  ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-destructive/25 bg-destructive/10 text-destructive";

const parseCheckOk = (value: HealthCheckValue) => {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && "ok" in value) return Boolean(value.ok);
  return Boolean(value);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "暂无记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间格式异常";
  return date.toLocaleString("zh-CN");
};

const formatAge = (hours?: number | null) => {
  if (typeof hours !== "number") return "时间未知";
  if (hours < 1) return "1 小时内";
  if (hours < 24) return `${Math.round(hours)} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
};

const describeCheck = (value: HealthCheckValue) => {
  if (value && typeof value === "object") {
    const parts = [];
    if ("count" in value && typeof value.count === "number") parts.push(`${value.count} 条`);
    if ("message" in value && value.message) parts.push(String(value.message));
    return parts.join("，") || (parseCheckOk(value) ? "正常" : "异常");
  }
  return String(value ?? "");
};

const getCheckLabel = (name: string, value: HealthCheckValue) => {
  if (value && typeof value === "object" && "label" in value && value.label) return String(value.label);
  return checkLabels[name] || name;
};

const readFunctionErrorPayload = async (error: unknown): Promise<HealthPayload | null> => {
  const response = (error as { context?: Response }).context;
  if (!response || typeof response.clone !== "function") return null;
  try {
    return (await response.clone().json()) as HealthPayload;
  } catch {
    return null;
  }
};

const getEventMetaLine = (event: HealthEventSummary | null) => {
  if (!event?.metadata) return "";
  const meta = event.metadata;
  const parts = [];
  if (typeof meta.backup_folder === "string") parts.push(`备份：${meta.backup_folder}`);
  if (typeof meta.table_count === "number") parts.push(`${meta.table_count} 张表`);
  if (typeof meta.total_rows === "number") parts.push(`${meta.total_rows} 行`);
  if (typeof meta.storage_file_count === "number") parts.push(`${meta.storage_file_count} 个文件`);
  if (meta.full_access === false) parts.push("非完整备份");
  return parts.join(" · ");
};

const getHistoryMessage = (event: HealthEventSummary) => {
  if (event.message.includes("passed")) return "本次检查通过";
  if (event.message.includes("attention")) return "本次检查需要处理";
  return eventLabels[event.event_type] || event.message;
};

const CheckRow = ({ name, value }: { name: string; value: HealthCheckValue }) => {
  const ok = parseCheckOk(value);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold">{getCheckLabel(name, value)}</p>
        <p className="mt-1 break-words text-xs text-muted-foreground">{describeCheck(value) || (ok ? "正常" : "异常")}</p>
      </div>
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(ok)}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {ok ? "正常" : "异常"}
      </span>
    </div>
  );
};

const TableCard = ({ item }: { item: TableCheck }) => (
  <div className="rounded-lg border border-border bg-background p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold">{item.label}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground">{item.category} · {item.table}</p>
      </div>
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.ok)}`}>
        {item.ok ? "可读取" : "异常"}
      </span>
    </div>
    <p className="mt-3 text-2xl font-bold">{item.ok ? item.count ?? 0 : "-"}</p>
    {item.message && <p className="mt-2 break-words text-xs text-destructive">{item.message}</p>}
  </div>
);

const BackupCard = ({
  title,
  event,
  icon,
}: {
  title: string;
  event: HealthEventSummary | null | undefined;
  icon: React.ReactNode;
}) => {
  const fresh = Boolean(event && typeof event.age_hours === "number" && event.age_hours <= RECENT_HOURS);
  const ok = fresh && event?.severity !== "error" && event?.severity !== "critical";
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-accent">{icon}</div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(ok)}`}>
          {ok ? "已记录" : "需确认"}
        </span>
      </div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{event ? `${formatDateTime(event.created_at)}，${formatAge(event.age_hours)}` : "还没有可读取的执行记录。"}</p>
      {event && <p className="mt-2 break-words text-xs text-muted-foreground">{getEventMetaLine(event)}</p>}
    </div>
  );
};

export default function AdminSystemHealth() {
  const healthQuery = useQuery({
    queryKey: ["admin", "system-health"],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase!.functions.invoke<HealthPayload>("health-check", { method: "GET" });
      if (error) {
        const payload = await readFunctionErrorPayload(error);
        if (payload) return payload;
        throw error;
      }
      return data || {};
    },
  });

  const payload = healthQuery.data;
  const tableChecks = useMemo(() => payload?.table_checks || [], [payload?.table_checks]);
  const reminders = payload?.reminders || [];
  const backupStatus = payload?.backup_status || null;
  const healthHistory = payload?.health_history || [];
  const overallOk = Boolean(payload?.ok);
  const isAdminMode = payload?.mode === "admin";

  const tableSummary = useMemo(() => {
    const failed = tableChecks.filter((item) => !item.ok).length;
    return { total: tableChecks.length, failed };
  }, [tableChecks]);

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
        description="集中检查后台、数据库、存储、日志、备份和恢复流程，方便上线前确认系统是否稳定。"
        helpText="绿色代表当前检查通过；如果出现黄色或红色，请优先处理异常提醒。"
        actions={
          <Button type="button" variant="outline" onClick={() => void healthQuery.refetch()} disabled={healthQuery.isFetching}>
            {healthQuery.isFetching ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
            {healthQuery.isFetching ? "检查中" : "重新检查"}
          </Button>
        }
      />

      <div className={`rounded-lg border p-4 ${statusClass(overallOk)}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {overallOk ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
            <div className="min-w-0">
              <p className="font-semibold">{overallOk ? "系统健康当前正常" : "系统健康需要处理"}</p>
              <p className="mt-1 text-sm">{payload?.checked_at ? `最后检查时间：${formatDateTime(payload.checked_at)}` : "正在读取健康检查结果。"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border bg-background/70 px-3 py-1">表检查 {tableSummary.total - tableSummary.failed}/{tableSummary.total}</span>
            <span className="rounded-full border bg-background/70 px-3 py-1">{isAdminMode ? "超级管理员完整报告" : "公开基础报告"}</span>
          </div>
        </div>
      </div>

      {!isAdminMode && payload && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">当前只拿到公开健康结果</p>
              <p className="mt-1 text-sm leading-6">完整报告需要超级管理员登录态传到 Edge Function。请确认当前账号是超级管理员，并重新检查。</p>
            </div>
          </div>
        </div>
      )}

      <AdminFormSection title="异常提醒" description="把最需要处理的问题集中放在这里，避免只看绿色卡片漏掉风险。" helpText="没有提醒不代表永远不会出问题，只代表本次检查没有发现明确异常。">
        {healthQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">正在检查...</p>
        ) : healthQuery.isError ? (
          <p className="text-sm text-destructive">健康检查失败：{healthQuery.error instanceof Error ? healthQuery.error.message : "未知错误"}</p>
        ) : reminders.length ? (
          <div className="space-y-3">
            {reminders.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="break-words leading-6">{item}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>本次没有发现需要立刻处理的异常。</p>
          </div>
        )}
      </AdminFormSection>

      <AdminFormSection title="线上服务检查" description="来自 Supabase Edge Function 的基础检查结果。" helpText="这里主要看 Edge Function 和图片存储桶是否正常。">
        <div className="space-y-3">
          {Object.entries(payload?.checks || {}).map(([name, value]) => (
            <CheckRow key={name} name={name} value={value} />
          ))}
        </div>
      </AdminFormSection>

      <AdminFormSection title="核心数据表检查" description="检查后台和业务关键表是否能读取，避免只检查 CMS 却漏掉客户数据。" helpText="这些数量不是业务报表，只用于判断表是否存在、权限是否正常、数据是否能读取。">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tableChecks.map((item) => (
            <TableCard key={item.table} item={item} />
          ))}
        </div>
      </AdminFormSection>

      <AdminFormSection title="备份和恢复状态" description="读取系统日志里的最近备份、备份验证和恢复演练记录。" helpText="这些记录来自 `backup:supabase`、`verify:backup` 和 `restore:backup:dry-run` 脚本。">
        <div className="grid gap-3 md:grid-cols-3">
          <BackupCard title="数据库和文件备份" event={backupStatus?.latest_backup} icon={<Database className="h-5 w-5" />} />
          <BackupCard title="备份包验证" event={backupStatus?.latest_verify} icon={<FileCheck2 className="h-5 w-5" />} />
          <BackupCard title="恢复演练" event={backupStatus?.latest_restore_dry_run} icon={<ShieldCheck className="h-5 w-5" />} />
        </div>
        <div className={`mt-3 rounded-lg border p-3 text-sm ${statusClass(Boolean(backupStatus?.ok))}`}>
          <div className="flex items-start gap-2">
            <HardDrive className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="break-words">{backupStatus?.message || "还没有读取到备份状态。运行备份、验证和恢复演练脚本后，这里会显示真实记录。"}</p>
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection title="健康检查历史" description="显示最近 5 次完整健康检查记录，方便判断问题是不是反复出现。" helpText="记录保存在 system_event_logs；公开访问不会写入历史记录，只有超级管理员完整检查会记录。">
        {healthHistory.length ? (
          <div className="space-y-3">
            {healthHistory.map((event) => {
              const ok = event.severity !== "warn" && event.severity !== "error" && event.severity !== "critical";
              return (
                <div key={event.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <History className="h-4 w-4 text-accent" />
                      <p className="font-semibold">{getHistoryMessage(event)}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      {formatDateTime(event.created_at)}，{formatAge(event.age_hours)}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(ok)}`}>{ok ? "通过" : "需处理"}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无健康检查历史。完成一次超级管理员完整检查后，这里会自动出现记录。</p>
        )}
      </AdminFormSection>
    </div>
  );
}
