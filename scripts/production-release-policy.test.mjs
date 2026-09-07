import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  findUnexpectedChangedPaths,
  isPostBuildGeneratedPath,
  validateProductionReleaseState,
} from "./production-release-policy.mjs";

const SHA = "a".repeat(40);

test("accepts a clean production-branch commit", () => {
  assert.deepEqual(validateProductionReleaseState({
    sourceBranch: "main",
    sourceSha: SHA,
    checkedOutSha: SHA,
  }), []);
});

test("rejects feature branches and dirty worktrees", () => {
  const issues = validateProductionReleaseState({
    sourceBranch: "feature/mobile-dock",
    sourceSha: SHA,
    checkedOutSha: SHA,
    dirty: true,
  });

  assert.equal(issues.length, 2);
  assert.match(issues[0], /must come from "main"/);
  assert.match(issues[1], /working tree is dirty/);
});

test("rejects a checkout that does not match the requested SHA", () => {
  const issues = validateProductionReleaseState({
    sourceBranch: "main",
    sourceSha: SHA,
    checkedOutSha: "b".repeat(40),
  });

  assert.equal(issues.length, 1);
  assert.match(issues[0], /does not match/);
});

test("requires local production releases to match origin main", () => {
  const issues = validateProductionReleaseState({
    sourceBranch: "main",
    sourceSha: SHA,
    checkedOutSha: SHA,
    requireRemote: true,
    remoteSha: "c".repeat(40),
  });

  assert.equal(issues.length, 1);
  assert.match(issues[0], /not the same commit as origin\/main/);
});

test("the standard release guard always verifies the current remote main", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  assert.match(packageJson.scripts["release:guard"], /--require-remote(?:\s|$)/);
});

test("post-build checks allow only declared generated output", () => {
  assert.equal(isPostBuildGeneratedPath("public/images/_responsive/projects/w360/example.webp"), true);
  assert.equal(isPostBuildGeneratedPath("public/sitemap.xml"), true);
  assert.equal(isPostBuildGeneratedPath("src/App.tsx"), false);

  assert.deepEqual(findUnexpectedChangedPaths([
    "functions/seo-manifest.json",
    "public/images/_responsive/projects/w360/example.webp",
    "src/App.tsx",
  ], true), ["src/App.tsx"]);
});

test("pre-build checks reject generated output too", () => {
  assert.deepEqual(findUnexpectedChangedPaths(["public/sitemap.xml"], false), ["public/sitemap.xml"]);
});

test("deployment entrypoints enable the generated-output exception only after building", () => {
  const workflow = readFileSync(new URL("../.github/workflows/cloudflare-pages-deploy-manual.yml", import.meta.url), "utf8");
  const localDeployScript = readFileSync(new URL("./deploy-cloudflare-pages.mjs", import.meta.url), "utf8");

  assert.match(workflow, /Confirm release source is unchanged after build[\s\S]*release:guard -- --allow-generated-output/);
  assert.match(localDeployScript, /guardScript, "--require-remote", "--allow-generated-output"/);
});

test("release workflows use the verified public support email", () => {
  const workflows = [
    "prelaunch.yml",
    "cloudflare-pages-deploy-manual.yml",
  ];

  for (const workflowName of workflows) {
    const workflow = readFileSync(new URL(`../.github/workflows/${workflowName}`, import.meta.url), "utf8");

    assert.match(workflow, /VITE_SITE_EMAIL:\s*support@flashcast\.com\.my/);
    assert.doesNotMatch(workflow, /flashcast001@gmail\.com/);
  }
});

test("production monitors fail every unhealthy run, including an ongoing incident", () => {
  const workflow = readFileSync(new URL("../.github/workflows/production-monitor.yml", import.meta.url), "utf8");

  assert.match(
    workflow,
    /name: Fail while the production monitor is unhealthy[\s\S]*?if: always\(\) && steps\.monitor\.outcome != 'success'[\s\S]*?run: exit 1/,
  );
  assert.match(
    workflow,
    /name: Fail while the browser smoke is unhealthy[\s\S]*?if: always\(\) && steps\.browser\.outcome != 'success'[\s\S]*?run: exit 1/,
  );
  assert.doesNotMatch(workflow, /Mark only a newly detected/);
  assert.doesNotMatch(workflow, /steps\.(?:incident|browser-incident)\.outputs\.result == 'new_failure'/);
});

