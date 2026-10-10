import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { issueManagedPermit } from "../../supabase/functions/content-publish/permit-issuer.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";
import { targetConfigs, stableDigest } from "../../scripts/publish-content-trust-fixes.mjs";
import { APPROVAL_ID, BATCH_NAME, readFrozenRegistry, assertBatchEnvironment, assertBatchIdentity, assertQaForCurrent,
  assertActualPreview, buildBatchPermit, assertActualPublish, runFrozenBatch, assertLiveVersionReceipt,
  sanitizePublisherDiagnostic } from "../../scripts/publish-remaining-completion-20261009.mjs";

type Row = Record<string, unknown>;
const registry = readFrozenRegistry();
const combined = registry.entries.filter((entry) => entry.target.includes("-unified-"));
const before = (entry): Row => JSON.parse(readFileSync(targetConfigs[entry.target].lockedCandidate.rollbackRecordPath, "utf8"));
const workflowRef = "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main";
const environment = { PUBLISH_TARGET: BATCH_NAME, MANAGED_OPERATION: "publish", GITHUB_ACTIONS: "true", GITHUB_REF: "refs/heads/main",
  GITHUB_REPOSITORY: "wangchaozhuanyong/zhuangxiuwangzhan", GITHUB_REPOSITORY_ID: "1248188229", GITHUB_WORKFLOW_REF: workflowRef,
  GITHUB_EVENT_NAME: "workflow_dispatch", GITHUB_SHA: "a".repeat(40), GITHUB_ACTOR_ID: "98765", GITHUB_RUN_ID: "12345",
  GITHUB_RUN_ATTEMPT: "1", ACTIONS_ID_TOKEN_REQUEST_URL: "https://example.test", ACTIONS_ID_TOKEN_REQUEST_TOKEN: "test-only" };
const identity = { repositoryId: 1248188229, workflowRef, workflowSha: environment.GITHUB_SHA, actorId: 98765, runId: 12345, runAttempt: 1 };
const previewFor = (entry) => ({ backup: { record: before(entry) }, desired: { record: targetConfigs[entry.target].buildRecord(before(entry)) },
  preview: { ok: true, dry_run: true, content_type: entry.contentType, existing_id: entry.recordId, slug: entry.slug,
    payload_preview: targetConfigs[entry.target].lockedCandidate.desiredFields },
  receipt: { task_id: entry.taskId, candidate_version: entry.candidateVersion, action_id: entry.actionId, scope: entry.scope,
    operation: "publish", http_status: 200, dry_run: true, performed_write: false, external_writes: 0,
    row_unchanged_after_dry_run: true, expected_updated_at: entry.expectedUpdatedAt },
  payload: { payload_sha256: entry.desiredFieldsSha256, expected_updated_at: entry.expectedUpdatedAt },
  prior: { payload_sha256: entry.rollbackFieldsSha256, baseline_fields_sha256: entry.baselineFieldsSha256 },
  identity: { ok: true, dry_run: true, performed_write: false, identity } });
const savedTime = "2026-10-09T08:45:00.123456+00:00";
const publishedFor = (entry) => ({ ok: true, target: entry.target, approvalId: APPROVAL_ID,
  published: { ok: true, saved_id: entry.recordId, saved_updated_at: savedTime },
  postcheck: { ok: true, rowMismatches: [], pageChecks: targetConfigs[entry.target].publicPaths.map((page) => ({ path: page.path,
    status: 200, found: true, forbiddenFound: [], missingRequired: [] })) } });

