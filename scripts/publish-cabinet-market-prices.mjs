import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { CABINET_PRICE_TARGETS } from "../supabase/functions/_shared/cabinet-price-targets.ts";
import { managedAction } from "../supabase/functions/_shared/managed-targets.ts";
import { verifyGithubOidcToken } from "../supabase/functions/content-publish/github-oidc.ts";
import { issueManagedPermit, readManagedPermit } from "../supabase/functions/content-publish/permit-issuer.ts";
import { reviewedBodyPhrases } from "./lib/publisher-public-readback.mjs";

export const APPROVAL_ID = "owner-approved-c2-cabinet-market-prices-20261121";
const repository = "wangchaozhuanyong/zhuangxiuwangzhan";
const repositoryId = 1248188229;
const workflowRef = `${repository}/.github/workflows/content-publish-approved.yml@refs/heads/main`;
const site = "https://flashcast.com.my";
const supabase = "https://rbsnyexjifounogswrjp.supabase.co";
const sourcePath = "drafts/publishing/c2-cabinet-market-prices-20261121.json";
const root = fileURLToPath(new URL("../", import.meta.url));
const source = JSON.parse(readFileSync(join(root, sourcePath), "utf8"));

const ordered = value => Array.isArray(value) ? value.map(ordered)
  : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort()
    .map(key => [key, ordered(value[key])])) : value ?? null;

export const digest = value => createHash("sha256").update(JSON.stringify(ordered(value))).digest("hex");
const project = (row, fields) => Object.fromEntries(fields.map(field => [field, row[field] ?? null]));

export function getCabinetCandidate(name) {
  const target = CABINET_PRICE_TARGETS.find(candidate => candidate.candidateVersion === name);
  assert(target, "Unknown cabinet candidate");
  const entry = source.entries[name];
  assert.equal(source.schema, "flashcast-c2-cabinet-market-prices/v1");
  assert.equal(entry?.recordId, target.id);
  assert.equal(entry.slug, target.slug);
  assert.equal(entry.expectedUpdatedAt, target.expectedUpdatedAt);
  assert.deepEqual(Object.keys(entry.insertions).sort(), target.changedFields);
  return { target, entry };
}

export function buildCabinetCandidate(before, target, entry) {
  assert.equal(before.id, target.id);
  assert.equal(before.slug, target.slug);
  assert.equal(before.status, "published");
  assert.equal(before.updated_at, target.expectedUpdatedAt, "The published version changed");
  assert.equal(digest(project(before, target.baselineProjectionFields)), target.baselineFieldsSha256,
    "The full published baseline changed");
  const desired = Object.fromEntries(target.changedFields.map(field => {
    const { anchor, fragment } = entry.insertions[field];
    assert(anchor && fragment && typeof before[field] === "string");
    assert.equal(before[field].split(anchor).length, 2, `Expected one article anchor for ${field}`);
    assert(!before[field].includes(fragment), `Budget block already exists in ${field}`);
    return [field, before[field].replace(anchor, () => fragment + anchor)];
  }));
  const rollback = project(before, target.changedFields);
  assert.equal(digest(desired), target.desiredFieldsSha256, "Draft bytes differ from the reviewed candidate");
  assert.equal(digest(rollback), target.rollbackFieldsSha256);
  assert.equal(digest(project(before, target.retainedProjectionFields)), target.retainedFieldsSha256);
  return { desired, rollback };
}

function assertEnvironment(env, checkout) {
  assert.equal(resolve(process.cwd()), resolve(root));
  assert.equal(env.GITHUB_ACTIONS, "true");
  assert.equal(env.GITHUB_EVENT_NAME, "workflow_dispatch");
  assert.equal(env.GITHUB_REF, "refs/heads/main");
  assert.equal(env.GITHUB_REPOSITORY, repository);
  assert.equal(env.GITHUB_REPOSITORY_ID, String(repositoryId));
  assert.equal(env.GITHUB_WORKFLOW_REF, workflowRef);
  assert.match(env.GITHUB_SHA, /^[0-9a-f]{40}$/u);
  assert.equal(env.GITHUB_SHA, checkout);
  assert(["dry-run", "publish"].includes(env.PUBLISH_MODE));
  assert.equal(env.APPROVAL_ID, APPROVAL_ID);
  assert.equal(env.MANAGED_OPERATION, "publish");
  assert(!env.MANAGED_PERMIT_ID && !env.PARENT_RUN_ID);
  assert.equal(env.VITE_SITE_URL, site);
  assert.equal(new URL(env.VITE_SUPABASE_URL).origin, supabase);
  for (const key of ["GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT", "GITHUB_ACTOR_ID"]) {
    assert.match(env[key], /^[1-9][0-9]*$/u);
    assert(Number.isSafeInteger(Number(env[key])));
  }
  for (const key of ["ACTIONS_ID_TOKEN_REQUEST_URL", "ACTIONS_ID_TOKEN_REQUEST_TOKEN", "CONTENT_PUBLISH_SECRET", "VITE_SUPABASE_ANON_KEY"]) {
    assert(env[key], `Workflow secret or identity is unavailable: ${key}`);
  }
  if (env.PUBLISH_MODE === "publish") assert(env.SUPABASE_SERVICE_ROLE_KEY);
}

