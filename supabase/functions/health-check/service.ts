import { BACKUP_RECENT_HOURS, adminTables, backupEventTypes, edgeFunctionChecks, publicTables } from "./config.ts";
import {
  checkTable,
  fetchBackupEvents,
  fetchHealthHistory,
  getAdminRole,
  getStorageBucketCheck,
  insertHealthCheckLog,
} from "./repository.ts";
import type { BackupStatus, CheckResult, HealthCheckResult, HealthClient, SystemEventRow, SystemEventSummary } from "./types.ts";

export const getBearerToken = (req: Request) => {
  const authorization = req.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
};

export const missingServerCredentialsResult = (checkedAt: string): HealthCheckResult => ({
  status: 500,
  body: {
    ok: false,
    mode: "public",
    message: "Supabase server credentials are not configured.",
    checked_at: checkedAt,
    checks: edgeFunctionChecks(),
    table_checks: [],
    reminders: ["Supabase Edge Function 缺少服务端密钥，无法检查数据库。"],
  },
});

const hoursSince = (value?: string) => {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round(((Date.now() - time) / 3_600_000) * 10) / 10);
};

const summarizeEvent = (row: SystemEventRow): SystemEventSummary => ({
  id: row.id,
  event_type: row.event_type,
  severity: row.severity,
  source: row.source,
  message: row.message,
  metadata: row.metadata || {},
  created_at: row.created_at,
  age_hours: hoursSince(row.created_at),
});

const isRecent = (event: SystemEventSummary | null, maxHours = BACKUP_RECENT_HOURS) =>
  Boolean(event && typeof event.age_hours === "number" && event.age_hours <= maxHours);

const getBackupStatus = async (client: HealthClient): Promise<BackupStatus> => {
  try {
    const events = (await fetchBackupEvents(client, backupEventTypes)).map(summarizeEvent);
    const latestBackup = events.find((event) => event.event_type === "backup_supabase_completed") || null;
    const latestVerify = events.find((event) => event.event_type === "backup_package_verified") || null;
    const latestRestoreDryRun = events.find((event) => event.event_type === "backup_restore_dry_run_completed") || null;
    const ok = isRecent(latestBackup) && isRecent(latestVerify) && isRecent(latestRestoreDryRun);

    return {
      ok,
      latest_backup: latestBackup,
      latest_verify: latestVerify,
      latest_restore_dry_run: latestRestoreDryRun,
      message: ok
        ? "最近备份、备份验证和恢复演练都有记录。"
        : "备份、验证或恢复演练记录不完整，建议按发布清单重新执行。",
    };
  } catch (error) {
    return {
      ok: false,
      latest_backup: null,
      latest_verify: null,
      latest_restore_dry_run: null,
      message: `备份日志读取失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

const logHealthCheck = async (
  client: HealthClient,
  ok: boolean,
  failedTables: string[],
  reminders: string[],
  checkedAt: string,
) => {
  try {
    await insertHealthCheckLog(client, ok, failedTables, reminders, checkedAt);
  } catch {
    // Health responses should not fail only because logging failed.
  }
};

export async function runHealthCheck(req: Request, client: HealthClient, checkedAt: string): Promise<HealthCheckResult> {
  const checks: Record<string, CheckResult | boolean> = edgeFunctionChecks();
  const adminRole = await getAdminRole(client, getBearerToken(req));
  const adminMode = adminRole === "super_admin";
  const tableDefinitions = adminMode ? adminTables : publicTables;
  const tableChecks = await Promise.all(tableDefinitions.map((item) => checkTable(client, item)));

  if (!adminMode) {
    for (const item of tableChecks) {
      checks[item.table] = {
        ok: item.ok,
        label: item.label,
        count: item.count,
        message: item.message,
      };
    }
  }

  const bucket = await getStorageBucketCheck(client, "site-images");
  checks.storage_site_images = bucket.error
    ? { ok: false, label: "图片存储桶", message: bucket.error.message }
    : { ok: true, label: "图片存储桶", message: "site-images 存储桶可读取。" };

  let backupStatus: BackupStatus | null = null;
  let healthHistory: SystemEventSummary[] = [];
  const failedTables = tableChecks.filter((item) => !item.ok).map((item) => item.table);
  const failedChecks = Object.values(checks).filter(
    (item): item is CheckResult => typeof item === "object" && Boolean(item) && !item.ok,
  );
  const reminders = [
    ...tableChecks.filter((item) => !item.ok).map((item) => `${item.label} 读取失败，请检查迁移、权限或数据库状态。`),
    ...failedChecks.map((item) => `${item.label} 异常：${item.message || "请检查 Supabase 配置。"}`),
  ];

  if (adminMode) {
    backupStatus = await getBackupStatus(client);
    if (!backupStatus.ok) reminders.push(backupStatus.message);
  }

  const checksOk = Object.values(checks).every((item) => (typeof item === "boolean" ? item : item.ok));
  const tablesOk = tableChecks.every((item) => item.ok);
  const backupsOk = adminMode ? Boolean(backupStatus?.ok) : true;
  const overallOk = checksOk && tablesOk && backupsOk;

  if (adminMode) {
    await logHealthCheck(client, overallOk, failedTables, reminders, checkedAt);
    healthHistory = (await fetchHealthHistory(client)).map(summarizeEvent);
  }

  return {
    status: overallOk ? 200 : 503,
    body: {
      ok: overallOk,
      mode: adminMode ? "admin" : "public",
      admin_role: adminRole,
      message: overallOk ? "System health check passed." : "One or more health checks need attention.",
      checked_at: checkedAt,
      checks,
      table_checks: tableChecks,
      backup_status: backupStatus,
      health_history: healthHistory,
      reminders,
    },
  };
}
