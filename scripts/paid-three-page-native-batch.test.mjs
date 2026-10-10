import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { stableDigest, targetConfigs } from "./publish-content-trust-fixes.mjs";
import { lockedPaidThreePageCandidates } from "./managed-cms-targets-paid-three-page-v1.mjs";
import { NATIVE_THREE_BATCH, NATIVE_THREE_APPROVAL_ID, NATIVE_THREE_TARGETS, APPROVAL_ID, BATCH_NAME,
  assertFixedBatchBinding, assertBatchEnvironment, assertActualPreview, assertActualPublish, buildBatchPermit, runFrozenBatch } from "./publish-remaining-completion-20261009.mjs";
import { INPUT_DIRECTORY, INPUT_MANIFEST_PATH, readNativeRegistry, validateNativeInputs, validateNativeRegistry,
  assertNativeSavedRevision } from "./publish-paid-three-page-native-20261010.mjs";

// All QA/preview/permit examples below are SYNTHETIC contract fixtures, never release evidence.
const root = process.cwd();
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const workflowRef = "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main";
const environment = { PUBLISH_TARGET: NATIVE_THREE_BATCH, MANAGED_OPERATION: "publish", GITHUB_ACTIONS: "true",
  GITHUB_REF: "refs/heads/main", GITHUB_REPOSITORY: "wangchaozhuanyong/zhuangxiuwangzhan", GITHUB_REPOSITORY_ID: "1248188229",
  GITHUB_WORKFLOW_REF: workflowRef, GITHUB_EVENT_NAME: "workflow_dispatch", GITHUB_SHA: "a".repeat(40), GITHUB_ACTOR_ID: "98765",
  GITHUB_RUN_ID: "12345", GITHUB_RUN_ATTEMPT: "1", ACTIONS_ID_TOKEN_REQUEST_URL: "https://fixture.invalid", ACTIONS_ID_TOKEN_REQUEST_TOKEN: "synthetic-only" };
const identity = { repositoryId: 1248188229, workflowRef, workflowSha: environment.GITHUB_SHA, actorId: 98765, runId: 12345, runAttempt: 1 };
const binding = { batch: NATIVE_THREE_BATCH, approvalId: NATIVE_THREE_APPROVAL_ID, sha256: "b".repeat(64) };
const actualManifest = JSON.parse(readFileSync(INPUT_MANIFEST_PATH));
const beforeRows = new Map(actualManifest.entries.map(entry => [entry.target, JSON.parse(readFileSync(entry.baselinePath))]));
const typedSources = new Map(actualManifest.entries.map(entry => [entry.target, JSON.parse(readFileSync(entry.sourceCandidatePath))]));
const savedTime = "2026-10-10T15:30:00.123456+00:00";

