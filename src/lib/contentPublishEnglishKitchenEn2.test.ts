import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { ENGLISH_KITCHEN_EN2_TARGETS } from "../../supabase/functions/_shared/english-kitchen-en2-targets.ts";
import { MANAGED_SERVICES, findManagedTarget, managedAction } from "../../supabase/functions/_shared/managed-targets.ts";
import { targetConfigs, buildLockedDryRunRequest, assertLockedServiceCandidate } from "../../scripts/publish-content-trust-fixes.mjs";
import { readEnglishKitchenEn2Candidates } from "../../scripts/managed-cms-targets-english-kitchen-en2-v1.mjs";
import { withPublishedLinkTargets } from "@/test/helpers/publishedLinkTargets";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown>;
const bytes = readFileSync("drafts/publishing/fc-20261011-english-kitchen-actual-publication-goal-v1/frozen-current-english-kitchen-en2-candidate.json");
const source = JSON.parse(bytes.toString()) as { business_scope: string; normal_physical_scope_mapping_status: string; entries: Array<{ before: Row; desired: Row }> };
const entry = source.entries[0];
const target = ENGLISH_KITCHEN_EN2_TARGETS[0];
const key = "english-kitchen-en2-exact-v1";
const config = targetConfigs[key];
const savedTime = "2026-10-27T05:00:00.123456+00:00";
const context = { role: "content_editor", authMode: "cron", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1,
} };

