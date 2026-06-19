import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown> & { id?: string; status?: string };
type Tables = Record<string, Row[]>;

const cloneRow = (row: Row): Row => ({ ...row });

function createMockContentClient(initialTables: Tables) {
  const tables: Tables = Object.fromEntries(
    Object.entries(initialTables).map(([table, rows]) => [table, rows.map(cloneRow)]),
  );
  let nextId = 1;

  const ensureTable = (table: string) => {
    tables[table] ||= [];
    return tables[table];
  };

  const matchFilters = (row: Row, filters: Array<[string, unknown]>) =>
    filters.every(([field, value]) => row[field] === value);

  const createBuilder = (table: string) => {
    const filters: Array<[string, unknown]> = [];
    let operation: "select" | "insert" | "update" = "select";
    let payload: Row | Row[] | null = null;

    const filteredRows = () => ensureTable(table).filter((row) => matchFilters(row, filters));
    const insertRows = () => {
      const rows = Array.isArray(payload) ? payload : payload ? [payload] : [];
      return rows.map((row) => {
        const saved = { ...row, id: row.id || `${table}-${nextId++}` };
        ensureTable(table).push(saved);
        return saved;
      });
    };
    const updateRows = () => {
      const rows = filteredRows();
      rows.forEach((row) => Object.assign(row, payload || {}));
      return rows;
    };
    const resolveRows = () => {
      if (operation === "insert") return insertRows();
      if (operation === "update") return updateRows();
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

describe("content-publish homepage", () => {
  it("returns a dry-run preview without writing homepage CMS records", async () => {
    const { client, tables } = createMockContentClient({
      site_pages: [{ id: "site-home", page_key: "home", path: "/", status: "published" }],
      faqs: [{ id: "faq-old", page_key: "home", status: "published" }],
      cta_blocks: [{ id: "cta-home", block_key: "home_final", status: "published" }],
    });

    const result = await publishContent(
      {
        contentType: "homepage",
        mode: "dry-run",
        nextStatus: "published",
        record: {
          sitePage: {
            page_key: "home",
            path: "/",
            seo_title_en: "Renovation Company Kuala Lumpur | FLASH CAST",
            unsupported_field: "ignored",
          },
          replaceFaqs: true,
          faqs: [{ question_en: "What do you handle?", answer_en: "Owner-approved services only." }],
          ctaBlocks: [{ block_key: "home_final", title_en: "Planning a renovation?", primary_url: "/quote" }],
        },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "cron" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.dry_run).toBe(true);
    expect(result.body.content_type).toBe("homepage");
    expect((result.body.payload_preview as { site_page: { action: string } }).site_page.action).toBe("update");
    expect(tables.site_pages[0].seo_title_en).toBeUndefined();
    expect(tables.faqs).toHaveLength(1);
    expect(result.body.warnings).toContain("Ignored unsupported site_page field: unsupported_field");
  });

  it("archives old homepage FAQs and writes approved homepage payload on publish", async () => {
    const { client, tables } = createMockContentClient({
      site_pages: [{ id: "site-home", page_key: "home", path: "/", status: "published" }],
      faqs: [{ id: "faq-old", page_key: "home", status: "published", question_en: "Old FAQ" }],
      cta_blocks: [{ id: "cta-home", block_key: "home_final", status: "published" }],
      admin_audit_logs: [],
    });

    const result = await publishContent(
      {
        contentType: "homepage",
        mode: "publish",
        nextStatus: "published",
        ownerApproved: true,
        explicitExecution: true,
        record: {
          sitePage: {
            page_key: "home",
            path: "/",
            seo_title_zh: "吉隆坡装修公司 | FLASH CAST",
            seo_title_en: "Renovation Company Kuala Lumpur | FLASH CAST",
          },
          replaceFaqs: true,
          faqs: [{ question_zh: "主要做什么？", question_en: "What do you handle?", answer_zh: "住宅和商业装修。", answer_en: "Home and commercial renovation." }],
          ctaBlocks: [{ block_key: "home_final", title_zh: "计划装修？", title_en: "Planning a renovation?", primary_url: "/quote" }],
        },
      },
      client as unknown as ContentPublishClient,
      { adminUserId: "admin-1", role: "content_editor", authMode: "cron" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.dry_run).toBe(false);
    expect(tables.site_pages[0].seo_title_en).toBe("Renovation Company Kuala Lumpur | FLASH CAST");
    expect(tables.cta_blocks[0].title_en).toBe("Planning a renovation?");
    expect(tables.faqs.find((row) => row.id === "faq-old")?.status).toBe("archived");
    expect(tables.faqs.some((row) => row.question_en === "What do you handle?" && row.status === "published")).toBe(true);
    expect(tables.admin_audit_logs.length).toBeGreaterThan(0);
  });
});
