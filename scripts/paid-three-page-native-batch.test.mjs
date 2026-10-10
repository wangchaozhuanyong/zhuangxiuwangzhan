import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { stableDigest, targetConfigs, inspectPublicReadback } from "./publish-content-trust-fixes.mjs";
import { lockedPaidThreePageCandidates } from "./managed-cms-targets-paid-three-page-v1.mjs";
import { NATIVE_THREE_BATCH, NATIVE_THREE_APPROVAL_ID, NATIVE_THREE_TARGETS, APPROVAL_ID, BATCH_NAME,
  assertFixedBatchBinding, assertBatchEnvironment, assertActualPreview, assertActualPublish, buildBatchPermit, runFrozenBatch } from "./publish-remaining-completion-20261009.mjs";
import { INPUT_DIRECTORY, INPUT_MANIFEST_PATH, readNativeRegistry, validateNativeInputs, validateNativeRegistry,
  SAVED_RECOVERY_PATH, assertNativeSavedPublic, assertNativeSavedRevision, validateNativeRecovery,
  KITCHEN_RECOVERY_PATH, validateNativeKitchenRecovery, verifyNativeRecoveredSaved } from "./publish-paid-three-page-native-20261010.mjs";
import { readManagedPermit } from "../supabase/functions/content-publish/permit-issuer.ts";

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
const passPublicReadback = entry => ({ checkedAt: "2026-10-11T01:00:00.000Z", pageChecks: entry.publicPaths.map(page => ({
  path: page.path, expected: page.expected, status: 200, found: true, forbiddenFound: [], missingRequired: [] })) });
const fixedRecoveryResult = (entry, mode) => {
  const index = NATIVE_THREE_TARGETS.indexOf(entry.target);
  return { target: entry.target, priorRunId: [38066380587, 38069295075][index],
    permitId: ["14ae24de-f39a-44cb-9dde-4d1a4a399edc", "cde7fc7d-2021-4f5a-97b6-47c79c736945"][index],
    savedUpdatedAt: ["2026-10-10T16:08:22.003433+00:00", "2026-10-10T16:51:33.869215+00:00"][index],
    performedWrite: false, privatePermitReadback: mode === "publish", currentPublicReadbackVerified: true,
    currentPublicReadbackSha256: "c".repeat(64) };
};

const receiptFor = (entry, updatedAt = savedTime) => ({ ok: true, target: entry.target, approvalId: NATIVE_THREE_APPROVAL_ID,
  published: { ok: true, saved_id: entry.recordId, saved_updated_at: updatedAt, dry_run: false, content_type: "service", action: "publish",
    existing_id: entry.recordId, slug: entry.slug, status: "published", warnings: [], cache_invalidation: { ok: true, strategy: "content-revision",
      revision: updatedAt, edge_purge_requested: { ok: true, attempted: true, tag: "flashcast-public-html", status: 200 } } },
  postcheck: { ok: true, rowMismatches: [], pageChecks: entry.publicPaths.map(page => ({ path: page.path, status: 200,
    found: true, forbiddenFound: [], missingRequired: [] })) } });

async function completedFromDatabase(entry, permitId, runIdentity = identity, updatedAt = savedTime, drift = {}, calls = []) {
  // Raw snake_case DB fields pass through the real reader, rather than a handwritten response mock.
  const row = { permit_id: permitId, status: "completed", operation: "publish", task_id: entry.taskId, action_id: entry.actionId,
    candidate_version: entry.candidateVersion, github_run_id: runIdentity.runId, github_run_attempt: runIdentity.runAttempt,
    saved_id: entry.recordId, saved_updated_at: updatedAt, ...drift };
  const client = { from(table) { calls.push(["from", table]); return {
    select(fields) { calls.push(["select", fields]); return {
      eq(field, value) { calls.push(["eq", field, value]); return {
        async maybeSingle() { calls.push(["maybeSingle"]); return { data: row, error: null }; },
      }; },
    }; },
  }; } };
  return readManagedPermit(client, permitId);
}

