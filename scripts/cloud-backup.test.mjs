import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readRecoveryEnv } from "./lib/backup-env.mjs";
import { postgresInvocation } from "./lib/database-recovery.mjs";
import { encryptBackup, sha256 } from "./lib/private-backup.mjs";
import { verifyFullPackage } from "./verify-supabase-full.mjs";
import { checkCloudTools, removeEphemeralCloudCopy } from "./backup-supabase-cloud.mjs";

const cloudEnv = () => ({ GITHUB_ACTIONS: "true", GITHUB_REPOSITORY: "wangchaozhuanyong/zhuangxiuwangzhan",
  GITHUB_WORKFLOW: "FLASH CAST cloud encrypted backup", GITHUB_REF: "refs/heads/main", GITHUB_EVENT_NAME: "schedule",
  APP_ENV: "production", VITE_SUPABASE_URL: "https://rbsnyexjifounogswrjp.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "fixture-only-service-role", SUPABASE_DB_PASSWORD: "fixture-only-password",
  SUPABASE_ACCESS_TOKEN: "fixture-only-access-token", CLOUDFLARE_ACCOUNT_ID: "a7e061557092f924beb4a7c8adc39c3d",
  CLOUDFLARE_API_TOKEN: "fixture-only-r2-token" });

test("cloud credentials come only from guarded Actions secrets without reading or writing local env files", () => {
  const env = { ...cloudEnv(), UNRELATED_SECRET: "not-copied" };
  const result = readRecoveryEnv("/nonexistent-fixture-root", { cloud: true, env });
  assert.equal(result.SUPABASE_DB_PASSWORD, env.SUPABASE_DB_PASSWORD);
  assert.equal(result.UNRELATED_SECRET, undefined);
  assert.equal(result.GITHUB_ACTIONS, undefined);
  assert.doesNotThrow(() => readRecoveryEnv("/nonexistent-fixture-root", { cloud: true,
    env: { ...env, GITHUB_EVENT_NAME: "workflow_dispatch" } }));
});

for (const change of [{ GITHUB_ACTIONS: "false" }, { GITHUB_REPOSITORY: "foreign/project" },
  { GITHUB_REF: "refs/pull/42/merge" }, { GITHUB_EVENT_NAME: "pull_request" },
  { GITHUB_WORKFLOW: "unreviewed-job" }, { APP_ENV: "development" }, { SUPABASE_SERVICE_ROLE_KEY: "" },
  { VITE_SUPABASE_URL: "https://another-project.supabase.co" }, { CLOUDFLARE_ACCOUNT_ID: "0".repeat(32) }]) {
  test(`foreign contexts or missing secrets cannot start cloud backup: ${JSON.stringify(change)}`, () => {
    assert.throws(() => readRecoveryEnv("/nonexistent-fixture-root", { cloud: true, env: { ...cloudEnv(), ...change } }));
  });
}

test("cloud invokes native pg_dump, psql and pg_restore while existing local operations retain their original tools", () => {
  for (const command of ["psql", "pg_dump", "pg_restore"]) {
    const native = postgresInvocation(command, ["--version"], { cloud: true });
    assert.equal(native.executable, `/usr/lib/postgresql/17/bin/${command}`);
    assert.deepEqual(native.args, ["--version"]);
    assert.equal(postgresInvocation(command, []).executable, "docker");
  }
  assert.throws(() => postgresInvocation("arbitrary-command", []));
});

test("missing or older native PostgreSQL tools fail before starting a backup", () => {
  const env = cloudEnv(); const invoked = [];
  checkCloudTools("/nonexistent-fixture-root", { env, execute: (file, args) => {
    invoked.push(file); assert.deepEqual(args, ["--version"]);
    return { status: 0, stdout: "fixture (PostgreSQL) 17.11" };
  } });
  assert.equal(invoked.length, 3);
  for (const result of [{ status: 1 }, { status: 0, stdout: "fixture (PostgreSQL) 16.15" }]) {
    assert.throws(() => checkCloudTools("/nonexistent-fixture-root", { env, execute: () => result }), /Native PostgreSQL 17/);
  }
});

