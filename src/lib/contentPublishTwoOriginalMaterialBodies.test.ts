import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { TWO_ORIGINAL_MATERIAL_BODY_TARGETS, MANAGED_TARGETS, findManagedTarget, managedAction, isProtectedContentRecord } from "../../supabase/functions/_shared/managed-targets.ts";
import { targetConfigs, buildLockedDryRunRequest, assertLockedServiceCandidate } from "../../scripts/publish-content-trust-fixes.mjs";
import { readTwoOriginalMaterialBodyCandidates } from "../../scripts/managed-cms-targets-two-original-material-bodies-v1.mjs";
import { withPublishedLinkTargets } from "@/test/helpers/publishedLinkTargets";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown>;
const bytes = readFileSync("drafts/publishing/fc-20261014-two-original-materials-exact-body-publication-v1/frozen-current-two-material-body-candidates.json");
const source = JSON.parse(bytes.toString()) as { entries: Array<{ before: Row; desired: Row; cli_namespace: string }> };
const savedTime = "2026-10-27T05:10:00.987654+00:00";
const context = { role: "content_editor", authMode: "cron", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1,
} };

// Synthetic transport: the actual service/validator/repository/RPC adapter is used;
// no live database, source row, platform permit, or gallery is contacted.
function database(initial: Row, options: { race?: boolean; uncertain?: boolean; corruptSaved?: boolean; sameCAS?: boolean; versionIncrement?: boolean } = {}) {
  let row = { ...initial }, claimed = false;
  const rpcs: Array<{ name: string; args: Row }> = [], writes: Row[] = [], directUpdates: Row[] = [];
  const client = {
    from(table: string) {
      if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
      const filters: Array<[string, unknown]> = [];
      const query = { select() { return query; }, eq(k: string, v: unknown) { filters.push([k, v]); return query; },
        async maybeSingle() { return { data: filters.every(([k, v]) => k === "id"
          ? String(row[k]).toLowerCase() === String(v).toLowerCase() : row[k] === v) ? { ...row } : null, error: null }; },
        update(payload: Row) { directUpdates.push(payload); throw new Error("No direct material/table update is allowed"); },
      };
      return query;
    },
    async rpc(name: string, args: Row) {
      rpcs.push({ name, args });
      if (name === "claim_managed_cms_release_permit") { if (claimed) return { data: [], error: null }; claimed = true; }
      if (name === "publish_material_atomic") {
        if (options.race) return { data: null, error: { code: "40001", message: "synthetic concurrent CAS" } };
        writes.push(args.p_payload as Row);
        row = { ...row, ...args.p_payload as Row, updated_at: options.sameCAS ? row.updated_at : savedTime,
          version: Number(row.version) + (options.versionIncrement ? 1 : 0) };
        if (options.corruptSaved) row.content_ms = "synthetic unrelated corruption";
        return { data: { saved: row, gallery_count: 0, gallery_archived_count: 0, public_revision: "2026-10-27T05:10:01.000001+00:00" }, error: null };
      }
      if (name === "finish_managed_cms_release_write" && options.uncertain) return { data: [], error: null };
      return { data: [{}], error: null };
    },
  };
  return { client: withPublishedLinkTargets(client as unknown as ContentPublishClient), rpcs, writes, directUpdates, row: () => row };
}