async function syntheticFixture(work) {
  const tmpParent = resolve(process.env.TMPDIR || join(root, ".tmp")); mkdirSync(tmpParent, { recursive: true });
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
    assert(own.startsWith(join(tmpParent, "native-three-SYNTHETIC-"))); rmSync(own, { recursive: true });
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
      issue: () => { throw Error("must not issue"); }, publish: () => { throw Error("must not publish"); },
      verifyCompleted: entry => fixedRecoveryResult(entry, "dry-run") };
    const result = await runFrozenBatch(registry, "dry-run", environment, deps, binding);
    assert.deepEqual(events, [NATIVE_THREE_TARGETS[2]]);
    assert.deepEqual(result.rows.map(row => row.status), ["PREVIEW_SAVED_RECOVERED", "PREVIEW_SAVED_RECOVERED", "PREVIEW_PASS"]);
    assert(result.rows.every(row => row.performedWrite === false));
    assert.throws(() => validateNativeInputs({ ...actualManifest, entries: actualManifest.entries.slice(1) }));
    await assert.rejects(runFrozenBatch({ ...registry, entries: registry.entries.slice(1) }, "dry-run", environment, deps, binding), /exact/);
    const entry = registry.entries[0]; const artifacts = deps.readPreview(entry);
    const permit = buildBatchPermit(entry, registry, identity, artifacts, Date.parse("2026-10-10T15:00:00Z"), "11111111-1111-4111-8111-111111111111", binding.sha256);
    assert.equal(permit.evidence.authorizationId, NATIVE_THREE_APPROVAL_ID); assert.equal(permit.input.payloadSha256, entry.desiredFieldsSha256);
    assert.equal(Date.parse(permit.input.expiresAt) - Date.parse("2026-10-10T15:00:00Z"), 600_000);
  });
});

test("saved readback refuses permit, Saved ID/time, version, English/retained and cache drift", async () => {
  await syntheticFixture(async ({ registry }) => {
    const entry = registry.entries[0]; const before = beforeRows.get(entry.target);
    const saved = { ...before, ...entry.desiredFields, updated_at: savedTime, version: before.version };
    const permitId = "11111111-1111-4111-8111-111111111111";
    const completed = await completedFromDatabase(entry, permitId);
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
    for (const mutate of [c => { c.completed.permitId = "other"; }, c => { c.saved.version = before.version + 1; },
      c => { c.receipt.published.content_type = "blog"; }, c => { c.receipt.published.cache_invalidation.edge_purge_requested.ok = false; }]) {
      const drift = structuredClone(context); mutate(drift); assert.throws(() => assertNativeSavedRevision(drift, before));
    }
  });
});

test("real managed-permit reader maps the raw database tuple before completed/Saved checks", async () => {
  const entry = readNativeRegistry().registry.entries[0];
  const permitId = "11111111-1111-4111-8111-111111111111"; const calls = [];
  const completed = await completedFromDatabase(entry, permitId, identity, savedTime, {}, calls);
  assert.deepEqual(calls, [["from", "managed_cms_release_permits"], ["select", "*"], ["eq", "permit_id", permitId], ["maybeSingle"]]);
  assert.deepEqual(completed, { permitId, status: "completed", operation: "publish", taskId: entry.taskId, actionId: entry.actionId,
    candidateVersion: entry.candidateVersion, githubRunId: identity.runId, githubRunAttempt: identity.runAttempt,
    savedId: entry.recordId, savedUpdatedAt: savedTime });
  assert(!Object.hasOwn(completed, "id")); assert(!Object.hasOwn(completed, "saved_updated_at"));
  assert.equal(await readManagedPermit({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }, permitId), null);
  await assert.rejects(readManagedPermit({ from: () => { throw Error("invalid ID must not query"); } }, "invalid"), /Invalid permit ID/);
});

test("all three services change only five approved fields, preserve 79 fields and versions, and advance precise timestamps", async () => {
  const { registry } = readNativeRegistry(); let changedCount = 0; let retainedCount = 0;
  for (const entry of registry.entries) {
    const before = beforeRows.get(entry.target); const saved = { ...before, ...entry.desiredFields, updated_at: savedTime };
    const permitId = "11111111-1111-4111-8111-111111111111";
    const completed = await completedFromDatabase(entry, permitId); const receipt = receiptFor(entry);
    const context = { entry, receipt, saved, completed, permitId };
    assertActualPublish(entry, receipt, saved, completed, identity, NATIVE_THREE_APPROVAL_ID);
    assertNativeSavedRevision(context, before);
    assert.deepEqual(Object.keys(saved).sort(), [...entry.baselineProjectionFields].sort());
    for (const field of entry.retainedProjectionFields) assert.deepEqual(saved[field], before[field]);
    const actualChanges = entry.baselineProjectionFields.filter(field => JSON.stringify(saved[field]) !== JSON.stringify(before[field]));
    assert.deepEqual(actualChanges.sort(), [...entry.changedFields, "updated_at"].sort());
    assert.equal(saved.version, before.version); changedCount += entry.changedFields.length; retainedCount += entry.retainedProjectionFields.length;
    for (const version of [before.version + 1, before.version - 1, String(before.version), null]) {
      assert.throws(() => assertNativeSavedRevision({ ...context, saved: { ...saved, version } }, before), /saved version/);
    }
    assertNativeSavedPublic(context, { ...before, updated_at: "2026-10-10T15:30:00.123455+00:00" });
    for (const updatedAt of [savedTime, "2026-10-10T15:30:00.123457+00:00", "invalid"]) {
      assert.throws(() => assertNativeSavedPublic(context, { ...before, updated_at: updatedAt }), /saved version/);
    }
    const staleCache = structuredClone(context); staleCache.receipt.published.cache_invalidation.revision = "2026-10-10T15:30:00.123455+00:00";
    assert.throws(() => assertNativeSavedRevision(staleCache, before), /cache delivery/);
  }
  assert.equal(changedCount, 5); assert.equal(retainedCount, 79);
});

