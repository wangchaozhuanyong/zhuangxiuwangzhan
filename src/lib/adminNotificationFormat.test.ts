import {
  buildLeadTelegramMessage,
  buildTelegramTestMessage,
  cleanNotificationValue,
  formatAdminDateTime,
} from "../../supabase/functions/_shared/admin-notification-format.ts";

describe("admin notification format", () => {
  it("formats UTC timestamps into Chinese-friendly UTC+8 time", () => {
    expect(formatAdminDateTime("2026-05-31T10:56:29.684628+00:00")).toBe("2026年5月31日 18:56:29");
  });

  it("builds quote messages without technical ids and with translated system values", () => {
    const message = buildLeadTelegramMessage("quote", {
      id: "72393a58-116b-4a43-99b6-2eed75ee9ba4",
      created_at: "2026-05-31T10:56:29.684628+00:00",
      customer_name: "Codex Smoke Quote 1780224977361-xolln",
      customer_phone: "+60128880002",
      customer_email: "codex-smoke@example.com",
      project_type: "Kitchen Cabinet",
      location: "Smoke Quote Location",
      property_size: "888 sqft",
      estimated_budget: "Not sure yet",
      source_path: "/zh/quote",
      project_details: "Codex Smoke quote details 1780224977361-xolln",
      status: "pending",
    });

    expect(message).toContain("新报价请求");
    expect(message).toContain("提交时间：2026年5月31日 18:56:29");
    expect(message).toContain("项目类型：厨房橱柜");
    expect(message).toContain("预算：暂时不确定");
    expect(message).toContain("状态：待处理");
    expect(message).toContain("姓名：Codex Smoke Quote");
    expect(message).toContain("项目详情：Codex Smoke quote details");
    expect(message).not.toContain("编号");
    expect(message).not.toContain("72393a58");
    expect(message).not.toContain("1780224977361-xolln");
  });

  it("keeps user-entered English values when they are not known system options", () => {
    const message = buildLeadTelegramMessage("quote", {
      created_at: "2026-05-31T10:56:29.684628+00:00",
      customer_name: "English Customer",
      project_type: "Smoke Quote",
      location: "Smoke Quote Location",
      status: "pending",
    });

    expect(message).toContain("姓名：English Customer");
    expect(message).toContain("项目类型：Smoke Quote");
    expect(message).toContain("所在地区：Smoke Quote Location");
  });

  it("formats Telegram test messages without ISO timestamp text", () => {
    const message = buildTelegramTestMessage("2026-05-31T10:56:34.618Z");

    expect(message).toContain("FLASH CAST 测试通知");
    expect(message).toContain("时间：2026年5月31日 18:56:34");
    expect(message).not.toContain("2026-05-31T10:56:34.618Z");
  });

  it("only removes trailing timestamp-random test traces", () => {
    expect(cleanNotificationValue("Codex Smoke Quote 1780224977361-xolln")).toBe("Codex Smoke Quote");
    expect(cleanNotificationValue("Project ref 1780224977361-xolln is part of the note")).toBe(
      "Project ref 1780224977361-xolln is part of the note",
    );
  });
});
