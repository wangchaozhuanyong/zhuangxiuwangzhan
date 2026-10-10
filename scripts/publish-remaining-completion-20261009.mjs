// This single frozen owner-directed batch uses the existing permit issuer and protected writer.
// The HTTP issuer, target selectors, OIDC verification and single-use claim are unchanged.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, relative, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { targetConfigs, stableDigest, assertLockedServiceCandidate, assertLockedDryRunResult } from "./publish-content-trust-fixes.mjs";

export const BATCH_NAME = "remaining-completion-20261009";
export const REGISTRY_PATH = "drafts/publishing/fc-20261009-remaining-completion-v1/registry.json";
export const REGISTRY_SHA256 = "8dec1fa819f93602470e4cf236973431261b26330309b43469660f43689a82eb";
export const APPROVAL_ID = "owner-authorized-remaining-completion-20261009";
const WORKFLOW_REF = "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main";
const EXACT_TARGETS = [
  "v17-owner-publisher-native-preparation-v2-20261007", "v18-owner-publisher-native-preparation-v2-20261007",
  "design-body-faq-unified-20261009-v1", "bathroom-body-step-unified-20261009-v1", "kitchen-initial-framework-body-v1",
  ...Array.from({ length: 15 }, (_, i) => `c${String(i + 1).padStart(2, "0")}-bilingual-body-v1`),
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => stableDigest(left) === stableDigest(right);
const project = (row, fields) => Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const pinnedJson = (path, sha256) => {
  const bytes = readFileSync(path);
  assert(hash(bytes) === sha256, "Frozen reviewed evidence hash differs");
  return JSON.parse(bytes.toString("utf8"));
};

export function readFrozenRegistry(bytes = readFileSync(REGISTRY_PATH)) {
  assert(hash(bytes) === REGISTRY_SHA256, "Frozen batch registry hash differs");
  const registry = JSON.parse(bytes.toString("utf8"));
  assert(registry.schemaVersion === 1 && registry.batch === BATCH_NAME
    && registry.authorization.id === APPROVAL_ID && registry.allowedOperation === "publish"
    && registry.executionDecision.departmentControllerReviewClaimed === false
    && registry.repositoryId === 1248188229 && registry.workflowRef === WORKFLOW_REF
    && registry.maximumPermitLifetimeSeconds === 900
    && same(registry.entries.map((entry) => entry.target), EXACT_TARGETS)
    && registry.sourceQaCount === 22 && registry.sourceQaReceipts.length === 22
    && new Set(registry.entries.map((entry) => `${entry.table}:${entry.recordId}`)).size === 20,
  "Frozen batch identity, exact row list or authorization differs");
  const qaIds = new Set(registry.sourceQaReceipts.map((proof) => proof.id));
  assert(qaIds.size === 22, "Frozen batch requires 22 distinct actual scoped reviews");
  pinnedJson(registry.primarySourceProof.path, registry.primarySourceProof.sha256);
  for (const proof of registry.sourceQaReceipts) {
    assert(pinnedJson(proof.path, proof.sha256).qa_receipt_id === proof.id, "Actual QA receipt identity differs");
  }
  const referenced = new Set();
  for (const entry of registry.entries) {
    const locked = targetConfigs[entry.target]?.lockedCandidate;
    assert(locked && same(Object.fromEntries(Object.keys(entry).filter((key) => key in locked).map((key) => [key, entry[key]])),
      Object.fromEntries(Object.keys(entry).filter((key) => key in locked).map((key) => [key, locked[key]]))),
    "Frozen batch target differs from the protected CLI binding");
    assert(hash(readFileSync(entry.sourceCandidatePath)) === entry.sourceCandidateSha256,
      "Frozen batch native candidate hash differs");
    const fields = entry.qaProofs.flatMap((proof) => proof.coverageFields);
    assert(fields.length === entry.changedFields.length && new Set(fields).size === fields.length
      && same([...fields].sort(), [...entry.changedFields].sort()), "Actual QA does not cover every exact changed field once");
    for (const proof of entry.qaProofs) {
      assert(qaIds.has(proof.receiptId), "Unknown scoped QA receipt");
      const known = registry.sourceQaReceipts.find((item) => item.id === proof.receiptId);
      assert(known.path === proof.path && known.sha256 === proof.sha256, "Scoped QA reference differs");
      referenced.add(proof.receiptId);
    }
  }
  assert(referenced.size === 22, "Frozen batch must consume every actual scoped review");
  return registry;
}

export function assertBatchEnvironment(environment, mode, approvalId, checkoutSha) {
  assert(["dry-run", "publish"].includes(mode) && approvalId === APPROVAL_ID
    && environment.PUBLISH_TARGET === BATCH_NAME && environment.MANAGED_OPERATION === "publish"
    && environment.GITHUB_ACTIONS === "true" && environment.GITHUB_REF === "refs/heads/main"
    && environment.GITHUB_REPOSITORY === "wangchaozhuanyong/zhuangxiuwangzhan"
    && String(environment.GITHUB_REPOSITORY_ID) === "1248188229"
    && environment.GITHUB_WORKFLOW_REF === WORKFLOW_REF && environment.GITHUB_EVENT_NAME === "workflow_dispatch"
    && /^[0-9a-f]{40}$/.test(environment.GITHUB_SHA || "") && checkoutSha === environment.GITHUB_SHA
    && [environment.GITHUB_ACTOR_ID, environment.GITHUB_RUN_ID, environment.GITHUB_RUN_ATTEMPT]
      .every((value) => /^[1-9][0-9]*$/.test(String(value)) && Number.isSafeInteger(Number(value)))
    && environment.ACTIONS_ID_TOKEN_REQUEST_URL && environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN
    && !environment.MANAGED_PERMIT_ID && !environment.PARENT_RUN_ID,
  "Frozen batch requires its exact owner authorization and current main dispatch identity");
}

export function assertBatchIdentity(identity, environment) {
  assert(identity && identity.repositoryId === 1248188229 && identity.workflowRef === WORKFLOW_REF
    && identity.workflowSha === environment.GITHUB_SHA && identity.actorId === Number(environment.GITHUB_ACTOR_ID)
    && identity.runId === Number(environment.GITHUB_RUN_ID) && identity.runAttempt === Number(environment.GITHUB_RUN_ATTEMPT),
  "Actual verified OIDC identity differs from this current main run");
}

export function assertLiveVersionReceipt(receipt, expectedSha) {
  assert(receipt.httpStatus === 200 && /^[0-9a-f]{40}$/.test(expectedSha)
    && receipt.deploymentVersion === expectedSha && receipt.expectedSha === expectedSha,
  "The actual deployed website version must equal this current main workflow SHA before any preview or permit");
}

export function sanitizePublisherDiagnostic(stderr, secrets = []) {
  let safe = String(stderr || "");
  for (const secret of secrets.filter((value) => typeof value === "string" && value.length > 3)) safe = safe.split(secret).join("[REDACTED]");
  safe = safe.replace(/\b[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g, "[REDACTED]")
    .replace(/\b(?:Bearer|Basic)\s+\S+/gi, "[REDACTED]")
    .replace(/\b(?:token|secret|apikey|api_key|password|authorization)\s*[:=]\s*\S+/gi, "[REDACTED]")
    .replace(/https?:\/\/\S+/g, "[URL_REDACTED]");
  // Retain bounded plain-text failures only; never store raw JSON/HTML provider responses or stack traces.
  return safe.split(/\r?\n/).filter((line) => line && !/^\s*(?:at |[<{[])/.test(line))
    .map((line) => line.split(/[<{[]/, 1)[0].slice(0, 240)).filter(Boolean).slice(0, 4).join("\n").slice(0, 960);
}

export function assertQaForCurrent(entry, current) {
  const locked = targetConfigs[entry.target].lockedCandidate;
  assertLockedServiceCandidate(locked, current);
  assert(stableDigest(project(current, entry.changedFields)) === entry.rollbackFieldsSha256,
    "Current prior-field digest differs from the reviewed recovery snapshot");
  assert(stableDigest(project(current, entry.retainedProjectionFields)) === entry.retainedFieldsSha256,
    "Current retained fields differ from the reviewed baseline");
  for (const proof of entry.qaProofs) {
    const qa = pinnedJson(proof.path, proof.sha256);
    assert(qa.qa_receipt_id === proof.receiptId && qa.result === proof.result && qa.result.startsWith("PASS_")
      && qa.current_updated_at === entry.expectedUpdatedAt && proof.expectedUpdatedAt === entry.expectedUpdatedAt
      && qa.exact_payload_sha256 === proof.reviewedPayloadSha256
      && stableDigest(project(locked.desiredFields, proof.coverageFields)) === qa.exact_payload_sha256,
    "Actual scoped QA does not bind the exact current CAS and intended native fields");
    if (proof.qaBaselineSha256) {
      assert((qa.current_baseline_sha256 || qa.current_full_baseline_sha256) === proof.qaBaselineSha256
        && stableDigest(project(current, proof.qaBaselineProjectionFields)) === proof.qaBaselineSha256,
      "Actual scoped QA baseline differs from the current row");
    }
    if (proof.priorFieldsSha256) {
      assert(stableDigest(project(current, proof.coverageFields)) === proof.priorFieldsSha256,
        "Reviewed leaf append no longer starts from the actual current fields");
    }
    if (proof.leafAppendOnly) {
      for (const field of proof.coverageFields) {
        const before = current[field]; const after = locked.desiredFields[field];
        assert(Array.isArray(before) && Array.isArray(after) && before.length === after.length
          && typeof before[0]?.desc === "string" && typeof after[0]?.desc === "string"
          && after[0].desc.startsWith(before[0].desc) && after[0].desc.length > before[0].desc.length
          && same(after.map((step, index) => index === 0 ? { ...step, desc: before[0].desc } : step), before),
        "Reviewed process append changes another step, key or existing description");
      }
    }
  }
}

export function assertActualPreview(entry, artifacts, current, environment) {
  const locked = targetConfigs[entry.target].lockedCandidate;
  const desired = targetConfigs[entry.target].buildRecord(current);
  assertQaForCurrent(entry, current);
  assert(same(artifacts.backup.record, current) && same(artifacts.desired.record, desired),
    "Fresh preview backup or desired record differs from the actual current row");
  const receipt = artifacts.receipt;
  assert(receipt.task_id === entry.taskId && receipt.candidate_version === entry.candidateVersion
    && receipt.action_id === entry.actionId && receipt.scope === entry.scope && receipt.operation === "publish"
    && receipt.http_status === 200 && receipt.dry_run === true && receipt.performed_write === false
    && receipt.external_writes === 0 && receipt.row_unchanged_after_dry_run === true
    && receipt.expected_updated_at === entry.expectedUpdatedAt,
  "Fresh protected preview did not prove the exact zero-write action");
  assertLockedDryRunResult(locked, artifacts.preview, receipt.http_status, artifacts.backup.record, current, desired);
  assert(artifacts.payload.payload_sha256 === entry.desiredFieldsSha256
    && artifacts.payload.expected_updated_at === entry.expectedUpdatedAt
    && artifacts.prior.payload_sha256 === entry.rollbackFieldsSha256
    && artifacts.prior.baseline_fields_sha256 === entry.baselineFieldsSha256,
  "Fresh protected preview payload, baseline or prior digest differs");
  assert(artifacts.identity.ok === true && artifacts.identity.dry_run === true
    && artifacts.identity.performed_write === false, "Actual protected OIDC probe did not prove zero-write identity");
  assertBatchIdentity(artifacts.identity.identity, environment);
}

export function buildBatchPermit(entry, registry, identity, artifacts, now, permitId = randomUUID(), registrySha256 = REGISTRY_SHA256) {
  const evidence = { registrySha256, target: entry.target, entrySha256: stableDigest(entry),
    authorizationId: registry.authorization.id, operationsDecisionId: registry.executionDecision.id,
    policyDecisionId: registry.executionDecision.policyDecisionId, identity,
    actualPreviewSha256: stableDigest(artifacts.preview), actualPreviewReceiptSha256: stableDigest(artifacts.receipt),
    actualPayloadSha256: artifacts.payload.payload_sha256, actualPriorSha256: artifacts.prior.payload_sha256,
    actualQa: entry.qaProofs.map((proof) => ({ id: proof.receiptId, sha256: proof.sha256 })) };
  return { input: { permitId, taskId: entry.taskId, actionId: entry.actionId, actionClass: "cms_write", operation: "publish",
    scope: entry.scope, candidateVersion: entry.candidateVersion, recordId: entry.recordId, slug: entry.slug,
    expectedUpdatedAt: entry.expectedUpdatedAt, payloadSha256: entry.desiredFieldsSha256,
    rollbackPayloadSha256: entry.rollbackFieldsSha256, githubActorId: identity.actorId, githubWorkflowSha: identity.workflowSha,
    qaReceiptId: entry.qaReceiptId, operationsDecisionId: registry.executionDecision.id,
    policyDecisionId: registry.executionDecision.policyDecisionId, issuerEvidenceSha256: stableDigest(evidence),
    expiresAt: new Date(now + 10 * 60_000).toISOString() }, evidence };
}

export function assertActualPublish(entry, receipt, current, permit, identity) {
  assert(receipt.ok === true && receipt.target === entry.target && receipt.approvalId === APPROVAL_ID
    && receipt.published.ok === true && receipt.published.saved_id === entry.recordId
    && receipt.published.saved_updated_at && receipt.published.saved_updated_at !== entry.expectedUpdatedAt
    && current.updated_at === receipt.published.saved_updated_at
    && current.id === entry.recordId && current.slug === entry.slug && current.status === "published"
    && stableDigest(project(current, entry.changedFields)) === entry.desiredFieldsSha256
    && stableDigest(project(current, entry.retainedProjectionFields)) === entry.retainedFieldsSha256
    && receipt.postcheck.ok === true && receipt.postcheck.rowMismatches.length === 0
    && same(receipt.postcheck.pageChecks.map((page) => page.path), targetConfigs[entry.target].publicPaths.map((page) => page.path))
    && receipt.postcheck.pageChecks.length === 2 && receipt.postcheck.pageChecks.every((page) => page.status === 200
      && page.found === true && page.forbiddenFound.length === 0 && page.missingRequired.length === 0 && (!targetConfigs[entry.target].publicPaths.find((config) => config.path === page.path)?.renderedRequiredPhrases?.length || page.rendered?.ok === true))
    && permit?.status === "completed" && permit.operation === "publish"
    && permit.taskId === entry.taskId && permit.actionId === entry.actionId && permit.candidateVersion === entry.candidateVersion
    && permit.githubRunId === identity.runId && permit.githubRunAttempt === identity.runAttempt
    && permit.savedId === entry.recordId && permit.savedUpdatedAt === current.updated_at,
  "Actual publish, exact row readback, public pages or completed single-use permit did not verify");
}

// Dependencies isolate orchestration tests; the command uses only the implementations below.
export async function runFrozenBatch(registry, mode, environment, dependencies, binding = { batch: BATCH_NAME, sha256: REGISTRY_SHA256 }) {
  assert(["dry-run", "publish"].includes(mode), "Frozen batch accepts only dry-run or publish mode");
  const rows = registry.entries.map((entry) => ({ target: entry.target, status: "NOT_STARTED", performedWrite: false }));
  dependencies.saveSummary({ batch: binding.batch, mode, registrySha256: binding.sha256, rows });
  for (let index = 0; index < registry.entries.length; index += 1) {
    const entry = registry.entries[index]; const state = rows[index];
    try {
      state.status = "PREVIEW_STARTED";
      await dependencies.preview(entry);
      const artifacts = dependencies.readPreview(entry); const current = await dependencies.readCurrent(entry);
      assertActualPreview(entry, artifacts, current, environment);
      state.status = "PREVIEW_PASS";
      if (mode === "publish") {
        const identity = await dependencies.verifyIdentity(); assertBatchIdentity(identity, environment);
        const { input, evidence } = buildBatchPermit(entry, registry, identity, artifacts, dependencies.now(), randomUUID(), binding.sha256);
        state.permitId = input.permitId; state.status = "PERMIT_ISSUE_STARTED";
        const issued = await dependencies.issue(input);
        assert(issued.permitId === input.permitId && issued.status === "issued" && issued.operation === "publish",
          "Existing issuer did not issue the exact single-use permit");
        state.status = "PERMIT_ISSUED";
        dependencies.savePermit(entry, { issued, evidence });
        await dependencies.publish(entry, input.permitId);
        const receipt = dependencies.readPublished(entry); const saved = await dependencies.readCurrent(entry);
        const completed = await dependencies.readPermit(input.permitId);
        assertActualPublish(entry, receipt, saved, completed, identity);
        state.status = "PUBLISH_PASS"; state.performedWrite = true; state.savedUpdatedAt = saved.updated_at;
      }
      dependencies.saveSummary({ batch: binding.batch, mode, registrySha256: binding.sha256, rows });
    } catch (error) {
      state.failedAt = state.status; state.status = "FAILED_STOPPED";
      if (state.failedAt === "PERMIT_ISSUED") state.performedWrite = null;
      state.writeOutcome = state.failedAt === "PERMIT_ISSUE_STARTED" ? "NO_CMS_WRITE_REQUESTED_INSPECT_PERMIT_INSERT_RESULT"
        : state.permitId ? "INSPECT_ACTUAL_SINGLE_USE_PERMIT_AND_RECEIPT_DO_NOT_REPLAY" : "NO_PERMIT_ISSUED";
      dependencies.saveSummary({ batch: binding.batch, mode, registrySha256: binding.sha256, rows, stoppedAt: entry.target });
      throw error;
    }
  }
  return { batch: binding.batch, mode, rows, ok: true };
}

export async function runFrozenCommand(options = {}) {
  const args = process.argv.slice(2);
  assert(args.every((arg) => /^--(?:mode|artifact-dir)=/.test(arg)), "This command accepts only mode and an in-project audit directory");
  const mode = args.find((arg) => arg.startsWith("--mode="))?.slice(7) || "dry-run";
  const environment = process.env;
  const checkoutSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const binding = options.binding || { batch: BATCH_NAME, sha256: REGISTRY_SHA256 };
  assert(environment.PUBLISH_TARGET === binding.batch && [BATCH_NAME, "remaining-completion-after-37893433883", "remaining-completion-after-37898568406", "remaining-completion-after-37903094390", "remaining-completion-after-38037667102"].includes(binding.batch), "Frozen batch requires its exact owner authorization and current main dispatch identity; exact completion entry required");
  assertBatchEnvironment({ ...environment, PUBLISH_TARGET: BATCH_NAME }, mode, environment.APPROVAL_ID, checkoutSha);
  const registry = options.registry || readFrozenRegistry();
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  assert(resolve(process.cwd()) === root, "Frozen batch must run from its owning Git project checkout");
  const artifactRoot = resolve(args.find((arg) => arg.startsWith("--artifact-dir="))?.slice(15)
    || join(root, "audits", `content-publish-${environment.GITHUB_RUN_ID}`));
  assert(relative(root, artifactRoot) === `audits/content-publish-${environment.GITHUB_RUN_ID}`,
    "Frozen batch artifacts must belong to this exact in-project workflow run");
  assert(environment.VITE_SUPABASE_URL && new URL(environment.VITE_SUPABASE_URL).host === "rbsnyexjifounogswrjp.supabase.co"
    && environment.VITE_SUPABASE_ANON_KEY && environment.CONTENT_PUBLISH_SECRET,
  "Frozen batch requires the approved project's existing public and publisher credentials");
  if (mode === "publish") assert(environment.SUPABASE_SERVICE_ROLE_KEY, "Frozen issuer batch requires its existing protected service client credential");
  mkdirSync(artifactRoot, { recursive: true });
  const write = (path, value) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); };
  const versionUrl = new URL("/__flashcast/version", registry.site);
  versionUrl.searchParams.set("cms_batch_run", environment.GITHUB_RUN_ID);
  const versionResponse = await fetch(versionUrl, { cache: "no-store", headers: { "cache-control": "no-cache" } });
  const versionBody = await versionResponse.json().catch(() => null);
  const versionReceipt = { url: `${registry.site}/__flashcast/version`, checkedAt: new Date().toISOString(),
    httpStatus: versionResponse.status, deploymentVersion: /^[0-9a-f]{40}$/.test(versionBody?.deploymentVersion || "") ? versionBody.deploymentVersion : null,
    expectedSha: environment.GITHUB_SHA };
  write(join(artifactRoot, "deployment-version-receipt.json"), versionReceipt);
  assertLiveVersionReceipt(versionReceipt, environment.GITHUB_SHA);
  const targetDir = (entry) => join(artifactRoot, entry.target);
  const invoke = (entry, permitId) => {
    const childEnvironment = { ...environment }; delete childEnvironment.SUPABASE_SERVICE_ROLE_KEY;
    const result = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${entry.target}`,
      `--artifact-dir=${artifactRoot}`, ...(permitId ? ["--execute", `--approval-id=${APPROVAL_ID}`, `--managed-permit-id=${permitId}`] : [])],
    { cwd: root, env: childEnvironment, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
    write(join(targetDir(entry), `publisher-${permitId ? "publish" : "preview"}-stage.json`), {
      target: entry.target, stage: permitId ? "publish" : "preview", checkedAt: new Date().toISOString(),
      exitCode: result.status, signal: result.signal || null, processErrorCode: result.error?.code || null,
      diagnostic: sanitizePublisherDiagnostic(result.stderr, [environment.CONTENT_PUBLISH_SECRET, environment.SUPABASE_SERVICE_ROLE_KEY,
        environment.VITE_SUPABASE_ANON_KEY, environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN]),
    });
    assert(result.status === 0, `Protected ${permitId ? "publish" : "preview"} failed for ${entry.target}; inspect its audit artifacts and never replay a permit`);
  };
  let issuerClient;
  const existingIssuer = async () => {
    assert(mode === "publish", "A dry-run cannot load the service client or issue a permit");
    if (!issuerClient) {
      const { createClient } = await import("@supabase/supabase-js");
      issuerClient = createClient(environment.VITE_SUPABASE_URL, environment.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } });
    }
    return issuerClient;
  };
  const dependencies = {
    now: Date.now,
    saveSummary: (summary) => write(join(artifactRoot, "frozen-batch-summary.json"), summary),
    savePermit: (entry, evidence) => write(join(targetDir(entry), "batch-permit-evidence.json"), evidence),
    preview: (entry) => invoke(entry),
    publish: async (entry, permitId) => {
      invoke(entry, permitId);
      if (options.afterPublish) await options.afterPublish({ entry, write, artifactRoot });
    },
    readPreview: (entry) => {
      const dir = targetDir(entry);
      return { backup: readJson(join(dir, "backup.json")), desired: readJson(join(dir, "desired.json")),
        receipt: readJson(join(dir, "locked-dry-run-receipt.json")), preview: readJson(join(dir, "dry-run.json")),
        payload: readJson(join(dir, "managed-payload-digest.json")), prior: readJson(join(dir, "rollback-payload-digest.json")),
        identity: readJson(join(dir, "managed-identity-probe.json")) };
    },
    readPublished: (entry) => readJson(join(targetDir(entry), "publish-receipt.json")),
    readCurrent: async (entry) => {
      const url = new URL(`/rest/v1/${entry.table}`, environment.VITE_SUPABASE_URL);
      url.searchParams.set("id", `eq.${entry.recordId}`); url.searchParams.set("select", entry.baselineProjectionFields.join(","));
      url.searchParams.set("status", "eq.published"); url.searchParams.set("limit", "1");
      const response = await fetch(url, { cache: "no-store", headers: { apikey: environment.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${environment.VITE_SUPABASE_ANON_KEY}` } });
      assert(response.ok, "Current published CMS read failed"); const rows = await response.json();
      assert(Array.isArray(rows) && rows.length === 1, "Expected one exact current published CMS row"); return rows[0];
    },
    verifyIdentity: async () => {
      const url = new URL(environment.ACTIONS_ID_TOKEN_REQUEST_URL); url.searchParams.set("audience", "api://flashcast-managed-cms-publish");
      const response = await fetch(url, { headers: { Authorization: `Bearer ${environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` } });
      assert(response.ok, "Actual GitHub OIDC token request failed"); const result = await response.json();
      const { verifyGithubOidcToken } = await import("../supabase/functions/content-publish/github-oidc.ts");
      return verifyGithubOidcToken(result.value);
    },
    issue: async (input) => {
      const { issueManagedPermit } = await import("../supabase/functions/content-publish/permit-issuer.ts");
      return issueManagedPermit(await existingIssuer(), input);
    },
    readPermit: async (permitId) => {
      const { readManagedPermit } = await import("../supabase/functions/content-publish/permit-issuer.ts");
      return readManagedPermit(await existingIssuer(), permitId);
    },
  };
  if (options.beforeExecute) await options.beforeExecute({ mode, environment, dependencies, write, artifactRoot });
  const result = await runFrozenBatch(registry, mode, environment, dependencies, binding);
  console.log(JSON.stringify({ ok: result.ok, mode, batch: binding.batch, checkedRows: result.rows.length, artifactRoot }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runFrozenCommand().catch((error) => {
    const diagnostic = sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Frozen batch failed",
      [process.env.CONTENT_PUBLISH_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY,
        process.env.VITE_SUPABASE_ANON_KEY, process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN]);
    console.error(diagnostic || "Frozen batch failed; inspect bounded stage receipts"); process.exitCode = 1;
  });
}
