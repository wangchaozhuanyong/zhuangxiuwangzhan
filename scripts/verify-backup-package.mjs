import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupArg = process.argv[2];
const backupsDir = path.join(root, "backups");

const latestBackup = () => {
  if (!fs.existsSync(backupsDir)) return null;
  const entries = fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(backupsDir, entry.name))
    .sort();
  return entries.at(-1) || null;
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

if (manifest.backup_type === "rest-json") {
  const tablesDir = path.join(backupPath, "tables");
  const requiredTables = ["cms_pages", "cms_sections", "cms_content_entries", "site_settings"];
  const failures = [];

  if (!fs.existsSync(tablesDir)) failures.push("tables folder is missing");
  for (const table of requiredTables) {
    const file = path.join(tablesDir, `${table}.json`);
    if (!fs.existsSync(file)) {
      failures.push(`${table}.json is missing`);
      continue;
    }
    const rows = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(rows)) failures.push(`${table}.json is not an array`);
  }
  if (!manifest.storage_bucket) failures.push("manifest missing storage bucket");
  if (typeof manifest.storage_file_count !== "number") failures.push("manifest missing storage file count");

  if (failures.length) {
    console.error("[verify-backup-package] Backup is not restorable enough:");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log(`[verify-backup-package] OK: ${backupPath}`);
  process.exit(0);
}

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

console.log(`[verify-backup-package] OK: ${backupPath}`);
