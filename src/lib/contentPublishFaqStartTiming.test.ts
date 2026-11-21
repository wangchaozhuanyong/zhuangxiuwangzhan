import { afterEach, describe, expect, it, vi } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import {
  FAQ_START_TIMING_APPROVAL_ID,
  FAQ_START_TIMING_TARGET as target,
  FAQ_START_TIMING_TARGET_ID,
} from "../../supabase/functions/_shared/faq-start-timing-target.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";
import { assertFaqStartTimingEnvironment, readFaqStartTimingCopy } from "../../scripts/publish-faq-start-timing.mjs";

const sample = vi.hoisted(() => ({
  id: "9a7e3271-9c11-44ce-8efe-838dc4bdc16d",
  page_key: "general",
  sort_order: 130,
  status: "published",
  updated_at: "2026-11-21T01:31:48.375934+00:00",
  created_at: "2026-11-20T01:00:00+00:00",
  version: 1,
  question_en: "When does work start?",
  question_zh: "什么时候开工？",
  question_ms: "Bilakah kerja bermula?",
  answer_en: "Supposed timing: {X}.",
  answer_zh: "预计{占位}周。",
  answer_ms: "Dalam {X} minggu.",
}));
vi.mock("../../supabase/functions/_shared/faq-start-timing-target.ts", async importOriginal => {
  const original = await importOriginal<typeof import("../../supabase/functions/_shared/faq-start-timing-target.ts")>();
  const { createHash } = await import("node:crypto");
  const digest = createHash("sha256").update(JSON.stringify(Object.fromEntries(Object.entries(sample).sort(([a], [b]) => a.localeCompare(b))))).digest("hex");
  return { ...original, FAQ_START_TIMING_TARGET: { ...original.FAQ_START_TIMING_TARGET, baselineFieldsSha256: digest } };
});

const copy = readFaqStartTimingCopy();
const identity = { actorId: 12, repositoryId: 1248188229, runId: 12345, runAttempt: 1, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main" };
const context = { role: "content_editor", managedIdentity: identity };
const selection = { taskId: target.taskId, actionId: target.actionId, scope: target.scope,
  candidateVersion: target.candidateVersion, operation: "publish" as const };
const preview = { contentType: "faq", mode: "dry-run", nextStatus: "published",
  expectedUpdatedAt: target.expectedUpdatedAt, record: { id: target.id, ...copy }, managedCandidate: selection } satisfies ContentPublishRequest;
const publish = { ...preview, mode: "publish", ownerApproved: true, explicitExecution: true,
  approvalId: FAQ_START_TIMING_APPROVAL_ID,
  managedPermit: { ...selection, permitId: "11111111-1111-4111-8111-111111111111" },
} satisfies ContentPublishRequest;
type Row = Record<string, unknown>;
function database(row: Row = { ...sample }) {
  const writes: Array<{ table: string; fields: Row; filters: Array<[string, unknown]> }> = [];
  const inserts: string[] = [];
  let claimed = false;
  const rpc = vi.fn(async (name: string) => {
    if (name === "claim_managed_cms_release_permit") {
      if (claimed) return { data: [], error: null };
      claimed = true;
    }
    return { data: [{}], error: null };
  });
  const client = {
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      let fields: Row | undefined;
      const builder = {
        select() { return builder; },
        eq(key: string, value: unknown) { filters.push([key, value]); return builder; },
        update(values: Row) { fields = values; return builder; },
        insert() { inserts.push(table); return builder; },
        async single() { return { data: {}, error: null }; },
        async maybeSingle() {
          if (!filters.every(([key, value]) => row[key] === value)) return { data: null, error: null };
          if (fields) {
            writes.push({ table, fields, filters });
            Object.assign(row, fields, { updated_at: "2026-11-21T02:00:00+00:00" });
          }
          return { data: { ...row }, error: null };
        },
      };
      return builder;
    },
    rpc,
  } as unknown as ContentPublishClient;
  return { client, row, writes, inserts, rpc };
}

afterEach(() => vi.restoreAllMocks());

