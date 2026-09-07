import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (file) => JSON.parse(readFileSync(file, "utf8"));
const save = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
const requireSha = (sha) => assert.match(sha || "", /^[a-f0-9]{40}$/, "A full source SHA is required");

export function inventory(directory, prefix = "") {
  return readdirSync(directory).sort().flatMap((name) => {
    const file = path.join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    const stat = lstatSync(file);
    assert(!stat.isSymbolicLink(), `Symlinks are forbidden: ${relative}`);
    if (stat.isDirectory()) return inventory(file, relative);
    assert(stat.isFile(), `Only regular files are allowed: ${relative}`);
    return [{ path: relative, bytes: stat.size, sha256: sha256(readFileSync(file)) }];
  });
}

export function freeze(directory, sourceSha) {
  requireSha(sourceSha);
  const files = inventory(directory);
  for (const name of ["index.html", "_headers", "_redirects", "_routes.json", "_worker.js/index.js", "sitemap.xml", "llms.txt"]) {
    assert(files.some((file) => file.path === name && file.bytes > 0), `Missing complete deployment input: ${name}`);
  }
  const routes = json(path.join(directory, "_routes.json"));
  assert.equal(routes.version, 1);
  assert(Array.isArray(routes.include) && routes.include.length > 0);
  assert(Array.isArray(routes.exclude));
  return { schemaVersion: 1, sourceSha, files };
}

export function verify(directory, manifest, sourceSha) {
  requireSha(sourceSha);
  assert.equal(manifest.sourceSha, sourceSha, "Artifact source SHA mismatch");
  assert.deepEqual(freeze(directory, sourceSha), manifest, "Artifact bytes or file set changed");
}

