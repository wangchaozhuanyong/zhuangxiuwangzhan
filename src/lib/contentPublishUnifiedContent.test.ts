import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { issueManagedPermit } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { UNIFIED_CONTENT_TARGETS } from "../../supabase/functions/content-publish/unified-content-targets.ts";
import { MANAGED_TARGETS, findManagedTarget, managedAction } from "../../supabase/functions/content-publish/managed-targets.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";
import { lockedUnifiedContentCandidates, readUnifiedContentCandidate } from "../../scripts/managed-cms-targets-unified-content-v1.mjs";
import { stableDigest, targetConfigs, assertLockedServiceCandidate, buildLockedDryRunRequest } from "../../scripts/publish-content-trust-fixes.mjs";

type Row = Record<string, unknown>;
const names = ["design-body-faq-unified-20261009-v1", "bathroom-body-step-unified-20261009-v1"];
const beforeRow = (name: string): Row => JSON.parse(readFileSync(lockedUnifiedContentCandidates[name].rollbackRecordPath, "utf8"));
const context = { role: "content_editor", authMode: "cron", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1,
} };
const savedTime = "2026-10-09T08:45:00.123456+00:00";
const request = (name: string, mode: "dry-run" | "publish" = "dry-run"): ContentPublishRequest => {
  const locked = lockedUnifiedContentCandidates[name]; const record = targetConfigs[name].buildRecord(beforeRow(name));
  const selector = { ...managedAction(UNIFIED_CONTENT_TARGETS.find((target) => target.candidateVersion === name)!, "publish"), operation: "publish" as const };
  return mode === "dry-run" ? buildLockedDryRunRequest(locked, record, "local-contract-test") : {
    contentType: "service", mode, nextStatus: "published", expectedUpdatedAt: locked.expectedUpdatedAt, record,
    ownerApproved: true, explicitExecution: true, approvalId: "local-contract-test",
    managedPermit: { ...selector, permitId: "11111111-1111-4111-8111-111111111111" },
  };
};
function clientFor(initial: Row, race = false) {
  let row = { ...initial }; let claimed = false;
  const writes: Row[] = []; const predicates: Array<[string, unknown]> = []; const rpcs: string[] = [];
  const client = {
    from(table: string) {
      if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
      let patch: Row | null = null; const filters: Array<[string, unknown]> = [];
      const result = async () => {
        if (filters.some(([field, value]) => row[field] !== value) || (patch && race)) return { data: null, error: null };
        if (patch) { writes.push(patch); row = { ...row, ...patch, updated_at: savedTime, version: Number(row.version) + 1 }; }
        return { data: { ...row }, error: null };
      };
      const builder = { select() { return builder; }, eq(field: string, value: unknown) { filters.push([field, value]); if (patch) predicates.push([field, value]); return builder; },
        maybeSingle: result, single: result, update(value: Row) { patch = value; return builder; } };
      return builder;
    },
    async rpc(name: string) { rpcs.push(name); if (name === "claim_managed_cms_release_permit") {
      if (claimed) return { data: [], error: null }; claimed = true;
    } return { data: [{}], error: null }; },
  };
  return { client: client as unknown as ContentPublishClient, writes, predicates, rpcs, row: () => row };
}

