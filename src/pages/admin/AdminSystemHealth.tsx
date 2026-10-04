import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  Trash2,
} from "lucide-react";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  adminSystemHealthCheckLabels,
  adminSystemHealthEventLabels,
  adminSystemHealthTableLabels,
  adminSystemHealthText,
} from "@/i18n/adminSystemHealthText";
import { useAdminLang, type AdminLang } from "@/lib/adminLocale";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  cleanupAdminFormAttempts,
  fetchAdminSystemHealth,
} from "@/backend/modules/system/service/systemHealthService";
import { formatUserFacingError } from "@/lib/userFacingText";

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
  latest_restore_verified?: HealthEventSummary | null;
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

type FormAttemptsCleanupPayload = {
  ok?: boolean;
  error?: string;
  retention_days?: number;
  cutoff_at?: string;
  total_count?: number;
  eligible_count?: number;
  deleted_count?: number;
  recent_protected_count?: number;
};

const RECENT_HOURS = 24 * 7;

type AdminSystemHealthText = Record<keyof typeof adminSystemHealthText.en, string>;

const statusClass = (ok: boolean) =>
  ok ? "admin-tone-success" : "admin-tone-error";

const parseCheckOk = (value: HealthCheckValue) => {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && "ok" in value) return Boolean(value.ok);
  return Boolean(value);
};

const formatText = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, String(value)), text);

const formatDateTime = (value: string | null | undefined, language: "en" | "zh", text: AdminSystemHealthText) => {
  if (!value) return text.noRecord;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text.invalidTime;
  return date.toLocaleString(language === "en" ? "en-US" : "zh-CN");
};

const formatAge = (hours: number | null | undefined, text: AdminSystemHealthText) => {
  if (typeof hours !== "number") return text.unknownTime;
  if (hours < 1) return text.withinHour;
  if (hours < 24) return formatText(text.hoursAgo, { hours: Math.round(hours) });
  return formatText(text.daysAgo, { days: Math.round(hours / 24) });
};

const describeCheck = (name: string, value: HealthCheckValue, text: AdminSystemHealthText) => {
  const ok = parseCheckOk(value);
  const message = !ok ? text.checkNeedsAction : name === "edge_function" ? text.edgeAvailable
    : name === "storage_site_images" ? text.storageReadable : text.checkPassed;
  if (value && typeof value === "object") {
    return typeof value.count === "number" ? `${formatText(text.countItems, { count: value.count })}${text.listSeparator}${message}` : message;
  }
  return message;
};

const getCheckLabel = (name: string, labels: Record<string, string>, text: AdminSystemHealthText) =>
  labels[name] || text.unknownCheck;

const getTableLabels = (table: string, language: AdminLang, text: AdminSystemHealthText) =>
  (adminSystemHealthTableLabels[language] as Record<string, { label: string; category: string }>)[table]
  || { label: text.unknownTable, category: text.unknownGroup };

const getReminderText = (message: string, tables: TableCheck[], backup: BackupStatus | null, language: AdminLang, text: AdminSystemHealthText) => {
  if (message === text.backupStatusFallback) return text.backupStatusFallback;
  if (backup && message === backup.message) return backup.ok ? text.backupRecordsComplete : text.backupRecordsIncomplete;
  const table = tables.find((item) => message.startsWith(`${item.label}:`) || message.startsWith(`${item.label} read failed.`));
  if (table) return `${getTableLabels(table.table, language, text).label}: ${formatUserFacingError(table.message, language, text.tableReadFailed)}`;
  return formatUserFacingError(message, language, text.unknownReminder);
};

const readFunctionJsonPayload = async <T,>(error: unknown): Promise<T | null> => {
  const response = (error as { context?: Response }).context;
  if (!response || typeof response.clone !== "function") return null;
  try {
    return (await response.clone().json()) as T;
  } catch {
    return null;
  }
};

const readFunctionErrorPayload = (error: unknown): Promise<HealthPayload | null> =>
  readFunctionJsonPayload<HealthPayload>(error);

