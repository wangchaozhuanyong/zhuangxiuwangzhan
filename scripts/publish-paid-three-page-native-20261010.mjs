// Fixed three-page preparation. The pinned manifest deliberately stops until real preview/QA is frozen.
import { readFileSync, lstatSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, relative, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lockedPaidThreePageCandidates } from "./managed-cms-targets-paid-three-page-v1.mjs";
import { stableDigest } from "./publish-content-trust-fixes.mjs";
import { NATIVE_THREE_BATCH, NATIVE_THREE_APPROVAL_ID, NATIVE_THREE_TARGETS,
  assertActualPreview, assertActualPublish, runFrozenCommand, sanitizePublisherDiagnostic } from "./publish-remaining-completion-20261009.mjs";
import { pgEpochMicros } from "../supabase/functions/content-publish/managed-timestamp.ts";

export const INPUT_DIRECTORY = "drafts/publishing/fc-20261010-paid-three-page-native-20261010";
export const INPUT_MANIFEST_PATH = `${INPUT_DIRECTORY}/frozen-inputs.json`;
export const INPUT_MANIFEST_SHA256 = "8100e82337b4b442e241b6fe4a7a89ace69eb0c80c18470a55873914032d0651";
export const SAVED_RECOVERY_PATH = `${INPUT_DIRECTORY}/recovery-38066380587.json`;
export const SAVED_RECOVERY_SHA256 = "5cd7e765b7fcbd6d71488734c58ba791b9c33950d8e6943904dea9d4db08a36c";
export const KITCHEN_RECOVERY_PATH = `${INPUT_DIRECTORY}/recovery-38069295075.json`;
export const KITCHEN_RECOVERY_SHA256 = "9393f2d9ac85ce8afbd222d306f059e7fcccc877a3c92076a003d32e819bf360";
const WORKFLOW_REF = "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assert = (condition, message) => { if (!condition) throw Error(message); };
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => stableDigest(left) === stableDigest(right);
const project = (row, fields) => Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));

export function readNativePinnedJson(proof) {
  assert(typeof proof?.path === "string" && proof.path.startsWith("drafts/publishing/")
    && relative(root, resolve(root, proof.path)) === proof.path && !proof.path.split("/").includes("..")
    && /^[0-9a-f]{64}$/.test(proof.sha256 || "") && !/^0+$/.test(proof.sha256), "Native evidence path or SHA is invalid");
  let current = root;
  const parts = proof.path.split("/");
  for (let i = 0; i < parts.length; i += 1) {
    current = join(current, parts[i]); const stat = lstatSync(current);
    assert(!stat.isSymbolicLink() && (i === parts.length - 1 ? stat.isFile() : stat.isDirectory()), "Native evidence symlink or file type is invalid");
  }
  const bytes = readFileSync(current);
  assert(hash(bytes) === proof.sha256, "Native frozen evidence hash differs");
  return JSON.parse(bytes.toString("utf8"));
}

