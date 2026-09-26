import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";
import { MANAGED_TARGETS } from "../../supabase/functions/content-publish/managed-targets.ts";
import { targetConfigs, assertLockedServiceCandidate, buildLockedDryRunRequest, stableDigest } from "../../scripts/publish-content-trust-fixes.mjs";

const names = ["kl-location-intent-r1-v2", "org026-builtin-media-r1-v5",
  "org026-warehouse-media-r1-v5", "org026-office-renovation-media-r1-v5"] as const;
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

function mockClient(initial: Row) {
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

describe("four exact KL and service-media CMS targets", () => {
  it("keeps all four source candidates, baselines and workflow choices pinned", () => {
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
      if (config.contentType === "service") {
        expect(locked.rollbackAllowed).toBe(false);
        expect(locked.changedFields).toEqual(["image_url", "alt_en", "alt_zh"]);
        expect(locked.desiredFields.image_url).not.toBe(row.image_url);
        expect(existsSync(resolve(process.cwd(), `public${locked.desiredFields.image_url}`))).toBe(true);
      } else {
        expect(locked.changedFields).toEqual(["content_en", "content_zh"]);
      }
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
    if (locked.contentType === "service") {
      variants.push({ ...original, record: { ...original.record, image_url: "/images/services/ai-concepts/unpublished.webp" } });
    }
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
    if (locked.contentType === "service" && ["builtin", "office-renovation"].includes(locked.slug)) {
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
