import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { MALAY_TRANSLATION_MANIFEST_SHA256, MALAY_TRANSLATION_TARGETS } from "../supabase/functions/_shared/malay-translation-targets.ts";
import { verifyGithubOidcToken } from "../supabase/functions/content-publish/github-oidc.ts";
import { issueManagedPermit, readManagedPermit, revokeManagedPermit } from "../supabase/functions/content-publish/permit-issuer.ts";
import { samePgTimestamp } from "../supabase/functions/content-publish/managed-timestamp.ts";
import { githubOidcTokenNeedsRefresh, isExpiredUnclaimedPermitForTarget } from "./lib/malay-publish-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TASK_ID = "fc-20261019-malay-cms-completion-v1";
const TARGET_NAME = "malay-cms-continuation-20261019";
const APPROVAL_ID = "owner-authorized-malay-cms-completion-20261019";
const QA_RECEIPT_ID = "fc-malay-cms-qa-20261019-v1";
const POLICY_DECISION_ID = "managed-cms-malay-empty-fields-v1";
const WORKFLOW_REF = "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main";
const AUDIENCE = "api://flashcast-managed-cms-publish";
const REPOSITORY_ID = 1248188229;
const args = process.argv.slice(2);
const mode = args.find((arg) => arg.startsWith("--mode="))?.slice(7) || "";
const artifactArg = args.find((arg) => arg.startsWith("--artifact-dir="))?.slice(15);
const env = process.env;
const fail = (message) => { throw new Error(message); };
const writeJson = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
};
const stable = (value) => Array.isArray(value) ? value.map(stable)
  : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  : value ?? null;
const digest = (value) => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
const project = (row, fields) => Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
const same = (a, b) => digest(a) === digest(b);
const candidate = JSON.parse(readFileSync(join(ROOT, "drafts/malay-cms-continuation-20261019/candidates-v1.json"), "utf8"));
const targets = MALAY_TRANSLATION_TARGETS;
const targetById = new Map(targets.map((target) => [target.id, target]));
const entryById = new Map(candidate.entries.map((entry) => [entry.id, entry]));

function buildTargetProjection() {
  return candidate.entries.map((entry) => ({
    id: entry.id, slug: entry.slug, contentType: "translation_patch",
    taskId: TASK_ID,
    actionId: `publish-malay-${entry.table}-${entry.id.slice(0, 8)}`,
    candidateVersion: `malay-cms-continuation-v1-${entry.id.slice(0, 8)}`,
    scope: `flashcast.com.my:${entry.table}/${entry.id}:${entry.changedFields.join(",")}:malay-v1`,
    changedFields: entry.changedFields,
    desiredFieldsSha256: entry.desiredFieldsSha256,
    baselineFieldsSha256: entry.baselineFieldsSha256,
    rollbackFieldsSha256: entry.rollbackFieldsSha256,
    expectedUpdatedAt: entry.expectedUpdatedAt,
    versionField: entry.versionField,
    table: entry.table,
    baselineProjectionFields: entry.baselineProjectionFields,
    rollbackAllowed: false,
  }));
}

