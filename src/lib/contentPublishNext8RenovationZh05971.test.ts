import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { load } from "js-yaml";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { issueManagedPermit } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { NEXT8_RENOVATION_ZH05971_TARGETS } from "../../supabase/functions/_shared/next8-renovation-zh05971-target.ts";
import { NEXT8_TWO_RECORD_TARGETS } from "../../supabase/functions/_shared/next8-two-record-targets.ts";
import { MANAGED_SERVICES, findManagedTarget, managedAction } from "../../supabase/functions/_shared/managed-targets.ts";
import { targetConfigs, buildLockedDryRunRequest, inspectPublicReadback } from "../../scripts/publish-content-trust-fixes.mjs";
import { readNext8RenovationZh05971Candidate } from "../../scripts/managed-cms-target-next8-renovation-zh05971.mjs";
import { withPublishedLinkTargets } from "@/test/helpers/publishedLinkTargets";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown>;
const path = "drafts/publishing/fc-20261016-industry-keyword-next-eight-pages-v1/frozen-next8-renovation-zh05971-candidate.json";
const bytes = readFileSync(path);
const source = JSON.parse(bytes.toString()) as {
  before: Row; desired: Row; inverse_values: Row; source_registration: { sha256: string };
  source_event_id: string; issuer_contract: null; baseline_is_current_CAS: false;
};
const target = NEXT8_RENOVATION_ZH05971_TARGETS[0];
const config = targetConfigs[target.candidateVersion];
const savedTime = "2026-11-04T02:00:00.123456+00:00";
const permitId = "11111111-1111-4111-8111-111111111111";
const context = { role: "content_editor", authMode: "cron", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1,
} };

