import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  APPROVAL_ID,
  MIGRATION_FILE,
  functionVersion,
  sourceTreeHash,
  verifyAdvancedFunctionVersion,
  verifyDryRun,
  verifyDryRunEvidence,
  verifyEnvironment,
  verifyMigrationList,
  verifyReleaseIdentity,
  verifyRestoredSource,
} from './supabase-content-publish-release.mjs';

const identity = {
  ref: 'refs/heads/main', sha: 'a'.repeat(40), expectedSha: 'a'.repeat(40),
  mode: 'deploy', approvalId: APPROVAL_ID,
};
const environment = {
  name: 'production-supabase',
  protection_rules: [{ type: 'required_reviewers', reviewers: [{ type: 'User', id: 1 }] }],
  deployment_branch_policy: { protected_branches: true, custom_branch_policies: false },
};
const list = (targetRemote = '') => `LOCAL │ REMOTE │ TIME (UTC)\n────────┼────────┼──────\n20260830085645 │ 20260830085645 │ 2026-08-30\n20260921194000 │ ${targetRemote} │ 2026-09-21\n`;

test('release identity requires exact main SHA and approval reference', () => {
  verifyReleaseIdentity(identity);
  for (const change of [{ ref: 'refs/heads/test' }, { expectedSha: 'b'.repeat(40) },
    { mode: 'publish' }, { approvalId: 'old-approval' }]) {
    assert.throws(() => verifyReleaseIdentity({ ...identity, ...change }));
  }
});

test('environment requires reviewer and protected branch policy', () => {
  verifyEnvironment(environment);
  assert.throws(() => verifyEnvironment({ ...environment, protection_rules: [] }));
  assert.throws(() => verifyEnvironment({ ...environment, deployment_branch_policy: null }));
});

test('migration list permits one exact pending migration and rejects drift', () => {
  assert.deepEqual(verifyMigrationList(list()), { pending: ['20260921194000'], targetApplied: false });
  assert.throws(() => verifyMigrationList(list(), true), /unexpected pending migrations/);
  assert.throws(() => verifyMigrationList(list() + '20260922120000 │  │ 2026-09-22\n'));
  assert.throws(() => verifyMigrationList(list() + ' │ 20260922120000 │ 2026-09-22\n'));
  assert.throws(() => verifyMigrationList(list('20260921194000')));
  assert.deepEqual(verifyMigrationList(list('20260921194000'), true), { pending: [], targetApplied: true });
});

test('Edge version readback requires one active target and a newer version', () => {
  const baseline = JSON.stringify([{ slug: 'content-publish', status: 'ACTIVE', version: 10 }]);
  const restored = JSON.stringify([{ slug: 'content-publish', status: 'ACTIVE', version: 12 }]);
  assert.equal(functionVersion(baseline), 10);
  assert.equal(verifyAdvancedFunctionVersion(restored, baseline), 12);
  assert.throws(() => verifyAdvancedFunctionVersion(baseline, baseline), /did not advance/);
  assert.throws(() => functionVersion(JSON.stringify([{ slug: 'other', status: 'ACTIVE', version: 11 }])));
  assert.throws(() => functionVersion(JSON.stringify([{ slug: 'content-publish', status: 'INACTIVE', version: 11 }])));
});

test('restored Edge source must hash-match the exact pre-release tree', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-restore-'));
  const before = join(root, 'before');
  const restored = join(root, 'restored');
  try {
    await mkdir(before);
    await mkdir(restored);
    await writeFile(join(before, 'index.ts'), 'export const value = 1;\n');
    await writeFile(join(restored, 'index.ts'), 'export const value = 1;\n');
    assert.equal(await verifyRestoredSource(before, restored), await sourceTreeHash(before));
    await writeFile(join(restored, 'index.ts'), 'export const value = 2;\n');
    await assert.rejects(verifyRestoredSource(before, restored), /rollback_failed/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const actualDryRun = `DRY RUN: migrations will *not* be pushed to the database.
Connecting to remote database...
Would push these migrations:
 • ${MIGRATION_FILE}
`;

test('db push dry-run accepts the exact Supabase CLI 2.84.2 evidence', () => {
  verifyDryRun(actualDryRun);
  verifyDryRun(`\u001b[1mDRY RUN: migrations will *not* be pushed to the database.\u001b[0m\r\n` +
    `Would push these migrations:\r\n • ${MIGRATION_FILE}\r\n`);
});

test('db push dry-run fails closed on missing markers, empty plans, and migration drift', () => {
  assert.throws(() => verifyDryRun(''), /evidence is empty/);
  assert.throws(() => verifyDryRun(`Would push these migrations:\n • ${MIGRATION_FILE}\n`), /marker is missing/);
  assert.throws(() => verifyDryRun('DRY RUN: migrations will *not* be pushed to the database.\nNo migrations to push.'));
  assert.throws(() => verifyDryRun(actualDryRun + ' • 20260922120000_other.sql\n'));
});

test('dry-run evidence recovery captures stderr without weakening the gate', async () => {
  let calls = 0;
  assert.deepEqual(await verifyDryRunEvidence(actualDryRun, async () => {
    calls += 1;
    return { code: 1, signal: null, stdout: '', stderr: '' };
  }), { source: 'evidence-file' });
  assert.equal(calls, 0);

  assert.deepEqual(await verifyDryRunEvidence('', async () => {
    calls += 1;
    return { code: 0, signal: null, stdout: '', stderr: actualDryRun };
  }), { source: 'captured-cli' });
  assert.equal(calls, 1);

  await assert.rejects(verifyDryRunEvidence('', async () => (
    { code: 1, signal: null, stdout: '', stderr: actualDryRun }
  )), /evidence recovery failed/);
  await assert.rejects(verifyDryRunEvidence('', async () => (
    { code: 0, signal: null, stdout: '', stderr: `Would push these migrations:\n • ${MIGRATION_FILE}\n` }
  )), /marker is missing/);
  await assert.rejects(verifyDryRunEvidence('', async () => (
    { code: 0, signal: null, stdout: '', stderr: actualDryRun + ' • 20260922120000_other.sql\n' }
  )), /did not select only|unexpected migration/);
});
