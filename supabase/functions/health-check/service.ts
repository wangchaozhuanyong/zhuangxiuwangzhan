import { BACKUP_RECENT_HOURS, adminTables, backupEventTypes, edgeFunctionChecks } from "./config.ts";
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
    message: "Health check is not available.",
    checked_at: checkedAt,
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
        ? "Recent backup, backup verification, and restore drill records are complete."
        : "Backup, verification, or restore drill records are incomplete. Run the release checklist again.",
    };
  } catch (error) {
    return {
      ok: false,
      latest_backup: null,
      latest_verify: null,
      latest_restore_dry_run: null,
      message: `Backup log read failed: ${error instanceof Error ? error.message : String(error)}`,
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

  if (!adminMode) {
    return {
      status: 200,
      body: {
        ok: true,
        mode: "public",
        message: "Health check endpoint is available.",
        checked_at: checkedAt,
        checks: {
          edge_function: checks.edge_function,
        },
      },
    };
  }

  const tableChecks = await Promise.all(adminTables.map((item) => checkTable(client, item)));
  const bucket = await getStorageBucketCheck(client, "site-images");
  checks.storage_site_images = bucket.error
    ? { ok: false, label: "Image storage bucket", message: bucket.error.message }
    : { ok: true, label: "Image storage bucket", message: "site-images bucket is readable." };

  const failedTables = tableChecks.filter((item) => !item.ok).map((item) => item.table);
  const failedChecks = Object.values(checks).filter(
    (item): item is CheckResult => typeof item === "object" && Boolean(item) && !item.ok,
  );
  const reminders = [
    ...tableChecks
      .filter((item) => !item.ok)
      .map((item) => `${item.label} read failed. Check migrations, permissions, or database status.`),
    ...failedChecks.map((item) => `${item.label} is abnormal: ${item.message || "Check Supabase configuration."}`),
  ];

  const backupStatus = await getBackupStatus(client);
  if (!backupStatus.ok) reminders.push(backupStatus.message);

  const checksOk = Object.values(checks).every((item) => (typeof item === "boolean" ? item : item.ok));
  const tablesOk = tableChecks.every((item) => item.ok);
  const backupsOk = Boolean(backupStatus.ok);
  const overallOk = checksOk && tablesOk && backupsOk;

  await logHealthCheck(client, overallOk, failedTables, reminders, checkedAt);
  const healthHistory = (await fetchHealthHistory(client)).map(summarizeEvent);

  return {
    status: overallOk ? 200 : 503,
    body: {
      ok: overallOk,
      mode: "admin",
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
