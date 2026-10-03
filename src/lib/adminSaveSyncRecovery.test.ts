import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveAdminRecord } from "@/lib/adminMutation";
import { getPublicSyncIssues, resolvePublicSyncIssue } from "@/lib/publicSyncRecovery";
const repo = vi.hoisted(() => ({ insert: vi.fn(), sync: vi.fn(), audit: vi.fn() }));
vi.mock("@/backend/modules/system/repository/adminMutationRepository", () => ({
  insertAdminMutationRecord: repo.insert, requestPublicContentInvalidation: repo.sync, insertAdminAuditLog: repo.audit,
  fetchAdminMutationRecord: vi.fn(), updateAdminMutationRecord: vi.fn(), archiveAdminMutationRecord: vi.fn(), deleteAdminMutationRecord: vi.fn(),
}));
beforeEach(() => { vi.clearAllMocks(); getPublicSyncIssues().forEach((issue) => resolvePublicSyncIssue(issue.key)); });
describe("saved content delivery recovery", () => {
  it("returns the saved row and retries delivery without inserting a second record", async () => {
    const saved = { id: "synthetic", title_en: "Fixture", status: "published" };
    repo.insert.mockResolvedValue(saved); repo.sync.mockRejectedValueOnce(new Error("delivery offline")).mockResolvedValueOnce({ cache_invalidation: { revision: "next" } });
    await expect(saveAdminRecord({ table: "blog_posts", payload: saved, audit: false })).resolves.toEqual(saved);
    expect(getPublicSyncIssues()).toHaveLength(1);
    await getPublicSyncIssues()[0].retry();
    expect(repo.insert).toHaveBeenCalledOnce(); expect(repo.sync).toHaveBeenCalledTimes(2); expect(getPublicSyncIssues()).toHaveLength(0);
  });
  it("keeps a write failure distinct from a delivery failure", async () => {
    repo.insert.mockRejectedValue(new Error("write failed"));
    await expect(saveAdminRecord({ table: "blog_posts", payload: { status: "published" } })).rejects.toThrow();
    expect(getPublicSyncIssues()).toHaveLength(0); expect(repo.sync).not.toHaveBeenCalled();
  });
});