// Entirely synthetic database and permit RPCs; never calls a remote publisher.
function database(initial: Row, race = false) {
  let row = { ...initial }; let claimed = false;
  const writes: Row[] = []; const predicates: Array<[string, unknown]> = []; const rpcs: string[] = [];
  const client = {
    from(table: string) {
      if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
      let patch: Row | null = null; const filters: Array<[string, unknown]> = [];
      const result = async () => {
        if (filters.some(([key, value]) => row[key] !== value) || (patch && race)) return { data: null, error: null };
        if (patch) { row = { ...row, ...patch, updated_at: savedTime }; writes.push(patch); }
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
      return { data: [{}], error: null };
    },
  };
  return { client: withPublishedLinkTargets(client as unknown as ContentPublishClient), writes, predicates, rpcs, row: () => row };
}
function request(mode: "dry-run" | "publish" = "dry-run"): ContentPublishRequest {
  return { ...buildLockedDryRunRequest(config.lockedCandidate, config.buildRecord(source.before), "synthetic-local-contract"),
    mode, ownerApproved: true, explicitExecution: true, approvalId: "synthetic-local-only",
    ...(mode === "publish" ? { managedPermit: { ...managedAction(target, "publish"), operation: "publish", permitId } } : {}),
  };
}

describe("NEXT8 KW-05971 exact single-field source carrier", () => {
  it("binds the new source-only event and never turns it into an issuer or fresh CAS", () => {
    expect(source.source_event_id).toBe("032f02d8-0a09-4434-a7d6-65742f4f6090");
    expect(source.source_registration.sha256).toBe("793d3c39e9d589a417752ac1b2b4975648d8a3aba75332a9cfaa101b806987ee");
    expect(source.issuer_contract).toBeNull(); expect(source.baseline_is_current_CAS).toBe(false);
    expect(config.lockedCandidate).toMatchObject({ ...target, recordId: target.id, sourceEventId: source.source_event_id });
    expect(() => readNext8RenovationZh05971Candidate(Buffer.concat([bytes, Buffer.from(" ")]))).toThrow("source bytes differ");
    expect(Object.isFrozen(readNext8RenovationZh05971Candidate(bytes)[target.candidateVersion].desiredFields)).toBe(true);
  });
  it("selects this exact namespace without changing the historical two-field target", () => {
    expect(findManagedTarget(MANAGED_SERVICES, target.id, target.slug, { ...managedAction(target, "publish"), operation: "publish" })).toBe(target);
    expect(findManagedTarget(MANAGED_SERVICES, target.id, target.slug)).toBeUndefined();
    const old = NEXT8_TWO_RECORD_TARGETS[0];
    expect(findManagedTarget(MANAGED_SERVICES, old.id, old.slug, { ...managedAction(old, "publish"), operation: "publish" })).toBe(old);
    expect(old.changedFields).toEqual(["content_en", "content_zh"]);
    expect(target.changedFields).toEqual(["content_zh"]);
    expect(config.fields).toHaveLength(41); expect(target.retainedProjectionFields).toHaveLength(38);
    expect(target.retainedProjectionFields).toContain("content_en");
    expect(target.retainedProjectionFields!.filter(field => field.endsWith("_ms"))).toHaveLength(11);
  });
  it("adds exactly the approved paragraph once and has a byte-exact own inverse", () => {
    const added = "<p>有地住宅咨询时，如已发现屋面排水或外墙问题，可连同照片或图纸记录位置、出现时间和仍不确定的情况，供后续现场沟通；隐蔽状况不能仅凭照片判断。</p>";
    const after = String(source.desired.content_zh);
    expect(after.split(added)).toHaveLength(2);
    expect(after.replace(added, "")).toBe(source.before.content_zh);
    expect(source.inverse_values).toEqual({ content_zh: source.before.content_zh });
    expect(createHash("sha256").update(after).digest("hex")).toBe("67e79c93385582a8f289ea08b31dee45ffe3ce119ebf1aa3d88fa0dd6aa5f6f8");
  });
  it("previews the one-field payload with zero claims and zero writes", async () => {
    const db = database(source.before); const result = await publishContent(request(), db.client, context);
    expect(result.status || 200).toBe(200); expect(result.body.payload_preview).toEqual(source.desired);
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("writes only content_zh with exact microsecond CAS in the synthetic database", async () => {
    const db = database(source.before); const result = await publishContent(request("publish"), db.client, context);
    expect(result.status || 200).toBe(200); expect(db.writes).toEqual([source.desired]);
    expect(db.predicates).toContainEqual(["id", target.id]);
    expect(db.predicates).toContainEqual(["updated_at", source.before.updated_at]);
    for (const field of target.retainedProjectionFields!) expect(db.row()[field]).toEqual(source.before[field]);
    expect(db.row().version).toBe(source.before.version);
    expect((await publishContent(request("publish"), db.client, context)).status).toBe(409);
    expect(db.writes).toHaveLength(1);
  });
  it.each([...target.retainedProjectionFields!, "updated_at", "version"])("rejects baseline drift in %s before claiming", async field => {
    const db = database({ ...source.before, [field]: "unapproved drift" });
    expect((await publishContent(request("publish"), db.client, context)).status).toBeGreaterThanOrEqual(400);
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it.each(["content_en", "content_ms", "faqs_zh"])("rejects a caller change to protected %s", async field => {
    const db = database(source.before); const req = request("publish"); req.record![field] = "unapproved";
    expect((await publishContent(req, db.client, context)).status).toBeGreaterThanOrEqual(400);
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("never sends caller-supplied version to the synthetic writer", async () => {
    const db = database(source.before); const req = request("publish"); req.record!.version = 999;
    expect((await publishContent(req, db.client, context)).status || 200).toBe(200);
    expect(db.writes).toEqual([source.desired]); expect(db.row().version).toBe(source.before.version);
  });
  it("rejects the old two-field namespace and missing trusted workflow identity", async () => {
    const db = database(source.before); const req = request("publish"); req.managedPermit!.scope = NEXT8_TWO_RECORD_TARGETS[0].scope;
    expect((await publishContent(req, db.client, context)).status).toBe(403);
    expect((await publishContent(request("publish"), db.client, { role: "content_editor", authMode: "cron" })).status).toBe(403);
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("does not retry a racing CAS", async () => {
    const db = database(source.before, true);
    expect((await publishContent(request("publish"), db.client, context)).status).toBe(409);
    expect(db.writes).toEqual([]); expect(db.rpcs.filter(name => name === "claim_managed_cms_release_permit")).toHaveLength(1);
  });
  it("keeps inverse execution disabled even with a hypothetical completed parent", async () => {
    expect(target.rollbackAllowed).toBe(false); expect(target.requiresParentRun).toBe(true);
    const postSave = { ...source.before, ...source.desired, updated_at: savedTime };
    const db = database(postSave); const req = request("publish");
    req.expectedUpdatedAt = savedTime;
    req.record = { ...postSave, ...source.inverse_values };
    req.managedCandidate = { ...managedAction(target, "rollback"), operation: "rollback" };
    req.managedPermit = { ...managedAction(target, "rollback"), operation: "rollback", permitId };
    expect((await publishContent(req, db.client, context)).status).toBe(403);
    await expect(issueManagedPermit(db.client, { ...managedAction(target, "rollback"), operation: "rollback", actionClass: "cms_write",
      permitId, recordId: target.id, slug: target.slug, expectedUpdatedAt: savedTime,
      payloadSha256: target.rollbackFieldsSha256!, parentPermitId: "22222222-2222-4222-8222-222222222222", parentRunId: 12345,
      githubActorId: 98765, githubWorkflowSha: "a".repeat(40), qaReceiptId: "synthetic-qa", operationsDecisionId: "synthetic-operations",
      policyDecisionId: "synthetic-policy", issuerEvidenceSha256: "b".repeat(64), expiresAt: new Date(Date.now() + 60_000).toISOString(),
    })).rejects.toThrow("identity, evidence, or short expiry");
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("wires both workflow selection and exact-head Node22 CI without changing permissions", () => {
    const workflow = load(readFileSync(".github/workflows/content-publish-approved.yml", "utf8")) as {
      on: { workflow_dispatch: { inputs: { target: { options: string[] } } } };
    };
    expect(workflow.on.workflow_dispatch.inputs.target.options.filter(name => name === target.candidateVersion)).toHaveLength(1);
    const ci = readFileSync(".github/workflows/r3-managed-cms-pr-ci.yml", "utf8");
    expect(() => load(ci)).not.toThrow(); expect(ci).toContain("node-version: '22'");
    for (const file of [path, "scripts/managed-cms-target-next8-renovation-zh05971.mjs",
      "supabase/functions/_shared/next8-renovation-zh05971-target.ts", "src/lib/contentPublishNext8RenovationZh05971.test.ts"]) expect(ci).toContain(`- ${file}`);
    expect(ci).toContain("src/lib/contentPublishNext8RenovationZh05971.test.ts \\");
  });
  it("rejects direct local publish before network access and keeps strict ZH title checks", () => {
    const child = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${target.candidateVersion}`, "--execute", "--approval-id=synthetic-untrusted"], { encoding: "utf8" });
    expect(child.status).toBe(1); expect(child.stderr).toContain("approved main workflow and an exact single-use permit");
    expect(config.publicPaths).toHaveLength(1);
    const page = config.publicPaths[0]; expect(page.path).toBe("/zh/services/renovation"); expect(page.strictMetadataTitle).toBe(true);
    expect(inspectPublicReadback(page, 200, `<title>${page.expected}</title>`).found).toBe(true);
    expect(inspectPublicReadback(page, 200, `<title>Wrong title</title><p>${page.expected}</p>`).found).toBe(false);
  });
});
