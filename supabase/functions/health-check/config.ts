import type { CheckResult, HealthTableDefinition } from "./types.ts";

export const BACKUP_RECENT_HOURS = 24 * 7;

export const publicTables: HealthTableDefinition[] = [
  { table: "cms_pages", label: "CMS 页面", category: "公开内容" },
  { table: "site_settings", label: "网站基础设置", category: "基础配置" },
];

export const adminTables: HealthTableDefinition[] = [
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
  { table: "admin_users", label: "管理员账户", category: "权限系统", selectColumn: "user_id" },
  { table: "system_event_logs", label: "系统日志", category: "运维日志" },
];

export const backupEventTypes = [
  "backup_supabase_completed",
  "backup_package_verified",
  "backup_restore_dry_run_completed",
];

export const edgeFunctionChecks = (): Record<string, CheckResult | boolean> => ({
  edge_function: { ok: true, label: "Edge Function", message: "health-check 已响应。" },
});
