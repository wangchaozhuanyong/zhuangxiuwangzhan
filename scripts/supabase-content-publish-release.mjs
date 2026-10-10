import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

export const PROJECT_REF = 'rbsnyexjifounogswrjp';
export const MIGRATION_VERSION = '20260921194000';
export const MIGRATION_FILE = `${MIGRATION_VERSION}_managed_cms_release_permits.sql`;
export const ENVIRONMENT = 'production-supabase';
export const APPROVAL_BINDING_VERSION = 'r3-release-approval/v1';
export const APPROVAL_MAX_TTL_MS = 30 * 60 * 1000;

const APPROVAL_FIELDS = [
  'version', 'taskId', 'actionId', 'actionClass', 'scope', 'approvalId', 'expectedSha',
  'repository', 'repositoryId', 'ref', 'workflowRef', 'environment', 'eventName', 'runId',
  'runAttempt', 'singleUse', 'status', 'issuedAt', 'expiresAt',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function verifyReleaseIdentity({ ref, sha, expectedSha, mode }) {
  assert(ref === 'refs/heads/main', 'release must run on main');
  assert(/^[0-9a-f]{40}$/.test(sha ?? ''), 'invalid running SHA');
  assert(sha === expectedSha, 'expected SHA differs from checked-out main');
  assert(mode === 'dry-run' || mode === 'deploy', 'invalid release mode');
}

function canonicalApprovalPayload(binding) {
  return Object.fromEntries(APPROVAL_FIELDS.map((field) => [field, binding[field]]));
}

export function approvalBindingDigest(binding) {
  return createHash('sha256').update(JSON.stringify(canonicalApprovalPayload(binding))).digest('hex');
}

function validateApprovalBinding(binding, now) {
  assert(binding && typeof binding === 'object' && !Array.isArray(binding), 'approval binding must be an object');
  const expectedFields = [...APPROVAL_FIELDS, 'payloadSha256'].sort();
  assert(JSON.stringify(Object.keys(binding).sort()) === JSON.stringify(expectedFields),
    'approval binding fields are missing or unexpected');
  assert(binding.version === APPROVAL_BINDING_VERSION, 'unsupported approval binding version');
  assert(/^fc-\d{8}-[a-z0-9-]+$/.test(binding.taskId), 'invalid approval task ID');
  assert(/^[a-z0-9][a-z0-9-]{2,120}$/.test(binding.actionId), 'invalid approval action ID');
  assert(binding.actionClass === 'site_publish', 'approval action class must be site_publish');
  assert(/^flashcast\.com\.my:[^*\s]+$/.test(binding.scope), 'approval scope must be exact and site-bound');
  assert(/^apr-[0-9a-f]{20}$/.test(binding.approvalId), 'approval ID must be an exact single-use reference');
  assert(/^[0-9a-f]{40}$/.test(binding.expectedSha), 'approval SHA is invalid');
  assert(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(binding.repository), 'approval repository is invalid');
  assert(/^\d+$/.test(String(binding.repositoryId)), 'approval repository ID is invalid');
  assert(binding.ref === 'refs/heads/main', 'approval ref must be main');
  assert(binding.workflowRef === `${binding.repository}/.github/workflows/supabase-content-publish-r3.yml@refs/heads/main`,
    'approval workflow ref is invalid');
  assert(binding.environment === ENVIRONMENT, 'approval environment is invalid');
  assert(binding.eventName === 'workflow_dispatch', 'approval event is invalid');
  assert(/^\d+$/.test(String(binding.runId)), 'approval run ID is invalid');
  assert(binding.runAttempt === 1, 'approval is valid only for the first run attempt');
  assert(binding.singleUse === true && binding.status === 'active', 'approval must be active and single-use');
  const issuedAt = Date.parse(binding.issuedAt);
  const expiresAt = Date.parse(binding.expiresAt);
  assert(Number.isFinite(issuedAt) && Number.isFinite(expiresAt), 'approval timestamps are invalid');
  assert(issuedAt <= now && expiresAt > now, 'approval is not currently valid');
  assert(expiresAt - issuedAt > 0 && expiresAt - issuedAt <= APPROVAL_MAX_TTL_MS,
    'approval expiry exceeds the short-lived limit');
  assert(/^[0-9a-f]{64}$/.test(binding.payloadSha256), 'approval payload digest is invalid');
  assert(binding.payloadSha256 === approvalBindingDigest(binding), 'approval payload digest mismatch');
}

export function verifyReleaseApproval({ allowlistJson, taskId, actionId, actionClass, scope, approvalId,
  expectedSha, repository, repositoryId, ref, workflowRef, environment, eventName, runId, runAttempt,
  now = Date.now() }) {
  let allowlist;
  try {
    allowlist = JSON.parse(allowlistJson);
  } catch {
    throw new Error('protected approval allowlist is malformed');
  }
  assert(Array.isArray(allowlist) && allowlist.length > 0 && allowlist.length <= 20,
    'protected approval allowlist must contain 1 to 20 bindings');
  for (const binding of allowlist) validateApprovalBinding(binding, now);
  const matches = allowlist.filter((binding) => binding.taskId === taskId
    && binding.actionId === actionId && binding.actionClass === actionClass && binding.scope === scope
    && binding.approvalId === approvalId && binding.expectedSha === expectedSha
    && binding.repository === repository && String(binding.repositoryId) === String(repositoryId)
    && binding.ref === ref && binding.workflowRef === workflowRef && binding.environment === environment
    && binding.eventName === eventName && String(binding.runId) === String(runId)
    && binding.runAttempt === Number(runAttempt));
  assert(matches.length === 1, 'no unique exact active approval binding matches this run');
  return { approvalId: matches[0].approvalId, payloadSha256: matches[0].payloadSha256 };
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

const EDGE_ENTRYPOINT = 'content-publish/index.ts';

function runtimeSourceRoot(directory) {
  const root = resolve(directory);
  // Keep the existing CLI's downloaded content-publish directory argument usable.
  return basename(root) === 'content-publish' ? dirname(root) : root;
}

function ownedSourcePath(root, file) {
  const path = relative(root, resolve(root, file)).split(sep).join('/');
  assert(!isAbsolute(path) && path !== '..' && !path.startsWith('../')
    && /^(content-publish|_shared)\/.+\.ts$/.test(path),
  'Edge source dependency escapes its owned TypeScript directories');
  return path;
}

async function readSource(root, file) {
  let current = root;
  const components = ['', ...file.split('/')];
  let before;
  for (let index = 0; index < components.length; index += 1) {
    if (components[index]) current = join(current, components[index]);
    const identity = await lstat(current);
    assert(!identity.isSymbolicLink(), 'Edge source contains a symbolic link');
    assert(index === components.length - 1 ? identity.isFile() : identity.isDirectory(),
      'Edge source contains an unsupported file type');
    if (index === components.length - 1) before = identity;
  }
  const content = await readFile(current);
  const after = await lstat(current);
  assert(after.isFile() && !after.isSymbolicLink() && before.dev === after.dev
    && before.ino === after.ino && before.size === after.size && before.mtimeMs === after.mtimeMs,
  'Edge source changed while being read');
  return content;
}

function moduleDependencies(file, content) {
  const source = ts.createSourceFile(file, content.toString('utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  assert(source.parseDiagnostics.length === 0, 'Edge source contains invalid TypeScript syntax');
  const dependencies = [];
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) {
        assert(ts.isStringLiteral(node.moduleSpecifier), 'Edge source module specifier must be literal');
        // Inline type specifiers may retain a module's side effects after emission.
        const typeOnly = node.isTypeOnly || (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly);
        dependencies.push({ specifier: node.moduleSpecifier.text, typeOnly: Boolean(typeOnly) });
      }
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      assert(node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]),
        'Edge source dynamic import must use one literal path');
      dependencies.push({ specifier: node.arguments[0].text, typeOnly: false });
    } else if (ts.isImportEqualsDeclaration(node)
      || (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require')) {
      throw new Error('Edge source contains an unsupported module loading form');
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return dependencies;
}

export async function sourceTreeManifest(directory) {
  const root = runtimeSourceRoot(directory);
  const files = new Map();
  const typeOnlyFiles = new Set();
  const externalImports = new Set();
  async function collect(file) {
    const path = ownedSourcePath(root, file);
    if (files.has(path)) return;
    const content = await readSource(root, path);
    files.set(path, { path, bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') });
    for (const { specifier, typeOnly } of moduleDependencies(path, content)) {
      assert(!specifier.includes('\\') && !specifier.includes('\0'), 'Edge source module path is invalid');
      if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
        assert(specifier.startsWith('https://') && new URL(specifier).protocol === 'https:',
          'Edge source external import must be an explicit HTTPS URL');
        if (!typeOnly) externalImports.add(specifier);
        continue;
      }
      const dependency = ownedSourcePath(root, join(dirname(path), specifier));
      if (typeOnly) typeOnlyFiles.add(dependency);
      else await collect(dependency);
    }
  }
  await collect(EDGE_ENTRYPOINT);
  const omittedRuntimeTypes = [...typeOnlyFiles].filter((path) => !files.has(path)).sort();
  const typeOnlyFileRecovery = [];
  for (const path of omittedRuntimeTypes) {
    try {
      const content = await readSource(root, path);
      typeOnlyFileRecovery.push({ path, bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') });
    } catch (error) {
      // Optimized Edge downloads omit erased types; the exact checkout retains them.
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return {
    schema: 'content-publish-runtime-source/v1',
    entrypoint: EDGE_ENTRYPOINT,
    files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)),
    typeOnlyFiles: omittedRuntimeTypes,
    typeOnlyFileRecovery,
    externalImports: [...externalImports].sort(),
  };
}

export async function sourceExpectedManifest(directory) {
  const manifest = await sourceTreeManifest(directory);
  const recoveredTypes = new Set(manifest.typeOnlyFileRecovery.map((file) => file.path));
  assert(manifest.typeOnlyFiles.every((file) => recoveredTypes.has(file)),
    'reviewed Edge checkout is missing a type-only recovery file');
  return manifest;
}

async function requireClosedDownload(directory, manifest) {
  const root = runtimeSourceRoot(directory);
  const capturedFiles = new Map([...manifest.files, ...manifest.typeOnlyFileRecovery].map((file) => [file.path, file]));
  const seenFiles = new Set();
  const allowedFiles = new Set([...manifest.files.map((file) => file.path), ...manifest.typeOnlyFiles]);
  const allowedDirectories = new Set(['']);
  for (const file of allowedFiles) {
    let parent = dirname(file);
    while (parent !== '.') {
      allowedDirectories.add(parent);
      parent = dirname(parent);
    }
  }
  async function collect(path = '') {
    const current = join(root, path);
    const identity = await lstat(current);
    assert(identity.isDirectory() && !identity.isSymbolicLink(), 'Edge download contains an unsupported directory');
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const child = path ? path + '/' + entry.name : entry.name;
      if (entry.isDirectory()) {
        assert(allowedDirectories.has(child), 'Edge download contains a directory outside its dependency closure');
        await collect(child);
      } else if (entry.isFile()) {
        assert(allowedFiles.has(child), 'Edge download contains a file outside its dependency closure');
        const content = await readSource(root, child);
        const expected = capturedFiles.get(child);
        assert(expected && (content.length === expected.bytes
          && createHash('sha256').update(content).digest('hex') === expected.sha256),
        'Edge source changed after its dependency closure was read');
        seenFiles.add(child);
      } else throw new Error('Edge download contains an unsupported file type');
    }
  }
  await collect();
  assert([...capturedFiles.keys()].every((file) => seenFiles.has(file)),
    'Edge source disappeared after its dependency closure was read');
}

function sourceDigest(manifest) {
  const files = [...manifest.files, ...manifest.typeOnlyFileRecovery].sort((a, b) => a.path.localeCompare(b.path));
  return createHash('sha256').update(JSON.stringify(files)).digest('hex');
}

export async function sourceTreeHash(directory) {
  const manifest = await sourceTreeManifest(directory);
  await requireClosedDownload(directory, manifest);
  return sourceDigest(manifest);
}

export async function verifyDeployedSource(expectedDirectory, downloadedDirectory) {
  const expected = await sourceExpectedManifest(expectedDirectory);
  const actual = await sourceTreeManifest(downloadedDirectory);
  await requireClosedDownload(downloadedDirectory, actual);
  assert(JSON.stringify(actual.files) === JSON.stringify(expected.files),
    'deployed Edge runtime source differs from the reviewed checkout');
  const expectedTypes = new Map(expected.typeOnlyFileRecovery.map((file) => [file.path, file]));
  assert(actual.typeOnlyFileRecovery.every((file) => JSON.stringify(file) === JSON.stringify(expectedTypes.get(file.path))),
    'deployed Edge type-only source differs from the reviewed checkout');
  return sourceDigest(actual);
}

export async function verifyRestoredSource(originalDirectory, restoredDirectory) {
  const expected = await sourceTreeHash(originalDirectory);
  const actual = await sourceTreeHash(restoredDirectory);
  assert(actual === expected, 'rollback_failed: restored Edge source hash differs from backup');
  return actual;
}

export function verifyDryRun(output) {
  const normalized = String(output ?? '')
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\r\n?/g, '\n');
  assert(normalized.trim(), 'Supabase db push dry-run evidence is empty');
  assert(
    /^\s*DRY RUN:\s*migrations will \*not\* be pushed to the database\.\s*$/im.test(normalized),
    'Supabase db push dry-run marker is missing',
  );
  const lines = normalized.split('\n');
  const headings = lines
    .map((line, index) => (/^\s*Would push these migrations:\s*$/i.test(line) ? index : -1))
    .filter((index) => index >= 0);
  assert(headings.length === 1, 'unrecognized Supabase db push dry-run migration heading');
  const listed = lines
    .slice(headings[0] + 1)
    .map((line) => line.match(/^\s*[•*+-]\s+(\d{12,14}_[\w-]+\.sql)\s*$/i)?.[1])
    .filter(Boolean);
  const allSqlFiles = [...normalized.matchAll(/\b(\d{12,14}_[\w-]+\.sql)\b/gi)]
    .map((match) => match[1]);
  assert(listed.length === 1 && listed[0] === MIGRATION_FILE,
    `dry-run did not select only ${MIGRATION_FILE}`);
  assert(allSqlFiles.length === 1 && allSqlFiles[0] === MIGRATION_FILE,
    'dry-run contains an unexpected migration reference');
}

async function captureSupabaseDryRun() {
  return await new Promise((resolve, reject) => {
    const child = spawn('supabase', ['db', 'push', '--linked', '--dry-run'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

export async function verifyDryRunEvidence(fileOutput, runDryRun = captureSupabaseDryRun) {
  try {
    verifyDryRun(fileOutput);
    return { source: 'evidence-file' };
  } catch {
    const result = await runDryRun();
    assert(result?.code === 0 && !result.signal,
      `Supabase db push dry-run evidence recovery failed with exit ${result?.code ?? 'unknown'}`);
    verifyDryRun([result.stdout, result.stderr].filter(Boolean).join('\n'));
    return { source: 'captured-cli' };
  }
}

async function main() {
  const [command, path, comparison] = process.argv.slice(2);
  if (command === 'identity') {
    verifyReleaseIdentity({
      ref: process.env.GITHUB_REF,
      sha: process.env.GITHUB_SHA,
      expectedSha: process.env.EXPECTED_SHA,
      mode: process.env.RELEASE_MODE,
    });
    return;
  }
  if (command === 'approval') {
    verifyReleaseIdentity({
      ref: process.env.GITHUB_REF,
      sha: process.env.GITHUB_SHA,
      expectedSha: process.env.EXPECTED_SHA,
      mode: process.env.RELEASE_MODE,
    });
    verifyReleaseApproval({
      allowlistJson: process.env.R3_RELEASE_APPROVAL_ALLOWLIST_JSON,
      taskId: process.env.TASK_ID,
      actionId: process.env.ACTION_ID,
      actionClass: process.env.ACTION_CLASS,
      scope: process.env.RELEASE_SCOPE,
      approvalId: process.env.APPROVAL_ID,
      expectedSha: process.env.EXPECTED_SHA,
      repository: process.env.GITHUB_REPOSITORY,
      repositoryId: process.env.GITHUB_REPOSITORY_ID,
      ref: process.env.GITHUB_REF,
      workflowRef: process.env.GITHUB_WORKFLOW_REF,
      environment: process.env.RELEASE_ENVIRONMENT,
      eventName: process.env.GITHUB_EVENT_NAME,
      runId: process.env.GITHUB_RUN_ID,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT,
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
  if (command === 'source-expected' || command === 'source-manifest') {
    const manifest = command === 'source-expected' ? await sourceExpectedManifest(path) : await sourceTreeManifest(path);
    if (command === 'source-manifest') await requireClosedDownload(path, manifest);
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return;
  }
  if (command === 'source-deployed') {
    assert(comparison, 'downloaded source directory is required');
    process.stdout.write(`${await verifyDeployedSource(path, comparison)}\n`);
    return;
  }
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
  else if (command === 'dry-run') await verifyDryRunEvidence(output);
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
