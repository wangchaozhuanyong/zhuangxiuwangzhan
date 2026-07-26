import { describe, expect, it } from "vitest";
import { buildGrowthTelegramMessage } from "../../supabase/functions/growth-notify/service.ts";

describe("growth-notify message", () => {
  it("uses a dedicated non-production label for delivery canaries", () => {
    const message = buildGrowthTelegramMessage({
      eventType: "system_test",
      changeId: "canary-123",
      title: "通知通道联调测试",
      reason: "验证 Telegram 送达，不代表生产故障。",
    });

    expect(message).toContain("通知通道联调测试");
    expect(message).toContain("不代表生产故障");
  });

  it("builds a bounded Chinese change alert with rollback evidence", () => {
    const message = buildGrowthTelegramMessage({
      eventType: "campaign_pause",
      changeId: "change-123",
      title: "Search - Renovation Leads - KL Selangor",
      reason: "地域配置偏离 KL/Selangor",
      evidence: ["检测到非目标地域点击", "自动恢复保持禁用"],
      reportPath: "seo-workspace/reports/2026-07-26-managed-growth.md",
      rollbackId: "manual-owner-resume-required",
    });

    expect(message).toContain("Google Ads 已执行紧急暂停");
    expect(message).toContain("change-123");
    expect(message).toContain("自动恢复保持禁用");
    expect(message).toContain("manual-owner-resume-required");
  });

  it("rejects unknown event types", () => {
    expect(() => buildGrowthTelegramMessage({ eventType: "unknown" as never })).toThrow(/Invalid/);
  });
});
