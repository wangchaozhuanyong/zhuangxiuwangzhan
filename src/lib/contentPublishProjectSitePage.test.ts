import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown> & { id?: string };
type Tables = Record<string, Row[]>;

function createMockContentClient(initialTables: Tables) {
  const tables: Tables = Object.fromEntries(
    Object.entries(initialTables).map(([table, rows]) => [table, rows.map((row) => ({ ...row }))]),
  );
  let nextId = 1;

  const rowsFor = (table: string) => (tables[table] ||= []);
  const createBuilder = (table: string) => {
    const filters: Array<[string, unknown]> = [];
    let operation: "select" | "insert" | "update" = "select";
    let payload: Row | Row[] | null = null;
    const matches = (row: Row) => filters.every(([field, value]) => row[field] === value);
    const filtered = () => rowsFor(table).filter(matches);
    const execute = () => {
      if (operation === "insert") {
        const items = Array.isArray(payload) ? payload : payload ? [payload] : [];
        return items.map((item) => {
          const saved = { ...item, id: item.id || `${table}-${nextId++}` };
          rowsFor(table).push(saved);
          return saved;
        });
      }
      if (operation === "update") {
        return filtered().map((row) => Object.assign(row, payload || {}));
      }
      return filtered();
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
        return Promise.resolve({ data: filtered()[0] || null, error: null });
      },
      single() {
        return Promise.resolve({ data: execute()[0] || null, error: null });
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
        return Promise.resolve({ data: execute(), error: null }).then(resolve, reject);
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

const publishedProject = {
  slug: "hair-salon-renovation",
  title_zh: "理发店装修",
  title_en: "Hair Salon Renovation",
  excerpt_zh: "理发店动线、灯光与收纳规划。",
  excerpt_en: "Hair salon circulation, lighting, and storage planning.",
  content_zh: "以功能和顾客体验为重点的装修说明。",
  content_en: "A renovation concept focused on function and customer experience.",
  image_url: "/images/projects/hair-salon.webp",
  seo_title_zh: "理发店装修案例 | FLASH CAST",
  seo_title_en: "Hair Salon Renovation Case | FLASH CAST",
  seo_description_zh: "查看理发店空间动线、灯光和收纳装修方案。",
  seo_description_en: "Review a hair salon renovation concept covering circulation, lighting, and storage.",
};

describe("content-publish project and site_page", () => {
  it("keeps project publishing location-neutral", async () => {
    const { client } = createMockContentClient({ projects: [] });
    const result = await publishContent(
      {
        contentType: "project",
        mode: "dry-run",
        nextStatus: "published",
        record: { ...publishedProject, location: "Kuala Lumpur", area: "Mont Kiara" },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.content_type).toBe("project");
    expect((result.body.payload_preview as Row).location).toBeNull();
    expect((result.body.payload_preview as Row).area).toBeNull();
    expect(result.body.warnings).toContain("Project location and area were removed to keep case descriptions location-neutral.");
  });

  it("publishes a standalone bilingual site page with audit history", async () => {
    const { client, tables } = createMockContentClient({ site_pages: [], admin_audit_logs: [] });
    const result = await publishContent(
      {
        contentType: "site_page",
        mode: "publish",
        nextStatus: "published",
        ownerApproved: true,
        explicitExecution: true,
        approvalId: "OWNER-STANDING-WEBSITE-CONTENT-2026-08-14",
        record: {
          page_key: "services",
          path: "/services",
          title_zh: "理发店装修",
          title_en: "Hair Salon Renovation",
          seo_title_zh: "理发店装修 | FLASH CAST",
          seo_title_en: "Hair Salon Renovation | FLASH CAST",
          seo_description_zh: "理发店空间规划与装修服务。",
          seo_description_en: "Hair salon space planning and renovation service.",
        },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor", adminUserId: "admin-1", authMode: "admin" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.content_type).toBe("site_page");
    expect(tables.site_pages).toHaveLength(1);
    expect(tables.admin_audit_logs).toHaveLength(1);
    expect(tables.admin_audit_logs[0].table_name).toBe("site_pages");
  });

  it("keeps legacy material dry-runs independent from the optional gallery migration", async () => {
    const { client, tables } = createMockContentClient({ materials: [] });
    const result = await publishContent(
      {
        contentType: "material",
        mode: "dry-run",
        record: { slug: "legacy-board", title_zh: "板材", title_en: "Board" },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.content_type).toBe("material");
    expect(tables.material_images).toBeUndefined();
    expect((result.body.payload_preview as { material: Row }).material).not.toHaveProperty("price_mode");
  });
});