test("pull requests expose one stable required-release-gate after all mandatory jobs", () => {
  const workflow = readFileSync(new URL("../.github/workflows/pull-request-quality-gate.yml", import.meta.url), "utf8");

  assert.match(workflow, /pull_request:\s*\n\s*branches: \[main\]/);
  assert.match(workflow, /required-release-gate:\s*\n\s*name: required-release-gate\s*\n\s*if: always\(\)\s*\n\s*needs: \[static-quality, release-candidate\]/);
  assert.match(workflow, /test "\$STATIC_RESULT" = "success"/);
  assert.match(workflow, /test "\$RELEASE_RESULT" = "success"/);

  for (const command of [
    "npm run arch:check",
    "npm run i18n:check",
    "npm run typecheck",
    "npm run typecheck:strict-core",
    "npm run lint",
    "npm test",
    "npm run build",
    "npm run verify:edge-security",
    "npm run verify:performance-budget",
    "npm run verify:seo-html",
    "npm run verify:preview:server",
    "npm run test:e2e -- --project=chromium",
  ]) {
    assert.match(workflow, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(workflow, /VITE_SUPABASE_URL: \$\{\{ secrets\.VITE_SUPABASE_URL \}\}/);
  assert.match(workflow, /VITE_SUPABASE_ANON_KEY: \$\{\{ secrets\.VITE_SUPABASE_ANON_KEY \}\}/);
  assert.match(workflow, /VITE_TURNSTILE_SITE_KEY: \$\{\{ secrets\.VITE_TURNSTILE_SITE_KEY \}\}/);
  assert.match(workflow, /name: Chromium E2E\s+env:\s+PLAYWRIGHT_REUSE_SERVER: "1"/);
  assert.doesNotMatch(workflow, /ci-test-public-anon-key|http:\/\/127\.0\.0\.1:4789/);
  assert.doesNotMatch(workflow, /submit-lead|TURNSTILE_(?:BYPASS|SKIP)|SKIP_TURNSTILE/i);
});

test("production workflow has only an explicit main dispatch and never synchronizes secrets", () => {
  const workflow = readFileSync(new URL("../.github/workflows/cloudflare-pages-deploy-manual.yml", import.meta.url), "utf8");
  assert.doesNotMatch(workflow, /workflow_run:|\n  push:|\n  schedule:|pages secret (?:put|delete)|supabase (?:secrets|functions)/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /source_sha:[\s\S]*required: true/);
  assert.doesNotMatch(workflow, /approval_id:|APPROVAL_ID:/);
  assert.match(workflow, /build:\s+needs: protection/);
  assert.doesNotMatch(workflow, /deploy:[\s\S]*environment:\s+name: flashcast-production/);
  assert.match(workflow, /pages-release-evidence\.mjs owner /);
  assert.match(workflow, /pages-release-evidence\.mjs owner-authorization-request /);
  assert.match(workflow, /pages-release-evidence\.mjs owner-authorize /);
  assert.match(workflow, /authorization_digest: \$\{\{ steps\.request\.outputs\.authorization_digest \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /artifact-ids: \$\{\{ needs\.build\.outputs\.artifact_id \}\}/);
  const deploy = workflow.split("\n  deploy:\n")[1];
  assert(deploy);
  assert.doesNotMatch(deploy, /run:.*(?:release:check|npm run build|retain-assets|functions build)/);
  assert.match(deploy, /--cwd "\$RUNNER_TEMP\/pages-deployer".*--no-bundle --env-file \/dev\/null/);
  const ordered = ["Verify single-owner manual release identity", "Stable release check", "Compile complete Pages Functions", "Confirm release source", "Freeze complete upload input", "Archive immutable complete release", "Prepare exact single-owner release request", "Download the immutable release", "Verify downloaded artifact digest against GitHub metadata", "Verify exact single-use owner manual dispatch", "sha256sum --check", "Recheck main CI", "Deploy verified archived input"];
  let previous = -1;
  for (const marker of ordered) {
    const index = workflow.indexOf(marker);
    assert(index > previous, `Missing or out-of-order release boundary: ${marker}`);
    previous = index;
  }
});

// These fixtures exercise bytes and provider responses without publishing or using credentials.
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  RELEASE_ENVIRONMENT, RELEASE_OWNER_LOGIN, RELEASE_REPOSITORY, authorizationRequest,
  checkArtifactMetadata, checkMainCI, checkOwnerManualRun, checkProtectedEnvironment,
  deploymentRecord, freeze, ownerReleaseAuthorization, releaseAuthorization,
  validateOwnerManualRun, validateProtectedEnvironment, verify, verifyArtifactMetadata,
} from "./pages-release-evidence.mjs";

function completeArtifact(t) {
  const directory = mkdtempSync(path.join(tmpdir(), "pages-release-policy-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(path.join(directory, "_worker.js"));
  for (const file of ["index.html", "_headers", "_redirects", "_worker.js/index.js", "sitemap.xml", "llms.txt"]) {
    writeFileSync(path.join(directory, file), `fixture for ${file}`);
  }
  writeFileSync(path.join(directory, "_routes.json"), JSON.stringify({ version: 1, include: ["/*"], exclude: [] }));
  return directory;
}

test("complete upload manifest detects altered, added, missing bytes and wrong source", (t) => {
  const directory = completeArtifact(t);
  const manifest = freeze(directory, SHA);
  assert.doesNotThrow(() => verify(directory, manifest, SHA));
  assert.throws(() => verify(directory, manifest, "b".repeat(40)), /SHA mismatch/);
  writeFileSync(path.join(directory, "index.html"), "tampered");
  assert.throws(() => verify(directory, manifest, SHA), /bytes or file set changed/);
  writeFileSync(path.join(directory, "index.html"), "fixture for index.html");
  writeFileSync(path.join(directory, "unexpected.html"), "extra");
  assert.throws(() => verify(directory, manifest, SHA), /bytes or file set changed/);
  rmSync(path.join(directory, "unexpected.html"));
  rmSync(path.join(directory, "_worker.js/index.js"));
  assert.throws(() => verify(directory, manifest, SHA), /Missing complete deployment input/);
});

test("plain Vite dist, symlinks and malformed routing cannot be frozen", (t) => {
  const directory = completeArtifact(t);
  writeFileSync(path.join(directory, "_routes.json"), JSON.stringify({ version: 1, include: [], exclude: [] }));
  assert.throws(() => freeze(directory, SHA));
  writeFileSync(path.join(directory, "_routes.json"), JSON.stringify({ version: 1, include: ["/*"], exclude: [] }));
  symlinkSync(path.join(directory, "index.html"), path.join(directory, "linked.html"));
  assert.throws(() => freeze(directory, SHA), /Symlinks are forbidden/);
  rmSync(path.join(directory, "linked.html"));
  rmSync(path.join(directory, "_worker.js"), { recursive: true });
  assert.throws(() => freeze(directory, SHA), /Missing complete deployment input/);
});

function fakeCI({ remoteSha = SHA, change = (run) => run, extra = [] } = {}) {
  return async (url, options) => {
    assert(!options.method || options.method === "GET");
    assert(url.startsWith("https://api.github.com/repos/example/website/"));
    const payload = url.endsWith("/git/ref/heads/main") ? { object: { sha: remoteSha } } : {
      workflow_runs: [...extra, change({ id: 42, run_attempt: 1, head_sha: SHA, head_branch: "main", event: "push", status: "completed", conclusion: "success" })],
    };
    return { ok: true, json: async () => payload };
  };
}

const ciInput = { repository: "example/website", sourceSha: SHA, token: "fixture-only" };

test("final-main CI rejects old main, PR-only success, missing, pending and failed runs", async () => {
  const result = await checkMainCI(ciInput, fakeCI());
  assert.equal(result.runs.length, 3);
  await assert.rejects(checkMainCI(ciInput, fakeCI({ remoteSha: "b".repeat(40) })), /main advanced/);
  for (const change of [
    (run) => ({ ...run, event: "pull_request" }),
    (run) => ({ ...run, head_sha: "b".repeat(40) }),
    (run) => ({ ...run, status: "in_progress", conclusion: null }),
    (run) => ({ ...run, conclusion: "failure" }),
  ]) await assert.rejects(checkMainCI(ciInput, fakeCI({ change })), /not successful/);
  await assert.rejects(checkMainCI(ciInput, fakeCI({ extra: [{ id: 43, head_sha: SHA, head_branch: "main", event: "workflow_dispatch", status: "queued", conclusion: null }] })), /not successful/);
});

test("rollback evidence requires successful canonical production matching the public version", () => {
  const deployment = {
    id: "11111111-2222-3333-4444-555555555555", environment: "production",
    latest_stage: { status: "success" }, deployment_trigger: { metadata: { commit_hash: SHA } },
    url: "https://fixture.example.pages.dev", created_on: "2026-09-07T00:00:00Z",
    env_vars: { DO_NOT_SAVE: { value: "fixture-sensitive" } },
  };
  const project = { canonical_deployment: { id: deployment.id }, deployment_configs: { production: { compatibility_date: "2026-06-02", compatibility_flags: [] } } };
  const version = { deploymentVersion: SHA };
  const result = deploymentRecord(project, deployment, version, SHA);
  assert.equal(result.rollbackDeploymentId, deployment.id);
  assert.deepEqual(result.runtime, { compatibilityDate: "2026-06-02", compatibilityFlags: [] });
  assert.throws(() => deploymentRecord({ canonical_deployment: project.canonical_deployment }, deployment, version), /compatibility date/);
  assert(!JSON.stringify(result).includes("fixture-sensitive"));
  assert.throws(() => deploymentRecord(project, deployment, { deploymentVersion: "b".repeat(40) }), /Public version/);
  assert.throws(() => deploymentRecord(project, { ...deployment, environment: "preview" }, version));
  assert.throws(() => deploymentRecord(project, { ...deployment, latest_stage: { status: "failure" } }, version));
  assert.throws(() => deploymentRecord({ canonical_deployment: { id: "changed" } }, deployment, version), /Production deployment changed/);
});


test("compile refuses existing Worker output before invoking Wrangler", (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "pages-stale-worker-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(path.join(directory, "dist"));
  writeFileSync(path.join(directory, "dist/_worker.js"), "stale worker");
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL("./pages-release-evidence.mjs", import.meta.url)), "compile", "not-read.json",
  ], { cwd: directory, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Compile requires fresh build output/);
});

const DIGEST = "d".repeat(64);
const releaseInput = {
  repository: RELEASE_REPOSITORY, sourceSha: SHA, token: "fixture-only",
  runId: "42", runAttempt: "1", artifactId: "123", artifactDigest: DIGEST,
  packageSha256: "e".repeat(64),
};

function nativeReleaseFixture() {
  return {
    environment: {
      id: 7, name: RELEASE_ENVIRONMENT,
      protection_rules: [{ type: "required_reviewers", prevent_self_review: true, reviewers: [{ type: "User", reviewer: { id: 9 } }] }],
      deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
    },
    branches: { total_count: 1, branch_policies: [{ id: 8, name: "main", type: "branch" }] },
    run: {
      id: 42, run_attempt: 1, event: "workflow_dispatch", head_branch: "main", head_sha: SHA,
      repository: { full_name: RELEASE_REPOSITORY },
      path: ".github/workflows/cloudflare-pages-deploy-manual.yml",
      actor: { id: 1 }, triggering_actor: { id: 2 },
    },
    reviews: [],
    jobs: { total_count: 1, jobs: [{ id: 88, name: "Deploy approved immutable artifact", run_id: 42, status: "in_progress" }] },
  };
}

function fakeReleaseAPI(fixture, calls = []) {
  const base = `https://api.github.com/repos/${RELEASE_REPOSITORY}`;
  const payloads = {
    [`${base}/environments/${RELEASE_ENVIRONMENT}`]: fixture.environment,
    [`${base}/environments/${RELEASE_ENVIRONMENT}/deployment-branch-policies?per_page=100`]: fixture.branches,
    [`${base}/actions/runs/${fixture.run.id}`]: fixture.run,
    [`${base}/actions/runs/${fixture.run.id}/approvals`]: fixture.reviews,
    [`${base}/actions/runs/${fixture.run.id}/jobs?per_page=100`]: fixture.jobs,
  };
  return async (url, options) => {
    assert(!options.method || options.method === "GET", "Authorization cannot mutate GitHub state");
    assert.equal(options.headers["X-GitHub-Api-Version"], "2026-03-10");
    assert(Object.hasOwn(payloads, url), `Unexpected release API: ${url}`);
    calls.push(url);
    return { ok: true, json: async () => structuredClone(payloads[url]) };
  };
}

async function approvedReleaseFixture() {
  const fixture = nativeReleaseFixture();
  const request = await releaseAuthorization(releaseInput, false, fakeReleaseAPI(fixture));
  fixture.reviews.push({
    state: "approved", user: { id: 9 },
    environments: [{ id: 7, name: RELEASE_ENVIRONMENT }],
    comment: `approve sha256:${request.sha256}`,
  });
  return { fixture, request, context: { ...releaseInput, requestDigest: request.sha256 } };
}

test("native environment request binds exact task, independent action, scope, source and artifact", async () => {
  const { fixture, request, context } = await approvedReleaseFixture();
  const calls = [];
  const result = await releaseAuthorization(context, true, fakeReleaseAPI(fixture, calls));
  assert.deepEqual(result.request, {
    task_id: "fc-20260906-website-rebuild-release-execution", action_id: "pages-deploy-42",
    action_class: "site_publish", scope: `flashcast.com.my:website-rebuild-final-main:${SHA}`,
    source_sha: SHA, repository: RELEASE_REPOSITORY, environment_id: 7,
    environment_name: RELEASE_ENVIRONMENT, required_reviewer_ids: [9], run_id: 42, run_attempt: 1,
    artifact_id: 123, artifact_digest: `sha256:${DIGEST}`, package_sha256: "e".repeat(64),
    authorization_source: "github_protected_environment_review", single_use_unit: "42:1:deploy",
  });
  assert.equal(result.sha256, request.sha256);
  assert.equal(result.approval_id, "github-environment:7:42:1:88");
  assert.equal(result.reviewer_id, 9);
  assert.equal(calls.length, 5);
  assert(!JSON.stringify(result).includes(releaseInput.token));
});

test("free-form approval ID and standing authorization name cannot authorize a release", async () => {
  const { fixture, context } = await approvedReleaseFixture();
  for (const approvalId of ["fake", "owner-standing-flashcast-site-publish-20260906", "github-environment:7:42:1:88", ""]) {
    await assert.rejects(releaseAuthorization({ ...context, approvalId }, true, fakeReleaseAPI(fixture)), /Caller-supplied approval_id/);
  }
});

test("absent environment and provider failures stop without a success receipt", async () => {
  for (const status of [404, 403, 500]) {
    let calls = 0;
    await assert.rejects(checkProtectedEnvironment(releaseInput, async () => {
      calls += 1;
      return { ok: false, status, json: () => { throw new Error("Must not read or persist an error body"); } };
    }), new RegExp(`HTTP ${status}`));
    assert.equal(calls, 1);
  }
});

for (const [name, change] of [
  ["missing environment", (f) => { f.environment = {}; }],
  ["wrong environment", (f) => { f.environment.name = "preview"; }],
  ["no reviewer rule", (f) => { f.environment.protection_rules = []; }],
  ["self-review enabled", (f) => { f.environment.protection_rules[0].prevent_self_review = false; }],
  ["unknown self-review state", (f) => { delete f.environment.protection_rules[0].prevent_self_review; }],
  ["no configured reviewer", (f) => { f.environment.protection_rules[0].reviewers = []; }],
  ["team membership not verified", (f) => { f.environment.protection_rules[0].reviewers[0].type = "Team"; }],
  ["no branch restriction", (f) => { f.environment.deployment_branch_policy = null; }],
  ["protected branches instead of exact main", (f) => { f.environment.deployment_branch_policy = { protected_branches: true, custom_branch_policies: false }; }],
  ["wildcard branch", (f) => { f.branches.branch_policies[0].name = "*"; }],
  ["tag named main", (f) => { f.branches.branch_policies[0].type = "tag"; }],
  ["unknown branch policy type", (f) => { delete f.branches.branch_policies[0].type; }],
  ["additional deployment policy", (f) => { f.branches.total_count = 2; }],
]) {
  test(`protected environment rejects ${name}`, async () => {
    const fixture = nativeReleaseFixture();
    change(fixture);
    await assert.rejects(checkProtectedEnvironment(releaseInput, fakeReleaseAPI(fixture)));
  });
}

for (const [name, change] of [
  ["missing review including admin bypass", (f) => { f.reviews = []; }],
  ["ambiguous review history", (f) => { f.reviews.push(structuredClone(f.reviews[0])); }],
  ["rejected review", (f) => { f.reviews[0].state = "rejected"; }],
  ["unconfigured reviewer", (f) => { f.reviews[0].user.id = 99; }],
  ["actor self-review", (f) => { f.run.actor.id = 9; }],
  ["triggering actor self-review", (f) => { f.run.triggering_actor.id = 9; }],
  ["wrong environment review", (f) => { f.reviews[0].environments[0].id = 99; }],
  ["free-form review comment", (f) => { f.reviews[0].comment = "approved"; }],
  ["different request comment", (f) => { f.reviews[0].comment = `approve sha256:${"f".repeat(64)}`; }],
  ["completed job replay", (f) => { f.jobs.jobs[0].status = "completed"; }],
  ["missing job", (f) => { f.jobs = { total_count: 0, jobs: [] }; }],
  ["ambiguous deploy jobs", (f) => { f.jobs.jobs.push(structuredClone(f.jobs.jobs[0])); f.jobs.total_count = 2; }],
  ["incomplete paginated job history", (f) => { f.jobs.total_count = 101; }],
  ["job from a different run", (f) => { f.jobs.jobs[0].run_id = 43; }],
  ["native run retry", (f) => { f.run.run_attempt = 2; }],
  ["different native source SHA", (f) => { f.run.head_sha = "b".repeat(40); }],
  ["automatic run", (f) => { f.run.event = "push"; }],
  ["feature branch", (f) => { f.run.head_branch = "feature"; }],
  ["different workflow", (f) => { f.run.path = ".github/workflows/other.yml"; }],
  ["changed reviewer configuration after request", (f) => { f.environment.protection_rules[0].reviewers.push({ type: "User", reviewer: { id: 10 } }); }],
]) {
  test(`native authorization rejects ${name}`, async () => {
    const { fixture, context } = await approvedReleaseFixture();
    change(fixture);
    await assert.rejects(releaseAuthorization(context, true, fakeReleaseAPI(fixture)));
  });
}

test("requested artifact, package, authorization digest and run attempt cannot change", async () => {
  const { fixture, context } = await approvedReleaseFixture();
  for (const change of [
    { artifactId: "124" }, { artifactDigest: "f".repeat(64) }, { packageSha256: "f".repeat(64) },
    { requestDigest: "f".repeat(64) }, { runAttempt: "2" }, { repository: "example/other" },
  ]) await assert.rejects(releaseAuthorization({ ...context, ...change }, true, fakeReleaseAPI(fixture)));
});

function ownerManualFixture() {
  return {
    run: {
      id: 42, run_attempt: 1, event: "workflow_dispatch", head_branch: "main", head_sha: SHA,
      repository: { full_name: RELEASE_REPOSITORY },
      path: ".github/workflows/cloudflare-pages-deploy-manual.yml",
      actor: { id: 1, login: RELEASE_OWNER_LOGIN },
      triggering_actor: { id: 1, login: RELEASE_OWNER_LOGIN },
      status: "in_progress",
    },
    jobs: {
      total_count: 3,
      jobs: [
        { id: 86, name: "protection", run_id: 42, status: "completed" },
        { id: 87, name: "build", run_id: 42, status: "completed" },
        { id: 88, name: "Deploy approved immutable artifact", run_id: 42, status: "in_progress" },
      ],
    },
  };
}

function fakeOwnerAPI(fixture, calls = []) {
  const base = `https://api.github.com/repos/${RELEASE_REPOSITORY}/actions/runs/${fixture.run.id}`;
  const payloads = {
    [base]: fixture.run,
    [`${base}/jobs?per_page=100`]: fixture.jobs,
  };
  return async (url, options) => {
    assert(!options.method || options.method === "GET", "Owner authorization cannot mutate GitHub state");
    assert(Object.hasOwn(payloads, url), `Unexpected owner release API: ${url}`);
    calls.push(url);
    return { ok: true, json: async () => structuredClone(payloads[url]) };
  };
}

test("single-owner manual release binds owner, exact run, source and artifact", async () => {
  const fixture = ownerManualFixture();
  const identity = validateOwnerManualRun(releaseInput, fixture.run);
  assert.equal(identity.ownerLogin, RELEASE_OWNER_LOGIN);
  const checked = await checkOwnerManualRun(releaseInput, fakeOwnerAPI(fixture));
  assert.equal(checked.ownerId, 1);

  const request = await ownerReleaseAuthorization(releaseInput, false, fakeOwnerAPI(fixture));
  const context = { ...releaseInput, requestDigest: request.sha256 };
  const calls = [];
  const result = await ownerReleaseAuthorization(context, true, fakeOwnerAPI(fixture, calls));
  assert.deepEqual(result.request_sha256, request.sha256);
  assert.equal(result.authorization_source, "github_single_owner_manual_dispatch");
  assert.equal(result.owner_login, RELEASE_OWNER_LOGIN);
  assert.equal(result.owner_id, 1);
  assert.equal(result.approval_id, "github-owner-dispatch:1:42:1:88");
  assert.equal(result.source_sha, SHA);
  assert.equal(result.artifact_id, 123);
  assert.equal(calls.length, 2);
  assert(!JSON.stringify(result).includes(releaseInput.token));
});

test("single-owner release rejects another account, automatic run, rerun and replay", async () => {
  for (const change of [
    (f) => { f.run.actor.login = "other"; },
    (f) => { f.run.triggering_actor.login = "other"; },
    (f) => { f.run.triggering_actor.id = 2; },
    (f) => { f.run.event = "push"; },
    (f) => { f.run.head_branch = "feature"; },
    (f) => { f.run.head_sha = "b".repeat(40); },
    (f) => { f.run.run_attempt = 2; },
    (f) => { f.run.status = "completed"; },
  ]) {
    const fixture = ownerManualFixture();
    change(fixture);
    await assert.rejects(ownerReleaseAuthorization(releaseInput, false, fakeOwnerAPI(fixture)));
  }
});

test("single-owner release rejects changed request and non-unique deploy job", async () => {
  const fixture = ownerManualFixture();
  const request = await ownerReleaseAuthorization(releaseInput, false, fakeOwnerAPI(fixture));
  await assert.rejects(ownerReleaseAuthorization(
    { ...releaseInput, requestDigest: "f".repeat(64) },
    true,
    fakeOwnerAPI(fixture),
  ), /changed after preparation/);

  fixture.jobs.jobs.push({ ...fixture.jobs.jobs[2], id: 89 });
  fixture.jobs.total_count += 1;
  await assert.rejects(ownerReleaseAuthorization(
    { ...releaseInput, requestDigest: request.sha256 },
    true,
    fakeOwnerAPI(fixture),
  ), /unique native deploy job/);
});

test("a new run cannot reuse an earlier run's native approval", async () => {
  const { fixture, context, request } = await approvedReleaseFixture();
  fixture.run.id = 43;
  fixture.jobs.jobs[0].run_id = 43;
  const next = { ...context, runId: "43" };
  const nextRequest = authorizationRequest(next, validateProtectedEnvironment(fixture.environment, fixture.branches), fixture.run);
  assert.notEqual(nextRequest.sha256, request.sha256);
  assert.notEqual(nextRequest.request.action_id, request.request.action_id);
  await assert.rejects(releaseAuthorization({ ...next, requestDigest: nextRequest.sha256 }, true, fakeReleaseAPI(fixture)), /does not bind/);
});

function artifactMetadataFixture() {
  return {
    id: 123, name: `pages-${SHA}-42-1`, digest: `sha256:${DIGEST}`,
    expired: false, expires_at: "2999-01-01T00:00:00Z", size_in_bytes: 100,
    workflow_run: { id: 42, head_sha: SHA, head_branch: "main" },
  };
}

test("artifact digest is independently read from the exact official artifact ID", async () => {
  let calls = 0;
  const result = await checkArtifactMetadata(releaseInput, async (url, options) => {
    calls += 1;
    assert.equal(url, `https://api.github.com/repos/${RELEASE_REPOSITORY}/actions/artifacts/123`);
    assert(!options.method || options.method === "GET");
    return { ok: true, json: async () => artifactMetadataFixture() };
  });
  assert.equal(calls, 1);
  assert.equal(result.artifact_id, 123);
  assert.equal(result.official_digest, `sha256:${DIGEST}`);
  assert.equal(result.upload_digest, result.official_digest);
  assert.equal(result.digest_equal, true);
  assert.doesNotThrow(() => verifyArtifactMetadata(artifactMetadataFixture(), { ...releaseInput, artifactDigest: `sha256:${DIGEST}` }));
});

for (const [name, change] of [
  ["wrong ID", (m) => { m.id = 124; }],
  ["wrong name", (m) => { m.name = "pages-other"; }],
  ["missing digest", (m) => { delete m.digest; }],
  ["mismatched digest", (m) => { m.digest = `sha256:${"f".repeat(64)}`; }],
  ["untyped official digest", (m) => { m.digest = DIGEST; }],
  ["expired artifact", (m) => { m.expired = true; }],
  ["missing expiry state", (m) => { delete m.expired; }],
  ["past expiry date", (m) => { m.expires_at = "2020-01-01T00:00:00Z"; }],
  ["missing expiry date", (m) => { delete m.expires_at; }],
  ["empty artifact", (m) => { m.size_in_bytes = 0; }],
  ["wrong run", (m) => { m.workflow_run.id = 43; }],
  ["wrong source SHA", (m) => { m.workflow_run.head_sha = "b".repeat(40); }],
  ["wrong source branch", (m) => { m.workflow_run.head_branch = "feature"; }],
]) {
  test(`official artifact verification rejects ${name}`, () => {
    const metadata = artifactMetadataFixture();
    change(metadata);
    assert.throws(() => verifyArtifactMetadata(metadata, releaseInput));
  });
}

test("artifact API failure or missing upload digest cannot produce digest equality", async () => {
  await assert.rejects(checkArtifactMetadata(releaseInput, async () => ({ ok: false, status: 404 })), /HTTP 404/);
  assert.throws(() => verifyArtifactMetadata(artifactMetadataFixture(), { ...releaseInput, artifactDigest: undefined }), /digest is required/);
});