describe("the single frozen 20-row owner-directed completion batch", () => {
  it("uses 22 exact actual scoped QA files, 20 distinct rows and no invented controller approval", () => {
    expect(registry.entries).toHaveLength(20); expect(registry.sourceQaReceipts).toHaveLength(22);
    expect(new Set(registry.entries.map((entry) => `${entry.table}:${entry.recordId}`)).size).toBe(20);
    expect(registry.authorization.id).toBe(APPROVAL_ID);
    expect(registry.authorization.quote).toContain("所有授权都给你无需请示我");
    expect(registry.executionDecision.departmentControllerReviewClaimed).toBe(false);
    expect(registry.allowedOperation).toBe("publish");
    expect(registry.entries.map((entry) => entry.target)).not.toContain("v20-owner-publisher-native-preparation-v2-20261007");
    expect(registry.entries.map((entry) => entry.target)).not.toContain("design-framework-cms-content-v4");
    expect(registry.entries.map((entry) => entry.target)).not.toContain("bathroom-initial-framework-body-v1");
    const source = readFileSync("drafts/publishing/fc-20261009-remaining-completion-v1/registry.json");
    expect(() => readFrozenRegistry(Buffer.from(source.toString().replace('"uniqueRows": 20', '"uniqueRows": 19')))).toThrow(/hash differs/);
  });

  it("requires this exact authorized current main dispatch before credentials or artifacts", () => {
    expect(() => assertBatchEnvironment(environment, "dry-run", APPROVAL_ID, environment.GITHUB_SHA)).not.toThrow();
    for (const drift of [{ GITHUB_REF: "refs/heads/other" }, { PUBLISH_TARGET: "arbitrary-target" }, { MANAGED_OPERATION: "rollback" },
      { GITHUB_WORKFLOW_REF: "another-workflow" }, { GITHUB_REPOSITORY_ID: "999" }, { GITHUB_EVENT_NAME: "push" },
      { GITHUB_ACTOR_ID: "0" }, { MANAGED_PERMIT_ID: "11111111-1111-4111-8111-111111111111" }, { PARENT_RUN_ID: "123" }]) {
      expect(() => assertBatchEnvironment({ ...environment, ...drift }, "publish", APPROVAL_ID, environment.GITHUB_SHA)).toThrow();
    }
    expect(() => assertBatchEnvironment(environment, "publish", "old-or-forged-owner-reference", environment.GITHUB_SHA)).toThrow();
    expect(() => assertBatchEnvironment(environment, "publish", APPROVAL_ID, "b".repeat(40))).toThrow();
    expect(() => assertBatchEnvironment(environment, "other", APPROVAL_ID, environment.GITHUB_SHA)).toThrow();
    const artifactDir = `audits/content-publish-rejected-batch-${process.pid}`;
    const denied = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/publish-remaining-completion-20261009.mjs",
      "--mode=dry-run", `--artifact-dir=${artifactDir}`], { encoding: "utf8", env: { PATH: process.env.PATH } });
    expect(denied.status).not.toBe(0); expect(denied.stderr).toContain("exact owner authorization and current main dispatch identity");
    expect(existsSync(artifactDir)).toBe(false); expect(denied.stderr).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it.each(combined)("$target requires actual QA field hashes, full live CAS and zero-write preview", (entry) => {
    const row = before(entry); const preview = previewFor(entry);
    expect(() => assertQaForCurrent(entry, row)).not.toThrow();
    expect(() => assertActualPreview(entry, preview, row, environment)).not.toThrow();
    for (const artifact of [
      { ...preview, preview: { ...preview.preview, payload_preview: { ...preview.preview.payload_preview, title_en: "extra" } } },
      { ...preview, receipt: { ...preview.receipt, performed_write: true } },
      { ...preview, receipt: { ...preview.receipt, row_unchanged_after_dry_run: false } },
      { ...preview, payload: { ...preview.payload, payload_sha256: "b".repeat(64) } },
      { ...preview, prior: { ...preview.prior, payload_sha256: "b".repeat(64) } },
      { ...preview, identity: { ...preview.identity, identity: { ...identity, workflowSha: "b".repeat(40) } } },
    ]) expect(() => assertActualPreview(entry, artifact, row, environment)).toThrow();
    expect(() => assertQaForCurrent(entry, { ...row, updated_at: savedTime })).toThrow(/drift/);
    expect(() => assertQaForCurrent(entry, { ...row, title_en: "Newer title" })).toThrow(/drift/);
    expect(() => assertQaForCurrent({ ...entry, qaProofs: [{ ...entry.qaProofs[0], reviewedPayloadSha256: "b".repeat(64) }, entry.qaProofs[1]] }, row)).toThrow(/QA/);
  });

  it("matches all six actual verified OIDC identity fields, including this current SHA and actor", () => {
    expect(() => assertBatchIdentity(identity, environment)).not.toThrow();
    for (const altered of [{ ...identity, repositoryId: 1 }, { ...identity, workflowRef: "other" }, { ...identity, workflowSha: "b".repeat(40) },
      { ...identity, actorId: 1 }, { ...identity, runId: 1 }, { ...identity, runAttempt: 2 }]) expect(() => assertBatchIdentity(altered, environment)).toThrow(/OIDC/);
  });

  it("requires the actual online deployment to match this main SHA before preview or permits", () => {
    const receipt = { httpStatus: 200, deploymentVersion: environment.GITHUB_SHA, expectedSha: environment.GITHUB_SHA };
    expect(() => assertLiveVersionReceipt(receipt, environment.GITHUB_SHA)).not.toThrow();
    for (const drift of [{ httpStatus: 503 }, { deploymentVersion: "b".repeat(40) }, { deploymentVersion: null }, { expectedSha: "b".repeat(40) }]) {
      expect(() => assertLiveVersionReceipt({ ...receipt, ...drift }, environment.GITHUB_SHA)).toThrow(/deployed website version/);
    }
  });

  it("keeps a bounded plain-text stage diagnosis while removing credentials and provider bodies", () => {
    const secret = "secret-test-value-for-redaction";
    const jwt = `${"a".repeat(20)}.${"b".repeat(20)}.${"c".repeat(20)}`;
    const diagnostic = sanitizePublisherDiagnostic(`Locked CMS field drift for reviewed target.\nAuthorization: Bearer ${jwt}\n${secret}\n{"provider":"raw response"}\n<html>raw response</html>\n    at unsafe stack\nHTTP 401 from https://example.test?token=${secret}`, [secret]);
    expect(diagnostic).toContain("Locked CMS field drift"); expect(diagnostic).not.toContain(secret);
    expect(diagnostic).not.toContain(jwt); expect(diagnostic).not.toContain("raw response");
    expect(diagnostic).not.toContain("example.test"); expect(diagnostic.length).toBeLessThanOrEqual(960);
  });

  it.each(combined)("$target goes through the unchanged issuer export with a 10-minute exact permit", async (entry) => {
    const now = Date.parse("2026-10-09T08:00:00Z"); const artifacts = previewFor(entry);
    const { input, evidence } = buildBatchPermit(entry, registry, identity, artifacts, now, "11111111-1111-4111-8111-111111111111");
    expect(Date.parse(input.expiresAt) - now).toBe(600_000);
    expect(input).toMatchObject({ githubWorkflowSha: environment.GITHUB_SHA, githubActorId: 98765, operation: "publish",
      expectedUpdatedAt: entry.expectedUpdatedAt, payloadSha256: entry.desiredFieldsSha256, rollbackPayloadSha256: entry.rollbackFieldsSha256 });
    expect(input.issuerEvidenceSha256).toBe(stableDigest(evidence)); expect(evidence.actualQa).toHaveLength(2);
    const inserted: Row[] = []; const builder = { insert(row: Row) { inserted.push(row); return builder; }, select() { return builder; }, single: async () => ({ data: inserted[0], error: null }) };
    await expect(issueManagedPermit({ from: () => builder } as unknown as ContentPublishClient, input, now)).resolves.toMatchObject({ status: "issued" });
    expect(inserted[0]).toMatchObject({ github_workflow_sha: environment.GITHUB_SHA, github_actor_id: 98765, github_run_id: null,
      qa_receipt_id: entry.qaReceiptId, issuer_evidence_sha256: stableDigest(evidence), status: "issued" });
  });

  it("dry-run does not request an issuer identity, load a service client, issue or publish", async () => {
    const events: string[] = []; const rows = new Map(combined.map((entry) => [entry.target, before(entry)]));
    const result = await runFrozenBatch({ ...registry, entries: combined }, "dry-run", environment, {
      preview: async (entry) => { events.push(`preview:${entry.target}`); }, readPreview: previewFor, readCurrent: async (entry) => rows.get(entry.target),
      saveSummary: () => {}, verifyIdentity: () => { throw new Error("must not verify issuer identity"); },
      issue: () => { throw new Error("must not issue"); }, publish: () => { throw new Error("must not publish"); },
    });
    expect(result.rows.every((row) => row.status === "PREVIEW_PASS" && row.performedWrite === false)).toBe(true);
    expect(events).toEqual(combined.map((entry) => `preview:${entry.target}`));
  });

  it("executes sequential preview→verified identity→one permit→publish→completed readback and stops on failure", async () => {
    const events: string[] = []; const rows = new Map(combined.map((entry) => [entry.target, before(entry)]));
    let issued: Row; let active; let summary;
    const dependencies = {
      now: () => Date.parse("2026-10-09T08:00:00Z"),
      preview: async (entry) => { active = entry; events.push(`preview:${entry.slug}`); }, readPreview: previewFor,
      readCurrent: async (entry) => rows.get(entry.target), verifyIdentity: async () => { events.push("identity"); return identity; },
      issue: async (input) => { issued = input; events.push(`issue:${active.slug}`); return { permitId: input.permitId, status: "issued", operation: "publish" }; },
      publish: async (entry) => { events.push(`publish:${entry.slug}`); rows.set(entry.target, { ...before(entry), ...targetConfigs[entry.target].lockedCandidate.desiredFields, updated_at: savedTime, version: 2 }); },
      readPublished: publishedFor, readPermit: async () => ({ permitId: issued.permitId, status: "completed", operation: "publish",
        taskId: active.taskId, actionId: active.actionId, candidateVersion: active.candidateVersion,
        githubRunId: identity.runId, githubRunAttempt: identity.runAttempt, savedId: active.recordId, savedUpdatedAt: savedTime }),
      savePermit: () => {}, saveSummary: (value) => { summary = structuredClone(value); },
    };
    const result = await runFrozenBatch({ ...registry, entries: combined }, "publish", environment, dependencies);
    expect(result.rows.every((row) => row.status === "PUBLISH_PASS")).toBe(true);
    expect(events).toEqual(["preview:design", "identity", "issue:design", "publish:design", "preview:bathroom", "identity", "issue:bathroom", "publish:bathroom"]);
    const permits = result.rows.map((row) => row.permitId); expect(new Set(permits).size).toBe(2);
    events.length = 0; rows.set(combined[0].target, before(combined[0])); rows.set(combined[1].target, before(combined[1]));
    await expect(runFrozenBatch({ ...registry, entries: combined }, "publish", environment, { ...dependencies,
      publish: async () => { events.push("failed-publish"); throw new Error("uncertain Save"); },
    })).rejects.toThrow(/uncertain/);
    expect(events).toEqual(["preview:design", "identity", "issue:design", "failed-publish"]);
    expect(summary.rows[0]).toMatchObject({ status: "FAILED_STOPPED", failedAt: "PERMIT_ISSUED",
      writeOutcome: "INSPECT_ACTUAL_SINGLE_USE_PERMIT_AND_RECEIPT_DO_NOT_REPLAY" });
    expect(summary.rows[1].status).toBe("NOT_STARTED");
    expect(summary.rows[0].performedWrite).toBeNull();
    events.length = 0;
    await expect(runFrozenBatch({ ...registry, entries: combined }, "publish", environment, { ...dependencies,
      issue: async () => { events.push("uncertain-permit-insert"); throw new Error("issuer response failed"); },
    })).rejects.toThrow(/issuer response/);
    expect(events).toEqual(["preview:design", "identity", "uncertain-permit-insert"]);
    expect(summary.rows[0]).toMatchObject({ status: "FAILED_STOPPED", failedAt: "PERMIT_ISSUE_STARTED", performedWrite: false,
      writeOutcome: "NO_CMS_WRITE_REQUESTED_INSPECT_PERMIT_INSERT_RESULT" });
    expect(summary.rows[0].permitId).toMatch(/^[a-f0-9-]{36}$/);
    expect(summary.rows[1].status).toBe("NOT_STARTED");
  });

  it("rejects a non-completed or different-run permit even if page and row checks succeed", () => {
    const entry = combined[0]; const row = { ...before(entry), ...targetConfigs[entry.target].lockedCandidate.desiredFields, updated_at: savedTime };
    const permit = { status: "completed", operation: "publish", taskId: entry.taskId, actionId: entry.actionId,
      candidateVersion: entry.candidateVersion, githubRunId: identity.runId, githubRunAttempt: identity.runAttempt,
      savedId: entry.recordId, savedUpdatedAt: savedTime };
    expect(() => assertActualPublish(entry, publishedFor(entry), row, permit, identity)).not.toThrow();
    for (const drift of [{ status: "issued" }, { status: "uncertain" }, { githubRunId: 999 }, { githubRunAttempt: 2 }, { savedId: "other-row" }]) {
      expect(() => assertActualPublish(entry, publishedFor(entry), row, { ...permit, ...drift }, identity)).toThrow();
    }
    expect(() => assertActualPublish(entry, { ...publishedFor(entry), postcheck: { ...publishedFor(entry).postcheck,
      pageChecks: publishedFor(entry).postcheck.pageChecks.map((page) => ({ ...page, path: "/unrelated" })) } }, row, permit, identity)).toThrow();
  });

  it("workflow loads the service credential only for this exact batch publish step and preserves always-upload", () => {
    const workflow = readFileSync(".github/workflows/content-publish-approved.yml", "utf8");
    const preview = workflow.split("      - name: Preview the exact frozen completion batch")[1].split("      - name: Issue and consume")[0];
    const publish = workflow.split("      - name: Issue and consume")[1].split("      - name: Upload audit package")[0];
    expect(preview).toContain("inputs.mode == 'dry-run'"); expect(preview).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(publish).toContain("inputs.target == 'remaining-completion-20261009' || inputs.target == 'remaining-completion-after-37893433883' || inputs.target == 'remaining-completion-after-37898568406' || inputs.target == 'remaining-completion-after-37903094390') && inputs.mode == 'publish'");
    expect(publish).toContain("SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}");
    expect(workflow.split("SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}")).toHaveLength(2);
    expect(workflow).not.toContain("MANAGED_CMS_PERMIT_ISSUER_SECRET");
    expect(workflow).toContain("      - name: Upload audit package\n        if: always()");
    const shell = workflow.split("        run: |\n")[1].split("\n      - name:")[0].split("\n").map((line) => line.replace(/^ {10}/, "")).join("\n");
    const gate = (changes: Row) => spawnSync("bash", ["-e", "-c", shell], { encoding: "utf8", env: { PATH: process.env.PATH,
      GITHUB_REF: "refs/heads/main", PUBLISH_TARGET: BATCH_NAME, PUBLISH_MODE: "publish", MANAGED_OPERATION: "publish", APPROVAL_ID, ...changes } });
    expect(gate({}).status).toBe(0); expect(gate({ PUBLISH_MODE: "dry-run" }).status).toBe(0);
    for (const drift of [{ APPROVAL_ID: "forged" }, { MANAGED_OPERATION: "rollback" }, { MANAGED_PERMIT_ID: "supplied" }, { PARENT_RUN_ID: "12345" },
      { GITHUB_REF: "refs/heads/other" }, { PUBLISH_MODE: "arbitrary" }]) expect(gate(drift).status).not.toBe(0);
  });
});
