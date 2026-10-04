import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { readEnvFile } from "./lib/project-env.mjs";
import { decryptBackup, sha256, assertLocalRestoreContainer, assertArchivePath } from "./lib/private-backup.mjs";
import { IMAGE, tableFingerprintSQL, schemaFingerprintSQL, normalizeStructure } from "./lib/database-recovery.mjs";

const root = process.cwd();
const container = "supabase_db_flashcast-full-restore-20261003";
const lab = path.join(root, "backups/environment-recovery-20261003/restore-lab");
const reportPath = path.join(root, "audits/environment-recovery-20261003/restore-result.json");

function localSQL(sql, user = "supabase_admin") {
  const result = spawnSync("docker", ["exec", "-i", container, "psql", "-U", user, "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"], { input: sql, maxBuffer: 256 * 1024 * 1024, timeout: 300000 });
  if (result.status !== 0) {
    // Only report a generic failure. SQL errors can include customer values.
    const match = result.stderr.toString().match(/(?:ERROR|FATAL):\s*([^\n]+)/);
    const safe = match?.[1]?.match(/^(?:(?:role|schema|relation|extension|function|type|publication|policy|trigger|event trigger) "[a-z_]+" (?:does not exist|already exists)|must be owner of [a-z_ ]+|permission denied for [a-z_ ]+|cannot drop [a-z_ ]+ because other objects depend on it)/)?.[0];
    throw new Error(`Isolated restore SQL failed${safe ? `: ${safe}` : "; private output withheld"}.`);
  }
  return result.stdout.toString().trim();
}