test("Saved recovery accepts only the fixed failed first-row run, immutable evidence closure and untouched remaining rows", () => {
  const prepared = readNativeRegistry(); const recovered = validateNativeRecovery(prepared);
  assert.equal(recovered.recovery.runId, 38066380587); assert.equal(recovered.recovery.maximumNewWrites, 2);
  assert.equal(recovered.recovery.originalRunConclusion, "failure");
  const values = new Map([[SAVED_RECOVERY_PATH, recovered.recovery], ...Object.values(recovered.recovery.proofs)
    .map(proof => [proof.path, JSON.parse(readFileSync(join(root, proof.path)))] )]);
  for (const mutate of [v => { v.get(SAVED_RECOVERY_PATH).runId += 1; },
    v => { v.get(SAVED_RECOVERY_PATH).exactRecoveredTarget = NATIVE_THREE_TARGETS[1]; },
    v => { v.get(SAVED_RECOVERY_PATH).permitId = "11111111-1111-4111-8111-111111111111"; },
    v => { v.get(SAVED_RECOVERY_PATH).registrySha256 = "b".repeat(64); },
    v => { v.get(SAVED_RECOVERY_PATH).maximumNewWrites = 3; },
    v => { v.get(SAVED_RECOVERY_PATH).originalRunConclusion = "success"; },
    v => { v.get(recovered.recovery.proofs.workflow.path).headSha = environment.GITHUB_SHA; },
    v => { v.get(recovered.recovery.proofs.summary.path).rows[1].performedWrite = true; },
    v => { v.get(recovered.recovery.proofs.summary.path).rows[2].permitId = "unknown"; },
    v => { v.get(recovered.recovery.proofs.receipt.path).published.saved_updated_at = savedTime; }]) {
    const drift = structuredClone(values); mutate(drift);
    assert.throws(() => validateNativeRecovery(prepared, proof => structuredClone(drift.get(proof.path))), /Native recovery/);
  }
});

