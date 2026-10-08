import { describe, expect, it, vi } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

const version = "2026-10-08T01:00:00.000001Z";
const nextVersion = "2026-10-08T01:00:00.000002Z";
const targets = [
  { contentType: "service", table: "services", record: { id: "ordinary-row", slug: "ordinary-service", title_en: "Draft" } },
  { contentType: "blog", table: "blog_posts", record: { id: "ordinary-row", slug: "ordinary-blog", title_en: "Draft" } },
  { contentType: "project", table: "projects", record: { id: "ordinary-row", slug: "ordinary-project", title_en: "Draft" } },
  { contentType: "service_area", table: "service_areas", record: { id: "ordinary-row", slug: "ordinary-area", title_en: "Draft" } },
  { contentType: "site_page", table: "site_pages", record: { id: "ordinary-row", page_key: "services", path: "/services", title_en: "Draft" } },
] as const;

function casFixture(tableName: string, record: Record<string, unknown>, currentVersion = version) {
  const current = { ...record, updated_at: currentVersion };
  const writes: Array<{ table: string; filters: Array<[string, unknown]> }> = [];
  const audits = vi.fn();
  const client = { from(table: string) {
    if (table === "admin_audit_logs") return { insert: async () => { audits(); return { error: null }; } };
    const filters: Array<[string, unknown]> = [];
    let mutation = false;
    const builder = { select() { return builder; }, eq(field: string, value: unknown) { filters.push([field, value]); return builder; },
      update() { mutation = true; return builder; },
      async maybeSingle() {
        if (!mutation) return { data: { ...current }, error: null };
        // Another editor commits after the caller's initial read, before UPDATE.
        current.updated_at = nextVersion;
        writes.push({ table, filters });
        return { data: filters.every(([field, value]) => current[field as keyof typeof current] === value) ? { ...current } : null, error: null };
      },
      single() { throw new Error("Unconditional write is forbidden"); },
    };
    expect(table).toBe(tableName);
    return builder;
  } } as unknown as ContentPublishClient;
  return { client, writes, audits };
}
function request(target: typeof targets[number], expectedUpdatedAt: string | undefined = version): ContentPublishRequest {
  return { contentType: target.contentType, mode: "publish", nextStatus: "draft", ownerApproved: true, explicitExecution: true,
    approvalId: "test-only", expectedUpdatedAt, record: target.record };
}

describe("ordinary publication optimistic concurrency", () => {
  it.each(targets)("rejects a $contentType race in the write itself without writing an audit", async (target) => {
    const { client, writes, audits } = casFixture(target.table, target.record);
    const result = await publishContent(request(target), client, { role: "content_editor" });
    expect(result.status).toBe(409);
    expect(writes).toEqual([{ table: target.table, filters: [["id", "ordinary-row"], ["updated_at", version]] }]);
    expect(audits).not.toHaveBeenCalled();
  });
  it.each(targets)("does not round away PostgreSQL microseconds for $contentType", async (target) => {
    const { client, writes } = casFixture(target.table, target.record, nextVersion);
    const result = await publishContent(request(target), client, { role: "content_editor" });
    expect(result.status).toBe(409);
    expect(writes).toHaveLength(0);
  });
  it.each(targets)("requires the reader version for existing $contentType", async (target) => {
    const { client, writes } = casFixture(target.table, target.record);
    const result = await publishContent({ ...request(target), expectedUpdatedAt: undefined }, client, { role: "content_editor" });
    expect(result.status).toBe(409);
    expect(writes).toHaveLength(0);
  });
});

function materialFixture(error: { code: string; message: string } | null = null) {
  const rpc = vi.fn(async () => ({ data: { saved: { id: "material-new", updated_at: version }, gallery_count: 0, gallery_archived_count: 0, public_revision: version }, error }));
  const directWrite = vi.fn(() => { throw new Error("Partial material write is forbidden"); });
  const client = { from() { const builder = { select() { return builder; }, eq() { return builder; }, maybeSingle: async () => ({ data: null, error: null }), update: directWrite, insert: directWrite }; return builder; }, rpc } as unknown as ContentPublishClient;
  return { client, rpc, directWrite };
}
const materialRequest: ContentPublishRequest = { contentType: "material", mode: "publish", nextStatus: "draft", ownerApproved: true, explicitExecution: true, approvalId: "test-only", record: { slug: "test-material", title_en: "Draft material" } };
describe("material transaction admission", () => {
  it("routes even legacy field publications through one transaction", async () => {
    const { client, rpc, directWrite } = materialFixture();
    const result = await publishContent(materialRequest, client, { role: "content_editor" });
    expect(result.body).toMatchObject({ ok: true, saved_id: "material-new", public_revision: version });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("publish_material_atomic", expect.objectContaining({ p_material_id: null, p_images: null }));
    expect(directWrite).not.toHaveBeenCalled();
  });
  it.each(["40001", "PGRST202"])("blocks error %s without partial write fallback", async (code) => {
    const { client, directWrite } = materialFixture({ code, message: "test-only" });
    const result = await publishContent(materialRequest, client, { role: "content_editor" });
    expect(result.status).toBe(409);
    expect(directWrite).not.toHaveBeenCalled();
  });
  it("propagates a database transaction failure without any fallback", async () => {
    const { client, directWrite } = materialFixture({ code: "23514", message: "Internal private detail" });
    await expect(publishContent(materialRequest, client, { role: "content_editor" })).rejects.toThrow("Read back before retrying");
    expect(directWrite).not.toHaveBeenCalled();
  });
});
