import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";
import { targetConfigs } from "../../scripts/publish-content-trust-fixes.mjs";

const publishedServiceRecord = {
  slug: "office-renovation",
  title_zh: "办公室装修",
  title_en: "Office Renovation",
  excerpt_zh: "办公室规划与施工。",
  excerpt_en: "Office planning and fit-out.",
  content_zh: "<p>按现场条件规划。</p>",
  content_en: "<p>Plan around the site conditions.</p>",
  image_url: "/images/services/office-renovation.webp",
  alt_zh: "办公室装修项目",
  alt_en: "Office renovation project",
  suitable_for_zh: ["办公室"],
  suitable_for_en: ["Office"],
  common_projects_zh: ["空间规划"],
  common_projects_en: ["Space planning"],
  scope_items_zh: ["隔间"],
  scope_items_en: ["Partitions"],
  process_steps_zh: [{ title: "现场评估", desc: "确认范围。" }],
  process_steps_en: [{ title: "Site review", desc: "Confirm the scope." }],
  faqs_zh: [{ q: "可以分阶段施工吗？", a: "可按现场条件讨论。" }],
  faqs_en: [{ q: "Can work be phased?", a: "Phasing can be discussed after a site review." }],
  seo_title_zh: "办公室装修 | FLASH CAST",
  seo_title_en: "Office Renovation | FLASH CAST",
  seo_description_zh: "办公室装修规划与施工服务。",
  seo_description_en: "Office renovation planning and fit-out services.",
};

const createReadOnlyClient = () => ({
  from() {
    const builder = {
      select() {
        return builder;
      },
      eq() {
        return builder;
      },
      maybeSingle() {
        return Promise.resolve({ data: null, error: null });
      },
    };
    return builder;
  },
});

