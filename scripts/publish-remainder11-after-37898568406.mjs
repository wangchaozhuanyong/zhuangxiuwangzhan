// One fixed forward remainder of two actual stopped runs. No arbitrary skip or permit replay.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFrozenRegistry, REGISTRY_SHA256, APPROVAL_ID, runFrozenCommand, sanitizePublisherDiagnostic } from "./publish-remaining-completion-20261009.mjs";
import { targetConfigs, stableDigest } from "./publish-content-trust-fixes.mjs";
import { assertCompletedRow } from "./publish-remainder18-after-37893433883.mjs";
import { verifyPublicPage, reviewedBodyPhrases, verifyCandidateTextContracts } from "./lib/publisher-public-readback.mjs";
import { samePgTimestamp } from "../supabase/functions/content-publish/managed-timestamp.ts";
export const REMAINDER11_NAME = "remaining-completion-after-37898568406";
export const REMAINDER11_PATH = "drafts/publishing/fc-20261009-remainder11-after-37898568406-v1/registry.json";
export const REMAINDER11_SHA256 = "dd214e8c986d6254ec482bc22eced703dc635b24cf46a4ca0d88748c58024517";
const assert = (condition, message) => { if (!condition) throw Error(message); };
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => stableDigest(left) === stableDigest(right);
const runs = [{ runId: 37893433883, releaseSha: "9f446c6fbe2348105549dae51293a27c3648abc9", outcome: "FAILED_STOPPED", actualCompletedRows: 2 },
  { runId: 37898568406, releaseSha: "15fdefac8abfed413e5f1d8ba6089420f53333fd", outcome: "FAILED_STOPPED", actualCompletedRows: 7 }];
