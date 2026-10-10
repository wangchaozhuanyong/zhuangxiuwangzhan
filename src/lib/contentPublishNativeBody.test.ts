import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { issueManagedPermit } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { NATIVE_BODY_TARGETS } from "../../supabase/functions/content-publish/native-body-targets.ts";
import { MANAGED_TARGETS, findManagedTarget, managedAction } from "../../supabase/functions/content-publish/managed-targets.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";
import { lockedNativeBodyCandidates } from "../../scripts/managed-cms-targets-native-body-v1.mjs";
import { stableDigest, targetConfigs, assertLockedServiceCandidate, assertLockedRollbackCurrent, assertLockedPublishGate } from "../../scripts/publish-content-trust-fixes.mjs";

type Row = Record<string, unknown>;
const names = Object.keys(lockedNativeBodyCandidates);
const frozenRow = (name: string): Row => JSON.parse(readFileSync(lockedNativeBodyCandidates[name].rollbackRecordPath, "utf8"));
const context = { role: "content_editor", authMode: "cron", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1,
} };
const savedTime = "2026-09-27T08:45:00.123456+00:00";
const request = (name: string, before: Row, mode: "publish" | "dry-run" = "dry-run", operation: "publish" | "rollback" = "publish"): ContentPublishRequest => {
  const locked = lockedNativeBodyCandidates[name];
  const source = operation === "publish" ? locked.desiredFields : Object.fromEntries(locked.changedFields.map((key: string) => [key, frozenRow(name)[key]]));
  const action = { ...managedAction(NATIVE_BODY_TARGETS.find((t) => t.candidateVersion === name)!, operation), operation };
  return { contentType: locked.contentType, nextStatus: "published", mode, expectedUpdatedAt: before.updated_at as string,
    record: { ...before, ...source }, ownerApproved: true, explicitExecution: true, approvalId: "local-contract-test",
    managedOperation: operation,
    ...(mode === "dry-run" ? { managedCandidate: action } : { managedPermit: { ...action, permitId: "11111111-1111-4111-8111-111111111111" } }),
  };
};
function clientFor(initial: Row, options: { race?: boolean; uncertain?: boolean } = {}) {
  let row = { ...initial }; let claimed = false;
  const writes: Row[] = []; const predicates: Array<[string, unknown]> = []; const rpcs: Array<{ name: string; args: Row }> = [];
  const client = {
    from(table: string) {
      if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
      let patch: Row | null = null; const filters: Array<[string, unknown]> = [];
      const result = async () => {
        if (filters.some(([key, value]) => row[key] !== value) || (patch && options.race)) return { data: null, error: null };
        if (patch) { row = { ...row, ...patch, updated_at: savedTime, version: Number(row.version) + 1 }; writes.push(patch); }
        return { data: { ...row }, error: null };
      };
      const builder = { select() { return builder; }, eq(key: string, value: unknown) { filters.push([key, value]); if (patch) predicates.push([key, value]); return builder; },
        maybeSingle: result, single: result, update(payload: Row) { patch = payload; return builder; } };
      return builder;
    },
    async rpc(name: string, args: Row) {
      rpcs.push({ name, args });
      if (name === "claim_managed_cms_release_permit") { if (claimed) return { data: [], error: null }; claimed = true; }
      if (name === "finish_managed_cms_release_write" && options.uncertain) return { data: [], error: null };
      return { data: [{}], error: null };
    },
  };
  return { client: client as unknown as ContentPublishClient, writes, predicates, rpcs, row: () => row };
}