async function syntheticFixture(work) {
  const tmpParent = join(root, ".tmp"); mkdirSync(tmpParent, { recursive: true });
  const own = mkdtempSync(join(tmpParent, "native-three-SYNTHETIC-"));
  const values = new Map();
  const pin = (path, value) => {
    const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
    const file = join(own, path); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, bytes);
    const proof = { path, sha256: hash(bytes) }; values.set(path, { sha256: proof.sha256, value }); return proof;
  };
  const read = proof => {
    assert.equal(values.get(proof.path)?.sha256, proof.sha256, "synthetic pinned evidence differs");
    return structuredClone(values.get(proof.path).value);
  };
  const manifest = structuredClone(actualManifest); manifest.state = "READY_REAL_PREVIEW_QA";
  const registry = { schemaVersion: 1, batch: NATIVE_THREE_BATCH, allowedOperation: "publish", site: "https://flashcast.com.my",
    authorization: { id: NATIVE_THREE_APPROVAL_ID }, repositoryId: 1248188229, workflowRef, maximumPermitLifetimeSeconds: 900,
    executionDecision: { id: "SYNTHETIC-operations-only", policyDecisionId: "SYNTHETIC-policy-only", departmentControllerReviewClaimed: false },
    preparedEntriesSha256: stableDigest(manifest.entries), sourceQaCount: 3, sourceQaReceipts: [], actualPreviews: [], entries: [] };
  for (const target of NATIVE_THREE_TARGETS) {
    const locked = structuredClone(lockedPaidThreePageCandidates[target]); const current = beforeRows.get(target);
    const prepared = manifest.entries.find(entry => entry.target === target);
    pin(prepared.sourceCandidatePath, typedSources.get(target)); pin(prepared.baselinePath, current);
    const artifacts = { backup: { record: current }, desired: { record: targetConfigs[target].buildRecord(current) },
      preview: { ok: true, dry_run: true, content_type: "service", existing_id: locked.recordId, slug: locked.slug, payload_preview: locked.desiredFields },
      receipt: { task_id: locked.taskId, candidate_version: locked.candidateVersion, action_id: locked.actionId, scope: locked.scope,
        operation: "publish", http_status: 200, dry_run: true, performed_write: false, external_writes: 0,
        row_unchanged_after_dry_run: true, expected_updated_at: locked.expectedUpdatedAt },
      payload: { payload_sha256: locked.desiredFieldsSha256, expected_updated_at: locked.expectedUpdatedAt },
      prior: { payload_sha256: locked.rollbackFieldsSha256, baseline_fields_sha256: locked.baselineFieldsSha256 },
      identity: { ok: true, dry_run: true, performed_write: false, identity } };
    const names = { backup: "backup.json", desired: "desired.json", receipt: "locked-dry-run-receipt.json", preview: "dry-run.json",
      payload: "managed-payload-digest.json", prior: "rollback-payload-digest.json", identity: "managed-identity-probe.json" };
    const artifactPins = Object.fromEntries(Object.entries(names).map(([key, filename]) => [key, pin(`${INPUT_DIRECTORY}/previews/${locked.slug}/${filename}`, artifacts[key])]));
    const qaId = `SYNTHETIC-${locked.slug}-native-qa`;
    const qa = { qa_receipt_id: qaId, formal_qa_receipt_issued: true, independently_reviewed: true,
      reviewer_task: "SYNTHETIC-reviewer", producer_task: "SYNTHETIC-producer", result: "PASS_EXACT_NATIVE_THREE_REVIEW",
      task_id: locked.taskId, candidate_version: locked.candidateVersion, action_id: locked.actionId,
      current_updated_at: locked.expectedUpdatedAt, current_baseline_sha256: locked.baselineFieldsSha256,
      exact_payload_sha256: locked.desiredFieldsSha256, actual_preview_receipt_sha256: artifactPins.receipt.sha256 };
    const qaPin = pin(`${INPUT_DIRECTORY}/qa/${locked.slug}.json`, qa);
    const entry = { ...locked, target, qaReceiptId: qaId, qaProofs: [{ ...qaPin, receiptId: qaId, result: qa.result,
      expectedUpdatedAt: locked.expectedUpdatedAt, coverageFields: locked.changedFields, reviewedPayloadSha256: locked.desiredFieldsSha256,
      qaBaselineSha256: locked.baselineFieldsSha256, qaBaselineProjectionFields: locked.baselineProjectionFields }] };
    registry.entries.push(entry); registry.sourceQaReceipts.push({ ...qaPin, id: qaId });
    const workflowReceipt = pin(`${INPUT_DIRECTORY}/previews/${locked.slug}/workflow-run.json`, { status: "completed", conclusion: "success",
      event: "workflow_dispatch", workflowId: 351424533, repositoryId: 1248188229, workflowRef,
      workflowSha: environment.GITHUB_SHA, runId: identity.runId, runAttempt: identity.runAttempt, actorId: identity.actorId,
      mode: "dry-run", target, performedWrites: 0 });
    registry.actualPreviews.push({ target, environment: { ...environment, PUBLISH_TARGET: target }, artifacts: artifactPins, workflowReceipt });
  }
  process.chdir(own);
  try { return await work({ manifest, registry, read, pin, values }); }
  finally {
    process.chdir(root); assert.equal(process.cwd(), root);
    assert(own.startsWith(join(root, ".tmp", "native-three-SYNTHETIC-"))); rmSync(own, { recursive: true });
    assert(!existsSync(own));
  }
}

