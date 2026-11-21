import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { JSDOM } from "jsdom";
import { CMS_SEO_TITLE_APPROVAL_ID, CMS_SEO_TITLE_BATCH_ID, CMS_SEO_TITLE_CANDIDATES } from "../supabase/functions/_shared/cms-seo-title-targets.ts";
import { verifyGithubOidcToken } from "../supabase/functions/content-publish/github-oidc.ts";
import { issueManagedPermit, readManagedPermit } from "../supabase/functions/content-publish/permit-issuer.ts";
import { samePgTimestamp } from "../supabase/functions/content-publish/managed-timestamp.ts";
import { formatPublicSeoTitle } from "../src/lib/publicSeoTitle.mjs";
import { withChineseBrandMetadata } from "../src/i18n/brandIdentity.ts";

const e = process.env;
const site = "https://flashcast.com.my";
const origin = "https://rbsnyexjifounogswrjp.supabase.co";
const repo = "wangchaozhuanyong/zhuangxiuwangzhan";
const workflow = repo + "/.github/workflows/content-publish-approved.yml@refs/heads/main";
const stable = value => Array.isArray(value) ? value.map(stable) : value != null && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value ?? null;
const digest = row => createHash("sha256").update(JSON.stringify(stable(row))).digest("hex");
const projection = (row, fields) => Object.fromEntries(fields.map(field => [field, row[field] ?? null]));
const retained = (row, target) => projection(row, Object.keys(row).filter(field =>
  field !== "updated_at" && field !== "version" && !target.changedFields.includes(field)));
const selected = t => ({ taskId: t.taskId, actionId: t.actionId, scope: t.scope, candidateVersion: t.candidateVersion, operation: "publish" });
const save = (p, data) => writeFileSync(p, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });

function assertEnvironment() {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  assert(e.GITHUB_ACTIONS === "true" && e.GITHUB_REF === "refs/heads/main" && e.GITHUB_EVENT_NAME === "workflow_dispatch");
  assert.equal(e.GITHUB_REPOSITORY, repo);
  assert.equal(e.GITHUB_REPOSITORY_ID, "1248188229");
  assert.equal(e.GITHUB_WORKFLOW_REF, workflow);
  assert.equal(e.GITHUB_SHA, sha);
  assert.equal(new URL(e.VITE_SUPABASE_URL).origin, origin);
  assert.equal(e.VITE_SITE_URL, site);
  assert.equal(e.PUBLISH_TARGET, CMS_SEO_TITLE_BATCH_ID);
  assert.equal(e.APPROVAL_ID, CMS_SEO_TITLE_APPROVAL_ID);
  assert.equal(e.MANAGED_OPERATION, "publish");
  assert(!e.MANAGED_PERMIT_ID && !e.PARENT_RUN_ID);
  assert(["dry-run", "publish"].includes(e.PUBLISH_MODE));
  assert(e.CONTENT_PUBLISH_SECRET && e.VITE_SUPABASE_ANON_KEY);
  assert.equal(Boolean(e.SUPABASE_SERVICE_ROLE_KEY), e.PUBLISH_MODE === "publish");
  for (const key of ["GITHUB_ACTOR_ID", "GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT"]) assert.match(e[key] || "", /^[1-9][0-9]*$/);
}

