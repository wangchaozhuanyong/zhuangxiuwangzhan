import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { issueManagedPermit, readManagedPermit } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { ORG020_V7_TARGETS, MANAGED_TARGETS, findManagedTarget } from "../../supabase/functions/content-publish/managed-targets.ts";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";
import { lockedOrg020V7Candidates } from "../../scripts/managed-cms-targets-org020-v7.mjs";
import { targetConfigs, assertLockedServiceCandidate, buildLockedDryRunRequest, assertLockedDryRunResult, stableDigest } from "../../scripts/publish-content-trust-fixes.mjs";

type Row = Record<string, unknown>;
const names = Object.keys(lockedOrg020V7Candidates);
const permitId = "11111111-1111-4111-8111-111111111111";
const identity = { repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main", runId: 12345, runAttempt: 1 };
const context = { role: "content_editor" as const, authMode: "cron" as const, managedIdentity: identity };
const fixture = (name: string) => {
  const locked = lockedOrg020V7Candidates[name];
  const raw = JSON.parse(readFileSync(resolve(process.cwd(), locked.rollbackRecordPath), "utf8")) as Row;
  const target = ORG020_V7_TARGETS.find((t) => t.id === locked.recordId && t.actionId === locked.actionId)!;
  return { locked, raw, target };
};
const requestFor = (name: string, raw: Row): ContentPublishRequest => {
  const { locked } = fixture(name);
  return { ...buildLockedDryRunRequest(locked, { ...raw, ...locked.desiredFields }, "test-only"),
    mode: "publish", ownerApproved: true, explicitExecution: true, approvalId: "test-only",
    managedCandidate: undefined, managedPermit: { permitId, taskId: locked.taskId, actionId: locked.actionId,
      candidateVersion: locked.candidateVersion, scope: locked.scope, operation: "publish" } };
};
function mockClient(initial: Row, options: { replay?: boolean; race?: boolean; uncertain?: boolean } = {}) {
  const row: Row = { ...initial };
  const writes: Array<{ table: string; patch: Row; filters: Array<[string, unknown]> }> = [];
  const calls: Array<{ name: string; args: Row }> = [];
  const inserts: string[] = [];
  let used = Boolean(options.replay);
  const client = {
    from(table: string) {
      const filters: Array<[string, unknown]> = []; let patch: Row | undefined;
      const selected = () => filters.every(([key, value]) => row[key] === value);
      const builder = {
        select() { return builder; },
        eq(key: string, value: unknown) { filters.push([key, value]); return builder; },
        update(value: Row) { patch = value; return builder; },
        insert() { inserts.push(table); if (table !== "admin_audit_logs") throw new Error("Unexpected CMS insertion"); return builder; },
        async maybeSingle() {
          if (!selected()) return { data: null, error: null };
          if (patch) { writes.push({ table, patch, filters }); Object.assign(row, patch, { updated_at: "2026-09-26T23:00:00.000001+00:00" }); }
          return { data: { ...row }, error: null };
        },
        async single() { return { data: {}, error: null }; },
        then(done: (v: unknown) => unknown) { return Promise.resolve({ data: selected() ? [{ ...row }] : [], error: null }).then(done); },
      };
      return builder;
    },
    async rpc(name: string, args: Row) {
      calls.push({ name, args });
      if (name === "claim_managed_cms_release_permit") { if (used) return { data: [], error: null }; used = true; }
      if (name === "begin_managed_cms_release_write" && options.race) row.updated_at = "2026-09-26T22:00:00.000001+00:00";
      if (name === "finish_managed_cms_release_write" && options.uncertain) return { data: [], error: null };
      return { data: [{}], error: null };
    },
  } as unknown as ContentPublishClient;
  return { client, row, writes, calls, inserts };
}

describe("ORG-020 exact existing-row publisher capability", () => {
  it("contains 28 distinct row/action/version identities and retains completed media identities", () => {
    expect(names).toHaveLength(28);
    expect(ORG020_V7_TARGETS).toHaveLength(28);
    expect(new Set(ORG020_V7_TARGETS.map((t) => `${t.taskId}/${t.actionId}/${t.candidateVersion}/${t.id}`)).size).toBe(28);
    const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/content-publish-approved.yml"), "utf8");
    for (const name of names) expect(workflow.split(name)).toHaveLength(3);
    for (const name of ["org026-builtin-media-r1-v5", "org026-warehouse-media-r1-v6", "org026-office-renovation-media-r1-v6"]) {
      const t = targetConfigs[name].lockedCandidate;
      expect(findManagedTarget(MANAGED_TARGETS, t.recordId, t.slug, { ...t, operation: "publish" })).toBeDefined();
      expect(workflow).toContain(`- ${name}`);
    }
    const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260921194000_managed_cms_release_permits.sql"), "utf8");
    expect(migration).toContain("(task_id, action_id, candidate_version)");
    expect(migration).toContain("where status <> 'revoked'");
  });

  it.each(names)("binds %s to the frozen source, current baseline and zero-write exact preview", async (name) => {
    const { locked, raw, target } = fixture(name);
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), locked.sourceCandidatePath))).digest("hex")).toBe(locked.sourceCandidateSha256);
    expect(stableDigest(locked.desiredFields)).toBe(target.desiredFieldsSha256);
    expect(() => assertLockedServiceCandidate(locked, raw)).not.toThrow();
    const mock = mockClient(raw);
    const previewRequest = buildLockedDryRunRequest(locked, { ...raw, ...locked.desiredFields }, "test-only");
    const result = await publishContent(previewRequest, mock.client, context);
    expect(result.body.ok, String(result.body.error)).toBe(true);
    expect(result.body.payload_preview).toEqual(locked.desiredFields);
    expect(result.body.performed_write).toBe(false);
    assertLockedDryRunResult(locked, result.body, 200, raw, mock.row, { ...raw, ...locked.desiredFields });
    expect(mock.writes).toHaveLength(0); expect(mock.calls).toHaveLength(0); expect(mock.inserts).toHaveLength(0);
  });

  it.each(names)("writes %s only once through an exact field patch with SQL CAS", async (name) => {
    const { locked, raw } = fixture(name); const mock = mockClient(raw);
    const request = requestFor(name, raw); const result = await publishContent(request, mock.client, context);
    expect(result.body.ok, String(result.body.error)).toBe(true);
    expect(result.body.saved_id).toBe(locked.recordId);
    expect(mock.writes).toEqual([{ table: locked.table, patch: locked.desiredFields,
      filters: [["id", locked.recordId], ["updated_at", locked.expectedUpdatedAt]] }]);
    for (const [key, value] of Object.entries(raw)) {
      if (![...locked.changedFields, "updated_at"].includes(key)) expect(mock.row[key]).toEqual(value);
    }
    expect(mock.inserts).toEqual(["admin_audit_logs"]);
    expect(mock.calls.map((c) => c.name)).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]);
    expect(mock.calls[0].args.p_payload_sha256).toBe(locked.desiredFieldsSha256);
    Object.assign(mock.row, raw); // A completed permit cannot be replayed even if row readback appears unchanged.
    const replay = await publishContent(request, mock.client, context);
    expect(replay.status).toBe(403); expect(mock.writes).toHaveLength(1);
  });

  it.each(names)("rejects %s wrong identity, field/hash, CAS and authorization before claiming", async (name) => {
    const { raw, locked } = fixture(name); const base = requestFor(name, raw);
    const wrongs: ContentPublishRequest[] = [
      ...["taskId", "actionId", "candidateVersion", "scope"].map((key) => ({ ...base, managedPermit: { ...base.managedPermit!, [key]: "wrong" } })),
      { ...base, record: { ...base.record, id: "22222222-2222-4222-8222-222222222222" } },
      { ...base, record: { ...base.record, [locked.changedFields[0]]: "forged-content" } },
      { ...base, record: { ...base.record, sort_order: 999 } },
      { ...base, record: { ...base.record, unsupported_field: true } },
      { ...base, record: { ...base.record, created_at: "changed" } },
      { ...base, expectedUpdatedAt: "2026-01-01T00:00:00Z" },
      { ...base, nextStatus: "archived" }, { ...base, ownerApproved: false },
      { ...base, explicitExecution: false }, { ...base, approvalId: "" },
      { ...base, managedPermit: { ...base.managedPermit!, operation: "rollback" } },
    ];
    for (const req of wrongs) {
      const mock = mockClient(raw); const result = await publishContent(req, mock.client, context);
      expect(result.body.ok, JSON.stringify(req.managedPermit)).toBe(false);
      expect(mock.calls).toHaveLength(0); expect(mock.writes).toHaveLength(0); expect(mock.inserts).toHaveLength(0);
    }
    const legacy = mockClient(raw);
    expect((await publishContent(base, legacy.client, { role: "content_editor", authMode: "cron" })).status).toBe(403);
    expect(legacy.calls).toHaveLength(0); expect(legacy.writes).toHaveLength(0);
    const stale = mockClient({ ...raw, sort_order: 888 });
    expect((await publishContent(base, stale.client, context)).status).toBe(409);
    expect(stale.calls).toHaveLength(0);
  });

  it.each(names)("handles %s concurrent CAS change and completed permit without repeating writes", async (name) => {
    const { raw } = fixture(name); const request = requestFor(name, raw);
    for (const opts of [{ race: true }, { replay: true }]) {
      const mock = mockClient(raw, opts); const result = await publishContent(request, mock.client, context);
      expect(result.body.ok).toBe(false); expect(mock.writes).toHaveLength(0);
    }
    const uncertain = mockClient(raw, { uncertain: true });
    const result = await publishContent(request, uncertain.client, context);
    expect(result.status).toBe(409); expect(result.body.error).toMatch(/uncertain/); expect(uncertain.writes).toHaveLength(1);
  });

  it.each(names.filter((name) => lockedOrg020V7Candidates[name].contentType === "faq"))("keeps %s FAQ request separate from frozen null and refuses question/group changes", async (name) => {
    const { raw, locked } = fixture(name);
    const adapter = JSON.parse(readFileSync(resolve(process.cwd(), locked.sourceCandidatePath), "utf8"));
    expect(adapter.frozen_request_was_null).toBe(true); expect(adapter.content_unchanged_from_frozen_v7).toBe(true);
    expect(adapter.request.record.answer_en).toBe(locked.desiredFields.answer_en);
    expect(adapter.candidate_version).not.toBe(adapter.original_candidate_version);
    for (const change of [{ question_en: "different" }, { page_key: "other" }, { replaceFaqs: true }, { status: "draft" }]) {
      const mock = mockClient(raw);
      expect((await publishContent({ ...requestFor(name, raw), record: { ...requestFor(name, raw).record, ...change } }, mock.client, context)).body.ok).toBe(false);
      expect(mock.writes).toHaveLength(0); expect(mock.inserts).toHaveLength(0);
    }
    if (raw.page_key === "home") {
      const mock = mockClient(raw);
      const result = await publishContent({ contentType: "homepage", mode: "publish", nextStatus: "published", ownerApproved: true,
        explicitExecution: true, approvalId: "test-only", record: { replaceFaqs: true, faqs: [{ question_zh: "新", question_en: "New", answer_zh: "新", answer_en: "New" }] } }, mock.client, context);
      expect(result.status).toBe(403); expect(mock.writes).toHaveLength(0); expect(mock.inserts).toHaveLength(0);
    }
  });

  it("checks exact issuer tuple/digest/CAS and still reads a completed existing permit", async () => {
    const { target } = fixture(names[0]); const now = Date.parse("2026-09-26T12:00:00Z");
    const base = { permitId, taskId: target.taskId, actionId: target.actionId, actionClass: "cms_write" as const,
      operation: "publish" as const, scope: target.scope, candidateVersion: target.candidateVersion, recordId: target.id, slug: target.slug,
      expectedUpdatedAt: target.expectedUpdatedAt!, payloadSha256: target.desiredFieldsSha256!, rollbackPayloadSha256: "b".repeat(64),
      githubActorId: identity.actorId, githubWorkflowSha: identity.workflowSha, qaReceiptId: "qa-test-only-123", operationsDecisionId: "ops-test-only-123",
      policyDecisionId: "pol-test-only-123", issuerEvidenceSha256: "d".repeat(64), expiresAt: "2026-09-26T12:10:00Z" };
    for (const change of [{ payloadSha256: "0".repeat(64) }, { expectedUpdatedAt: "2026-01-01T00:00:00Z" }, { actionId: "wrong" }, { slug: "wrong" }]) {
      const mock = mockClient({}); await expect(issueManagedPermit(mock.client, { ...base, ...change }, now)).rejects.toThrow(); expect(mock.inserts).toHaveLength(0);
    }
    const completed = mockClient({ permit_id: permitId, status: "completed", task_id: "existing-original-task", saved_id: "b401a610-a4dc-4a0b-a7e0-efcac6c81d71" });
    await expect(readManagedPermit(completed.client, permitId)).resolves.toMatchObject({ status: "completed", savedId: "b401a610-a4dc-4a0b-a7e0-efcac6c81d71" });
    expect(completed.writes).toHaveLength(0);
  });
  it.each(names)("issues %s with its own exact metadata using the unchanged permit contract", async (name) => {
    const { target } = fixture(name); const now = Date.parse("2026-09-26T12:00:00Z");
    const inserted: Row[] = [];
    const builder = { insert(row: Row) { inserted.push(row); return builder; }, select() { return builder; },
      async single() { return { data: inserted.at(-1), error: null }; } };
    const client = { from(table: string) { expect(table).toBe("managed_cms_release_permits"); return builder; } } as unknown as ContentPublishClient;
    const result = await issueManagedPermit(client, { permitId, taskId: target.taskId, actionId: target.actionId,
      actionClass: "cms_write", operation: "publish", candidateVersion: target.candidateVersion, scope: target.scope,
      recordId: target.id, slug: target.slug, expectedUpdatedAt: target.expectedUpdatedAt!, payloadSha256: target.desiredFieldsSha256!,
      rollbackPayloadSha256: "b".repeat(64), githubActorId: identity.actorId, githubWorkflowSha: identity.workflowSha,
      qaReceiptId: "qa-test-only-123", operationsDecisionId: "ops-test-only-123", policyDecisionId: "pol-test-only-123",
      issuerEvidenceSha256: "d".repeat(64), expiresAt: "2026-09-26T12:10:00Z" }, now);
    expect(result.status).toBe("issued"); expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ task_id: target.taskId, action_id: target.actionId, record_id: target.id,
      candidate_version: target.candidateVersion, payload_sha256: target.desiredFieldsSha256, slug: target.slug });
  });
  it("rejects local direct execute before reading credentials for each supported type", () => {
    const byType = new Map(names.map((name) => [lockedOrg020V7Candidates[name].contentType, name]));
    for (const name of byType.values()) {
      const result = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${name}`,
        "--execute", "--approval-id=test-only", "--env-dir=/missing-test-only-env"], { cwd: process.cwd(), encoding: "utf8" });
      expect(result.status).toBe(1); expect(result.stderr).toMatch(/approved main workflow and an exact single-use permit/);
      expect(result.stderr).not.toMatch(/CONTENT_PUBLISH_SECRET/);
    }
  });
});
