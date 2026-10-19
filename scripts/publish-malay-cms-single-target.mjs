import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";
import { lockedNativeBodyCandidates } from "./managed-cms-targets-native-body-v1.mjs";
import { inspectRawMetadata, withCompanyBrandSuffix } from "./lib/publisher-public-readback.mjs";
import {
  assertLockedServiceCandidate,
  inspectPublicReadback,
  stableDigest,
  targetConfigs,
} from "./publish-content-trust-fixes.mjs";
import {
  assertActualPreview,
  assertActualPublish,
  assertBatchIdentity,
  assertLiveVersionReceipt,
  buildBatchPermit,
  sanitizePublisherDiagnostic,
} from "./publish-remaining-completion-20261009.mjs";
import { verifyGithubOidcToken } from "../supabase/functions/content-publish/github-oidc.ts";
import { issueManagedPermit, readManagedPermit } from "../supabase/functions/content-publish/permit-issuer.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = "rental-unit-renovation-kl-malay-v1";
const APPROVAL_ID = "owner-authorized-malay-cms-20261019";
const POLICY_DECISION_ID = "managed-cms-reviewed-translation-policy-v1";
const ACTION_ID = "malay-review-rental-unit-renovation-kl-v1";
const WORKFLOW_REF = "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main";
const args = process.argv.slice(2);
const mode = args.find((arg) => arg.startsWith("--mode="))?.slice(7) || "";
const environment = process.env;
const fail = (message) => { throw new Error(message); };
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};
const rawSha256 = (value) => createHash("sha256").update(value).digest("hex");
const same = (left, right) => stableDigest(left) === stableDigest(right);
const project = (row, fields) => Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
const bindingIndexPath = "drafts/seo/fc-20260927-cms-native-admission-contract-v1/binding-index.json";

function assertRunEnvironment() {
  const checkoutSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const positive = [environment.GITHUB_ACTOR_ID, environment.GITHUB_RUN_ID, environment.GITHUB_RUN_ATTEMPT]
    .every((value) => /^[1-9][0-9]*$/.test(String(value)) && Number.isSafeInteger(Number(value)));
  if (!new Set(["dry-run", "publish"]).has(mode) || environment.GITHUB_ACTIONS !== "true"
      || environment.GITHUB_REF !== "refs/heads/main" || environment.GITHUB_REPOSITORY !== "wangchaozhuanyong/zhuangxiuwangzhan"
      || String(environment.GITHUB_REPOSITORY_ID) !== "1248188229" || environment.GITHUB_WORKFLOW_REF !== WORKFLOW_REF
      || environment.GITHUB_EVENT_NAME !== "workflow_dispatch" || environment.GITHUB_SHA !== checkoutSha
      || !/^[0-9a-f]{40}$/.test(environment.GITHUB_SHA || "") || !positive
      || environment.PUBLISH_TARGET !== TARGET || environment.APPROVAL_ID !== APPROVAL_ID
      || environment.MANAGED_OPERATION !== "publish" || environment.MANAGED_PERMIT_ID || environment.PARENT_RUN_ID
      || !environment.ACTIONS_ID_TOKEN_REQUEST_URL || !environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
    fail("This exact Malay candidate accepts only its approved main-branch workflow dispatch.");
  }
  if (resolve(process.cwd()) !== ROOT) fail("Publisher must run from its owning project checkout.");
  const supabaseUrl = environment.VITE_SUPABASE_URL;
  if (!supabaseUrl || new URL(supabaseUrl).host !== "rbsnyexjifounogswrjp.supabase.co"
      || !environment.VITE_SUPABASE_ANON_KEY || !environment.CONTENT_PUBLISH_SECRET
      || environment.VITE_SITE_URL !== "https://flashcast.com.my") {
    fail("Publisher requires the existing FLASH CAST production endpoints and publisher credential.");
  }
  if (mode === "publish" && !environment.SUPABASE_SERVICE_ROLE_KEY) {
    fail("The protected publisher workflow is missing its service-side permit issuer credential.");
  }
}

