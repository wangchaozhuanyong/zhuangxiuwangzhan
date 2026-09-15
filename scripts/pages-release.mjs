import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const workflow = "cloudflare-pages-deploy.yml";
export const repository = "wangchaozhuanyong/zhuangxiuwangzhan";
export const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const digest = value => createHash("sha256").update(value).digest("hex");
export function websiteInputsChanged(paths) {
  // Skip only known non-runtime inputs. Unknown/new build helpers must deploy.
  return paths.some(p => !/\.(spec|test)\.[^/]+$/u.test(p) &&
    !/^(?:docs\/|tests\/|e2e\/|\.github\/|(?:README|AGENTS|CHANGELOG|LICENSE)(?:\.md)?$|\.gitignore$|eslint\.config\.[^/]+$|(?:vitest|playwright)\.config\.[^/]+$|scripts\/(?:pages-release|deploy-cloudflare-pages|arch-check)\.mjs$)/u.test(p));
}
export function priorAttempt(runs, sha, currentId) {
  return runs.find(run => String(run.id) !== String(currentId) && run.head_sha === sha &&
    run.head_branch === "main" && run.path === `.github/workflows/${workflow}`);
}
export async function liveVersion(fetcher = fetch) {
  const response = await fetcher("https://flashcast.com.my/__flashcast/version", {
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  assert.ok(response.ok, "Cannot read production version; no build started");
  const { deploymentVersion } = await response.json();
  assert.match(deploymentVersion, /^[a-f0-9]{40}$/u, "Production revision is unavailable");
  return deploymentVersion;
}
export function filesSince(live, target) {
  assert.match(live, /^[a-f0-9]{40}$/u);
  assert.match(target, /^[a-f0-9]{40}$/u);
  try { git("cat-file", "-e", `${live}^{commit}`); }
  catch { git("fetch", "--no-tags", "origin", live); }
  git("merge-base", "--is-ancestor", live, target);
  return git("diff", "--name-only", live, target).split("\n").filter(Boolean);
}
export function runHistory(sha) {
  return JSON.parse(execFileSync("gh", ["api", `repos/${repository}/actions/workflows/${workflow}/runs?head_sha=${sha}&per_page=20`], { encoding: "utf8" })).workflow_runs;
}
export function buildIdentity(environment = process.env, node = process.version) {
  return digest(JSON.stringify({ node, environment: Object.fromEntries(Object.entries(environment)
    .filter(([key]) => key.startsWith("VITE_") || key === "NODE_ENV")
    .sort(([a], [b]) => a.localeCompare(b))) }));
}
function artifactFiles() {
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      assert.ok(!entry.isSymbolicLink(), "Build artifacts must not contain symlinks");
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) files.push(file);
      else throw new Error("Unexpected build artifact type");
    }
  }
  walk("dist");
  files.push("functions/seo-manifest.json");
  return Object.fromEntries(files.sort().map(file => [file, digest(readFileSync(file))]));
}
export function validateBuildReceipt(receipt, expected, files) {
  assert.equal(receipt.version, 1);
  assert.equal(receipt.sha, expected.sha);
  assert.equal(receipt.runId, expected.runId);
  assert.equal(receipt.profile, expected.profile);
  assert.ok(files["dist/index.html"], "Build entry is missing");
  assert.deepEqual(receipt.files, files, "Cached build contents differ");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const command = process.argv[2];
  const sha = git("rev-parse", "HEAD");
  const output = (key, value) => appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  if (command === "plan") {
    if (process.env.GITHUB_EVENT_NAME === "pull_request") output("deploy", false);
    else {
      assert.equal(process.env.GITHUB_REF, "refs/heads/main");
      if (process.env.EXPECTED_SHA) assert.equal(sha, process.env.EXPECTED_SHA, "main advanced before dispatch; inspect the new source first");
      const live = await liveVersion();
      const deploy = websiteInputsChanged(filesSince(live, sha));
      if (deploy) {
        const prior = priorAttempt(runHistory(sha), sha, process.env.GITHUB_RUN_ID);
        assert.ok(!prior, `This SHA already has run ${prior?.id}; inspect it and recover its failed jobs instead of redispatching`);
      }
      output("deploy", deploy);
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Target: ${sha}; current production: ${live}; website inputs changed: ${deploy}.\n`);
    }
  } else if (command === "cache-key") {
    output("key", `pages-${process.env.GITHUB_RUN_ID}-${sha}-${buildIdentity()}`);
  } else if (command === "record" || command === "verify-build") {
    const expected = { sha, runId: process.env.GITHUB_RUN_ID, profile: buildIdentity() };
    const files = artifactFiles();
    const file = ".release/pages-build.json";
    if (command === "record") {
      mkdirSync(".release", { recursive: true });
      writeFileSync(file, JSON.stringify({ version: 1, ...expected, files }) + "\n");
    } else validateBuildReceipt(JSON.parse(readFileSync(file, "utf8")), expected, files);
  } else if (command === "verify-live") {
    let current;
    for (let attempt = 0; attempt < 6; attempt++) {
      current = await liveVersion();
      if (current === sha) break;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    assert.equal(current, sha, "Production revision does not match the deployed artifact");
    console.log(`Production revision verified: ${sha}`);
  } else throw new Error("Expected plan, cache-key, record, verify-build or verify-live");
}
