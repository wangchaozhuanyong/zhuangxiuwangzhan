import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { spawnSync } from "node:child_process";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { SEO_CABINET_TWO_ANCHOR_TARGETS } from "../../supabase/functions/_shared/seo-cabinet-two-anchor-targets.ts";
import { MANAGED_BLOGS, managedAction } from "../../supabase/functions/_shared/managed-targets.ts";
import { issueManagedPermit, type ManagedPermitIssue } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { targetConfigs, buildLockedDryRunRequest } from "../../scripts/publish-content-trust-fixes.mjs";
import { readSeoCabinetTwoAnchorCandidate } from "../../scripts/managed-cms-targets-seo-cabinet-two-anchors-v1.mjs";
import { withPublishedLinkTargets } from "@/test/helpers/publishedLinkTargets";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown>;
const path = "drafts/publishing/fc-20261025-seo-index-evidence-and-release-followthrough-v1/frozen-cabinet-two-anchors.json";
const bytes = readFileSync(path);
const source = JSON.parse(bytes.toString()) as { before: Row; desired: Row; insertions: Array<{ field: string; inserted_HTML_exactly_from_original_C1_input: string }> };
const target = SEO_CABINET_TWO_ANCHOR_TARGETS[0];
const config = targetConfigs[target.candidateVersion];
const savedTime = "2026-10-26T01:00:00.123456+00:00";
const permitId = "11111111-1111-4111-8111-111111111111";
const context = { role: "content_editor", authMode: "cron", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1,
} };
function database(initial: Row, options: { race?: boolean; uncertain?: boolean } = {}) {
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
      const builder = { select() { return builder; }, eq(key: string, value: unknown) {
        filters.push([key, value]); if (patch) predicates.push([key, value]); return builder;
      }, maybeSingle: result, single: result, update(value: Row) { patch = value; return builder; } };
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
function request(mode: "dry-run" | "publish" = "dry-run"): ContentPublishRequest {
  const result = buildLockedDryRunRequest(config.lockedCandidate, config.buildRecord(source.before), "synthetic-local-contract");
  return { ...result, mode, ownerApproved: true, explicitExecution: true, approvalId: "synthetic-local-only",
    ...(mode === "publish" ? { managedPermit: { ...managedAction(target, "publish"), operation: "publish", permitId } } : {}) };
}

describe("exact cabinet two-anchor protected channel", () => {
  it("binds one existing row, two fields, full29 and stable25 including all six MS", () => {
    expect(MANAGED_BLOGS.filter(x => x.taskId === target.taskId)).toEqual([target]);
    expect(target.changedFields).toEqual(["content_en", "content_zh"]);
    expect(target.baselineProjectionFields).toHaveLength(29);
    expect(target.retainedProjectionFields).toHaveLength(25);
    expect(target.retainedProjectionFields!.filter(x => x.endsWith("_ms"))).toHaveLength(6);
    expect(config.fields).toEqual(target.baselineProjectionFields);
    expect(config.lockedCandidate).toMatchObject({ ...target, recordId: target.id });
  });
  it("contains exactly one approved same-language anchor and restores every original byte", () => {
    for (const { field, inserted_HTML_exactly_from_original_C1_input: fragment } of source.insertions) {
      const html = String(source.desired[field]); const lang = field.endsWith("_en") ? "en" : "zh";
      const document = new JSDOM(html).window.document;
      expect(document.querySelectorAll(`a[href="/${lang}/services/builtin"]`)).toHaveLength(1);
      expect(document.querySelector(`a[href="/${lang === "en" ? "zh" : "en"}/services/builtin"]`)).toBeNull();
      expect(html.replace(fragment, "")).toBe(source.before[field]);
    }
    expect(() => readSeoCabinetTwoAnchorCandidate(Buffer.from(bytes.toString().replace("Related service:", "Unapproved service:")))).toThrow();
  });
  it("admits the exact protected workflow choice while rejecting direct local execution", () => {
    expect(readFileSync(".github/workflows/content-publish-approved.yml", "utf8")).toContain(`- ${target.candidateVersion}`);
    const result = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs",
      `--target=${target.candidateVersion}`, "--execute", "--approval-id=synthetic-untrusted"], { encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("approved main workflow and an exact single-use permit");
  });
  it("previews the real CLI request with no permit claim or database write", async () => {
    const db = database(source.before);
    const result = await publishContent(request(), db.client, context);
    expect(result.status || 200).toBe(200);
    expect(result.body.payload_preview).toEqual(source.desired);
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("writes only two columns with raw server CAS, preserving all other business/MS fields", async () => {
    const db = database(source.before);
    const result = await publishContent(request("publish"), db.client, context);
    expect(result.status || 200).toBe(200);
    expect(result.body.saved_id).toBe(target.id); expect(result.body.saved_updated_at).toBe(savedTime);
    expect(db.writes).toEqual([source.desired]);
    expect(db.predicates).toContainEqual(["id", target.id]);
    expect(db.predicates).toContainEqual(["updated_at", source.before.updated_at]);
    for (const field of target.retainedProjectionFields!) expect(db.row()[field]).toEqual(source.before[field]);
    expect(db.rpcs).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]);
    expect((await publishContent(request("publish"), db.client, context)).status).toBe(409);
    expect(db.writes).toHaveLength(1);
  });
  it.each(["content_ms", "title_en", "updated_at", "version"])("rejects actual row drift in %s before a claim", async field => {
    const db = database({ ...source.before, [field]: field === "version" ? 2 : "later independent edit" });
    expect([403, 409]).toContain((await publishContent(request("publish"), db.client, context)).status);
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("rejects unlocked fields, payload changes, another task/scope and missing execution authority", async () => {
    const input = request("publish");
    const changed = [
      { ...input, record: { ...input.record, title_en: "Unapproved title" } },
      { ...input, record: { ...input.record, content_en: "Unapproved body" } },
      { ...input, record: { ...input.record, unknown_field: "Unapproved" } },
      { ...input, managedPermit: { ...input.managedPermit!, taskId: "different-task" } },
      { ...input, managedPermit: { ...input.managedPermit!, scope: "project:flashcast:seo-index-evidence-release:20261025:v1" } },
      { ...input, explicitExecution: false },
    ];
    for (const bad of changed) {
      const db = database(source.before);
      expect([400, 403, 409]).toContain((await publishContent(bad, db.client, context)).status);
      expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    }
    const db = database(source.before);
    expect((await publishContent(input, db.client, { ...context, managedIdentity: undefined })).status).toBe(403);
    expect(db.writes).toEqual([]);
  });
  it("retains race rejection and uncertain-write readback boundaries", async () => {
    const race = database(source.before, { race: true });
    expect((await publishContent(request("publish"), race.client, context)).status).toBe(409);
    expect(race.writes).toEqual([]);
    const uncertain = database(source.before, { uncertain: true });
    const result = await publishContent(request("publish"), uncertain.client, context);
    expect(result.status).toBe(409); expect(result.body.error).toContain("uncertain");
    expect(uncertain.writes).toHaveLength(1);
  });
  it("restores only the original two fields at saved CAS and rejects subsequent MS edits", async () => {
    const current = { ...source.before, ...source.desired, updated_at: savedTime, version: 2 };
    const prior = Object.fromEntries(target.changedFields!.map(k => [k, source.before[k]]));
    const preview = buildLockedDryRunRequest(config.lockedCandidate, { ...current, ...prior }, "synthetic-local-only", "rollback");
    const input: ContentPublishRequest = { ...preview, mode: "publish", expectedUpdatedAt: savedTime,
      ownerApproved: true, explicitExecution: true, approvalId: "synthetic-inverse-local-only",
      managedPermit: { ...managedAction(target, "rollback"), operation: "rollback", permitId: "22222222-2222-4222-8222-222222222222" } };
    const db = database(current); const result = await publishContent(input, db.client, context);
    expect(result.status || 200).toBe(200); expect(db.writes).toEqual([prior]);
    for (const field of target.retainedProjectionFields!) expect(db.row()[field]).toEqual(current[field]);
    const later = database({ ...current, content_ms: "Later MS" });
    expect((await publishContent(input, later.client, context)).status).toBe(403);
    expect(later.writes).toEqual([]); expect(later.rpcs).toEqual([]);
    const drift = database({ ...current, content_ms: "Later MS" });
    expect((await publishContent({ ...input, record: { ...input.record, content_ms: "Later MS" } }, drift.client, context)).status).toBe(409);
    expect(drift.writes).toEqual([]); expect(drift.rpcs).toEqual([]);
  });
  it("requires a completed own publish parent, matching run and actual saved CAS for inverse issuance", async () => {
    const now = Date.now();
    const input: ManagedPermitIssue = { ...managedAction(target, "rollback"), operation: "rollback", actionClass: "cms_write",
      permitId: "22222222-2222-4222-8222-222222222222", parentPermitId: permitId, parentRunId: 12345,
      recordId: target.id, slug: target.slug, expectedUpdatedAt: savedTime, payloadSha256: target.rollbackFieldsSha256!,
      githubActorId: 98765, githubWorkflowSha: "a".repeat(40), qaReceiptId: "synthetic-local-qa",
      operationsDecisionId: "synthetic-local-owner", policyDecisionId: "synthetic-local-policy",
      issuerEvidenceSha256: "b".repeat(64), expiresAt: new Date(now + 60_000).toISOString() };
    const parent = { status: "completed", operation: "publish", task_id: target.taskId, record_id: target.id, slug: target.slug,
      scope: target.scope, candidate_version: target.candidateVersion, github_run_id: 12345,
      rollback_payload_sha256: target.rollbackFieldsSha256, saved_updated_at: savedTime };
    const make = (row: Row) => ({ from: () => ({ select() { return this; }, eq() { return this; },
      maybeSingle: async () => ({ data: row, error: null }), insert() { return { select() { return this; }, single: async () => ({ data: {}, error: null }) }; },
    }) }) as unknown as ContentPublishClient;
    await expect(issueManagedPermit(make(parent), input, now)).resolves.toMatchObject({ operation: "rollback" });
    for (const changed of [{ ...parent, status: "uncertain" }, { ...parent, task_id: "different-task" }, { ...parent, github_run_id: 999 }]) {
      await expect(issueManagedPermit(make(changed), input, now)).rejects.toThrow();
    }
    await expect(issueManagedPermit(make(parent), { ...input, expectedUpdatedAt: target.expectedUpdatedAt! }, now)).rejects.toThrow();
    await expect(issueManagedPermit(make(parent), { ...input, parentRunId: undefined }, now)).rejects.toThrow();
  });
});
