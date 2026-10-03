import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminSystemHealth from "@/pages/admin/AdminSystemHealth";
import { setAdminLang } from "@/lib/adminLocale";

const { fetchHealth, cleanupAttempts } = vi.hoisted(() => ({ fetchHealth: vi.fn(), cleanupAttempts: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true }));
vi.mock("@/backend/modules/system/service/systemHealthService", () => ({
  fetchAdminSystemHealth: fetchHealth, cleanupAdminFormAttempts: cleanupAttempts,
}));

const event = (eventType: string, age = 650, limited = false) => ({
  id: eventType, event_type: eventType, source: "fixture", message: "备份记录示例",
  severity: limited ? "warn" : "info", created_at: "2026-09-06T08:38:08Z", age_hours: age,
  metadata: { full_access: !limited, table_count: 32, total_rows: 5, storage_file_count: 72 },
});
const payload = (age = 650, limited = false) => ({
  ok: false, mode: "admin", checked_at: "2026-10-03T00:00:00Z",
  checks: {
    edge_function: { ok: true, message: "函数已响应" },
    storage_site_images: { ok: true, count: 72, label: "图片存储", message: "存储可读取" },
    unknown_internal_check: { ok: false, message: "内部错误检查" },
  },
  table_checks: [
    { table: "site_settings", label: "网站基础设置", category: "基础配置", ok: true, count: 2 },
    { table: "cms_pages", label: "CMS 页面", category: "内容系统", ok: false, message: "permission denied for cms_pages" },
    { table: "unknown_internal_table", label: "内部表格", category: "内部分类", ok: false, message: "内部读取失败" },
  ],
  reminders: ["备份记录缺失或已过期", "CMS 页面 read failed. Check migrations, permissions, or database status.", "其他内部提示"],
  backup_status: {
    ok: false, message: "备份记录缺失或已过期",
    latest_backup: event("backup_supabase_completed", age, limited),
    latest_verify: event("backup_package_verified", age),
    latest_restore_dry_run: event("backup_restore_dry_run_completed", age),
  },
  health_history: [event("system_health_check"), event("unknown_internal_event")],
});

describe("system health display language and backup status", () => {
  afterEach(() => { setAdminLang("zh"); vi.unstubAllGlobals(); vi.clearAllMocks(); });
  const mount = async (data = payload()) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    client.setQueryData(["admin", "system-health"], data);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => root.render(<QueryClientProvider client={client}><TooltipProvider><AdminSystemHealth /></TooltipProvider></QueryClientProvider>));
    return { client, container, dispose: async () => {
      await act(async () => root.unmount()); client.clear(); container.remove();
    } };
  };
  it("translates the same Chinese server payload in both directions without a network check", async () => {
    setAdminLang("zh");
    const mounted = await mount();
    try {
      expect(mounted.container.textContent).toContain("网站基础设置");
      await act(async () => setAdminLang("en"));
      const text = mounted.container.textContent || "";
      expect(text).toContain("Site settings");
      expect(text).toContain("Basic settings");
      expect(text).toContain("Image storage is readable.");
      expect(text).toContain("Other service check");
      expect(text).toContain("Other data");
      expect(text).toContain("Other system event");
      expect(text).not.toMatch(/[\u4e00-\u9fff]/);
      expect(text).not.toContain("unknown_internal_");
      expect(text).not.toContain("permission denied");
      expect(text).not.toContain("cms_pages");
      await act(async () => setAdminLang("zh"));
      expect(mounted.container.textContent).toContain("网站基础设置");
      expect(fetchHealth).not.toHaveBeenCalled();
      expect(cleanupAttempts).not.toHaveBeenCalled();
      expect(mounted.client.getQueryData(["admin", "system-health"])).toEqual(payload());
    } finally { await mounted.dispose(); }
  });
  it("keeps expired records requiring attention and explains dry-run limits", async () => {
    setAdminLang("en");
    const mounted = await mount();
    try {
      expect(mounted.container.textContent).toContain("out of date");
      expect(mounted.container.textContent).toContain("without restoring data");
      const title = Array.from(mounted.container.querySelectorAll("p")).find((node) => node.textContent === "Database and file backup");
      expect(title?.parentElement?.textContent).toContain("Needs confirmation");
    } finally { await mounted.dispose(); }
  });
  it("does not show a recent warning or incomplete backup record as passed", async () => {
    setAdminLang("en");
    const mounted = await mount(payload(1, true));
    try {
      const title = Array.from(mounted.container.querySelectorAll("p")).find((node) => node.textContent === "Database and file backup");
      expect(title?.parentElement?.textContent).toContain("Needs confirmation");
      expect(title?.parentElement?.textContent).not.toContain("Recent record");
    } finally { await mounted.dispose(); }
  });
  it("keeps incomplete actual recovery needing attention and translates its password acceptance", async () => {
    setAdminLang("en");
    const original = payload(1);
    const data = { ...original, backup_status: { ...original.backup_status, latest_restore_verified: {
      ...event("backup_restore_verified", 1), metadata: { full_access: true, data_verified: true, schema_verified: true, auth_verified: true, media_verified: true, original_admin_login_verified: false, original_admin_mfa_verified: true, permissions_verified: true },
    } } };
    const mounted = await mount(data);
    try {
      const title = Array.from(mounted.container.querySelectorAll("p")).find((node) => node.textContent === "Isolated restore acceptance");
      expect(title?.parentElement?.textContent).toContain("Needs confirmation");
      expect(title?.parentElement?.textContent).toContain("Original administrator password login pending");
      await act(async () => setAdminLang("zh"));
      expect(mounted.container.textContent).toContain("原管理员密码登录尚待验证");
      expect(mounted.container.textContent).toContain("独立环境恢复验收");
    } finally { await mounted.dispose(); }
  });
  it("does not trust an older backend green result that only contains dry-run records", async () => {
    setAdminLang("en");
    const original = payload(1);
    const data = { ...original, ok: true, reminders: [], backup_status: { ...original.backup_status, ok: true } };
    const mounted = await mount(data);
    try {
      expect(mounted.container.textContent).toContain("System health needs attention");
      expect(mounted.container.textContent).toContain("Backup or isolated restore acceptance is missing");
      expect(mounted.container.textContent).not.toContain("Recent backup, package verification and isolated restore acceptance are complete.");
    } finally { await mounted.dispose(); }
  });
});