// Contract tests use explicit synthetic input readers; production uses only the pinned filesystem reader.
export function validateNativeInputs(manifest, readProof = readNativePinnedJson) {
  assert(manifest.schemaVersion === 1 && manifest.batch === NATIVE_THREE_BATCH
    && manifest.authorizationId === NATIVE_THREE_APPROVAL_ID && manifest.site === "https://flashcast.com.my"
    && ["WAIT_REAL_PREVIEW_AND_QA", "READY_REAL_PREVIEW_QA"].includes(manifest.state)
    && same(manifest.entries.map((entry) => entry.target), NATIVE_THREE_TARGETS)
    && manifest.sourceAuthorityPins.length === 16 && manifest.sourceAuthorityPins.every((pin) => /^[0-9a-f]{64}$/.test(pin.sha256)),
  "Native prepared input identity, exact targets or provenance differs");
  for (const entry of manifest.entries) {
    const locked = lockedPaidThreePageCandidates[entry.target];
    assert(entry.sourceCandidatePath === locked.sourceCandidatePath && entry.sourceCandidateSha256 === locked.sourceCandidateSha256
      && entry.baselinePath === `${INPUT_DIRECTORY}/${locked.slug}.before-public.json`
      && entry.expectedUpdatedAt === locked.expectedUpdatedAt && entry.baselineFieldsSha256 === locked.baselineFieldsSha256
      && entry.retainedFieldsSha256 === locked.retainedFieldsSha256 && entry.desiredFieldsSha256 === locked.desiredFieldsSha256
      && entry.rollbackFieldsSha256 === locked.rollbackFieldsSha256 && entry.baselineFieldCount === 30
      && entry.retainedFieldCount === locked.retainedProjectionFields.length && entry.changedFieldCount === locked.changedFields.length
      && same(entry.revisionFields, ["updated_at", "version"]), "Native prepared exact field/CAS binding differs");
    const source = readProof({ path: entry.sourceCandidatePath, sha256: entry.sourceCandidateSha256 });
    assert(source.task_id === locked.taskId && source.candidate_version === locked.candidateVersion, "Native typed source identity differs");
    const before = readProof({ path: entry.baselinePath, sha256: entry.baselineSha256 });
    assert(same(Object.keys(before).sort(), [...locked.baselineProjectionFields].sort())
      && before.updated_at === locked.expectedUpdatedAt && before.id === locked.recordId && before.slug === locked.slug
      && stableDigest(project(before, locked.baselineProjectionFields)) === locked.baselineFieldsSha256
      && stableDigest(project(before, locked.retainedProjectionFields)) === locked.retainedFieldsSha256
      && stableDigest(project(before, locked.changedFields)) === locked.rollbackFieldsSha256, "Native prepared public baseline/CAS differs");
    assert(source.expected_native_version === before.version && same(source.expected_changed_fields, locked.changedFields)
      && source.request.contentType === "service" && source.request.mode === "dry-run" && source.request.nextStatus === "published"
      && source.request.expectedUpdatedAt === locked.expectedUpdatedAt, "Native original typed version/operation differs");
  }
  return manifest;
}

