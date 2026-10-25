import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const fixtures = JSON.parse(readFileSync("drafts/publishing/fc-20261025-shop-office-existing-six-and-five-implementation-release-v1/frozen-two-row-candidates.json", "utf8")).entries as Array<{ target: string; before: Row; desired: Row }>;
import { withPublishedLinkTargets } from "@/test/helpers/publishedLinkTargets";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { SHOP_OFFICE_SIX_FIELD_FORWARD_INPUTS, SHOP_OFFICE_SIX_FIELD_TARGETS } from "../../supabase/functions/_shared/shop-office-six-field-targets.ts";
import { managedAction } from "../../supabase/functions/content-publish/managed-targets.ts";
import { issueManagedPermit, type ManagedPermitIssue } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { targetConfigs, buildLockedDryRunRequest } from "../../scripts/publish-content-trust-fixes.mjs";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown>;
const savedTime = "2026-10-25T06:00:00.123456+00:00";
const context = { role: "content_editor", authMode: "cron", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1,
} };

function clientFor(initial: Row, options: { race?: boolean; uncertain?: boolean } = {}) {
  let row = { ...initial }; let claimed = false;
  const writes: Row[] = []; const predicates: Array<[string, unknown]> = []; const rpcs: string[] = [];
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
    async rpc(name: string) {
      rpcs.push(name);
      if (name === "claim_managed_cms_release_permit") { if (claimed) return { data: [], error: null }; claimed = true; }
      if (name === "finish_managed_cms_release_write" && options.uncertain) return { data: [], error: null };
      return { data: [{}], error: null };
    },
  };
  return { client: withPublishedLinkTargets(client as unknown as ContentPublishClient), writes, predicates, rpcs, row: () => row };
}

function request(index: number, mode: "dry-run" | "publish" = "dry-run"): ContentPublishRequest {
  const target = SHOP_OFFICE_SIX_FIELD_TARGETS[index];
  const action = { ...managedAction(target, "publish"), operation: "publish" as const };
  return { contentType: "service", mode, nextStatus: "published", expectedUpdatedAt: target.expectedUpdatedAt,
    record: { id: target.id, slug: target.slug, ...fixtures[index].desired },
    ownerApproved: true, explicitExecution: true, approvalId: "synthetic-local-contract-test",
    ...(mode === "dry-run" ? { managedCandidate: action }
      : { managedPermit: { ...action, permitId: "11111111-1111-4111-8111-111111111111" } }) };
}