async function restore() {
  assertLocalRestoreContainer(container);
  const backup = path.resolve(root, process.argv[2] || "");
  if (!backup.startsWith(`${path.join(root, "backups")}${path.sep}`)) throw new Error("Select a project-owned backup folder.");
  const manifest = JSON.parse(fs.readFileSync(path.join(backup, "manifest.json"), "utf8"));
  if (manifest.backup_type !== "encrypted-postgres-storage") throw new Error("Expected a full encrypted backup.");
  const file = assertArchivePath(manifest.archive_file);
  const encrypted = fs.readFileSync(path.join(backup, file));
  if (sha256(encrypted) !== manifest.sha256) throw new Error("Encrypted backup checksum differs from its manifest.");
  const privateEnv = readEnvFile(path.join(root, ".env.production.local"));
  // Authentication completes before any SQL is sent to the isolated target.
  const payload = JSON.parse(decryptBackup(encrypted, privateEnv.SUPABASE_DB_PASSWORD).toString());
  const [state] = JSON.parse(spawnSync("docker", ["inspect", container], { encoding: "utf8" }).stdout);
  if (!state?.State.Running || Object.values(state.HostConfig.PortBindings || {}).flat().some((item) => item.HostIp !== "127.0.0.1")) throw new Error("The isolated target must be running with loopback ports only.");
  const importedFile = path.join(lab, "restore-imported.json");
  const imported = fs.existsSync(importedFile) ? JSON.parse(fs.readFileSync(importedFile, "utf8")) : null;
  if (imported && (!process.argv.includes("--resume") || imported.backup_folder !== path.basename(backup))) throw new Error("This lab has already been imported. Use --resume with the same package to verify it without replacing data.");
  if (!imported && Number(localSQL("SELECT count(*) FROM pg_tables WHERE schemaname='public';")) !== 0) throw new Error("The rehearsal public schema must be empty before import.");
  const archive = Buffer.from(payload.archive, "base64");
  const unpack = spawnSync("docker", ["run", "--rm", "-i", IMAGE, "pg_restore", "--file", "-"], { input: archive, maxBuffer: 256 * 1024 * 1024, timeout: 300000 });
  if (unpack.status !== 0) throw new Error("Postgres archive parsing failed.");
  const drops = "BEGIN; DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA IF EXISTS storage CASCADE; DROP SCHEMA IF EXISTS supabase_migrations CASCADE;\n";
  if (!imported) {
    localSQL(Buffer.concat([Buffer.from(drops), unpack.stdout, Buffer.from("\nCOMMIT;\n")]));
    fs.writeFileSync(importedFile, JSON.stringify({ backup_folder: path.basename(backup), imported_at: new Date().toISOString() }), { mode: 0o600, flag: "wx" });
  } else {
    // Retain imported rows; recover original ownership required by local Auth/Storage.
    const ownership = unpack.stdout.toString().split("\n").filter((line) => /^ALTER (?:SCHEMA|TABLE|SEQUENCE|VIEW|MATERIALIZED VIEW|FUNCTION|TYPE|DOMAIN) .+ OWNER TO [a-z_]+;$/.test(line));
    localSQL(`BEGIN;\n${ownership.join("\n")}\nCOMMIT;`);
  }
  const checkpointFile = path.join(lab, "database-readback.json");
  const checkpoint = fs.existsSync(checkpointFile) ? JSON.parse(fs.readFileSync(checkpointFile, "utf8")) : null;
  if (checkpoint && (checkpoint.backup_sha256 !== manifest.sha256 || checkpoint.backup_folder !== path.basename(backup))) throw new Error("Database readback checkpoint belongs to a different backup.");
  const actualTables = checkpoint ? null : JSON.parse(localSQL(tableFingerprintSQL(payload.metadata.tables)));
  const expectedStructure = normalizeStructure(payload.metadata.structure);
  const actualStructure = normalizeStructure(JSON.parse(localSQL(schemaFingerprintSQL, "postgres")));
  const structureChecks = Object.fromEntries(Object.keys(expectedStructure).map((key) => [key, JSON.stringify(expectedStructure[key]) === JSON.stringify(actualStructure[key])]));
  const tableChecks = checkpoint?.table_checks || payload.metadata.tables.map((expected) => {
    const actual = actualTables.find((item) => item.schema === expected.schema && item.table === expected.table);
    return { schema: expected.schema, table: expected.table, rows: expected.rows, matched: actual?.rows === expected.rows && actual?.checksum === expected.checksum };
  });
  if (!checkpoint && tableChecks.every((item) => item.matched)) fs.writeFileSync(checkpointFile, JSON.stringify({ backup_sha256: manifest.sha256, backup_folder: path.basename(backup), table_checks: tableChecks, measured_at: new Date().toISOString(), stage: "after database import, before Storage/Auth runtime writes" }, null, 2), { mode: 0o600, flag: "wx" });
  const status = spawnSync("npx", ["--yes", "supabase@2.119.0", "status", "--workdir", lab, "--output", "json"], { encoding: "utf8", timeout: 30000 });
  if (status.status !== 0) throw new Error("Local Auth/Storage status is unavailable.");
  const local = JSON.parse(status.stdout);
  const service = createClient(local.API_URL.replace("localhost", "127.0.0.1"), local.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let mediaVerified = 0;
  for (const item of payload.objects) {
    assertArchivePath(item.path);
    const bytes = Buffer.from(item.bytes, "base64");
    if (sha256(bytes) !== item.sha256) throw new Error("Backup media checksum mismatch.");
    const upload = await service.storage.from(item.bucket).upload(item.path, bytes, { upsert: true, contentType: item.content_type });
    if (upload.error) throw new Error("Isolated media upload failed.");
    const downloaded = await service.storage.from(item.bucket).download(item.path);
    if (downloaded.error || sha256(Buffer.from(await downloaded.data.arrayBuffer())) !== item.sha256) throw new Error("Isolated media readback failed.");
    mediaVerified += 1;
  }
  const previous = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : null;
  const acceptance = previous?.backup_sha256 === manifest.sha256 ? Object.fromEntries(["original_admin_login_verified", "original_admin_mfa_verified", "permissions_verified", "login_method", "recovered_account_auth_session_verified", "permission_checks", "acceptance_complete"].filter((key) => key in previous).map((key) => [key, previous[key]])) : {};
  const receipt = { checked_at: new Date().toISOString(), backup_folder: path.basename(backup), backup_sha256: manifest.sha256,
    target: "isolated-local-flashcast-full-restore-20261003", production_business_auth_schema_modified: false,
    database_imported: true, data_verified: tableChecks.every((item) => item.matched), schema_verified: Object.values(structureChecks).every(Boolean),
    auth_verified: tableChecks.filter((item) => item.schema === "auth").every((item) => item.matched),
    media_verified: mediaVerified === manifest.storage_file_count, storage_file_count: mediaVerified, schema_checks: structureChecks, table_checks: tableChecks,
    original_admin_login_verified: false, original_admin_mfa_verified: false, permissions_verified: false,
    session_tokens_restored: false, external_provider_configuration_restored: false, full_access: true,
    data_verification_stage: "after database import, before Storage/Auth runtime housekeeping updates",
    ...acceptance,
  };
  fs.writeFileSync(reportPath, JSON.stringify(receipt, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ action: "isolated restore readback", data: receipt.data_verified, schema: receipt.schema_verified, auth: receipt.auth_verified, files: mediaVerified, report: path.relative(root, reportPath) }));
  if (!receipt.data_verified || !receipt.schema_verified || !receipt.auth_verified || !receipt.media_verified) process.exitCode = 1;
}

try { await restore(); }
catch (error) { console.error(`[restore-supabase-full] ${error.message}`); process.exitCode = 1; }
