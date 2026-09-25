import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { MANAGED_BLOGS } from "../../supabase/functions/content-publish/managed-targets.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";
import { assertLockedServiceCandidate, targetConfigs, stableDigest } from "../../scripts/publish-content-trust-fixes.mjs";

type Row = Record<string, unknown>;
const baseline = (version: string): Row => {
  const file = resolve(process.cwd(), `drafts/seo/fc-20260925-three-blog-managed-target-code-v1/blog-${version}-baseline.json`);
  const raw = JSON.parse(readFileSync(file, "utf8"));
  return raw.row || raw;
};
const identity = { repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1 };
const context = { role: "content_editor" as const, authMode: "cron" as const, managedIdentity: identity };
const permitFor = (target: typeof MANAGED_BLOGS[number]) => ({
  permitId: "11111111-1111-4111-8111-111111111111", taskId: target.taskId,
  actionId: target.actionId, operation: "publish" as const, scope: target.scope,
  candidateVersion: target.candidateVersion,
});

function mockClient(initial: Row, { race = false, replay = false } = {}) {
  const row = { ...initial };
  const writes: Row[] = [];
  const calls: Array<{ name: string; args: Row }> = [];
  const from = (table: string) => {
    const filters: Array<[string, unknown]> = [];
    let payload: Row | null = null;
    const selected = () => table === "blog_posts"
      && filters.every(([key, value]) => row[key] === value) ? row : null;
    const builder = {
      select() { return builder; },
      eq(key: string, value: unknown) { filters.push([key, value]); return builder; },
      update(next: Row) { payload = next; return builder; },
      insert() { throw new Error("managed Blog cannot insert"); },
      async maybeSingle() {
        if (payload) {
          const found = selected();
          if (!found) return { data: null, error: null };
          writes.push(payload);
          Object.assign(row, payload);
          return { data: { ...row }, error: null };
        }
        return { data: selected() ? { ...row } : null, error: null };
      },
      async single() { return { data: { ...row }, error: null }; },
    };
    return builder;
  };
  const client = { from, async rpc(name: string, args: Row) {
    calls.push({ name, args });
    if (name === "claim_managed_cms_release_permit" && replay) return { data: [], error: null };
    if (name === "begin_managed_cms_release_write" && race) row.updated_at = "2026-08-22T12:23:13.790059+00:00";
    return { data: [{}], error: null };
  } } as unknown as ContentPublishClient;
  return { client, row, writes, calls };
}

const requestFor = (target: typeof MANAGED_BLOGS[number], row: Row, changes: Row = {}): ContentPublishRequest => ({
  contentType: "blog", mode: "publish", nextStatus: "published", ownerApproved: true,
  explicitExecution: true, approvalId: "test-only", expectedUpdatedAt: String(row.updated_at),
  record: { ...row, ...targetConfigs[`blog-${target.candidateVersion}`].lockedCandidate.desiredFields, ...changes },
  managedPermit: permitFor(target),
});

