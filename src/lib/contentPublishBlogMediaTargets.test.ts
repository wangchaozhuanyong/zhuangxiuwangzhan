import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { issueManagedPermit } from "../../supabase/functions/content-publish/permit-issuer.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";
import { MANAGED_TARGETS } from "../../supabase/functions/content-publish/managed-targets.ts";
import { targetConfigs, assertLockedServiceCandidate, buildLockedDryRunRequest, stableDigest } from "../../scripts/publish-content-trust-fixes.mjs";

const names = ["blog-kitchen-cabinet-media-r1-v1", "blog-office-checklist-media-r1-v1"] as const;
const permitId = "11111111-1111-4111-8111-111111111111";
const identity = { repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1 };
const context = { role: "content_editor" as const, authMode: "cron" as const, managedIdentity: identity };
type Row = Record<string, unknown>;

const fixture = (name: string) => {
  const config = targetConfigs[name];
  const locked = config.lockedCandidate;
  const row = JSON.parse(readFileSync(resolve(process.cwd(), locked.rollbackRecordPath), "utf8")) as Row;
  return { config, locked, row };
};

function mockClient(initial: Row, concurrentChange = false) {
  const row = { ...initial };
  const writes: Row[] = [];
  const calls: Array<{ name: string; args: Row }> = [];
  let claimed = false;
  const client = {
    from(table: string) {
      if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
      const filters: Array<[string, unknown]> = [];
      let patch: Row | null = null;
      const selected = () => filters.every(([field, value]) => row[field] === value) ? row : null;
      const builder = {
        select() { return builder; },
        eq(field: string, value: unknown) { filters.push([field, value]); return builder; },
        update(value: Row) { patch = value; return builder; },
        async maybeSingle() {
          const found = selected();
          if (!found) return { data: null, error: null };
          if (patch) {
            writes.push(patch);
            Object.assign(row, patch, { updated_at: "2026-09-26T12:00:00.000001+00:00" });
          }
          return { data: { ...row }, error: null };
        },
      };
      return builder;
    },
    async rpc(name: string, args: Row) {
      calls.push({ name, args });
      if (name === "claim_managed_cms_release_permit") {
        if (claimed || args.p_github_repository_id !== identity.repositoryId) return { data: [], error: null };
        claimed = true;
        if (concurrentChange) row.updated_at = "2026-09-26T13:00:00.000002+00:00";
      }
      return { data: [{}], error: null };
    },
  } as unknown as ContentPublishClient;
  return { client, row, writes, calls };
}

const requestFor = (name: string, row: Row): ContentPublishRequest => {
  const { config, locked } = fixture(name);
  return {
    contentType: config.contentType, mode: "publish", nextStatus: "published",
    ownerApproved: true, explicitExecution: true, approvalId: "test-only",
    expectedUpdatedAt: locked.expectedUpdatedAt,
    record: { ...row, ...locked.desiredFields },
    managedPermit: { permitId, taskId: locked.taskId, actionId: locked.actionId,
      operation: "publish", scope: locked.scope, candidateVersion: locked.candidateVersion },
  };
};

