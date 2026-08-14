import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown> & { id?: string; status?: string };
type Tables = Record<string, Row[]>;

const publishedBlogRecord = {
  slug: "kitchen-renovation-planning",
  title_zh: "厨房装修规划指南",
  title_en: "Kitchen Renovation Planning Guide",
  excerpt_zh: "整理厨房装修前需要确认的重点。",
  excerpt_en: "What to confirm before planning a kitchen renovation.",
  content_zh: "<p>先确认使用习惯、收纳需求和现场条件。</p>",
  content_en: "<p>Confirm usage, storage needs, and site conditions first.</p>",
  category: "Guides",
  tags: [" kitchen ", "planning"],
  cover_image_url: "/images/blog/kitchen-planning.webp",
  alt_zh: "厨房装修规划效果图",
  alt_en: "Kitchen renovation planning concept",
  seo_title_zh: "厨房装修规划指南 | FLASH CAST",
  seo_title_en: "Kitchen Renovation Planning Guide | FLASH CAST",
  seo_description_zh: "了解厨房装修前需要确认的布局、收纳和材料规划。",
  seo_description_en: "Review layout, storage, and material planning before a kitchen renovation.",
};

function createMockContentClient(initialTables: Tables) {
  const tables: Tables = Object.fromEntries(
    Object.entries(initialTables).map(([table, rows]) => [table, rows.map((row) => ({ ...row }))]),
  );
  let nextId = 1;

  const ensureTable = (table: string) => {
    tables[table] ||= [];
    return tables[table];
  };
  const matches = (row: Row, filters: Array<[string, unknown]>) =>
    filters.every(([field, value]) => row[field] === value);

  const createBuilder = (table: string) => {
    const filters: Array<[string, unknown]> = [];
    let operation: "select" | "insert" | "update" = "select";
    let payload: Row | Row[] | null = null;
    const filteredRows = () => ensureTable(table).filter((row) => matches(row, filters));
    const resolveRows = () => {
      if (operation === "insert") {
        const rows = Array.isArray(payload) ? payload : payload ? [payload] : [];
        return rows.map((row) => {
          const saved = { ...row, id: row.id || `${table}-${nextId++}` };
          ensureTable(table).push(saved);
          return saved;
        });
      }
      if (operation === "update") {
        const rows = filteredRows();
        rows.forEach((row) => Object.assign(row, payload || {}));
        return rows;
      }
      return filteredRows();
    };
    const builder = {
      select() {
        return builder;
      },
      eq(field: string, value: unknown) {
        filters.push([field, value]);
        return builder;
      },
      maybeSingle() {
        return Promise.resolve({ data: filteredRows()[0] || null, error: null });
      },
      single() {
        return Promise.resolve({ data: resolveRows()[0] || null, error: null });
      },
      insert(nextPayload: Row | Row[]) {
        operation = "insert";
        payload = nextPayload;
        return builder;
      },
      update(nextPayload: Row) {
        operation = "update";
        payload = nextPayload;
        return builder;
      },
      then(resolve: (value: { data: Row[]; error: null }) => unknown, reject?: (reason: unknown) => unknown) {
        return Promise.resolve({ data: resolveRows(), error: null }).then(resolve, reject);
      },
    };
    return builder;
  };

  return {
    tables,
    client: {
      from(table: string) {
        return createBuilder(table);
      },
    },
  };
}

describe("content-publish blog", () => {
  it("returns a cleaned bilingual dry-run preview without writing", async () => {
    const { client, tables } = createMockContentClient({ blog_posts: [], admin_audit_logs: [] });

    const result = await publishContent(
      {
        contentType: "blog",
        mode: "dry-run",
        nextStatus: "published",
        record: publishedBlogRecord,
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "cron" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.dry_run).toBe(true);
    expect(result.body.content_type).toBe("blog");
    expect(result.body.action).toBe("publish");
    expect((result.body.payload_preview as Row).slug).toBe("kitchen-renovation-planning");
    expect((result.body.payload_preview as Row).tags).toEqual(["kitchen", "planning"]);
    expect(tables.blog_posts).toHaveLength(0);
    expect(tables.admin_audit_logs).toHaveLength(0);
  });

  it("updates an approved blog post and writes an audit record", async () => {
    const { client, tables } = createMockContentClient({
      blog_posts: [{ id: "blog-1", ...publishedBlogRecord, title_en: "Old title", status: "draft", updated_at: "2026-08-14T01:00:00.000Z" }],
      admin_audit_logs: [],
    });

    const result = await publishContent(
      {
        contentType: "blog",
        mode: "publish",
        nextStatus: "published",
        ownerApproved: true,
        explicitExecution: true,
        approvalId: "owner-approved-2026-08-14",
        expectedUpdatedAt: "2026-08-14T01:00:00.000Z",
        record: { id: "blog-1", ...publishedBlogRecord },
      },
      client as unknown as ContentPublishClient,
      { adminUserId: "admin-1", role: "content_editor", authMode: "admin" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.action).toBe("publish");
    expect(tables.blog_posts[0].title_en).toBe("Kitchen Renovation Planning Guide");
    expect(tables.blog_posts[0].status).toBe("published");
    expect(tables.admin_audit_logs).toHaveLength(1);
    expect(tables.admin_audit_logs[0].table_name).toBe("blog_posts");
  });

  it("rejects unknown fields and incomplete published records", async () => {
    const { client } = createMockContentClient({ blog_posts: [] });

    const unknownField = await publishContent(
      {
        contentType: "blog",
        mode: "dry-run",
        record: { slug: "test", title_en: "Test", unexpected: true },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor" },
    );
    const incomplete = await publishContent(
      {
        contentType: "blog",
        mode: "dry-run",
        nextStatus: "published",
        record: { slug: "test", title_en: "Test" },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(unknownField.status).toBe(400);
    expect(unknownField.body.error).toContain("Unsupported blog field");
    expect(incomplete.status).toBe(400);
    expect(incomplete.body.error).toContain("Published blog requires bilingual content");
  });

  it("returns a conflict when the expected update timestamp is stale", async () => {
    const { client } = createMockContentClient({
      blog_posts: [{ id: "blog-1", ...publishedBlogRecord, updated_at: "2026-08-14T02:00:00.000Z" }],
    });

    const result = await publishContent(
      {
        contentType: "blog",
        mode: "dry-run",
        nextStatus: "published",
        expectedUpdatedAt: "2026-08-14T01:00:00.000Z",
        record: { id: "blog-1", ...publishedBlogRecord },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.status).toBe(409);
    expect(result.body.currentUpdatedAt).toBe("2026-08-14T02:00:00.000Z");
  });
});
