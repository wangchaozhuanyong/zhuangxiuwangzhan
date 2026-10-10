// Fixed forward remainder of one actual stopped run. No arbitrary skip/resume input, no permit replay.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFrozenRegistry, REGISTRY_SHA256, APPROVAL_ID, runFrozenCommand, sanitizePublisherDiagnostic } from "./publish-remaining-completion-20261009.mjs";
import { targetConfigs, stableDigest } from "./publish-content-trust-fixes.mjs";
import { verifyPublicPage, reviewedBodyPhrases, verifyCandidateTextContracts } from "./lib/publisher-public-readback.mjs";
import { samePgTimestamp } from "../supabase/functions/content-publish/managed-timestamp.ts";
export const REMAINDER_NAME = "remaining-completion-after-37893433883";
export const REMAINDER_PATH = "drafts/publishing/fc-20261009-remainder18-after-37893433883-v1/registry.json";
export const REMAINDER_SHA256 = "b9b2b9dd0c9642cccb1993992545b34ad155bb7adcab3f854c72340dcdfedbd2";
const assert = (condition, message) => { if (!condition) throw Error(message); };
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => stableDigest(left) === stableDigest(right);
const project = (row, fields) => Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
// Pure historical contract loading; this is never an execution authorization.
export function readRemainderHistoricalRegistry(bytes = readFileSync(REMAINDER_PATH)) {
  assert(hash(bytes) === REMAINDER_SHA256, "Frozen exact remainder registry hash differs");
  const binding = JSON.parse(bytes.toString("utf8")); const original = readFrozenRegistry();
  assert(binding.schemaVersion === 1 && binding.batch === REMAINDER_NAME && binding.sourceRegistrySha256 === REGISTRY_SHA256
    && binding.sourceRegistryPath === "drafts/publishing/fc-20261009-remaining-completion-v1/registry.json"
    && binding.authorizationId === APPROVAL_ID && binding.executionDecision.departmentControllerReviewClaimed === false
    && same(binding.excludedCompletedTargets, original.entries.slice(0, 2).map((entry) => entry.target))
    && same(binding.remainingTargets, original.entries.slice(2).map((entry) => entry.target))
    && binding.remainingRowCount === 18 && binding.remainingQaCount === 20
    && binding.freshPermitReadRequiredBeforePublish === true && binding.dryRunPrivatePermitRead === false,
  "Exact stopped-run remainder identity differs");
  const proofBytes = readFileSync(binding.completedProofPath);
  assert(hash(proofBytes) === binding.completedProofSha256, "Actual completed-row provenance hash differs");
  const proof = JSON.parse(proofBytes.toString("utf8"));
  assert(proof.originalRunId === 37893433883 && proof.originalReleaseSha === "9f446c6fbe2348105549dae51293a27c3648abc9"
    && proof.originalRunOutcome === "FAILED_STOPPED" && proof.actualCompletedRows === 2 && proof.productionWrites === 0
    && proof.completed.length === 2 && same(proof.completed.map((item) => item.target), binding.excludedCompletedTargets)
    && proof.completed.every((item) => item.permit.status === "completed" && item.freshBilingualReadback.length === 2
      && item.freshBilingualReadback.every((page) => page.ok === true))
    && proof.completed[1].originalPublisherStatus.receiptOk === false
    && proof.completed[1].originalPublisherStatus.savedOk === true,
  "Actual stopped-run evidence must retain both saved rows and the original failed HTML postcheck");
  for (const entry of original.entries.slice(0, 2)) {
    const completed = proof.completed.find((item) => item.target === entry.target);
    assertCompletedRow(entry, completed, completed.publicCurrentProjection);
    assertCompletedPermits(entry, completed, [completed.permit]);
  }
  const entries = original.entries.slice(2); const qaIds = new Set(entries.flatMap((entry) => entry.qaProofs.map((item) => item.receiptId)));
  assert(entries.length === 18 && qaIds.size === 20, "Exact remainder QA coverage differs");
  return { binding, proof, original, registry: { ...original, batch: REMAINDER_NAME, uniqueRows: 18,
    sourceQaCount: 20, sourceQaReceipts: original.sourceQaReceipts.filter((item) => qaIds.has(item.id)), entries,
    executionDecision: { ...original.executionDecision, ...binding.executionDecision } } };
}
export function assertRemainderRendererSource(prepared) {
  for (const [file, sha256] of Object.entries(prepared.proof.sourceRendererSha256)) {
    assert(hash(readFileSync(file)) === sha256, "Completed-row renderer source fingerprint differs; review fresh rendering before rebinding");
  }
}
export function readRemainderRegistry(bytes = readFileSync(REMAINDER_PATH)) {
  const prepared = readRemainderHistoricalRegistry(bytes);
  assertRemainderRendererSource(prepared);
  return prepared;
}
export function assertCompletedRow(entry, proof, row) {
  assert(row.id === entry.recordId && row.slug === entry.slug && row.status === "published"
    && samePgTimestamp(row.updated_at, proof.actualUpdatedAt)
    && stableDigest(project(row, entry.changedFields)) === entry.desiredFieldsSha256
    && stableDigest(project(row, entry.retainedProjectionFields)) === entry.retainedFieldsSha256
    && proof.desiredFieldsSha256 === entry.desiredFieldsSha256 && proof.retainedFieldsSha256 === entry.retainedFieldsSha256,
  "An already completed exact row drifted; no remainder preview, permit or write is allowed");
}
export function assertCompletedPermits(entry, proof, permits) {
  const active = permits.filter((permit) => permit.status !== "revoked"); const permit = active[0];
  assert(active.length === 1 && permit && same(permit, proof.permit) && permit.status === "completed"
    && permit.github_run_id === 37893433883 && permit.github_run_attempt === 1
    && permit.github_workflow_sha === "9f446c6fbe2348105549dae51293a27c3648abc9"
    && permit.task_id === entry.taskId && permit.action_id === entry.actionId && permit.candidate_version === entry.candidateVersion
    && permit.record_id === entry.recordId && permit.slug === entry.slug && permit.saved_id === entry.recordId
    && samePgTimestamp(permit.saved_updated_at, proof.actualUpdatedAt)
    && samePgTimestamp(permit.expected_updated_at, entry.expectedUpdatedAt)
    && permit.payload_sha256 === entry.desiredFieldsSha256 && permit.rollback_payload_sha256 === entry.rollbackFieldsSha256,
  "The original exact completed permit changed, has residue or is duplicated; do not resume or replay");
}
export async function verifyCompletedBeforeRemainder({ prepared, mode, readCurrent, readPermits, checkPage = verifyPublicPage, save }) {
  assert(["dry-run", "publish"].includes(mode), "Exact remainder accepts only dry-run or publish");
  const receipt = { originalRunId: 37893433883, originalRunOutcome: "FAILED_STOPPED", mode,
    privatePermitRead: mode === "publish", currentRowsAndDomFresh: true, originalEvidenceReusedAsCurrent: false,
    checkedAt: new Date().toISOString(), rows: [], ok: false, productionWrites: 0 };
  try {
    for (const entry of prepared.original.entries.slice(0, 2)) {
      const proof = prepared.proof.completed.find((item) => item.target === entry.target);
      const state = { target: entry.target, stage: "READ_CURRENT_STARTED", permitId: proof.permit.permit_id, pages: [] };
      receipt.rows.push(state); receipt.failedTarget = entry.target; save(receipt);
      const row = await readCurrent(entry);
      assertCompletedRow(entry, proof, row);
      Object.assign(state, { stage: "CURRENT_ROW_PASS", actualUpdatedAt: row.updated_at, desiredSha256: entry.desiredFieldsSha256,
        retainedSha256: entry.retainedFieldsSha256 }); save(receipt);
      if (mode === "publish") { state.stage = "PRIVATE_PERMIT_READ_STARTED"; save(receipt); assertCompletedPermits(entry, proof, await readPermits(entry, proof)); }
      state.permitStatus = mode === "publish" ? "FRESH_COMPLETED" : "FROZEN_COMPLETED_NOT_PRIVATELY_REFRESHED";
      for (const config of targetConfigs[entry.target].publicPaths) {
        state.stage = "PUBLIC_PAGE_STARTED"; receipt.failedPath = config.path; save(receipt);
        const lang = config.path.startsWith("/zh/") ? "zh" : "en";
        const page = await checkPage({ site: prepared.original.site, path: config.path, title: row[`seo_title_${lang}`],
          description: row[`seo_description_${lang}`], requiredText: config.renderedRequiredPhrases || [config.expected],
          headingsOnly: entry.table === "blog_posts" });
        state.pages.push(page); save(receipt);
        assert(page.ok === true, "Already completed bilingual raw metadata or real visible content did not verify");
      }
      state.stage = "COMPLETED_ROW_GUARD_PASS"; delete receipt.failedPath; delete receipt.failedTarget; save(receipt);
    }
    receipt.ok = true; save(receipt); return receipt;
  } catch (error) { receipt.diagnostic = sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Completed guard failed"); save(receipt); throw error; }
}
export async function runRemainderCommand() {
  assert(process.argv.slice(2).every((arg) => /^--(?:mode|artifact-dir)=/.test(arg)), "This command accepts only mode and an in-project audit directory");
  assert(process.env.PUBLISH_TARGET === REMAINDER_NAME, "Only the fixed remainder18 entry is accepted; arbitrary skips are forbidden");
  const prepared = readRemainderRegistry();
  return runFrozenCommand({ registry: prepared.registry, binding: { batch: REMAINDER_NAME, sha256: REMAINDER_SHA256 },
    afterPublish: async ({ entry, write, artifactRoot }) => {
      const desired = targetConfigs[entry.target].lockedCandidate.desiredFields;
      const pages = []; const receipt = { target: entry.target, reviewedPayloadSha256: entry.desiredFieldsSha256,
        checkedAt: new Date().toISOString(), pages, ok: false, productionWrites: 0 };
      try {
        for (const config of targetConfigs[entry.target].publicPaths) {
          const lang = config.path.startsWith("/zh/") ? "zh" : "en";
          const baseline = JSON.parse(readFileSync(join(artifactRoot, entry.target, "desired.json"), "utf8")).record;
          const result = await verifyPublicPage({ site: prepared.original.site, path: config.path,
            title: baseline[`seo_title_${lang}`], description: baseline[`seo_description_${lang}`],
            requiredText: reviewedBodyPhrases(desired[`content_${lang}`]) });
          pages.push(result); write(join(artifactRoot, entry.target, "batch-rendered-body-postcheck.json"), receipt);
          assert(result.ok === true, "Newly saved exact body did not verify in the real public browser; inspect the completed permit, never replay");
        }
        receipt.ok = true; write(join(artifactRoot, entry.target, "batch-rendered-body-postcheck.json"), receipt);
      } catch (error) { receipt.diagnostic = sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Real visible body readback failed"); write(join(artifactRoot, entry.target, "batch-rendered-body-postcheck.json"), receipt); throw error; }
    },
    beforeExecute: async ({ mode, environment, dependencies, write, artifactRoot }) => {
      const contracts = await verifyCandidateTextContracts(prepared.registry.entries.flatMap((entry) => ["en", "zh"].map((language) => ({
        target: entry.target, language, content: targetConfigs[entry.target].lockedCandidate.desiredFields[`content_${language}`],
      }))));
      write(join(artifactRoot, "candidate-text-contract.json"), contracts);
      assert(contracts.checkedCandidates === 36 && contracts.ok === true, "Fixed reviewed candidate text differs from real Chrome text semantics; no preview, permit or write allowed");
      return verifyCompletedBeforeRemainder({
      prepared, mode, readCurrent: dependencies.readCurrent,
      readPermits: async (entry, proof) => {
        assert(mode === "publish" && environment.SUPABASE_SERVICE_ROLE_KEY, "Dry-run cannot load private permit credentials");
        const url = new URL("/rest/v1/managed_cms_release_permits", environment.VITE_SUPABASE_URL);
        url.searchParams.set("select", Object.keys(proof.permit).join(",")); url.searchParams.set("task_id", `eq.${entry.taskId}`);
        url.searchParams.set("action_id", `eq.${entry.actionId}`); url.searchParams.set("candidate_version", `eq.${entry.candidateVersion}`);
        const response = await fetch(url, { method: "GET", cache: "no-store", headers: { apikey: environment.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}` }, signal: AbortSignal.timeout(20000) });
        assert(response.ok, "Original completed permit readonly lookup failed"); const rows = await response.json();
        assert(Array.isArray(rows) && rows.length < 1000, "Original permit read is invalid or truncated"); return rows;
      }, save: (receipt) => write(join(artifactRoot, "completed-rows-fresh-guard.json"), receipt),
      });
    } });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runRemainderCommand().catch((error) => {
  console.error(sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Exact remainder failed",
    [process.env.CONTENT_PUBLISH_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.VITE_SUPABASE_ANON_KEY, process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN]));
  process.exitCode = 1;
});
