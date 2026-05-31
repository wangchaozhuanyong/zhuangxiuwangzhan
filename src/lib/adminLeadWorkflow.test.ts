import { describe, expect, it } from "vitest";
import {
  buildAdminWorkflowHref,
  getAdminWorkflowBadges,
  normalizeAdminWorkflowFilter,
} from "@/lib/adminLeadWorkflow";

describe("adminLeadWorkflow", () => {
  it("normalizes unknown workflow filters to all", () => {
    expect(normalizeAdminWorkflowFilter("due_followups", "leads")).toBe("due_followups");
    expect(normalizeAdminWorkflowFilter("unknown", "quote_requests")).toBe("all");
    expect(normalizeAdminWorkflowFilter(null, "leads")).toBe("all");
  });

  it("builds list links with only meaningful filters", () => {
    expect(buildAdminWorkflowHref("/admin/leads", { status: "new" })).toBe("/admin/leads?status=new");
    expect(buildAdminWorkflowHref("/admin/quotes", { filter: "to_quote" })).toBe("/admin/quotes?filter=to_quote");
    expect(buildAdminWorkflowHref("/admin/leads", { status: "all", filter: "all" })).toBe("/admin/leads");
  });

  it("marks due and stale records for admin attention", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const badges = getAdminWorkflowBadges(
      "quote_requests",
      {
        status: "pending",
        created_at: "2026-05-30T10:00:00.000Z",
        next_follow_up_at: "2026-06-01T09:00:00.000Z",
      },
      "zh",
      now,
    );

    expect(badges.map((badge) => badge.label)).toEqual(["跟进已到期", "超过24小时未处理"]);
  });
});