test("actual frozen inputs verify original three records; missing readiness or dispatch fails before credentials/artifacts/issuer", () => {
  validateNativeInputs(actualManifest);
  assert.equal(actualManifest.entries.reduce((sum, row) => sum + row.retainedFieldCount, 0), 79);
  if (actualManifest.state === "WAIT_REAL_PREVIEW_AND_QA") assert.throws(() => readNativeRegistry(), /FAIL_CLOSED_NOT_READY/);
  else assert.deepEqual(readNativeRegistry().registry.entries.map(entry => entry.target), NATIVE_THREE_TARGETS);
  const rejected = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/publish-paid-three-page-native-20261010.mjs", "--mode=dry-run"],
    { encoding: "utf8", env: { PATH: process.env.PATH } });
  assert.equal(rejected.status, 1); assert.match(rejected.stderr, actualManifest.state === "WAIT_REAL_PREVIEW_AND_QA"
    ? /FAIL_CLOSED_NOT_READY/ : /exact owner authorization and current main dispatch identity/);
  assert(!existsSync("audits/content-publish-undefined"));
});

test("independent batch binding rejects old authorization, prototype/arbitrary targets and identity drift", () => {
  assertBatchEnvironment(environment, "publish", NATIVE_THREE_APPROVAL_ID, environment.GITHUB_SHA, binding);
  for (const target of ["arbitrary", "toString", NATIVE_THREE_TARGETS[0]]) assert.throws(() => assertFixedBatchBinding({ batch: target }));
  assert.throws(() => assertFixedBatchBinding({ ...binding, approvalId: APPROVAL_ID }));
  assert.throws(() => assertBatchEnvironment(environment, "publish", APPROVAL_ID, environment.GITHUB_SHA, binding));
  for (const drift of [{ GITHUB_SHA: "b".repeat(40) }, { GITHUB_ACTOR_ID: "0" }, { PARENT_RUN_ID: "123" },
    { MANAGED_PERMIT_ID: "supplied" }, { PUBLISH_TARGET: BATCH_NAME }, { GITHUB_REF: "refs/heads/other" }]) {
    assert.throws(() => assertBatchEnvironment({ ...environment, ...drift }, "publish", NATIVE_THREE_APPROVAL_ID, environment.GITHUB_SHA, binding));
  }
});

test("three independently pinned reviews must bind exact live CAS, baseline and complete actual zero-write artifacts", async () => {
  await syntheticFixture(({ manifest, registry, read, pin }) => {
    validateNativeRegistry(registry, manifest, read);
    assert.throws(() => validateNativeRegistry(registry, { ...manifest, state: "WAIT_REAL_PREVIEW_AND_QA" }, read), /FAIL_CLOSED_NOT_READY/);
    const entry = registry.entries[0]; const qaSource = registry.sourceQaReceipts[0];
    for (const change of [{ formal_qa_receipt_issued: false }, { independently_reviewed: false }, { reviewer_task: "SYNTHETIC-producer" },
      { current_updated_at: savedTime }, { exact_payload_sha256: "b".repeat(64) }, { actual_preview_receipt_sha256: "b".repeat(64) }]) {
      const original = read(qaSource); const replacement = pin(qaSource.path, { ...original, ...change });
      const drift = structuredClone(registry); drift.sourceQaReceipts[0].sha256 = replacement.sha256; drift.entries[0].qaProofs[0].sha256 = replacement.sha256;
      assert.throws(() => validateNativeRegistry(drift, manifest, read), /QA/); pin(qaSource.path, original);
    }
    for (const mutate of [r => { r.entries[0].target = "other"; }, r => { r.authorization.id = APPROVAL_ID; },
      r => { r.actualPreviews[0].artifacts.receipt = undefined; }, r => { r.actualPreviews[0].environment.GITHUB_REF = "refs/heads/other"; },
      r => { r.actualPreviews[0].workflowReceipt = undefined; }]) {
      const drift = structuredClone(registry); mutate(drift); assert.throws(() => validateNativeRegistry(drift, manifest, read));
    }
    const proof = registry.actualPreviews[0]; const artifacts = Object.fromEntries(Object.entries(proof.artifacts).map(([key, value]) => [key, read(value)]));
    assertActualPreview(entry, artifacts, beforeRows.get(entry.target), environment);
    for (const mutate of [a => { a.receipt.performed_write = true; }, a => { a.receipt.row_unchanged_after_dry_run = false; },
      a => { a.identity.identity.actorId += 1; }, a => { a.preview.payload_preview.title_en = "extra"; }]) {
      const drift = structuredClone(artifacts); mutate(drift); assert.throws(() => assertActualPreview(entry, drift, beforeRows.get(entry.target), environment));
    }
    assert.throws(() => assertActualPreview(entry, artifacts, { ...beforeRows.get(entry.target), updated_at: savedTime }, environment), /drift/);
  });
});

