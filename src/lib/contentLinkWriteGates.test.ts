import { afterEach, describe, expect, it, vi } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { generateEnglishContent } from "../../supabase/functions/generate-english-content/service.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";
import type { GenerateEnglishClient } from "../../supabase/functions/generate-english-content/types.ts";
import { persistAdminRecord } from "@/backend/modules/system/service/adminMutationService";
import { formatAdminMutationError } from "@/lib/adminMutation";

type Row = Record<string, unknown>;
const transport = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/lib/supabase", () => ({ requireSupabase: () => transport.current }));
vi.mock("../../supabase/functions/_shared/public-content-sync.ts", () => ({
  syncPublicContent: vi.fn().mockResolvedValue({ cache_invalidation: { ok: true, revision: "updated" } }),
}));

function fixture(initial: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = { admin_users: [{ user_id: "admin", role: "content_editor", active: true }], ...structuredClone(initial) };
  const writes: Array<{ table: string; operation: string }> = [];
  let lookupError = false;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "admin" } }, error: null }) },
    from(table: string) {
      let operation = "select", payload: Row = {}, count = Infinity;
      const filters: Array<[string, unknown]> = [];
      const run = () => {
        const rows = (tables[table] || []).filter(row => filters.every(([key, value]) => row[key] === value));
        if (operation === "update") rows.forEach(row => Object.assign(row, payload));
        if (operation === "insert") { const row = { ...payload, id: payload.id || "new" }; (tables[table] ||= []).push(row); return { data: [row], error: null }; }
        return { data: rows.slice(0, count), error: lookupError && count !== Infinity ? { message: "offline" } : null };
      };
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
        is: (key: string, value: null) => { filters.push([key, value]); return query; },
        limit: (value: number) => { count = value; return query; },
        update: (value: Row) => { operation = "update"; payload = value; writes.push({ table, operation }); return query; },
        insert: (value: Row) => { operation = "insert"; payload = value; writes.push({ table, operation }); return query; },
        single: async () => { const result = run(); return { ...result, data: result.data[0] || null }; },
        maybeSingle: async () => { const result = run(); return { ...result, data: result.data[0] || null }; },
        then: (resolve: (value: ReturnType<typeof run>) => unknown) => Promise.resolve(run()).then(resolve),
      };
      return query;
    },
  };
  transport.current = client;
  return { client, tables, writes, failLookup: () => { lookupError = true; } };
}
const existing = { id: "editable", slug: "editable", status: "published", updated_at: "2026-10-24T00:00:00.123456Z" };
afterEach(() => { vi.unstubAllGlobals(); });

describe("content link validation on real write paths", () => {
  it("blocks a bad manual admin save before content write, audit or public delivery", async () => {
    const f = fixture({ blog_posts: [{ ...existing, content_ms: "Before" }] });
    const error = await persistAdminRecord({ table: "blog_posts", id: "editable", expectedUpdatedAt: existing.updated_at,
      payload: { content_ms: '<a href="/ms/services/pejabat-renovation">pejabat</a>' } }).catch(error => error);
    expect(error.context.reason).toBe("content_links");
    expect(formatAdminMutationError(error, "zh")).toContain("站内链接不存在");
    expect(formatAdminMutationError(error, "en")).toContain("content links");
    expect(f.writes).toEqual([]); expect(f.tables.blog_posts[0].content_ms).toBe("Before");
  });

  it("accepts a published target and retains the existing atomic version predicate", async () => {
    const f = fixture({ blog_posts: [{ ...existing, content_ms: "Before" }], services: [{ id: "office", slug: "office-renovation", status: "published" }] });
    const payload = { content_ms: '<a href="/ms/services/office-renovation">pejabat</a>' };
    const saved = await persistAdminRecord({ table: "blog_posts", id: "editable", expectedUpdatedAt: existing.updated_at, payload });
    expect(saved.record.content_ms).toBe(payload.content_ms);
    expect(f.writes.filter(write => write.table === "blog_posts")).toHaveLength(1);
  });

  it("keeps an unrelated title edit independent of pre-existing body links", async () => {
    const f = fixture({ blog_posts: [{ ...existing, content_ms: '<a href="/ms/blog/old-broken-link">old</a>' }] });
    const saved = await persistAdminRecord({ table: "blog_posts", id: "editable", payload: { title_ms: "Tajuk" } });
    expect(saved.record.title_ms).toBe("Tajuk");
    expect(f.tables.blog_posts[0].content_ms).toContain("old-broken-link");
  });

  it("allows unfinished links in a draft and fails closed if published-target lookup is unavailable", async () => {
    const f = fixture({ blog_posts: [{ ...existing, status: "draft" }] });
    await persistAdminRecord({ table: "blog_posts", id: "editable", payload: { content_ms: '<a href="/ms/blog/not-ready">draft</a>' } });
    f.failLookup(); f.writes.length = 0;
    const error = await persistAdminRecord({ table: "blog_posts", id: "editable", payload: { status: "published" } }).catch(error => error);
    expect(error.context.reason).toBe("content_link_check"); expect(f.writes).toEqual([]);
  });

  it.each(["dry-run", "publish"] as const)("rejects an invalid protected-publisher %s request before any write", async mode => {
    const f = fixture();
    const result = await publishContent({ contentType: "blog", mode, nextStatus: "published", ownerApproved: true, explicitExecution: true,
      record: { slug: "unmanaged-fixture", content_ms: '<a href="/ms/blog/article-yang-tiada">article</a>' } },
    f.client as unknown as ContentPublishClient, { role: "content_editor" });
    expect(result.status).toBe(400);
    expect(result.body.link_issues).toEqual([expect.objectContaining({ reason: "missing_published_target" })]);
    expect(f.writes).toEqual([]);
  });

  it("does not translate and save an unpublished source destination into a new Malay link", async () => {
    const f = fixture({ services: [{ ...existing, content_en: '<a href="/en/blog/not-published">office</a>', content_ms: null }] });
    vi.stubGlobal("fetch", vi.fn(async (input: string) => ({ ok: true, json: async () => [[new URL(input).searchParams.get("q"), "en"]] })));
    const request = new Request("https://fixture.invalid", { headers: { Authorization: `Bearer test.${btoa(JSON.stringify({ aal: "aal2" }))}.test` } });
    const result = await generateEnglishContent(request, { table: "services", id: "editable", targetLanguage: "ms" }, f.client as unknown as GenerateEnglishClient);
    expect(result.status).toBe(400); expect(result.body.error).toContain("invalid page links");
    expect(f.writes.filter(write => write.table === "services")).toEqual([]);
    expect(f.tables.services[0].content_ms).toBeNull();
    expect(f.tables.translation_jobs.at(-1)?.status).toBe("failed");
  });
});
