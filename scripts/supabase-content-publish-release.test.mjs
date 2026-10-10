import assert from 'node:assert/strict';
import test from 'node:test';
import { chmod, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APPROVAL_BINDING_VERSION,
  approvalBindingDigest,
  MIGRATION_FILE,
  functionVersion,
  sourceTreeHash,
  sourceTreeManifest,
  sourceExpectedManifest,
  verifyAdvancedFunctionVersion,
  verifyDryRun,
  verifyDryRunEvidence,
  verifyDeployedSource,
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

test('repeat Edge release requires an already-applied migration and performs no schema write', async () => {
  const workflow = await readFile(new URL('../.github/workflows/supabase-content-publish-r3.yml', import.meta.url), 'utf8');
  const appliedGate = 'ALLOW_APPLIED=true node scripts/supabase-content-publish-release.mjs migration-list';
  const firstGate = workflow.indexOf(appliedGate);
  const backup = workflow.indexOf('Retain previous Edge source for controlled recovery');
  const secondGate = workflow.indexOf(appliedGate, firstGate + appliedGate.length);
  const edgeDeploy = workflow.indexOf('supabase functions deploy content-publish --project-ref rbsnyexjifounogswrjp');
  assert.ok(firstGate > 0 && firstGate < backup, 'applied migration must be checked before backup');
  assert.ok(secondGate > backup && secondGate < edgeDeploy, 'migration must be rechecked before Edge deploy');
  assert.doesNotMatch(workflow, /supabase db push/);
  assert.throws(() => verifyMigrationList(list(), true), /unexpected pending migrations/);
  assert.throws(() => verifyMigrationList(list('20260921194000') + '20260922120000 │  │ 2026-09-22\n', true));
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

const runtimeFixture = {
  'content-publish/index.ts': 'import { value } from "../_shared/managed-targets.ts"; export { value };\n',
  '_shared/managed-targets.ts': 'export { value } from "./nested/child.ts";\n',
  '_shared/nested/child.ts': 'export const value = 1;\n',
};

async function writeSourceFixture(directory, files = runtimeFixture) {
  await mkdir(directory, { recursive: true });
  for (const [file, content] of Object.entries(files)) {
    const path = join(directory, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
}

test('restored Edge source must hash-match every runtime dependency including shared children', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-restore-'));
  const before = join(root, 'before');
  const restored = join(root, 'restored');
  try {
    await writeSourceFixture(before);
    await writeSourceFixture(restored);
    assert.equal(await verifyRestoredSource(before, restored), await sourceTreeHash(before));
    assert.equal(await sourceTreeHash(join(before, 'content-publish')), await sourceTreeHash(before));
    await writeFile(join(restored, '_shared/nested/child.ts'), 'export const value = 2;\n');
    await assert.rejects(verifyRestoredSource(before, restored), /rollback_failed/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deployed readback must equal reviewed checkout runtime files, not only its entrypoint', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-deployed-'));
  const expected = join(root, 'expected');
  const downloaded = join(root, 'downloaded');
  try {
    await writeSourceFixture(expected, { ...runtimeFixture, 'other-function/index.ts': 'throw new Error("unrelated");' });
    await writeSourceFixture(downloaded);
    assert.equal(await verifyDeployedSource(expected, downloaded), await sourceTreeHash(downloaded));
    await writeFile(join(downloaded, '_shared/managed-targets.ts'), runtimeFixture['_shared/managed-targets.ts'] + '// source drift\n');
    await assert.rejects(verifyDeployedSource(expected, downloaded), /differs from the reviewed checkout/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('AST closure follows side-effect imports, re-exports, cycles and literal dynamic imports without execution', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-imports-'));
  const files = {
    'content-publish/index.ts': 'import "../_shared/start.ts"; export * from "./cycle.ts"; import("../_shared/lazy.ts"); throw new Error("must not execute");',
    'content-publish/cycle.ts': 'export * from "./index.ts";',
    '_shared/start.ts': 'export const start = true;',
    '_shared/lazy.ts': 'export const lazy = true;',
  };
  try {
    await writeSourceFixture(root, files);
    const manifest = await sourceTreeManifest(root);
    assert.deepEqual(manifest.files.map((file) => file.path), Object.keys(files).sort());
    assert.match(await sourceTreeHash(root), /^[0-9a-f]{64}$/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('type-only dependencies may be omitted by optimized download while runtime names remain required', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-types-'));
  const expected = join(root, 'expected');
  const downloaded = join(root, 'downloaded');
  const files = {
    ...runtimeFixture,
    'content-publish/index.ts': 'import type { A } from "./types.ts"; export type { A } from "./types.ts"; import { value, type C } from "../_shared/managed-targets.ts"; export { value };',
  };
  try {
    await writeSourceFixture(expected, { ...files, 'content-publish/types.ts': 'export type A = string; export type B = string;' });
    await writeSourceFixture(downloaded, files);
    assert.deepEqual((await sourceTreeManifest(expected)).typeOnlyFiles, ['content-publish/types.ts']);
    assert.equal(await verifyDeployedSource(expected, downloaded), await sourceTreeHash(downloaded));
    await rm(join(downloaded, '_shared/managed-targets.ts'));
    await assert.rejects(verifyDeployedSource(expected, downloaded), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('inline type specifiers retain module side effects in the runtime closure', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-inline-types-'));
  try {
    await writeSourceFixture(root, {
      'content-publish/index.ts': 'import { type A } from "../_shared/types.ts"; export { type A } from "../_shared/types.ts";',
      '_shared/types.ts': 'export type A = string; throw new Error("side effect");',
    });
    const manifest = await sourceTreeManifest(root);
    assert.deepEqual(manifest.files.map((file) => file.path), ['_shared/types.ts', 'content-publish/index.ts']);
    assert.deepEqual(manifest.typeOnlyFiles, []);
    await rm(join(root, '_shared/types.ts'));
    await assert.rejects(sourceTreeHash(root), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('reviewed checkout requires type-only recovery files even when optimized download may omit them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-missing-checkout-type-'));
  const expected = join(root, 'expected');
  const downloaded = join(root, 'downloaded');
  const files = {
    ...runtimeFixture,
    'content-publish/index.ts': runtimeFixture['content-publish/index.ts'] + 'import type { A } from "./types.ts";',
  };
  try {
    await writeSourceFixture(expected, files);
    await writeSourceFixture(downloaded, files);
    assert.match(await sourceTreeHash(downloaded), /^[0-9a-f]{64}$/);
    await assert.rejects(sourceExpectedManifest(expected), /missing a type-only recovery file/);
    await assert.rejects(verifyDeployedSource(expected, downloaded), /missing a type-only recovery file/);
    await writeFile(join(expected, 'content-publish/types.ts'), 'export type A = string;');
    assert.equal((await sourceExpectedManifest(expected)).typeOnlyFileRecovery.length, 1);
    assert.equal(await verifyDeployedSource(expected, downloaded), await sourceTreeHash(downloaded));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('present type-only files are hashed for complete recovery and checked against reviewed checkout', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-type-recovery-'));
  const before = join(root, 'before');
  const restored = join(root, 'restored');
  const files = {
    ...runtimeFixture,
    'content-publish/index.ts': runtimeFixture['content-publish/index.ts'] + 'import type { A } from "./types.ts";',
    'content-publish/types.ts': 'export type A = string;',
  };
  try {
    await writeSourceFixture(before, files);
    await writeSourceFixture(restored, files);
    assert.equal((await sourceTreeManifest(before)).typeOnlyFileRecovery.length, 1);
    assert.equal(await verifyRestoredSource(before, restored), await sourceTreeHash(before));
    await writeFile(join(restored, 'content-publish/types.ts'), 'export type A = number;');
    await assert.rejects(verifyRestoredSource(before, restored), /rollback_failed/);
    await assert.rejects(verifyDeployedSource(before, restored), /type-only source differs/);
    await rm(join(restored, 'content-publish/types.ts'));
    await assert.rejects(verifyRestoredSource(before, restored), /rollback_failed/);
    assert.equal(await verifyDeployedSource(before, restored), await sourceTreeHash(restored));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('download closure rejects missing shared children, extra files and unrelated directories', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-closed-'));
  try {
    await writeSourceFixture(root);
    await rm(join(root, '_shared/nested/child.ts'));
    await assert.rejects(sourceTreeHash(root), /ENOENT/);
    await writeSourceFixture(root);
    await writeFile(join(root, '_shared/unexpected.ts'), 'export const extra = true;');
    await assert.rejects(sourceTreeHash(root), /outside its dependency closure/);
    await rm(join(root, '_shared/unexpected.ts'));
    await mkdir(join(root, 'other-function'));
    await assert.rejects(sourceTreeHash(root), /outside its dependency closure/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('dependency parsing fails closed on path escapes, unknown loaders and invalid syntax', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-invalid-'));
  try {
    for (const source of [
      'import "../../../outside.ts";',
      'import "../other-function/index.ts";',
      'import "./child.js";',
      'import "bare-package";',
      'import(path);',
      'import(`../_shared/${name}.ts`);',
      'import("../_shared/managed-targets.ts", {});',
      'require("../_shared/managed-targets.ts");',
      'import value = require("../_shared/managed-targets.ts");',
      'export const = ;',
    ]) {
      await writeSourceFixture(root, { 'content-publish/index.ts': source });
      await assert.rejects(sourceTreeManifest(root), /Edge source/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('runtime source rejects file and directory symlinks', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-symlink-'));
  const source = join(root, 'source');
  try {
    await writeSourceFixture(source);
    const child = join(source, '_shared/nested/child.ts');
    await rm(child);
    await writeFile(join(root, 'outside.ts'), 'export const value = 1;');
    await symlink(join(root, 'outside.ts'), child);
    await assert.rejects(sourceTreeHash(source), /symbolic link/);
    await rm(join(source, '_shared/nested'), { recursive: true });
    await mkdir(join(root, 'outside'));
    await writeFile(join(root, 'outside/child.ts'), 'export const value = 1;');
    await symlink(join(root, 'outside'), join(source, '_shared/nested'));
    await assert.rejects(sourceTreeHash(source), /symbolic link/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('workflow retains full shared closure, frozen recovery backup and strict forward readback', async () => {
  const workflow = await readFile(new URL('../.github/workflows/supabase-content-publish-r3.yml', import.meta.url), 'utf8');
  const release = workflow.slice(workflow.indexOf('  release:'));
  assert.match(release, /Install locked source-check dependencies\n\s+run: npm ci --ignore-scripts --no-audit --no-fund/);
  assert.match(release, /source-expected supabase\/functions/);
  assert.match(release, /\$\{\{ runner\.temp \}\}\/edge-before\/supabase\/functions\/\n/);
  assert.doesNotMatch(release, /path: \$\{\{ runner\.temp \}\}\/edge-before\/supabase\/functions\/content-publish\//);
  assert.match(release, /source-manifest "\$RUNNER_TEMP\/edge-before\/supabase\/functions"/);
  const success = release.slice(release.indexOf('if supabase functions deploy'), release.indexOf('            exit 0'));
  assert.match(success, /source-deployed supabase\/functions "\$RUNNER_TEMP\/edge-after\/supabase\/functions"/);
  assert.match(success, /source-manifest "\$RUNNER_TEMP\/edge-after\/supabase\/functions"/);
  const backupRecheck = release.indexOf('cmp -s "$RUNNER_TEMP/edge-source-before.sha256" "$RUNNER_TEMP/edge-source-before-recheck.sha256"');
  const forwardDeploy = release.indexOf('if supabase functions deploy');
  assert.ok(backupRecheck > 0 && backupRecheck < forwardDeploy, 'frozen full backup must be checked before the forward deploy');
  assert.equal(release.match(/supabase functions deploy content-publish/g)?.length, 1);
  assert.doesNotMatch(release, /supabase functions deploy[^\n]*--workdir|rollback_succeeded_verified|edge-restored/);
  assert.ok(release.indexOf('edge-version-pre-edge.txt"; then') < release.indexOf('if supabase functions deploy'));
  assert.ok(release.indexOf('website-version-pre-edge.json"; then') < release.indexOf('if supabase functions deploy'));
  assert.match(release, /cmp -s "\$RUNNER_TEMP\/edge-version-before.txt" "\$RUNNER_TEMP\/edge-version-pre-edge.txt"/);
  assert.match(release, /if\(r\.status!==200\)throw new Error\("Website version response failed"\)/);
  assert.match(release, /v\.deploymentVersion!==process\.env\.GITHUB_SHA/);
  assert.match(release, /cmp -s "\$RUNNER_TEMP\/edge-version-after.txt" "\$RUNNER_TEMP\/edge-version-after-download.txt"/);
  assert.match(release, /No automatic prior-source deploy was attempted/);
  assert.match(release, /if: \$\{\{ always\(\) && inputs\.mode == 'deploy' \}\}/);
  assert.doesNotMatch(release, /SUPABASE_SERVICE_ROLE_KEY|db push/);
});

test('real workflow shell stops on every failure without deploying an older source', async (t) => {
  const workflow = await readFile(new URL('../.github/workflows/supabase-content-publish-r3.yml', import.meta.url), 'utf8');
  const match = workflow.match(/- name: Deploy Edge function and verify source without automatic rollback[\s\S]*?\n        run: \|\n([\s\S]*?)(?=\n      - name:)/);
  assert.ok(match, 'the actual deployment shell block must be exercised');
  const shell = match[1].replace(/^          /gm, '');
  const helper = fileURLToPath(new URL('./supabase-content-publish-release.mjs', import.meta.url));
  const files = {
    ...runtimeFixture,
    'content-publish/index.ts': runtimeFixture['content-publish/index.ts'] + 'import type { A } from "./types.ts";',
    'content-publish/types.ts': 'export type A = string;',
  };
  for (const scenario of ['success', 'deploy-fails', 'source-fails', 'version-not-advanced',
    'version-competition', 'metadata-fails', 'metadata-after-download-fails', 'backup-drift',
    'predeploy-version-competition', 'predeploy-metadata-fails', 'website-version-competition',
    'website-version-unreadable', 'website-version-http-fails', 'website-version-http-201',
    'website-version-http-202']) {
    await t.test(scenario, async () => {
      const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-workflow-'));
      const bin = join(root, 'bin');
      const before = join(root, 'edge-before/supabase/functions');
      const log = join(root, 'commands.jsonl');
      try {
        await mkdir(bin);
        await writeSourceFixture(join(root, 'supabase/functions'), files);
        await writeSourceFixture(before, files);
        await writeFile(join(root, 'edge-source-before.sha256'), await sourceTreeHash(before) + '\n');
        await writeFile(join(root, 'functions-before.json'), JSON.stringify([{ slug: 'content-publish', status: 'ACTIVE', version: 7 }]));
        await writeFile(join(root, 'edge-version-before.txt'), '7\n');
        if (scenario === 'backup-drift') await writeFile(join(before, 'content-publish/types.ts'), 'export type A = number;');
        const mockNode = `#!${process.execPath}
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.COMMAND_LOG, JSON.stringify({tool:'node',args})+'\\n');
const mockFetch = 'global.fetch=async()=>{if(process.env.SCENARIO==="website-version-unreadable")throw new Error("Mock version unavailable");return {ok:process.env.SCENARIO!=="website-version-http-fails",status:process.env.SCENARIO==="website-version-http-fails"?503:process.env.SCENARIO==="website-version-http-201"?201:process.env.SCENARIO==="website-version-http-202"?202:200,json:async()=>({deploymentVersion:(process.env.SCENARIO==="website-version-competition"?"b":"a").repeat(40)})}};';
const childArgs = args[0] === '-e' ? ['-e', mockFetch + args[1]] : [process.env.REAL_HELPER, ...args.slice(1)];
const result = spawnSync(process.env.REAL_NODE, childArgs, {stdio:'inherit'});
process.exit(result.status === null ? 99 : result.status);
`;
        const mockSupabase = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const scenario = process.env.SCENARIO;
fs.appendFileSync(process.env.COMMAND_LOG, JSON.stringify({tool:'supabase',args})+'\\n');
if (args[0] === 'functions' && args[1] === 'deploy') process.exit(scenario === 'deploy-fails' ? 1 : 0);
if (args[0] === 'functions' && args[1] === 'list') {
  const counter = path.join(process.env.RUNNER_TEMP, 'list-count');
  const count = fs.existsSync(counter) ? Number(fs.readFileSync(counter, 'utf8')) : 0;
  fs.writeFileSync(counter, String(count + 1));
  if ((scenario === 'predeploy-metadata-fails' && count === 0) || (scenario === 'metadata-fails' && count === 1) || (scenario === 'metadata-after-download-fails' && count === 2)) process.exit(1);
  const version = count === 0 ? (scenario === 'predeploy-version-competition' ? 8 : 7)
    : scenario === 'version-not-advanced' ? 7 : scenario === 'version-competition' && count === 2 ? 9 : 8;
  process.stdout.write(JSON.stringify([{slug:'content-publish',status:'ACTIVE',version}])+'\\n');
  process.exit(0);
}
if (args[0] === 'init') process.exit(0);
if (args[0] === 'functions' && args[1] === 'download') {
  const directory = args[args.indexOf('--workdir') + 1];
  const files = ${JSON.stringify(files)};
  delete files['content-publish/types.ts'];
  if (scenario === 'source-fails') files['_shared/nested/child.ts'] = 'export const value = 2;';
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(directory, 'supabase/functions', file);
    fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target, content);
  }
  process.exit(0);
}
process.exit(99);
`;
        await writeFile(join(bin, 'node.cjs'), mockNode);
        await writeFile(join(bin, 'supabase.cjs'), mockSupabase);
        await chmod(join(bin, 'node.cjs'), 0o700);
        await chmod(join(bin, 'supabase.cjs'), 0o700);
        await symlink('node.cjs', join(bin, 'node'));
        await symlink('supabase.cjs', join(bin, 'supabase'));
        const result = spawnSync('/bin/bash', ['-e', '-c', shell], {
          cwd: root, encoding: 'utf8',
          env: { PATH: bin + ':/usr/bin:/bin', RUNNER_TEMP: root,
            GITHUB_STEP_SUMMARY: join(root, 'summary.txt'), COMMAND_LOG: log,
            GITHUB_SHA: 'a'.repeat(40), REAL_NODE: process.execPath, REAL_HELPER: helper, SCENARIO: scenario },
        });
        const commands = (await readFile(log, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));
        const deployments = commands.filter((command) => command.tool === 'supabase' && command.args[1] === 'deploy');
        const blockedBeforeDeploy = scenario === 'backup-drift' || scenario.startsWith('predeploy-') || scenario.startsWith('website-version-');
        assert.equal(deployments.length, blockedBeforeDeploy ? 0 : 1, result.stderr);
        assert.equal(deployments.filter((command) => command.args.includes('--workdir')).length, 0);
        if (scenario === 'success') {
          assert.equal(result.status, 0, result.stderr);
          assert.ok(commands.some((command) => command.args.includes('source-deployed')));
          assert.ok(commands.some((command) => command.args.includes('source-manifest')));
          assert.equal(commands.filter((command) => command.tool === 'supabase' && command.args[1] === 'list').length, 3);
          assert.equal(JSON.parse(await readFile(join(root, 'website-version-pre-edge.json'), 'utf8')).deploymentVersion, 'a'.repeat(40));
          const manifest = JSON.parse(await readFile(join(root, 'edge-source-after.json'), 'utf8'));
          assert.deepEqual(manifest.files.map((file) => file.path), Object.keys(runtimeFixture).sort());
          assert.deepEqual(manifest.typeOnlyFileRecovery, []);
        } else {
          assert.notEqual(result.status, 0, 'every failed validation must stop the release');
          assert.doesNotMatch(result.stdout, /rollback_succeeded_verified/);
          const summary = await readFile(join(root, 'summary.txt'), 'utf8');
          assert.match(summary, blockedBeforeDeploy ? /Deployment blocked/ : /no automatic Edge or SQL restore was attempted/);
        }
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  }
});

test('frozen full backup hash rejects shared or present-type drift even if both restore trees drift equally', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flashcast-edge-frozen-'));
  const before = join(root, 'before');
  const restored = join(root, 'restored');
  const files = {
    ...runtimeFixture,
    'content-publish/index.ts': runtimeFixture['content-publish/index.ts'] + 'import type { A } from "./types.ts";',
    'content-publish/types.ts': 'export type A = string;',
  };
  try {
    await writeSourceFixture(before, files);
    const frozen = await sourceTreeHash(before);
    for (const path of ['_shared/nested/child.ts', 'content-publish/types.ts']) {
      const drifted = { ...files, [path]: files[path] + '// changed after backup capture\n' };
      await writeSourceFixture(before, drifted);
      await writeSourceFixture(restored, drifted);
      assert.notEqual(await sourceTreeHash(before), frozen);
      // Equality of two modified directories cannot substitute for the frozen hash.
      assert.notEqual(await verifyRestoredSource(before, restored), frozen);
    }
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
