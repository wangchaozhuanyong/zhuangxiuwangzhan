import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { issueManagedPermit, type ManagedPermitIssue } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { PAID6_KITCHEN_TARGETS } from "../../supabase/functions/_shared/paid6-kitchen-targets.ts";
import { MANAGED_SERVICES, findManagedTarget, managedAction } from "../../supabase/functions/_shared/managed-targets.ts";
import { targetConfigs, buildLockedDryRunRequest, resolveLockedPublicPaths, inspectPublicReadback } from "../../scripts/publish-content-trust-fixes.mjs";
import { readPaid6KitchenCandidates } from "../../scripts/managed-cms-targets-paid6-kitchen-v1.mjs";
import { withCompanyBrandSuffix } from "../../scripts/lib/publisher-public-readback.mjs";
import { withChineseBrandMetadata } from "@/i18n/brandIdentity";
import { withPublishedLinkTargets } from "@/test/helpers/publishedLinkTargets";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown>;
const sourcePath = "drafts/publishing/fc-20261017-six-keyword-matching-original-resume-v1/frozen-paid6-kitchen-channel-source.json";
const bytes = readFileSync(sourcePath);
const source = JSON.parse(bytes.toString()) as { before: Row; desired: Row };
const savedTime = "2026-10-27T02:00:00.123456+00:00";
const permitId = "11111111-1111-4111-8111-111111111111";
const context = { role: "content_editor", authMode: "cron", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1,
} };

// Synthetic database only; the real publisher/CAS/permit is never contacted here.
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

