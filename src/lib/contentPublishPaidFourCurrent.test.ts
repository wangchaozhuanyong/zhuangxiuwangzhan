import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import { PAID_FOUR_CURRENT_TARGETS } from "../../supabase/functions/_shared/paid-four-current-targets.ts";
import { MANAGED_TARGETS, findManagedTarget, managedAction } from "../../supabase/functions/_shared/managed-targets.ts";
import { readManagedPermitHistory } from "../../supabase/functions/content-publish/permit-issuer.ts";
import { targetConfigs, buildLockedDryRunRequest } from "../../scripts/publish-content-trust-fixes.mjs";
import { lockedPaidFourCurrentCandidates, readPaidFourCurrentCandidates, buildPaidFourPermitLookup } from "../../scripts/managed-cms-targets-paid-four-current-v1.mjs";
import { withPublishedLinkTargets } from "@/test/helpers/publishedLinkTargets";
import type { ContentPublishClient, ContentPublishRequest } from "../../supabase/functions/content-publish/types.ts";

type Row = Record<string, unknown>;
const bytes = readFileSync("drafts/paid-four-content-zh-channel-20261030-v1/frozen-four-row-candidates.json");
const source = JSON.parse(bytes.toString()) as { entries: Array<{ before: Row; desired: Row; cli_namespace: string }> };
const context = { role: "content_editor", authMode: "cron", managedIdentity: {
  repositoryId: 1248188229, actorId: 98765, workflowSha: "a".repeat(40),
  workflowRef: "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main",
  runId: 12345, runAttempt: 1,
} };
const savedTime = "2026-10-30T01:00:00.123456+00:00";

