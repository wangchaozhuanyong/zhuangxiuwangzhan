import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { C4_SERVICE_SEO_TARGETS } from '../supabase/functions/_shared/c4-service-seo-targets.ts';
import { verifyGithubOidcToken } from '../supabase/functions/content-publish/github-oidc.ts';
import { issueManagedPermit, readManagedPermit } from '../supabase/functions/content-publish/permit-issuer.ts';
import { inspectRawMetadata } from './lib/publisher-public-readback.mjs';
import { withChineseBrandMetadata } from '../src/i18n/brandIdentity.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const TARGET = 'c4-four-service-seo-20261118-v1';
export const APPROVAL_ID = 'owner-approved-c4-four-service-seo-20261118';
const WORKFLOW = 'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/content-publish-approved.yml@refs/heads/main';
const SOURCE = 'docs/seo/codex-tasks/C4-meta-values.md';
const SOURCE_LF_SHA256 = 'd0f62f421ec0d3387b8a5e544e04004066cc9a7a7825d7bbec6afeacef6be71d';
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
export const digest = v => createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const project = (row, fields) => Object.fromEntries(fields.map(f => [f, row[f] ?? null]));
const same = (a, b) => digest(a) === digest(b);
const write = (path, value) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(value, null, 2) + '\n'); };
const selection = t => ({ taskId: t.taskId, actionId: t.actionId, scope: t.scope, candidateVersion: t.candidateVersion, operation: 'publish' });

