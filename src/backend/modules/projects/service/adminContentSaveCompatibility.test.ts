import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveAdminProject } from "./projectService";
import { saveAdminBlogPost } from "@/backend/modules/blog/service/blogService";
import { saveAdminService } from "@/backend/modules/services/service/serviceService";
import { saveAdminMaterial } from "@/backend/modules/materials/service/materialService";
import { saveAdminUser } from "@/backend/modules/admin-users/service/adminUserService";

const { repository } = vi.hoisted(() => ({
  repository: {
    fetchAdminMutationRecord: vi.fn(),
    updateAdminMutationRecord: vi.fn(),
    insertAdminMutationRecord: vi.fn(),
    archiveAdminMutationRecord: vi.fn(),
    deleteAdminMutationRecord: vi.fn(),
    insertAdminAuditLog: vi.fn(),
    requestPublicContentInvalidation: vi.fn(),
  },
}));

// Only the persistence transport is replaced; services, save facade and cache are real.
vi.mock("@/backend/modules/system/repository/adminMutationRepository", () => repository);

const version = "2026-10-05T01:00:00Z";
const nextVersion = "2026-10-05T01:01:00Z";
const domains = [
  { name: "projects", save: saveAdminProject },
  { name: "blog_posts", save: saveAdminBlogPost },
  { name: "services", save: saveAdminService },
  { name: "materials", save: saveAdminMaterial },
];

describe("domain saves retain the existing application save contract", () => {
  beforeEach(() => {
    Object.values(repository).forEach((mock) => mock.mockReset());
    repository.fetchAdminMutationRecord.mockResolvedValue({ id: "test-row", updated_at: version, status: "published" });
    repository.updateAdminMutationRecord.mockImplementation(async (_table, _idField, id, payload) => ({ ...payload, id, updated_at: nextVersion }));
    repository.insertAdminMutationRecord.mockImplementation(async (_table, payload) => ({ ...payload, id: "test-created", updated_at: nextVersion }));
    repository.insertAdminAuditLog.mockResolvedValue(undefined);
    repository.requestPublicContentInvalidation.mockResolvedValue({ ok: true, cache_invalidation: { revision: nextVersion } });
  });

  it.each(domains)("$name update preserves version, audit and public/cache synchronization", async ({ name, save }) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const adminKey = ["admin", name, "rows"];
    const publicKey = ["published", name, "zh"];
    client.setQueryData(adminKey, ["before"]);
    client.setQueryData(publicKey, ["before"]);
    try {
      const result = await save({ record: { id: "test-row", updated_at: version, slug: "test-content", status: "draft" }, queryClient: client });
      expect(result.savedId).toBe("test-row");
      expect(result.slug).toBe("test-content");
      expect(result.status).toBe("draft");
      expect(repository.updateAdminMutationRecord).toHaveBeenCalledTimes(1);
      const [table, idField, id, payload, token] = repository.updateAdminMutationRecord.mock.calls[0] || [];
      expect([table, idField, id]).toEqual([name, "id", "test-row"]);
      expect(payload).not.toHaveProperty("updated_at");
      expect(token).toEqual({ field: "updated_at", value: version });
      expect(repository.insertAdminAuditLog).toHaveBeenCalledTimes(1);
      expect(repository.requestPublicContentInvalidation).toHaveBeenCalledExactlyOnceWith({ table: name, action: "update", id: "test-row" });
      expect(client.getQueryState(adminKey)?.isInvalidated).toBe(true);
      expect(client.getQueryState(publicKey)?.isInvalidated).toBe(true);
    } finally {
      client.clear();
    }
  });

  it.each(domains)("$name insert remains one write with the same saved ID", async ({ name, save }) => {
    const result = await save({ record: { slug: "test-content", status: "draft" } });
    expect(result.savedId).toBe("test-created");
    expect(repository.insertAdminMutationRecord).toHaveBeenCalledTimes(1);
    expect(repository.insertAdminMutationRecord.mock.calls[0]?.[0]).toBe(name);
    expect(repository.fetchAdminMutationRecord).not.toHaveBeenCalled();
    expect(repository.updateAdminMutationRecord).not.toHaveBeenCalled();
    expect(repository.requestPublicContentInvalidation).not.toHaveBeenCalled();
  });

  it.each(domains)("$name write failure does not report success or synchronize content", async ({ save }) => {
    repository.updateAdminMutationRecord.mockRejectedValue(new Error("Write unavailable"));
    await expect(save({ record: { id: "test-row", updated_at: version, slug: "test-content", status: "draft" } })).rejects.toThrow();
    expect(repository.updateAdminMutationRecord).toHaveBeenCalledTimes(1);
    expect(repository.insertAdminAuditLog).not.toHaveBeenCalled();
    expect(repository.requestPublicContentInvalidation).not.toHaveBeenCalled();
  });

  it("admin-user save retains its custom identity and existing audit/cache options", async () => {
    const payload = { user_id: "test-user", email: "test@example.invalid", role: "content_editor", active: true };
    const existing = { ...payload, updated_at: version };
    repository.fetchAdminMutationRecord.mockResolvedValue(existing);
    const saved = await saveAdminUser(payload, existing, new QueryClient());
    expect(saved).toMatchObject(payload);
    expect(repository.updateAdminMutationRecord).toHaveBeenCalledExactlyOnceWith(
      "admin_users", "user_id", "test-user", payload, { field: "updated_at", value: version },
    );
    expect(repository.insertAdminAuditLog).not.toHaveBeenCalled();
    expect(repository.requestPublicContentInvalidation).not.toHaveBeenCalled();
  });
});
