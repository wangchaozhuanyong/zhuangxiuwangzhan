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
  assert.match(workflow, /approval_id:[\s\S]*required: true/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /artifact-ids: \$\{\{ needs\.build\.outputs\.artifact_id \}\}/);
  const deploy = workflow.split("\n  deploy:\n")[1];
  assert(deploy);
  assert.doesNotMatch(deploy, /run:.*(?:release:check|npm run build|retain-assets|functions build)/);
  assert.match(deploy, /--cwd "\$RUNNER_TEMP\/pages-deployer".*--no-bundle --env-file \/dev\/null/);
  const ordered = ["Stable release check", "Compile complete Pages Functions", "Confirm release source", "Freeze complete upload input", "Archive immutable complete release", "Download the immutable release", "sha256sum --check", "Recheck main CI", "Deploy verified archived input"];
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
import { checkMainCI, deploymentRecord, freeze, verify } from "./pages-release-evidence.mjs";

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