describe("two exact combined native CMS targets", () => {
  it("registers two additional selectors while preserving historical bindings", () => {
    expect(Object.keys(lockedUnifiedContentCandidates)).toEqual(names);
    expect(UNIFIED_CONTENT_TARGETS).toHaveLength(2); expect(MANAGED_TARGETS).toHaveLength(71);
    expect(MANAGED_TARGETS.filter((target) => !target.rollbackFieldsSha256)).toHaveLength(45);
  });

  it.each(names)("%s binds the exact current projection, source and four fields", (name) => {
    const locked = lockedUnifiedContentCandidates[name]; const before = beforeRow(name);
    expect(() => assertLockedServiceCandidate(locked, before)).not.toThrow();
    expect(locked.changedFields).toHaveLength(4);
    expect(Object.keys(locked.desiredFields).sort()).toEqual([...locked.changedFields].sort());
    expect(stableDigest(locked.desiredFields)).toBe(locked.desiredFieldsSha256);
    expect(stableDigest(Object.fromEntries(locked.changedFields.map((field: string) => [field, before[field]])))).toBe(locked.rollbackFieldsSha256);
    expect(locked.retainedProjectionFields).toEqual(locked.baselineProjectionFields.filter((field: string) => ![...locked.changedFields, "version", "updated_at"].includes(field)));
    expect(findManagedTarget(MANAGED_TARGETS, locked.recordId, locked.slug, { ...locked, operation: "publish" })).toMatchObject({
      id: locked.recordId, changedFields: locked.changedFields, baselineProjectionFields: locked.baselineProjectionFields,
      baselineFieldsSha256: locked.baselineFieldsSha256, expectedUpdatedAt: locked.expectedUpdatedAt,
      desiredFieldsSha256: locked.desiredFieldsSha256, rollbackFieldsSha256: locked.rollbackFieldsSha256,
      retainedFieldsSha256: locked.retainedFieldsSha256, rollbackAllowed: false, requiresParentRun: true,
    });
    expect(targetConfigs[name].keyField).toBe("id");
    const bytes = readFileSync(locked.sourceCandidatePath); const source = JSON.parse(bytes.toString("utf8"));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(locked.sourceCandidateSha256);
    expect(source.source_provenance.sources).toHaveLength(2);
    expect(source.source_provenance.accuracy_qa_proofs).toHaveLength(2);
    expect(source).not.toHaveProperty("before_fields"); expect(source).not.toHaveProperty("record");
    expect(Object.isFrozen(locked.desiredFields)).toBe(true);
    for (const forged of [{ ...source, task_id: "wrong-task" }, { ...source, desired_fields: { ...source.desired_fields, title_en: "unreviewed" } },
      { ...source, source_provenance: {} }]) expect(() => readUnifiedContentCandidate(name, Buffer.from(JSON.stringify(forged)))).toThrow(/package hash differs/);
  });

  it("keeps the Bathroom step edit confined to the first description in each language", () => {
    const name = names[1]; const before = beforeRow(name); const locked = lockedUnifiedContentCandidates[name];
    for (const field of ["process_steps_en", "process_steps_zh"]) {
      const original = before[field] as Array<Row>; const desired = locked.desiredFields[field];
      expect(desired[0].desc.startsWith(original[0].desc)).toBe(true);
      expect(desired.map((step: Row, index: number) => index === 0 ? { ...step, desc: original[0].desc } : step)).toEqual(original);
    }
    expect(targetConfigs[name].buildRecord(before).faqs_en).toEqual(before.faqs_en);
  });

  it.each(names)("%s previews without writes and saves one exact four-column CAS patch", async (name) => {
    const before = beforeRow(name); const locked = lockedUnifiedContentCandidates[name]; const fake = clientFor(before);
    const preview = await publishContent(request(name), fake.client, context);
    expect(preview.status || 200).toBe(200); expect(preview.body.payload_preview).toEqual(locked.desiredFields);
    expect(fake.writes).toHaveLength(0); expect(fake.rpcs).toHaveLength(0); expect(fake.row()).toEqual(before);
    expect(request(name)).not.toHaveProperty("ownerApproved"); expect(request(name)).not.toHaveProperty("managedPermit");
    const published = await publishContent(request(name, "publish"), fake.client, context);
    expect(published.status || 200).toBe(200); expect(published.body.saved_id).toBe(before.id);
    expect(fake.writes).toEqual([locked.desiredFields]); expect(fake.predicates).toContainEqual(["id", before.id]);
    expect(fake.predicates).toContainEqual(["updated_at", before.updated_at]);
    expect(fake.rpcs).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]);
    for (const field of locked.retainedProjectionFields) expect(fake.row()[field]).toEqual(before[field]);
    expect((await publishContent(request(name, "publish"), fake.client, context)).status).toBe(409); expect(fake.writes).toHaveLength(1);
  });

  it.each(names)("%s rejects payload, current row, selector and identity drift before a write", async (name) => {
    const before = beforeRow(name); const input = request(name);
    const variations: Array<{ input?: ContentPublishRequest; row?: Row }> = [
      { input: { ...input, record: { ...input.record, title_en: "Unreviewed title" } } },
      { input: { ...input, record: { ...input.record, content_en: `${input.record!.content_en} altered` } } },
      { input: { ...input, record: { ...input.record, unknown_field: "unreviewed" } } },
      { input: { ...input, managedCandidate: { ...input.managedCandidate!, candidateVersion: "unregistered-version" } } },
      { input: { ...input, expectedUpdatedAt: savedTime } }, { row: { ...before, version: Number(before.version) + 1 } },
      { row: { ...before, image_url: "/images/newer-image.webp" } },
    ];
    for (const variation of variations) { const fake = clientFor(variation.row || before);
      expect([400, 403, 409]).toContain((await publishContent(variation.input || input, fake.client, context)).status);
      expect(fake.writes).toHaveLength(0); expect(fake.rpcs).toHaveLength(0);
    }
    const noIdentity = clientFor(before); expect((await publishContent(request(name, "publish"), noIdentity.client, { ...context, managedIdentity: undefined })).status).toBe(403);
    expect(noIdentity.writes).toHaveLength(0);
    const race = clientFor(before, true); expect((await publishContent(request(name, "publish"), race.client, context)).status).toBe(409); expect(race.writes).toHaveLength(0);
  });

  it.each(names)("%s requires the original issuer contract and denies old restore before credentials", async (name) => {
    const target = UNIFIED_CONTENT_TARGETS.find((item) => item.candidateVersion === name)!;
    const inserted: Row[] = []; const builder = { select() { return builder; }, insert(row: Row) { inserted.push(row); return builder; }, single: async () => ({ data: inserted.at(-1), error: null }) };
    const client = { from: () => builder } as unknown as ContentPublishClient;
    const now = Date.parse("2026-10-09T08:00:00Z");
    const input = { ...managedAction(target, "publish"), permitId: "11111111-1111-4111-8111-111111111111", operation: "publish" as const,
      actionClass: "cms_write" as const, recordId: target.id, slug: target.slug, expectedUpdatedAt: target.expectedUpdatedAt!,
      payloadSha256: target.desiredFieldsSha256!, rollbackPayloadSha256: target.rollbackFieldsSha256!, githubActorId: 98765,
      githubWorkflowSha: "a".repeat(40), qaReceiptId: "qa-local-contract-test", operationsDecisionId: "ops-local-contract-test",
      policyDecisionId: "policy-local-contract-test", issuerEvidenceSha256: "b".repeat(64), expiresAt: "2026-10-09T08:10:00Z" };
    await expect(issueManagedPermit(client, input, now)).resolves.toMatchObject({ status: "issued" }); expect(inserted).toHaveLength(1);
    for (const forged of [{ ...input, payloadSha256: "c".repeat(64) }, { ...input, rollbackPayloadSha256: "c".repeat(64) },
      { ...input, expectedUpdatedAt: savedTime }, { ...input, expiresAt: "2026-10-09T08:16:00Z" },
      { ...input, ...managedAction(target, "rollback"), operation: "rollback" as const }]) await expect(issueManagedPermit(client, forged, now)).rejects.toThrow();
    expect(inserted).toHaveLength(1);
    const workflow = readFileSync(".github/workflows/content-publish-approved.yml", "utf8");
    expect(workflow.split(name)).toHaveLength(3);
    const denied = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${name}`, "--rollback-from=unused.json"], { encoding: "utf8", env: { PATH: process.env.PATH } });
    expect(denied.status).not.toBe(0); expect(denied.stderr).toMatch(/blocked; prepare a separately reviewed forward correction/);
  });
});