test("recovered Saved uses public-only dry-run and real completed-permit mapping in publish; all drift stops before fresh permits", async () => {
  const prepared = readNativeRegistry(); const recovered = prepared.recovery; const { recovery } = recovered;
  const entry = prepared.registry.entries[0]; const before = beforeRows.get(entry.target);
  const saved = { ...before, ...entry.desiredFields, updated_at: recovery.savedUpdatedAt };
  const originalIdentity = { ...identity, runId: recovery.runId, runAttempt: recovery.runAttempt };
  for (const mode of ["dry-run", "publish"]) {
    const reads = []; const writes = [];
    const deps = { readCurrent: async () => structuredClone(saved), readPublic: async () => passPublicReadback(entry), readPermit: async permitId => {
      reads.push(permitId); return completedFromDatabase(entry, permitId, originalIdentity, recovery.savedUpdatedAt);
    }, issue: () => assert.fail("recovery cannot issue"), publish: () => assert.fail("recovery cannot write") };
    const context = { entry, mode, dependencies: deps, environment, artifactRoot: "audits/SYNTHETIC-recovery", write: (path, value) => writes.push({ path, value }) };
    const result = await verifyNativeRecoveredSaved(prepared, recovered, context);
    assert.deepEqual(reads, mode === "publish" ? [recovery.permitId] : []);
    assert.equal(result.performedWrite, false); assert.equal(result.privatePermitReadback, mode === "publish");
    assert.equal(result.priorRunId, 38066380587); assert.equal(result.savedUpdatedAt, recovery.savedUpdatedAt);
    assert.equal(writes.length, 2); assert.equal(writes[0].path, join(context.artifactRoot, entry.target, "current-public-readback.json"));
    assert.equal(writes[1].path, join(context.artifactRoot, entry.target, "recovered-completed-row.json"));
    assert.equal(writes[1].value.currentPublicReadbackSha256, hash(JSON.stringify(writes[0].value, null, 2) + "\n"));
    assert.equal(writes[1].value.completedPermit?.permitId ?? null, mode === "publish" ? recovery.permitId : null);
    for (const mutate of [row => { row[entry.changedFields[0]] = "payload drift"; },
      row => { row.title_en = "retained drift"; }, row => { row.updated_at = savedTime; },
      row => { row.version += 1; }, row => { row.extra = "unknown public field"; }, row => { delete row.title_en; }]) {
      const drift = structuredClone(saved); mutate(drift); reads.length = 0; writes.length = 0;
      await assert.rejects(verifyNativeRecoveredSaved(prepared, recovered, { ...context,
        dependencies: { ...deps, readCurrent: async () => drift } }), /Previously Saved|saved version/);
      assert.deepEqual(reads, []); assert.deepEqual(writes, []);
    }
  }
  for (const drift of [null, { status: "issued" }, { github_run_id: 12345 }, { github_run_attempt: 2 },
    { task_id: "other" }, { action_id: "other" }, { candidate_version: "other" }, { operation: "rollback" },
    { saved_id: "other" }, { saved_updated_at: before.updated_at }]) {
    let writes = 0;
    await assert.rejects(verifyNativeRecoveredSaved(prepared, recovered, { entry, mode: "publish", environment, artifactRoot: "audits/SYNTHETIC-recovery",
      write: () => { writes += 1; }, dependencies: { readCurrent: async () => saved, readPublic: async () => passPublicReadback(entry),
        readPermit: permitId => drift === null ? null : completedFromDatabase(entry, permitId, originalIdentity, recovery.savedUpdatedAt, drift) } }), /Actual publish/);
    assert.equal(writes, 0);
  }
  await assert.rejects(verifyNativeRecoveredSaved(prepared, recovered, { entry: prepared.registry.entries[1], mode: "publish" }), /exact previous builtin or kitchen/);
});

test("native orchestration permits only the untouched last row after two fixed recoveries and stops on identity or uncertain Saved", async () => {
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
        ...before, ...entry.desiredFields, updated_at: savedTime, version: before.version }); },
      readPublished: receiptFor, readPermit: permitId => completedFromDatabase(active, permitId),
      assertReadback: context => { events.push("readback"); assertNativeSavedRevision(context, beforeRows.get(context.entry.target)); },
      verifyCompleted: entry => { events.push(`recover:${entry.slug}`); return fixedRecoveryResult(entry, "publish"); } };
    const result = await runFrozenBatch(registry, "publish", environment, deps, binding);
    assert.deepEqual(result.rows.map(row => row.status), ["PUBLISH_RECOVERED", "PUBLISH_RECOVERED", "PUBLISH_PASS"]);
    assert.equal(result.rows.filter(row => row.performedWrite).length, 1);
    assert.deepEqual(events, ["recover:builtin", "recover:kitchen", "preview:renovation", "identity", "issue", "publish", "readback"]);
    assert.equal(issued.taskId, registry.entries[2].taskId);
    for (const [target, row] of beforeRows) rows.set(target, row); events.length = 0;
    await assert.rejects(runFrozenBatch(registry, "publish", environment, { ...deps,
      verifyIdentity: async () => ({ ...identity, actorId: 1 }) }, binding), /OIDC/);
    assert.deepEqual(events, ["recover:builtin", "recover:kitchen", "preview:renovation"]); assert.equal(summary.rows[2].status, "FAILED_STOPPED");
    events.length = 0;
    await assert.rejects(runFrozenBatch(registry, "publish", environment, { ...deps,
      readPermit: async permitId => ({ permitId, status: "issued" }) }, binding), /Actual publish/);
    assert.deepEqual(events, ["recover:builtin", "recover:kitchen", "preview:renovation", "identity", "issue", "publish"]);
    assert.equal(summary.rows[2].status, "FAILED_STOPPED"); assert.equal(summary.rows[2].performedWrite, null);
    assert.equal(summary.rows[2].writeOutcome, "INSPECT_ACTUAL_SINGLE_USE_PERMIT_AND_RECEIPT_DO_NOT_REPLAY");
    assert.equal(summary.rows[1].status, "PUBLISH_RECOVERED");
  });
});

