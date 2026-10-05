import { describe, expect, it, vi } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

const clientWithForbiddenWrites = () => {
  const from = vi.fn(() => { throw new Error("Unexpected database access"); });
  const rpc = vi.fn(() => { throw new Error("Unexpected managed write"); });
  const storageFrom = vi.fn(() => { throw new Error("Unexpected upload"); });
  const client = { from, rpc, storage: { from: storageFrom } } as unknown as ContentPublishClient;
  return { client, from, rpc, storageFrom };
};

describe("publish dispatch remains behind the existing entry guards", () => {
  it.each(["homepage", "blog", "material", "service_area", "project", "site_page", "media"] as const)(
    "rejects %s without the existing write role before any data/upload call", async (contentType) => {
      const { client, from, rpc, storageFrom } = clientWithForbiddenWrites();
      const result = await publishContent({ contentType, record: {} }, client, { role: "viewer" });
      expect(result.status).toBe(403);
      expect(result.body).toMatchObject({ ok: false, error: "Content editor access required" });
      expect(from).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
      expect(storageFrom).not.toHaveBeenCalled();
    },
  );

  it.each(["homepage", "blog", "material", "service_area", "project", "site_page", "media"] as const)(
    "retains the publish approval guard for %s", async (contentType) => {
      const { client, from, rpc, storageFrom } = clientWithForbiddenWrites();
      const result = await publishContent({ contentType, mode: "publish", record: {}, ownerApproved: true }, client, { role: "content_editor" });
      expect(result.status).toBe(403);
      expect(result.body.error).toBe("Publishing requires ownerApproved=true and explicitExecution=true.");
      expect(from).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
      expect(storageFrom).not.toHaveBeenCalled();
    },
  );

  it("retains cache invalidation as its existing separate zero-content-write path", async () => {
    const { client, from, rpc, storageFrom } = clientWithForbiddenWrites();
    const result = await publishContent({ contentType: "cache_invalidation", record: {} }, client, { role: "content_editor" });
    expect(result.body).toMatchObject({ ok: true, dry_run: true, content_type: "cache_invalidation", action: "invalidate" });
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(storageFrom).not.toHaveBeenCalled();
  });

  it("still rejects an unsupported type before dispatch can select a handler", async () => {
    const { client, from, rpc, storageFrom } = clientWithForbiddenWrites();
    const result = await publishContent({ contentType: "fixture-unsupported", record: {} } as unknown as ContentPublishRequest, client, { role: "content_editor" });
    expect(result.status).toBe(400);
    expect(result.body.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(storageFrom).not.toHaveBeenCalled();
  });
});