export function validateNativeRegistry(registry, manifest, readProof = readNativePinnedJson) {
  assert(manifest.state === "READY_REAL_PREVIEW_QA", "FAIL_CLOSED_NOT_READY: real native previews and independent QA are not frozen");
  assert(registry.schemaVersion === 1 && registry.batch === NATIVE_THREE_BATCH && registry.allowedOperation === "publish"
    && registry.authorization.id === NATIVE_THREE_APPROVAL_ID && registry.repositoryId === 1248188229
    && registry.workflowRef === WORKFLOW_REF && registry.site === manifest.site && registry.maximumPermitLifetimeSeconds === 900
    && registry.executionDecision.departmentControllerReviewClaimed === false
    && /^[A-Za-z0-9_.:-]{8,180}$/.test(registry.executionDecision.id)
    && /^[A-Za-z0-9_.:-]{8,180}$/.test(registry.executionDecision.policyDecisionId)
    && registry.preparedEntriesSha256 === stableDigest(manifest.entries)
    && same(registry.entries.map((entry) => entry.target), NATIVE_THREE_TARGETS)
    && registry.sourceQaCount === 3 && registry.sourceQaReceipts.length === 3
    && new Set(registry.sourceQaReceipts.map((proof) => proof.id)).size === 3
    && registry.actualPreviews.length === 3 && same(registry.actualPreviews.map((proof) => proof.target), NATIVE_THREE_TARGETS),
  "Native registry requires exact three rows, independent authorization and real review/preview closure");
  for (const entry of registry.entries) {
    const locked = lockedPaidThreePageCandidates[entry.target];
    assert(same(Object.fromEntries(Object.keys(locked).map((key) => [key, entry[key]])), locked), "Native registry target differs from locked publisher binding");
    const prepared = manifest.entries.find((row) => row.target === entry.target);
    const current = readProof({ path: prepared.baselinePath, sha256: prepared.baselineSha256 });
    assert(entry.qaProofs.length === 1 && entry.qaReceiptId === entry.qaProofs[0].receiptId
      && same(entry.qaProofs[0].coverageFields, entry.changedFields), "Native exact independent QA field coverage differs");
    const proof = entry.qaProofs[0]; const qaSource = registry.sourceQaReceipts.find((qa) => qa.id === proof.receiptId);
    assert(qaSource && qaSource.path === proof.path && qaSource.sha256 === proof.sha256
      && proof.path === `${INPUT_DIRECTORY}/qa/${entry.slug}.json`, "Native independent QA source pin differs");
    const qa = readProof(qaSource);
    const preview = registry.actualPreviews.find((item) => item.target === entry.target);
    const environment = preview.environment;
    assert(environment.PUBLISH_TARGET === entry.target && environment.MANAGED_OPERATION === "publish"
      && environment.GITHUB_REF === "refs/heads/main" && environment.GITHUB_REPOSITORY === "wangchaozhuanyong/zhuangxiuwangzhan"
      && String(environment.GITHUB_REPOSITORY_ID) === "1248188229" && environment.GITHUB_WORKFLOW_REF === WORKFLOW_REF
      && environment.GITHUB_EVENT_NAME === "workflow_dispatch" && /^[0-9a-f]{40}$/.test(environment.GITHUB_SHA || "")
      && [environment.GITHUB_ACTOR_ID, environment.GITHUB_RUN_ID, environment.GITHUB_RUN_ATTEMPT].every((value) => /^[1-9][0-9]*$/.test(String(value)) && Number.isSafeInteger(Number(value))),
    "Native actual preview must bind the exact current main workflow dispatch");
    assert(preview.workflowReceipt.path === `${INPUT_DIRECTORY}/previews/${entry.slug}/workflow-run.json`, "Native workflow receipt path differs");
    const run = readProof(preview.workflowReceipt);
    assert(run.status === "completed" && run.conclusion === "success" && run.event === "workflow_dispatch"
      && run.workflowId === 351424533 && run.repositoryId === 1248188229 && run.workflowRef === WORKFLOW_REF
      && run.workflowSha === environment.GITHUB_SHA && run.runId === Number(environment.GITHUB_RUN_ID)
      && run.runAttempt === Number(environment.GITHUB_RUN_ATTEMPT) && run.actorId === Number(environment.GITHUB_ACTOR_ID)
      && run.mode === "dry-run" && run.target === entry.target && run.performedWrites === 0,
    "Native preview requires the exact successful protected workflow and zero-write run proof");
    const files = { backup: "backup.json", desired: "desired.json", receipt: "locked-dry-run-receipt.json", preview: "dry-run.json",
      payload: "managed-payload-digest.json", prior: "rollback-payload-digest.json", identity: "managed-identity-probe.json" };
    assert(same(Object.keys(preview.artifacts).sort(), Object.keys(files).sort()), "Native protected preview artifact closure differs");
    const artifacts = Object.fromEntries(Object.entries(files).map(([key, filename]) => {
      assert(preview.artifacts[key].path === `${INPUT_DIRECTORY}/previews/${entry.slug}/${filename}`, "Native actual preview artifact path differs");
      return [key, readProof(preview.artifacts[key])];
    }));
    assert(qa.qa_receipt_id === entry.qaReceiptId && qa.formal_qa_receipt_issued === true && qa.independently_reviewed === true
      && typeof qa.reviewer_task === "string" && qa.reviewer_task.length > 0 && typeof qa.producer_task === "string"
      && qa.producer_task.length > 0 && qa.reviewer_task !== qa.producer_task && qa.result === "PASS_EXACT_NATIVE_THREE_REVIEW"
      && proof.result === qa.result && qa.task_id === entry.taskId && qa.candidate_version === entry.candidateVersion
      && qa.action_id === entry.actionId && qa.current_updated_at === entry.expectedUpdatedAt
      && qa.current_baseline_sha256 === entry.baselineFieldsSha256 && proof.qaBaselineSha256 === entry.baselineFieldsSha256
      && same(proof.qaBaselineProjectionFields, entry.baselineProjectionFields)
      && qa.exact_payload_sha256 === entry.desiredFieldsSha256 && proof.reviewedPayloadSha256 === entry.desiredFieldsSha256
      && qa.actual_preview_receipt_sha256 === preview.artifacts.receipt.sha256,
    "Native formal independent QA must bind the actual protected preview, baseline and exact payload");
    // Reuse all real zero-write/CAS/identity guards; QA is reread by the same pinned production path.
    assertActualPreview(entry, artifacts, current, environment);
  }
  return registry;
}

