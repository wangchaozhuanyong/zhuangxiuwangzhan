import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  adminSystemHealthText,
} from "@/i18n/adminSystemHealthText";
import { getAdminLang } from "@/lib/adminLocale";
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
  ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-destructive/25 bg-destructive/10 text-destructive";

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

const describeCheck = (value: HealthCheckValue, text: AdminSystemHealthText) => {
  if (value && typeof value === "object") {
    const parts = [];
    if ("count" in value && typeof value.count === "number") parts.push(formatText(text.countItems, { count: value.count }));
    if ("message" in value && value.message) parts.push(String(value.message));
    return parts.join("，") || (parseCheckOk(value) ? text.ok : text.abnormal);
  }
  return String(value ?? "");
};

const getCheckLabel = (name: string, value: HealthCheckValue, labels: Record<string, string>) => {
  if (value && typeof value === "object" && "label" in value && value.label) return String(value.label);
  return labels[name] || name;
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
  return parts.join(" · ");
};

const getHistoryMessage = (event: HealthEventSummary, text: AdminSystemHealthText, labels: Record<string, string>) => {
  if (event.message.includes("passed")) return text.historyPassed;
  if (event.message.includes("attention")) return text.historyAttention;
  return labels[event.event_type] || event.message;
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
        <p className="break-words text-sm font-semibold">{getCheckLabel(name, value, labels)}</p>
        <p className="mt-1 break-words text-xs text-muted-foreground">{describeCheck(value, text) || (ok ? text.ok : text.abnormal)}</p>
      </div>
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(ok)}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {ok ? text.ok : text.abnormal}
      </span>
    </div>
  );
};

const TableCard = ({ item, text }: { item: TableCheck; text: AdminSystemHealthText }) => (
  <div className="rounded-lg border border-border bg-background p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold">{item.label}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground">{item.category} · {item.table}</p>
      </div>
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.ok)}`}>
        {item.ok ? text.readable : text.abnormal}
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
  language,
  text,
}: {
  title: string;
  event: HealthEventSummary | null | undefined;
  icon: React.ReactNode;
  language: "en" | "zh";
  text: AdminSystemHealthText;
}) => {
  const fresh = Boolean(event && typeof event.age_hours === "number" && event.age_hours <= RECENT_HOURS);
  const ok = fresh && event?.severity !== "error" && event?.severity !== "critical";
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-accent">{icon}</div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(ok)}`}>
          {ok ? text.recorded : text.needsConfirmation}
        </span>
      </div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{event ? `${formatDateTime(event.created_at, language, text)}，${formatAge(event.age_hours, text)}` : text.noExecutionRecord}</p>
      {event && <p className="mt-2 break-words text-xs text-muted-foreground">{getEventMetaLine(event, text)}</p>}
    </div>
  );
};

export default function AdminSystemHealth() {
  const language = getAdminLang();
  const text = adminSystemHealthText[language];
  const checkLabels = adminSystemHealthCheckLabels[language];
  const eventLabels = adminSystemHealthEventLabels[language];
  const { toast } = useToast();
  const [attemptRetentionDays, setAttemptRetentionDays] = useState(30);
  const healthQuery = useQuery({
    queryKey: ["admin", "system-health"],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      try {
        return await fetchAdminSystemHealth<HealthPayload>();
      } catch (error) {
        const payload = await readFunctionErrorPayload(error);
        if (payload) return payload;
        throw error;
      }
    },
  });

  const payload = healthQuery.data;
  const tableChecks = useMemo(() => payload?.table_checks || [], [payload?.table_checks]);
  const reminders = payload?.reminders || [];
  const backupStatus = payload?.backup_status || null;
  const healthHistory = payload?.health_history || [];
  const overallOk = Boolean(payload?.ok);
  const isAdminMode = payload?.mode === "admin";

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

  const runAttemptsCleanup = async () => {
    const confirmed = await adminConfirm({
      title: text.cleanupConfirmTitle,
      description: formatText(text.cleanupConfirmDescription, { days: attemptRetentionDays }),
      confirmLabel: text.cleanupConfirmLabel,
    });
    if (!confirmed) return;
    cleanupAttemptsMutation.mutate();
  };

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
            <span className="rounded-full border bg-background/70 px-3 py-1">{text.tableCheckBadge}{tableSummary.total - tableSummary.failed}/{tableSummary.total}</span>
            <span className="rounded-full border bg-background/70 px-3 py-1">{isAdminMode ? text.adminFullReport : text.publicBasicReport}</span>
          </div>
        </div>
      </div>

      {!isAdminMode && payload && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
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
        ) : healthQuery.isError ? (
          <p className="text-sm text-destructive">
            {formatText(text.healthFailed, { message: formatUserFacingError(healthQuery.error, language, text.unknownError) })}
          </p>
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
            <TableCard key={item.table} item={item} text={text} />
          ))}
        </div>
      </AdminFormSection>

      <AdminFormSection title={text.backupSectionTitle} description={text.backupSectionDescription} helpText={text.backupSectionHelp}>
        <div className="grid gap-3 md:grid-cols-3">
          <BackupCard title={text.backupDatabaseTitle} event={backupStatus?.latest_backup} icon={<Database className="h-5 w-5" />} language={language} text={text} />
          <BackupCard title={text.backupVerifyTitle} event={backupStatus?.latest_verify} icon={<FileCheck2 className="h-5 w-5" />} language={language} text={text} />
          <BackupCard title={text.backupRestoreTitle} event={backupStatus?.latest_restore_dry_run} icon={<ShieldCheck className="h-5 w-5" />} language={language} text={text} />
        </div>
        <div className={`mt-3 rounded-lg border p-3 text-sm ${statusClass(Boolean(backupStatus?.ok))}`}>
          <div className="flex items-start gap-2">
            <HardDrive className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="break-words">{backupStatus?.message || text.backupStatusFallback}</p>
          </div>
        </div>
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
                      {formatDateTime(event.created_at, language, text)}，{formatAge(event.age_hours, text)}
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
