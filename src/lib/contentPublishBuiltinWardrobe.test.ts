import { createHash } from "node:crypto";
import { withPublishedLinkTargets } from "@/test/helpers/publishedLinkTargets";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { issueManagedPermit } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { BUILTIN_WARDROBE_TARGETS } from "../../supabase/functions/_shared/builtin-wardrobe-targets.ts";
import {
  MANAGED_TARGETS, findManagedTarget, findManagedPreviewCandidate, managedAction,
} from "../../supabase/functions/content-publish/managed-targets.ts";
import type {
  ContentPublishClient, ContentPublishRequest, PublishContext,
} from "../../supabase/functions/content-publish/types.ts";
import {
  BUILTIN_WARDROBE_TARGET_NAME, lockedBuiltinWardrobeCandidates, readBuiltinWardrobeCandidate,
} from "../../scripts/managed-cms-targets-builtin-wardrobe-v1.mjs";
import {
  assertLockedServiceCandidate, assertLockedPublishGate, buildLockedDryRunRequest,
  stableDigest, targetConfigs,
} from "../../scripts/publish-content-trust-fixes.mjs";

type Row = Record<string, unknown>;
type RpcCall = { name: string; args: Row };
const name = BUILTIN_WARDROBE_TARGET_NAME;
const locked = lockedBuiltinWardrobeCandidates[name];
const target = BUILTIN_WARDROBE_TARGETS[0];
const originalDigests = {
  baselineFieldsSha256: target.baselineFieldsSha256,
  retainedFieldsSha256: target.retainedFieldsSha256,
  rollbackFieldsSha256: target.rollbackFieldsSha256,
};
const permitId = "11111111-1111-4111-8111-111111111111";
const savedTime = "2026-10-15T01:23:45.123456+00:00";
const context: PublishContext = {
  role: "content_editor", authMode: "cron", managedIdentity: {
    repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
    workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
    runId: 12345, runAttempt: 1,
  },
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const patchFrom = (row: Row, fields: readonly string[]) =>
  Object.fromEntries(fields.map((field) => [field, row[field]]));

// Clearly synthetic baseline: no production row or private company-project file is retained.
// Only the target's baseline/prior digests change for local service tests; its exact desired body stays frozen.
function syntheticBefore(): Row {
  const row: Row = Object.fromEntries(locked.baselineProjectionFields.map((field: string) => [field, `SYNTHETIC-${field}`]));
  Object.assign(row, {
    id: target.id, slug: target.slug, status: "published", version: 1, sort_order: 0,
    created_at: "2000-01-01T00:00:00+00:00", updated_at: target.expectedUpdatedAt,
    title_zh: "合成衣柜测试", title_en: "SYNTHETIC wardrobe test",
    excerpt_zh: "合成测试摘要", excerpt_en: "SYNTHETIC test excerpt",
    content_zh: "<h2>合成旧正文</h2><p>仅用于本地测试。</p>",
    content_en: "<h2>SYNTHETIC prior body</h2><p>Local test only.</p>",
    image_url: "/images/synthetic-wardrobe.webp", alt_zh: "合成衣柜测试", alt_en: "SYNTHETIC wardrobe test",
    seo_title_zh: "合成衣柜测试", seo_title_en: "SYNTHETIC wardrobe test",
    seo_description_zh: "合成测试描述", seo_description_en: "SYNTHETIC test description",
    suitable_for_zh: ["合成住宅"], suitable_for_en: ["SYNTHETIC homes"],
    common_projects_zh: ["合成衣柜"], common_projects_en: ["SYNTHETIC wardrobes"],
    scope_items_zh: ["合成范围"], scope_items_en: ["SYNTHETIC scope"],
    process_steps_zh: [{ title: "合成流程", desc: "仅用于本地测试。" }],
    process_steps_en: [{ title: "SYNTHETIC process", desc: "Local test only." }],
    faqs_zh: [{ q: "合成问题？", a: "仅用于本地测试。" }],
    faqs_en: [{ q: "SYNTHETIC question?", a: "Local test only." }],
  });
  return row;
}
function bindSyntheticBaseline() {
  const row = syntheticBefore();
  target.baselineFieldsSha256 = stableDigest(row);
  target.retainedFieldsSha256 = stableDigest(patchFrom(row, target.retainedProjectionFields!));
  target.rollbackFieldsSha256 = stableDigest(patchFrom(row, target.changedFields!));
  return row;
}
function request(before: Row, mode: "dry-run" | "publish" = "dry-run"): ContentPublishRequest {
  const record = targetConfigs[name].buildRecord(before);
  if (mode === "dry-run") return buildLockedDryRunRequest(locked, record, "synthetic-local-contract-test");
  return {
    contentType: "service", mode, nextStatus: "published", expectedUpdatedAt: locked.expectedUpdatedAt,
    ownerApproved: true, explicitExecution: true, approvalId: "synthetic-local-contract-test", record,
    managedPermit: { ...managedAction(target, "publish"), operation: "publish", permitId },
  };
}
function clientFor(initial: Row, options: { race?: boolean; denyClaim?: boolean; denyBegin?: boolean } = {}) {
  let row = clone(initial); let claimed = false;
  const writes: Row[] = []; const predicates: Array<[string, unknown]> = [];
  const rpcs: RpcCall[] = []; const tables: string[] = []; const audits: Row[] = [];
  const client = {
    from(table: string) {
      tables.push(table);
      if (table === "admin_audit_logs") return { insert: async (value: Row) => {
        audits.push(value); return { data: null, error: null };
      } };
      if (table !== "services") throw new Error(`Unexpected synthetic table ${table}`);
      let patch: Row | null = null; const filters: Array<[string, unknown]> = [];
      const result = async () => {
        if (filters.some(([field, value]) => row[field] !== value) || (patch && options.race)) return { data: null, error: null };
        if (patch) {
          writes.push(clone(patch)); row = { ...row, ...patch, updated_at: savedTime, version: Number(row.version) + 1 };
        }
        return { data: clone(row), error: null };
      };
      const builder = {
        select() { return builder; },
        eq(field: string, value: unknown) { filters.push([field, value]); if (patch) predicates.push([field, value]); return builder; },
        maybeSingle: result, single: result,
        update(value: Row) { patch = value; return builder; },
        insert() { throw new Error("Synthetic existing-row contract forbids insertion"); },
      };
      return builder;
    },
    async rpc(rpcName: string, args: Row) {
      rpcs.push({ name: rpcName, args: clone(args) });
      if (rpcName === "claim_managed_cms_release_permit") {
        if (claimed || options.denyClaim) return { data: [], error: null };
        claimed = true;
      }
      if (rpcName === "begin_managed_cms_release_write" && options.denyBegin) return { data: [], error: null };
      return { data: [{}], error: null };
    },
  };
  return {
    client: withPublishedLinkTargets(client as unknown as ContentPublishClient), writes, predicates, rpcs, tables, audits,
    row: () => clone(row), resetRowForReplay: () => { row = clone(initial); },
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Network is forbidden in synthetic wardrobe tests"); }));
});
afterEach(() => {
  Object.assign(target, originalDigests);
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe("one exact protected builtin wardrobe delta", () => {
  it("binds the distinct workflow name and action to one original content candidate", () => {
    expect(Object.keys(lockedBuiltinWardrobeCandidates)).toEqual([name]);
    expect(name).toBe("builtin-wardrobe-layout-content-zh-20261014-v1");
    expect(name).not.toBe(locked.actionId);
    expect(locked.actionId).toBe("publish-builtin-wardrobe-layout-20261014-v1");
    expect(target).toMatchObject({
      id: "b401a610-a4dc-4a0b-a7e0-efcac6c81d71", slug: "builtin", table: "services", contentType: "service",
      taskId: "fc-20261014-builtin-wardrobe-layout-cms-publication-v1", candidateVersion: "two-quality-pages-20261014-v1",
      actionId: locked.actionId, scope: "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71:content_zh",
      changedFields: ["content_zh"], rollbackAllowed: false, requiresParentRun: true,
      desiredFieldsSha256: "ac15ee387764d4a7420edc106cc2b078b3f28ce273d608664cf18ef00ec57e83",
      expectedUpdatedAt: "2026-10-19T13:38:58.669156+00:00",
    });
    expect(MANAGED_TARGETS.filter((value) => value.taskId === target.taskId)).toEqual([target]);
    expect(findManagedTarget(MANAGED_TARGETS, target.id, target.slug, { ...managedAction(target, "publish"), operation: "publish" })).toBe(target);
    expect(targetConfigs[name].lockedCandidate).toBe(locked);
    expect(targetConfigs[name]).toMatchObject({ keyField: "id", key: target.id, table: "services" });
    expect(targetConfigs[locked.candidateVersion]).toBeUndefined();
    expect(targetConfigs[locked.actionId]).toBeUndefined();
    expect(target.baselineProjectionFields).toHaveLength(41);
    expect(new Set(target.baselineProjectionFields).size).toBe(41);
    expect(target.retainedProjectionFields).toEqual(target.baselineProjectionFields!.filter((field) => !["content_zh", "updated_at", "version"].includes(field)));
    expect(target.retainedProjectionFields).toHaveLength(38);
    expect(target.retainedProjectionFields!.filter((field) => field.endsWith("_ms"))).toHaveLength(11);
    expect(locked.baselineProjectionFields).toEqual(target.baselineProjectionFields);
    expect(locked.retainedProjectionFields).toEqual(target.retainedProjectionFields);
    expect(locked.expectedUpdatedAt).toBe(target.expectedUpdatedAt);
    expect(Object.isFrozen(locked.desiredFields)).toBe(true);
    expect(Object.keys(locked.desiredFields)).toEqual(["content_zh"]);
    for (const field of ["baselineFieldsSha256", "retainedFieldsSha256", "rollbackFieldsSha256"] as const) {
      expect(locked[field]).toBe(target[field]);
    }
  });

  it("loads only the tracked one-field public package without a production backup dependency", () => {
    const bytes = readFileSync(locked.sourceCandidatePath); const source = JSON.parse(bytes.toString("utf8"));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(locked.sourceCandidateSha256);
    expect(locked.sourceCandidateSha256).toBe("09dea94387fd851e2684ce2b9cf0abe8f98d671f9f321b0b2257816ab0ac9f78");
    expect(source.expected_updated_at).toBe("2026-10-10T16:08:22.003433+00:00");
    expect(source.expected_updated_at).not.toBe(locked.expectedUpdatedAt);
    expect(readBuiltinWardrobeCandidate(bytes).desiredFields).toEqual(locked.desiredFields);
    expect(stableDigest(source.desired_fields)).toBe(target.desiredFieldsSha256);
    expect(source).not.toHaveProperty("record"); expect(source).not.toHaveProperty("before_fields");
    expect(JSON.stringify(source)).not.toContain("/Users/");
    expect(source.source_provenance.human_message_id).toBe("01a13ab5-9a48-72f2-8515-0cfd5cad410b");
    expect(locked.publicPaths.map((page: { path: string }) => page.path)).toEqual(["/zh/services/builtin", "/en/services/builtin"]);
    expect(locked.publicPaths[0].requiredPhrases).toContain("衣柜设计与布局规划");
    expect(locked.publicPaths[0]).not.toHaveProperty("renderedRequiredPhrases");
  });

  it.each([
    ["task", { task_id: "wrong-task" }], ["action", { action_id: "wrong-action" }],
    ["candidate", { candidate_version: "old-candidate" }], ["scope", { scope: "flashcast.com.my:services/other:content_en" }],
    ["row", { record_id: "other-row" }], ["slug", { slug: "kitchen" }],
    ["projection", { changed_fields: ["content_zh", "title_en"] }],
    ["provenance", { source_provenance: {} }], ["body", { desired_fields: { content_zh: "unreviewed" } }],
  ])("rejects a tampered %s package before any transport", (_label, patch) => {
    const source = JSON.parse(readFileSync(locked.sourceCandidatePath, "utf8"));
    expect(() => readBuiltinWardrobeCandidate(Buffer.from(JSON.stringify({ ...source, ...patch })))).toThrow(/package hash differs/);
  });

  it("builds only content_zh and preserves all other 40 native fixture values", () => {
    const before = syntheticBefore(); const desired = targetConfigs[name].buildRecord(before);
    expect(Object.keys(before)).toHaveLength(41);
    expect(Object.keys(desired).filter((field) => stableDigest(desired[field]) !== stableDigest(before[field]))).toEqual(["content_zh"]);
    for (const field of locked.baselineProjectionFields.filter((value: string) => value !== "content_zh")) expect(desired[field]).toEqual(before[field]);
    const syntheticLocked = { ...locked, baselineFieldsSha256: stableDigest(before) };
    expect(() => assertLockedServiceCandidate(syntheticLocked, before)).not.toThrow();
    expect(stableDigest({ content_zh: desired.content_zh })).toBe("ac15ee387764d4a7420edc106cc2b078b3f28ce273d608664cf18ef00ec57e83");
  });

  it.each([
    ["id", { id: "other-row" }], ["slug", { slug: "other-slug" }], ["status", { status: "draft" }],
    ["raw microsecond CAS", { updated_at: "2026-10-10T16:08:22.003000+00:00" }],
    ["version", { version: 2 }], ["retained English body", { content_en: "unreviewed" }],
  ])("CLI baseline rejects %s drift", (_label, patch) => {
    const before = syntheticBefore(); const syntheticLocked = { ...locked, baselineFieldsSha256: stableDigest(before) };
    expect(() => assertLockedServiceCandidate(syntheticLocked, { ...before, ...patch })).toThrow();
  });

  it("runs the real service preview with an exact one-column patch and no permit claim", async () => {
    const before = bindSyntheticBaseline(); const fake = clientFor(before); const input = request(before);
    expect(input).not.toHaveProperty("ownerApproved"); expect(input).not.toHaveProperty("managedPermit");
    expect(input.expectedUpdatedAt).toBe(before.updated_at);
    expect(await findManagedPreviewCandidate("service", input.record!, target.expectedUpdatedAt!)).toEqual(input.managedCandidate);
    const result = await publishContent(input, fake.client, context);
    expect(result.status || 200).toBe(200);
    expect(result.body).toMatchObject({ ok: true, dry_run: true, existing_id: target.id, slug: "builtin" });
    expect(result.body.payload_preview).toEqual(locked.desiredFields);
    expect(Object.keys(result.body.payload_preview as Row)).toEqual(["content_zh"]);
    expect(stableDigest(result.body.payload_preview)).toBe(target.desiredFieldsSha256);
    expect(fake.row()).toEqual(before); expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
  });

  it.each(locked.retainedProjectionFields.filter((field: string) => field.endsWith("_ms")))(
    "protects current Malay %s in the CLI and service before a write or permit claim", async (field: string) => {
      const before = bindSyntheticBaseline();
      const changed = { ...before, [field]: "SYNTHETIC newer Malay value" };
      const syntheticLocked = { ...locked, baselineFieldsSha256: stableDigest(before) };
      expect(() => assertLockedServiceCandidate(syntheticLocked, changed)).toThrow();
      const fake = clientFor(changed);
      expect((await publishContent(request(before), fake.client, context)).status).toBe(403);
      expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
      const publishFake = clientFor(before);
      const forged = request(before, "publish");
      forged.record = { ...forged.record, [field]: "SYNTHETIC unapproved Malay request" };
      expect((await publishContent(forged, publishFake.client, context)).status).toBe(403);
      expect(publishFake.writes).toEqual([]); expect(publishFake.rpcs).toEqual([]);
    },
  );

  it.each([
    ["unreviewed body", "content_zh", "unreviewed"], ["English body", "content_en", "unreviewed"],
    ["Chinese title", "title_zh", "unreviewed"], ["image", "image_url", "/images/other.webp"],
    ["unknown field", "unknown_field", "unreviewed"], ["slug alias", "slug", "BUILTIN"],
  ])("service preview denies request %s changes before writes", async (_label, field, value) => {
    const before = bindSyntheticBaseline(); const fake = clientFor(before); const input = request(before);
    input.record = { ...input.record, [field]: value };
    expect([400, 403, 409]).toContain((await publishContent(input, fake.client, context)).status);
    expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
  });

  it.each([
    ["updated_at", { updated_at: savedTime }, 409], ["version", { version: 2 }, 409],
    ["retained content", { content_en: "newer English content" }, 403], ["retained metadata", { seo_title_en: "newer title" }, 403],
  ])("service preview rejects current-row %s drift", async (_label, patch, status) => {
    const before = bindSyntheticBaseline(); const fake = clientFor({ ...before, ...patch });
    expect((await publishContent(request(before), fake.client, context)).status).toBe(status);
    expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
  });

  it.each([
    ["old task", { taskId: "fc-20261010-paid-three-page-exact-publication-followthrough-v1" }],
    ["old action", { actionId: "paid-three-page-builtin-exact-fields-v1" }],
    ["old candidate", { candidateVersion: "paid-three-page-exact-native-diff-v1-20261010" }],
    ["different scope", { scope: "flashcast.com.my:services/b401a610-a4dc-4a0b-a7e0-efcac6c81d71:content_en" }],
  ])("rejects a mixed %s selector instead of borrowing the old builtin target", async (_label, patch) => {
    const before = bindSyntheticBaseline(); const fake = clientFor(before); const input = request(before);
    input.managedCandidate = { ...input.managedCandidate!, ...patch };
    expect(findManagedTarget(MANAGED_TARGETS, target.id, target.slug, input.managedCandidate)).toBeUndefined();
    expect((await publishContent(input, fake.client, context)).status).toBe(403);
    expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
  });

  it("denies ordinary Save, missing permits, roles and missing verified execution identity", async () => {
    const before = bindSyntheticBaseline();
    for (const variation of [
      { input: { ...request(before, "publish"), managedPermit: undefined }, ctx: context },
      { input: request(before, "publish"), ctx: { ...context, managedIdentity: undefined } },
      { input: request(before, "publish"), ctx: { ...context, role: "viewer" } },
      { input: { ...request(before, "publish"), ownerApproved: false }, ctx: context },
      { input: { ...request(before, "publish"), explicitExecution: false }, ctx: context },
    ]) {
      const fake = clientFor(before);
      expect((await publishContent(variation.input, fake.client, variation.ctx)).status).toBe(403);
      expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
    }
    expect(() => assertLockedPublishGate(locked, {}, permitId)).toThrow(/approved main workflow/);
  });

  it("claims one exact permit and writes only content_zh under ID and raw CAS predicates", async () => {
    const before = bindSyntheticBaseline(); const fake = clientFor(before);
    const result = await publishContent(request(before, "publish"), fake.client, context);
    expect(result.status || 200, JSON.stringify(result.body)).toBe(200); expect(result.body.saved_id).toBe(target.id);
    expect(fake.writes).toEqual([locked.desiredFields]);
    expect(fake.predicates).toEqual([["id", target.id], ["updated_at", before.updated_at]]);
    expect(fake.rpcs.map((call) => call.name)).toEqual([
      "claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write",
    ]);
    expect(fake.rpcs[0].args).toMatchObject({
      p_permit_id: permitId, p_task_id: target.taskId, p_action_id: target.actionId,
      p_action_class: "cms_write", p_operation: "publish", p_scope: target.scope,
      p_candidate_version: target.candidateVersion, p_record_id: target.id, p_slug: "builtin",
      p_expected_updated_at: before.updated_at, p_payload_sha256: target.desiredFieldsSha256,
      p_github_workflow_sha: context.managedIdentity!.workflowSha, p_github_actor_id: context.managedIdentity!.actorId,
      p_github_run_id: context.managedIdentity!.runId, p_github_run_attempt: 1,
    });
    expect(fake.rpcs[2].args).toMatchObject({ p_success: true, p_saved_id: target.id, p_saved_updated_at: savedTime });
    for (const field of target.retainedProjectionFields!) expect(fake.row()[field]).toEqual(before[field]);
    expect(fake.audits).toHaveLength(1);
    expect(new Set(fake.tables)).toEqual(new Set(["services", "admin_audit_logs"]));
    // Resetting only the mock row isolates the one-time permit boundary from the separate stale-CAS guard.
    fake.resetRowForReplay();
    expect((await publishContent(request(before, "publish"), fake.client, context)).status).toBe(403);
    expect(fake.writes).toHaveLength(1);
    expect(fake.rpcs.filter((call) => call.name === "begin_managed_cms_release_write")).toHaveLength(1);
  });

  it.each([
    ["rejected claim", { denyClaim: true }, 403, ["claim_managed_cms_release_permit"]],
    ["rejected write start", { denyBegin: true }, 409, ["claim_managed_cms_release_permit", "begin_managed_cms_release_write"]],
    ["CAS competitor", { race: true }, 409, ["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]],
  ])("%s cannot write or audit a saved result", async (_label, options, status, rpcNames) => {
    const before = bindSyntheticBaseline(); const fake = clientFor(before, options);
    const result = await publishContent(request(before, "publish"), fake.client, context);
    expect(result.status).toBe(status); expect(fake.row()).toEqual(before);
    expect(fake.writes).toEqual([]); expect(fake.audits).toEqual([]);
    expect(fake.rpcs.map((call) => call.name)).toEqual(rpcNames);
    if ("race" in options && options.race) expect(fake.rpcs.at(-1)!.args).toMatchObject({ p_success: false, p_saved_id: null, p_saved_updated_at: null });
  });

  it("retains issuer actor/evidence/expiry checks and rejects rollback admission", async () => {
    const inserted: Row[] = [];
    const builder = { select() { return builder; }, insert(row: Row) { inserted.push(row); return builder; }, single: async () => ({ data: inserted.at(-1), error: null }) };
    const client = { from: () => builder } as unknown as ContentPublishClient;
    const now = Date.parse("2026-10-15T01:00:00Z");
    const input = {
      ...managedAction(target, "publish"), permitId, operation: "publish" as const, actionClass: "cms_write" as const,
      recordId: target.id, slug: target.slug, expectedUpdatedAt: target.expectedUpdatedAt!,
      payloadSha256: target.desiredFieldsSha256!, rollbackPayloadSha256: target.rollbackFieldsSha256!,
      githubActorId: 98765, githubWorkflowSha: "a".repeat(40), qaReceiptId: "qa-synthetic-contract-test",
      operationsDecisionId: "ops-synthetic-contract-test", policyDecisionId: "policy-synthetic-contract-test",
      issuerEvidenceSha256: "b".repeat(64), expiresAt: "2026-10-15T01:10:00Z",
    };
    await expect(issueManagedPermit(client, input, now)).resolves.toMatchObject({ permitId, status: "issued" });
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ task_id: target.taskId, action_id: target.actionId, candidate_version: target.candidateVersion,
      record_id: target.id, payload_sha256: target.desiredFieldsSha256, github_actor_id: 98765, github_run_id: null });
    for (const forged of [
      { ...input, payloadSha256: "c".repeat(64) }, { ...input, rollbackPayloadSha256: "c".repeat(64) },
      { ...input, expectedUpdatedAt: savedTime }, { ...input, githubActorId: 0 },
      { ...input, expiresAt: "2026-10-15T01:16:00Z" }, { ...input, qaReceiptId: "" },
      { ...input, ...managedAction(target, "rollback"), operation: "rollback" as const },
    ]) await expect(issueManagedPermit(client, forged, now)).rejects.toThrow();
    expect(inserted).toHaveLength(1);
    const before = bindSyntheticBaseline();
    const saved = { ...targetConfigs[name].buildRecord(before), updated_at: savedTime, version: 2 };
    const fake = clientFor(saved); const restore = request(before, "publish");
    restore.record = { ...saved, content_zh: before.content_zh };
    restore.expectedUpdatedAt = savedTime;
    restore.managedPermit = { ...managedAction(target, "rollback"), operation: "rollback", permitId };
    expect((await publishContent(restore, fake.client, context)).status).toBe(403);
    expect(fake.writes).toEqual([]); expect(fake.rpcs).toEqual([]);
    const denied = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${name}`, "--rollback-from=unused.json"], {
      encoding: "utf8", env: { PATH: process.env.PATH },
    });
    expect(denied.status).not.toBe(0);
    expect(denied.stderr).toMatch(/blocked; prepare a separately reviewed forward correction/);
  });
});