// Local synthetic transport only. No actual row, issuer secret or permit is used.
function database(initial: Row, options: { race?: boolean; uncertain?: boolean } = {}) {
  let row = { ...initial }, claimed = false;
  const writes: Row[] = [], predicates: Array<[string, unknown]> = [], rpcs: string[] = [];
  const client = {
    from(table: string) {
      if (table === "admin_audit_logs") return { insert: async () => ({ data: null, error: null }) };
      let patch: Row | null = null; const filters: Array<[string, unknown]> = [];
      const result = async () => {
        if (filters.some(([key, value]) => row[key] !== value) || patch && options.race) return { data: null, error: null };
        if (patch) { row = { ...row, ...patch, updated_at: savedTime }; writes.push(patch); }
        return { data: { ...row }, error: null };
      };
      const query = { select() { return query; }, eq(key: string, value: unknown) {
        filters.push([key, value]); if (patch) predicates.push([key, value]); return query;
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

function auditDatabase(rows: Row[] = [], error: { message: string } | null = null) {
  const filters: Row = {}, calls: string[] = [];
  const query = { select() { calls.push("select"); return query; }, eq(field: string, value: unknown) {
    filters[field] = value; return query;
  }, limit(count: number) { expect(count).toBe(26); return query; },
  then(resolve: (value: { data: Row[]; error: { message: string } | null }) => unknown) {
    return Promise.resolve({ data: rows, error }).then(resolve);
  } };
  const client = { from(table: string) { expect(table).toBe("managed_cms_release_permits"); return query; } } as unknown as ContentPublishClient;
  return { client, filters, calls };
}

describe("original Google four-row protected current channel", () => {
  it("loads four unique real tuples without granting an inverse or changing other target objects", () => {
    expect(PAID_FOUR_CURRENT_TARGETS).toHaveLength(4);
    expect(new Set(PAID_FOUR_CURRENT_TARGETS.map(t => t.actionId)).size).toBe(4);
    const prior = MANAGED_TARGETS.filter(t => !PAID_FOUR_CURRENT_TARGETS.includes(t) && t.contentType !== "translation_patch");
    expect(prior).toHaveLength(87);
    expect(() => readPaidFourCurrentCandidates(Buffer.concat([bytes, Buffer.from("\n")]))).toThrow("source bytes differ");
    expect(() => buildPaidFourPermitLookup("english-kitchen-en2-exact-v1")).toThrow("namespace");
  });

  for (const target of PAID_FOUR_CURRENT_TARGETS) {
    const name = target.candidateVersion, entry = source.entries.find(e => e.cli_namespace === name)!;
    const config = targetConfigs[name];
    const request = (mode: "dry-run" | "publish" = "dry-run"): ContentPublishRequest => ({
      ...buildLockedDryRunRequest(config.lockedCandidate, config.buildRecord(entry.before), "synthetic-local-only"),
      mode, ownerApproved: true, explicitExecution: true, approvalId: "synthetic-local-only",
      ...(mode === "publish" ? { managedPermit: { ...managedAction(target, "publish"), operation: "publish", permitId: "11111111-1111-4111-8111-111111111111" } } : {}),
    });
    describe(target.slug, () => {
      it("binds source/CLI/runtime, full41, stable37/MS11 and raw CAS exactly", () => {
        const locked = lockedPaidFourCurrentCandidates[name];
        expect(findManagedTarget(MANAGED_TARGETS, target.id, target.slug, { ...locked, operation: "publish" })).toEqual(target);
        for (const [key, value] of Object.entries(target)) expect(locked[key]).toEqual(value);
        expect(target.changedFields).toEqual(["content_zh"]);
        expect(target.baselineProjectionFields).toHaveLength(41);
        expect(target.retainedProjectionFields).toHaveLength(37);
        expect(target.retainedProjectionFields?.filter(f => f.endsWith("_ms"))).toHaveLength(11);
        expect(target.expectedUpdatedAt).toBe(entry.before.updated_at);
        expect(target.rollbackAllowed).toBe(false);
        expect(buildPaidFourPermitLookup(name)).toEqual({ controlAction: "lookup", taskId: target.taskId,
          actionId: target.actionId, candidateVersion: name, recordId: target.id, slug: target.slug, scope: target.scope });
      });
      it("uses the existing publisher for a zero-write single-field dry run", async () => {
        const db = database(entry.before), result = await publishContent(request(), db.client, context);
        expect(result.status ?? 200).toBe(200); expect(result.body.payload_preview).toEqual(entry.desired);
        expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
      });
      it("writes only content_zh once with exact CAS in the synthetic admitted transport", async () => {
        const db = database(entry.before), result = await publishContent(request("publish"), db.client, context);
        expect(result.status ?? 200).toBe(200); expect(db.writes).toEqual([entry.desired]);
        expect(db.predicates).toContainEqual(["id", target.id]); expect(db.predicates).toContainEqual(["updated_at", entry.before.updated_at]);
        for (const field of Object.keys(entry.before).filter(f => !["content_zh", "updated_at"].includes(f))) expect(db.row()[field]).toEqual(entry.before[field]);
        expect((await publishContent(request("publish"), db.client, context)).status).toBe(409);
        expect(db.writes).toHaveLength(1);
      });
      it.each(["content_ms", "title_en", "version", "updated_at"])("rejects current baseline drift in %s", async field => {
        const db = database({ ...entry.before, [field]: "unapproved drift" });
        expect((await publishContent(request("publish"), db.client, context)).status).not.toBe(200);
        expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
      });
      it.each(["content_ms", "title_en", "faqs_zh", "unknown_field"])("rejects a payload edit to %s", async field => {
        const db = database(entry.before), req = request("publish"); req.record![field] = field === "faqs_zh" ? [{ q: "非目标问题", a: "非目标答案" }] : "unapproved";
        expect((await publishContent(req, db.client, context)).status).toBe(403);
        expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
      });
      it("rejects another task, missing workflow identity and inverse", async () => {
        const db = database(entry.before), wrong = request("publish"); wrong.managedPermit!.taskId = "another-task";
        expect((await publishContent(wrong, db.client, context)).status).toBe(403);
        expect((await publishContent(request("publish"), db.client, { role: "content_editor", authMode: "cron" })).status).toBe(403);
        const inverse = request("publish"); inverse.managedPermit = { ...managedAction(target, "rollback"), operation: "rollback", permitId: inverse.managedPermit!.permitId };
        expect((await publishContent(inverse, db.client, context)).status).toBe(403);
        expect(db.writes).toEqual([]); expect(db.rpcs).toEqual([]);
      });
      it("does not retry a racing CAS or an uncertain completion", async () => {
        const race = database(entry.before, { race: true }); expect((await publishContent(request("publish"), race.client, context)).status).toBe(409);
        expect(race.writes).toEqual([]); expect(race.rpcs.filter(n => n === "claim_managed_cms_release_permit")).toHaveLength(1);
        const uncertain = database(entry.before, { uncertain: true }); expect((await publishContent(request("publish"), uncertain.client, context)).status).toBe(409);
        expect(uncertain.writes).toHaveLength(1);
      });
      it("looks up only its exact original-task object without guessing a permitId or claiming historical zero", async () => {
        const db = auditDatabase(), result = await readManagedPermitHistory(db.client, buildPaidFourPermitLookup(name));
        expect(db.filters).toEqual({ task_id: target.taskId, record_id: target.id, slug: target.slug });
        expect(result).toMatchObject({ performed_write: false, auditStatus: "NO_ORIGINAL_TASK_OBJECT_RECORDS", historicalOrOtherNamespaceEffects: "UNKNOWN", permits: [] });
        expect(db.calls).toEqual(["select"]);
      });
      it.each(["taskId", "actionId", "candidateVersion", "scope", "recordId", "slug"])("rejects wrong lookup %s before database access", async field => {
        const db = auditDatabase(); await expect(readManagedPermitHistory(db.client, { ...buildPaidFourPermitLookup(name), [field]: "wrong" })).rejects.toThrow("lookup tuple");
        expect(db.calls).toEqual([]);
      });
      it("reports actual returned permit/run/attempt/CAS, refuses mixed identities and flags incomplete history", async () => {
        const row = { permit_id: "11111111-1111-4111-8111-111111111111", task_id: target.taskId, action_id: target.actionId,
          candidate_version: name, scope: target.scope, record_id: target.id, slug: target.slug, status: "completed", operation: "publish",
          github_run_id: 12345, github_run_attempt: 1, saved_id: target.id, saved_updated_at: savedTime };
        const full = await readManagedPermitHistory(auditDatabase([row]).client, buildPaidFourPermitLookup(name));
        expect(full.permits[0]).toMatchObject({ permitId: row.permit_id, githubRunId: 12345, githubRunAttempt: 1, savedUpdatedAt: savedTime });
        const old = await readManagedPermitHistory(auditDatabase([{ ...row, action_id: "actual-older-action", candidate_version: "actual-older-version", scope: "actual-older-scope" }]).client, buildPaidFourPermitLookup(name));
        expect(old.permits[0]).toMatchObject({ actionId: "actual-older-action", candidateVersion: "actual-older-version", scope: "actual-older-scope", matchesRequestedNamespace: false });
        await expect(readManagedPermitHistory(auditDatabase([{ ...row, record_id: "another" }]).client, buildPaidFourPermitLookup(name))).rejects.toThrow("unexpected identity");
        const many = await readManagedPermitHistory(auditDatabase(Array.from({ length: 26 }, () => row)).client, buildPaidFourPermitLookup(name));
        expect(many.auditStatus).toBe("INCOMPLETE_TOO_MANY_MATCHES"); expect(many.completeForOriginalTaskObject).toBe(false);
        await expect(readManagedPermitHistory(auditDatabase([], { message: "synthetic read failure" }).client, buildPaidFourPermitLookup(name))).rejects.toThrow("effects remain unknown");
      });
      it("retains the main-workflow and single-use gate before credentials; local direct publish is refused", () => {
        const workflow = readFileSync(".github/workflows/content-publish-approved.yml", "utf8");
        expect(workflow).toContain(`- ${name}`);
        const script = workflow.split("        run: |\n")[1].split("\n      - name:")[0].split("\n").map(l => l.replace(/^ {10}/, "")).join("\n");
        const gate = (mode: string, operation = "publish", permit = "") => spawnSync("bash", ["-c", script], { encoding: "utf8", env: {
          PATH: process.env.PATH, GITHUB_REF: "refs/heads/main", PUBLISH_TARGET: name, PUBLISH_MODE: mode, MANAGED_OPERATION: operation, MANAGED_PERMIT_ID: permit, PARENT_RUN_ID: "" } });
        expect(gate("dry-run").status).toBe(0); expect(gate("publish").status).not.toBe(0); expect(gate("dry-run", "rollback").status).not.toBe(0);
        const direct = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${name}`, "--execute", "--approval-id=synthetic-untrusted"], { encoding: "utf8" });
        expect(direct.status).toBe(1); expect(direct.stderr).toContain("approved main workflow and an exact single-use permit");
      });
    });
  }
  it("keeps namespace lookup behind existing issuer authentication, outside the admin save branch", () => {
    const index = readFileSync("supabase/functions/content-publish/index.ts", "utf8");
    expect(index.indexOf("await verifyManagedIssuerSecret")).toBeLessThan(index.indexOf("await readManagedPermitHistory"));
    expect(index.indexOf("await readManagedPermitHistory")).toBeLessThan(index.indexOf("await requireAdminAccess"));
    expect(index).toContain('control.controlAction === "issue" && Deno.env.get("MANAGED_CMS_RELEASE_ENABLED")');
  });
});