export function assertNineCompletedPermit(entry, proof, permits, index) {
  const active = permits.filter((permit) => permit.status !== "revoked"); const permit = active[0]; const run = runs[index < 2 ? 0 : 1];
  assert(Number.isInteger(index) && index >= 0 && index < 9 && active.length === 1 && same(permit, proof.permit)
    && permit.status === "completed" && Number(permit.github_run_id) === run.runId && Number(permit.github_run_attempt) === 1
    && permit.github_workflow_sha === run.releaseSha && permit.task_id === entry.taskId && permit.action_id === entry.actionId
    && permit.candidate_version === entry.candidateVersion && permit.scope === entry.scope && permit.operation === "publish"
    && permit.action_class === "cms_write" && permit.record_id === entry.recordId && permit.slug === entry.slug
    && permit.saved_id === entry.recordId && samePgTimestamp(permit.saved_updated_at, proof.actualUpdatedAt)
    && samePgTimestamp(permit.expected_updated_at, entry.expectedUpdatedAt) && permit.parent_permit_id === null
    && permit.payload_sha256 === entry.desiredFieldsSha256 && permit.rollback_payload_sha256 === entry.rollbackFieldsSha256,
  "An exact completed permit changed, has residue or is duplicated; no remainder preview, permit or write allowed");
}
// Pure historical contract loading; the executable reader below still pins source.
export function readRemainder11HistoricalRegistry(bytes = readFileSync(REMAINDER11_PATH)) {
  assert(hash(bytes) === REMAINDER11_SHA256, "Frozen exact remainder11 registry hash differs");
  const binding = JSON.parse(bytes.toString("utf8")); const original = readFrozenRegistry();
  assert(binding.schemaVersion === 1 && binding.batch === REMAINDER11_NAME && binding.sourceRegistrySha256 === REGISTRY_SHA256
    && binding.sourceRegistryPath === "drafts/publishing/fc-20261009-remaining-completion-v1/registry.json"
    && binding.authorizationId === APPROVAL_ID && binding.executionDecision.departmentControllerReviewClaimed === false
    && same(binding.excludedCompletedTargets, original.entries.slice(0, 9).map((entry) => entry.target))
    && same(binding.remainingTargets, original.entries.slice(9).map((entry) => entry.target))
    && binding.remainingRowCount === 11 && binding.remainingQaCount === 11
    && binding.freshPermitReadRequiredBeforePublish === true && binding.dryRunPrivatePermitRead === false,
  "Only the fixed eleven c05 through c15 targets are admitted");
  const proofBytes = readFileSync(binding.completedProofPath);
  assert(hash(proofBytes) === binding.completedProofSha256, "Actual nine completed-row provenance hash differs");
  const proof = JSON.parse(proofBytes.toString("utf8"));
  assert(same(proof.stoppedRuns, runs) && proof.actualCompletedRows === 9 && proof.productionWrites === 0
    && proof.credentialsPersisted === false && proof.completed.length === 9
    && same(proof.completed.map((item) => item.target), binding.excludedCompletedTargets)
    && proof.completed.every((item) => item.permit.status === "completed" && item.freshBilingualReadback.length === 2
      && item.freshBilingualReadback.every((page) => page.ok === true))
    && proof.completed[1].originalPublisherStatus.receiptOk === false && proof.completed[1].originalPublisherStatus.savedOk === true
    && proof.completed[8].originalPublisherStatus.receiptOk === true && proof.completed[8].originalPublisherStatus.savedOk === true
    && proof.completed[8].originalPublisherStatus.originalRealBodyPostcheckOk === false
    && proof.completed[8].originalPublisherStatus.originalMissingRequired.length === 9,
  "Both actual stopped-run failures and their nine saved rows must remain truthful");
  const summaries = proof.stoppedRunSummaries;
  assert(summaries.length === 2 && summaries[0].runId === runs[0].runId && summaries[1].runId === runs[1].runId,
    "Both original stopped-run summaries must remain attached");
  for (const [index, snapshot] of summaries.entries()) {
    const rows = snapshot.summary.rows; const offset = index === 0 ? 0 : 2; const stopped = index === 0 ? 1 : 6;
    assert(snapshot.summary.mode === "publish" && same(rows.map((row) => row.target), original.entries.slice(offset).map((entry) => entry.target))
      && rows.slice(0, stopped).every((row) => row.status === "PUBLISH_PASS" && row.performedWrite === true)
      && rows[stopped].status === "FAILED_STOPPED" && rows[stopped].performedWrite === null
      && snapshot.summary.stoppedAt === original.entries[offset + stopped].target
      && rows.slice(stopped + 1).every((row) => row.status === "NOT_STARTED" && row.performedWrite === false),
    "Original failed summaries cannot be rewritten as a successful batch");
  }
  for (const [index, entry] of original.entries.slice(0, 9).entries()) {
    const completed = proof.completed[index]; assertCompletedRow(entry, completed, completed.publicCurrentProjection);
    assertNineCompletedPermit(entry, completed, [completed.permit], index);
  }
  const entries = original.entries.slice(9); const qaIds = new Set(entries.flatMap((entry) => entry.qaProofs.map((item) => item.receiptId)));
  assert(entries.length === 11 && qaIds.size === 11, "Fixed eleven QA coverage differs");
  return { binding, proof, original, registry: { ...original, batch: REMAINDER11_NAME, uniqueRows: 11,
    sourceQaCount: 11, sourceQaReceipts: original.sourceQaReceipts.filter((item) => qaIds.has(item.id)), entries,
    executionDecision: { ...original.executionDecision, ...binding.executionDecision } } };
}
export function assertRemainder11RendererSource(prepared) {
  for (const [file, sha256] of Object.entries(prepared.proof.sourceRendererSha256)) {
    assert(hash(readFileSync(file)) === sha256, "Completed-row renderer fingerprint differs; recheck before rebinding");
  }
}
export function readRemainder11Registry(bytes = readFileSync(REMAINDER11_PATH)) {
  const prepared = readRemainder11HistoricalRegistry(bytes);
  assertRemainder11RendererSource(prepared);
  return prepared;
}
export async function verifyNineBeforeRemainder11({ prepared, mode, readCurrent, readPermits, checkPage = verifyPublicPage, save }) {
  assert(["dry-run", "publish"].includes(mode), "Fixed remainder11 accepts only dry-run or publish");
  const receipt = { stoppedRuns: runs, actualCompletedRows: 9, mode, privatePermitRead: mode === "publish",
    currentRowsAndDomFresh: true, originalEvidenceReusedAsCurrent: false, checkedAt: new Date().toISOString(), rows: [], ok: false, productionWrites: 0 };
  try {
    for (const [index, entry] of prepared.original.entries.slice(0, 9).entries()) {
      const proof = prepared.proof.completed[index];
      const state = { target: entry.target, originRunId: runs[index < 2 ? 0 : 1].runId,
        stage: "READ_CURRENT_STARTED", permitId: proof.permit.permit_id, pages: [] };
      receipt.rows.push(state); receipt.failedTarget = entry.target; save(receipt);
      const row = await readCurrent(entry); assertCompletedRow(entry, proof, row);
      for (const qa of entry.qaProofs) assert(stableDigest(Object.fromEntries(qa.coverageFields.map((field) => [field, row[field] ?? null]))) === qa.reviewedPayloadSha256,
        "Completed exact QA fingerprint drifted; no preview, permit or write allowed");
      Object.assign(state, { stage: "CURRENT_ROW_AND_QA_PASS", actualUpdatedAt: row.updated_at,
        desiredSha256: entry.desiredFieldsSha256, retainedSha256: entry.retainedFieldsSha256, qaReceiptIds: entry.qaProofs.map((qa) => qa.receiptId) }); save(receipt);
      if (mode === "publish") { state.stage = "PRIVATE_PERMIT_READ_STARTED"; save(receipt); assertNineCompletedPermit(entry, proof, await readPermits(entry, proof), index); }
      state.permitStatus = mode === "publish" ? "FRESH_COMPLETED" : "FROZEN_COMPLETED_NOT_PRIVATELY_REFRESHED";
      for (const config of targetConfigs[entry.target].publicPaths) {
        state.stage = "PUBLIC_PAGE_STARTED"; receipt.failedPath = config.path; save(receipt);
        const lang = config.path.startsWith("/zh/") ? "zh" : "en";
        const page = await checkPage({ site: prepared.original.site, path: config.path, title: row[`seo_title_${lang}`], description: row[`seo_description_${lang}`],
          requiredText: index < 2 ? config.renderedRequiredPhrases || [config.expected]
            : reviewedBodyPhrases(targetConfigs[entry.target].lockedCandidate.desiredFields[`content_${lang}`]), headingsOnly: index < 2 && entry.table === "blog_posts" });
        state.pages.push(page); save(receipt); assert(page.ok === true, "Already saved bilingual metadata or actual visible body did not verify; no preview, permit or write allowed");
      }
      state.stage = "COMPLETED_ROW_GUARD_PASS"; delete receipt.failedPath; delete receipt.failedTarget; save(receipt);
    }
    receipt.ok = true; save(receipt); return receipt;
  } catch (error) { receipt.diagnostic = sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Nine-completed guard failed"); save(receipt); throw error; }
}
export async function runRemainder11Command() {
  assert(process.argv.slice(2).every((arg) => /^--(?:mode|artifact-dir)=/.test(arg)), "This command accepts only mode and an in-project audit directory");
  assert(process.env.PUBLISH_TARGET === REMAINDER11_NAME, "Only the fixed remainder11 entry is accepted; arbitrary skips are forbidden");
  const prepared = readRemainder11Registry();
  return runFrozenCommand({ registry: prepared.registry, binding: { batch: REMAINDER11_NAME, sha256: REMAINDER11_SHA256 },
    afterPublish: async ({ entry, write, artifactRoot }) => {
      const desired = targetConfigs[entry.target].lockedCandidate.desiredFields;
      const pages = []; const receipt = { target: entry.target, reviewedPayloadSha256: entry.desiredFieldsSha256, checkedAt: new Date().toISOString(), pages, ok: false, productionWrites: 0 };
      try {
        for (const config of targetConfigs[entry.target].publicPaths) {
          const lang = config.path.startsWith("/zh/") ? "zh" : "en";
          const baseline = JSON.parse(readFileSync(join(artifactRoot, entry.target, "desired.json"), "utf8")).record;
          const result = await verifyPublicPage({ site: prepared.original.site, path: config.path, title: baseline[`seo_title_${lang}`],
            description: baseline[`seo_description_${lang}`], requiredText: reviewedBodyPhrases(desired[`content_${lang}`]) });
          pages.push(result); write(join(artifactRoot, entry.target, "batch-rendered-body-postcheck.json"), receipt);
          assert(result.ok === true, "Newly saved exact body did not verify in the real public browser; inspect completed permit, never replay");
        }
        receipt.ok = true; write(join(artifactRoot, entry.target, "batch-rendered-body-postcheck.json"), receipt);
      } catch (error) { receipt.diagnostic = sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Visible body readback failed"); write(join(artifactRoot, entry.target, "batch-rendered-body-postcheck.json"), receipt); throw error; }
    },
    beforeExecute: async ({ mode, environment, dependencies, write, artifactRoot }) => {
      const contracts = await verifyCandidateTextContracts(prepared.registry.entries.flatMap((entry) => ["en", "zh"].map((language) => ({
        target: entry.target, language, content: targetConfigs[entry.target].lockedCandidate.desiredFields[`content_${language}`],
      }))));
      write(join(artifactRoot, "candidate-text-contract.json"), contracts);
      assert(contracts.checkedCandidates === 22 && contracts.ok === true, "Fixed eleven reviewed candidates differ from Chrome text semantics");
      return verifyNineBeforeRemainder11({ prepared, mode, readCurrent: dependencies.readCurrent,
        readPermits: async (entry, proof) => {
          assert(mode === "publish" && environment.SUPABASE_SERVICE_ROLE_KEY, "Dry-run cannot load private permit credentials");
          const url = new URL("/rest/v1/managed_cms_release_permits", environment.VITE_SUPABASE_URL);
          url.searchParams.set("select", Object.keys(proof.permit).join(",")); url.searchParams.set("task_id", `eq.${entry.taskId}`);
          url.searchParams.set("action_id", `eq.${entry.actionId}`); url.searchParams.set("candidate_version", `eq.${entry.candidateVersion}`);
          const response = await fetch(url, { method: "GET", cache: "no-store", headers: { apikey: environment.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}` }, signal: AbortSignal.timeout(20000) });
          assert(response.ok, "Exact completed permit readonly lookup failed"); const rows = await response.json();
          assert(Array.isArray(rows) && rows.length < 1000, "Completed permit read invalid/truncated"); return rows;
        }, save: (receipt) => write(join(artifactRoot, "completed-nine-rows-fresh-guard.json"), receipt) });
    } });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runRemainder11Command().catch((error) => {
  console.error(sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Fixed remainder11 failed",
    [process.env.CONTENT_PUBLISH_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.VITE_SUPABASE_ANON_KEY, process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN]));
  process.exitCode = 1;
});