test("native resume retains both original Saved rows and only the untouched renovation previews and consumes one fresh permit", async () => {
  const prepared = readNativeRegistry(); const recovered = prepared.recovery; const { recovery } = recovered;
  await syntheticFixture(async ({ registry, read }) => {
    const setup = (mode, rowDrift, permitDrift) => {
      const rows = new Map([...beforeRows].map(([target, row]) => [target, structuredClone(row)]));
      const first = registry.entries[0]; const priorSaved = { ...rows.get(first.target), ...first.desiredFields, updated_at: recovery.savedUpdatedAt };
      if (rowDrift) rowDrift(priorSaved); rows.set(first.target, priorSaved);
      const second = registry.entries[1]; const kitchenRecovery = prepared.kitchenRecovery.recovery;
      rows.set(second.target, { ...rows.get(second.target), ...second.desiredFields, updated_at: kitchenRecovery.savedUpdatedAt });
      const events = []; const issued = []; const privateReads = []; const writtenArtifacts = []; let active; let summary;
      const deps = { now: () => Date.parse("2026-10-10T15:00:00Z"), saveSummary: value => { summary = structuredClone(value); }, savePermit: () => {},
        preview: async entry => { active = entry; events.push(`preview:${entry.slug}`); },
        readPreview: entry => Object.fromEntries(Object.entries(registry.actualPreviews.find(p => p.target === entry.target).artifacts).map(([key, pin]) => [key, read(pin)])),
        readCurrent: async entry => rows.get(entry.target), verifyIdentity: async () => { assert.equal(mode, "publish"); events.push("identity"); return identity; },
        readPublic: async entry => passPublicReadback(entry),
        issue: async input => { assert.equal(mode, "publish"); issued.push(input); events.push(`issue:${active.slug}`);
          return { permitId: input.permitId, status: "issued", operation: "publish" }; },
        publish: async entry => { assert.equal(mode, "publish"); events.push(`publish:${entry.slug}`);
          rows.set(entry.target, { ...rows.get(entry.target), ...entry.desiredFields, updated_at: savedTime }); },
        readPublished: entry => receiptFor(entry), readPermit: permitId => {
          assert.equal(mode, "publish"); privateReads.push(permitId);
          if (permitId === recovery.permitId) return permitDrift === null ? null : completedFromDatabase(first, permitId,
            { ...identity, runId: recovery.runId, runAttempt: recovery.runAttempt }, recovery.savedUpdatedAt, permitDrift || {});
          if (permitId === kitchenRecovery.permitId) return completedFromDatabase(second, permitId,
            { ...identity, runId: kitchenRecovery.runId, runAttempt: kitchenRecovery.runAttempt }, kitchenRecovery.savedUpdatedAt);
          return completedFromDatabase(active, permitId);
        },
        assertReadback: context => assertNativeSavedRevision(context, beforeRows.get(context.entry.target)),
      };
      deps.verifyCompleted = entry => { events.push(`recover:${entry.slug}`); return verifyNativeRecoveredSaved(prepared,
        entry.target === first.target ? recovered : prepared.kitchenRecovery,
        { entry, mode, environment, dependencies: deps, artifactRoot: "audits/SYNTHETIC-resume", write: (path, value) => writtenArtifacts.push({ path, value }) }); };
      return { deps, rows, events, issued, privateReads, writtenArtifacts, summary: () => summary };
    };
    for (const mode of ["dry-run", "publish"]) {
      const state = setup(mode); const result = await runFrozenBatch(registry, mode, environment, state.deps, binding);
      assert.deepEqual(result.rows.map(row => row.status), mode === "publish"
        ? ["PUBLISH_RECOVERED", "PUBLISH_RECOVERED", "PUBLISH_PASS"] : ["PREVIEW_SAVED_RECOVERED", "PREVIEW_SAVED_RECOVERED", "PREVIEW_PASS"]);
      assert.equal(result.rows[0].performedWrite, false); assert.equal(result.rows[0].priorRunId, 38066380587);
      assert.equal(result.rows[0].priorPermitId, recovery.permitId); assert.equal(result.rows[0].savedUpdatedAt, recovery.savedUpdatedAt);
      assert.equal(result.rows.filter(row => row.performedWrite).length, mode === "publish" ? 1 : 0);
      assert(!state.events.some(event => /^(preview|issue|publish):(builtin|kitchen)$/.test(event)));
      assert.deepEqual(result.rows.slice(0, 2).map(row => row.priorRunId), [38066380587, 38069295075]);
      assert.deepEqual(state.events, mode === "publish" ? ["recover:builtin", "recover:kitchen",
        "preview:renovation", "identity", "issue:renovation", "publish:renovation"] : ["recover:builtin", "recover:kitchen", "preview:renovation"]);
      assert.deepEqual(state.issued.map(input => input.recordId), mode === "publish" ? [registry.entries[2].recordId] : []);
      assert.equal(new Set(state.issued.map(input => input.permitId)).size, mode === "publish" ? 1 : 0);
      assert(state.issued.every(input => input.permitId !== recovery.permitId));
      assert.equal(state.privateReads.length, mode === "publish" ? 3 : 0);
      assert.equal(state.writtenArtifacts[1].value.privatePermitReadback, mode === "publish");
      assert.equal(state.writtenArtifacts[3].value.privatePermitReadback, mode === "publish");
      for (const rowDrift of [row => { row.version += 1; }, row => { row.updated_at = savedTime; },
        row => { row.content_zh = "changed reviewed content"; }, row => { row.title_en = "changed retained field"; }]) {
        const failed = setup(mode, rowDrift);
        await assert.rejects(runFrozenBatch(registry, mode, environment, failed.deps, binding), /Previously Saved|saved version/);
        assert.deepEqual(failed.events, ["recover:builtin"]); assert.equal(failed.privateReads.length, 0);
        assert.equal(failed.issued.length, 0); assert.equal(failed.writtenArtifacts.length, 0);
        assert.deepEqual(failed.summary().rows.map(row => row.status), ["FAILED_STOPPED", "NOT_STARTED", "NOT_STARTED"]);
        assert.equal(failed.summary().rows[0].performedWrite, false);
      }
    }
    for (const permitDrift of [null, { status: "issued" }, { github_run_id: Number(environment.GITHUB_RUN_ID) }, { saved_updated_at: savedTime }]) {
      const failed = setup("publish", null, permitDrift);
      await assert.rejects(runFrozenBatch(registry, "publish", environment, failed.deps, binding), /Actual publish/);
      assert.deepEqual(failed.events, ["recover:builtin"]); assert.equal(failed.issued.length, 0);
      assert.deepEqual(failed.summary().rows.map(row => row.status), ["FAILED_STOPPED", "NOT_STARTED", "NOT_STARTED"]);
    }
    const uncertain = setup("publish"); uncertain.deps.readPermit = async () => { throw Error("private read unavailable"); };
    await assert.rejects(runFrozenBatch(registry, "publish", environment, uncertain.deps, binding), /private read unavailable/);
    assert.equal(uncertain.issued.length, 0); assert.equal(uncertain.summary().rows[2].status, "NOT_STARTED");
    const failedSecond = setup("publish"); const publish = failedSecond.deps.publish;
    failedSecond.deps.publish = async entry => { await publish(entry); failedSecond.rows.get(entry.target).title_en = "unexpected Saved drift"; };
    await assert.rejects(runFrozenBatch(registry, "publish", environment, failedSecond.deps, binding), /Actual publish/);
    assert.deepEqual(failedSecond.events, ["recover:builtin", "recover:kitchen", "preview:renovation", "identity", "issue:renovation", "publish:renovation"]);
    assert.equal(failedSecond.issued.length, 1); assert.equal(failedSecond.summary().rows[0].status, "PUBLISH_RECOVERED");
    assert.equal(failedSecond.summary().rows[1].status, "PUBLISH_RECOVERED"); assert.equal(failedSecond.summary().rows[2].performedWrite, null);
    const oldBatch = setup("dry-run");
    await assert.rejects(runFrozenBatch({ ...registry, batch: BATCH_NAME, authorization: { id: APPROVAL_ID } }, "dry-run", environment,
      oldBatch.deps, { batch: BATCH_NAME, approvalId: APPROVAL_ID, sha256: binding.sha256 }), /restricted to the exact native three batch/);
    assert.equal(oldBatch.events.length, 0); assert.equal(oldBatch.privateReads.length, 0); assert.equal(oldBatch.issued.length, 0);
  });
});