async function readSite(path) {
  const response = await fetch(site + path, {
    redirect: "manual", cache: "no-store", headers: { "cache-control": "no-cache" },
    signal: AbortSignal.timeout(25_000),
  });
  assert.equal(response.status, 200, `Public readback failed for ${path}`);
  return response.text();
}

async function publicEvidence(target, entry, verifyBody) {
  const sitemap = await readSite("/sitemap.xml");
  return Promise.all(["en", "zh", "ms"].map(async language => {
    const path = `/${language}/blog/${target.slug}`;
    assert(sitemap.includes(`<loc>${site + path}</loc>`), `Article absent from sitemap: ${path}`);
    const html = await readSite(path);
    const title = html.match(/<title\b[^>]*>.*?<\/title>/is)?.[0];
    const description = html.match(/<meta\b[^>]*\bname=["']description["'][^>]*>/i)?.[0];
    const canonical = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0];
    const alternates = html.match(/<link\b[^>]*\bhreflang=["'][^"']+["'][^>]*>/gi)?.sort();
    assert(title && description && canonical?.includes(site + path) && alternates?.length, `Incomplete SEO metadata: ${path}`);
    if (verifyBody) {
      const readable = html.match(/<main\b[^>]*data-flashcast-readable-body[^>]*>([\s\S]*?)<\/main>/i)?.[1];
      assert(readable, `Missing initial readable article: ${path}`);
      const actual = new Set(reviewedBodyPhrases(readable));
      const expected = reviewedBodyPhrases(entry.insertions[`content_${language}`].fragment);
      assert(expected.length > 0 && expected.every(phrase => actual.has(phrase)),
        `Budget content missing from initial readable article: ${path}`);
    }
    return { path, status: 200, title, description, canonical, alternates, inSitemap: true };
  }));
}

async function run(env) {
  assertEnvironment(env, execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim());
  const { target, entry } = getCabinetCandidate(env.PUBLISH_TARGET);
  const output = join(root, "audits", `content-publish-${env.GITHUB_RUN_ID}`, "cabinet-market-prices");
  mkdirSync(output, { recursive: true });
  const write = (name, data) => writeFileSync(join(output, name), `${JSON.stringify(data, null, 2)}\n`);

  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const reader = createClient(supabase, env.VITE_SUPABASE_ANON_KEY, options);
  const readCurrent = async () => {
    const { data, error } = await reader.from(target.table).select(target.baselineProjectionFields.join(","))
      .eq("id", target.id).single();
    assert(!error && data, "The exact public CMS row could not be read");
    return data;
  };
  const before = await readCurrent();
  const { desired, rollback } = buildCabinetCandidate(before, target, entry);
  write("before.json", before);
  write("rollback-fields.json", rollback);
  const beforePublic = await publicEvidence(target, entry, false);
  write("before-public.json", beforePublic);

  const endpoint = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);
  endpoint.searchParams.set("audience", "api://flashcast-managed-cms-publish");
  const oidcResponse = await fetch(endpoint, {
    headers: { authorization: `Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` }, signal: AbortSignal.timeout(20_000),
  });
  assert.equal(oidcResponse.status, 200);
  const { value: oidc } = await oidcResponse.json();
  const identity = await verifyGithubOidcToken(oidc);
  assert.deepEqual(identity, {
    repositoryId, workflowRef, workflowSha: env.GITHUB_SHA,
    actorId: Number(env.GITHUB_ACTOR_ID), runId: Number(env.GITHUB_RUN_ID), runAttempt: Number(env.GITHUB_RUN_ATTEMPT),
  });
  const post = async body => {
    const response = await fetch(`${supabase}/functions/v1/content-publish`, {
      method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(120_000),
      headers: { "content-type": "application/json", "x-cron-secret": env.CONTENT_PUBLISH_SECRET, "x-managed-github-oidc": oidc },
    });
    const result = await response.json();
    assert(response.ok && result.ok, `Protected publisher HTTP ${response.status}: ${result.error || "request failed"}`);
    return result;
  };

  const selection = { ...managedAction(target, "publish"), operation: "publish" };
  const request = {
    contentType: "blog", nextStatus: "published", expectedUpdatedAt: before.updated_at, record: { ...before, ...desired },
  };
  const preview = await post({ ...request, mode: "dry-run", managedCandidate: selection });
  assert.equal(preview.dry_run, true);
  assert.deepEqual(preview.payload_preview, desired);
  assert.equal(digest(await readCurrent()), digest(before));
  write("preview.json", preview);
  if (env.PUBLISH_MODE === "dry-run") {
    write("completion.json", { mode: "dry-run", slug: target.slug, fields: target.changedFields, productionWrites: 0 });
    return;
  }

  const issuer = createClient(supabase, env.SUPABASE_SERVICE_ROLE_KEY, options);
  const { data: prior, error: historyError } = await issuer.from("managed_cms_release_permits")
    .select("status,expires_at").eq("task_id", target.taskId).eq("record_id", target.id)
    .eq("candidate_version", target.candidateVersion);
  assert(!historyError && Array.isArray(prior), "Could not verify prior permit history");
  assert(!prior.some(permit => ["completed", "writing", "uncertain"].includes(permit.status)
    || ["issued", "claimed"].includes(permit.status) && Date.parse(permit.expires_at) > Date.now()),
  "An active or completed permit already exists; inspect its receipt without replaying the write");

  const authorization = { approvalId: APPROVAL_ID, ownerApproved: true, explicitExecution: true };
  const evidence = { ...authorization, identity, sourcePath, projectionSha256: target.baselineFieldsSha256,
    payloadSha256: target.desiredFieldsSha256, rollbackSha256: target.rollbackFieldsSha256 };
  write("issuer-evidence.json", evidence);
  const issued = await issueManagedPermit(issuer, {
    permitId: randomUUID(), ...selection, actionClass: "cms_write", recordId: target.id, slug: target.slug,
    expectedUpdatedAt: before.updated_at, payloadSha256: target.desiredFieldsSha256,
    rollbackPayloadSha256: target.rollbackFieldsSha256, githubActorId: identity.actorId,
    githubWorkflowSha: identity.workflowSha, qaReceiptId: `cabinet-prices-qa-${identity.runId}`,
    operationsDecisionId: APPROVAL_ID, policyDecisionId: "exact-trilingual-blog-body-cas-oidc-v1",
    issuerEvidenceSha256: digest(evidence), expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
  });
  write("permit-issued.json", issued);
  const receipt = await post({ ...request, mode: "publish", ...authorization,
    managedPermit: { ...selection, permitId: issued.permitId } });
  write("publish-receipt.json", receipt);
  const saved = await readCurrent();
  const completed = await readManagedPermit(issuer, issued.permitId);
  write("readback.json", { saved, completed });
  assert.equal(receipt.dry_run, false);
  assert.equal(receipt.saved_id, target.id);
  assert.notEqual(saved.updated_at, before.updated_at);
  assert.equal(receipt.saved_updated_at, saved.updated_at);
  assert.deepEqual(project(saved, target.changedFields), desired);
  assert.equal(digest(project(saved, target.retainedProjectionFields)), target.retainedFieldsSha256);
  assert.equal(completed?.status, "completed");
  assert.equal(completed.savedId, target.id);
  assert.equal(completed.githubRunId, identity.runId);
  assert.equal(completed.githubRunAttempt, identity.runAttempt);

  const inverse = { contentType: "blog", mode: "dry-run", nextStatus: "published", managedOperation: "rollback",
    expectedUpdatedAt: saved.updated_at, record: { ...saved, ...rollback },
    managedCandidate: { ...managedAction(target, "rollback"), operation: "rollback" } };
  const inversePreview = await post(inverse);
  assert.equal(inversePreview.dry_run, true);
  assert.deepEqual(inversePreview.payload_preview, rollback);
  assert.equal(digest(await readCurrent()), digest(saved));
  write("rollback-plan.json", { request: inverse, parentPermitId: issued.permitId,
    parentRunId: identity.runId, dryRun: inversePreview, productionRollbackPerformed: false });

  const afterPublic = await publicEvidence(target, entry, true);
  assert.deepEqual(afterPublic, beforePublic, "Published page metadata or sitemap membership changed");
  write("after-public.json", afterPublic);
  write("completion.json", { mode: "publish", slug: target.slug, fields: target.changedFields,
    savedUpdatedAt: saved.updated_at, productionWrites: 1, publicPaths: afterPublic.map(page => page.path) });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.env).catch(error => {
    let message = String(error?.message || "Cabinet publication failed");
    for (const key of ["CONTENT_PUBLISH_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_ANON_KEY", "ACTIONS_ID_TOKEN_REQUEST_TOKEN"]) {
      if (process.env[key]) message = message.split(process.env[key]).join("[redacted]");
    }
    console.error(message);
    process.exitCode = 1;
  });
}