export function readNativeRegistry() {
  const manifest = validateNativeInputs(readNativePinnedJson({ path: INPUT_MANIFEST_PATH, sha256: INPUT_MANIFEST_SHA256 }));
  assert(manifest.state === "READY_REAL_PREVIEW_QA" && manifest.readyRegistry?.path === `${INPUT_DIRECTORY}/registry.json`,
    "FAIL_CLOSED_NOT_READY: real native previews and independent QA are not frozen");
  const registry = validateNativeRegistry(readNativePinnedJson(manifest.readyRegistry), manifest);
  const prepared = { registry, binding: { batch: NATIVE_THREE_BATCH, approvalId: NATIVE_THREE_APPROVAL_ID, sha256: manifest.readyRegistry.sha256 }, manifest };
  prepared.recovery = validateNativeRecovery(prepared);
  prepared.kitchenRecovery = validateNativeKitchenRecovery(prepared);
  return prepared;
}

export function assertNativeSavedPublic({ entry, receipt, saved }, before) {
  const published = receipt.published; const cache = published.cache_invalidation; const purge = cache?.edge_purge_requested;
  const priorTime = pgEpochMicros(before.updated_at); const savedTime = pgEpochMicros(saved.updated_at); const revisionTime = pgEpochMicros(cache?.revision);
  // Services use touch_updated_at, not the version-increment trigger attached to cms_* tables.
  assert(Number.isSafeInteger(before.version) && Number.isSafeInteger(saved.version)
    && saved.version === before.version && savedTime !== null && priorTime !== null && savedTime > priorTime
    && published.dry_run === false && published.content_type === "service" && published.action === "publish"
    && published.existing_id === entry.recordId && published.slug === entry.slug && published.status === "published"
    && Array.isArray(published.warnings) && published.warnings.length === 0 && cache?.ok === true && cache.strategy === "content-revision"
    && revisionTime !== null && revisionTime >= savedTime && purge?.ok === true && purge.attempted === true
    && purge.tag === "flashcast-public-html" && purge.status === 200,
  "Native exact completed permit, saved version or cache delivery differs; inspect actual write and never replay");
}

export function assertNativeSavedRevision(context, before) {
  assert(context.completed?.permitId === context.permitId, "Native exact completed permit differs; never replay");
  assertNativeSavedPublic(context, before);
}

export function validateNativeRecovery(prepared, readProof = readNativePinnedJson) {
  const recovery = readProof({ path: SAVED_RECOVERY_PATH, sha256: SAVED_RECOVERY_SHA256 });
  assert(recovery.schemaVersion === 1 && recovery.runId === 38066380587 && recovery.runAttempt === 1
    && recovery.workflowSha === "1b1909437c4de6e6c7764a416e92d6468276f23f" && recovery.actorId === 276684684
    && recovery.workflowId === 351424533 && recovery.batch === NATIVE_THREE_BATCH
    && recovery.registrySha256 === prepared.binding.sha256 && recovery.exactRecoveredTarget === NATIVE_THREE_TARGETS[0]
    && recovery.permitId === "14ae24de-f39a-44cb-9dde-4d1a4a399edc"
    && recovery.savedUpdatedAt === "2026-10-10T16:08:22.003433+00:00"
    && recovery.originalRunConclusion === "failure" && recovery.failureIsNotReclassified === true && recovery.maximumNewWrites === 2,
  "Native recovery must bind only the exact stopped run and its already Saved first row");
  const proofs = Object.fromEntries(Object.entries(recovery.proofs).map(([key, proof]) => [key, readProof(proof)]));
  assert(same(Object.keys(proofs).sort(), ["permitEvidence", "receipt", "summary", "workflow"]), "Native recovery evidence closure differs");
  const { workflow, summary, receipt, permitEvidence } = proofs;
  assert(workflow.runId === recovery.runId && workflow.runAttempt === recovery.runAttempt && workflow.headSha === recovery.workflowSha
    && workflow.actorId === recovery.actorId && workflow.workflowId === recovery.workflowId && workflow.mode === "publish"
    && workflow.status === "completed" && workflow.conclusion === "failure" && workflow.registrySha256 === recovery.registrySha256,
  "Native recovery original workflow identity differs");
  assert(summary.batch === NATIVE_THREE_BATCH && summary.mode === "publish" && summary.registrySha256 === recovery.registrySha256
    && same(summary.rows.map(row => row.target), NATIVE_THREE_TARGETS) && summary.stoppedAt === recovery.exactRecoveredTarget
    && summary.rows[0].status === "FAILED_STOPPED" && summary.rows[0].performedWrite === null
    && summary.rows[0].failedAt === "PERMIT_ISSUED" && summary.rows[0].permitId === recovery.permitId
    && summary.rows.slice(1).every(row => row.status === "NOT_STARTED" && row.performedWrite === false && !row.permitId),
  "Native recovery may skip only the verified first Saved row, never unknown or additional writes");
  const entry = prepared.registry.entries[0];
  assert(permitEvidence.issued.permitId === recovery.permitId && permitEvidence.issued.status === "issued"
    && permitEvidence.issued.operation === "publish" && receipt.ok === true && receipt.target === entry.target
    && receipt.approvalId === NATIVE_THREE_APPROVAL_ID && receipt.published.ok === true
    && receipt.published.saved_id === entry.recordId && receipt.published.saved_updated_at === recovery.savedUpdatedAt
    && receipt.postcheck.ok === true && receipt.postcheck.rowMismatches.length === 0
    && same(receipt.postcheck.pageChecks.map(page => page.path), entry.publicPaths.map(page => page.path))
    && receipt.postcheck.pageChecks.every(page => page.status === 200 && page.found === true
      && page.forbiddenFound.length === 0 && page.missingRequired.length === 0), "Native recovery original Saved receipt differs");
  return { recovery, receipt };
}

