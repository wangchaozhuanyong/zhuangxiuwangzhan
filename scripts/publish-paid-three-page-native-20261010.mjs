// Fixed three-page preparation. The pinned manifest deliberately stops until real preview/QA is frozen.
import { readFileSync, lstatSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, relative, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lockedPaidThreePageCandidates } from "./managed-cms-targets-paid-three-page-v1.mjs";
import { stableDigest } from "./publish-content-trust-fixes.mjs";
import { NATIVE_THREE_BATCH, NATIVE_THREE_APPROVAL_ID, NATIVE_THREE_TARGETS,
  assertActualPreview, runFrozenCommand, sanitizePublisherDiagnostic } from "./publish-remaining-completion-20261009.mjs";
import { pgEpochMicros } from "../supabase/functions/content-publish/managed-timestamp.ts";

export const INPUT_DIRECTORY = "drafts/publishing/fc-20261010-paid-three-page-native-20261010";
export const INPUT_MANIFEST_PATH = `${INPUT_DIRECTORY}/frozen-inputs.json`;
export const INPUT_MANIFEST_SHA256 = "8100e82337b4b442e241b6fe4a7a89ace69eb0c80c18470a55873914032d0651";
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
  return { registry, binding: { batch: NATIVE_THREE_BATCH, approvalId: NATIVE_THREE_APPROVAL_ID, sha256: manifest.readyRegistry.sha256 }, manifest };
}

export function assertNativeSavedRevision({ entry, receipt, saved, completed, permitId }, before) {
  const published = receipt.published; const cache = published.cache_invalidation; const purge = cache?.edge_purge_requested;
  const priorTime = pgEpochMicros(before.updated_at); const savedTime = pgEpochMicros(saved.updated_at); const revisionTime = pgEpochMicros(cache?.revision);
  assert(completed.permitId === permitId && Number.isSafeInteger(before.version) && Number.isSafeInteger(saved.version)
    && saved.version === before.version + 1 && savedTime !== null && priorTime !== null && savedTime > priorTime
    && published.dry_run === false && published.content_type === "service" && published.action === "publish"
    && published.existing_id === entry.recordId && published.slug === entry.slug && published.status === "published"
    && Array.isArray(published.warnings) && published.warnings.length === 0 && cache?.ok === true && cache.strategy === "content-revision"
    && revisionTime !== null && revisionTime >= savedTime && purge?.ok === true && purge.attempted === true
    && purge.tag === "flashcast-public-html" && purge.status === 200,
  "Native exact completed permit, saved version or cache delivery differs; inspect actual write and never replay");
}

export async function runNativeCommand() {
  assert(resolve(process.cwd()) === root, "Native batch must run from its owning Git project checkout");
  const prepared = readNativeRegistry();
  return runFrozenCommand({ registry: prepared.registry, binding: prepared.binding,
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
