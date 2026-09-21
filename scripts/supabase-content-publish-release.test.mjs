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

test('db push dry-run must select only exact migration', () => {
  verifyDryRun(`Dry run. Would push these migrations:\n • ${MIGRATION_FILE}\n`);
  assert.throws(() => verifyDryRun('No migrations to push.'));
  assert.throws(() => verifyDryRun(`Would push these migrations: ${MIGRATION_FILE} 20260922120000_other.sql`));
});