// Local synthetic transport only; no real CMS client/row/permit is contacted.
function database(initial: Row, options: { race?: boolean; uncertain?: boolean } = {}) {
  let row = { ...initial }; let claimed = false;
  const writes: Row[] = [], predicates: Array<[string, unknown]> = [], rpcs: string[] = [];
  const client = {
    from(table: string) {
      if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
      let patch: Row | null = null; const filters: Array<[string, unknown]> = [];
      const result = async () => {
        if (filters.some(([k, v]) => row[k] !== v) || patch && options.race) return { data: null, error: null };
        if (patch) { row = { ...row, ...patch, updated_at: savedTime }; writes.push(patch); }
        return { data: { ...row }, error: null };
      };
      const query = { select() { return query; }, eq(k: string, v: unknown) {
        filters.push([k, v]); if (patch) predicates.push([k, v]); return query;
      }, maybeSingle: result, single: result, update(value: Row) { patch = value; return query; } };
      return query;
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
  return { ...buildLockedDryRunRequest(config.lockedCandidate, config.buildRecord(entry.before), "synthetic-local-contract"),
    mode, ownerApproved: true, explicitExecution: true, approvalId: "synthetic-local-only",
    ...(mode === "publish" ? { managedPermit: { ...managedAction(target, "publish"), operation: "publish", permitId: "11111111-1111-4111-8111-111111111111" } } : {}),
  };
}

describe("original English kitchen EN2 current full41 target", () => {
  it("retains original task/action/version and separates business scope from the proposed normal physical scope", () => {
    expect(ENGLISH_KITCHEN_EN2_TARGETS).toHaveLength(1);
    expect(target).toMatchObject({ taskId: "fc-20261011-english-kitchen-actual-publication-goal-v1",
      actionId: "save-kitchen-english-two-fields-v1", candidateVersion: "publishing-english-kitchen-en2-actual-publication-v1-20261011",
      scope: "flashcast.com.my:services:ce4156db-9034-42c8-ba29-b35724ea7d6d:title_en,excerpt_en", rollbackAllowed: false });
    expect(source.business_scope).toBe("cms:services:kitchen:english-two-fields:publication:v1");
    expect(source.normal_physical_scope_mapping_status).toBe("PROPOSED_NOT_REGISTERED");
    expect(key).not.toBe(target.candidateVersion);
    expect(config.lockedCandidate).toMatchObject({ ...target, recordId: target.id });
    expect(findManagedTarget(MANAGED_SERVICES, target.id, target.slug, { ...managedAction(target, "publish"), operation: "publish" })).toBe(target);
    expect(findManagedTarget(MANAGED_SERVICES, target.id, target.slug)).toBeUndefined();
    expect(config.fields).toHaveLength(41); expect(target.retainedProjectionFields).toHaveLength(37);
    expect(target.retainedProjectionFields!.filter(f => f.endsWith("_ms"))).toHaveLength(11);
    expect(() => assertLockedServiceCandidate(config.lockedCandidate, entry.before)).not.toThrow();
  });
  it("builds the same exact accepted two-field patch and uses the ordinary protected service dry-run", async () => {
    expect(entry.desired).toEqual({ title_en: "Custom Kitchen Cabinets & Kitchen Renovation in KL & Selangor",
      excerpt_en: "Plan custom kitchen cabinets around your layout, storage needs and material choices. Discuss cabinet, countertop and installation scope, with renovation works confirmed separately. Share your kitchen photos and location for a free quotation." });
    const db = database(entry.before); const result = await publishContent(request(), db.client, context);
    expect(result.status || 200).toBe(200); expect(result.body.payload_preview).toEqual(entry.desired);
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("writes only title_en/excerpt_en using the full microsecond CAS and preserves every protected field", async () => {
    const db = database(entry.before); const result = await publishContent(request("publish"), db.client, context);
    expect(result.status || 200).toBe(200); expect(result.body.saved_id).toBe(target.id);
    expect(db.writes).toEqual([entry.desired]); expect(db.predicates).toContainEqual(["updated_at", entry.before.updated_at]);
    expect(db.predicates).toContainEqual(["id", target.id]);
    for (const field of target.retainedProjectionFields!) expect(db.row()[field]).toEqual(entry.before[field]);
    expect(db.rpcs).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]);
    expect((await publishContent(request("publish"), db.client, context)).status).toBe(409); expect(db.writes).toHaveLength(1);
  });
  it.each(["content_ms", "title_zh", "faqs_en", "version"])("rejects baseline drift in %s without claiming a permit", async field => {
    const db = database({ ...entry.before, [field]: "unapproved drift" });
    expect((await publishContent(request("publish"), db.client, context)).status).toBe(field === "version" ? 409 : 403);
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it.each(["content_ms", "seo_title_en", "title_zh", "unknown_field"])("rejects a request edit to %s", async field => {
    const db = database(entry.before); const req = request("publish"); req.record![field] = "unapproved";
    expect((await publishContent(req, db.client, context)).status).toBe(403); expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("rejects the historical business scope, another task, or missing verified workflow identity", async () => {
    const db = database(entry.before); const req = request("publish"); req.managedPermit!.scope = source.business_scope;
    expect((await publishContent(req, db.client, context)).status).toBe(403);
    req.managedPermit!.scope = target.scope; req.managedPermit!.taskId = "another-task";
    expect((await publishContent(req, db.client, context)).status).toBe(403);
    expect((await publishContent(request("publish"), db.client, { role: "content_editor", authMode: "cron" })).status).toBe(403);
    expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("rejects inverse selection without creating a recovery permission", async () => {
    const db = database(entry.before); const req = request("publish");
    req.managedPermit = { ...managedAction(target, "rollback"), operation: "rollback", permitId: req.managedPermit!.permitId };
    expect((await publishContent(req, db.client, context)).status).toBe(403); expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
  });
  it("does not retry a racing CAS or an uncertain completion", async () => {
    const race = database(entry.before, { race: true }); expect((await publishContent(request("publish"), race.client, context)).status).toBe(409);
    expect(race.writes).toEqual([]); expect(race.rpcs.filter(n => n === "claim_managed_cms_release_permit")).toHaveLength(1);
    const uncertain = database(entry.before, { uncertain: true }); expect((await publishContent(request("publish"), uncertain.client, context)).status).toBe(409);
    expect(uncertain.writes).toHaveLength(1);
  });
  it("rejects changed source bytes and direct local production execution", () => {
    expect(() => readEnglishKitchenEn2Candidates(Buffer.concat([bytes, Buffer.from("\n")]))).toThrow("source bytes differ");
    expect(readFileSync(".github/workflows/content-publish-approved.yml", "utf8")).toContain(`- ${key}`);
    const result = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${key}`, "--execute", "--approval-id=synthetic-untrusted"], { encoding: "utf8" });
    expect(result.status).toBe(1); expect(result.stderr).toContain("approved main workflow and an exact single-use permit");
  });
});