test("kitchen recovery preserves its exact failed official receipt, original source and independent authorization evidence", () => {
  const prepared = readNativeRegistry(); const recovered = prepared.kitchenRecovery;
  assert.equal(recovered.receipt.ok, false); assert.equal(recovered.recovery.maximumNewWrites, 1);
  assert.equal(recovered.receipt.approvalId, undefined);
  const values = new Map([[KITCHEN_RECOVERY_PATH, recovered.recovery], ...Object.values(recovered.recovery.proofs)
    .map(proof => [proof.path, JSON.parse(readFileSync(join(root, proof.path)))])]);
  const { recovery } = recovered;
  for (const mutate of [v => { v.get(KITCHEN_RECOVERY_PATH).runId += 1; },
    v => { v.get(KITCHEN_RECOVERY_PATH).maximumNewWrites = 2; },
    v => { v.get(KITCHEN_RECOVERY_PATH).failureIsNotReclassified = false; },
    v => { v.get(recovery.proofs.workflow.path).headSha = environment.GITHUB_SHA; },
    v => { v.get(recovery.proofs.summary.path).rows[2].performedWrite = true; },
    v => { v.get(recovery.proofs.receipt.path).ok = true; },
    v => { v.get(recovery.proofs.receipt.path).postcheck.ok = true; },
    v => { v.get(recovery.proofs.receipt.path).postcheck.pageChecks[0].missingRequired = []; },
    v => { v.get(recovery.proofs.receipt.path).postcheck.pageChecks[1].missingRequired = ["unexpected"]; },
    v => { v.get(recovery.proofs.receipt.path).postcheck.rowMismatches = ["version"]; },
    v => { v.get(recovery.proofs.permitEvidence.path).evidence.authorizationId = APPROVAL_ID; },
    v => { v.get(recovery.proofs.permitEvidence.path).evidence.identity.workflowSha = environment.GITHUB_SHA; },
    v => { v.get(recovery.proofs.permitEvidence.path).evidence.identity.actorId += 1; },
    v => { v.get(recovery.proofs.permitEvidence.path).evidence.actualQa[0].sha256 = "b".repeat(64); },
    v => { v.get(recovery.proofs.permitEvidence.path).evidence.actualPriorSha256 = "b".repeat(64); }]) {
    const drift = structuredClone(values); mutate(drift);
    assert.throws(() => validateNativeKitchenRecovery(prepared, proof => structuredClone(drift.get(proof.path))), /Native kitchen recovery/);
  }
  assert.equal(recovered.receipt.ok, false);
});