const locked = lockedNativeBodyCandidates[TARGET];
const config = targetConfigs[TARGET];
if (!locked || !config || locked.contentType !== "blog" || locked.table !== "blog_posts") {
  fail("The frozen Malay CMS target is unavailable or has the wrong content type.");
}

function validateReviewEvidence() {
  const source = readJson(resolve(ROOT, locked.sourceCandidatePath));
  const review = source.language_review || {};
  if (source.task_id !== locked.taskId || source.candidate_version !== locked.candidateVersion
      || source.record_id !== locked.recordId || source.slug !== locked.slug
      || source.expected_updated_at !== locked.expectedUpdatedAt || source.owner_approval_id !== APPROVAL_ID
      || review.decision !== "PASS_MALAY_TRANSLATION_REVIEW" || review.qa_receipt_id !== ACTION_ID
      || !review.qa_receipt_path || !review.qa_receipt_sha256) {
    fail("Candidate, owner approval, or language review evidence does not match the frozen CMS row.");
  }
  const qaBytes = readFileSync(resolve(ROOT, review.qa_receipt_path));
  if (rawSha256(qaBytes) !== review.qa_receipt_sha256) fail("Malay review receipt hash differs.");
  const qa = JSON.parse(qaBytes.toString("utf8"));
  if (qa.qa_receipt_id !== ACTION_ID || qa.result !== "PASS_MALAY_TRANSLATION_REVIEW"
      || qa.record_id !== locked.recordId || qa.slug !== locked.slug
      || qa.current_updated_at !== locked.expectedUpdatedAt || qa.exact_payload_sha256 !== locked.desiredFieldsSha256
      || !same(qa.coverage_fields, locked.changedFields) || qa.reviewer !== review.reviewer) {
    fail("Malay review receipt does not cover the exact frozen row, version, and six translated fields.");
  }
  return { source, review, qa };
}

async function readCurrent() {
  const url = new URL("/rest/v1/blog_posts", environment.VITE_SUPABASE_URL);
  url.searchParams.set("id", `eq.${locked.recordId}`);
  url.searchParams.set("status", "eq.published");
  url.searchParams.set("select", locked.baselineProjectionFields.join(","));
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { cache: "no-store", headers: {
    apikey: environment.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${environment.VITE_SUPABASE_ANON_KEY}`,
  }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) fail(`Current published CMS row read failed with HTTP ${response.status}.`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1) fail("Expected one exact published Malay CMS row.");
  return rows[0];
}

async function readPublicBrandIdentity() {
  const url = new URL("/rest/v1/site_settings", environment.VITE_SUPABASE_URL);
  url.searchParams.set("id", "eq.default");
  url.searchParams.set("select", "company_name,brand_name");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { cache: "no-store", headers: {
    apikey: environment.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${environment.VITE_SUPABASE_ANON_KEY}`,
  }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) fail(`Current public brand settings read failed with HTTP ${response.status}.`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1) fail("Expected one exact public site brand settings row.");
  const brandIdentity = { companyName: rows[0].company_name, brandName: rows[0].brand_name };
  if (!brandIdentity.companyName?.trim() || !brandIdentity.brandName?.trim()) fail("Current public brand settings are incomplete.");
  return brandIdentity;
}

async function assertNoPriorActivePermit(client) {
  const { data, error } = await client.from("managed_cms_release_permits").select("permit_id,status,expires_at,github_run_id")
    .eq("task_id", locked.taskId).eq("record_id", locked.recordId).eq("candidate_version", locked.candidateVersion);
  if (error) fail("Could not check the exact candidate's earlier single-use permit status.");
  const active = (data || []).filter((row) => row.status === "completed"
    || (["issued", "claimed"].includes(row.status) && Date.parse(String(row.expires_at)) > Date.now()));
  if (active.length) fail("An earlier permit for this exact candidate is completed or still active; inspect its receipt and do not replay it.");
}