describe("two exact Blog media CMS targets", () => {
  it("pins two original three-field media candidates, baselines and workflow choices", () => {
    const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/content-publish-approved.yml"), "utf8");
    for (const name of names) {
      const { config, locked, row } = fixture(name);
      expect(workflow.split(name)).toHaveLength(locked.rollbackAllowed === false ? 3 : 4);
      expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), locked.sourceCandidatePath))).digest("hex"))
        .toBe(locked.sourceCandidateSha256);
      expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), locked.rollbackRecordPath))).digest("hex"))
        .toBe(locked.rollbackRecordSha256);
      expect(stableDigest(Object.fromEntries(config.fields.map((field: string) => [field, row[field] ?? null]))))
        .toBe(locked.baselineFieldsSha256);
      expect(stableDigest(locked.desiredFields)).toBe(locked.desiredFieldsSha256);
      const edgeTargets = MANAGED_TARGETS.filter((target) => target.id === locked.recordId
        && target.taskId === locked.taskId && target.scope === locked.scope);
      expect(edgeTargets).toHaveLength(1);
      expect(edgeTargets[0]).toMatchObject({ slug: locked.slug, contentType: locked.contentType,
        actionId: locked.actionId, candidateVersion: locked.candidateVersion,
        changedFields: locked.changedFields, baselineFieldsSha256: locked.baselineFieldsSha256,
        desiredFieldsSha256: locked.desiredFieldsSha256,
        ...(locked.rollbackAllowed === false ? { rollbackAllowed: false } : {}) });
      expect(() => assertLockedServiceCandidate(locked, row)).not.toThrow();
      expect(() => assertLockedServiceCandidate(locked, { ...row, updated_at: "2000-01-01T00:00:00Z" }))
        .toThrow(/updated_at drift/);
      expect(() => assertLockedServiceCandidate(locked, { ...row, title_en: "Changed without review" }))
        .toThrow(/field drift/);
      expect(() => assertLockedServiceCandidate({ ...locked, desiredFieldsSha256: "0".repeat(64) }, row))
        .toThrow(/payload mismatch/);
      expect(config.table).toBe("blog_posts");
      expect(locked.rollbackAllowed).toBe(false);
      expect(locked.changedFields).toEqual(["cover_image_url", "alt_en", "alt_zh"]);
      expect(locked.desiredFields.cover_image_url).not.toBe(row.cover_image_url);
      expect(existsSync(resolve(process.cwd(), `public${locked.desiredFields.cover_image_url}`))).toBe(true);
    }
  });

  it.each(names)("previews and writes only the exact fields of %s", async (name) => {
    const { locked, row } = fixture(name);
    const mock = mockClient(row);
    const dryRun = buildLockedDryRunRequest(locked, { ...row, ...locked.desiredFields }, "test-only");
    const preview = await publishContent(dryRun, mock.client, context);
    expect(preview.body.ok, String(preview.body.error)).toBe(true);
    expect(preview.body.payload_preview).toEqual(locked.desiredFields);
    expect(mock.writes).toHaveLength(0);
    const request = requestFor(name, row);
    const result = await publishContent(request, mock.client, context);
    expect(result.body.ok, String(result.body.error)).toBe(true);
    expect(mock.writes).toEqual([locked.desiredFields]);
    expect(mock.calls.map((call) => call.name)).toEqual([
      "claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write",
    ]);
    expect(mock.calls[0].args.p_payload_sha256).toBe(stableDigest(locked.desiredFields));
    expect(mock.calls[0].args.p_record_id).toBe(locked.recordId);
    Object.assign(mock.row, row);
    const replay = await publishContent(request, mock.client, context);
    expect(replay.body.ok).toBe(false);
    expect(mock.calls.at(-1)?.name).toBe("claim_managed_cms_release_permit");
    expect(mock.writes).toHaveLength(1);
  });

  it.each(names)("rejects wrong row, field, identity, version and image for %s before claiming", async (name) => {
    const { locked, row } = fixture(name);
    const original = requestFor(name, row);
    const first = locked.changedFields[0];
    const variants: ContentPublishRequest[] = [
      { ...original, record: { ...original.record, id: "22222222-2222-4222-8222-222222222222" } },
      { ...original, record: { ...original.record, title_en: "Unapproved edit" } },
      { ...original, expectedUpdatedAt: "2000-01-01T00:00:00Z" },
      { ...original, managedPermit: { ...original.managedPermit!, taskId: "wrong-task" } },
      { ...original, managedPermit: { ...original.managedPermit!, actionId: "wrong-action" } },
      { ...original, managedPermit: { ...original.managedPermit!, scope: "other.example:wrong-project" } },
      { ...original, managedPermit: { ...original.managedPermit!, candidateVersion: "stale-candidate-v1" } },
      { ...original, record: { ...original.record, [first]: row[first] } },
    ];
    variants.push(
      { ...original, record: { ...original.record, cover_image_url: "/images/blog/unpublished.webp" } },
      { ...original, record: { ...original.record, unapproved_field: "no" } },
      { ...original, record: { ...original.record, published_at: "2000-01-01T00:00:00Z" } },
      { ...original, expectedUpdatedAt: "2026-09-25T20:44:41.209653+00:00" },
    );
    for (const variant of variants) {
      const mock = mockClient(row);
      const result = await publishContent(variant, mock.client, context);
      expect(result.body.ok, JSON.stringify(variant.managedPermit)).toBe(false);
      expect(mock.writes).toHaveLength(0);
      expect(mock.calls).toHaveLength(0);
    }
    const wrongProject = mockClient(row);
    const wrongIdentity = await publishContent(original, wrongProject.client, { ...context,
      managedIdentity: { ...identity, repositoryId: 999 } });
    expect(wrongIdentity.body.ok).toBe(false);
    expect(wrongProject.writes).toHaveLength(0);
    expect(wrongProject.calls.map((call) => call.name)).toEqual(["claim_managed_cms_release_permit"]);
    if (locked.contentType === "blog") {
      const ambiguousPreview = await publishContent({ ...original, mode: "dry-run", managedPermit: undefined },
        mockClient(row).client, context);
      expect(ambiguousPreview.body.ok).toBe(false);
    }
    if (locked.rollbackAllowed === false) {
      const rollback = await publishContent({ ...original, managedPermit: { ...original.managedPermit!,
        operation: "rollback", actionId: `rollback-${locked.candidateVersion}`,
        candidateVersion: `${locked.candidateVersion}-rollback-v1` } }, mockClient(row).client, context);
      expect(rollback.body.ok).toBe(false);
      expect(String(rollback.body.error)).toMatch(/unverified prior image/);
    }
  });
});