describe.each(TWO_ORIGINAL_MATERIAL_BODY_TARGETS.map((target, index) => ({ target, entry: source.entries[index] })))(
  "two original materials full59 $target.slug", ({ target, entry }) => {
    const config = targetConfigs[entry.cli_namespace];
    function request(mode: "dry-run" | "publish" = "dry-run"): ContentPublishRequest {
      return { ...buildLockedDryRunRequest(config.lockedCandidate, config.buildRecord(entry.before), "synthetic-local-contract"),
        mode, ownerApproved: true, explicitExecution: true, approvalId: "synthetic-local-only",
        ...(mode === "publish" ? { managedPermit: { ...managedAction(target, "publish"), operation: "publish", permitId: "11111111-1111-4111-8111-111111111111" } } : {}),
      };
    }
    it("retains the original task/action/version/scope and separate CLI key, full59/protected55/MS13, with no inverse", () => {
      expect(target.taskId).toBe("fc-20261014-two-original-materials-exact-body-publication-v1");
      expect(target.actionId).toBe(`save-${target.slug}-bilingual-body-v1`);
      expect(target.candidateVersion).toBe(`publishing-${target.slug}-exact-bilingual-body-v1-20261014`);
      expect(target.scope).toBe(`flashcast.com.my:materials/${target.id}:content_en,content_zh`);
      expect(entry.cli_namespace).not.toBe(target.candidateVersion);
      expect(target.rollbackAllowed).toBe(false); expect(target.changedFields).toEqual(["content_en", "content_zh"]);
      expect(target.baselineProjectionFields).toHaveLength(59); expect(config.fields).toHaveLength(59);
      expect(target.retainedProjectionFields).toHaveLength(55); expect(target.retainedProjectionFields!.filter(f => f.endsWith("_ms"))).toHaveLength(13);
      expect(config.lockedCandidate).toMatchObject({ ...target, recordId: target.id });
      expect(findManagedTarget(MANAGED_TARGETS, target.id, target.slug, { ...managedAction(target, "publish"), operation: "publish" })).toBe(target);
      expect(isProtectedContentRecord("materials", entry.before)).toBe(true);
      expect(() => assertLockedServiceCandidate(config.lockedCandidate, entry.before)).not.toThrow();
    });
    it("passes the real ordinary full-row validation without requiring a gallery replacement or claiming a permit", async () => {
      const db = database(entry.before); const result = await publishContent(request(), db.client, context);
      expect(result.status || 200).toBe(200); expect(result.body.payload_preview).toEqual(entry.desired);
      expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]); expect(db.directUpdates).toEqual([]);
    });
    it.each([false, true])("passes only the exact original bodies to the existing atomic RPC and reads the server-owned version (increment=%s)", async versionIncrement => {
      const db = database(entry.before, { versionIncrement }); const result = await publishContent(request("publish"), db.client, context);
      expect(result.status || 200).toBe(200); expect(result.body.saved_id).toBe(target.id); expect(result.body.saved_updated_at).toBe(savedTime);
      expect(result.body.saved_version).toBe(Number(entry.before.version) + (versionIncrement ? 1 : 0));
      expect(db.writes).toEqual([entry.desired]); expect(db.directUpdates).toEqual([]);
      const atomic = db.rpcs.find(r => r.name === "publish_material_atomic")!;
      expect(atomic.args).toEqual({ p_material_id: target.id, p_expected_updated_at: entry.before.updated_at,
        p_payload: entry.desired, p_images: null, p_admin_user_id: null, p_action: "publish" });
      expect(db.rpcs.map(r => r.name)).toEqual(["claim_managed_cms_release_permit", "begin_managed_cms_release_write", "publish_material_atomic", "finish_managed_cms_release_write"]);
      expect(db.rpcs[0].args).toMatchObject({ p_github_run_id: 12345, p_github_run_attempt: 1 });
      for (const field of target.retainedProjectionFields!) expect(db.row()[field]).toEqual(entry.before[field]);
      expect((await publishContent(request("publish"), db.client, context)).status).toBe(409); expect(db.writes).toHaveLength(1);
    });
    it.each(["content_ms", "price_min", "price_note_ms", "title_en", "version", "new_column"])("rejects any current full59 baseline drift in %s before claiming", async field => {
      const db = database({ ...entry.before, [field]: "unapproved drift" });
      expect((await publishContent(request("publish"), db.client, context)).status).toBe(409);
      expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it.each(["content_ms", "price_min", "title_zh", "gallery", "version", "unknown_field"])("rejects request changes to %s before claiming", async field => {
      const db = database(entry.before); const req = request("publish"); req.record![field] = "unapproved";
      expect((await publishContent(req, db.client, context)).status).toBe(403); expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it("rejects another task, direct legacy payload, and uppercase ID without a matching original tuple", async () => {
      const db = database(entry.before); const req = request("publish"); req.managedPermit!.taskId = "another-task";
      expect((await publishContent(req, db.client, context)).status).toBe(403);
      delete req.managedPermit; expect((await publishContent(req, db.client, context)).status).toBe(403);
      req.record!.id = target.id.toUpperCase(); delete req.record!.slug;
      expect((await publishContent(req, db.client, context)).status).toBe(403); expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it("blocks a protected row resolved from a title-derived slug by the legacy material path", async () => {
      const db = database(entry.before); const record = { ...entry.before };
      delete record.id; delete record.slug;
      for (const field of Object.keys(record)) if (field.startsWith("price_")) delete record[field];
      record.title_en = target.slug.replaceAll("-", " ");
      const result = await publishContent({ contentType: "material", mode: "publish", nextStatus: "published", record,
        expectedUpdatedAt: String(entry.before.updated_at), ownerApproved: true, explicitExecution: true, approvalId: "synthetic-local-only" }, db.client, context);
      expect(result.status).toBe(403); expect(result.body.error).toContain("exact protected bilingual body tuple");
      expect(db.writes).toEqual([]); expect(db.directUpdates).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it("rejects missing/wrong workflow identity and inverse operations before any claim", async () => {
      const db = database(entry.before);
      expect((await publishContent(request("publish"), db.client, { role: "content_editor", authMode: "cron" })).status).toBe(403);
      expect((await publishContent(request("publish"), db.client, { ...context, managedIdentity: { ...context.managedIdentity, repositoryId: 999 } })).status).toBe(403);
      const req = request("publish"); req.managedPermit = { ...managedAction(target, "rollback"), operation: "rollback", permitId: req.managedPermit!.permitId };
      expect((await publishContent(req, db.client, context)).status).toBe(403); expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
    });
    it.each([{ race: true }, { uncertain: true }, { corruptSaved: true }, { sameCAS: true }])("preserves uncertain results and never retries the atomic write: %j", async options => {
      const db = database(entry.before, options); const result = await publishContent(request("publish"), db.client, context);
      expect(result.status).toBe(options.race ? 409 : 500); expect(result.body.uncertain).toBe(true);
      expect(db.rpcs.filter(r => r.name === "claim_managed_cms_release_permit")).toHaveLength(1);
      expect(db.rpcs.filter(r => r.name === "publish_material_atomic")).toHaveLength(1);
      expect(db.writes).toHaveLength(options.race ? 0 : 1);
    });
    it("rejects modified frozen bytes and direct local execution with the real CLI gate", () => {
      expect(() => readTwoOriginalMaterialBodyCandidates(Buffer.concat([bytes, Buffer.from("\n")]))).toThrow("source bytes differ");
      const result = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${entry.cli_namespace}`, "--execute", "--approval-id=synthetic-untrusted"], { encoding: "utf8" });
      expect(result.status).toBe(1); expect(result.stderr).toContain("approved main workflow and an exact single-use permit");
    });
  },
);