test("native dry-run never verifies issuer identity, issues a permit or publishes; exact three rows only", async () => {
  await syntheticFixture(async ({ registry, read }) => {
    const events = [];
    const deps = { preview: async entry => { events.push(entry.target); }, saveSummary: () => {},
      readPreview: entry => Object.fromEntries(Object.entries(registry.actualPreviews.find(p => p.target === entry.target).artifacts).map(([key, pin]) => [key, read(pin)])),
      readCurrent: async entry => beforeRows.get(entry.target), verifyIdentity: () => { throw Error("issuer must not load"); },
      issue: () => { throw Error("must not issue"); }, publish: () => { throw Error("must not publish"); } };
    const result = await runFrozenBatch(registry, "dry-run", environment, deps, binding);
    assert.deepEqual(events, NATIVE_THREE_TARGETS); assert(result.rows.every(row => row.status === "PREVIEW_PASS" && row.performedWrite === false));
    assert.throws(() => validateNativeInputs({ ...actualManifest, entries: actualManifest.entries.slice(1) }));
    await assert.rejects(runFrozenBatch({ ...registry, entries: registry.entries.slice(1) }, "dry-run", environment, deps, binding), /exact/);
    const entry = registry.entries[0]; const artifacts = deps.readPreview(entry);
    const permit = buildBatchPermit(entry, registry, identity, artifacts, Date.parse("2026-10-10T15:00:00Z"), "11111111-1111-4111-8111-111111111111", binding.sha256);
    assert.equal(permit.evidence.authorizationId, NATIVE_THREE_APPROVAL_ID); assert.equal(permit.input.payloadSha256, entry.desiredFieldsSha256);
    assert.equal(Date.parse(permit.input.expiresAt) - Date.parse("2026-10-10T15:00:00Z"), 600_000);
  });
});