test("kitchen Saved recovery requires current fixed raw metadata and summary, complete real permit tuple and retained thirty fields", async () => {
  const prepared = readNativeRegistry(); const recovered = prepared.kitchenRecovery; const { recovery } = recovered;
  const entry = prepared.registry.entries[1]; const before = beforeRows.get(entry.target);
  const saved = { ...before, ...entry.desiredFields, updated_at: recovery.savedUpdatedAt };
  const originalBytes = JSON.stringify(recovered.receipt); const originalIdentity = { ...identity, runId: recovery.runId, runAttempt: 1 };
  const rawChecks = (missingExcerpt = false) => ({ checkedAt: "2026-10-11T01:00:00.000Z", pageChecks: entry.publicPaths.map((page, index) =>
    inspectPublicReadback(page, 200, `<html><head><title>${page.expected}</title></head><body>${(page.requiredPhrases || [])
      .filter(phrase => !(missingExcerpt && index === 0 && phrase === entry.desiredFields.excerpt_zh)).join(" ")}</body></html>`)) });
  for (const mode of ["dry-run", "publish"]) {
    const writes = []; const reads = [];
    const deps = { readCurrent: async () => structuredClone(saved), readPublic: async () => rawChecks(),
      readPermit: async permitId => { reads.push(permitId); return completedFromDatabase(entry, permitId, originalIdentity, recovery.savedUpdatedAt); },
      issue: () => assert.fail("Saved kitchen cannot issue"), publish: () => assert.fail("Saved kitchen cannot write") };
    const context = { entry, mode, environment, dependencies: deps, artifactRoot: "audits/SYNTHETIC-two-recoveries", write: (path, value) => writes.push({ path, value }) };
    const result = await verifyNativeRecoveredSaved(prepared, recovered, context);
    assert.equal(result.performedWrite, false); assert.equal(result.priorRunId, 38069295075);
    assert.equal(result.currentPublicReadbackVerified, true); assert.deepEqual(reads, mode === "publish" ? [recovery.permitId] : []);
    assert.equal(writes.length, 2); assert.equal(writes[0].value.failureIsNotReclassified, true);
    assert.equal(writes[0].value.currentSourceSha, environment.GITHUB_SHA);
    assert.equal(result.currentPublicReadbackSha256, hash(JSON.stringify(writes[0].value, null, 2) + "\n"));
    for (const publicDrift of [() => rawChecks(true), () => { const v = rawChecks(); v.pageChecks[0].found = false; return v; },
      () => { const v = rawChecks(); v.pageChecks[0].status = 503; return v; },
      () => { const v = rawChecks(); v.pageChecks[1].forbiddenFound = ["stale"]; return v; }]) {
      reads.length = 0; writes.length = 0;
      await assert.rejects(verifyNativeRecoveredSaved(prepared, recovered, { ...context, dependencies: { ...deps, readPublic: async () => publicDrift() } }), /current raw public/);
      assert.deepEqual(reads, []); assert.deepEqual(writes, []);
    }
    for (const mutate of [r => { r.title_zh = before.title_zh; }, r => { r.excerpt_en = "retained drift"; },
      r => { r.version += 1; }, r => { r.updated_at = before.updated_at; }, r => { r.extra = "unknown field"; }]) {
      const row = structuredClone(saved); mutate(row); reads.length = 0; writes.length = 0;
      await assert.rejects(verifyNativeRecoveredSaved(prepared, recovered, { ...context, dependencies: { ...deps, readCurrent: async () => row } }), /Previously Saved|saved version/);
      assert.deepEqual(reads, []); assert.deepEqual(writes, []);
    }
    for (const mutate of [r => { r.published.cache_invalidation.revision = before.updated_at; },
      r => { r.published.cache_invalidation.edge_purge_requested.status = 500; }]) {
      const drift = structuredClone(recovered); mutate(drift.receipt); writes.length = 0;
      await assert.rejects(verifyNativeRecoveredSaved(prepared, drift, context), /cache delivery/); assert.deepEqual(writes, []);
    }
    if (mode === "publish") for (const drift of [null, { status: "issued" }, { github_run_id: 38066380587 }, { github_run_attempt: 2 },
      { task_id: "other" }, { action_id: "other" }, { candidate_version: "other" }, { operation: "rollback" },
      { saved_id: prepared.registry.entries[0].recordId }, { saved_updated_at: before.updated_at }]) {
      writes.length = 0;
      await assert.rejects(verifyNativeRecoveredSaved(prepared, recovered, { ...context, dependencies: { ...deps,
        readPermit: permitId => drift === null ? null : completedFromDatabase(entry, permitId, originalIdentity, recovery.savedUpdatedAt, drift) } }), /completed permit tuple/);
      assert.deepEqual(writes, []);
    }
  }
  assert.equal(JSON.stringify(recovered.receipt), originalBytes);
});