describe("FAQ 130 reviewed publication", () => {
  it("previews exactly the six reviewed questions and answers with zero writes or permit claims", async () => {
    const db = database();
    const result = await publishContent(preview, db.client, context);
    expect(result.body).toMatchObject({ ok: true, dry_run: true, performed_write: false, payload_preview: copy });
    expect(Object.values(copy).join(" ")).not.toMatch(/[\d{}]/);
    expect(db.row).toEqual(sample);
    expect(db.writes).toEqual([]);
    expect(db.inserts).toEqual([]);
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("rejects unrelated fields, stale versions and changed Malay copy before a write", async () => {
    for (const request of [
      { ...preview, record: { ...preview.record, question_ms: "Different?" } },
      { ...preview, record: { ...preview.record, sort_order: 131 } },
      { ...preview, record: { ...preview.record, question_zh: "" } },
      { ...preview, record: { ...preview.record, answer_ms: "A different answer." } },
      { ...preview, record: { ...preview.record, id: "22222222-2222-4222-8222-222222222222" } },
      { ...preview, expectedUpdatedAt: "2026-11-21T00:00:00Z" },
    ]) {
      const db = database();
      const result = await publishContent(request, db.client, context);
      expect(result.body.ok).toBe(false);
      expect(db.writes).toEqual([]);
      expect(db.rpc).not.toHaveBeenCalled();
    }
  });

  it("requires the independent approval and a verified identity before claiming the permit", async () => {
    const db = database();
    expect((await publishContent({ ...publish, approvalId: "not-the-owner-reference" }, db.client, context)).status).toBe(403);
    expect((await publishContent(publish, db.client, { role: "content_editor" })).status).toBe(403);
    expect(db.writes).toEqual([]);
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("updates six Q&A fields with version CAS exactly once and records the audit", async () => {
    const db = database();
    const result = await publishContent(publish, db.client, context);
    expect(result.body).toMatchObject({ ok: true, performed_write: true, saved_id: target.id });
    expect(db.writes).toEqual([{ table: "faqs", fields: copy, filters: [["id", target.id], ["updated_at", target.expectedUpdatedAt]] }]);
    expect(db.row).toEqual({ ...sample, ...copy, updated_at: "2026-11-21T02:00:00+00:00" });
    expect(db.inserts).toEqual(["admin_audit_logs"]);
    expect(db.rpc.mock.calls.map(([name]) => name)).toEqual([
      "claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write",
    ]);
    Object.assign(db.row, sample);
    expect((await publishContent(publish, db.client, context)).status).toBe(403);
    expect(db.writes).toHaveLength(1);
  });

  it("blocks local invocation, externally supplied permits and access to the issuer credential in dry runs", () => {
    const env = { GITHUB_ACTIONS: "true", GITHUB_REF: "refs/heads/main", GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_WORKFLOW_REF: identity.workflowRef, GITHUB_REPOSITORY_ID: "1248188229", GITHUB_SHA: identity.workflowSha,
      PUBLISH_TARGET: FAQ_START_TIMING_TARGET_ID, PUBLISH_MODE: "dry-run", MANAGED_OPERATION: "publish" };
    expect(() => assertFaqStartTimingEnvironment(env, identity.workflowSha)).not.toThrow();
    expect(() => assertFaqStartTimingEnvironment({ ...env, GITHUB_ACTIONS: "" }, identity.workflowSha)).toThrow();
    expect(() => assertFaqStartTimingEnvironment({ ...env, MANAGED_PERMIT_ID: publish.managedPermit.permitId }, identity.workflowSha)).toThrow();
    expect(() => assertFaqStartTimingEnvironment({ ...env, SUPABASE_SERVICE_ROLE_KEY: "fixture" }, identity.workflowSha)).toThrow();
    expect(() => assertFaqStartTimingEnvironment({ ...env, PUBLISH_MODE: "publish", APPROVAL_ID: publish.approvalId }, identity.workflowSha)).toThrow();
    expect(() => assertFaqStartTimingEnvironment({ ...env, PUBLISH_MODE: "publish", APPROVAL_ID: publish.approvalId,
      SUPABASE_SERVICE_ROLE_KEY: "fixture" }, identity.workflowSha)).not.toThrow();
  });
});