export function validateNativeKitchenRecovery(prepared, readProof = readNativePinnedJson) {
  const recovery = readProof({ path: KITCHEN_RECOVERY_PATH, sha256: KITCHEN_RECOVERY_SHA256 });
  assert(recovery.schemaVersion === 1 && recovery.runId === 38069295075 && recovery.runAttempt === 1
    && recovery.workflowSha === "93716aaed5ef30ca209aa4a89db5230d47bd19fd" && recovery.actorId === 276684684
    && recovery.workflowId === 351424533 && recovery.batch === NATIVE_THREE_BATCH
    && recovery.registrySha256 === prepared.binding.sha256 && recovery.exactRecoveredTarget === NATIVE_THREE_TARGETS[1]
    && recovery.permitId === "cde7fc7d-2021-4f5a-97b6-47c79c736945"
    && recovery.savedUpdatedAt === "2026-10-10T16:51:33.869215+00:00"
    && recovery.originalRunConclusion === "failure" && recovery.failureIsNotReclassified === true && recovery.maximumNewWrites === 1
    && recovery.exactOriginalFailure === "RAW_ZH_KITCHEN_EXCERPT_MISSING_BEFORE_READABLE_BODY_REPAIR"
    && recovery.currentPublicReadbackRequired === true && recovery.officialArtifactId === 11676177171
    && recovery.officialArtifactDigest === "sha256:4d26c1dfbbecff17c5cf13c3bae3e20f541e6f207dd91d791dcf27ce299139e2",
  "Native kitchen recovery must bind only the exact failed public-check run and its already Saved row");
  const proofs = Object.fromEntries(Object.entries(recovery.proofs).map(([key, proof]) => [key, readProof(proof)]));
  assert(same(Object.keys(proofs).sort(), ["permitEvidence", "receipt", "summary", "workflow"]), "Native kitchen recovery evidence closure differs");
  const { workflow, summary, receipt, permitEvidence } = proofs; const entry = prepared.registry.entries[1];
  assert(workflow.runId === recovery.runId && workflow.runAttempt === recovery.runAttempt && workflow.headSha === recovery.workflowSha
    && workflow.actorId === recovery.actorId && workflow.workflowId === recovery.workflowId && workflow.mode === "publish"
    && workflow.status === "completed" && workflow.conclusion === "failure" && workflow.registrySha256 === recovery.registrySha256,
  "Native kitchen recovery original workflow identity differs");
  assert(summary.batch === NATIVE_THREE_BATCH && summary.mode === "publish" && summary.registrySha256 === recovery.registrySha256
    && same(summary.rows.map(row => row.target), NATIVE_THREE_TARGETS) && summary.stoppedAt === entry.target
    && summary.rows[0].status === "PUBLISH_RECOVERED" && summary.rows[0].performedWrite === false
    && summary.rows[0].priorRunId === 38066380587 && summary.rows[0].priorPermitId === "14ae24de-f39a-44cb-9dde-4d1a4a399edc"
    && summary.rows[0].savedUpdatedAt === "2026-10-10T16:08:22.003433+00:00"
    && summary.rows[1].status === "FAILED_STOPPED" && summary.rows[1].performedWrite === null
    && summary.rows[1].failedAt === "PERMIT_ISSUED" && summary.rows[1].permitId === recovery.permitId
    && summary.rows[2].status === "NOT_STARTED" && summary.rows[2].performedWrite === false && !summary.rows[2].permitId,
  "Native kitchen recovery cannot skip unknown writes or change the untouched renovation CAS");
  const evidence = permitEvidence.evidence;
  assert(permitEvidence.issued.permitId === recovery.permitId && permitEvidence.issued.status === "issued"
    && permitEvidence.issued.operation === "publish" && evidence.registrySha256 === prepared.binding.sha256
    && evidence.target === entry.target && evidence.entrySha256 === stableDigest(entry)
    && evidence.authorizationId === NATIVE_THREE_APPROVAL_ID
    && evidence.operationsDecisionId === prepared.registry.executionDecision.id
    && evidence.policyDecisionId === prepared.registry.executionDecision.policyDecisionId
    && same(evidence.identity, { repositoryId: 1248188229, workflowRef: WORKFLOW_REF, workflowSha: recovery.workflowSha,
      actorId: recovery.actorId, runId: recovery.runId, runAttempt: recovery.runAttempt })
    && evidence.actualPayloadSha256 === entry.desiredFieldsSha256 && evidence.actualPriorSha256 === entry.rollbackFieldsSha256
    && same(evidence.actualQa, entry.qaProofs.map(proof => ({ id: proof.receiptId, sha256: proof.sha256 }))),
  "Native kitchen recovery original authorization, source, QA or issuer evidence differs");
  // The immutable historical receipt remains failed. Only its precise known raw-summary gap is admissible.
  assert(receipt.ok === false && receipt.target === entry.target && receipt.published.ok === true
    && receipt.published.saved_id === entry.recordId && receipt.published.saved_updated_at === recovery.savedUpdatedAt
    && receipt.postcheck.ok === false && same(receipt.postcheck.rowMismatches, [])
    && same(receipt.postcheck.pageChecks.map(page => page.path), entry.publicPaths.map(page => page.path))
    && receipt.postcheck.pageChecks.every((page, index) => page.status === 200 && page.found === true
      && page.expected === entry.publicPaths[index].expected && same(page.forbiddenFound, [])
      && same(page.missingRequired, index === 0 ? [entry.desiredFields.excerpt_zh] : [])),
  "Native kitchen recovery historical failure differs; it must never be reclassified as success");
  return { recovery, receipt };
}