async function main() {
  assertEnvironment();
  const targets = CMS_SEO_TITLE_CANDIDATES;
  assert.equal(targets.length, 40);
  const paths = targets.flatMap(({target, titles, paths}) => paths.map(path => {
    const lang = path.split("/")[1];
    const field = "seo_title_" + lang;
    assert.match(path, /^\/(?:en|zh|ms)\/(?:blog(?:\/[-0-9a-z]+)?|(?:materials|services)\/[-0-9a-z]+)$/);
    assert(Object.hasOwn(titles, field), path);
    assert.equal(target.table === "site_pages" ? target.slug : path.split("/").at(-1), target.slug);
    const title = withChineseBrandMetadata({ title: formatPublicSeoTitle(titles[field]), description: "" }, lang, path).title;
    return { path, title };
  }));
  assert.equal(new Set(paths.map(x => x.path)).size, 51);
  const output = join("audits", "content-publish-" + e.GITHUB_RUN_ID, CMS_SEO_TITLE_BATCH_ID);
  mkdirSync(output, { recursive: true });
  const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
  const reader = createClient(origin, e.VITE_SUPABASE_ANON_KEY, clientOptions);
  const issuer = e.PUBLISH_MODE === "publish" ? createClient(origin, e.SUPABASE_SERVICE_ROLE_KEY, clientOptions) : null;
  const snapshots = [];
  const receiptRows = [];
  const metadataRows = [];
  const read = async t => {
    const { data, error } = await reader.from(t.table).select("*").eq("id", t.id).single();
    assert(!error && data, "Published row read failed for " + t.slug);
    return data;
  };
  const oidcUrl = new URL(e.ACTIONS_ID_TOKEN_REQUEST_URL);
  oidcUrl.searchParams.set("audience", "api://flashcast-managed-cms-publish");
  const tokenResponse = await fetch(oidcUrl, { headers: {Authorization: "Bearer " + e.ACTIONS_ID_TOKEN_REQUEST_TOKEN}, signal: AbortSignal.timeout(20000) });
  assert(tokenResponse.ok, "OIDC token request failed");
  const oidc = (await tokenResponse.json()).value;
  const identity = await verifyGithubOidcToken(oidc);
  assert.deepEqual(identity, { repositoryId: 1248188229, actorId: Number(e.GITHUB_ACTOR_ID), workflowRef: workflow,
    workflowSha: e.GITHUB_SHA, runId: Number(e.GITHUB_RUN_ID), runAttempt: Number(e.GITHUB_RUN_ATTEMPT) });

  async function post(body) {
    const response = await fetch(origin + "/functions/v1/content-publish", {
      method: "POST", headers: { "content-type": "application/json", "x-cron-secret": e.CONTENT_PUBLISH_SECRET, "x-managed-github-oidc": oidc },
      body: JSON.stringify(body), signal: AbortSignal.timeout(120000),
    });
    const result = await response.json();
    assert(response.ok && result.ok === true, "Protected publisher HTTP " + response.status + ": " + (result.error || "request failed"));
    return result;
  }
  const probe = await post({ managedIdentityProbe: true });
  assert.equal(probe.performed_write, false);
  assert.deepEqual(probe.identity, identity);

  const documentParser = new (new JSDOM().window.DOMParser)();
  const website = async path => {
    const res = await fetch(site + path, { headers: {"cache-control":"no-cache"}, redirect:"manual", signal:AbortSignal.timeout(25000) });
    assert.equal(res.status, 200, path);
    const html = await res.text();
    const doc = documentParser.parseFromString(html, "text/html");
    const meta = selector => doc.querySelector(selector)?.getAttribute("content") ?? null;
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute("href");
    const alternates = [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map(node => [node.hreflang, node.getAttribute("href")]).sort();
    const injected = html.match(/<main\s+data-flashcast-readable-body[\s\S]*?<\/main>/)?.[0] || "";
    assert.equal(canonical, site + path);
    return { title:doc.title, ogTitle:meta('meta[property="og:title"]'), cardTitle:meta('meta[name="twitter:title"]'),
      protected: { canonical, alternates, description:meta('meta[name="description"]'),
        shareDescription:meta('meta[property="og:description"]'), robots:meta('meta[name="robots"]'), bodySha256:digest(injected) } };
  };
  const priorPages = {};
  for (let offset = 0; offset < paths.length; offset += 6) {
    await Promise.all(paths.slice(offset, offset + 6).map(async ({path}) => { priorPages[path] = await website(path); }));
  }
  save(join(output, "public-before.json"), priorPages);

  const previews = [];
  // Freeze all records first. A conflict aborts the complete batch before any writes.
  for (const {target, titles, before} of targets) {
    const row = await read(target);
    assert.equal(row.status, "published");
    assert(samePgTimestamp(row.updated_at, target.expectedUpdatedAt), "Updated-at conflict for " + target.slug);
    assert.deepEqual(projection(row, target.baselineProjectionFields), projection(before, target.baselineProjectionFields), target.slug);
    assert.equal(digest(titles), target.desiredFieldsSha256);
    const rollback = projection(row, target.changedFields);
    assert.equal(digest(rollback), target.rollbackFieldsSha256);
    snapshots.push({ record: { ...projection(row, target.baselineProjectionFields), updated_at: row.updated_at },
      table: target.table, retainedHash: digest(retained(row, target)), beforeHash:digest(row), rollback });
  }
  save(join(output, "cms-before.json"), snapshots);
  for (const [index, {target, titles}] of targets.entries()) {
    const key = target.contentType === "site_page" ? "page_key" : "slug";
    const exact = selected(target);
    const scope = { contentType:target.contentType, nextStatus:"published", expectedUpdatedAt:target.expectedUpdatedAt,
      approvalId:CMS_SEO_TITLE_APPROVAL_ID, record:{ id:target.id, [key]:target.slug, ...titles } };
    const result = await post({ ...scope, mode:"dry-run", managedCandidate:exact });
    assert(result.dry_run === true && result.performed_write === false && result.existing_id === target.id, target.slug);
    assert.deepEqual(result.payload_preview, titles, target.slug);
    assert.equal(digest(await read(target)), snapshots[index].beforeHash, "Dry-run or concurrent edit changed " + target.slug);
    previews.push({ scope, exact, result });
    save(join(output, "previews.json"), previews);
  }
  save(join(output, "dry-run-result.json"), { ok:true, rows:previews.length, fields:paths.length, productionWrites:0 });
  console.log(JSON.stringify({ mode:"dry-run", rows:previews.length, fields:paths.length, writes:0 }));
  if (!issuer) return;

  for (const {target} of targets) {
    const { data, error } = await issuer.from("managed_cms_release_permits").select("status,expires_at")
      .eq("task_id", target.taskId).eq("record_id", target.id).eq("candidate_version", target.candidateVersion);
    assert(!error, "Prior permit lookup failed");
    assert(!data?.some(p => ["completed","writing","uncertain"].includes(p.status)
      || ["issued","claimed"].includes(p.status) && Date.parse(p.expires_at) > Date.now()), "Prior active or completed permit for " + target.slug);
  }
  for (const [index, {target, titles}] of targets.entries()) {
    assert.equal(digest(await read(target)), snapshots[index].beforeHash, "Pre-write version or row changed: " + target.slug);
    const { scope, exact, result } = previews[index];
    const permit = await issueManagedPermit(issuer, {
      permitId: randomUUID(), ...exact, actionClass:"cms_write", recordId:target.id, slug:target.slug,
      expectedUpdatedAt:target.expectedUpdatedAt, payloadSha256:target.desiredFieldsSha256, rollbackPayloadSha256:target.rollbackFieldsSha256,
      githubActorId:identity.actorId, githubWorkflowSha:identity.workflowSha,
      qaReceiptId:"seo-title-preview-" + e.GITHUB_RUN_ID + "-" + index, operationsDecisionId:CMS_SEO_TITLE_APPROVAL_ID,
      policyDecisionId:"cms-seo-title-cas-oidc-v1",
      issuerEvidenceSha256:digest({ identity, result, approved:CMS_SEO_TITLE_APPROVAL_ID, snapshot:snapshots[index] }),
      expiresAt:new Date(Date.now()+10*60000).toISOString(),
    });
    save(join(output, "current-permit.json"), { target:target.id, permit });
    const published = await post({ ...scope, mode:"publish", ownerApproved:true, explicitExecution:true,
      managedPermit:{ ...exact, permitId:permit.permitId } });
    receiptRows.push({ id:target.id, slug:target.slug, receipt:published });
    save(join(output, "publish-receipts.json"), receiptRows);
    assert(published.performed_write === true && published.dry_run === false && published.saved_id === target.id, target.slug);
    const saved = await read(target);
    const completion = await readManagedPermit(issuer, permit.permitId);
    assert(completion?.status === "completed" && completion.savedId === target.id && completion.githubRunId === identity.runId, target.slug);
    assert(samePgTimestamp(completion.savedUpdatedAt, saved.updated_at), target.slug);
    assert.deepEqual(projection(saved, target.changedFields), titles);
    assert.equal(digest(retained(saved, target)), snapshots[index].retainedHash, target.slug + " retained fields changed");
  }

  for (const {path, title} of paths) {
    let current;
    for (let attempt = 0; attempt < 6; attempt++) {
      current = await website(path);
      if (current.title === title && current.ogTitle === title && current.cardTitle === title) break;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    const ok = current.title === title && current.ogTitle === title && current.cardTitle === title
      && digest(current.protected) === digest(priorPages[path].protected);
    metadataRows.push({ path, expected:title, actual:current, ok });
    save(join(output, "public-readback.json"), metadataRows);
  }
  assert(metadataRows.every(row => row.ok), "Public title or retained HTML differs. Reconcile from receipts without republishing.");
  const result = { ok:true, publishedRecords:receiptRows.length, fields:paths.length, publicPages:metadataRows.length };
  save(join(output, "completed.json"), result);
  console.log(JSON.stringify(result));
}

main().catch(error => {
  let message = String(error?.message || "SEO title batch failed");
  for (const key of ["CONTENT_PUBLISH_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_ANON_KEY", "ACTIONS_ID_TOKEN_REQUEST_TOKEN"]) {
    if (e[key]) message = message.replaceAll(e[key], "[redacted]");
  }
  console.error(message);
  process.exitCode = 1;
});
