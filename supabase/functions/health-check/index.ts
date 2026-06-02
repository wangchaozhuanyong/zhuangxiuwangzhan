import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Severity = "debug" | "info" | "warn" | "error" | "critical";

type CheckResult = {
  ok: boolean;
  label: string;
  message?: string;
  count?: number;
};

type TableCheck = CheckResult & {
  table: string;
  category: string;
};

type SystemEventRow = {
  id: string;
  event_type: string;
  severity: Severity;
  source: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type SystemEventSummary = {
  id: string;
  event_type: string;
  severity: Severity;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  age_hours: number | null;
};

type BackupStatus = {
  ok: boolean;
  latest_backup: SystemEventSummary | null;
  latest_verify: SystemEventSummary | null;
  latest_restore_dry_run: SystemEventSummary | null;
  message: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json; charset=utf-8",
};

const BACKUP_RECENT_HOURS = 24 * 7;

const publicTables = [
  { table: "cms_pages", label: "CMS 页面", category: "公开内容" },
  { table: "site_settings", label: "网站基础设置", category: "基础配置" },
];

const adminTables = [
  { table: "site_settings", label: "网站基础设置", category: "基础配置" },
  { table: "cms_pages", label: "CMS 页面", category: "内容系统" },
  { table: "cms_sections", label: "CMS 区块", category: "内容系统" },
  { table: "cms_content_entries", label: "CMS 内容项", category: "内容系统" },
  { table: "services", label: "服务项目", category: "业务内容" },
  { table: "projects", label: "项目案例", category: "业务内容" },
  { table: "materials", label: "材料库", category: "业务内容" },
  { table: "blog_posts", label: "博客文章", category: "业务内容" },
  { table: "media_assets", label: "媒体资产", category: "文件资源" },
  { table: "leads", label: "客户线索", category: "客户数据" },
  { table: "quote_requests", label: "报价请求", category: "客户数据" },
  { table: "notification_settings", label: "通知设置", category: "系统配置" },
  { table: "admin_users", label: "管理员账户", category: "权限系统" },
  { table: "system_event_logs", label: "系统日志", category: "运维日志" },
];

const backupEventTypes = [
  "backup_supabase_completed",
  "backup_package_verified",
  "backup_restore_dry_run_completed",
];

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });

const getBearerToken = (req: Request) => {
  const authorization = req.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
};

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

const checkTable = async (supabase: ReturnType<typeof createClient>, item: { table: string; label: string; category: string }): Promise<TableCheck> => {
  const { count, error } = await supabase.from(item.table).select("id", { count: "exact", head: true });
  return {
    table: item.table,
    label: item.label,
    category: item.category,
    ok: !error,
    count: count ?? 0,
    message: error?.message || "",
  };
};

const getAdminRole = async (supabase: ReturnType<typeof createClient>, token: string) => {
  if (!token) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const userId = userData?.user?.id;
  if (userError || !userId) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("role,active")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.active) return null;
  return typeof data.role === "string" ? data.role : null;
};

const getBackupStatus = async (supabase: ReturnType<typeof createClient>): Promise<BackupStatus> => {
  const { data, error } = await supabase
    .from("system_event_logs")
    .select("id,event_type,severity,source,message,metadata,created_at")
    .eq("source", "ops")
    .in("event_type", backupEventTypes)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return {
      ok: false,
      latest_backup: null,
      latest_verify: null,
      latest_restore_dry_run: null,
      message: `备份日志读取失败：${error.message}`,
    };
  }

  const events = ((data || []) as SystemEventRow[]).map(summarizeEvent);
  const latestBackup = events.find((event) => event.event_type === "backup_supabase_completed") || null;
  const latestVerify = events.find((event) => event.event_type === "backup_package_verified") || null;
  const latestRestoreDryRun = events.find((event) => event.event_type === "backup_restore_dry_run_completed") || null;
  const ok = isRecent(latestBackup) && isRecent(latestVerify) && isRecent(latestRestoreDryRun);

  return {
    ok,
    latest_backup: latestBackup,
    latest_verify: latestVerify,
    latest_restore_dry_run: latestRestoreDryRun,
    message: ok ? "最近备份、备份验证和恢复演练都有记录。" : "备份、验证或恢复演练记录不完整，建议按发布清单重新执行。",
  };
};

const getHealthHistory = async (supabase: ReturnType<typeof createClient>) => {
  const { data, error } = await supabase
    .from("system_event_logs")
    .select("id,event_type,severity,source,message,metadata,created_at")
    .eq("source", "health-check")
    .eq("event_type", "system_health_check")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) return [];
  return ((data || []) as SystemEventRow[]).map(summarizeEvent);
};

const logHealthCheck = async (
  supabase: ReturnType<typeof createClient>,
  ok: boolean,
  failedTables: string[],
  reminders: string[],
  checkedAt: string,
) => {
  try {
    await supabase.from("system_event_logs").insert({
      event_type: "system_health_check",
      severity: ok ? "info" : "warn",
      source: "health-check",
      message: ok ? "System health check passed." : "System health check needs attention.",
      metadata: {
        failed_tables: failedTables,
        reminders,
        checked_at: checkedAt,
      },
    });
  } catch {
    // Health responses should not fail only because logging failed.
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const checkedAt = new Date().toISOString();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
  const checks: Record<string, CheckResult | boolean> = {
    edge_function: { ok: true, label: "Edge Function", message: "health-check 已响应。" },
  };

  if (!supabaseUrl || !serviceRoleKey) {
    return json({
      ok: false,
      mode: "public",
      message: "Supabase server credentials are not configured.",
      checked_at: checkedAt,
      checks,
      table_checks: [],
      reminders: ["Supabase Edge Function 缺少服务端密钥，无法检查数据库。"],
    }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const adminRole = await getAdminRole(supabase, getBearerToken(req));
  const adminMode = adminRole === "super_admin";
  const tableDefinitions = adminMode ? adminTables : publicTables;
  const tableChecks = await Promise.all(tableDefinitions.map((item) => checkTable(supabase, item)));
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

  const bucket = await supabase.storage.getBucket("site-images");
  checks.storage_site_images = bucket.error
    ? { ok: false, label: "图片存储桶", message: bucket.error.message }
    : { ok: true, label: "图片存储桶", message: "site-images 存储桶可读取。" };

  let backupStatus: BackupStatus | null = null;
  let healthHistory: SystemEventSummary[] = [];
  const failedTables = tableChecks.filter((item) => !item.ok).map((item) => item.table);
  const reminders = [
    ...tableChecks.filter((item) => !item.ok).map((item) => `${item.label} 读取失败，请检查迁移、权限或数据库状态。`),
    ...Object.values(checks)
      .filter((item) => typeof item === "object" && item && !item.ok)
      .map((item) => `${item.label} 异常：${item.message || "请检查 Supabase 配置。"}`),
  ];

  if (adminMode) {
    backupStatus = await getBackupStatus(supabase);
    if (!backupStatus.ok) reminders.push(backupStatus.message);
  }

  const checksOk = Object.values(checks).every((item) => (typeof item === "boolean" ? item : item.ok));
  const tablesOk = tableChecks.every((item) => item.ok);
  const backupsOk = adminMode ? Boolean(backupStatus?.ok) : true;
  const overallOk = checksOk && tablesOk && backupsOk;

  if (adminMode) {
    await logHealthCheck(supabase, overallOk, failedTables, reminders, checkedAt);
    healthHistory = await getHealthHistory(supabase);
  }

  return json({
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
  }, overallOk ? 200 : 503);
});