const getEventMetaLine = (event: HealthEventSummary | null, text: AdminSystemHealthText) => {
  if (!event?.metadata) return "";
  const meta = event.metadata;
  const parts = [];
  if (typeof meta.backup_folder === "string") parts.push(formatText(text.backupMetaFolder, { folder: meta.backup_folder }));
  if (typeof meta.table_count === "number") parts.push(formatText(text.tableCount, { count: meta.table_count }));
  if (typeof meta.total_rows === "number") parts.push(formatText(text.rowCount, { count: meta.total_rows }));
  if (typeof meta.storage_file_count === "number") parts.push(formatText(text.storageFileCount, { count: meta.storage_file_count }));
  if (meta.full_access === false) parts.push(text.incompleteBackup);
  if (event.event_type === "backup_restore_verified" && meta.original_admin_login_verified === false) parts.push(text.originalPasswordPending);
  return parts.join(" · ");
};

const RESTORE_SCOPES = ["data_verified", "schema_verified", "auth_verified", "media_verified", "original_admin_login_verified", "original_admin_mfa_verified", "permissions_verified"];
const recentSuccessfulEvent = (event: HealthEventSummary | null | undefined) => Boolean(event
  && typeof event.age_hours === "number" && event.age_hours <= RECENT_HOURS
  && (event.severity === "info" || event.severity === "debug") && event.metadata?.full_access !== false);
const completeRecovery = (status: BackupStatus) => {
  const folder = status.latest_backup?.metadata?.backup_folder;
  const restore = status.latest_restore_verified;
  return typeof folder === "string" && folder.length > 0
    && status.latest_verify?.metadata?.backup_folder === folder && restore?.metadata?.backup_folder === folder
    && [status.latest_backup, status.latest_verify, restore].every(recentSuccessfulEvent)
    && RESTORE_SCOPES.every((scope) => restore?.metadata?.[scope] === true);
};

const getHistoryMessage = (event: HealthEventSummary, text: AdminSystemHealthText, labels: Record<string, string>) => {
  if (event.event_type === "system_health_check") return event.severity === "info" || event.severity === "debug" ? text.historyPassed : text.historyAttention;
  return labels[event.event_type] || text.unknownEvent;
};

const CheckRow = ({
  name,
  value,
  labels,
  text,
}: {
  name: string;
  value: HealthCheckValue;
  labels: Record<string, string>;
  text: AdminSystemHealthText;
}) => {
  const ok = parseCheckOk(value);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold">{getCheckLabel(name, labels, text)}</p>
        <p className="mt-1 break-words text-xs text-muted-foreground">{describeCheck(name, value, text)}</p>
      </div>
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(ok)}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {ok ? text.ok : text.abnormal}
      </span>
    </div>
  );
};

const TableCard = ({ item, text, language }: { item: TableCheck; text: AdminSystemHealthText; language: AdminLang }) => (
  <div className="rounded-lg border border-border bg-background p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold">{getTableLabels(item.table, language, text).label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{getTableLabels(item.table, language, text).category}</p>
      </div>
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.ok)}`}>
        {item.ok ? text.readable : text.abnormal}
      </span>
    </div>
    <p className="mt-3 text-2xl font-bold">{item.ok ? item.count ?? 0 : "-"}</p>
    {item.message && <p className="mt-2 break-words text-xs admin-text-error">{formatUserFacingError(item.message, language, text.tableReadFailed)}</p>}
  </div>
);

const BackupCard = ({
  title,
  event,
  icon,
  language,
  text,
}: {
  title: string;
  event: HealthEventSummary | null | undefined;
  icon: React.ReactNode;
  language: "en" | "zh";
  text: AdminSystemHealthText;
}) => {
  const accepted = event?.event_type !== "backup_restore_verified" || RESTORE_SCOPES.every((scope) => event.metadata?.[scope] === true);
  const ok = recentSuccessfulEvent(event) && accepted;
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-accent">{icon}</div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(ok)}`}>
          {ok ? text.recorded : text.needsConfirmation}
        </span>
      </div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{event ? `${formatDateTime(event.created_at, language, text)}${text.listSeparator}${formatAge(event.age_hours, text)}` : text.noExecutionRecord}</p>
      {event && <p className="mt-2 break-words text-xs text-muted-foreground">{getEventMetaLine(event, text)}</p>}
    </div>
  );
};

