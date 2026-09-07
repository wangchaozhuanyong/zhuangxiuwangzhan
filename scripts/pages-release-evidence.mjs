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
    ...(token ? { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } } : {}),
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
  } else if (command === "deployment") {
    save(input, await captureDeployment({ account: env.CLOUDFLARE_ACCOUNT_ID, project: env.CLOUDFLARE_PAGES_PROJECT_NAME, token: env.CLOUDFLARE_API_TOKEN, expectedSha: env.EXPECTED_DEPLOYMENT_SHA }));
  } else {
    throw new Error("Expected freeze, verify, compile, ci or deployment command");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`[pages-release-evidence] ${error instanceof Error ? error.message : "Evidence check failed"}`);
    process.exitCode = 1;
  });
}
