import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import {
  FAQ_START_TIMING_APPROVAL_ID as APPROVAL_ID,
  FAQ_START_TIMING_TARGET_ID as TARGET_ID,
  FAQ_START_TIMING_TARGET as target,
} from "../supabase/functions/_shared/faq-start-timing-target.ts";
import { verifyGithubOidcToken } from "../supabase/functions/content-publish/github-oidc.ts";
import { issueManagedPermit, readManagedPermit } from "../supabase/functions/content-publish/permit-issuer.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workflow = "wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main";
const site = "https://flashcast.com.my";
const languages = ["en", "zh", "ms"];
const project = (row, fields) => Object.fromEntries([...fields].sort().map(field => [field, row[field]]));
const digest = obj => createHash("sha256").update(JSON.stringify(project(obj, Object.keys(obj)))).digest("hex");
const managed = { taskId: target.taskId, actionId: target.actionId, scope: target.scope,
  candidateVersion: target.candidateVersion, operation: "publish" };

export function readFaqStartTimingCopy() {
  const copy = JSON.parse(readFileSync(resolve(root, "drafts/publishing", TARGET_ID, "copy.json"), "utf8"));
  assert.deepEqual(Object.keys(copy).sort(), [...target.changedFields]);
  assert.equal(digest(copy), target.desiredFieldsSha256, "The reviewed FAQ copy changed");
  return copy;
}

export function assertFaqStartTimingEnvironment(env, checkoutSha) {
  assert.equal(env.GITHUB_ACTIONS, "true");
  assert.equal(env.GITHUB_REF, "refs/heads/main");
  assert.equal(env.GITHUB_EVENT_NAME, "workflow_dispatch");
  assert.equal(env.GITHUB_WORKFLOW_REF, workflow);
  assert.equal(env.GITHUB_REPOSITORY_ID, "1248188229");
  assert.match(checkoutSha, /^[0-9a-f]{40}$/);
  assert.equal(env.GITHUB_SHA, checkoutSha);
  assert.equal(env.PUBLISH_TARGET, TARGET_ID);
  assert.equal(env.MANAGED_OPERATION, "publish");
  assert(!env.PARENT_RUN_ID && !env.MANAGED_PERMIT_ID);
  assert(["dry-run", "publish"].includes(env.PUBLISH_MODE));
  if (env.PUBLISH_MODE === "publish") {
    assert.equal(env.APPROVAL_ID, APPROVAL_ID);
    assert(env.SUPABASE_SERVICE_ROLE_KEY, "Missing protected permit issuer credential");
  } else {
    assert(!env.SUPABASE_SERVICE_ROLE_KEY);
  }
}