describe("18 exact original-identity bilingual body targets", () => {
  it("locks 8 services and 10 blogs without changing old identities", () => {
    expect(names).toHaveLength(18); expect(NATIVE_BODY_TARGETS).toHaveLength(18);
    expect(NATIVE_BODY_TARGETS.filter((t) => t.contentType === "service")).toHaveLength(8);
    expect(MANAGED_TARGETS.filter((target) => !target.rollbackFieldsSha256)).toHaveLength(45);
    expect(MANAGED_TARGETS).toHaveLength(71);
    const workflow = readFileSync(".github/workflows/content-publish-approved.yml", "utf8");
    for (const name of names) {
      const locked = lockedNativeBodyCandidates[name]; const row = frozenRow(name);
      const target = findManagedTarget(MANAGED_TARGETS, locked.recordId, locked.slug, { ...locked, operation: "publish" });
      expect(target).toMatchObject({ desiredFieldsSha256: stableDigest(locked.desiredFields), rollbackFieldsSha256: stableDigest(Object.fromEntries(locked.changedFields.map((key: string) => [key, row[key]]))) });
      expect(targetConfigs[name].lockedCandidate).toEqual(locked);
      for (const page of locked.publicPaths) {
        const lang = page.path.split("/")[1];
        expect(page.expected).toBe(String(row[`seo_title_${lang}`]).replaceAll("&", "&amp;"));
      }
      expect(workflow.split(name).length - 1).toBe(3);
      expect(createHash("sha256").update(readFileSync(locked.sourceCandidatePath)).digest("hex")).toBe(locked.originalFrozenSourceSha256);
      expect(() => assertLockedServiceCandidate(locked, row)).not.toThrow();
      expect(() => assertLockedPublishGate(locked, {}, "invalid")).toThrow();
    }
  });

  it.each(names)("%s: preview is zero-write; publish sends exactly two columns with CAS and prevents replay", async (name) => {
    const before = frozenRow(name); const fake = clientFor(before); const preview = await publishContent(request(name, before), fake.client, context);
    expect(preview.status || 200).toBe(200); expect(preview.body.dry_run).toBe(true);
    expect(preview.body.payload_preview).toEqual(lockedNativeBodyCandidates[name].desiredFields);
    expect(fake.writes).toHaveLength(0); expect(fake.rpcs).toHaveLength(0); expect(fake.row()).toEqual(before);
    const publish = await publishContent(request(name, before, "publish"), fake.client, context);
    expect(publish.status || 200).toBe(200); expect(publish.body.saved_id).toBe(before.id);
    expect(fake.writes).toEqual([lockedNativeBodyCandidates[name].desiredFields]);
    expect(fake.predicates).toContainEqual(["id", before.id]); expect(fake.predicates).toContainEqual(["updated_at", before.updated_at]);
    expect(fake.rpcs.map((r) => r.name)).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]);
    const replay = await publishContent(request(name, before, "publish"), fake.client, context);
    expect(replay.status).toBe(409); expect(fake.writes).toHaveLength(1);
    for (const field of lockedNativeBodyCandidates[name].retainedProjectionFields) expect(fake.row()[field]).toEqual(before[field]);
  });

  it.each(names)("%s: rejects frozen text, retained field, selector, timestamp and version drift in preview", async (name) => {
    const before = frozenRow(name); const normal = request(name, before);
    const variations: Array<{ input: ContentPublishRequest; row?: Row }> = [
      { input: { ...normal, record: { ...normal.record, content_en: String(normal.record!.content_en) + " forged" } } },
      { input: { ...normal, record: { ...normal.record, title_en: "Unapproved title" } } },
      { input: { ...normal, record: { ...normal.record, unknown_field: "ignored must still deny" } } },
      { input: { ...normal, record: { ...normal.record, status: "draft" } } },
      { input: { ...normal, managedCandidate: { ...normal.managedCandidate!, taskId: "wrong-task-id" } } },
      { input: { ...normal, managedCandidate: { ...normal.managedCandidate!, scope: "flashcast.com.my:another-row" } } },
      { input: { ...normal, managedCandidate: { ...normal.managedCandidate!, candidateVersion: "wrong-version" } } },
      { input: { ...normal, expectedUpdatedAt: "2026-09-26T10:00:00Z" } },
      { input: normal, row: { ...before, version: Number(before.version) + 1 } },
      { input: normal, row: { ...before, title_en: "Changed retained title" } },
    ];
    for (const variation of variations) {
      const fake = clientFor(variation.row || before); const result = await publishContent(variation.input, fake.client, context);
      expect(variation.input.record?.unknown_field ? [400, 403] : [403, 409]).toContain(result.status);
      expect(fake.writes).toHaveLength(0); expect(fake.rpcs).toHaveLength(0);
    }
  });

  it.each(names)("%s: rollback restores only its frozen prior body and rejects intervening unrelated changes", async (name) => {
    const locked = lockedNativeBodyCandidates[name]; const before = frozenRow(name);
    const current = { ...before, ...locked.desiredFields, updated_at: savedTime, version: Number(before.version) + 1 };
    expect(() => assertLockedRollbackCurrent(locked, current)).not.toThrow();
    const fake = clientFor(current); const restore = await publishContent(request(name, current, "publish", "rollback"), fake.client, context);
    expect(restore.status || 200).toBe(200);
    expect(fake.writes).toEqual([Object.fromEntries(locked.changedFields.map((key: string) => [key, before[key]]))]);
    const drift = clientFor({ ...current, title_en: "Later unrelated change" });
    const denied = await publishContent(request(name, drift.row(), "dry-run", "rollback"), drift.client, context);
    expect(denied.status).toBe(409); expect(drift.writes).toHaveLength(0);
  });

  it.each(names)("%s: rejects missing trusted identity, explicit approval, and write race; reports uncertain Save", async (name) => {
    const before = frozenRow(name); const input = request(name, before, "publish");
    for (const [altered, actor] of [[input, { ...context, managedIdentity: undefined }], [{ ...input, explicitExecution: false }, context]] as const) {
      const fake = clientFor(before); const result = await publishContent(altered, fake.client, actor);
      expect(result.status).toBe(403); expect(fake.writes).toHaveLength(0);
    }
    const race = clientFor(before, { race: true }); expect((await publishContent(input, race.client, context)).status).toBe(409); expect(race.writes).toHaveLength(0);
    const uncertain = clientFor(before, { uncertain: true }); const result = await publishContent(input, uncertain.client, context);
    expect(result.status).toBe(409); expect(result.body.error).toContain("uncertain"); expect(uncertain.writes).toHaveLength(1);
  });
});

