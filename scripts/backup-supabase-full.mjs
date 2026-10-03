import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { encryptBackup, decryptBackup, sha256, assertArchivePath } from "./lib/private-backup.mjs";
import { productionConnection, productionCommand, openSnapshot, readSnapshot, schemas, excludedRuntimeData, tableListSQL, tableFingerprintSQL, schemaFingerprintSQL, IMAGE } from "./lib/database-recovery.mjs";

export async function createFullBackup(root = process.cwd(), options = {}) {
  const context = await productionConnection(root, options);
  const opened = await openSnapshot(context);
  let archive, metadata;
  try {
    const tables = readSnapshot(context, opened.snapshot, tableListSQL);
    const included = tables.filter(({ schema, table }) => !(schema === "auth" && excludedRuntimeData.includes(table)));
    const fingerprints = readSnapshot(context, opened.snapshot, tableFingerprintSQL(included));
    const structure = readSnapshot(context, opened.snapshot, schemaFingerprintSQL);
    archive = productionCommand(context, "pg_dump", ["--format=custom", "--no-owner", `--snapshot=${opened.snapshot}`,
      ...schemas.flatMap((name) => ["--schema", name]),
      ...excludedRuntimeData.map((name) => `--exclude-table-data=auth.${name}`)]);
    metadata = { tables: fingerprints, structure, excluded_runtime_data: excludedRuntimeData.map((name) => `auth.${name}`) };
  } finally { opened.close(); }

  const client = createClient(context.env.VITE_SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: buckets, error: bucketError } = await client.storage.listBuckets();
  if (bucketError) throw new Error("Storage bucket enumeration failed; no successful backup recorded.");
  const objects = [];
  for (const bucket of buckets) {
    async function walk(prefix = "") {
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await client.storage.from(bucket.id).list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
        if (error) throw new Error("Storage enumeration failed; no successful backup recorded.");
        for (const item of data || []) {
          const objectPath = assertArchivePath(prefix ? `${prefix}/${item.name}` : item.name);
          if (item.id === null) await walk(objectPath);
          else {
            const { data: blob, error: downloadError } = await client.storage.from(bucket.id).download(objectPath);
            if (downloadError || !blob) throw new Error("Storage download failed; no successful backup recorded.");
            const bytes = Buffer.from(await blob.arrayBuffer());
            objects.push({ bucket: bucket.id, path: objectPath, content_type: blob.type || "application/octet-stream", sha256: sha256(bytes), bytes: bytes.toString("base64") });
          }
        }
        if (!data || data.length < 1000) break;
      }
    }
    await walk();
  }
  const created = new Date().toISOString();
  const folder = path.join(root, "backups", created.replace(/[:.]/g, "-"));
  fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
  const payload = Buffer.from(JSON.stringify({ version: 1, archive: archive.toString("base64"), metadata, buckets, objects }));
  const encrypted = encryptBackup(payload, context.env.SUPABASE_DB_PASSWORD);
  // Authenticate the saved bytes before declaring the package complete.
  fs.writeFileSync(path.join(folder, "recovery.fcbackup"), encrypted, { mode: 0o600, flag: "wx" });
  const verified = decryptBackup(fs.readFileSync(path.join(folder, "recovery.fcbackup")), context.env.SUPABASE_DB_PASSWORD);
  if (sha256(verified) !== sha256(payload)) throw new Error("Saved encrypted package verification failed.");
  const manifest = {
    backup_type: "encrypted-postgres-storage", version: 1, created_at: created, project: context.ref,
    archive_file: "recovery.fcbackup", sha256: sha256(encrypted), full_access: true,
    database_image: context.cloud ? null : IMAGE, database_client_major: 17,
    runtime: context.cloud ? "github-actions-native-postgres" : "local-docker", schemas, table_count: metadata.tables.length,
    public_table_count: metadata.tables.filter((item) => item.schema === "public").length,
    auth_user_count: metadata.tables.find((item) => item.schema === "auth" && item.table === "users")?.rows ?? null,
    mfa_factor_count: metadata.tables.find((item) => item.schema === "auth" && item.table === "mfa_factors")?.rows ?? null,
    storage_bucket_count: buckets.length, storage_file_count: objects.length,
    excluded_runtime_data: metadata.excluded_runtime_data,
    encryption: "AES-256-GCM; scrypt; unlock with the private source DB password retained at backup time",
    coverage: { schema: true, business_data: true, auth_accounts: true, storage_bytes: true, live_sessions: false, external_auth_provider_configuration: false },
    restore_verified: false,
  };
  fs.writeFileSync(path.join(folder, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ action: "fresh encrypted backup", folder: path.relative(root, folder), publicTables: manifest.public_table_count, authUsers: manifest.auth_user_count, mfaFactors: manifest.mfa_factor_count, files: objects.length, verifiedEncryption: true }));
  return { folder, manifest };
}

if (path.resolve(process.argv[1] || "") === path.resolve(import.meta.filename)) {
  try { await createFullBackup(); }
  catch (error) { console.error(`[backup-supabase-full] ${error.message}`); process.exitCode = 1; }
}