describe("content-publish service", () => {
  it.each(["kitchen-r1-cms-row-20260924-v1", "design-r1-cms-row-20260924-v1"])(
    "requires exact QA-locked fields and a distinct permit for %s", async (name) => {
      const locked = targetConfigs[name].lockedCandidate;
      const current = { ...publishedServiceRecord, id: locked.recordId, slug: locked.slug,
        updated_at: locked.expectedUpdatedAt, status: "published" };
      const calls: string[] = [];
      const predicates: Array<[string, unknown]> = [];
      const finishResults: unknown[] = [];
      let writePayload: Record<string, unknown> | null = null;
      const raced = name.startsWith("design-");
      const client = {
        from(table: string) {
          if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
          const builder = { select() { return builder; },
            eq(field: string, value: unknown) { if (writePayload) predicates.push([field, value]); return builder; },
            maybeSingle: async () => ({ data: writePayload ? raced ? null : { ...current, ...writePayload } : current, error: null }),
            update(payload: Record<string, unknown>) { calls.push("write"); writePayload = payload; return builder; },
            single: async () => ({ data: { ...current, ...writePayload, updated_at: "2026-09-24T00:00:00.000001Z" }, error: null }),
          };
          return builder;
        },
        async rpc(operation: string, args: Record<string, unknown>) {
          calls.push(operation);
          if (operation === "finish_managed_cms_release_write") finishResults.push(args.p_success);
          return { data: [{}], error: null };
        },
      };
      const request = { contentType: "service" as const, mode: "publish" as const,
        nextStatus: "published" as const, ownerApproved: true, explicitExecution: true,
        approvalId: "test-only", expectedUpdatedAt: locked.expectedUpdatedAt,
        record: { ...current, ...locked.desiredFields },
        managedPermit: { permitId: "11111111-1111-4111-8111-111111111111", taskId: locked.taskId,
          actionId: locked.actionId, operation: "publish" as const,
          scope: locked.scope, candidateVersion: locked.candidateVersion },
      };
      const context = { role: "content_editor", authMode: "cron", managedIdentity: {
        repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
        workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
        runId: 12345, runAttempt: 1,
      } };
      const originalField = request.record[locked.changedFields[0]];
      const changedField = Array.isArray(originalField)
        ? [...originalField, { q: "Forged question?", a: "Forged answer." }]
        : `${originalField} forged`;
      const tampered = await publishContent({ ...request,
        record: { ...request.record, [locked.changedFields[0]]: changedField } },
      client as unknown as ContentPublishClient, context);
      expect(tampered.status).toBe(403);
      expect(calls).toHaveLength(0);
      const exact = await publishContent(request, client as unknown as ContentPublishClient, context);
      expect(exact.status).toBe(raced ? 409 : undefined);
      expect(predicates).toContainEqual(["updated_at", locked.expectedUpdatedAt]);
      expect(finishResults).toEqual([!raced]);
      expect(calls).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "write", "finish_managed_cms_release_write"]);
    },
  );
  it("requires a matching one-time database claim before a managed service write", async () => {
    const id = "b401a610-a4dc-4a0b-a7e0-efcac6c81d71";
    const updatedAt = "2026-08-30T10:55:12.151465+00:00";
    const current = { ...publishedServiceRecord, id, slug: "builtin", updated_at: updatedAt, status: "published" };
    const calls: string[] = [];
    let allowClaim = false;
    const client = {
      from(table: string) {
        if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
        const builder = {
          select() { return builder; },
          eq() { return builder; },
          update() { calls.push("write"); return builder; },
          maybeSingle: async () => ({ data: current, error: null }),
          single: async () => ({ data: { ...current, updated_at: "later" }, error: null }),
        };
        return builder;
      },
      async rpc(name: string, args: Record<string, unknown>) {
        calls.push(name);
        if (name === "claim_managed_cms_release_permit") {
          expect(args.p_task_id).toBe("fc-20260920-builtin-whole-house-custom-v1");
          expect(args.p_github_run_id).toBe(12345);
          expect(args.p_payload_sha256).toMatch(/^[0-9a-f]{64}$/);
          return { data: allowClaim ? [{}] : [], error: null };
        }
        return { data: [{}], error: null };
      },
    };
    const request = {
      contentType: "service" as const, mode: "publish" as const, nextStatus: "published" as const,
      ownerApproved: true, explicitExecution: true, approvalId: "audit-only",
      expectedUpdatedAt: updatedAt, record: current,
      managedPermit: { permitId: "11111111-1111-4111-8111-111111111111", taskId: "fc-20260920-builtin-whole-house-custom-v1",
        actionId: "publish-builtin-whole-house-custom-v1", operation: "publish" as const,
        scope: "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71", candidateVersion: "builtin-whole-house-custom-v1" },
    };
    const context = { role: "content_editor", authMode: "cron", managedIdentity: {
      repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40), workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
      runId: 12345, runAttempt: 1,
    } };
    const denied = await publishContent(request, client as unknown as ContentPublishClient, context);
    expect(denied.status).toBe(403);
    expect(calls).toEqual(["claim_managed_cms_release_permit"]);
    calls.length = 0;
    allowClaim = true;
    const permitted = await publishContent(request, client as unknown as ContentPublishClient, context);
    expect(permitted.body.ok).toBe(true);
    expect(calls).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "write", "finish_managed_cms_release_write"]);
    calls.length = 0;
    const rollback = { ...request, managedPermit: { ...request.managedPermit,
      permitId: "22222222-2222-4222-8222-222222222222", operation: "rollback" as const,
      actionId: "rollback-builtin-whole-house-custom-v1",
      candidateVersion: "builtin-whole-house-custom-v1-rollback-v1" } };
    const restored = await publishContent(rollback, client as unknown as ContentPublishClient, context);
    expect(restored.body.ok).toBe(true);
    expect(calls[0]).toBe("claim_managed_cms_release_permit");
    calls.length = 0;
    const wrongRollback = await publishContent({ ...rollback, managedPermit: { ...rollback.managedPermit, actionId: "publish-builtin-whole-house-custom-v1" } },
      client as unknown as ContentPublishClient, context);
    expect(wrongRollback.status).toBe(403);
    expect(calls).toHaveLength(0);
  });
  it.each([
    ["b401a610-a4dc-4a0b-a7e0-efcac6c81d71", "builtin"],
    ["0d947129-0595-43ef-baa1-0fd9d8b870e6", "renovation"],
    ["32f5374f-9919-41ea-80c7-00b5ac917532", "shop-renovation"],
  ])("blocks managed service %s before legacy cron/admin writes", async (id, slug) => {
    let databaseAccessed = false;
    const client = { from: () => { databaseAccessed = true; throw new Error("Database should not be reached"); } };
    for (const record of [{ id, slug }, { id }, { slug }]) {
      const result = await publishContent(
        { contentType: "service", mode: "publish", nextStatus: "published", ownerApproved: true,
          explicitExecution: true, approvalId: "caller-controlled", record },
        client as unknown as ContentPublishClient,
        { role: "content_editor", authMode: "cron" },
      );
      expect(result.status).toBe(403);
      expect(result.body.error).toContain("trusted one-time permit");
    }
    expect(databaseAccessed).toBe(false);
  });

  it("rejects incomplete published services before writing", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "published",
        record: { slug: "shop-renovation", title_en: "Shop Renovation" },
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toContain("Published service requires bilingual content");
    expect(result.body.error).toContain("title_zh");
    expect(result.body.error).toContain("image_url");
    expect(result.body.error).toContain("faqs_zh");
  });

  it("returns a dry-run preview for a complete published service", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "published",
        record: publishedServiceRecord,
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "admin" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.dry_run).toBe(true);
    expect(result.body.content_type).toBe("service");
    expect((result.body.payload_preview as Record<string, unknown>).status).toBe("published");
  });

  it("blocks non-WebP images from being published", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "published",
        record: { ...publishedServiceRecord, image_url: "https://images.example.com/office-renovation.jpg" },
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "admin" },
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toContain("must use a WebP image");
  });

  it("accepts Supabase render URLs that explicitly deliver WebP", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "published",
        record: {
          ...publishedServiceRecord,
          image_url: "https://example.supabase.co/storage/v1/render/image/public/site-images/office.jpg?width=1200&format=webp",
        },
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "admin" },
    );

    expect(result.body.ok).toBe(true);
  });

  it("keeps non-WebP images editable in drafts", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "draft",
        record: { slug: "office-draft", image_url: "/images/services/office-draft.jpg" },
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "admin" },
    );

    expect(result.body.ok).toBe(true);
    expect((result.body.payload_preview as Record<string, unknown>).status).toBe("draft");
  });
});
