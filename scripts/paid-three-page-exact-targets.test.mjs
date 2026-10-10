import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../supabase/functions/', import.meta.url));
const modules = new Map();
function loadTs(filename) {
  filename = path.resolve(filename);
  assert.ok(filename.startsWith(root));
  if (modules.has(filename)) return modules.get(filename).exports;
  const mod = new Module(filename);
  modules.set(filename, mod);
  mod.filename = filename;
  mod.paths = [];
  mod.require = (specifier) => {
    assert.ok(specifier.startsWith('.'), 'Only local dependencies are allowed');
    return loadTs(path.resolve(path.dirname(filename), specifier));
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
  return mod.exports;
}

const { MANAGED_TARGETS, MANAGED_SERVICES, findManagedTarget, managedAction, isProtectedContentRecord, findManagedPreviewCandidate } =
  loadTs(path.join(root, '_shared/managed-targets.ts'));
const { issueManagedPermit } = loadTs(path.join(root, 'content-publish/permit-issuer.ts'));
const { publishContent } = loadTs(path.join(root, 'content-publish/service.ts'));
const taskId = 'fc-20261010-paid-three-page-exact-publication-followthrough-v1';
const targets = MANAGED_SERVICES.filter((target) => target.taskId === taskId);
const digest = (value) => createHash('sha256').update(JSON.stringify(value, Object.keys(value).sort())).digest('hex');
const noTransport = () => {
  const calls = { database: 0, rpc: 0 };
  return { calls, client: {
    from() { calls.database++; throw new Error('Database disabled in boundary tests'); },
    rpc() { calls.rpc++; throw new Error('RPC disabled in boundary tests'); },
  } };
};

test('the original three-page task exposes exactly five Chinese fields on three existing protected rows', () => {
  assert.equal(targets.length, 3);
  assert.deepEqual(targets.map((target) => target.slug).sort(), ['builtin', 'kitchen', 'renovation']);
  assert.equal(targets.reduce((count, target) => count + target.changedFields.length, 0), 5);
  for (const target of targets) {
    assert.ok(target.changedFields.every((field) => field.endsWith('_zh')));
    assert.equal(target.baselineProjectionFields.length, 30);
    assert.equal(new Set(target.baselineProjectionFields).size, 30);
    assert.equal(target.rollbackAllowed, true);
    assert.equal(target.requiresParentRun, true);
    assert.ok(target.retainedProjectionFields.every((field) =>
      !target.changedFields.includes(field) && !['updated_at', 'version'].includes(field)));
    assert.ok(isProtectedContentRecord('services', { id: target.id }));
    assert.ok(isProtectedContentRecord('services', { slug: target.slug }));
  }
});

for (const target of targets) {
  const identity = { ...managedAction(target, 'publish'), operation: 'publish' };
  test(target.slug + ': preview resolver binds a complete exact candidate and rejects drift or ambiguity', async () => {
    const record = Object.fromEntries(target.baselineProjectionFields.map((field) => [field, 'synthetic-preserved']));
    Object.assign(record, { id: target.id, slug: target.slug, updated_at: target.expectedUpdatedAt, status: 'published', version: 1 });
    const synthetic = { ...target,
      desiredFieldsSha256: digest(Object.fromEntries(target.changedFields.map((field) => [field, record[field]]))),
      retainedFieldsSha256: digest(Object.fromEntries(target.retainedProjectionFields.map((field) => [field, record[field]]))),
    };
    assert.deepEqual(await findManagedPreviewCandidate('service', record, target.expectedUpdatedAt, [synthetic]), identity);
    assert.equal(await findManagedPreviewCandidate('service', record, target.expectedUpdatedAt, [synthetic, synthetic]), undefined);
    for (const mutation of [
      { id: 'other-row' }, { slug: 'other-slug' }, { updated_at: '2026-10-10T00:00:00.000001+00:00' },
      { status: 'draft' }, { title_en: 'unapproved' }, { [target.changedFields[0]]: 'unapproved' },
      { unknown_field: 'unapproved' }, { created_at: undefined },
    ]) assert.equal(await findManagedPreviewCandidate('service', { ...record, ...mutation }, target.expectedUpdatedAt, [synthetic]), undefined);
    assert.equal(await findManagedPreviewCandidate('service', record, 'wrong-version', [synthetic]), undefined);
  });
  test(target.slug + ': an exact selector is required; missing, duplicate and cross-task selectors fail closed', () => {
    assert.equal(findManagedTarget(MANAGED_TARGETS, target.id, target.slug, identity), target);
    assert.equal(findManagedTarget(MANAGED_TARGETS, target.id, target.slug), undefined);
    assert.equal(findManagedTarget([...MANAGED_TARGETS, target], target.id, target.slug, identity), undefined);
    for (const field of ['taskId', 'actionId', 'scope', 'candidateVersion']) {
      assert.equal(findManagedTarget(MANAGED_TARGETS, target.id, target.slug,
        { ...identity, [field]: 'other-original-task' }), undefined);
    }
    assert.equal(findManagedTarget(MANAGED_TARGETS, target.id, 'other-slug', identity), undefined);
    assert.equal(findManagedTarget(MANAGED_TARGETS, 'other-record', target.slug, identity), undefined);
    assert.equal(findManagedTarget(MANAGED_TARGETS, target.id, target.slug,
      { ...identity, operation: 'rollback' }), undefined);
  });

  test(target.slug + ': source registration and owner flags cannot authorize a Save', async () => {
    const { client, calls } = noTransport();
    const result = await publishContent({
      contentType: 'service', mode: 'publish', nextStatus: 'published',
      record: { id: target.id, slug: target.slug, status: 'published' },
      expectedUpdatedAt: target.expectedUpdatedAt, managedCandidate: identity,
      ownerApproved: true, explicitExecution: true, approvalId: 'synthetic-owner-reference',
    }, client, { role: 'content_editor', authMode: 'synthetic-local-only' });
    assert.equal(result.status, 403);
    assert.match(result.body.error, /trusted one-time permit/);
    assert.deepEqual(calls, { database: 0, rpc: 0 });
  });

  const now = Date.parse('2026-10-10T00:00:00Z');
  const input = {
    ...identity, permitId: '11111111-1111-4111-8111-111111111111',
    actionClass: 'cms_write', recordId: target.id, slug: target.slug,
    expectedUpdatedAt: target.expectedUpdatedAt,
    payloadSha256: target.desiredFieldsSha256, rollbackPayloadSha256: target.rollbackFieldsSha256,
    githubActorId: 12345, githubWorkflowSha: 'a'.repeat(40),
    qaReceiptId: 'synthetic-qa-receipt', operationsDecisionId: 'synthetic-operations',
    policyDecisionId: 'synthetic-policy', issuerEvidenceSha256: 'b'.repeat(64),
    expiresAt: '2026-10-10T00:10:00Z',
  };
  test(target.slug + ': restoration requires the exact completed publish run and a fresh permit', async () => {
    const parentPermitId = '22222222-2222-4222-8222-222222222222';
    const savedUpdatedAt = '2026-10-10T00:01:00.123456+00:00';
    const parent = { status: 'completed', operation: 'publish', task_id: target.taskId,
      record_id: target.id, slug: target.slug, scope: target.scope, candidate_version: target.candidateVersion,
      github_run_id: 123456, rollback_payload_sha256: target.rollbackFieldsSha256, saved_updated_at: savedUpdatedAt };
    const rollback = { ...input, ...managedAction(target, 'rollback'), operation: 'rollback',
      expectedUpdatedAt: savedUpdatedAt, payloadSha256: target.rollbackFieldsSha256,
      rollbackPayloadSha256: undefined, parentPermitId, parentRunId: 123456 };
    const clientFor = (row) => {
      const inserted = [];
      return { inserted, client: { from(table) {
        assert.equal(table, 'managed_cms_release_permits');
        return {
          select() { return { eq(field, value) {
            assert.equal(field, 'permit_id'); assert.equal(value, parentPermitId);
            return { async maybeSingle() { return { data: row, error: null }; } };
          } }; },
          insert(value) { inserted.push(value); return { select() {
            return { async single() { return { data: value, error: null }; } };
          } }; },
        };
      } } };
    };
    const valid = clientFor(parent);
    assert.equal((await issueManagedPermit(valid.client, rollback, now)).operation, 'rollback');
    assert.equal(valid.inserted.length, 1);
    assert.equal(valid.inserted[0].parent_permit_id, parentPermitId);
    assert.equal(valid.inserted[0].expected_updated_at, savedUpdatedAt);
    assert.equal(valid.inserted[0].payload_sha256, target.rollbackFieldsSha256);
    assert.notEqual(valid.inserted[0].permit_id, parentPermitId);
    for (const changed of [
      { status: 'issued' }, { operation: 'rollback' }, { task_id: 'other-task' },
      { record_id: 'other-row' }, { slug: 'other-slug' }, { scope: 'wider-scope' },
      { candidate_version: 'old-candidate' }, { github_run_id: 123457 },
      { rollback_payload_sha256: 'c'.repeat(64) }, { saved_updated_at: target.expectedUpdatedAt },
    ]) {
      const invalid = clientFor({ ...parent, ...changed });
      await assert.rejects(issueManagedPermit(invalid.client, rollback, now));
      assert.equal(invalid.inserted.length, 0);
    }
  });
  for (const [name, changes] of [
    ['wrong frozen timestamp', { expectedUpdatedAt: '2026-10-10T00:00:00.000001+00:00' }],
    ['wrong candidate digest', { payloadSha256: 'c'.repeat(64) }],
    ['wrong backup digest', { rollbackPayloadSha256: 'c'.repeat(64) }],
    ['absent review reference', { qaReceiptId: '' }],
    ['wrong task', { taskId: 'another-task' }],
    ['wider field scope', { scope: target.scope + ',content_en' }],
    ['expired permit', { expiresAt: '2026-10-09T23:59:59Z' }],
    ['rollback without a completed parent', { ...managedAction(target, 'rollback'), operation: 'rollback',
      payloadSha256: target.rollbackFieldsSha256, rollbackPayloadSha256: undefined,
      parentPermitId: undefined, parentRunId: undefined }],
  ]) {
    test(target.slug + ': issuer rejects ' + name + ' before any transport', async () => {
      const { client, calls } = noTransport();
      await assert.rejects(issueManagedPermit(client, { ...input, ...changes }, now));
      assert.deepEqual(calls, { database: 0, rpc: 0 });
    });
  }
}
