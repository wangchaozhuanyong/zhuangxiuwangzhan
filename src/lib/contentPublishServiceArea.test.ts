import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";
import { targetConfigs } from "../../scripts/publish-content-trust-fixes.mjs";

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
      if (operation === "update") return filtered().map((row) => Object.assign(row, payload || {}));
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
        return Promise.resolve({ data: (operation === "select" ? filtered() : execute())[0] || null, error: null });
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

const publishedServiceArea = {
  // Generic publishing fixture stays outside the newly locked production-area identities.
  slug: "unlocked-area-test",
  title_zh: "Mont Kiara 装修规划",
  title_en: "Mont Kiara Renovation Planning",
  excerpt_zh: "为住宅与商业空间整理装修范围。",
  excerpt_en: "Organize renovation scope for residential and commercial spaces.",
  content_zh: "先核对现场条件、使用需求和施工范围。",
  content_en: "Start with site conditions, use requirements and the proposed work scope.",
  area_name: "Mont Kiara",
  property_types: ["Condominium", "Commercial unit"],
  common_needs: ["Layout planning", "Storage planning"],
  construction_notes_zh: "具体管理要求以相关管理处为准。",
  construction_notes_en: "Exact management requirements remain subject to the relevant management office.",
  projects: [{ title: "Living and dining concept", type: "Rendering concept", image: "/images/projects/mont-kiara.webp" }],
  faqs_zh: [{ q: "可以安排现场查看吗？", a: "可以先提供照片和大约面积，再讨论下一步。" }],
  faqs_en: [{ q: "Can a site visit be arranged?", a: "Share photos and the approximate area first so the next step can be discussed." }],
  seo_title_zh: "Mont Kiara 装修规划 | FLASH CAST",
  seo_title_en: "Mont Kiara Renovation Planning | FLASH CAST",
  seo_description_zh: "了解 Mont Kiara 装修范围、现场条件与咨询步骤。",
  seo_description_en: "Review renovation scope, site conditions and enquiry steps for Mont Kiara.",
  status: "published",
  sort_order: 10,
};

describe("content-publish service_area", () => {
  const locked = targetConfigs["selangor-service-area-r1-v4"].lockedCandidate;
  const selangor = { ...publishedServiceArea, id: locked.recordId, slug: locked.slug,
    updated_at: locked.expectedUpdatedAt, area_name: "Selangor" };
  const identity = { repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
    workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
    runId: 12345, runAttempt: 1 };
  const permit = { permitId: "11111111-1111-4111-8111-111111111111",
    taskId: locked.taskId, actionId: locked.actionId, operation: "publish" as const,
    scope: locked.scope, candidateVersion: locked.candidateVersion };

  it("blocks the Selangor row through generic admin and cron writes", async () => {
    let read = false;
    const client = { from: () => { read = true; throw new Error("must not read"); } };
    for (const record of [{ id: locked.recordId }, { slug: locked.slug }]) {
      const result = await publishContent({ contentType: "service_area", mode: "publish", nextStatus: "published",
        ownerApproved: true, explicitExecution: true, approvalId: "forged", record },
      client as unknown as ContentPublishClient, { role: "content_editor", authMode: "cron" });
      expect(result.status).toBe(403);
    }
    expect(read).toBe(false);
  });

  it.each([false, true])("uses an atomic Selangor version predicate; race=%s", async (race) => {
    const { client, tables } = createMockContentClient({ service_areas: [selangor], admin_audit_logs: [] });
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    Object.assign(client, { rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push({ name, args });
      if (name === "begin_managed_cms_release_write" && race) {
        tables.service_areas[0].updated_at = "2026-08-22T08:45:24.326900+00:00";
      }
      return { data: [{}], error: null };
    } });
    const record = { ...selangor, ...locked.desiredFields };
    const result = await publishContent({ contentType: "service_area", mode: "publish", nextStatus: "published",
      ownerApproved: true, explicitExecution: true, approvalId: "test-only", expectedUpdatedAt: locked.expectedUpdatedAt,
      record, managedPermit: permit }, client as unknown as ContentPublishClient,
    { role: "content_editor", authMode: "cron", managedIdentity: identity });
    expect(calls.map((call) => call.name)).toEqual([
      "claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write",
    ]);
    expect(result.status).toBe(race ? 409 : undefined);
    expect(calls.at(-1)?.args.p_success).toBe(!race);
    expect(tables.service_areas[0].content_zh).toBe(race ? selangor.content_zh : locked.desiredFields.content_zh);
  });
  it("validates a complete bilingual service area in dry-run mode", async () => {
    const { client } = createMockContentClient({ service_areas: [] });
    const result = await publishContent(
      { contentType: "service_area", mode: "dry-run", nextStatus: "published", record: publishedServiceArea },
      client as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "machine" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.content_type).toBe("service_area");
    expect((result.body.payload_preview as Row).slug).toBe("unlocked-area-test");
    expect(result.body.next_steps).toContain(
      "Verify /zh/locations/unlocked-area-test and /en/locations/unlocked-area-test in both languages after publishing.",
    );
  });

  it("rejects mismatched bilingual FAQ counts", async () => {
    const { client } = createMockContentClient({ service_areas: [] });
    const result = await publishContent(
      {
        contentType: "service_area",
        mode: "dry-run",
        nextStatus: "published",
        record: { ...publishedServiceArea, faqs_en: [...publishedServiceArea.faqs_en, { q: "Extra?", a: "Extra answer." }] },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toContain("count mismatch");
  });

  it("rejects non-WebP project assets on a published area", async () => {
    const { client } = createMockContentClient({ service_areas: [] });
    const result = await publishContent(
      {
        contentType: "service_area",
        mode: "dry-run",
        nextStatus: "published",
        record: { ...publishedServiceArea, projects: [{ title: "Concept", type: "Rendering", image: "/images/concept.jpg" }] },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toContain("WebP");
  });

  it("publishes one existing bilingual area with optimistic locking and audit history", async () => {
    const existing = { ...publishedServiceArea, id: "area-1", updated_at: "2026-08-22T10:00:00.000Z" };
    const { client, tables } = createMockContentClient({ service_areas: [existing], admin_audit_logs: [] });
    const result = await publishContent(
      {
        contentType: "service_area",
        mode: "publish",
        nextStatus: "published",
        expectedUpdatedAt: existing.updated_at,
        ownerApproved: true,
        explicitExecution: true,
        approvalId: "OWNER-STANDING-WEBSITE-CONTENT-2026-08-14",
        record: { ...existing, excerpt_en: "Updated scope planning copy." },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "machine" },
    );

    expect(result.body.ok).toBe(true);
    expect(tables.service_areas[0].excerpt_en).toBe("Updated scope planning copy.");
    expect(tables.admin_audit_logs).toHaveLength(1);
    expect(tables.admin_audit_logs[0].table_name).toBe("service_areas");
  });

  it("blocks an existing area update without expectedUpdatedAt", async () => {
    const existing = { ...publishedServiceArea, id: "area-1", updated_at: "2026-08-22T10:00:00.000Z" };
    const { client } = createMockContentClient({ service_areas: [existing] });
    const result = await publishContent(
      {
        contentType: "service_area",
        mode: "publish",
        nextStatus: "published",
        ownerApproved: true,
        explicitExecution: true,
        approvalId: "OWNER-STANDING-WEBSITE-CONTENT-2026-08-14",
        record: { ...publishedServiceArea, id: "area-1" },
      },
      client as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "machine" },
    );

    expect(result.status).toBe(409);
    expect(result.body.error).toContain("expectedUpdatedAt");
  });
});