function assertRunEnvironment() {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  if (!["dry-run", "publish"].includes(mode) || env.GITHUB_ACTIONS !== "true"
      || env.GITHUB_REF !== "refs/heads/main" || env.GITHUB_REPOSITORY !== "wangchaozhuanyong/zhuangxiuwangzhan"
      || String(env.GITHUB_REPOSITORY_ID) !== String(REPOSITORY_ID) || env.GITHUB_WORKFLOW_REF !== WORKFLOW_REF
      || env.GITHUB_EVENT_NAME !== "workflow_dispatch" || !/^[0-9a-f]{40}$/.test(env.GITHUB_SHA || "")
      || env.GITHUB_SHA !== head || env.PUBLISH_TARGET !== TARGET_NAME
      || env.APPROVAL_ID !== APPROVAL_ID || env.MANAGED_OPERATION !== "publish"
      || env.MANAGED_PERMIT_ID || env.PARENT_RUN_ID
      || ![env.GITHUB_ACTOR_ID, env.GITHUB_RUN_ID, env.GITHUB_RUN_ATTEMPT]
        .every((value) => /^[1-9][0-9]*$/.test(String(value)) && Number.isSafeInteger(Number(value)))
      || !env.ACTIONS_ID_TOKEN_REQUEST_URL || !env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
    fail("This publisher accepts only this exact main-branch forward-publish workflow run.");
  }
  if (resolve(process.cwd()) !== ROOT) fail("Publisher must run from its owning project checkout.");
  if (!env.VITE_SUPABASE_URL || new URL(env.VITE_SUPABASE_URL).host !== "rbsnyexjifounogswrjp.supabase.co"
      || !env.VITE_SUPABASE_ANON_KEY || !env.CONTENT_PUBLISH_SECRET
      || env.VITE_SITE_URL !== "https://flashcast.com.my") {
    fail("Publisher is missing an existing FLASH CAST production endpoint or credential.");
  }
  if (mode === "publish" && !env.SUPABASE_SERVICE_ROLE_KEY) {
    fail("The protected permit issuer credential is missing.");
  }
  if (candidate.taskId !== TASK_ID || candidate.languageReview?.status !== "reviewed-final-static-qa"
      || candidate.rowCount !== 231 || candidate.fieldCount !== 926 || candidate.entries.length !== 231
      || candidate.manifestSha256 !== MALAY_TRANSLATION_MANIFEST_SHA256
      || digest(buildTargetProjection()) !== MALAY_TRANSLATION_MANIFEST_SHA256
      || targets.length !== candidate.entries.length) {
    fail("The candidate, final language review, or exact 231-row manifest differs from its pinned registry.");
  }
  for (const entry of candidate.entries) {
    const target = targetById.get(entry.id);
    if (!target || target.table !== entry.table || target.slug !== entry.slug
        || target.contentType !== "translation_patch" || target.taskId !== TASK_ID
        || target.versionField !== entry.versionField || !same(target.changedFields, entry.changedFields)
        || !same(target.baselineProjectionFields, entry.baselineProjectionFields)
        || target.expectedUpdatedAt !== entry.expectedUpdatedAt
        || target.baselineFieldsSha256 !== entry.baselineFieldsSha256
        || target.desiredFieldsSha256 !== entry.desiredFieldsSha256
        || target.rollbackFieldsSha256 !== entry.rollbackFieldsSha256
        || target.rollbackAllowed !== false || !same(entry.patch, Object.fromEntries(entry.changedFields.map((field) => [field, entry.patch[field]])))
        || Object.keys(entry.patch).some((field) => !field.endsWith("_ms"))) {
      fail(`Candidate registry mismatch for ${entry.table}/${entry.id}.`);
    }
  }
}

async function assertMainAndDeployedVersion() {
  const remote = execFileSync("git", ["ls-remote", "origin", "refs/heads/main"], { cwd: ROOT, encoding: "utf8" }).trim();
  const remoteSha = remote.split(/\s+/)[0];
  if (remoteSha !== env.GITHUB_SHA) fail("Remote main moved after this workflow was dispatched; stop and rebuild from current main.");
  const url = new URL("/__flashcast/version", env.VITE_SITE_URL);
  url.searchParams.set("malay_cms_run", env.GITHUB_RUN_ID);
  const response = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(20_000) });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.deploymentVersion !== env.GITHUB_SHA) {
    fail("The production website is not serving this exact main commit; no CMS writes may start.");
  }
  return { checkedAt: new Date().toISOString(), remoteMainSha: remoteSha, liveDeploymentSha: body.deploymentVersion };
}

