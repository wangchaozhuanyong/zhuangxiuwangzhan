import { describe, expect, it } from "vitest";
import { auditContentSnapshot, buildContentLinkRepairPlan } from "../../scripts/verify-content-links.mjs";

const record = (id: string, fields: Record<string, unknown>, table_name = "services", slug = id) =>
  ({ table_name, id, slug, updated_at: "2026-10-24T00:00:00.123456Z", fields });

describe("full content link audit and conservative repair planning", () => {
  it("repairs each broken occurrence from its aligned source, preserving Malay copy and every unrelated character", () => {
    const before = '<p>pejabat <a href="/ms/services/pejabat-renovation">pejabat</a></p><a href="/ms/services/pejabat-renovation">Lihat pejabat</a>';
    const rows = [record("source", { content_en: '<p>office <a href="/en/services/office-renovation">office</a></p><a href="/en/services/office-renovation">See office</a>', content_ms: before }),
      record("target", {}, "services", "office-renovation")];
    const plan = buildContentLinkRepairPlan(rows);
    expect(plan.audit).toMatchObject({ issueCount: 2, affectedRecordCount: 1 });
    expect(plan.candidates).toHaveLength(1);
    expect(plan.candidates[0].patch.content_ms).toBe(before.replaceAll('/ms/services/pejabat-renovation', '/ms/services/office-renovation'));
    expect(plan.candidates[0].repairs).toHaveLength(2);
    expect(plan.candidates[0].changedFields).toEqual(["content_ms"]);
    expect(plan.simulatedAudit.issueCount).toBe(0);
    expect(rows[0].fields.content_ms).toBe(before);
  });

  it("does not guess a destination when source structure differs or the original target does not exist", () => {
    const rows = [record("different", { content_en: '<p>No links</p>', content_ms: '<a href="/ms/blog/rosak">link</a>' }),
      record("missing", { content_en: '<a href="/en/blog/missing">source</a>', content_ms: '<a href="/ms/blog/hilang">target</a>' })];
    const plan = buildContentLinkRepairPlan(rows);
    expect(plan.candidates).toHaveLength(0);
    expect(plan.unresolved).toHaveLength(3);
    expect(plan.simulatedAudit.issueCount).toBe(3);
  });

  it("checks all languages and structured fields, ignores deleted content, and recognizes routes from published sources", () => {
    const rows = [record("source", { items_zh: [{ href: "/zh/blog/missing" }], content_en: '<a href="/en/blog/missing">a</a>', content_ms: '<a href="/en/blog/missing">b</a>' }),
      record("deleted", { deleted_at: "2026-10-24", content_ms: '<a href="/ms/blog/ignored">ignored</a>' })];
    expect(auditContentSnapshot(rows, ["/en/blog/missing"]).issues.map(issue => issue.reason)).toEqual(["wrong_language"]);
    expect(auditContentSnapshot(rows).recordCount).toBe(1);
    expect(auditContentSnapshot(rows).issueCount).toBe(3);
  });
});