test("cloud package verification keeps database row, schema, administrator and media checks", (t) => {
  const base = path.resolve(".release/cloud-backup-fixtures");
  fs.mkdirSync(base, { recursive: true });
  const root = fs.mkdtempSync(path.join(base, "case-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const folder = path.join(root, "backups/2026-10-03T06-10-04-244Z");
  fs.mkdirSync(folder, { recursive: true });
  const media = Buffer.from("synthetic image");
  const payload = { archive: Buffer.from("synthetic postgres dump").toString("base64"),
    metadata: { structure: { columns: [] }, tables: [
      { schema: "auth", table: "users", rows: 1 }, { schema: "public", table: "admin_users", rows: 1 }] },
    objects: [{ path: "images/synthetic.webp", bytes: media.toString("base64"), sha256: sha256(media) }] };
  const save = () => {
    const archive = encryptBackup(Buffer.from(JSON.stringify(payload)), "fixture-only-password");
    fs.writeFileSync(path.join(folder, "recovery.fcbackup"), archive);
    fs.writeFileSync(path.join(folder, "manifest.json"), JSON.stringify({ version: 1,
      backup_type: "encrypted-postgres-storage", archive_file: "recovery.fcbackup", sha256: sha256(archive),
      table_count: 2, storage_file_count: 1 }));
  };
  save();
  const options = { cloud: true, env: cloudEnv(), execute: (file, args) => {
    assert.equal(file, "/usr/lib/postgresql/17/bin/pg_restore");
    assert.deepEqual(args, ["--data-only", "--file", "-"]);
    return { status: 0, stdout: Buffer.from("COPY auth.users (id) FROM stdin;\nsynthetic-user\n\\.\nCOPY public.admin_users (id) FROM stdin;\nsynthetic-admin\n\\.\n") };
  } };
  assert.equal(verifyFullPackage(folder, root, options).database_archive_parsed, true);
  payload.metadata.tables[0].rows = 2; save();
  assert.throws(() => verifyFullPackage(folder, root, options), /row counts/);
  payload.metadata.tables[0].rows = 1; payload.objects[0].sha256 = "0".repeat(64); save();
  assert.throws(() => verifyFullPackage(folder, root, options), /Media coverage/);
  payload.objects[0].sha256 = sha256(media); payload.metadata.structure = null; save();
  assert.throws(() => verifyFullPackage(folder, root, options), /Schema or administrator/);
});

test("workflow runs only from governed main with no deployment, private artifacts or Docker execution", () => {
  const workflow = fs.readFileSync(path.resolve(".github/workflows/supabase-cloud-backup.yml"), "utf8");
  assert.match(workflow, /cron: '0 19 \* \* \*'/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /run: node scripts\/backup-supabase-cloud\.mjs/);
  assert.doesNotMatch(workflow, /pull_request|upload-artifact|pages deploy|supabase db push|docker run|wrangler login|\.env\.production\.local/);
});

test("temporary cloud copy is removed only after exact package and successful offsite readback match", (t) => {
  const base = path.resolve(".release/cloud-backup-fixtures");
  fs.mkdirSync(base, { recursive: true });
  const root = fs.mkdtempSync(path.join(base, "cleanup-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const name = "2026-10-03T06-10-04-244Z";
  const folder = path.join(root, "backups", name);
  fs.mkdirSync(folder, { recursive: true });
  const archive = encryptBackup(Buffer.from("synthetic"), "fixture-only-password");
  fs.writeFileSync(path.join(folder, "recovery.fcbackup"), archive);
  fs.writeFileSync(path.join(folder, "manifest.json"), JSON.stringify({ version: 1,
    backup_type: "encrypted-postgres-storage", archive_file: "recovery.fcbackup", sha256: sha256(archive),
    project: "rbsnyexjifounogswrjp" }));
  const result = { backup_folder: name, backup_sha256: sha256(archive), offsite_readback_verified: true,
    operational_records_read_back: true, r2_lifecycle_verified: true, runtime: "github-actions-native-postgres",
    permanent_backup_location: "cloudflare-r2-only" };
  for (const change of [{ offsite_readback_verified: false }, { operational_records_read_back: false },
    { r2_lifecycle_verified: false }, { backup_sha256: "0".repeat(64) }, { backup_folder: "../foreign" }]) {
    assert.throws(() => removeEphemeralCloudCopy(root, { ...result, ...change }, { env: cloudEnv() }));
    assert.equal(fs.existsSync(folder), true);
  }
  assert.equal(removeEphemeralCloudCopy(root, result, { env: cloudEnv() }).ephemeral_runner_copy_removed, true);
  assert.equal(fs.existsSync(folder), false);
});