test("saved readback refuses permit, Saved ID/time, version, English/retained and cache drift", async () => {
  await syntheticFixture(({ registry }) => {
    const entry = registry.entries[0]; const before = beforeRows.get(entry.target);
    const saved = { ...before, ...entry.desiredFields, updated_at: savedTime, version: before.version + 1 };
    const permitId = "11111111-1111-4111-8111-111111111111";
    const completed = { permitId, status: "completed", operation: "publish", taskId: entry.taskId, actionId: entry.actionId,
      candidateVersion: entry.candidateVersion, githubRunId: identity.runId, githubRunAttempt: identity.runAttempt, savedId: entry.recordId, savedUpdatedAt: savedTime };
    const receipt = { ok: true, target: entry.target, approvalId: NATIVE_THREE_APPROVAL_ID,
      published: { ok: true, saved_id: entry.recordId, saved_updated_at: savedTime, dry_run: false, content_type: "service", action: "publish",
        existing_id: entry.recordId, slug: entry.slug, status: "published", warnings: [], cache_invalidation: { ok: true, strategy: "content-revision",
          revision: "2026-10-10T15:30:01.123456+00:00", edge_purge_requested: { ok: true, attempted: true, tag: "flashcast-public-html", status: 200 } } },
      postcheck: { ok: true, rowMismatches: [], pageChecks: entry.publicPaths.map(page => ({ path: page.path, status: 200, found: true, forbiddenFound: [], missingRequired: [] })) } };
    const context = { entry, receipt, saved, completed, identity, permitId };
    assertActualPublish(entry, receipt, saved, completed, identity, NATIVE_THREE_APPROVAL_ID); assertNativeSavedRevision(context, before);
    for (const drift of [{ status: "issued" }, { githubRunId: 1 }, { savedId: "other" }, { savedUpdatedAt: before.updated_at }]) {
      assert.throws(() => assertActualPublish(entry, receipt, saved, { ...completed, ...drift }, identity, NATIVE_THREE_APPROVAL_ID));
    }
    assert.throws(() => assertActualPublish(entry, { ...receipt, approvalId: APPROVAL_ID }, saved, completed, identity, NATIVE_THREE_APPROVAL_ID));
    assert.throws(() => assertActualPublish(entry, receipt, { ...saved, title_en: "newer unrelated English" }, completed, identity, NATIVE_THREE_APPROVAL_ID));
    for (const mutate of [c => { c.completed.permitId = "other"; }, c => { c.saved.version = before.version; },
      c => { c.receipt.published.content_type = "blog"; }, c => { c.receipt.published.cache_invalidation.edge_purge_requested.ok = false; }]) {
      const drift = structuredClone(context); mutate(drift); assert.throws(() => assertNativeSavedRevision(drift, before));
    }
  });
});

test("native orchestration binds a fresh permit per row and stops before issuing on wrong identity or after uncertain saved readback", async () => {
  await syntheticFixture(async ({ registry, read }) => {
    const rows = new Map(beforeRows); const events = []; let active; let issued; let summary;
    const receiptFor = entry => ({ ok: true, target: entry.target, approvalId: NATIVE_THREE_APPROVAL_ID,
      published: { ok: true, saved_id: entry.recordId, saved_updated_at: savedTime, dry_run: false, content_type: "service",
        existing_id: entry.recordId, slug: entry.slug, action: "publish", status: "published", warnings: [], cache_invalidation: {
          ok: true, strategy: "content-revision", revision: "2026-10-10T15:30:01.123456+00:00",
          edge_purge_requested: { ok: true, attempted: true, tag: "flashcast-public-html", status: 200 } } },
      postcheck: { ok: true, rowMismatches: [], pageChecks: entry.publicPaths.map(page => ({ path: page.path,
        status: 200, found: true, forbiddenFound: [], missingRequired: [] })) } });
    const deps = { now: () => Date.parse("2026-10-10T15:00:00Z"), saveSummary: value => { summary = structuredClone(value); }, savePermit: () => {},
      preview: async entry => { active = entry; events.push(`preview:${entry.slug}`); },
      readPreview: entry => Object.fromEntries(Object.entries(registry.actualPreviews.find(p => p.target === entry.target).artifacts).map(([key, pin]) => [key, read(pin)])),
      readCurrent: async entry => rows.get(entry.target), verifyIdentity: async () => { events.push("identity"); return identity; },
      issue: async input => { issued = input; events.push("issue"); return { permitId: input.permitId, status: "issued", operation: "publish" }; },
      publish: async entry => { events.push("publish"); const before = beforeRows.get(entry.target); rows.set(entry.target, {
        ...before, ...entry.desiredFields, updated_at: savedTime, version: before.version + 1 }); },
      readPublished: receiptFor, readPermit: async permitId => ({ permitId, status: "completed", operation: "publish", taskId: active.taskId,
        actionId: active.actionId, candidateVersion: active.candidateVersion, githubRunId: identity.runId, githubRunAttempt: identity.runAttempt,
        savedId: active.recordId, savedUpdatedAt: savedTime }),
      assertReadback: context => { events.push("readback"); assertNativeSavedRevision(context, beforeRows.get(context.entry.target)); } };
    const result = await runFrozenBatch(registry, "publish", environment, deps, binding);
    assert(result.rows.every(row => row.status === "PUBLISH_PASS")); assert.equal(new Set(result.rows.map(row => row.permitId)).size, 3);
    assert.deepEqual(events, ["builtin", "kitchen", "renovation"].flatMap(slug => [`preview:${slug}`, "identity", "issue", "publish", "readback"]));
    assert.equal(issued.taskId, registry.entries[2].taskId);
    for (const [target, row] of beforeRows) rows.set(target, row); events.length = 0;
    await assert.rejects(runFrozenBatch(registry, "publish", environment, { ...deps,
      verifyIdentity: async () => ({ ...identity, actorId: 1 }) }, binding), /OIDC/);
    assert.deepEqual(events, ["preview:builtin"]); assert.equal(summary.rows[1].status, "NOT_STARTED");
    events.length = 0;
    await assert.rejects(runFrozenBatch(registry, "publish", environment, { ...deps,
      readPermit: async permitId => ({ permitId, status: "issued" }) }, binding), /Actual publish/);
    assert.deepEqual(events, ["preview:builtin", "identity", "issue", "publish"]);
    assert.equal(summary.rows[0].status, "FAILED_STOPPED"); assert.equal(summary.rows[0].performedWrite, null);
    assert.equal(summary.rows[0].writeOutcome, "INSPECT_ACTUAL_SINGLE_USE_PERMIT_AND_RECEIPT_DO_NOT_REPLAY");
    assert.equal(summary.rows[1].status, "NOT_STARTED");
  });
});