export function readCandidates() {
  const source = readFileSync(resolve(ROOT, SOURCE), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(createHash('sha256').update(source).digest('hex'), SOURCE_LF_SHA256, 'C4 source changed');
  return C4_SERVICE_SEO_TARGETS.map(t => {
    const path = `drafts/publishing/${TARGET}/${t.candidateVersion}.json`;
    const c = JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
    assert.equal(c.schema, 'flashcast-service-seo-review-candidate/v1');
    assert.equal(c.source.path, SOURCE);
    assert.equal(c.source.exactValues, true);
    assert.equal(c.before.id, t.id); assert.equal(c.before.slug, t.slug);
    assert.equal(c.before.updated_at, t.expectedUpdatedAt);
    assert.deepEqual(Object.keys(c.desired).sort(), [...t.changedFields].sort());
    for (const [key, value] of Object.entries(t)) {
      if (!['retainedProjectionFields', 'retainedFieldsSha256'].includes(key)) assert.deepEqual(c.runtime_target[key], value);
    }
    assert.equal(digest(project(c.before, t.baselineProjectionFields)), t.baselineFieldsSha256);
    assert.equal(digest(c.desired), t.desiredFieldsSha256);
    assert.equal(digest(c.rollback), t.rollbackFieldsSha256);
    assert.equal(digest(project(c.before, t.retainedProjectionFields)), t.retainedFieldsSha256);
    assert.deepEqual(c.dryRunRequest.record, { ...c.before, ...c.desired });
    assert.deepEqual(c.dryRunRequest.managedCandidate, selection(t));
    // The review document uses literal pipes inside title values, so split at its field marker.
    for (const [field, value] of Object.entries(c.desired)) {
      const lang = field.endsWith('_en') ? 'en' : 'zh';
      const key = field.startsWith('seo_title') ? 'seoTitle' : 'seoDescription';
      assert(source.split('\n').some(line => line.startsWith(`| \`${t.slug}\` | ${lang} | ${key} | ${value} |`)), 'Copy differs from C4 source');
    }
    return { t, c, path };
  });
}

export function assertEnvironment(e, checkoutSha) {
  assert(['dry-run', 'publish'].includes(e.PUBLISH_MODE));
  assert.equal(e.GITHUB_ACTIONS, 'true'); assert.equal(e.GITHUB_REF, 'refs/heads/main');
  assert.equal(e.GITHUB_REPOSITORY, 'wangchaozhuanyong/zhuangxiuwangzhan');
  assert.equal(String(e.GITHUB_REPOSITORY_ID), '1248188229'); assert.equal(e.GITHUB_WORKFLOW_REF, WORKFLOW);
  assert.equal(e.GITHUB_EVENT_NAME, 'workflow_dispatch'); assert.equal(e.GITHUB_SHA, checkoutSha);
  assert.match(e.GITHUB_SHA || '', /^[0-9a-f]{40}$/);
  for (const key of ['GITHUB_ACTOR_ID', 'GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT']) assert.match(e[key] || '', /^[1-9][0-9]*$/);
  assert.equal(e.PUBLISH_TARGET, TARGET); assert.equal(e.APPROVAL_ID, APPROVAL_ID);
  assert.equal(e.MANAGED_OPERATION, 'publish'); assert(!e.MANAGED_PERMIT_ID && !e.PARENT_RUN_ID);
  assert.equal(new URL(e.VITE_SUPABASE_URL).origin, 'https://rbsnyexjifounogswrjp.supabase.co');
  assert.equal(e.VITE_SITE_URL, 'https://flashcast.com.my');
  for (const key of ['CONTENT_PUBLISH_SECRET', 'VITE_SUPABASE_ANON_KEY', 'ACTIONS_ID_TOKEN_REQUEST_URL', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN']) assert(e[key]);
  if (e.PUBLISH_MODE === 'publish') assert(e.SUPABASE_SERVICE_ROLE_KEY);
}

export function assertBaseline(t, row) {
  assert.equal(row.id, t.id); assert.equal(row.slug, t.slug); assert.equal(row.status, 'published');
  assert.equal(row.updated_at, t.expectedUpdatedAt, 'Current version differs from approved candidate');
  assert.equal(digest(project(row, t.baselineProjectionFields)), t.baselineFieldsSha256, 'Current baseline differs');
}

async function main() {
  const e = process.env;
  assert.equal(resolve(process.cwd()), ROOT);
  assertEnvironment(e, execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim());
  const candidates = readCandidates();
  const root = resolve(ROOT, 'audits', `content-publish-${e.GITHUB_RUN_ID}`);
  const publicClient = createClient(e.VITE_SUPABASE_URL, e.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const issuer = e.PUBLISH_MODE === 'publish' ? createClient(e.VITE_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  const read = async t => {
    const { data, error } = await publicClient.from('services').select(t.baselineProjectionFields.join(',')).eq('id', t.id).single();
    assert(!error && data, 'Published service read failed'); return data;
  };
  const oidcUrl = new URL(e.ACTIONS_ID_TOKEN_REQUEST_URL);
  oidcUrl.searchParams.set('audience', 'api://flashcast-managed-cms-publish');
  const identityResponse = await fetch(oidcUrl, { headers: { Authorization: `Bearer ${e.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` }, signal: AbortSignal.timeout(20000) });
  assert(identityResponse.ok, 'OIDC request failed');
  const oidc = (await identityResponse.json()).value;
  const identity = await verifyGithubOidcToken(oidc);
  assert.deepEqual(identity, { repositoryId: 1248188229, actorId: Number(e.GITHUB_ACTOR_ID), workflowRef: WORKFLOW,
    workflowSha: e.GITHUB_SHA, runId: Number(e.GITHUB_RUN_ID), runAttempt: Number(e.GITHUB_RUN_ATTEMPT) });
  const post = async body => {
    const response = await fetch(`${e.VITE_SUPABASE_URL}/functions/v1/content-publish`, { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cron-secret': e.CONTENT_PUBLISH_SECRET, 'x-managed-github-oidc': oidc },
      body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
    const result = await response.json();
    assert(response.ok && result.ok === true, `Protected publisher HTTP ${response.status}: ${result.error || 'request failed'}`);
    return result;
  };
  const probe = await post({ managedIdentityProbe: true });
  assert.equal(probe.performed_write, false); assert.deepEqual(probe.identity, identity);
  write(join(root, 'identity-probe.json'), probe);

  // Preview every approved row before issuing even the first one-use permit.
  for (const { t, c } of candidates) {
    const before = await read(t); assertBaseline(t, before);
    const preview = await post(c.dryRunRequest);
    assert.equal(preview.dry_run, true); assert.equal(preview.existing_id, t.id);
    assert.equal(preview.slug, t.slug); assert.deepEqual(preview.payload_preview, c.desired);
    assert(same(await read(t), before), 'Dry-run changed the CMS row');
    write(join(root, t.slug, 'preview.json'), { before, desired: c.desired, rollback: c.rollback, preview, productionWrites: 0 });
  }
  if (!issuer) { console.log(JSON.stringify({ ok: true, mode: 'dry-run', candidates: 4, productionWrites: 0 })); return; }

  for (const { t, c, path } of candidates) {
    assertBaseline(t, await read(t));
    const { data: prior, error } = await issuer.from('managed_cms_release_permits').select('permit_id,status,expires_at')
      .eq('task_id', t.taskId).eq('record_id', t.id).eq('candidate_version', t.candidateVersion);
    assert(!error, 'Prior permit lookup failed');
    assert(!(prior || []).some(p => p.status === 'completed' || ['writing', 'uncertain'].includes(p.status)
      || ['issued', 'claimed'].includes(p.status) && Date.parse(p.expires_at) > Date.now()), 'Prior completed or active permit exists; inspect without replay');
    const evidence = { approvalId: APPROVAL_ID, ownerApproved: true, explicitExecution: true,
      approvalSource: 'Owner explicitly approved the four prepared candidates in this Codex conversation on 2026-11-18',
      candidatePath: path, candidateSha256: digest(c), baselineSha256: t.baselineFieldsSha256,
      desiredSha256: t.desiredFieldsSha256, previewSha256: digest(JSON.parse(readFileSync(join(root, t.slug, 'preview.json'), 'utf8'))), identity };
    const input = { permitId: randomUUID(), ...selection(t), actionClass: 'cms_write', recordId: t.id, slug: t.slug,
      expectedUpdatedAt: t.expectedUpdatedAt, payloadSha256: t.desiredFieldsSha256, rollbackPayloadSha256: t.rollbackFieldsSha256,
      githubActorId: identity.actorId, githubWorkflowSha: identity.workflowSha,
      qaReceiptId: `c4-${t.slug}-preview-${e.GITHUB_RUN_ID}`, operationsDecisionId: APPROVAL_ID,
      policyDecisionId: 'c4-exact-seo-fields-cas-oidc-v1', issuerEvidenceSha256: digest(evidence),
      expiresAt: new Date(Date.now() + 10 * 60000).toISOString() };
    write(join(root, t.slug, 'issuer-evidence.json'), evidence);
    const issued = await issueManagedPermit(issuer, input);
    write(join(root, t.slug, 'permit-issued.json'), issued);
    const request = { ...c.dryRunRequest, mode: 'publish', ownerApproved: true, explicitExecution: true,
      approvalId: APPROVAL_ID, managedPermit: { ...selection(t), permitId: issued.permitId } };
    delete request.managedCandidate;
    const receipt = await post(request);
    write(join(root, t.slug, 'publish-receipt.json'), receipt);
    const saved = await read(t);
    const completed = await readManagedPermit(issuer, issued.permitId);
    write(join(root, t.slug, 'readback.json'), { saved, completed });
    assert.equal(receipt.dry_run, false); assert.equal(receipt.saved_id, t.id);
    assert.notEqual(saved.updated_at, t.expectedUpdatedAt);
    assert.equal(digest(project(saved, t.changedFields)), t.desiredFieldsSha256);
    assert.equal(digest(project(saved, t.retainedProjectionFields)), t.retainedFieldsSha256);
    assert.equal(completed?.status, 'completed'); assert.equal(completed.githubRunId, identity.runId);
    assert.equal(completed.savedId, t.id); assert.equal(completed.githubRunAttempt, identity.runAttempt);
    assert.equal(Date.parse(completed.savedUpdatedAt), Date.parse(saved.updated_at));
    console.log(JSON.stringify({ slug: t.slug, published: true, savedUpdatedAt: saved.updated_at, permitStatus: completed.status }));
  }
  const metadata = [];
  for (const { t, c } of candidates) for (const lang of ['en', 'zh']) {
    const url = `${e.VITE_SITE_URL}/${lang}/services/${t.slug}`;
    const expected = withChineseBrandMetadata({ title: c.desired[`seo_title_${lang}`], description: c.desired[`seo_description_${lang}`] }, lang, `/services/${t.slug}`);
    let check;
    for (let attempt = 0; attempt < 8; attempt++) {
      const response = await fetch(url, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(25000) });
      const html = await response.text();
      check = { url, status: response.status, expected, ...inspectRawMetadata(html, expected.title, expected.description, true) };
      if (check.status === 200 && check.titleFound && check.descriptionMatches) break;
      await new Promise(r => setTimeout(r, 5000));
    }
    metadata.push(check); write(join(root, 'public-metadata.json'), metadata);
  }
  assert(metadata.every(p => p.status === 200 && p.titleFound && p.descriptionMatches), 'CMS saved; public metadata differs: inspect readback without republishing');
  write(join(root, 'completion.json'), { ok: true, records: 4, fields: 16, credentialMode: 'x-cron-secret', identity, metadata });
  console.log(JSON.stringify({ ok: true, records: 4, fields: 16, publicPages: metadata.length }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {
  let message = String(error?.message || 'C4 publication failed');
  for (const key of ['CONTENT_PUBLISH_SECRET', 'SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_ANON_KEY', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN']) {
    if (process.env[key]) message = message.split(process.env[key]).join('[redacted]');
  }
  console.error(message); process.exitCode = 1;
});