async function assertDeployedSha(artifactRoot) {
  const url = new URL("/__flashcast/version", environment.VITE_SITE_URL);
  url.searchParams.set("cms_malay_run", environment.GITHUB_RUN_ID);
  const response = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(20_000) });
  const body = await response.json().catch(() => null);
  const receipt = { url: `${environment.VITE_SITE_URL}/__flashcast/version`, checkedAt: new Date().toISOString(),
    httpStatus: response.status, deploymentVersion: /^[0-9a-f]{40}$/.test(body?.deploymentVersion || "") ? body.deploymentVersion : null,
    expectedSha: environment.GITHUB_SHA };
  writeJson(join(artifactRoot, "deployment-version-receipt.json"), receipt);
  assertLiveVersionReceipt(receipt, environment.GITHUB_SHA);
}

function invokeTrustPublisher(artifactRoot, permitId = "") {
  const childEnvironment = { ...environment };
  delete childEnvironment.SUPABASE_SERVICE_ROLE_KEY;
  const result = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${TARGET}`,
    `--artifact-dir=${artifactRoot}`, ...(permitId ? ["--execute", `--approval-id=${APPROVAL_ID}`, `--managed-permit-id=${permitId}`] : [])],
  { cwd: ROOT, env: childEnvironment, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  const safeDiagnostic = sanitizePublisherDiagnostic(result.stderr, [environment.CONTENT_PUBLISH_SECRET,
    environment.SUPABASE_SERVICE_ROLE_KEY, environment.VITE_SUPABASE_ANON_KEY,
    environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN]);
  writeJson(join(artifactRoot, TARGET, `publisher-${permitId ? "publish" : "preview"}-stage.json`), {
    target: TARGET, stage: permitId ? "publish" : "preview", checkedAt: new Date().toISOString(),
    exitCode: result.status, signal: result.signal || null, processErrorCode: result.error?.code || null,
    diagnostic: safeDiagnostic,
  });
  if (result.status !== 0) fail(`Protected ${permitId ? "publish" : "preview"} failed for the exact Malay candidate. Inspect this run's audit artifacts; never replay an issued permit. ${safeDiagnostic}`);
}

function previewArtifacts(artifactRoot) {
  const dir = join(artifactRoot, TARGET);
  return {
    backup: readJson(join(dir, "backup.json")), desired: readJson(join(dir, "desired.json")),
    receipt: readJson(join(dir, "locked-dry-run-receipt.json")), preview: readJson(join(dir, "dry-run.json")),
    payload: readJson(join(dir, "managed-payload-digest.json")), prior: readJson(join(dir, "rollback-payload-digest.json")),
    identity: readJson(join(dir, "managed-identity-probe.json")),
  };
}