export async function verifyNativeRecoveredSaved(prepared, recovered, context) {
  const { entry, mode, dependencies, write, artifactRoot, environment } = context;
  const index = NATIVE_THREE_TARGETS.indexOf(entry.target);
  assert((index === 0 || index === 1) && recovered.recovery.exactRecoveredTarget === entry.target,
    "Only the exact previous builtin or kitchen Saved row can be recovered");
  const { recovery, receipt } = recovered;
  const source = prepared.manifest.entries[index];
  const before = readNativePinnedJson({ path: source.baselinePath, sha256: source.baselineSha256 });
  const saved = await dependencies.readCurrent(entry);
  assert(same(Object.keys(saved).sort(), Object.keys(before).sort()) && saved.updated_at === recovery.savedUpdatedAt
    && saved.id === entry.recordId && saved.slug === entry.slug && saved.status === "published"
    && stableDigest(project(saved, entry.changedFields)) === entry.desiredFieldsSha256
    && stableDigest(project(saved, entry.retainedProjectionFields)) === entry.retainedFieldsSha256,
  "Previously Saved public row drifted; no fresh permit or write may start");
  assertNativeSavedPublic({ entry, receipt, saved }, before);
  assert(typeof dependencies.readPublic === "function" && /^[0-9a-f]{40}$/.test(environment?.GITHUB_SHA || ""),
    "Native recovered row requires current public readback and exact source identity");
  const currentReadback = await dependencies.readPublic(entry);
  assert(currentReadback.pageChecks?.length === 2 && same(currentReadback.pageChecks.map(page => page.path), entry.publicPaths.map(page => page.path))
    && currentReadback.pageChecks.every((page, position) => page.status === 200 && page.found === true
      && page.expected === entry.publicPaths[position].expected && same(page.forbiddenFound, []) && same(page.missingRequired, [])),
  "Native recovered row current raw public title, required summary or forbidden content differs; no new permit may start");
  let completed = null;
  if (mode === "publish") {
    completed = await dependencies.readPermit(recovery.permitId);
    const originalIdentity = { repositoryId: 1248188229, workflowRef: WORKFLOW_REF, workflowSha: recovery.workflowSha,
      actorId: recovery.actorId, runId: recovery.runId, runAttempt: recovery.runAttempt };
    if (index === 0) assertActualPublish(entry, receipt, saved, completed, originalIdentity, NATIVE_THREE_APPROVAL_ID);
    else assert(completed?.permitId === recovery.permitId && completed.status === "completed" && completed.operation === "publish"
      && completed.taskId === entry.taskId && completed.actionId === entry.actionId && completed.candidateVersion === entry.candidateVersion
      && completed.githubRunId === originalIdentity.runId && completed.githubRunAttempt === originalIdentity.runAttempt
      && completed.savedId === entry.recordId && completed.savedUpdatedAt === saved.updated_at,
    "Native recovered kitchen exact original completed permit tuple differs; never replay");
    assertNativeSavedRevision({ entry, receipt, saved, completed, permitId: recovery.permitId }, before);
  }
  const publicProof = { schema: "native-recovered-current-public-readback/v1", target: entry.target,
    priorRunId: recovery.runId, originalReceiptSha256: recovery.proofs.receipt.sha256,
    currentSourceSha: environment.GITHUB_SHA, checkedAt: currentReadback.checkedAt,
    pageChecks: currentReadback.pageChecks, ok: true, performedWrite: false, failureIsNotReclassified: true };
  const publicProofBytes = `${JSON.stringify(publicProof, null, 2)}\n`;
  write(join(artifactRoot, entry.target, "current-public-readback.json"), publicProof);
  const result = { target: entry.target, priorRunId: recovery.runId, permitId: recovery.permitId,
    savedUpdatedAt: saved.updated_at, performedWrite: false, privatePermitReadback: mode === "publish",
    originalRunConclusion: "failure", originalReceiptSha256: recovery.proofs.receipt.sha256,
    publicRow: saved, completedPermit: completed, currentPublicReadbackVerified: true, currentPublicReadbackSha256: hash(publicProofBytes) };
  write(join(artifactRoot, entry.target, "recovered-completed-row.json"), result);
  return result;
}

export async function runNativeCommand() {
  assert(resolve(process.cwd()) === root, "Native batch must run from its owning Git project checkout");
  const prepared = readNativeRegistry();
  return runFrozenCommand({ registry: prepared.registry, binding: prepared.binding,
    verifyCompleted: (context) => verifyNativeRecoveredSaved(prepared,
      context.entry.target === NATIVE_THREE_TARGETS[0] ? prepared.recovery : prepared.kitchenRecovery, context),
    assertReadback: (context) => {
      const source = prepared.manifest.entries.find((entry) => entry.target === context.entry.target);
      assertNativeSavedRevision(context, readNativePinnedJson({ path: source.baselinePath, sha256: source.baselineSha256 }));
    } });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runNativeCommand().catch((error) => {
    console.error(sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Native batch failed",
      [process.env.CONTENT_PUBLISH_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.VITE_SUPABASE_ANON_KEY,
        process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN]) || "Native batch failed closed"); process.exitCode = 1;
  });
}
