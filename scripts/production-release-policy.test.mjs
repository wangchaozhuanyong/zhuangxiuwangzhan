import assert from "node:assert/strict";
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
  assert.doesNotMatch(workflow, /ci-test-public-anon-key|http:\/\/127\.0\.0\.1:4789/);
  assert.doesNotMatch(workflow, /submit-lead|TURNSTILE_(?:BYPASS|SKIP)|SKIP_TURNSTILE/i);
});