async function verifyPublicMetadataAndBrowser(artifactRoot, desired) {
  const pageChecks = [];
  const brandIdentity = await readPublicBrandIdentity();
  for (const page of locked.publicPaths) {
    const language = page.path.split("/")[1];
    const titleField = `seo_title_${language}`;
    const descriptionField = `seo_description_${language}`;
    const url = new URL(page.path, environment.VITE_SITE_URL);
    url.searchParams.set("managed_malay_readback", environment.GITHUB_RUN_ID);
    const response = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(25_000) });
    const html = await response.text();
    const check = inspectPublicReadback(page, response.status, html);
    const expectedPublicTitle = withCompanyBrandSuffix(desired[titleField], brandIdentity);
    const actualMeta = inspectRawMetadata(html, expectedPublicTitle, desired[descriptionField], true);
    const linkTags = (html.match(/<link\b[^>]*>/gi) || []).map((tag) => {
      const attr = (name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] || "";
      return { rel: attr("rel").toLowerCase(), hrefLang: attr("hreflang").toLowerCase(), href: attr("href") };
    });
    const exactLink = (rel, hrefLang, href) => linkTags.some((link) => link.rel === rel && link.href === href
      && (!hrefLang || link.hrefLang === hrefLang.toLowerCase()));
    const routeFor = (locale) => page.path.replace(/^\/(?:en|zh|ms)\//, `/${locale}/`);
    const headLinks = { canonical: exactLink("canonical", "", `${environment.VITE_SITE_URL}${page.path}`),
      zh: exactLink("alternate", "zh-CN", `${environment.VITE_SITE_URL}${routeFor("zh")}`),
      en: exactLink("alternate", "en", `${environment.VITE_SITE_URL}${routeFor("en")}`),
      ms: exactLink("alternate", "ms-MY", `${environment.VITE_SITE_URL}${routeFor("ms")}`) };
    if (language === "ms" && /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
      check.forbiddenFound.push("noindex");
    }
    if (!actualMeta.titleFound || !actualMeta.descriptionMatches || !headLinks.canonical
        || !headLinks.zh || !headLinks.en || language === "ms" && !headLinks.ms) {
      check.missingRequired.push("localized metadata/canonical/hreflang");
    }
    pageChecks.push({ ...check, actualMeta, headLinks });
  }
  if (pageChecks.some((page) => page.status !== 200 || !page.found || page.forbiddenFound.length || page.missingRequired.length)) {
    fail("One or more live locale pages failed title, description, canonical, hreflang, or Malay indexability checks.");
  }

  const sitemapResponse = await fetch(`${environment.VITE_SITE_URL}/sitemap.xml?managed_malay_run=${environment.GITHUB_RUN_ID}`,
    { cache: "no-store", headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(20_000) });
  const sitemapText = await sitemapResponse.text();
  const sitemapCheck = { status: sitemapResponse.status, malayPathFound: sitemapText.includes(`${environment.VITE_SITE_URL}/ms/blog/${locked.slug}`) };
  if (!sitemapCheck.malayPathFound) fail("Live sitemap does not yet contain the translated Malay article route.");

  const { chromium: browserChromium } = await import("@playwright/test");
  const browser = await browserChromium.launch({ headless: true, channel: environment.PLAYWRIGHT_CHROMIUM_CHANNEL || "chrome" });
  let runtimeErrors = 0;
  let blockedNonReads = 0;
  const viewports = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route("**/*", (route) => {
      const request = route.request();
      const isTelemetry = /(google-analytics\.com|googletagmanager\.com|doubleclick\.net|connect\.facebook\.net|clarity\.ms|hotjar\.|\/page_visits(?:\?|$)|\/g\/collect(?:\?|$))/i.test(request.url());
      if (isTelemetry || !["GET", "HEAD", "OPTIONS"].includes(request.method())) { blockedNonReads += 1; return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", () => { runtimeErrors += 1; });
    const url = `${environment.VITE_SITE_URL}/ms/blog/${locked.slug}?managed_malay_browser=${environment.GITHUB_RUN_ID}`;
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(viewport);
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40_000 });
      await page.waitForFunction(({ title, bodyPhrase }) => {
        const main = document.querySelector("main");
        return Boolean(main && main.querySelector("h1")?.textContent?.trim() === title
          && main.innerText.includes(bodyPhrase));
      }, { title: locked.desiredFields.title_ms, bodyPhrase: "Mulakan dengan memahami cara penyewa menggunakan ruang" }, { timeout: 25_000 });
      const rendered = await page.evaluate(() => {
        const main = document.querySelector("main");
        const links = [...(main?.querySelectorAll("a") || [])].map((anchor) => ({ text: anchor.textContent?.trim() || "", href: anchor.getAttribute("href") || "" }));
        return { title: document.title, h1: main?.querySelector("h1")?.textContent?.trim() || "",
          body: main?.innerText || "", description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
          alternateMs: document.querySelector('link[rel="alternate"][hreflang="ms-MY"]')?.getAttribute("href") || "",
          scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, links };
      });
      const requiredAnchor = rendered.links.some((link) => link.href === "/ms/services/renovation");
      const contentOk = rendered.body.includes("Persediaan ini tidak menjamin peningkatan hasil sewa") && requiredAnchor;
      const noOverflow = rendered.scrollWidth <= rendered.innerWidth + 1;
      viewports.push({ viewport, status: response?.status() || 0, ...rendered, noOverflow, contentOk });
      if (response?.status() !== 200 || !noOverflow || !contentOk || rendered.description !== locked.desiredFields.seo_description_ms
          || rendered.canonical !== `${environment.VITE_SITE_URL}/ms/blog/${locked.slug}`
          || rendered.alternateMs !== `${environment.VITE_SITE_URL}/ms/blog/${locked.slug}`) {
        fail(`Malay article browser check failed at ${viewport.width}x${viewport.height}.`);
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
  if (runtimeErrors !== 0) fail("The Malay article browser readback produced a runtime error.");
  writeJson(join(artifactRoot, TARGET, "public-locales-metadata.json"), { checkedAt: new Date().toISOString(), brandIdentity, pageChecks, sitemapCheck });
  writeJson(join(artifactRoot, TARGET, "public-malay-browser.json"), { checkedAt: new Date().toISOString(), viewports, runtimeErrors, blockedNonReads, businessWrites: 0 });
  return { pageChecks, sitemapCheck, viewports, runtimeErrors, blockedNonReads };
}

async function main() {
  assertRunEnvironment();
  const artifactRoot = resolve(ROOT, "audits", `content-publish-${environment.GITHUB_RUN_ID}`);
  if (relative(ROOT, artifactRoot) !== `audits/content-publish-${environment.GITHUB_RUN_ID}`) fail("Audit files must stay inside this exact project run directory.");
  mkdirSync(artifactRoot, { recursive: true });
  await assertDeployedSha(artifactRoot);
  const { source, review, qa } = validateReviewEvidence();

  let issuerClient;
  if (mode === "publish") {
    issuerClient = createClient(environment.VITE_SUPABASE_URL, environment.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } });
    await assertNoPriorActivePermit(issuerClient);
  }
  const before = await readCurrent();
  assertLockedServiceCandidate(locked, before);
  for (const field of Object.keys(source.source_values || {})) {
    if (!same(before[field] ?? null, source.source_values[field] ?? null)) fail(`Current source field ${field} differs from the reviewed translation evidence.`);
  }
  const entry = { target: TARGET, ...locked, qaReceiptId: review.qa_receipt_id, qaProofs: [{
    receiptId: qa.qa_receipt_id, path: review.qa_receipt_path, sha256: review.qa_receipt_sha256,
    result: qa.result, expectedUpdatedAt: locked.expectedUpdatedAt, reviewedPayloadSha256: qa.exact_payload_sha256,
    coverageFields: qa.coverage_fields,
  }] };

  invokeTrustPublisher(artifactRoot);
  const artifacts = previewArtifacts(artifactRoot);
  const afterPreview = await readCurrent();
  if (!same(before, afterPreview)) fail("CMS row changed during the zero-write Malay preview.");
  assertActualPreview(entry, artifacts, afterPreview, environment);
  writeJson(join(artifactRoot, TARGET, "malay-preview-evidence.json"), {
    taskId: locked.taskId, candidateVersion: locked.candidateVersion, recordId: locked.recordId,
    expectedUpdatedAt: locked.expectedUpdatedAt, changedFields: locked.changedFields,
    currentBaselineSha256: stableDigest(project(afterPreview, locked.baselineProjectionFields)),
    payloadSha256: artifacts.payload.payload_sha256, rollbackPayloadSha256: artifacts.prior.payload_sha256,
    candidateSourceSha256: locked.sourceCandidateSha256, qaReceiptId: qa.qa_receipt_id,
    zeroWrite: artifacts.receipt.performed_write === false && artifacts.receipt.external_writes === 0,
  });
  if (mode === "dry-run") {
    console.log(JSON.stringify({ ok: true, mode, target: TARGET, recordId: locked.recordId, zeroWrite: true, artifactRoot }));
    return;
  }

  const identityUrl = new URL(environment.ACTIONS_ID_TOKEN_REQUEST_URL);
  identityUrl.searchParams.set("audience", "api://flashcast-managed-cms-publish");
  const identityResponse = await fetch(identityUrl, { headers: { Authorization: `Bearer ${environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` }, cache: "no-store" });
  if (!identityResponse.ok) fail("Current GitHub OIDC identity could not be verified before permit issuance.");
  const tokenData = await identityResponse.json();
  const identity = await verifyGithubOidcToken(tokenData.value);
  assertBatchIdentity(identity, environment);
  const registry = { authorization: { id: APPROVAL_ID }, executionDecision: { id: APPROVAL_ID, policyDecisionId: POLICY_DECISION_ID } };
  const bindingIndexSha256 = rawSha256(readFileSync(resolve(ROOT, bindingIndexPath)));
  const { input, evidence } = buildBatchPermit(entry, registry, identity, artifacts, Date.now(), randomUUID(), bindingIndexSha256);
  writeJson(join(artifactRoot, TARGET, "permit-issuer-evidence.json"), {
    bindingIndexPath, bindingIndexSha256, candidateSourceSha256: locked.sourceCandidateSha256, evidence,
  });
  const issued = await issueManagedPermit(issuerClient, input);
  if (issued.permitId !== input.permitId || issued.status !== "issued" || issued.operation !== "publish") {
    fail("The exact single-use Malay CMS permit was not issued; inspect its issuer receipt and do not retry.");
  }
  writeJson(join(artifactRoot, TARGET, "permit-issued.json"), { ...issued, taskId: input.taskId,
    actionId: input.actionId, candidateVersion: input.candidateVersion, recordId: input.recordId, scope: input.scope,
    expectedUpdatedAt: input.expectedUpdatedAt, payloadSha256: input.payloadSha256,
    rollbackPayloadSha256: input.rollbackPayloadSha256, qaReceiptId: input.qaReceiptId,
    operationsDecisionId: input.operationsDecisionId, policyDecisionId: input.policyDecisionId });

  invokeTrustPublisher(artifactRoot, input.permitId);
  const receipt = readJson(join(artifactRoot, TARGET, "publish-receipt.json"));
  const saved = await readCurrent();
  const completed = await readManagedPermit(issuerClient, input.permitId);
  assertActualPublish(entry, receipt, saved, completed, identity, APPROVAL_ID);
  const publicEvidence = await verifyPublicMetadataAndBrowser(artifactRoot, { ...before, ...locked.desiredFields });
  writeJson(join(artifactRoot, TARGET, "malay-publish-completion.json"), {
    ok: true, target: TARGET, recordId: locked.recordId, savedUpdatedAt: saved.updated_at,
    version: saved.version, permitStatus: completed.status, githubRunId: identity.runId,
    workflowSha: identity.workflowSha, publicEvidence,
  });
  console.log(JSON.stringify({ ok: true, mode, target: TARGET, recordId: locked.recordId,
    savedUpdatedAt: saved.updated_at, version: saved.version, publicPages: publicEvidence.pageChecks.length,
    mobile: "390x844", desktop: "1280x900", artifactRoot }));
}

main().catch((error) => {
  const safe = sanitizePublisherDiagnostic(error instanceof Error ? error.message : "Malay CMS publish failed",
    [environment.CONTENT_PUBLISH_SECRET, environment.SUPABASE_SERVICE_ROLE_KEY, environment.VITE_SUPABASE_ANON_KEY,
      environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN]);
  console.error(safe || "Malay CMS publish failed; inspect this run's audit artifacts and do not replay an issued permit.");
  process.exitCode = 1;
});