describe("two exact shop/office three-field targets", () => {
  it.each([0, 1])("%s admits forward issuance through the unchanged database scope constraint", async (index) => {
    const migration = readFileSync("supabase/migrations/20260921194000_managed_cms_release_permits.sql", "utf8");
    const prefix = migration.match(/scope\s+text\s+not\s+null\s+check\s*\(scope\s+like\s+'([^']+)%'\)/i)?.[1];
    expect(prefix).toBe("flashcast.com.my:");
    const target = SHOP_OFFICE_SIX_FIELD_TARGETS[index]; const now = Date.now();
    const inserted: Row[] = [];
    const database = { from(table: string) {
      expect(table).toBe("managed_cms_release_permits");
      return { insert(row: Row) {
        inserted.push(row);
        const accepted = typeof row.scope === "string" && row.scope.startsWith(prefix!);
        return { select() { return { single: async () => ({ data: accepted ? row : null,
          error: accepted ? null : { message: "violates managed_cms_release_permits_scope_check" } }) }; } };
      } };
    } } as unknown as ContentPublishClient;
    const input: ManagedPermitIssue = { ...managedAction(target, "publish"), operation: "publish", actionClass: "cms_write",
      permitId: "11111111-1111-4111-8111-111111111111", recordId: target.id, slug: target.slug,
      expectedUpdatedAt: target.expectedUpdatedAt!, payloadSha256: target.desiredFieldsSha256!,
      rollbackPayloadSha256: target.rollbackFieldsSha256, githubActorId: 98765, githubWorkflowSha: "a".repeat(40),
      qaReceiptId: "synthetic-local-contract-qa", operationsDecisionId: "synthetic-local-contract-owner",
      policyDecisionId: "synthetic-local-contract-policy", issuerEvidenceSha256: "b".repeat(64),
      expiresAt: new Date(now + 60_000).toISOString() };
    await expect(issueManagedPermit(database, input, now)).resolves.toMatchObject({ operation: "publish", status: "issued" });
    expect(inserted).toHaveLength(1);
    expect(targetConfigs[target.candidateVersion].lockedCandidate.scope).toBe(target.scope);
    expect(managedAction(target, "rollback").scope).toBe(target.scope);
    expect(SHOP_OFFICE_SIX_FIELD_FORWARD_INPUTS[index].scope).toBe("project:flashcast:shop-office:existing-six-fields-and-five-blocks:20261025:v1");
    inserted.length = 0;
    await expect(issueManagedPermit(database, { ...input, scope: SHOP_OFFICE_SIX_FIELD_FORWARD_INPUTS[index].scope }, now)).rejects.toThrow();
    expect(inserted).toEqual([]);
  });

  it.each([0, 1])("%s previews the actual sparse request without claiming a permit or writing", async (index) => {
    const fake = clientFor(fixtures[index].before);
    const result = await publishContent(request(index), fake.client, context);
    expect(result.status || 200).toBe(200);
    expect(result.body.payload_preview).toEqual(fixtures[index].desired);
    expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
  });

  it.each([0, 1])("%s writes only three columns with raw CAS and preserves MS and other fields", async (index) => {
    const before = fixtures[index].before; const fake = clientFor(before);
    const result = await publishContent(request(index, "publish"), fake.client, context);
    expect(result.status || 200).toBe(200); expect(result.body.performed_write).toBe(true);
    expect(fake.writes).toEqual([fixtures[index].desired]);
    expect(fake.predicates).toContainEqual(["id", before.id]);
    expect(fake.predicates).toContainEqual(["updated_at", before.updated_at]);
    for (const field of SHOP_OFFICE_SIX_FIELD_TARGETS[index].retainedProjectionFields!) expect(fake.row()[field]).toEqual((before as Row)[field]);
    expect(fake.rpcs).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]);
    expect((await publishContent(request(index, "publish"), fake.client, context)).status).toBe(409);
    expect(fake.writes).toHaveLength(1);
  });

  it.each([0, 1])("%s rejects payload, field, identity and complete-row drift before permit claim", async (index) => {
    const input = request(index); const before: Row = fixtures[index].before;
    const field = SHOP_OFFICE_SIX_FIELD_TARGETS[index].changedFields![0];
    const variations: Array<{ input: ContentPublishRequest; row?: Row }> = [
      { input: { ...input, record: { ...input.record, [field]: "Unapproved body" } } },
      { input: { ...input, record: { ...input.record, content_ms: "Unapproved MS" } } },
      { input: { ...input, record: { ...input.record, status: "draft" } } },
      { input: { ...input, record: { ...input.record, unexpected: "Reject this" } } },
      { input: { ...input, managedCandidate: { ...input.managedCandidate!, taskId: "another-task" } } },
      { input: { ...input, expectedUpdatedAt: savedTime } },
      { input, row: { ...before, version: Number(before.version) + 1 } },
      { input, row: { ...before, content_ms: "Later MS content" } },
    ];
    for (const variation of variations) {
      const fake = clientFor(variation.row || before);
      expect([400, 403, 409]).toContain((await publishContent(variation.input, fake.client, context)).status);
      expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
    }
  });

  it.each([0, 1])("%s preserves trusted identity, explicit approval, write-race and uncertain-result guards", async (index) => {
    const input = request(index, "publish");
    for (const [candidate, actor] of [[input, { ...context, managedIdentity: undefined }], [{ ...input, explicitExecution: false }, context]] as const) {
      const fake = clientFor(fixtures[index].before);
      expect((await publishContent(candidate, fake.client, actor)).status).toBe(403); expect(fake.writes).toEqual([]);
    }
    const race = clientFor(fixtures[index].before, { race: true });
    expect((await publishContent(input, race.client, context)).status).toBe(409); expect(race.writes).toEqual([]);
    const uncertain = clientFor(fixtures[index].before, { uncertain: true });
    const result = await publishContent(input, uncertain.client, context);
    expect(result.status).toBe(409); expect(result.body.error).toContain("uncertain"); expect(uncertain.writes).toHaveLength(1);
  });

  it.each([0, 1])("%s accepts the ordinary CLI full-row preview while writing only the three frozen fields", async (index) => {
    const target = SHOP_OFFICE_SIX_FIELD_TARGETS[index];
    const config = targetConfigs[target.candidateVersion];
    expect(config.fields).toEqual(target.baselineProjectionFields);
    expect(config.lockedCandidate).toMatchObject({ ...target, recordId: target.id, exactPatchOnly: true });
    const fake = clientFor(fixtures[index].before);
    const input = buildLockedDryRunRequest(config.lockedCandidate, config.buildRecord(fixtures[index].before), "synthetic-local-contract-test");
    expect((await publishContent(input, fake.client, context)).body.payload_preview).toEqual(fixtures[index].desired);
    expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
  });

  it.each([0, 1])("%s restores only original fields at the saved CAS and denies later MS or business edits", async (index) => {
    const target = SHOP_OFFICE_SIX_FIELD_TARGETS[index]; const before = fixtures[index].before;
    const current = { ...before, ...fixtures[index].desired, updated_at: savedTime, version: Number(before.version) + 1 };
    const prior = Object.fromEntries(target.changedFields!.map(field => [field, before[field]]));
    const input: ContentPublishRequest = { ...request(index, "publish"), expectedUpdatedAt: savedTime,
      record: { id: target.id, slug: target.slug, ...prior },
      managedPermit: { ...managedAction(target, "rollback"), operation: "rollback", permitId: "22222222-2222-4222-8222-222222222222" } };
    const fake = clientFor(current);
    expect((await publishContent(input, fake.client, context)).status || 200).toBe(200);
    expect(fake.writes).toEqual([prior]);
    for (const field of target.retainedProjectionFields!) expect(fake.row()[field]).toEqual(current[field]);
    for (const drift of [{ ...current, content_ms: "Later MS content" }, { ...current, title_en: "Later title" }, before]) {
      const changed = clientFor(drift);
      expect((await publishContent(input, changed.client, context)).status).toBe(409);
      expect(changed.writes).toEqual([]); expect(changed.rpcs).toEqual([]);
    }
    const forged = clientFor(current);
    expect((await publishContent({ ...input, record: { ...input.record, ...fixtures[index].desired } }, forged.client, context)).status).toBe(403);
    expect(forged.writes).toEqual([]); expect(forged.rpcs).toEqual([]);
  });

  it.each([0, 1])("%s issues a restore permit only for its completed original publish run and exact saved CAS", async (index) => {
    const target = SHOP_OFFICE_SIX_FIELD_TARGETS[index]; const now = Date.now();
    const input: ManagedPermitIssue = { ...managedAction(target, "rollback"), operation: "rollback", actionClass: "cms_write",
      permitId: "22222222-2222-4222-8222-222222222222", parentPermitId: "11111111-1111-4111-8111-111111111111", parentRunId: 12345,
      recordId: target.id, slug: target.slug, expectedUpdatedAt: savedTime, payloadSha256: target.rollbackFieldsSha256!,
      githubActorId: 98765, githubWorkflowSha: "a".repeat(40), qaReceiptId: "synthetic-local-contract-qa",
      operationsDecisionId: "synthetic-local-contract-owner", policyDecisionId: "synthetic-local-contract-policy",
      issuerEvidenceSha256: "b".repeat(64), expiresAt: new Date(now + 60_000).toISOString() };
    const parent = { status: "completed", operation: "publish", task_id: target.taskId, record_id: target.id,
      slug: target.slug, scope: target.scope, candidate_version: target.candidateVersion, github_run_id: 12345,
      rollback_payload_sha256: target.rollbackFieldsSha256, saved_updated_at: savedTime };
    const make = (row: Row) => ({ from: () => ({ select() { return this; }, eq() { return this; },
      maybeSingle: async () => ({ data: row, error: null }),
      insert() { return { select() { return this; }, single: async () => ({ data: {}, error: null }) }; },
    }) }) as unknown as ContentPublishClient;
    await expect(issueManagedPermit(make(parent), input, now)).resolves.toMatchObject({ operation: "rollback" });
    for (const altered of [{ ...input, parentRunId: undefined }, { ...input, parentRunId: 99 }, { ...input, expectedUpdatedAt: target.expectedUpdatedAt! }]) {
      await expect(issueManagedPermit(make(parent), altered, now)).rejects.toThrow();
    }
    await expect(issueManagedPermit(make({ ...parent, status: "uncertain" }), input, now)).rejects.toThrow();
    await expect(issueManagedPermit(make({ ...parent, record_id: "another-row" }), input, now)).rejects.toThrow();
  });
});
