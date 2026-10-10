// One fixed forward remainder of three actual stopped runs. No arbitrary skip or permit replay.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFrozenRegistry, REGISTRY_SHA256, APPROVAL_ID, runFrozenCommand, sanitizePublisherDiagnostic } from "./publish-remaining-completion-20261009.mjs";
import { targetConfigs, stableDigest } from "./publish-content-trust-fixes.mjs";
import { assertCompletedRow, REMAINDER_SHA256 } from "./publish-remainder18-after-37893433883.mjs";
import { REMAINDER11_SHA256 } from "./publish-remainder11-after-37898568406.mjs";
import { verifyPublicPage, reviewedRenderedBodyPhrases, verifyCandidateTextContracts } from "./lib/publisher-public-readback.mjs";
import { deriveReviewedPublicMetadata, readReviewedPublicIdentity } from "./lib/publisher-reviewed-metadata.mjs";
import { samePgTimestamp } from "../supabase/functions/content-publish/managed-timestamp.ts";
export const REMAINDER9_NAME = "remaining-completion-after-37903094390";
export const REMAINDER9_PATH = "drafts/publishing/fc-20261009-remainder9-after-37903094390-v1/registry.json";
export const REMAINDER9_SHA256 = "d9c7dec224d23bd82ee62937b4a19ab563c40681e7f6605ae685f6f58c611475";
const assert = (condition, message) => { if (!condition) throw Error(message); };
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => stableDigest(left) === stableDigest(right);
const pipelineFiles = ["src/pages/BlogDetail.tsx", "src/lib/contentApi.ts", "src/i18n/displayLabels.ts", "src/lib/sanitizeHtml.ts", "src/lib/serviceOverviewHtml.ts", "src/lib/text.ts", "src/lib/recordUtils.ts"];
const rendererFiles = ["src/pages/BlogDetail.tsx", "src/lib/contentApi.ts", "src/backend/modules/cms/repository/publicContentRepository.ts", "src/pages/ServiceDetail.tsx", "src/hooks/usePublishedContent.ts", "functions/_middleware.ts", "functions/readablePublicBody.ts"];
const permitFields = ["permit_id", "task_id", "action_id", "action_class", "operation", "scope", "candidate_version", "record_id", "slug", "expected_updated_at", "payload_sha256", "rollback_payload_sha256", "parent_permit_id", "github_repository_id", "github_workflow_ref", "github_workflow_sha", "github_actor_id", "github_run_id", "github_run_attempt", "qa_receipt_id", "operations_decision_id", "policy_decision_id", "issuer_evidence_sha256", "issued_at", "expires_at", "status", "claimed_at", "writing_at", "completed_at", "saved_id", "saved_updated_at"];
const runs = [{ runId: 37893433883, releaseSha: "9f446c6fbe2348105549dae51293a27c3648abc9", outcome: "FAILED_STOPPED", actualCompletedRows: 2 },
  { runId: 37898568406, releaseSha: "15fdefac8abfed413e5f1d8ba6089420f53333fd", outcome: "FAILED_STOPPED", actualCompletedRows: 7 },
  { runId: 37903094390, releaseSha: "03e840c4b1aa91de1d12b309af364ca3dd985fe5", outcome: "FAILED_STOPPED", actualCompletedRows: 2 }];
