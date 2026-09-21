import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const PROJECT_REF = 'rbsnyexjifounogswrjp';
export const MIGRATION_VERSION = '20260921194000';
export const MIGRATION_FILE = `${MIGRATION_VERSION}_managed_cms_release_permits.sql`;
export const APPROVAL_ID = 'apr-1d43729c395c38ea41ef';
export const ENVIRONMENT = 'production-supabase';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function verifyReleaseIdentity({ ref, sha, expectedSha, mode, approvalId }) {
  assert(ref === 'refs/heads/main', 'release must run on main');
  assert(/^[0-9a-f]{40}$/.test(sha ?? ''), 'invalid running SHA');
  assert(sha === expectedSha, 'expected SHA differs from checked-out main');
  assert(mode === 'dry-run' || mode === 'deploy', 'invalid release mode');
  assert(approvalId === APPROVAL_ID, 'wrong exact R3 approval reference');
}

export function verifyEnvironment(environment) {
  assert(environment?.name === ENVIRONMENT, 'protected environment is absent');
  assert(
    environment.protection_rules?.some((rule) => rule.type === 'required_reviewers' && rule.reviewers?.length > 0),
    'protected environment has no required reviewer',
  );
  assert(
    environment.deployment_branch_policy?.protected_branches === true &&
      environment.deployment_branch_policy?.custom_branch_policies === false,
    'protected environment must allow protected branches only',
  );
}

export function verifyMigrationList(output, requireApplied = false) {
  assert(/LOCAL\s*[│|]\s*REMOTE\s*[│|]/i.test(output), 'unrecognized Supabase migration list');
  const rows = output.split(/\r?\n/).map((line) => line.split(/[│|]/).map((part) => part.trim()));
  const migrations = rows
    .filter((parts) => parts.length >= 3 && /^\d{12,14}$/.test(parts[0] || parts[1]))
    .map(([local, remote]) => ({ local, remote }));
  assert(migrations.length > 0, 'migration list is empty');
  const remoteOnly = migrations.filter(({ local, remote }) => !local && remote);
  const mismatched = migrations.filter(({ local, remote }) => local && remote && local !== remote);
  const pending = migrations.filter(({ local, remote }) => local && !remote).map(({ local }) => local);
  assert(remoteOnly.length === 0 && mismatched.length === 0, 'remote migration history differs from local');
  const expectedPending = requireApplied ? [[]] : [[MIGRATION_VERSION]];
  assert(expectedPending.some((versions) => JSON.stringify(pending) === JSON.stringify(versions)),
    `unexpected pending migrations: ${pending.join(',') || 'none'}`);
  assert(migrations.some(({ local, remote }) => local === MIGRATION_VERSION && (!remote || remote === local)),
    'target migration missing from local history');
  return { pending, targetApplied: pending.length === 0 };
}

export function functionVersion(output) {
  let functions;
  try {
    functions = JSON.parse(output);
  } catch {
    throw new Error('unrecognized Supabase functions JSON');
  }
  assert(Array.isArray(functions), 'Supabase functions list must be an array');
  const matches = functions.filter((item) => item?.slug === 'content-publish');
  assert(matches.length === 1, 'content-publish function must appear exactly once');
  const { status, version } = matches[0];
  assert(status === 'ACTIVE', 'content-publish function is not active');
  assert(Number.isSafeInteger(version) && version > 0, 'content-publish version is invalid');
  return version;
}

export function verifyAdvancedFunctionVersion(currentOutput, previousOutput) {
  const previous = functionVersion(previousOutput);
  const current = functionVersion(currentOutput);
  assert(current > previous, `content-publish version did not advance beyond ${previous}`);
  return current;
}

export async function sourceTreeHash(directory) {
  const files = [];
  async function collect(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (entry.isFile()) files.push(path);
      else throw new Error('Edge source contains an unsupported file type');
    }
  }
  await collect(directory);
  assert(files.some((path) => relative(directory, path) === 'index.ts'), 'Edge source index.ts is missing');
  const hash = createHash('sha256');
  for (const path of files.sort((a, b) => relative(directory, a).localeCompare(relative(directory, b)))) {
    hash.update(relative(directory, path)).update('\0').update(await readFile(path)).update('\0');
  }
  return hash.digest('hex');
}

export async function verifyRestoredSource(originalDirectory, restoredDirectory) {
  const expected = await sourceTreeHash(originalDirectory);
  const actual = await sourceTreeHash(restoredDirectory);
  assert(actual === expected, 'rollback_failed: restored Edge source hash differs from backup');
  return actual;
}

export function verifyDryRun(output) {
  assert(/would push these migrations/i.test(output), 'unrecognized Supabase db push dry-run');
  const listed = [...output.matchAll(/\b(\d{12,14}_[\w-]+\.sql)\b/g)].map((match) => match[1]);
  assert(listed.length === 1 && listed[0] === MIGRATION_FILE,
    `dry-run did not select only ${MIGRATION_FILE}`);
}

async function main() {
  const [command, path, comparison] = process.argv.slice(2);
  if (command === 'identity') {
    verifyReleaseIdentity({
      ref: process.env.GITHUB_REF,
      sha: process.env.GITHUB_SHA,
      expectedSha: process.env.EXPECTED_SHA,
      mode: process.env.RELEASE_MODE,
      approvalId: process.env.APPROVAL_ID,
    });
    return;
  }
  if (command === 'environment') {
    const token = process.env.GH_TOKEN;
    assert(token, 'GitHub environment read token is missing');
    const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/environments/${ENVIRONMENT}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    assert(response.ok, `GitHub environment check failed: HTTP ${response.status}`);
    verifyEnvironment(await response.json());
    return;
  }
  assert(path, 'evidence file path is required');
  if (command === 'source-hash') {
    process.stdout.write(`${await sourceTreeHash(path)}\n`);
    return;
  }
  if (command === 'source-compare') {
    assert(comparison, 'restored source directory is required');
    process.stdout.write(`${await verifyRestoredSource(path, comparison)}\n`);
    return;
  }
  const output = await readFile(path, 'utf8');
  if (command === 'migration-list') verifyMigrationList(output, process.env.ALLOW_APPLIED === 'true');
  else if (command === 'dry-run') verifyDryRun(output);
  else if (command === 'function-version') process.stdout.write(`${functionVersion(output)}\n`);
  else if (command === 'function-version-advanced') {
    assert(comparison, 'baseline function list is required');
    process.stdout.write(`${verifyAdvancedFunctionVersion(output, await readFile(comparison, 'utf8'))}\n`);
  }
  else throw new Error('unknown release gate command');
}

if (process.argv[1]?.endsWith('supabase-content-publish-release.mjs')) {
  main().catch((error) => {
    console.error(`release gate blocked: ${error.message}`);
    process.exitCode = 1;
  });
}