export default function AdminSystemHealth() {
  const { protectSubmission, isSubmitting } = useSubmissionLock();
  useUnsavedChangesWarning(isSubmitting);
  const language = useAdminLang();
  const text = adminSystemHealthText[language];
  const checkLabels = adminSystemHealthCheckLabels[language];
  const eventLabels = adminSystemHealthEventLabels[language];
  const { toast } = useToast();
  const [attemptRetentionDays, setAttemptRetentionDays] = useState(30);
  const healthQuery = useQuery({
    queryKey: ["admin", "system-health"],
    enabled: isSupabaseConfigured,
    queryFn: async ({ signal }) => {
      try {
        return await fetchAdminSystemHealth<HealthPayload>(signal);
      } catch (error) {
        const payload = await readFunctionErrorPayload(error);
        if (payload) return payload;
        throw error;
      }
    },
  });

  const payload = healthQuery.data;
  const tableChecks = useMemo(() => payload?.table_checks || [], [payload?.table_checks]);
  const rawBackupStatus = payload?.backup_status || null;
  const backupStatus = rawBackupStatus ? { ...rawBackupStatus, ok: rawBackupStatus.ok && completeRecovery(rawBackupStatus) } : null;
  const healthHistory = payload?.health_history || [];
  const isAdminMode = payload?.mode === "admin";
  const overallOk = Boolean(payload?.ok) && (!isAdminMode || Boolean(backupStatus?.ok));
  const reminders = [...(payload?.reminders || [])];
  if (isAdminMode && !backupStatus?.ok) {
    const reminder = backupStatus?.message || text.backupStatusFallback;
    if (!reminders.includes(reminder)) reminders.push(reminder);
  }

  const cleanupAttemptsMutation = useMutation({
    mutationFn: async () => {
      try {
        return await cleanupAdminFormAttempts<FormAttemptsCleanupPayload>(attemptRetentionDays);
      } catch (error) {
        const payload = await readFunctionJsonPayload<FormAttemptsCleanupPayload>(error);
        throw new Error(formatUserFacingError(payload?.error || error, language, text.cleanupFailureFallback));
      }
    },
    onSuccess: (data) => {
      toast({
        title: text.cleanupSuccessTitle,
        description: formatText(text.cleanupSuccessDescription, {
          deleted: data.deleted_count ?? 0,
          protected: data.recent_protected_count ?? 0,
        }),
      });
      void healthQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: text.cleanupFailureTitle,
        description: formatUserFacingError(error, language, text.cleanupFailureFallback),
        variant: "destructive",
      });
    },
  });

  const runAttemptsCleanup = protectSubmission("cleanup", async () => {
    const confirmed = await adminConfirm({
      title: text.cleanupConfirmTitle,
      description: formatText(text.cleanupConfirmDescription, { days: attemptRetentionDays }),
      confirmLabel: text.cleanupConfirmLabel,
    });
    if (!confirmed) return;
    await cleanupAttemptsMutation.mutateAsync();
  });

  const tableSummary = useMemo(() => {
    const failed = tableChecks.filter((item) => !item.ok).length;
    return { total: tableChecks.length, failed };
  }, [tableChecks]);

  if (!isSupabaseConfigured) {
    return (
      <AdminPageHeader
        title={text.pageTitle}
        description={text.noSupabaseDescription}
        helpText={text.noSupabaseHelp}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={text.pageTitle}
        description={text.pageDescription}
        helpText={text.pageHelp}
        actions={
          <Button type="button" variant="outline" onClick={() => void healthQuery.refetch()} disabled={healthQuery.isFetching}>
            {healthQuery.isFetching ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
            {healthQuery.isFetching ? text.checking : text.recheck}
          </Button>
        }
      />

      <div className={`rounded-lg border p-4 ${statusClass(overallOk)}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {overallOk ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
            <div className="min-w-0">
              <p className="font-semibold">{overallOk ? text.overallOk : text.overallNeedsAction}</p>
              <p className="mt-1 text-sm">{payload?.checked_at ? formatText(text.lastChecked, { time: formatDateTime(payload.checked_at, language, text) }) : text.readingHealth}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border admin-tone-badge px-3 py-1">{text.tableCheckBadge}{tableSummary.total - tableSummary.failed}/{tableSummary.total}</span>
            <span className="rounded-full border admin-tone-badge px-3 py-1">{isAdminMode ? text.adminFullReport : text.publicBasicReport}</span>
          </div>
        </div>
      </div>

      {!isAdminMode && payload && (
        <div className="rounded-lg border p-4 admin-tone-warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{text.publicOnlyTitle}</p>
              <p className="mt-1 text-sm leading-6">{text.publicOnlyDescription}</p>
            </div>
          </div>
        </div>
      )}

      <AdminFormSection title={text.alertsTitle} description={text.alertsDescription} helpText={text.alertsHelp}>
        {healthQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{text.checkingEllipsis}</p>
        ) : healthQuery.isInitialError ? (
          <p className="text-sm admin-text-error">
            {formatText(text.healthFailed, { message: formatUserFacingError(healthQuery.error, language, text.unknownError) })}
          </p>
        ) : reminders.length ? (
          <div className="space-y-3">
            {reminders.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border p-3 text-sm admin-tone-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="break-words leading-6">{getReminderText(item, tableChecks, backupStatus, language, text)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 rounded-lg border p-3 text-sm admin-tone-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{text.noAlerts}</p>
          </div>
        )}
      </AdminFormSection>

      <AdminFormSection title={text.onlineServiceTitle} description={text.onlineServiceDescription} helpText={text.onlineServiceHelp}>
        <div className="space-y-3">
          {Object.entries(payload?.checks || {}).map(([name, value]) => (
            <CheckRow key={name} name={name} value={value} labels={checkLabels} text={text} />
          ))}
        </div>
      </AdminFormSection>

      <AdminFormSection title={text.cleanupSectionTitle} description={text.cleanupSectionDescription} helpText={text.cleanupSectionHelp}>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl min-w-0">
            <label htmlFor="form-attempt-retention-days" className="mb-1.5 block text-sm font-medium">{text.retentionDays}</label>
            <Input
              id="form-attempt-retention-days"
              type="number"
              min={2}
              max={365}
              value={attemptRetentionDays}
              onChange={(event) => {
                const next = Number(event.target.value);
                setAttemptRetentionDays(Number.isFinite(next) ? Math.min(365, Math.max(2, Math.floor(next))) : 30);
              }}
              className="w-full md:w-40"
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{text.retentionHelp}</p>
          </div>
          <Button type="button" variant="outline" className="w-full md:w-auto" onClick={() => void runAttemptsCleanup()} disabled={!isAdminMode || cleanupAttemptsMutation.isPending}>
            {cleanupAttemptsMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {cleanupAttemptsMutation.isPending ? text.cleanupInProgress : text.cleanupButton}
          </Button>
        </div>
        {!isAdminMode && <p className="mt-2 text-xs text-muted-foreground">{text.cleanupDisabled}</p>}
      </AdminFormSection>

      <AdminFormSection title={text.tableSectionTitle} description={text.tableSectionDescription} helpText={text.tableSectionHelp}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tableChecks.map((item) => (
            <TableCard key={item.table} item={item} text={text} language={language} />
          ))}
        </div>
      </AdminFormSection>

      <AdminFormSection title={text.backupSectionTitle} description={text.backupSectionDescription} helpText={text.backupSectionHelp}>
        <div className="grid gap-3 md:grid-cols-3">
          <BackupCard title={text.backupDatabaseTitle} event={backupStatus?.latest_backup} icon={<Database className="h-5 w-5" />} language={language} text={text} />
          <BackupCard title={text.backupVerifyTitle} event={backupStatus?.latest_verify} icon={<FileCheck2 className="h-5 w-5" />} language={language} text={text} />
          <BackupCard title={text.backupRestoreTitle} event={backupStatus?.latest_restore_dry_run} icon={<ShieldCheck className="h-5 w-5" />} language={language} text={text} />
          <BackupCard title={text.backupActualRestoreTitle} event={backupStatus?.latest_restore_verified} icon={<ShieldCheck className="h-5 w-5" />} language={language} text={text} />
        </div>
        <div className={`mt-3 rounded-lg border p-3 text-sm ${statusClass(Boolean(backupStatus?.ok))}`}>
          <div className="flex items-start gap-2">
            <HardDrive className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="break-words">{backupStatus ? backupStatus.ok ? text.backupRecordsComplete : text.backupRecordsIncomplete : text.backupStatusFallback}</p>
          </div>
        </div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{text.backupScopeNote}</p>
      </AdminFormSection>

      <AdminFormSection title={text.historyTitle} description={text.historyDescription} helpText={text.historyHelp}>
        {healthHistory.length ? (
          <div className="space-y-3">
            {healthHistory.map((event) => {
              const ok = event.severity !== "warn" && event.severity !== "error" && event.severity !== "critical";
              return (
                <div key={event.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <History className="h-4 w-4 text-accent" />
                      <p className="font-semibold">{getHistoryMessage(event, text, eventLabels)}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      {formatDateTime(event.created_at, language, text)}{text.listSeparator}{formatAge(event.age_hours, text)}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(ok)}`}>{ok ? text.passed : text.needsAction}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{text.noHistory}</p>
        )}
      </AdminFormSection>
    </div>
  );
}