export function assertElevenCompletedPermit(entry, proof, permits, index) {
  const active = permits.filter((permit) => permit.status !== "revoked"); const permit = active[0]; const run = runs[index < 2 ? 0 : index < 9 ? 1 : 2];
  assert(Number.isInteger(index) && index >= 0 && index < 11 && active.length === 1 && same(permit, proof.permit)
    && same(Object.keys(proof.permit).sort(), [...permitFields].sort())
    && proof.originRunId === run.runId && proof.originReleaseSha === run.releaseSha
    && permit.status === "completed" && Number(permit.github_run_id) === run.runId && Number(permit.github_run_attempt) === 1
    && permit.github_workflow_sha === run.releaseSha && permit.task_id === entry.taskId && permit.action_id === entry.actionId
    && permit.candidate_version === entry.candidateVersion && permit.scope === entry.scope && permit.operation === "publish"
    && permit.action_class === "cms_write" && permit.record_id === entry.recordId && permit.slug === entry.slug
    && permit.saved_id === entry.recordId && samePgTimestamp(permit.saved_updated_at, proof.actualUpdatedAt)
    && samePgTimestamp(permit.expected_updated_at, entry.expectedUpdatedAt) && permit.parent_permit_id === null
    && permit.payload_sha256 === entry.desiredFieldsSha256 && permit.rollback_payload_sha256 === entry.rollbackFieldsSha256,
  "An exact completed permit changed, has residue or is duplicated; no remainder preview, permit or write allowed");
}
export function readRemainder9Registry(bytes = readFileSync(REMAINDER9_PATH)) {
  assert(hash(bytes) === REMAINDER9_SHA256, "Frozen exact remainder9 registry hash differs");
  const binding = JSON.parse(bytes.toString("utf8")); const original = readFrozenRegistry();
  assert(binding.schemaVersion === 1 && binding.batch === REMAINDER9_NAME && binding.sourceRegistrySha256 === REGISTRY_SHA256
    && binding.sourceRegistryPath === "drafts/publishing/fc-20261009-remaining-completion-v1/registry.json"
    && binding.authorizationId === APPROVAL_ID && binding.executionDecision.departmentControllerReviewClaimed === false
    && binding.executionDecision.id === "owner-directed-remainder9-after-37903094390-v1"
    && binding.executionDecision.policyDecisionId === "exact-reviewed-remainder9-20261009-v1"
    && binding.completedProofPath === "drafts/publishing/fc-20261009-remainder9-after-37903094390-v1/completed-eleven-current-renderer-proof-20261010.json"
    && same(binding.excludedCompletedTargets, original.entries.slice(0, 11).map((entry) => entry.target))
    && same(binding.remainingTargets, original.entries.slice(11).map((entry) => entry.target))
    && binding.remainingRowCount === 9 && binding.remainingQaCount === 9
    && binding.freshPermitReadRequiredBeforePublish === true && binding.dryRunPrivatePermitRead === false,
  "Only the fixed nine c07 through c15 targets are admitted");
  const proofBytes = readFileSync(binding.completedProofPath);
  assert(hash(proofBytes) === binding.completedProofSha256, "Actual eleven completed-row provenance hash differs");
  const proof = JSON.parse(proofBytes.toString("utf8"));
  assertRemainder9CompletedProof(proof, original, binding);
  const completedQa = new Set(original.entries.slice(0, 11).flatMap((entry) => entry.qaProofs.map((qa) => qa.receiptId)));
  assert(completedQa.size === 13, "Eleven completed rows must retain all thirteen actual QA fingerprints");
  const entries = original.entries.slice(11); const qaIds = new Set(entries.flatMap((entry) => entry.qaProofs.map((item) => item.receiptId)));
  assert(entries.length === 9 && qaIds.size === 9, "Fixed nine QA coverage differs");
  return { binding, proof, original, registry: { ...original, batch: REMAINDER9_NAME, uniqueRows: 9,
    sourceQaCount: 9, sourceQaReceipts: original.sourceQaReceipts.filter((item) => qaIds.has(item.id)), entries,
    executionDecision: { ...original.executionDecision, ...binding.executionDecision } } };
}
export function assertRemainder9CompletedProof(proof, original, binding) {
  assert(proof.schemaVersion === 1 && same(proof.stoppedRuns, runs) && proof.actualCompletedRows === 11 && proof.productionWrites === 0
    && proof.actualQaCount === 13 && proof.browserReadbackStatus === "PREDEPLOY_LIVE_22_PAGES_PASS_CURRENT_EXECUTION_GUARD_REQUIRED"
    && proof.credentialsPersisted === false && proof.customerReads === 0 && proof.notifications === 0 && proof.completed.length === 11
    && same(proof.completed.map((item) => item.target), binding.excludedCompletedTargets)
    && proof.completed.every((item, index) => item.permit.status === "completed" && item.pass === true
      && same(item.qa, original.entries[index].qaProofs.map((qa) => ({ receiptId: qa.receiptId, expected: qa.reviewedPayloadSha256, actual: qa.reviewedPayloadSha256 })))
      && same(item.freshBilingualReadback.map((page) => page.path), targetConfigs[item.target].publicPaths.map((config) => config.path))
      && item.freshBilingualReadback.every((page) => page.ok === true && page.rawStatus === 200 && page.status === 200
        && page.ready === true && page.runtimeErrors === 0 && page.renderedOk === true && page.productionWrites === 0
        && page.requiredText.length > 0 && page.missingRequired.length === 0 && page.metadata.titleFound === true && page.metadata.descriptionMatches === true))
    && proof.completed[1].originalPublisherStatus.receiptOk === false && proof.completed[1].originalPublisherStatus.savedOk === true
    && proof.completed[8].originalPublisherStatus.receiptOk === true && proof.completed[8].originalPublisherStatus.savedOk === true
    && proof.completed[8].originalPublisherStatus.originalRealBodyPostcheckOk === false
    && proof.completed[8].originalPublisherStatus.originalMissingRequired.length === 9
    && proof.completed[10].originalPublisherStatus.receiptOk === true && proof.completed[10].originalPublisherStatus.savedOk === true
    && proof.completed[10].originalPublisherStatus.originalRealBodyPostcheckOk === false
    && proof.completed[10].originalPublisherStatus.originalMissingRequired.length === 12,
  "All three actual stopped-run failures and their eleven saved rows must remain truthful");
  const reviewBytes = readFileSync(proof.rendererReviewPath);
  assert(hash(reviewBytes) === proof.rendererReviewSha256, "Current candidate source review hash differs");
  const review = JSON.parse(reviewBytes.toString("utf8"));
  assert(review.kind === "CANDIDATE_LOCAL_REVIEW_WITH_PREDEPLOY_LIVE_GUARD" && review.candidateDeployed === false
    && /^[a-f0-9]{40}$/.test(review.candidateSha) && review.observedLiveSha === "2f055035d469c02833a8dd7025ddb8b2223c0b8c"
    && review.currentExecutionGuardRequired === true && review.productionWrites === 0
    && same(review.sourceRendererSha256, proof.sourceRendererSha256) && same(review.reviewedPipelineSourceSha256, proof.reviewedPipelineSourceSha256)
    && same(review.metadataSourceSha256, proof.metadataSourceSha256) && same(review.publicIdentity, proof.publicIdentity)
    && hash(readFileSync(review.originalCompletedProofPath)) === review.originalCompletedProofSha256
    && review.originalCompletedProofSha256 === "bc6ac21909e661f26f25b0a85fbee20b653b7f41e243b3b49f7457fbcdb13c63"
    && review.actualMapperContract.faithfulCandidates === 18 && review.actualMapperContract.pass === true
    && review.actualMapperContract.fixtureOnly === true && review.actualMapperContract.actualProductionAcceptance === false
    && same(review.actualMapperContract.pipelineSourceSha256, proof.reviewedPipelineSourceSha256)
    && review.currentLiveCompletedGuard.ok === true && review.currentLiveCompletedGuard.rows.length === 11
    && review.currentLiveCompletedGuard.rows.flatMap((row) => row.pages).length === 22,
  "Candidate review cannot be promoted to new-source live acceptance or overwrite the historical proof");
  assert(Object.keys(proof.metadataSourceSha256).length >= 9 && ["src/components/PageMeta.tsx", "src/i18n/brandIdentity.ts",
    "src/lib/siteSettingsApi.ts", "src/hooks/useSiteSettings.ts", "functions/_middleware.ts"].every((file) => file in proof.metadataSourceSha256),
  "Current exact identity/metadata source closure is required");
  for (const [file, sha256] of Object.entries(proof.metadataSourceSha256)) assert(hash(readFileSync(file)) === sha256,
    "Current exact metadata source fingerprint differs; recheck before any preview");
  const summaries = proof.stoppedRunSummaries;
  assert(summaries.length === 3 && same(summaries.map((item) => item.runId), runs.map((run) => run.runId)),
    "All three original stopped-run summaries must remain attached");
  for (const [index, snapshot] of summaries.entries()) {
    const rows = snapshot.summary.rows; const batch = ["remaining-completion-20261009", "remaining-completion-after-37893433883", "remaining-completion-after-37898568406"][index];
    const registrySha256 = [REGISTRY_SHA256, REMAINDER_SHA256, REMAINDER11_SHA256][index]; const offset = [0, 2, 9][index]; const stopped = [1, 6, 1][index];
    assert(snapshot.summary.batch === batch && snapshot.summary.registrySha256 === registrySha256 && snapshot.summary.mode === "publish" && same(rows.map((row) => row.target), original.entries.slice(offset).map((entry) => entry.target))
      && rows.slice(0, stopped).every((row) => row.status === "PUBLISH_PASS" && row.performedWrite === true)
      && rows[stopped].status === "FAILED_STOPPED" && rows[stopped].performedWrite === null
      && snapshot.summary.stoppedAt === original.entries[offset + stopped].target
      && rows.slice(stopped + 1).every((row) => row.status === "NOT_STARTED" && row.performedWrite === false),
    "Original failed summaries cannot be rewritten as a successful batch");
  }
  for (const [fingerprints, files] of [[proof.sourceRendererSha256, rendererFiles], [proof.reviewedPipelineSourceSha256, pipelineFiles]]) {
    assert(same(Object.keys(fingerprints).sort(), [...files].sort()), "Exact reviewed renderer source set differs");
    for (const [file, sha256] of Object.entries(fingerprints)) assert(hash(readFileSync(file)) === sha256,
      "Completed-row renderer fingerprint differs; recheck before rebinding");
  }
  for (const [index, entry] of original.entries.slice(0, 11).entries()) {
    const completed = proof.completed[index]; assertCompletedRow(entry, completed, completed.publicCurrentProjection);
    assertElevenCompletedPermit(entry, completed, [completed.permit], index);
  }
}
export async function verifyElevenBeforeRemainder9({ prepared, mode, readCurrent, readPermits, checkPage = verifyPublicPage, deriveBody = reviewedRenderedBodyPhrases,
  deriveMetadata = deriveReviewedPublicMetadata, publicIdentity = prepared.proof.publicIdentity, save }) {
  assert(["dry-run", "publish"].includes(mode), "Fixed remainder9 accepts only dry-run or publish");
  const receipt = { stoppedRuns: runs, actualCompletedRows: 11, mode, privatePermitRead: mode === "publish",
    currentRowsAndDomFresh: true, originalEvidenceReusedAsCurrent: false, checkedAt: new Date().toISOString(), rows: [], ok: false, productionWrites: 0 };
  try {
    for (const [index, entry] of prepared.original.entries.slice(0, 11).entries()) {
      const proof = prepared.proof.completed[index];
      const state = { target: entry.target, originRunId: runs[index < 2 ? 0 : index < 9 ? 1 : 2].runId,
        stage: "READ_CURRENT_STARTED", permitId: proof.permit.permit_id, pages: [] };
      receipt.rows.push(state); receipt.failedTarget = entry.target; save(receipt);
      const row = await readCurrent(entry); assertCompletedRow(entry, proof, row);
      for (const qa of entry.qaProofs) assert(stableDigest(Object.fromEntries(qa.coverageFields.map((field) => [field, row[field] ?? null]))) === qa.reviewedPayloadSha256,
        "Completed exact QA fingerprint drifted; no preview, permit or write allowed");
      Object.assign(state, { stage: "CURRENT_ROW_AND_QA_PASS", actualUpdatedAt: row.updated_at,
        desiredSha256: entry.desiredFieldsSha256, retainedSha256: entry.retainedFieldsSha256, qaReceiptIds: entry.qaProofs.map((qa) => qa.receiptId) }); save(receipt);
      if (mode === "publish") { state.stage = "PRIVATE_PERMIT_READ_STARTED"; save(receipt); assertElevenCompletedPermit(entry, proof, await readPermits(entry, proof), index); }
      state.permitStatus = mode === "publish" ? "FRESH_COMPLETED" : "FROZEN_COMPLETED_NOT_PRIVATELY_REFRESHED";
      for (const config of targetConfigs[entry.target].publicPaths) {
        state.stage = "PUBLIC_PAGE_STARTED"; receipt.failedPath = config.path; save(receipt);
        const lang = config.path.startsWith("/zh/") ? "zh" : "en";
        const expected = await deriveMetadata({ entry, row, language: lang, path: config.path, identity: publicIdentity });
        assert(same(expected.sourceSha256, prepared.proof.metadataSourceSha256), "Actual metadata source closure differs; no remainder work allowed");
        const page = await checkPage({ site: prepared.original.site, path: config.path, title: expected.raw.title, description: expected.raw.description,
          strictMetadata: true, hydratedMetadata: expected.hydrated,
          requiredText: index < 2 ? config.renderedRequiredPhrases || [config.expected]
            : await deriveBody({ entry, language: lang, row }), headingsOnly: index < 2 && entry.table === "blog_posts" });
        state.pages.push(page); save(receipt); assert(page.ok === true, "Already saved bilingual metadata or actual visible body did not verify; no preview, permit or write allowed");
      }
      state.stage = "COMPLETED_ROW_GUARD_PASS"; delete receipt.failedPath; delete receipt.failedTarget; save(receipt);
    }
    receipt.ok = true; save(receipt); return receipt;
  } catch (error) { receipt.diagnostic = sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Eleven-completed guard failed"); save(receipt); throw error; }
}
export async function runRemainder9Command() {
  assert(process.argv.slice(2).every((arg) => /^--(?:mode|artifact-dir)=/.test(arg)), "This command accepts only mode and an in-project audit directory");
  assert(process.env.PUBLISH_TARGET === REMAINDER9_NAME, "Only the fixed remainder9 entry is accepted; arbitrary skips are forbidden");
  const prepared = readRemainder9Registry();
  return runFrozenCommand({ registry: prepared.registry, binding: { batch: REMAINDER9_NAME, sha256: REMAINDER9_SHA256 },
    afterPublish: async ({ entry, write, artifactRoot }) => {
      const pages = []; const receipt = { target: entry.target, reviewedPayloadSha256: entry.desiredFieldsSha256, checkedAt: new Date().toISOString(), pages, ok: false, productionWrites: 0 };
      try {
        for (const config of targetConfigs[entry.target].publicPaths) {
          const lang = config.path.startsWith("/zh/") ? "zh" : "en";
          const baseline = JSON.parse(readFileSync(join(artifactRoot, entry.target, "desired.json"), "utf8")).record;
          const identity = await readReviewedPublicIdentity(process.env, prepared.proof.publicIdentity);
          const expected = await deriveReviewedPublicMetadata({ entry, row: baseline, language: lang, path: config.path, identity });
          assert(same(expected.sourceSha256, prepared.proof.metadataSourceSha256), "Actual post-publish metadata source changed");
          const result = await verifyPublicPage({ site: prepared.original.site, path: config.path, title: expected.raw.title,
            description: expected.raw.description, strictMetadata: true, hydratedMetadata: expected.hydrated,
            requiredText: await reviewedRenderedBodyPhrases({ entry, language: lang, row: baseline }) });
          pages.push(result); write(join(artifactRoot, entry.target, "batch-rendered-body-postcheck.json"), receipt);
          assert(result.ok === true, "Newly saved exact body did not verify in the real public browser; inspect completed permit, never replay");
        }
        receipt.ok = true; write(join(artifactRoot, entry.target, "batch-rendered-body-postcheck.json"), receipt);
      } catch (error) { receipt.diagnostic = sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Visible body readback failed"); write(join(artifactRoot, entry.target, "batch-rendered-body-postcheck.json"), receipt); throw error; }
    },
    beforeExecute: async ({ mode, environment, dependencies, write, artifactRoot }) => {
      const publicIdentity = await readReviewedPublicIdentity(environment, prepared.proof.publicIdentity);
      write(join(artifactRoot, "current-public-identity-receipt.json"), { checkedAt: new Date().toISOString(), productionWrites: 0,
        publicReadOnly: true, identity: publicIdentity, metadataSourceSha256: prepared.proof.metadataSourceSha256 });
      const contracts = { checkedAt: new Date().toISOString(), expectedCandidates: 18, fixtureOnly: true,
        livePageAcceptance: false, productionWrites: 0, ok: false, stage: "CANDIDATE_TEXT_CONTRACT_STARTED" };
      write(join(artifactRoot, "candidate-text-contract.json"), contracts);
      try {
        Object.assign(contracts, await verifyCandidateTextContracts(prepared.registry.entries.flatMap((entry) => ["en", "zh"].map((language) => ({
        target: entry.target, entry, language, row: targetConfigs[entry.target].buildRecord(JSON.parse(readFileSync(targetConfigs[entry.target].lockedCandidate.rollbackRecordPath, "utf8"))),
        })))), { stage: "CANDIDATE_TEXT_CONTRACT_CHECKED" });
        write(join(artifactRoot, "candidate-text-contract.json"), contracts);
        assert(contracts.checkedCandidates === 18 && contracts.ok === true && contracts.fixtureOnly === true && contracts.livePageAcceptance === false
          && contracts.productionWrites === 0 && same(contracts.rows.map((row) => [row.target, row.language]),
            prepared.registry.entries.flatMap((entry) => ["en", "zh"].map((language) => [entry.target, language])))
          && contracts.rows.every((row) => row.ok === true && row.actualProductPipeline === true
            && same(row.pipelineSourceSha256, prepared.proof.reviewedPipelineSourceSha256)), "Fixed nine reviewed candidates differ from Chrome text semantics");
        contracts.stage = "CANDIDATE_TEXT_CONTRACT_PASS"; write(join(artifactRoot, "candidate-text-contract.json"), contracts);
      } catch (error) {
        contracts.ok = false; contracts.stage = "CANDIDATE_TEXT_CONTRACT_FAILED";
        contracts.diagnostic = sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Candidate text contract failed");
        write(join(artifactRoot, "candidate-text-contract.json"), contracts); throw error;
      }
      return verifyElevenBeforeRemainder9({ prepared, mode, publicIdentity, readCurrent: dependencies.readCurrent,
        readPermits: async (entry, proof) => {
          assert(mode === "publish" && environment.SUPABASE_SERVICE_ROLE_KEY, "Dry-run cannot load private permit credentials");
          const url = new URL("/rest/v1/managed_cms_release_permits", environment.VITE_SUPABASE_URL);
          url.searchParams.set("select", Object.keys(proof.permit).join(",")); url.searchParams.set("task_id", `eq.${entry.taskId}`);
          url.searchParams.set("action_id", `eq.${entry.actionId}`); url.searchParams.set("candidate_version", `eq.${entry.candidateVersion}`);
          const response = await fetch(url, { method: "GET", cache: "no-store", headers: { apikey: environment.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}` }, signal: AbortSignal.timeout(20000) });
          assert(response.ok, "Exact completed permit readonly lookup failed"); const rows = await response.json();
          assert(Array.isArray(rows) && rows.length < 1000, "Completed permit read invalid/truncated"); return rows;
        }, save: (receipt) => write(join(artifactRoot, "completed-eleven-rows-fresh-guard.json"), receipt) });
    } });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runRemainder9Command().catch((error) => {
  console.error(sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Fixed remainder9 failed",
    [process.env.CONTENT_PUBLISH_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.VITE_SUPABASE_ANON_KEY, process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN]));
  process.exitCode = 1;
});
