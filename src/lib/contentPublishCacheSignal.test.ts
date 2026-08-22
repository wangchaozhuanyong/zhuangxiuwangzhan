import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service";

const client = {
  from: () => {
    throw new Error("cache invalidation must not write a content table");
  },
  rpc: async () => ({ data: [], error: null }),
};

describe("content-publish cache invalidation signal", () => {
  it("accepts an explicitly approved admin cache invalidation", async () => {
    const result = await publishContent(
      {
        contentType: "cache_invalidation",
        mode: "publish",
        nextStatus: "published",
        ownerApproved: true,
        explicitExecution: true,
        approvalId: "admin-cache-test",
        source: "test",
        record: { table: "site_pages", action: "update" },
      },
      client as never,
      { role: "content_editor", authMode: "admin", adminUserId: "test-user" },
    );

    expect(result.body).toMatchObject({
      ok: true,
      dry_run: false,
      content_type: "cache_invalidation",
      action: "invalidate",
    });
  });

  it("rejects a cache invalidation without explicit approval", async () => {
    const result = await publishContent(
      {
        contentType: "cache_invalidation",
        mode: "publish",
        nextStatus: "published",
        record: { table: "site_pages", action: "update" },
      },
      client as never,
      { role: "content_editor", authMode: "admin", adminUserId: "test-user" },
    );

    expect(result.status).toBe(403);
    expect(result.body.ok).toBe(false);
  });
});
