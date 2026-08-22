import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isGeneratedReleaseArtifactPath, validateProductionReleaseState } from "./production-release-policy.mjs";

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

test("only known build outputs qualify as generated release artifacts", () => {
  assert.equal(isGeneratedReleaseArtifactPath("public/images/_responsive/materials/w720/example.webp"), true);
  assert.equal(isGeneratedReleaseArtifactPath("public/sitemap.xml"), true);
  assert.equal(isGeneratedReleaseArtifactPath("functions/seo-manifest.json"), true);
  assert.equal(isGeneratedReleaseArtifactPath("src/pages/Products.tsx"), false);
  assert.equal(isGeneratedReleaseArtifactPath(".github/workflows/cloudflare-pages-deploy-manual.yml"), false);
});

test("post-build guards allow only generated release artifacts", () => {
  const workflow = readFileSync(new URL("../.github/workflows/cloudflare-pages-deploy-manual.yml", import.meta.url), "utf8");
  const deployScript = readFileSync(new URL("./deploy-cloudflare-pages.mjs", import.meta.url), "utf8");

  assert.match(workflow, /Confirm release source is unchanged after build[\s\S]*release:guard -- --allow-generated-dirty/);
  assert.match(deployScript, /guardScript, "--require-remote", "--allow-generated-dirty"/);
});