test("two-recovery orchestration rejects missing hook, wrong kitchen proof and changed renovation CAS before new permit issuance", async () => {
  await syntheticFixture(async ({ registry, read }) => {
    let summary; const events = []; let active;
    const deps = { now: Date.now, saveSummary: value => { summary = structuredClone(value); }, savePermit: () => assert.fail("no new permit"),
      assertReadback: () => {}, verifyCompleted: entry => { events.push(`recover:${entry.slug}`); return fixedRecoveryResult(entry, "publish"); },
      preview: async entry => { active = entry; events.push(`preview:${entry.slug}`); },
      readPreview: entry => Object.fromEntries(Object.entries(registry.actualPreviews.find(p => p.target === entry.target).artifacts).map(([key, pin]) => [key, read(pin)])),
      readCurrent: async entry => ({ ...beforeRows.get(entry.target), updated_at: savedTime }),
      verifyIdentity: () => assert.fail("drift cannot reach new issuer identity"), issue: () => assert.fail("drift cannot issue"), publish: () => assert.fail("drift cannot write") };
    await assert.rejects(runFrozenBatch(registry, "publish", environment, { ...deps, verifyCompleted: undefined }, binding), /requires exact builtin and kitchen/);
    assert.deepEqual(events, []);
    for (const drift of [{ priorRunId: 38066380587 }, { permitId: "14ae24de-f39a-44cb-9dde-4d1a4a399edc" },
      { savedUpdatedAt: savedTime }, { privatePermitReadback: false }, { currentPublicReadbackVerified: false }, { currentPublicReadbackSha256: "bad" }]) {
      events.length = 0;
      await assert.rejects(runFrozenBatch(registry, "publish", environment, { ...deps, verifyCompleted: entry => {
        events.push(`recover:${entry.slug}`); return { ...fixedRecoveryResult(entry, "publish"), ...(entry.slug === "kitchen" ? drift : {}) };
      } }, binding), /Exact original Saved recovery/);
      assert.deepEqual(events, ["recover:builtin", "recover:kitchen"]);
      assert.equal(summary.rows[2].status, "NOT_STARTED");
    }
    events.length = 0;
    await assert.rejects(runFrozenBatch(registry, "publish", environment, deps, binding), /QA|Fresh preview/);
    assert.equal(active.slug, "renovation"); assert.deepEqual(events, ["recover:builtin", "recover:kitchen", "preview:renovation"]);
    assert.equal(summary.rows[2].status, "FAILED_STOPPED"); assert(!summary.rows[2].permitId);
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