describe("two Blog media target collision and atomic safety", () => {
  it.each(names)("rejects a baseline change, preview tuple substitution and a concurrent CAS for %s", async (name) => {
    const { locked, row } = fixture(name);
    const request = requestFor(name, row);
    const modified = mockClient({ ...row, content_en: String(row.content_en) + "unapproved" });
    const badBaseline = await publishContent({ ...request, record: { ...modified.row, ...locked.desiredFields } }, modified.client, context);
    expect(badBaseline.body.ok).toBe(false);
    expect(modified.writes).toHaveLength(0);
    expect(modified.calls).toHaveLength(0);
    const dryRun = buildLockedDryRunRequest(locked, { ...row, ...locked.desiredFields }, "fixture-only");
    const wrongTuple = { ...dryRun, managedCandidate: { ...dryRun.managedCandidate, actionId: "wrong-preview" } };
    const previewMock = mockClient(row);
    expect((await publishContent(wrongTuple, previewMock.client, context)).body.ok).toBe(false);
    expect(previewMock.calls).toHaveLength(0);
    expect(previewMock.writes).toHaveLength(0);
    const collision = mockClient(row, true);
    const casResult = await publishContent(request, collision.client, context);
    expect(casResult.body.ok).toBe(false);
    expect(casResult.status).toBe(409);
    expect(collision.writes).toHaveLength(0);
    expect(collision.calls.at(-1)?.args.p_success).toBe(false);
  });
});

describe("two exact Blog media permit identities", () => {
  it.each(names)("issues only the exact tuple and refuses old-cover rollback for %s", async (name) => {
    const { locked } = fixture(name);
    const inserted: Row[] = [];
    const client = { from: () => {
      const builder = {
        insert: (row: Row) => { inserted.push(row); return builder; },
        select: () => builder,
        single: async () => ({ data: inserted.at(-1), error: null }),
      };
      return builder;
    } } as unknown as ContentPublishClient;
    const issue = {
      permitId, taskId: locked.taskId, actionId: locked.actionId, actionClass: "cms_write" as const,
      operation: "publish" as const, scope: locked.scope, candidateVersion: locked.candidateVersion,
      recordId: locked.recordId, slug: locked.slug, expectedUpdatedAt: locked.expectedUpdatedAt,
      payloadSha256: locked.desiredFieldsSha256, rollbackPayloadSha256: locked.baselineMediaFieldsSha256,
      githubActorId: identity.actorId, githubWorkflowSha: identity.workflowSha,
      qaReceiptId: "fixture-qa-receipt", operationsDecisionId: "fixture-ops-receipt",
      policyDecisionId: "fixture-policy-receipt", issuerEvidenceSha256: "d".repeat(64),
      expiresAt: "2026-09-26T12:10:00Z",
    };
    const now = Date.parse("2026-09-26T12:00:00Z");
    await expect(issueManagedPermit(client, issue, now)).resolves.toMatchObject({ operation: "publish" });
    expect(inserted).toHaveLength(1);
    for (const changes of [
      { taskId: "wrong-task" }, { actionId: "wrong-action" }, { scope: "flashcast.com.my:wrong" },
      { candidateVersion: "wrong-version" }, { recordId: "22222222-2222-4222-8222-222222222222" },
    ]) await expect(issueManagedPermit(client, { ...issue, ...changes }, now)).rejects.toThrow(/identity/);
    await expect(issueManagedPermit(client, { ...issue, operation: "rollback", parentPermitId: permitId,
      parentRunId: 12345, rollbackPayloadSha256: undefined, actionId: `rollback-${locked.candidateVersion}`,
      candidateVersion: `${locked.candidateVersion}-rollback-v1` }, now)).rejects.toThrow(/identity/);
    expect(inserted).toHaveLength(1);
  });
});