describe.each(PAID6_KITCHEN_TARGETS.map(target => ({ target, entry: source })))(
  "Independent PAID6 Kitchen exact protected service $target.slug", ({ target, entry }) => {
    const config = targetConfigs[target.candidateVersion];
    const request = (mode: "dry-run" | "publish" = "dry-run"): ContentPublishRequest => ({
      ...buildLockedDryRunRequest(config.lockedCandidate, config.buildRecord(entry.before), "synthetic-local-contract"),
      mode, ownerApproved: true, explicitExecution: true, approvalId: "synthetic-local-only",
      ...(mode === "publish" ? { managedPermit: { ...managedAction(target, "publish"), operation: "publish", permitId } } : {}),
    });

    it("selects the exact task/action/scope among older registrations for the same row", () => {
      expect(findManagedTarget(MANAGED_SERVICES, target.id, target.slug, { ...managedAction(target, "publish"), operation: "publish" })).toBe(target);
      expect(findManagedTarget(MANAGED_SERVICES, target.id, target.slug)).toBe(
        MANAGED_SERVICES.filter(t => t.id === target.id && t.slug === target.slug).length === 1 ? target : undefined,
      );
      expect(config.fields).toEqual(target.baselineProjectionFields);
      expect(config.lockedCandidate).toMatchObject({ ...target, recordId: target.id });
      expect(target.changedFields).toEqual(["content_zh"]);
      expect(target.baselineProjectionFields).toHaveLength(41);
      expect(target.retainedProjectionFields).toHaveLength(38);
      expect(target.retainedProjectionFields!.filter(x => x.endsWith("_ms"))).toHaveLength(11);
      expect(managedAction(target, "rollback")).toMatchObject({ actionId: `rollback-${target.candidateVersion}`, candidateVersion: `${target.candidateVersion}-rollback-v1` });
    });
    it("routes the full41 Node CLI dry-run without a claim or write", async () => {
      const db = database(entry.before); const result = await publishContent(request(), db.client, context);
      expect(result.status || 200).toBe(200); expect(result.body.payload_preview).toEqual(entry.desired);
      expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it("writes only content_zh with exact microsecond server CAS and preserves stable38/MS11", async () => {
      const db = database(entry.before); const result = await publishContent(request("publish"), db.client, context);
      expect(result.status || 200).toBe(200); expect(result.body.saved_id).toBe(target.id);
      expect(db.writes).toEqual([entry.desired]); expect(db.predicates).toContainEqual(["id", target.id]);
      expect(db.predicates).toContainEqual(["updated_at", entry.before.updated_at]);
      for (const field of target.retainedProjectionFields!) expect(db.row()[field]).toEqual(entry.before[field]);
      expect(Object.keys(db.writes[0]).sort()).toEqual(["content_zh"]);
      expect(db.rpcs).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "finish_managed_cms_release_write"]);
      expect((await publishContent(request("publish"), db.client, context)).status).toBe(409);
      expect(db.writes).toHaveLength(1);
    });
    it.each(["content_ms", "title_en", "faqs_zh", "version"])("rejects actual row drift in %s before claiming", async field => {
      const db = database({ ...entry.before, [field]: "unapproved drift" });
      expect((await publishContent(request("publish"), db.client, context)).status).toBe(field === "version" ? 409 : 403);
      expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it("rejects request changes to a protected field before claiming", async () => {
      const db = database(entry.before); const req = request("publish"); req.record!.content_ms = "unapproved";
      expect((await publishContent(req, db.client, context)).status).toBe(403);
      expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it("rejects a wrong namespace and missing trusted workflow identity", async () => {
      const db = database(entry.before); const req = request("publish"); req.managedPermit!.taskId = "fc-20261025-shop-office-existing-six-and-five-implementation-release-v1";
      expect((await publishContent(req, db.client, context)).status).toBe(403);
      expect((await publishContent(request("publish"), db.client, { role: "content_editor", authMode: "cron" })).status).toBe(403);
      expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it("reports a racing CAS without retrying the write", async () => {
      const db = database(entry.before, true); expect((await publishContent(request("publish"), db.client, context)).status).toBe(409);
      expect(db.writes).toEqual([]); expect(db.rpcs.filter(x => x === "claim_managed_cms_release_permit")).toHaveLength(1);
    });
    it("previews only the exact inverse of its own published body, preserving the current row", async () => {
      const postSave = { ...entry.before, ...entry.desired, updated_at: savedTime };
      const db = database(postSave); const req = request();
      req.expectedUpdatedAt = savedTime; req.record = { ...postSave, content_zh: entry.before.content_zh };
      req.managedCandidate = { ...managedAction(target, "rollback"), operation: "rollback" };
      const result = await publishContent(req, db.client, context);
      expect(result.status || 200).toBe(200);
      expect(result.body.payload_preview).toEqual({ content_zh: entry.before.content_zh });
      expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it("admits workflow selection but rejects direct local execution", () => {
      expect(readFileSync(".github/workflows/content-publish-approved.yml", "utf8")).toContain(`- ${target.candidateVersion}`);
      const process = spawnSync(globalThis.process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${target.candidateVersion}`, "--execute", "--approval-id=synthetic-untrusted"], { encoding: "utf8" });
      expect(process.status).toBe(1); expect(process.stderr).toContain("approved main workflow and an exact single-use permit");
    });
    it("keeps the full unchanged metadata title strict for forward and conditional inverse", () => {
      expect(resolveLockedPublicPaths(config, entry.before, true).map(page => page.expected)).toEqual(config.publicPaths.map(page => page.expected));
      for (const page of resolveLockedPublicPaths(config, entry.before, true)) {
        const language = page.path.startsWith("/zh/") ? "zh" : page.path.startsWith("/ms/") ? "ms" : "en";
        const metadata = withChineseBrandMetadata({
          title: withCompanyBrandSuffix(entry.before[`seo_title_${language}`], { brandName: "FLASH CAST", companyName: "FLASH CAST SDN. BHD." }),
          description: String(entry.before[`seo_description_${language}`]),
        }, language, page.path);
        expect(page.expected).toBe(metadata.title);
        expect(page.strictMetadataTitle).toBe(true);
        expect(inspectPublicReadback(page, 200, `<title>${page.expected}</title>`).found).toBe(true);
        expect(inspectPublicReadback(page, 200, `<title>Wrong title</title><p>${page.expected}</p>`).found).toBe(false);
      }
    });
    it("requires its own completed parent permit/run and postSave CAS for inverse issuance", async () => {
      const input: ManagedPermitIssue = { ...managedAction(target, "rollback"), operation: "rollback", actionClass: "cms_write",
        permitId, recordId: target.id, slug: target.slug, expectedUpdatedAt: savedTime, payloadSha256: target.rollbackFieldsSha256!,
        parentPermitId: "22222222-2222-4222-8222-222222222222", parentRunId: 12345, githubActorId: 98765,
        githubWorkflowSha: "a".repeat(40), qaReceiptId: "synthetic-qa", operationsDecisionId: "synthetic-operations",
        policyDecisionId: "synthetic-policy", issuerEvidenceSha256: "b".repeat(64), expiresAt: new Date(Date.now() + 60_000).toISOString() };
      const parent = { status: "completed", operation: "publish", task_id: target.taskId, record_id: target.id, slug: target.slug,
        scope: target.scope, candidate_version: target.candidateVersion, github_run_id: 12345,
        rollback_payload_sha256: target.rollbackFieldsSha256, saved_updated_at: savedTime };
      const client = (row: Row) => ({ from() { const b = { select() { return b; }, eq() { return b; },
        maybeSingle: async () => ({ data: row, error: null }), insert: () => b, single: async () => ({ data: {}, error: null }) }; return b; } }) as unknown as ContentPublishClient;
      expect((await issueManagedPermit(client(parent), input)).status).toBe("issued");
      await expect(issueManagedPermit(client({ ...parent, github_run_id: 12346 }), input)).rejects.toThrow("completed candidate");
      await expect(issueManagedPermit(client({ ...parent, status: "issued" }), input)).rejects.toThrow("completed candidate");
      await expect(issueManagedPermit(client({ ...parent, task_id: "fc-20261016-industry-keyword-next-eight-pages-v1" }), input)).rejects.toThrow("completed candidate");
      await expect(issueManagedPermit(client({ ...parent, record_id: "11111111-1111-4111-8111-111111111111" }), input)).rejects.toThrow("completed candidate");
      await expect(issueManagedPermit(client(parent), { ...input, parentRunId: undefined })).rejects.toThrow("parent run ID");
    });
  },
);

it("rejects altered frozen bytes and retains one independent own target", () => {
  expect(Object.keys(readPaid6KitchenCandidates(bytes))).toEqual(PAID6_KITCHEN_TARGETS.map(t => t.candidateVersion));
  expect(() => readPaid6KitchenCandidates(Buffer.concat([bytes, Buffer.from(" ")]))).toThrow("source bytes differ");
});

it("preserves the original source, own inverse and held shoe boundary", () => {
  const carrier = JSON.parse(bytes.toString());
  expect(carrier.forward_tuple.action_id).toBe("paid6-kitchen-content-zh-native-save-v1");
  expect(carrier.conditional_inverse.parentRunId).toBeNull();
  expect(carrier.conditional_inverse.saved_updated_at).toBeNull();
  expect(carrier.baseline_only_not_execution_CAS).toBe(true);
  expect(Object.keys(readPaid6KitchenCandidates(bytes))).toEqual(["paid6-kitchen-content-zh-native-save-v1"]);
  expect(Object.keys(carrier.desired)).toEqual(["content_zh"]);
});
