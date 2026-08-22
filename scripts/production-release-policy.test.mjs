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