describe("three locked managed Blog rows", () => {
  it.each(MANAGED_BLOGS)("uses one exact patch and a one-time CAS for $slug", async (target) => {
    const locked = targetConfigs[`blog-${target.candidateVersion}`].lockedCandidate;
    expect(targetConfigs[`blog-${target.candidateVersion}`].table).toBe("blog_posts");
    const before = baseline(target.candidateVersion);
    const sourceSha = createHash("sha256").update(readFileSync(resolve(process.cwd(), locked.sourceCandidatePath))).digest("hex");
    const baselineSha = createHash("sha256").update(readFileSync(resolve(process.cwd(),
      `drafts/seo/fc-20260925-three-blog-managed-target-code-v1/blog-${target.candidateVersion}-baseline.json`))).digest("hex");
    expect(sourceSha).toBe(locked.sourceCandidateSha256);
    expect(baselineSha).toBe(locked.rollbackRecordSha256);
    expect(stableDigest(locked.desiredFields)).toBe(target.desiredFieldsSha256);
    expect(() => assertLockedServiceCandidate(locked, before)).not.toThrow();
    expect(() => assertLockedServiceCandidate(locked, { ...before, updated_at: "2026-08-22T12:23:13.790059+00:00" })).toThrow();
    const { client, row, writes, calls } = mockClient(before);
    const request = requestFor(target, before);
    const dryRun = await publishContent({ ...request, mode: "dry-run" }, client, context);
    expect(dryRun.body.ok, String(dryRun.body.error)).toBe(true);
    expect(dryRun.body.payload_preview).toEqual(locked.desiredFields);
    expect(writes).toHaveLength(0);
    const result = await publishContent(request, client, context);
    expect(result.body.ok).toBe(true);
    expect(writes).toEqual([locked.desiredFields]);
    expect(writes[0]).not.toHaveProperty("published_at");
    expect(row.published_at).toBe(before.published_at);
    expect(calls.map(({ name }) => name)).toEqual([
      "claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write",
    ]);
    expect(calls[0].args.p_payload_sha256).toBe(stableDigest(dryRun.body.payload_preview));
    expect(calls[0].args.p_record_id).toBe(target.id);
  });

  it("rejects ID or slug without trusted identity before any database read", async () => {
    let reads = 0;
    const client = { from: () => { reads++; throw new Error("unexpected read"); } } as unknown as ContentPublishClient;
    for (const target of MANAGED_BLOGS) {
      for (const record of [{ id: target.id }, { slug: target.slug }]) {
        const result = await publishContent({ contentType: "blog", mode: "publish", record }, client,
          { role: "content_editor", authMode: "cron" });
        expect(result.status).toBe(403);
      }
    }
    expect(reads).toBe(0);
  });

  it("previews and restores only the original fields under a distinct rollback permit", async () => {
    const target = MANAGED_BLOGS[0];
    const before = baseline(target.candidateVersion);
    const locked = targetConfigs[`blog-${target.candidateVersion}`].lockedCandidate;
    const current = { ...before, ...locked.desiredFields, updated_at: "2026-09-25T03:00:00.123456+00:00" };
    const { client, writes } = mockClient(current);
    const request: ContentPublishRequest = { contentType: "blog", mode: "dry-run", nextStatus: "published",
      expectedUpdatedAt: String(current.updated_at), managedOperation: "rollback", record: before };
    const preview = await publishContent(request, client, context);
    const restoredPatch = Object.fromEntries(target.changedFields!.map((field) => [field, before[field]]));
    expect(preview.body.payload_preview).toEqual(restoredPatch);
    expect(writes).toHaveLength(0);
    const result = await publishContent({ ...request, mode: "publish", ownerApproved: true,
      explicitExecution: true, approvalId: "test-only", managedPermit: { ...permitFor(target),
        operation: "rollback", actionId: `rollback-${target.candidateVersion}`,
        candidateVersion: `${target.candidateVersion}-rollback-v1` } }, client, context);
    expect(result.body.ok).toBe(true);
    expect(writes).toEqual([restoredPatch]);
    expect(writes[0]).not.toHaveProperty("published_at");
  });

  it("rejects wrong identity, unrelated field, cross-Blog content, replay and version drift", async () => {
    const target = MANAGED_BLOGS[0];
    const before = baseline(target.candidateVersion);
    const other = targetConfigs[`blog-${MANAGED_BLOGS[1].candidateVersion}`].lockedCandidate;
    const variants = [
      { request: { ...requestFor(target, before), managedPermit: undefined } },
      { request: { ...requestFor(target, before), managedPermit: { ...permitFor(target), scope: "flashcast.com.my:other" } } },
      { request: { ...requestFor(target, before), managedPermit: { ...permitFor(target), taskId: "other-task" } } },
      { request: { ...requestFor(target, before), managedPermit: { ...permitFor(target), actionId: "other-action" } } },
      { request: requestFor(target, before, { id: MANAGED_BLOGS[1].id }) },
      { request: requestFor(target, before, { slug: MANAGED_BLOGS[1].slug }) },
      { request: requestFor(target, before, { title_en: "Unapproved title" }) },
      { request: requestFor(target, before, { published_at: "2026-05-27T02:00:00+00:00" }) },
      { request: { ...requestFor(target, before), nextStatus: "draft" } },
      { request: requestFor(target, before, { content_en: other.desiredFields.content_en }) },
      { request: { ...requestFor(target, before), expectedUpdatedAt: "2026-08-22T12:23:13.790059+00:00" } },
    ];
    for (const { request } of variants) {
      const { client, writes } = mockClient(before);
      const result = await publishContent(request as ContentPublishRequest, client, context);
      expect(result.body.ok).toBe(false);
      expect(writes).toHaveLength(0);
    }
    for (const options of [{ replay: true }, { race: true }]) {
      const { client, writes } = mockClient(before, options);
      const result = await publishContent(requestFor(target, before), client, context);
      expect(result.body.ok).toBe(false);
      expect(writes).toHaveLength(0);
    }
  });
});
