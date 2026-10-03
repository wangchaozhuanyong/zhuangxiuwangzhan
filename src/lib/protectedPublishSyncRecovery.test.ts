import { beforeEach, describe, expect, it, vi } from "vitest";
import { publishAdminService } from "@/backend/modules/services/service/serviceService";
import { getPublicSyncIssues, resolvePublicSyncIssue } from "@/lib/publicSyncRecovery";
const calls = vi.hoisted(() => ({ publish: vi.fn(), sync: vi.fn() }));
vi.mock("@/backend/modules/services/repository/serviceRepository", () => ({ publishServiceRecord: calls.publish }));
vi.mock("@/lib/adminMutation", () => ({ requestPublicContentInvalidation: calls.sync }));
beforeEach(() => { vi.clearAllMocks(); getPublicSyncIssues().forEach(issue => resolvePublicSyncIssue(issue.key)); });
describe("protected publish delivery", () => {
  it("returns the published record while retry only advances the cache revision", async () => {
    const record = { id: "synthetic-service", slug: "synthetic-service", status: "published" as const,
      title_zh: "本地模拟服务", title_en: "Synthetic service", excerpt_zh: "模拟摘要", excerpt_en: "Synthetic excerpt",
      content_zh: "<p>模拟内容</p>", content_en: "<p>Synthetic content</p>", image_url: "/images/fixture.webp",
      alt_zh: "模拟图片", alt_en: "Synthetic image", seo_title_zh: "模拟服务", seo_title_en: "Synthetic service",
      suitable_for_zh: ["模拟适用范围"], suitable_for_en: ["Synthetic fit"], common_projects_zh: ["模拟项目"], common_projects_en: ["Synthetic project"],
      scope_items_zh: ["模拟工作"], scope_items_en: ["Synthetic scope"],
      process_steps_zh: [{ title: "模拟步骤", desc: "模拟说明" }], process_steps_en: [{ title: "Synthetic step", desc: "Synthetic description" }],
      faqs_zh: [{ q: "模拟问题", a: "模拟回答" }], faqs_en: [{ q: "Synthetic question", a: "Synthetic answer" }],
      seo_description_zh: "模拟描述", seo_description_en: "Synthetic description" };
    calls.publish.mockResolvedValue({ ok: true, saved_id: record.id, saved_record: record, status: "published", cache_invalidation: { ok: false } });
    calls.sync.mockResolvedValue({ cache_invalidation: { ok: true } });
    const result = await publishAdminService({ record, approvalId: "local-fixture" });
    expect(result.savedId).toBe(record.id); expect(getPublicSyncIssues()).toHaveLength(1);
    await getPublicSyncIssues()[0].retry();
    expect(calls.publish).toHaveBeenCalledOnce(); expect(calls.sync).toHaveBeenCalledOnce(); expect(getPublicSyncIssues()).toHaveLength(0);
  });
});
