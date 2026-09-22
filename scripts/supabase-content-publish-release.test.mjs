import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  APPROVAL_BINDING_VERSION,
  approvalBindingDigest,
  MIGRATION_FILE,
  functionVersion,
  sourceTreeHash,
  verifyAdvancedFunctionVersion,
  verifyDryRun,
  verifyDryRunEvidence,
  verifyEnvironment,
  verifyMigrationList,
  verifyReleaseIdentity,
  verifyReleaseApproval,
  verifyRestoredSource,
} from './supabase-content-publish-release.mjs';

const identity = {
  ref: 'refs/heads/main', sha: 'a'.repeat(40), expectedSha: 'a'.repeat(40),
  mode: 'deploy',
};
const now = Date.parse('2026-09-22T07:10:00Z');
const approvalInput = {
  taskId: 'fc-20260922-r3-approval-binding-rework-v1',
  actionId: 'r3-approval-binding-release-v1',
  actionClass: 'site_publish',
  scope: 'flashcast.com.my:r3-approval-binding-rework-v1:no-cms-write',
  approvalId: 'apr-1234567890abcdef1234',
  expectedSha: 'a'.repeat(40),
  repository: 'wangchaozhuanyong/zhuangxiuwangzhan',
  repositoryId: '123456789',
  ref: 'refs/heads/main',
  workflowRef: 'wangchaozhuanyong/zhuangxiuwangzhan/.github/workflows/supabase-content-publish-r3.yml@refs/heads/main',
  environment: 'production-supabase',
  eventName: 'workflow_dispatch',
  runId: '35699999999',
  runAttempt: 1,
};
const binding = {
  version: APPROVAL_BINDING_VERSION,
  ...approvalInput,
  singleUse: true,
  status: 'active',
  issuedAt: '2026-09-22T07:00:00Z',
  expiresAt: '2026-09-22T07:20:00Z',
};
binding.payloadSha256 = approvalBindingDigest(binding);
const environment = {
  name: 'production-supabase',
  protection_rules: [{ type: 'required_reviewers', reviewers: [{ type: 'User', id: 1 }] }],
  deployment_branch_policy: { protected_branches: true, custom_branch_policies: false },
};
const list = (targetRemote = '') => `LOCAL │ REMOTE │ TIME (UTC)\n────────┼────────┼──────\n20260830085645 │ 20260830085645 │ 2026-08-30\n20260921194000 │ ${targetRemote} │ 2026-09-21\n`;

test('release identity requires exact main SHA and mode', () => {
  verifyReleaseIdentity(identity);
  for (const change of [{ ref: 'refs/heads/test' }, { expectedSha: 'b'.repeat(40) },
    { mode: 'publish' }]) {
    assert.throws(() => verifyReleaseIdentity({ ...identity, ...change }));
  }
});

test('protected approval allowlist accepts one exact new short-lived binding', () => {
  assert.deepEqual(verifyReleaseApproval({
    allowlistJson: JSON.stringify([binding]), ...approvalInput, now,
  }), { approvalId: binding.approvalId, payloadSha256: binding.payloadSha256 });
});

test('protected approval allowlist rejects stale, old, missing, malformed and mismatched approvals', () => {
  const verify = (overrides = {}, list = [binding], at = now) => verifyReleaseApproval({
    allowlistJson: JSON.stringify(list), ...approvalInput, ...overrides, now: at,
  });
  assert.throws(() => verify({}, [binding], Date.parse('2026-09-22T07:21:00Z')), /not currently valid/);
  assert.throws(() => verify({ approvalId: 'apr-aaaaaaaaaaaaaaaaaaaa' }), /no unique exact/);
  assert.throws(() => verifyReleaseApproval({ ...approvalInput, allowlistJson: '', now }), /malformed/);
  assert.throws(() => verifyReleaseApproval({ ...approvalInput, allowlistJson: '{}', now }), /1 to 20/);
  assert.throws(() => verify({ taskId: 'fc-20260922-other-task' }), /no unique exact/);
  assert.throws(() => verify({ actionId: 'other-action' }), /no unique exact/);
  assert.throws(() => verify({ actionClass: 'cms_write' }), /no unique exact/);
  assert.throws(() => verify({ scope: 'flashcast.com.my:other-scope' }), /no unique exact/);
  assert.throws(() => verify({ runId: '35700000000' }), /no unique exact/);
  assert.throws(() => verify({ repositoryId: '987654321' }), /no unique exact/);
  const reusable = { ...binding, singleUse: false };
  reusable.payloadSha256 = approvalBindingDigest(reusable);
  assert.throws(() => verify({}, [reusable]), /active and single-use/);
  const wildcard = { ...binding, scope: 'flashcast.com.my:*' };
  wildcard.payloadSha256 = approvalBindingDigest(wildcard);
  assert.throws(() => verify({}, [wildcard]), /scope must be exact/);
  const wrongVersion = { ...binding, version: 'r3-release-approval/v0' };
  wrongVersion.payloadSha256 = approvalBindingDigest(wrongVersion);
  assert.throws(() => verify({}, [wrongVersion]), /unsupported approval binding version/);
  const missingField = { ...binding };
  delete missingField.actionId;
  assert.throws(() => verify({}, [missingField]), /fields are missing or unexpected/);
  const tampered = { ...binding, taskId: 'fc-20260922-other-task' };
  assert.throws(() => verify({}, [tampered]), /digest mismatch/);
});

test('release workflow validates protected binding before step-scoped production credentials', async () => {
  const workflow = await readFile(new URL('../.github/workflows/supabase-content-publish-r3.yml', import.meta.url), 'utf8');
  assert.match(workflow, /R3_RELEASE_APPROVAL_ALLOWLIST_JSON: \$\{\{ vars\.R3_RELEASE_APPROVAL_ALLOWLIST_JSON \}\}/);
  assert.match(workflow, /node scripts\/supabase-content-publish-release\.mjs approval/);
  assert.doesNotMatch(workflow, /^\s{4}SUPABASE_ACCESS_TOKEN:/m);
  const approvalIndex = workflow.indexOf('supabase-content-publish-release.mjs approval');
  const credentialIndex = workflow.indexOf('SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}');
  assert.ok(approvalIndex >= 0 && credentialIndex > approvalIndex);
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