async function main() {
  const env = process.env;
  assert.equal(resolve(process.cwd()), root);
  assertFaqStartTimingEnvironment(env, execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim());
  assert.equal(new URL(env.VITE_SUPABASE_URL).origin, "https://rbsnyexjifounogswrjp.supabase.co");
  assert(env.CONTENT_PUBLISH_SECRET && env.VITE_SUPABASE_ANON_KEY && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);
  const output = resolve(root, "audits", `content-publish-${env.GITHUB_RUN_ID}`, "faq-start-timing");
  const copy = readFaqStartTimingCopy();
  const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const read = async () => {
    const { data, error } = await client.from(target.table).select(target.baselineProjectionFields.join(",")).eq("id", target.id).single();
    assert(!error && data, "Published FAQ could not be read");
    return data;
  };
  const write = (file, data) => {
    mkdirSync(output, { recursive: true });
    writeFileSync(resolve(output, file), JSON.stringify(data, null, 2) + "\n");
  };

  const oidcUrl = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);
  oidcUrl.searchParams.set("audience", "api://flashcast-managed-cms-publish");
  const tokenResponse = await fetch(oidcUrl, {
    headers: { Authorization: `Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` },
    signal: AbortSignal.timeout(20_000),
  });
  assert(tokenResponse.ok, "The workflow identity could not be requested");
  const token = (await tokenResponse.json()).value;
  const identity = await verifyGithubOidcToken(token);
  assert.deepEqual(identity, { repositoryId: 1248188229, actorId: Number(env.GITHUB_ACTOR_ID), workflowRef: workflow,
    workflowSha: env.GITHUB_SHA, runId: Number(env.GITHUB_RUN_ID), runAttempt: Number(env.GITHUB_RUN_ATTEMPT) });
  const post = async (request) => {
    const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/content-publish`, {
      method: "POST", headers: { "content-type": "application/json", "x-cron-secret": env.CONTENT_PUBLISH_SECRET, "x-managed-github-oidc": token },
      body: JSON.stringify(request), signal: AbortSignal.timeout(30_000),
    });
    const result = await response.json();
    assert(response.ok && result.ok, `Protected publisher HTTP ${response.status}: ${result.error || "request failed"}`);
    return result;
  };
  const before = await read();
  assert.equal(before.updated_at, target.expectedUpdatedAt, "The FAQ version changed");
  assert.equal(digest(before), target.baselineFieldsSha256, "The frozen FAQ baseline changed");
  assert.equal(digest(project(before, target.changedFields)), target.rollbackFieldsSha256);
  write("baseline.json", before);
  const input = { contentType: "faq", nextStatus: "published", expectedUpdatedAt: target.expectedUpdatedAt,
    record: { id: target.id, ...copy } };
  const preview = await post({ ...input, mode: "dry-run", managedCandidate: managed });
  assert.equal(preview.dry_run, true);
  assert.equal(preview.performed_write, false);
  assert.equal(preview.existing_id, target.id);
  assert.deepEqual(preview.payload_preview, copy);
  assert.deepEqual(await read(), before);
  const preflight = { identity, candidateVersion: target.candidateVersion, expectedUpdatedAt: before.updated_at,
    baselineSha256: target.baselineFieldsSha256, priorCopySha256: target.rollbackFieldsSha256, preview, productionWrites: 0 };
  write("preview.json", preflight);
  if (env.PUBLISH_MODE === "dry-run") {
    console.log("FAQ 130 protected preview passed with zero writes");
    return;
  }

  // The service key can only issue the existing one-use permit in this protected workflow.
  const issuer = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const issued = await issueManagedPermit(issuer, {
    ...managed, permitId: randomUUID(), actionClass: "cms_write", recordId: target.id, slug: target.slug,
    expectedUpdatedAt: before.updated_at, payloadSha256: target.desiredFieldsSha256,
    rollbackPayloadSha256: target.rollbackFieldsSha256, githubActorId: identity.actorId,
    githubWorkflowSha: identity.workflowSha, qaReceiptId: "faq-130-preview-" + identity.runId,
    operationsDecisionId: APPROVAL_ID, policyDecisionId: "exact-faq-row-cas-oidc-v2",
    issuerEvidenceSha256: digest(preflight), expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
  });
  write("permit-issued.json", issued);
  const receipt = await post({ ...input, mode: "publish", ownerApproved: true, explicitExecution: true,
    approvalId: APPROVAL_ID, managedPermit: { ...managed, permitId: issued.permitId } });
  write("publish-receipt.json", receipt);
  assert.equal(receipt.performed_write, true);
  assert.equal(receipt.saved_id, target.id);
  const saved = await read();
  assert.equal(saved.updated_at, receipt.saved_updated_at);
  assert.notEqual(saved.updated_at, before.updated_at);
  assert.equal(digest(project(saved, target.changedFields)), target.desiredFieldsSha256);
  assert.equal(digest(project(saved, target.retainedProjectionFields)), target.retainedFieldsSha256);
  const permit = await readManagedPermit(issuer, issued.permitId);
  assert.equal(permit?.status, "completed");
  assert.equal(permit?.githubRunId, identity.runId);
  assert.equal(permit?.savedId, saved.id);
  assert.equal(permit?.savedUpdatedAt, saved.updated_at);
  write("after.json", saved);

  const pages = await Promise.all(languages.map(async language => {
    const url = `${site}/${language}/faq`;
    for (let attempt = 0; attempt < 8; attempt++) {
      const response = await fetch(url, { headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(20_000) });
      const html = await response.text();
      const body = html.match(/<main data-flashcast-readable-body[^>]*>([\s\S]*?)<\/main>/)?.[1];
      const question = copy["question_" + language];
      const answer = copy["answer_" + language];
      const matchedBody = [2, 3].some(level => body?.includes("<h" + level + ">" + question + "</h" + level + "><p>" + answer + "</p>"));
      const matchedSchema = [...html.matchAll(/<script type="application\/ld\+json" data-flashcast-edge-schema>([\s\S]*?)<\/script>/g)]
        .flatMap(([, json]) => {
          const data = JSON.parse(json);
          return data["@graph"] ?? [data];
        }).some(item => item["@type"] === "FAQPage" && item.mainEntity?.some(entry =>
          entry.name === question && entry.acceptedAnswer?.text === answer));
      if (response.status === 200 && matchedBody && matchedSchema) return { url, status: 200, matchedBody, matchedSchema };
      if (attempt < 7) await setTimeout(5_000);
    }
    throw new Error(`FAQ saved but public HTML did not match at ${url}; inspect the receipt without retrying the write`);
  }));
  write("completion.json", { id: target.id, savedUpdatedAt: saved.updated_at, exactCopyVerified: true, retainedFieldsVerified: true, permit, pages });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    let message = String(error?.message || "FAQ publication failed");
    for (const key of ["CONTENT_PUBLISH_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_ANON_KEY", "ACTIONS_ID_TOKEN_REQUEST_TOKEN"]) {
      if (process.env[key]) message = message.replaceAll(process.env[key], "[redacted]");
    }
    console.error(message);
    process.exitCode = 1;
  });
}
