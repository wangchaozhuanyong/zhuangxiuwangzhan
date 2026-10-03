import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readRecoveryEnv } from "./lib/backup-env.mjs";
import { decryptBackup, sha256, assertArchivePath } from "./lib/private-backup.mjs";
import { postgresInvocation } from "./lib/database-recovery.mjs";

export function verifyFullPackage(folder, root = process.cwd(), options = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, "manifest.json"), "utf8"));
  if (manifest.backup_type !== "encrypted-postgres-storage" || manifest.version !== 1) throw new Error("Unsupported encrypted recovery package.");
  const bytes = fs.readFileSync(path.join(folder, assertArchivePath(manifest.archive_file)));
  if (sha256(bytes) !== manifest.sha256) throw new Error("Encrypted package checksum mismatch.");
  const env = readRecoveryEnv(root, options);
  const payload = JSON.parse(decryptBackup(bytes, env.SUPABASE_DB_PASSWORD).toString());
  const archive = Buffer.from(payload.archive, "base64");
  const invocation = postgresInvocation("pg_restore", ["--data-only", "--file", "-"], options);
  const dump = (options.execute || spawnSync)(invocation.executable, invocation.args, { input: archive, maxBuffer: 256 * 1024 * 1024, timeout: 60000 });
  if (dump.status !== 0) throw new Error("Postgres archive cannot be parsed.");
  const counts = new Map();
  let table = null, rows = 0;
  for (const line of dump.stdout.toString().split("\n")) {
    const match = line.match(/^COPY ([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*) \(/);
    if (match) { table = `${match[1]}.${match[2]}`; rows = 0; }
    else if (table && line === "\\.") { counts.set(table, rows); table = null; }
    else if (table) rows += 1;
  }
  if (payload.metadata.tables.length !== manifest.table_count
    || payload.metadata.tables.some((item) => counts.get(`${item.schema}.${item.table}`) !== item.rows)) throw new Error("Archive table coverage or row counts differ from the manifest.");
  if (payload.objects.length !== manifest.storage_file_count
    || payload.objects.some((item) => { assertArchivePath(item.path); return sha256(Buffer.from(item.bytes, "base64")) !== item.sha256; })) throw new Error("Media coverage or checksums differ from the manifest.");
  if (!payload.metadata.structure || !payload.metadata.tables.some((item) => item.schema === "auth" && item.table === "users")
    || !payload.metadata.tables.some((item) => item.schema === "public" && item.table === "admin_users")) throw new Error("Schema or administrator recovery coverage is missing.");
  return { manifest, table_count: manifest.table_count, total_rows: payload.metadata.tables.reduce((sum, item) => sum + item.rows, 0), storage_file_count: payload.objects.length, encrypted_integrity_verified: true, database_archive_parsed: true, schema_metadata_present: true };
}

if (process.argv[1] === import.meta.filename) {
  try {
    const folder = path.resolve(process.cwd(), process.argv[2] || "");
    const result = verifyFullPackage(folder);
    console.log(JSON.stringify({ verified: true, tables: result.table_count, rows: result.total_rows, files: result.storage_file_count }));
  } catch (error) { console.error(`[verify-supabase-full] ${error.message}`); process.exitCode = 1; }
}