test("actual workflow pre-credential gate rejects all native misuse and keeps old batch approval", () => {
  const workflow = readFileSync(join(root, ".github/workflows/content-publish-approved.yml"), "utf8");
  assert(workflow.includes("run-name: ${{ format('{0} | {1}', inputs.target, inputs.mode) }}"));
  const shell = workflow.split("        run: |\n")[1].split("\n      - name:")[0].split("\n").map(line => line.replace(/^ {10}/, "")).join("\n");
  const gate = changes => spawnSync("bash", ["-e", "-c", shell], { encoding: "utf8", env: { PATH: process.env.PATH,
    GITHUB_REF: "refs/heads/main", PUBLISH_TARGET: NATIVE_THREE_BATCH, PUBLISH_MODE: "publish", MANAGED_OPERATION: "publish", APPROVAL_ID: NATIVE_THREE_APPROVAL_ID, ...changes } });
  assert.equal(gate({}).status, 0); assert.equal(gate({ PUBLISH_MODE: "dry-run" }).status, 0);
  for (const drift of [{ APPROVAL_ID }, { MANAGED_OPERATION: "rollback" }, { MANAGED_PERMIT_ID: "supplied" },
    { PARENT_RUN_ID: "123" }, { PUBLISH_MODE: "other" }, { GITHUB_REF: "refs/heads/other" }]) assert.notEqual(gate(drift).status, 0);
  assert.equal(gate({ PUBLISH_TARGET: BATCH_NAME, APPROVAL_ID }).status, 0);
  assert.notEqual(gate({ PUBLISH_TARGET: BATCH_NAME }).status, 0);
  const preview = workflow.split("      - name: Preview the exact frozen completion batch")[1].split("      - name: Issue and consume")[0];
  assert(!preview.includes("SUPABASE_SERVICE_ROLE_KEY")); assert(preview.includes("publish-paid-three-page-native-20261010.mjs"));
  assert(workflow.includes("inputs.target != 'paid-three-page-native-20261010'"));
  const frozenGuardName = "      - name: Validate frozen native three-page evidence before loading credentials";
  assert(workflow.indexOf(frozenGuardName) < workflow.indexOf("      - name: Confirm production source and required secrets"));
  const frozenGuard = workflow.split(frozenGuardName)[1].split("      - name: Check real Chrome")[0];
  assert(frozenGuard.includes("readNativeRegistry()")); assert(!frozenGuard.includes("secrets."));
});
