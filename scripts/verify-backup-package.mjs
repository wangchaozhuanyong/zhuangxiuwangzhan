import fs from "node:fs";
import path from "node:path";
import { logSystemHealthEvent } from "./lib/system-health-events.mjs";
import { verifyFullPackage } from "./verify-supabase-full.mjs";

const root = process.cwd();
const backupArg = process.argv[2];
const backupsDir = path.join(root, "backups");

const latestBackup = () => {
  if (!fs.existsSync(backupsDir)) return null;
  const entries = fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = path.join(backupsDir, entry.name);
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .filter((entry) => /^\d{4}-\d{2}-\d{2}T/.test(path.basename(entry.fullPath)) && fs.existsSync(path.join(entry.fullPath, "manifest.json")))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return entries[0]?.fullPath || null;
};

const backupPath = backupArg ? path.resolve(root, backupArg) : latestBackup();
if (!backupPath || !fs.existsSync(backupPath)) {
  console.error("[verify-backup-package] No backup folder found.");
  process.exit(1);
}

const requireFile = (file) => {
  const full = path.join(backupPath, file);
  if (!fs.existsSync(full)) throw new Error(`${file} is missing`);
  if (fs.statSync(full).size <= 0) throw new Error(`${file} is empty`);
  return fs.readFileSync(full, "utf8");
};

const manifest = JSON.parse(requireFile("manifest.json"));

if (manifest.backup_type === "encrypted-postgres-storage") {
  const result = verifyFullPackage(backupPath, root);
  await logSystemHealthEvent({
    event_type: "backup_package_verified", severity: "info", message: "Encrypted database, account and media package verification completed.",
    metadata: { backup_folder: path.basename(backupPath), backup_type: manifest.backup_type, full_access: true, table_count: result.table_count, total_rows: result.total_rows, storage_file_count: result.storage_file_count, verified_at: new Date().toISOString() },
  }, root);
  console.log(`[verify-backup-package] OK: ${backupPath}`);
} else if (manifest.backup_type === "rest-json") {
  const tablesDir = path.join(backupPath, "tables");
  const declaredTables = Array.isArray(manifest.tables) ? manifest.tables : [];
  const requiredTables = [...new Set(["cms_pages", "cms_sections", "cms_content_entries", "site_settings",
    ...declaredTables.map((entry) => entry.table)])];
  const failures = [];

  for (const entry of declaredTables) {
    if (!/^[a-z][a-z0-9_]*$/.test(entry.table || "")) throw new Error("Invalid backup table name");
    if (entry.ok !== true) failures.push(`${entry.table} was not backed up successfully`);
  }

  if (!fs.existsSync(tablesDir)) failures.push("tables folder is missing");
  for (const table of requiredTables) {
    const file = path.join(tablesDir, `${table}.json`);
    if (!fs.existsSync(file)) {
      failures.push(`${table}.json is missing`);
      continue;
    }
    const rows = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(rows)) failures.push(`${table}.json is not an array`);
    const declared = declaredTables.find((entry) => entry.table === table);
    if (declared && rows.length !== declared.rows) failures.push(`${table}.json row count differs from manifest`);
  }
  if (!manifest.storage_bucket) failures.push("manifest missing storage bucket");
  if (typeof manifest.storage_file_count !== "number") failures.push("manifest missing storage file count");
  const countStorageFiles = (folder) => fs.existsSync(folder)
    ? fs.readdirSync(folder, { withFileTypes: true }).reduce((count, entry) => count
      + (entry.isDirectory() ? countStorageFiles(path.join(folder, entry.name)) : entry.isFile() ? 1 : 0), 0) : 0;
  const actualStorageFiles = countStorageFiles(path.join(backupPath, "site-images"));
  if (actualStorageFiles !== manifest.storage_file_count) failures.push("storage file count differs from manifest");

  if (failures.length) {
    console.error("[verify-backup-package] Backup is not restorable enough:");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  await logSystemHealthEvent({
    event_type: "backup_package_verified",
    severity: "info",
    message: "Backup package verification completed.",
    metadata: {
      backup_folder: path.basename(backupPath),
      backup_type: manifest.backup_type,
      full_access: Boolean(manifest.full_access),
      required_tables: requiredTables,
      storage_bucket: manifest.storage_bucket || null,
      storage_file_count: manifest.storage_file_count,
      verified_at: new Date().toISOString(),
    },
  }, root);
  console.log(`[verify-backup-package] OK: ${backupPath}`);
} else {
  const schema = requireFile(manifest.schema_file || "public-schema.sql");
  const data = requireFile(manifest.data_file || "public-data.sql");

  const requiredSchemaMarkers = [
    "CREATE TABLE",
    "cms_pages",
    "cms_sections",
    "admin_users",
    "system_event_logs",
  ];

  const requiredDataMarkers = ["COPY", "cms_pages"];
  const failures = [];

  for (const marker of requiredSchemaMarkers) {
    if (!schema.includes(marker)) failures.push(`schema missing ${marker}`);
  }
  for (const marker of requiredDataMarkers) {
    if (!data.includes(marker)) failures.push(`data missing ${marker}`);
  }

  if (!manifest.storage_bucket) failures.push("manifest missing storage bucket");
  if (typeof manifest.storage_file_count !== "number") failures.push("manifest missing storage file count");

  if (failures.length) {
    console.error("[verify-backup-package] Backup is not restorable enough:");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  await logSystemHealthEvent({
    event_type: "backup_package_verified",
    severity: "info",
    message: "Backup package verification completed.",
    metadata: {
      backup_folder: path.basename(backupPath),
      backup_type: manifest.backup_type || "sql-dump",
      full_access: Boolean(manifest.full_access),
      storage_bucket: manifest.storage_bucket || null,
      storage_file_count: manifest.storage_file_count,
      verified_at: new Date().toISOString(),
    },
  }, root);
  console.log(`[verify-backup-package] OK: ${backupPath}`);
}