describe("exact native body permit issuer", () => {
  const now = Date.parse("2026-09-27T09:00:00Z");
  const permitClient = (parent?: Row) => {
    const inserted: Row[] = [];
    const client = { from() { const builder = { select() { return builder; }, eq() { return builder; },
      maybeSingle: async () => ({ data: parent || null, error: null }), insert(row: Row) { inserted.push(row); return builder; }, single: async () => ({ data: inserted.at(-1), error: null }) }; return builder; } };
    return { client: client as unknown as ContentPublishClient, inserted };
  };
  it.each(NATIVE_BODY_TARGETS)("$candidateVersion binds publish/rollback to frozen digests and actual parent run", async (target) => {
    const input = { permitId: "11111111-1111-4111-8111-111111111111", ...managedAction(target, "publish"),
      actionClass: "cms_write" as const, operation: "publish" as const, recordId: target.id, slug: target.slug,
      expectedUpdatedAt: target.expectedUpdatedAt!, payloadSha256: target.desiredFieldsSha256!, rollbackPayloadSha256: target.rollbackFieldsSha256!,
      githubActorId: 98765, githubWorkflowSha: "a".repeat(40), qaReceiptId: "qa-receipt-local-test", operationsDecisionId: "ops-local-test", policyDecisionId: "pol-local-test", issuerEvidenceSha256: "b".repeat(64), expiresAt: "2026-09-27T09:10:00Z" };
    const fake = permitClient(); await expect(issueManagedPermit(fake.client, input, now)).resolves.toMatchObject({ operation: "publish" });
    for (const altered of [{ ...input, payloadSha256: "c".repeat(64) }, { ...input, rollbackPayloadSha256: "c".repeat(64) }, { ...input, expectedUpdatedAt: savedTime }]) {
      const denied = permitClient(); await expect(issueManagedPermit(denied.client, altered, now)).rejects.toThrow(); expect(denied.inserted).toHaveLength(0);
    }
    const parent = { ...fake.inserted[0], status: "completed", github_run_id: 12345, saved_updated_at: savedTime };
    const rollback = { ...input, ...managedAction(target, "rollback"), operation: "rollback" as const,
      permitId: "22222222-2222-4222-8222-222222222222", expectedUpdatedAt: savedTime,
      payloadSha256: target.rollbackFieldsSha256!, rollbackPayloadSha256: undefined, parentPermitId: input.permitId, parentRunId: 12345 };
    await expect(issueManagedPermit(permitClient(parent).client, rollback, now)).resolves.toMatchObject({ operation: "rollback" });
    for (const altered of [{ ...rollback, parentRunId: 99999 }, { ...rollback, payloadSha256: "c".repeat(64) }, { ...rollback, expectedUpdatedAt: input.expectedUpdatedAt }]) {
      await expect(issueManagedPermit(permitClient(parent).client, altered, now)).rejects.toThrow();
    }
    await expect(issueManagedPermit(permitClient({ ...parent, status: "uncertain" }).client, rollback, now)).rejects.toThrow();
  });
});