async function requestJson(url, token, fetchImpl) {
  const response = await fetchImpl(url, {
    ...(token ? { headers: {
      Authorization: `Bearer ${token}`,
      ...(url.startsWith("https://api.github.com/")
        ? { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10" }
        : { Accept: "application/json" }),
    } } : {}),
    signal: AbortSignal.timeout(20_000),
  });
  // Never persist API response bodies on errors: they may contain account information.
  assert(response.ok, `Read-only release evidence request failed: HTTP ${response.status}`);
  return response.json();
}

export async function checkMainCI({ repository, sourceSha, token }, fetchImpl = fetch) {
  requireSha(sourceSha);
  assert.match(repository || "", /^[\w.-]+\/[\w.-]+$/);
  assert(token, "GitHub read token is required");
  const base = `https://api.github.com/repos/${repository}`;
  const main = await requestJson(`${base}/git/ref/heads/main`, token, fetchImpl);
  assert.equal(main.object?.sha, sourceSha, "main advanced: restart release verification");
  const runs = [];
  for (const workflow of ["prelaunch.yml", "i18n-locale-integrity.yml", "pull-request-quality-gate.yml"]) {
    const payload = await requestJson(`${base}/actions/workflows/${workflow}/runs?branch=main&head_sha=${sourceSha}&per_page=100`, token, fetchImpl);
    const candidates = (payload.workflow_runs || []).filter((run) => run.head_sha === sourceSha && run.head_branch === "main" && ["push", "workflow_dispatch"].includes(run.event));
    candidates.sort((a, b) => b.id - a.id);
    const latest = candidates[0];
    assert(latest?.status === "completed" && latest.conclusion === "success", `Latest main CI is not successful: ${workflow}`);
    runs.push({ workflow, id: latest.id, attempt: latest.run_attempt, sourceSha, conclusion: latest.conclusion });
  }
  return { sourceSha, runs, checkedAt: new Date().toISOString() };
}

// This workflow is deliberately scoped to one website release task. An arbitrary
// dispatch string is never an authorization source.
export const RELEASE_REPOSITORY = "wangchaozhuanyong/zhuangxiuwangzhan";
export const RELEASE_ENVIRONMENT = "flashcast-production";
const RELEASE_WORKFLOW = ".github/workflows/cloudflare-pages-deploy-manual.yml";
const RELEASE_JOB = "Deploy approved immutable artifact";
const positiveId = (value) => {
  assert.match(String(value ?? ""), /^[1-9][0-9]*$/, "A positive GitHub ID is required");
  const id = Number(value);
  assert(Number.isSafeInteger(id), "GitHub ID is outside the safe integer range");
  return id;
};
const digest = (value) => {
  assert.match(value || "", /^(?:sha256:)?[a-f0-9]{64}$/, "A SHA-256 artifact digest is required");
  return value.replace(/^sha256:/, "");
};

export function validateProtectedEnvironment(environment, branches) {
  assert.equal(environment?.name, RELEASE_ENVIRONMENT, "Required protected environment is missing");
  positiveId(environment.id);
  const rules = environment.protection_rules?.filter((rule) => rule.type === "required_reviewers") || [];
  assert.equal(rules.length, 1, "Exactly one required-reviewer rule is required");
  assert.equal(rules[0].prevent_self_review, true, "Prevent self-review must be enabled");
  const reviewers = rules[0].reviewers;
  assert(Array.isArray(reviewers) && reviewers.length > 0, "Explicit required reviewers are missing");
  // Team membership is not guessed from a review's display name. Until a native
  // membership check is implemented, configure individually authorized users.
  assert(reviewers.every((item) => item.type === "User" && Number.isSafeInteger(item.reviewer?.id) && item.reviewer.id > 0), "Required reviewers must be verifiable individual users");
  assert.deepEqual(environment.deployment_branch_policy, { protected_branches: false, custom_branch_policies: true }, "An exact main deployment branch policy is required");
  assert.equal(branches?.total_count, 1, "Only one deployment branch policy is allowed");
  assert.equal(branches.branch_policies?.length, 1);
  assert.equal(branches.branch_policies[0].name, "main", "Only main may deploy");
  assert.equal(branches.branch_policies[0].type, "branch", "The main policy must explicitly target a branch, not a tag");
  return { id: environment.id, name: environment.name, reviewerIds: reviewers.map((item) => item.reviewer.id).sort((a, b) => a - b), preventSelfReview: true, deploymentBranch: "main" };
}

export async function checkProtectedEnvironment({ repository, token }, fetchImpl = fetch) {
  assert.equal(repository, RELEASE_REPOSITORY, "Cross-repository release is forbidden");
  assert(token, "GitHub read token is required");
  const base = `https://api.github.com/repos/${repository}/environments/${RELEASE_ENVIRONMENT}`;
  const environment = await requestJson(base, token, fetchImpl);
  const branches = await requestJson(`${base}/deployment-branch-policies?per_page=100`, token, fetchImpl);
  return validateProtectedEnvironment(environment, branches);
}

export function authorizationRequest(context, protection, run) {
  assert(!Object.hasOwn(context, "approvalId"), "Caller-supplied approval_id is not authorization");
  assert.equal(context.repository, RELEASE_REPOSITORY);
  requireSha(context.sourceSha);
  const runId = positiveId(context.runId);
  assert.equal(Number(context.runAttempt), 1, "Re-runs cannot reuse release authorization; start a new reviewed run");
  assert.equal(run.id, runId);
  assert.equal(run.run_attempt, 1, "The native run was already retried");
  assert.equal(run.event, "workflow_dispatch");
  assert.equal(run.head_branch, "main");
  assert.equal(run.head_sha, context.sourceSha, "Authorization source SHA mismatch");
  assert.equal(run.repository?.full_name, context.repository);
  assert.equal(run.path?.split("@")[0], RELEASE_WORKFLOW);
  positiveId(protection.id);
  assert.equal(protection.name, RELEASE_ENVIRONMENT);
  const request = {
    task_id: "fc-20260906-website-rebuild-release-execution",
    action_id: `pages-deploy-${runId}`,
    action_class: "site_publish",
    scope: `flashcast.com.my:website-rebuild-final-main:${context.sourceSha}`,
    source_sha: context.sourceSha,
    repository: context.repository,
    environment_id: protection.id,
    environment_name: protection.name,
    required_reviewer_ids: protection.reviewerIds,
    run_id: runId,
    run_attempt: 1,
    artifact_id: positiveId(context.artifactId),
    artifact_digest: `sha256:${digest(context.artifactDigest)}`,
    package_sha256: digest(context.packageSha256),
    authorization_source: "github_protected_environment_review",
    single_use_unit: `${runId}:1:deploy`,
  };
  return { request, sha256: sha256(JSON.stringify(request)) };
}

export function verifyNativeApproval(request, protection, run, reviews, jobs) {
  positiveId(run.actor?.id);
  positiveId(run.triggering_actor?.id);
  assert(Array.isArray(reviews), "Native review history is missing");
  const matching = reviews.filter((review) => review.environments?.some((item) => item.id === protection.id && item.name === protection.name));
  assert.equal(matching.length, 1, "Exactly one native environment approval is required; missing or ambiguous history fails closed");
  const review = matching[0];
  assert.equal(review.state, "approved", "Native environment review did not approve this release");
  assert(protection.reviewerIds.includes(review.user?.id), "Approval did not come from a configured reviewer");
  assert.notEqual(review.user.id, run.actor.id, "The workflow actor cannot self-approve");
  assert.notEqual(review.user.id, run.triggering_actor.id, "The triggering actor cannot self-approve");
  assert.equal(review.comment, `approve sha256:${request.sha256}`, "Native approval does not bind this exact task, action, scope, SHA and artifact");
  assert(Array.isArray(jobs.jobs) && jobs.total_count === jobs.jobs.length, "Incomplete native job history fails closed");
  const live = jobs.jobs?.filter((job) => job.name === RELEASE_JOB) || [];
  assert.equal(live.length, 1, "A unique native deploy job is required");
  assert.equal(live[0].run_id, run.id);
  assert.equal(live[0].status, "in_progress", "Completed deployment authorization cannot be replayed");
  positiveId(live[0].id);
  return {
    ...request,
    approval_id: `github-environment:${protection.id}:${run.id}:1:${live[0].id}`,
    native_deploy_job_id: live[0].id,
    reviewer_id: review.user.id,
    source: `https://api.github.com/repos/${RELEASE_REPOSITORY}/actions/runs/${run.id}/approvals`,
    single_use_enforcement: "one native protected deploy job; all run attempts after the first are rejected",
    checked_at: new Date().toISOString(),
  };
}

export async function releaseAuthorization(context, verifyApproval, fetchImpl = fetch) {
  const protection = await checkProtectedEnvironment(context, fetchImpl);
  const base = `https://api.github.com/repos/${context.repository}/actions/runs/${positiveId(context.runId)}`;
  const run = await requestJson(base, context.token, fetchImpl);
  const request = authorizationRequest(context, protection, run);
  if (!verifyApproval) return request;
  assert.equal(context.requestDigest, request.sha256, "Requested authorization changed after preparation");
  const reviews = await requestJson(`${base}/approvals`, context.token, fetchImpl);
  const jobs = await requestJson(`${base}/jobs?per_page=100`, context.token, fetchImpl);
  return verifyNativeApproval(request, protection, run, reviews, jobs);
}

export function verifyArtifactMetadata(metadata, context, now = Date.now()) {
  const id = positiveId(context.artifactId);
  const runId = positiveId(context.runId);
  requireSha(context.sourceSha);
  assert.equal(metadata?.id, id, "Artifact ID mismatch");
  assert.equal(metadata.name, `pages-${context.sourceSha}-${runId}-${positiveId(context.runAttempt)}`, "Artifact name mismatch");
  assert.equal(metadata.expired, false, "Artifact is expired or expiration state is missing");
  assert(Number.isFinite(Date.parse(metadata.expires_at)) && Date.parse(metadata.expires_at) > now, "Artifact expiry is missing or in the past");
  assert(Number.isSafeInteger(metadata.size_in_bytes) && metadata.size_in_bytes > 0, "Artifact size is missing");
  assert.match(metadata.digest || "", /^sha256:[a-f0-9]{64}$/, "Official artifact digest is missing or invalid");
  assert.equal(digest(metadata.digest), digest(context.artifactDigest), "Official artifact digest does not match upload-artifact output");
  assert.equal(metadata.workflow_run?.id, runId, "Artifact belongs to another run");
  assert.equal(metadata.workflow_run.head_sha, context.sourceSha, "Artifact source SHA mismatch");
  assert.equal(metadata.workflow_run.head_branch, "main");
  return { artifact_id: id, name: metadata.name, official_digest: metadata.digest, upload_digest: `sha256:${digest(context.artifactDigest)}`, digest_equal: true, expires_at: metadata.expires_at, source_sha: context.sourceSha, run_id: runId, checked_at: new Date(now).toISOString() };
}

export async function checkArtifactMetadata(context, fetchImpl = fetch) {
  assert.equal(context.repository, RELEASE_REPOSITORY);
  assert(context.token, "GitHub read token is required");
  const metadata = await requestJson(`https://api.github.com/repos/${context.repository}/actions/artifacts/${positiveId(context.artifactId)}`, context.token, fetchImpl);
  return verifyArtifactMetadata(metadata, context);
}

export function deploymentRecord(project, deployment, version, expectedSha) {
  assert.equal(project.canonical_deployment?.id, deployment.id, "Production deployment changed during evidence capture");
  assert.equal(deployment.environment, "production");
  assert.equal(deployment.latest_stage?.status, "success");
  assert.match(deployment.id || "", /^[a-f0-9-]{36}$/);
  const sourceSha = deployment.deployment_trigger?.metadata?.commit_hash;
  requireSha(sourceSha);
  if (expectedSha) assert.equal(sourceSha, expectedSha, "Production deployment SHA mismatch");
  assert.equal(version.deploymentVersion, sourceSha, "Public version does not match the canonical deployment");
  const url = new URL(deployment.url);
  assert(url.protocol === "https:" && url.hostname.endsWith(".pages.dev"), "Unexpected Pages deployment URL");
  const runtime = project.deployment_configs?.production;
  assert.match(runtime?.compatibility_date || "", /^\d{4}-\d{2}-\d{2}$/, "Production compatibility date is required");
  const flags = runtime.compatibility_flags || [];
  assert(Array.isArray(flags) && flags.every((flag) => typeof flag === "string"));
  return {
    runtime: { compatibilityDate: runtime.compatibility_date, compatibilityFlags: flags },
    deploymentId: deployment.id, deploymentUrl: url.href, sourceSha,
    createdAt: deployment.created_on, checkedAt: new Date().toISOString(),
    rollbackDeploymentId: deployment.id,
  };
}

export async function captureDeployment({ account, project, token, expectedSha }, fetchImpl = fetch) {
  assert(account && project && token, "Cloudflare read credentials are required");
  const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/pages/projects/${encodeURIComponent(project)}`;
  const get = async (url) => {
    const payload = await requestJson(url, token, fetchImpl);
    assert.equal(payload.success, true, "Cloudflare evidence response is not successful");
    return payload.result;
  };
  const projectState = await get(base);
  assert.equal(projectState.name, project);
  const id = projectState.canonical_deployment?.id;
  assert(id, "No canonical production deployment available for rollback");
  const deployment = await get(`${base}/deployments/${encodeURIComponent(id)}`);
  const version = await requestJson("https://flashcast.com.my/__flashcast/version", null, fetchImpl);
  return deploymentRecord(projectState, deployment, version, expectedSha);
}

async function main() {
  const [command, input, output] = process.argv.slice(2);
  const env = process.env;
  const context = {
    repository: env.GITHUB_REPOSITORY, token: env.GH_TOKEN, sourceSha: env.RELEASE_SOURCE_SHA,
    runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT,
    artifactId: env.ARTIFACT_ID, artifactDigest: env.ARTIFACT_DIGEST,
    packageSha256: env.EXPECTED_PACKAGE_SHA256, requestDigest: env.AUTHORIZATION_DIGEST,
    ...(env.APPROVAL_ID ? { approvalId: env.APPROVAL_ID } : {}),
  };
  if (command === "freeze") {
    save(output, freeze(input, env.RELEASE_SOURCE_SHA));
  } else if (command === "verify") {
    verify(input, json(output), env.RELEASE_SOURCE_SHA);
  } else if (command === "compile") {
    assert(!existsSync("dist/_worker.js"), "Compile requires fresh build output, without a previous Worker");
    const { runtime } = json(input);
    assert.match(runtime?.compatibilityDate || "", /^\d{4}-\d{2}-\d{2}$/);
    assert(Array.isArray(runtime.compatibilityFlags));
    execFileSync(process.execPath, [
      "node_modules/wrangler/bin/wrangler.js", "pages", "functions", "build", "functions",
      "--outdir", "dist/_worker.js", "--output-routes-path", "dist/_routes.json",
      "--build-output-directory", "dist", "--env-file", "/dev/null",
      "--compatibility-date", runtime.compatibilityDate,
      ...runtime.compatibilityFlags.flatMap((flag) => ["--compatibility-flag", flag]),
    ], { stdio: "inherit" });
  } else if (command === "ci") {
    save(input, await checkMainCI({ repository: env.GITHUB_REPOSITORY, sourceSha: env.RELEASE_SOURCE_SHA, token: env.GH_TOKEN }));
  } else if (command === "protection") {
    save(input, await checkProtectedEnvironment(context));
  } else if (command === "authorization-request") {
    const request = await releaseAuthorization(context, false);
    save(input, request);
    writeFileSync(env.GITHUB_OUTPUT, `authorization_digest=${request.sha256}\n`, { flag: "a" });
    writeFileSync(env.GITHUB_STEP_SUMMARY, `Review this exact single-use release request before approving the protected deployment job.\n\n\`\`\`json\n${JSON.stringify(request.request, null, 2)}\n\`\`\`\n\nRequired native review comment: \`approve sha256:${request.sha256}\`\n`, { flag: "a" });
  } else if (command === "authorize") {
    save(input, await releaseAuthorization(context, true));
  } else if (command === "artifact") {
    save(input, await checkArtifactMetadata(context));
  } else if (command === "deployment") {
    save(input, await captureDeployment({ account: env.CLOUDFLARE_ACCOUNT_ID, project: env.CLOUDFLARE_PAGES_PROJECT_NAME, token: env.CLOUDFLARE_API_TOKEN, expectedSha: env.EXPECTED_DEPLOYMENT_SHA }));
  } else {
    throw new Error("Unknown release evidence command");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`[pages-release-evidence] ${error instanceof Error ? error.message : "Evidence check failed"}`);
    process.exitCode = 1;
  });
}