async function managedIdentity() {
  const url = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);
  url.searchParams.set("audience", AUDIENCE);
  const response = await fetch(url, { cache: "no-store", headers: { Authorization: `Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) fail("GitHub workflow identity could not be verified.");
  const data = await response.json();
  const identity = await verifyGithubOidcToken(data.value);
  if (identity.repositoryId !== REPOSITORY_ID || identity.workflowRef !== WORKFLOW_REF
      || identity.workflowSha !== env.GITHUB_SHA || identity.runId !== Number(env.GITHUB_RUN_ID)
      || identity.runAttempt !== Number(env.GITHUB_RUN_ATTEMPT)
      || !Number.isSafeInteger(identity.actorId) || identity.actorId <= 0) {
    fail("Verified GitHub identity does not match the current locked workflow run.");
  }
  return { token: data.value, identity };
}

async function readTargetRows() {
  const grouped = new Map();
  for (const target of targets) {
    const entry = entryById.get(target.id);
    const current = grouped.get(target.table) || { ids: [], fields: entry.baselineProjectionFields };
    if (!same(current.fields, entry.baselineProjectionFields)) fail(`Row projections differ within ${target.table}.`);
    current.ids.push(target.id);
    grouped.set(target.table, current);
  }
  const result = new Map();
  await Promise.all([...grouped].map(async ([table, config]) => {
    const url = new URL(`/rest/v1/${table}`, env.VITE_SUPABASE_URL);
    url.searchParams.set("id", `in.(${config.ids.join(",")})`);
    url.searchParams.set("select", config.fields.join(","));
    const response = await fetch(url, { cache: "no-store", headers: {
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    }, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) fail(`Read-only ${table} preflight failed with HTTP ${response.status}.`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== config.ids.length) fail(`Expected the exact public row count for ${table}.`);
    for (const row of rows) {
      if (!config.ids.includes(row.id) || result.has(row.id)) fail(`Unexpected or duplicate ${table} row in public preflight.`);
      result.set(row.id, row);
    }
  }));
  return result;
}

async function readExactRow(target) {
  const url = new URL(`/rest/v1/${target.table}`, env.VITE_SUPABASE_URL);
  url.searchParams.set("id", `eq.${target.id}`);
  url.searchParams.set("select", target.baselineProjectionFields.join(","));
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { cache: "no-store", headers: {
    apikey: env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
  }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) fail(`Read-only ${target.table}/${target.id} verification failed with HTTP ${response.status}.`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== target.id) fail(`Expected one exact public row for ${target.table}/${target.id}.`);
  return rows[0];
}

async function postContentPublish(body, oidcToken) {
  const response = await fetch(`${env.VITE_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/content-publish`, {
    method: "POST", cache: "no-store", headers: {
      "Content-Type": "application/json",
      "x-cron-secret": env.CONTENT_PUBLISH_SECRET,
      "x-managed-github-oidc": oidcToken,
    }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.ok !== true) {
    fail(`Protected content publisher rejected ${body.record?.id || "this request"} with HTTP ${response.status}; do not replay a permit.`);
  }
  return payload;
}

function requestFor(entry, target, mode, operation = "publish", permit = undefined) {
  return {
    contentType: "translation_patch",
    mode,
    record: { id: target.id, slug: target.slug, ...entry.patch },
    expectedUpdatedAt: target.expectedUpdatedAt,
    ...(mode === "dry-run" ? { managedCandidate: {
      taskId: target.taskId, actionId: target.actionId, operation,
      scope: target.scope, candidateVersion: target.candidateVersion,
    } } : { managedPermit: permit, ownerApproved: true, explicitExecution: true, approvalId: APPROVAL_ID }),
  };
}

const isEmpty = (value) => value === null || value === undefined || typeof value === "string" && value.trim() === "";
const changedProjection = (row, fields) => Object.fromEntries(fields.map((field) => [field, row[field]]));

async function assertPublicParentForImage(client, row) {
  const { data, error } = await client.from("projects").select("id,status").eq("id", row.project_id).maybeSingle();
  if (error || !data || data.status !== "published") fail("A target project image no longer belongs to a published project.");
}

function validateCurrentRows(rows, permits) {
  const plan = [];
  for (const target of targets) {
    const entry = entryById.get(target.id);
    const row = rows.get(target.id);
    if (!row || row.id !== target.id) fail(`The current ${target.table}/${target.id} row is missing.`);
    if ("status" in row && row.status !== "published") fail(`The current ${target.table}/${target.id} row is not published.`);
    if (!target.baselineProjectionFields.every((field) => field in row)) fail(`The current ${target.table}/${target.id} schema differs from the frozen projection.`);
    const permitRows = permits.filter((permit) => permit.record_id === target.id && permit.task_id === TASK_ID
      && permit.action_id === target.actionId && permit.candidate_version === target.candidateVersion);
    const currentPatch = changedProjection(row, target.changedFields);
    const alreadyApplied = same(currentPatch, entry.patch);
    const completed = permitRows.filter((permit) => permit.status === "completed" && permit.operation === "publish"
      && permit.payload_sha256 === target.desiredFieldsSha256 && permit.rollback_payload_sha256 === target.rollbackFieldsSha256
      && permit.scope === target.scope && permit.slug === target.slug);
    if (alreadyApplied) {
      if (completed.length !== 1 || completed[0].saved_id !== target.id
          || !samePgTimestamp(row[target.versionField], completed[0].saved_updated_at)) {
        fail(`Malay fields on ${target.table}/${target.id} are already filled without one exact completed permit and version.`);
      }
      plan.push({ target, entry, row, state: "completed", permit: completed[0] });
      continue;
    }
    if (!samePgTimestamp(row[target.versionField], target.expectedUpdatedAt)) {
      fail(`The current ${target.table}/${target.id} version differs from the reviewed candidate.`);
    }
    if (permitRows.some((permit) => ["issued", "claimed", "writing", "uncertain"].includes(permit.status))) {
      fail(`An earlier ${target.table}/${target.id} permit is active or uncertain; inspect its audit before continuing.`);
    }
    const baseline = project(row, target.baselineProjectionFields);
    if (digest(baseline) !== target.baselineFieldsSha256
        || target.changedFields.some((field) => !isEmpty(row[field]))) {
      fail(`The current ${target.table}/${target.id} row or empty Malay field differs from its locked baseline.`);
    }
    plan.push({ target, entry, row, state: "pending" });
  }
  return plan;
}

async function revokeExpiredUnclaimedPermits(rows, permits, serviceClient, artifactRoot) {
  const receipts = [];
  const checkedAt = new Date().toISOString();
  for (const permit of permits) {
    const target = targetById.get(permit.record_id);
    if (!target || !isExpiredUnclaimedPermitForTarget(permit, target, Date.now(), samePgTimestamp)) continue;
    const row = rows.get(target.id);
    const baselineStillEmpty = row && row.id === target.id
      && samePgTimestamp(row[target.versionField], target.expectedUpdatedAt)
      && digest(project(row, target.baselineProjectionFields)) === target.baselineFieldsSha256
      && target.changedFields.every((field) => isEmpty(row[field]));
    if (!baselineStillEmpty) {
      fail(`Expired permit for ${target.table}/${target.id} cannot be revoked because its exact reviewed baseline is no longer empty.`);
    }
    const revoked = await revokeManagedPermit(serviceClient, permit.permit_id);
    const readback = await readManagedPermit(serviceClient, permit.permit_id);
    if (revoked.status !== "revoked" || readback?.status !== "revoked") {
      fail(`Expired permit revocation was not confirmed for ${target.table}/${target.id}.`);
    }
    permit.status = "revoked";
    receipts.push({ permitId: permit.permit_id, table: target.table, rowId: target.id,
      priorStatus: "issued", expiresAt: permit.expires_at, status: readback.status,
      baselineFieldsSha256: target.baselineFieldsSha256 });
  }
  if (receipts.length) writeJson(join(artifactRoot, "permit-recovery.json"), {
    checkedAt, reason: "Expired, unclaimed permits were revoked only after the exact CMS row still matched its empty reviewed baseline.",
    permits: receipts,
  });
  return receipts;
}

function routeFor(entry, row, extras = {}) {
  if (entry.table === "blog_posts") return `/ms/blog/${row.slug}`;
  if (entry.table === "services") return `/ms/services/${row.slug}`;
  if (entry.table === "service_areas") return `/ms/locations/${row.slug}`;
  if (entry.table === "before_after_items") return "/ms/before-after";
  if (entry.table === "project_images") return extras.projectSlug?.get(row.project_id)
    ? `/ms/projects/${extras.projectSlug.get(row.project_id)}` : "/ms/projects";
  if (entry.table === "process_steps") return "/ms/process";
  if (entry.table === "faqs") return "/ms/faq";
  if (entry.table === "cms_content_entries") {
    if (row.content_type === "blog_post") return `/ms/blog/${row.slug}`;
    if (row.content_type === "service") return `/ms/services/${row.slug}`;
    if (row.content_type === "project") return `/ms/projects/${row.slug}`;
  }
  if (entry.table === "cms_pages" || entry.table === "site_pages") {
    const path = row.path;
    if (typeof path === "string" && path.startsWith("/") && !path.includes(":")) return path === "/" ? "/ms" : `/ms${path}`;
  }
  if (entry.table === "cms_sections" && extras.cmsPagePath?.get(row.page_id)) {
    const path = extras.cmsPagePath.get(row.page_id);
    return path === "/" ? "/ms" : `/ms${path}`;
  }
  return "/ms";
}

async function routeReadback(plan, artifactRoot, serviceClient) {
  mkdirSync(join(artifactRoot, "screenshots"), { recursive: true });
  const projectIds = [...new Set(plan.filter((item) => item.target.table === "project_images").map((item) => item.row.project_id))];
  const projectSlug = new Map();
  if (projectIds.length) {
    const { data, error } = await serviceClient.from("projects").select("id,slug,status").in("id", projectIds);
    if (error || !Array.isArray(data)) fail("Could not map public project image rows to their public routes.");
    for (const row of data) if (row.status === "published" && row.slug) projectSlug.set(row.id, row.slug);
  }
  const pageIds = [...new Set(plan.filter((item) => item.target.table === "cms_sections").map((item) => item.row.page_id))];
  const cmsPagePath = new Map();
  if (pageIds.length) {
    const { data, error } = await serviceClient.from("cms_pages").select("id,path,status").in("id", pageIds);
    if (error || !Array.isArray(data)) fail("Could not map public CMS section rows to their page routes.");
    for (const row of data) if (row.status === "published" && row.path) cmsPagePath.set(row.id, row.path);
  }
  const routes = new Set(["/ms", "/ms/services", "/ms/blog", "/ms/projects", "/ms/locations", "/ms/materials", "/ms/faq", "/ms/process", "/ms/contact"]);
  const routeRows = plan.map(({ entry, row }) => ({ table: entry.table, id: entry.id, path: routeFor(entry, row, { projectSlug, cmsPagePath }) }));
  for (const item of routeRows) routes.add(item.path);
  const checks = [];
  const list = [...routes];
  for (let offset = 0; offset < list.length; offset += 8) {
    const chunk = list.slice(offset, offset + 8);
    const results = await Promise.all(chunk.map(async (path) => {
      const url = new URL(path, env.VITE_SITE_URL);
      url.searchParams.set("malay_cms_run", env.GITHUB_RUN_ID);
      const response = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(30_000) });
      const html = await response.text();
      return { path, status: response.status, htmlBytes: Buffer.byteLength(html), hasHtml: /<html\b/i.test(html), hasMain: /<main\b/i.test(html) };
    }));
    checks.push(...results);
  }
  if (checks.some((check) => check.status !== 200 || !check.hasHtml || !check.hasMain)) {
    fail("At least one affected Malay route failed its live read-only page check.");
  }

  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true, channel: env.PLAYWRIGHT_CHROMIUM_CHANNEL || "chrome" });
  const viewportChecks = [];
  let runtimeErrors = 0;
  let blockedNonReads = 0;
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route("**/*", (route) => {
      const request = route.request();
      const telemetry = /(google-analytics\.com|googletagmanager\.com|doubleclick\.net|connect\.facebook\.net|clarity\.ms|hotjar\.|\/page_visits(?:\?|$)|\/g\/collect(?:\?|$))/i.test(request.url());
      if (telemetry || !["GET", "HEAD", "OPTIONS"].includes(request.method())) { blockedNonReads++; return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", () => { runtimeErrors++; });
    const representative = ["/ms", ...routeRows.filter((row) => ["blog_posts", "services", "service_areas", "project_images"].includes(row.table)).map((row) => row.path)];
    const browserRoutes = [...new Set(representative)].slice(0, 16);
    for (const path of browserRoutes) {
      for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
        await page.setViewportSize(viewport);
        const response = await page.goto(`${env.VITE_SITE_URL}${path}?malay_cms_browser=${env.GITHUB_RUN_ID}`, { waitUntil: "domcontentloaded", timeout: 40_000 });
        const rendered = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          title: document.title,
          h1: document.querySelector("main h1")?.textContent?.trim() || "",
          bodyLength: document.querySelector("main")?.innerText?.trim().length || 0,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        const check = { path, viewport, status: response?.status() || 0, ...rendered,
          noHorizontalOverflow: rendered.scrollWidth <= rendered.innerWidth + 2 };
        viewportChecks.push(check);
        await page.screenshot({ path: join(artifactRoot, "screenshots", `${Buffer.from(path).toString("hex").slice(0, 36)}-${viewport.width}.png`), fullPage: false });
        if (check.status !== 200 || check.bodyLength < 20 || !check.noHorizontalOverflow
            || !/^ms(?:-|$)/i.test(check.lang)) fail(`Live Malay browser check failed for ${path} at ${viewport.width}px.`);
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
  if (runtimeErrors) fail("A Malay public page produced a browser runtime error.");
  writeJson(join(artifactRoot, "public-route-readback.json"), { checkedAt: new Date().toISOString(), routes: checks,
    viewportChecks, runtimeErrors, blockedNonReads, businessWrites: 0 });
  return { routeCount: checks.length, viewportCount: viewportChecks.length, runtimeErrors, blockedNonReads };
}

async function main() {
  assertRunEnvironment();
  const artifactRoot = resolve(ROOT, artifactArg || `audits/content-publish-${env.GITHUB_RUN_ID}`);
  if (relative(ROOT, artifactRoot).startsWith("..") || relative(ROOT, artifactRoot) === "") fail("Audit evidence must remain inside this project checkout.");
  mkdirSync(artifactRoot, { recursive: true });
  const deployReceipt = await assertMainAndDeployedVersion();
  let identitySession = await managedIdentity();
  const identity = identitySession.identity;
  const currentManagedOidcToken = async () => {
    if (githubOidcTokenNeedsRefresh(identitySession.token)) {
      const refreshed = await managedIdentity();
      if (!same(refreshed.identity, identity)) fail("Refreshed GitHub identity differs from the locked workflow run.");
      identitySession = refreshed;
    }
    return identitySession.token;
  };
  const serviceClient = mode === "publish" ? createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }) : null;

  const identityProbe = await postContentPublish({ managedIdentityProbe: true }, await currentManagedOidcToken());
  if (identityProbe.performed_write !== false || identityProbe.dry_run !== true
      || identityProbe.identity?.runId !== identity.runId || identityProbe.identity?.workflowSha !== env.GITHUB_SHA) {
    fail("Publisher identity probe did not return the exact current run without a write.");
  }
  const rowsBefore = await readTargetRows();
  const permitRows = mode === "publish" ? await serviceClient.from("managed_cms_release_permits")
    .select("permit_id,status,operation,task_id,action_id,scope,candidate_version,record_id,slug,payload_sha256,rollback_payload_sha256,expected_updated_at,expires_at,github_run_id,github_run_attempt,saved_id,saved_updated_at")
    .eq("task_id", TASK_ID).then(({ data, error }) => {
      if (error || !Array.isArray(data)) fail("Could not inspect prior permits for this exact Malay batch.");
      return data;
    }) : [];
  if (serviceClient) await revokeExpiredUnclaimedPermits(rowsBefore, permitRows, serviceClient, artifactRoot);
  const plan = validateCurrentRows(rowsBefore, permitRows);
  if (serviceClient) for (const item of plan.filter((entry) => entry.target.table === "project_images")) {
    await assertPublicParentForImage(serviceClient, item.row);
  }
  writeJson(join(artifactRoot, "deployment-and-identity.json"), { deployReceipt, identity, probe: {
    ok: identityProbe.ok, dryRun: identityProbe.dry_run, performedWrite: identityProbe.performed_write,
  } });
  writeJson(join(artifactRoot, "preflight-baseline.json"), plan.map(({ target, entry, row, state }) => ({
    table: target.table, id: target.id, slug: target.slug, state,
    expectedVersion: target.expectedUpdatedAt, versionField: target.versionField,
    baselineFieldsSha256: target.baselineFieldsSha256, desiredFieldsSha256: target.desiredFieldsSha256,
    sourceReadbackSha256: digest(project(row, target.baselineProjectionFields)), changedFields: [...target.changedFields],
  })));

  const dryRunReceipts = [];
  for (const item of plan.filter((entry) => entry.state === "pending")) {
    const target = item.target;
    const receipt = await postContentPublish(requestFor(item.entry, target, "dry-run"), await currentManagedOidcToken());
    if (receipt.dry_run !== true || receipt.performed_write !== false || receipt.content_type !== "translation_patch"
        || receipt.existing_id !== target.id || !same(receipt.payload_preview, item.entry.patch)
        || receipt.payload_sha256 !== target.desiredFieldsSha256
        || receipt.baseline_fields_sha256 !== target.baselineFieldsSha256) {
      fail(`The zero-write preview differs from the locked Malay candidate for ${target.table}/${target.id}.`);
    }
    dryRunReceipts.push({ table: target.table, id: target.id, fields: target.changedFields.length,
      baselineFieldsSha256: receipt.baseline_fields_sha256, payloadSha256: receipt.payload_sha256,
      dryRun: receipt.dry_run, performedWrite: receipt.performed_write });
  }
  const rowsAfterDryRun = await readTargetRows();
  for (const item of plan.filter((entry) => entry.state === "pending")) {
    const target = item.target;
    if (!same(project(rowsAfterDryRun.get(target.id), target.baselineProjectionFields),
      project(item.row, target.baselineProjectionFields))) fail(`The zero-write preview changed ${target.table}/${target.id}.`);
  }
  writeJson(join(artifactRoot, "dry-run-receipts.json"), { checkedAt: new Date().toISOString(),
    rows: dryRunReceipts.length, fields: dryRunReceipts.reduce((sum, row) => sum + row.fields, 0), receipts: dryRunReceipts });
  if (mode === "dry-run") {
    console.log(JSON.stringify({ ok: true, mode, target: TARGET_NAME, pendingRows: dryRunReceipts.length,
      completedRowsSkipped: plan.filter((item) => item.state === "completed").length,
      fieldCount: dryRunReceipts.reduce((sum, row) => sum + row.fields, 0), zeroWrite: true, artifactRoot }));
    return;
  }

  // Reconfirm the public runtime before the first irreversible permit claim.
  const finalDeploymentReceipt = await assertMainAndDeployedVersion();
  if (finalDeploymentReceipt.liveDeploymentSha !== deployReceipt.liveDeploymentSha) fail("Production runtime changed during preflight.");
  const completedReceipts = [];
  let writesStarted = false;
  for (const item of plan) {
    const { target, entry } = item;
    if (item.state === "completed") {
      completedReceipts.push({ table: target.table, id: target.id, state: "already-completed-and-verified" });
      continue;
    }
    const current = await readExactRow(target);
    if (!current || !same(project(current, target.baselineProjectionFields), project(item.row, target.baselineProjectionFields))) {
      fail(`The locked baseline changed immediately before ${target.table}/${target.id}; no permit was issued.`);
    }
    const publishOidcToken = await currentManagedOidcToken();
    const permitInput = {
      permitId: randomUUID(), taskId: target.taskId, actionId: target.actionId, actionClass: "cms_write",
      operation: "publish", scope: target.scope, candidateVersion: target.candidateVersion,
      recordId: target.id, slug: target.slug, expectedUpdatedAt: target.expectedUpdatedAt,
      payloadSha256: target.desiredFieldsSha256, rollbackPayloadSha256: target.rollbackFieldsSha256,
      githubActorId: identity.actorId, githubWorkflowSha: identity.workflowSha,
      qaReceiptId: QA_RECEIPT_ID, operationsDecisionId: APPROVAL_ID, policyDecisionId: POLICY_DECISION_ID,
      issuerEvidenceSha256: digest({ manifestSha256: MALAY_TRANSLATION_MANIFEST_SHA256, runId: identity.runId,
        targetId: target.id, baselineSha256: target.baselineFieldsSha256, payloadSha256: target.desiredFieldsSha256,
        dryRunReceiptSha256: digest(dryRunReceipts) }),
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    };
    const issued = await issueManagedPermit(serviceClient, permitInput);
    if (issued.permitId !== permitInput.permitId || issued.status !== "issued" || issued.operation !== "publish") {
      fail(`One-time permit issuance was not confirmed for ${target.table}/${target.id}; do not retry.`);
    }
    writeJson(join(artifactRoot, "permits", `${target.table}-${target.id}.json`), {
      permitId: issued.permitId, status: issued.status, taskId: target.taskId, actionId: target.actionId,
      candidateVersion: target.candidateVersion, scope: target.scope, rowId: target.id,
      expectedVersion: target.expectedUpdatedAt, payloadSha256: target.desiredFieldsSha256,
      rollbackPayloadSha256: target.rollbackFieldsSha256, qaReceiptId: QA_RECEIPT_ID,
      operationsDecisionId: APPROVAL_ID, policyDecisionId: POLICY_DECISION_ID,
    });
    writesStarted = true;
    let published;
    try {
      published = await postContentPublish(requestFor(item.entry, target, "publish", "publish", {
        permitId: permitInput.permitId, taskId: target.taskId, actionId: target.actionId,
        operation: "publish", scope: target.scope, candidateVersion: target.candidateVersion,
      }), publishOidcToken);
    } catch (error) {
      writeJson(join(artifactRoot, "stop-after-uncertain-write.json"), { checkedAt: new Date().toISOString(),
        table: target.table, id: target.id, permitId: permitInput.permitId, writesStarted,
        instruction: "Stop. Read the public CMS row and permit status before issuing any new permit." });
      throw error;
    }
    if (published.dry_run !== false || published.performed_write !== true || published.saved_id !== target.id
        || published.content_type !== "translation_patch" || !published.saved_updated_at) {
      fail(`Protected publisher did not confirm the exact one-time write for ${target.table}/${target.id}.`);
    }
    const saved = await readExactRow(target);
    if (!saved || !same(changedProjection(saved, target.changedFields), item.entry.patch)) {
      fail(`Public row readback differs from the reviewed Malay patch for ${target.table}/${target.id}.`);
    }
    const permit = await readManagedPermit(serviceClient, permitInput.permitId);
    if (!permit || permit.status !== "completed" || permit.operation !== "publish"
        || permit.savedId !== target.id || !samePgTimestamp(permit.savedUpdatedAt, published.saved_updated_at)) {
      fail(`Completed one-time permit readback did not match the CMS row ${target.table}/${target.id}.`);
    }
    completedReceipts.push({ table: target.table, id: target.id, fields: target.changedFields.length,
      permitId: permitInput.permitId, permitStatus: permit.status, savedVersion: published.saved_updated_at,
      publicRowReadbackSha256: digest(changedProjection(saved, target.changedFields)),
      cacheInvalidation: published.cache_invalidation || null, warnings: published.warnings || [] });
    writeJson(join(artifactRoot, "row-receipts", `${target.table}-${target.id}.json`), completedReceipts.at(-1));
  }

  const rowsFinal = await readTargetRows();
  for (const item of plan) {
    const actual = rowsFinal.get(item.target.id);
    if (!actual || !same(changedProjection(actual, item.target.changedFields), item.entry.patch)) {
      fail(`Final public readback differs for ${item.target.table}/${item.target.id}.`);
    }
  }
  writeJson(join(artifactRoot, "cms-batch-completion.json"), { ok: true, checkedAt: new Date().toISOString(),
    taskId: TASK_ID, target: TARGET_NAME, approvalId: APPROVAL_ID, workflowSha: env.GITHUB_SHA,
    rows: targets.length, fields: candidate.fieldCount, permitsCompleted: completedReceipts.length,
    fieldReadbackSha256: digest(targets.map((target) => ({ id: target.id, patch: changedProjection(rowsFinal.get(target.id), target.changedFields) }))),
    rowReceipts: completedReceipts });
  const publicEvidence = await routeReadback(plan, artifactRoot, serviceClient);
  console.log(JSON.stringify({ ok: true, mode, target: TARGET_NAME, rows: targets.length, fields: candidate.fieldCount,
    completedPermits: completedReceipts.length, publicRouteCount: publicEvidence.routeCount,
    mobileAndDesktopChecks: publicEvidence.viewportCount, artifactRoot }));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Malay CMS continuation failed.";
  console.error(message.replaceAll(env.CONTENT_PUBLISH_SECRET || "\0", "[redacted]")
    .replaceAll(env.SUPABASE_SERVICE_ROLE_KEY || "\0", "[redacted]")
    .replaceAll(env.VITE_SUPABASE_ANON_KEY || "\0", "[redacted]")
    .replaceAll(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN || "\0", "[redacted]"));
  process.exitCode = 1;
});
