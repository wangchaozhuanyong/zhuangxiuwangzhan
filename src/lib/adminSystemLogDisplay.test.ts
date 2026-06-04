import { describe, expect, it } from "vitest";
import { formatAdminSystemLogRow } from "@/lib/adminSystemLogDisplay";
import type { SystemLogRow } from "@/backend/modules/system/service/systemEventService";

const healthCheckRow: SystemLogRow = {
  id: "log-1",
  event_type: "system_health_check",
  severity: "info",
  source: "health-check",
  message: "System health check passed.",
  metadata: {
    failed_tables: [],
    reminders: [],
    checked_at: "2026-06-03T00:05:51.000Z",
  },
  created_at: "2026-06-03T00:05:51.000Z",
};

const unknownTechnicalRow: SystemLogRow = {
  id: "log-2",
  event_type: "permission_denied",
  severity: "verbose",
  source: "admin-api",
  message: "permission_denied: public.admin_users policy rejected",
  metadata: {
    category: "permission_denied",
    categoryLabel: "permission_denied",
  },
  created_at: "2026-06-03T00:05:51.000Z",
};

describe("adminSystemLogDisplay", () => {
  it("shows health check logs as readable Chinese instead of raw event keys", () => {
    const display = formatAdminSystemLogRow(healthCheckRow, "zh");

    expect(display).toEqual({
      severity: "信息",
      source: "健康检查",
      category: "系统健康",
      eventType: "系统健康检查",
      message: "系统健康检查通过。",
    });
    expect(Object.values(display).join(" ")).not.toContain("health-check");
    expect(Object.values(display).join(" ")).not.toContain("system_health_check");
    expect(Object.values(display).join(" ")).not.toContain("System health check passed.");
  });

  it("keeps English admin logs human-readable without leaking slug-style source names", () => {
    const display = formatAdminSystemLogRow(healthCheckRow, "en");

    expect(display.source).toBe("Health check");
    expect(display.category).toBe("System health");
    expect(display.eventType).toBe("System health check");
    expect(display.message).toBe("System health check passed.");
    expect(Object.values(display).join(" ")).not.toContain("health-check");
    expect(Object.values(display).join(" ")).not.toContain("system_health_check");
  });

  it("uses safe fallback labels when a new technical log type has no display mapping", () => {
    const display = formatAdminSystemLogRow(unknownTechnicalRow, "zh");
    const joined = Object.values(display).join(" ");

    expect(display).toEqual({
      severity: "未知级别",
      source: "未知来源",
      category: "未知系统事件",
      eventType: "未知事件类型",
      message: "这条系统消息还没有配置显示文案。",
    });
    expect(joined).not.toContain("permission_denied");
    expect(joined).not.toContain("admin-api");
    expect(joined).not.toContain("policy rejected");
  });
});
