import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  buildIdentity, liveVersion, priorAttempt, validateBuildReceipt, websiteInputsChanged, workflow,
} from "./pages-release.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sha = "a".repeat(40);

test("documentation and tests skip deployment; real build and Functions inputs do not", () => {
  assert.equal(websiteInputsChanged(["AGENTS.md", "docs/DEVELOPMENT_RULES.md", "docs/rules/README.md"]), false);
  assert.equal(websiteInputsChanged([".github/workflows/cloudflare-pages-deploy.yml", "scripts/pages-release.mjs", "src/App.test.tsx"]), false);
  for (const path of ["src/App.tsx", "public/_headers", "functions/_middleware.ts", "index.html",
    "package-lock.json", "vite.config.ts", "wrangler.toml", "scripts/generate-seo-manifest.mjs",
    "scripts/generate-sitemap.mjs", "scripts/site-csp.mjs", "scripts/vite-prune-public-media.mjs",
    "scripts/seo-static-pages.mjs", "scripts/seo-material-pages.mjs", "scripts/new-build-helper.mjs"])
    assert.equal(websiteInputsChanged(["docs/README.md", path]), true, path);
  // Later documentation commits must not hide previously undeployed runtime files.
  assert.equal(websiteInputsChanged(["src/App.tsx", "docs/release.md"]), true);
});

test("same-revision active and failed runs block new dispatches; the original run may retry", () => {
  const run = { id: 12, head_sha: sha, head_branch: "main", path: `.github/workflows/${workflow}` };
  for (const status of ["queued", "in_progress", "completed"])
    assert.equal(priorAttempt([{ ...run, status, conclusion: "failure" }], sha)?.id, 12);
  assert.equal(priorAttempt([run], sha, "12"), undefined);
  assert.equal(priorAttempt([{ ...run, head_sha: "b".repeat(40) }], sha), undefined);
  assert.equal(priorAttempt([{ ...run, head_branch: "feature" }], sha), undefined);
});

test("production lookup rejects unavailable and non-commit versions", async () => {
  assert.equal(await liveVersion(async () => ({ ok: true, json: async () => ({ deploymentVersion: sha }) })), sha);
  await assert.rejects(liveVersion(async () => ({ ok: false })));
  await assert.rejects(liveVersion(async () => ({ ok: true, json: async () => ({ deploymentVersion: "local" }) })));
});

test("build identity follows Node and Vite inputs without persisting environment values", () => {
  const env = { VITE_SITE_URL: "https://example.test", NODE_ENV: "production" };
  const identity = buildIdentity(env, "v22.0.0");
  assert.match(identity, /^[a-f0-9]{64}$/u);
  assert.equal(identity, buildIdentity({ ...env, GITHUB_RUN_ATTEMPT: "2" }, "v22.0.0"));
  assert.notEqual(identity, buildIdentity({ ...env, VITE_SITE_URL: "https://changed.test" }, "v22.0.0"));
  assert.notEqual(identity, buildIdentity(env, "v22.1.0"));
});

test("receipts reject missing files, other sources, runs, environments, and altered artifacts", () => {
  const expected = { sha, runId: "12", profile: "profile" };
  const files = { "dist/index.html": "digest", "functions/seo-manifest.json": "seo-digest" };
  const receipt = { version: 1, ...expected, files };
  validateBuildReceipt(receipt, expected, files);
  for (const change of [{ sha: "b".repeat(40) }, { runId: "13" }, { profile: "changed" }, { version: 2 }])
    assert.throws(() => validateBuildReceipt({ ...receipt, ...change }, expected, files));
  assert.throws(() => validateBuildReceipt(receipt, expected, { ...files, "dist/app.js": "injected" }));
  assert.throws(() => validateBuildReceipt(receipt, expected, {}));
});

test("real CLI records and verifies a complete artifact, fails after corruption, and plans PRs offline", t => {
  mkdirSync(join(root, ".release"), { recursive: true });
  const fixture = mkdtempSync(join(root, ".release", "test-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: fixture, stdio: "pipe" });
  git("init", "-q");
  git("-c", "user.name=Release test", "-c", "user.email=release-test@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-qm", "Fixture");
  mkdirSync(join(fixture, "dist"));
  mkdirSync(join(fixture, "functions"));
  writeFileSync(join(fixture, "dist/index.html"), "built page");
  writeFileSync(join(fixture, "functions/seo-manifest.json"), "{}");
  const env = { ...process.env, GITHUB_RUN_ID: "12", GITHUB_OUTPUT: join(fixture, "outputs"),
    GITHUB_EVENT_NAME: "pull_request", VITE_SITE_URL: "https://example.test" };
  const run = (command, environment = env) => spawnSync(process.execPath, [join(root, "scripts/pages-release.mjs"), command],
    { cwd: fixture, env: environment, encoding: "utf8" });
  assert.equal(run("record").status, 0);
  assert.equal(run("verify-build").status, 0);
  assert.notEqual(run("verify-build", { ...env, GITHUB_RUN_ID: "13" }).status, 0);
  assert.equal(run("cache-key").status, 0);
  const initial = readFileSync(env.GITHUB_OUTPUT, "utf8");
  writeFileSync(env.GITHUB_OUTPUT, "");
  assert.equal(run("cache-key", { ...env, GITHUB_RUN_ATTEMPT: "2" }).status, 0);
  assert.equal(readFileSync(env.GITHUB_OUTPUT, "utf8"), initial);
  writeFileSync(join(fixture, "dist/index.html"), "corrupted");
  assert.notEqual(run("verify-build").status, 0);
  assert.equal(run("plan").status, 0);
  assert.match(readFileSync(env.GITHUB_OUTPUT, "utf8"), /deploy=false/u);
});
