import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { logSystemHealthEvent } from "./lib/system-health-events.mjs";
import { verifyFullPackage } from "./verify-supabase-full.mjs";

const root = process.cwd();
const backupArg = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const dryRun = process.argv.includes("--dry-run") || process.env.RESTORE_DRY_RUN === "1";
const confirmWrite = process.env.RESTORE_CONFIRM === "YES";
const targetUrlArg = process.argv.find((arg) => arg.startsWith("--target-url="))?.slice("--target-url=".length);
// A write must never silently inherit the production key from the repository .env.
const explicitServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function loadDotEnv(file = ".env") {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=");
  }
}

const latestBackup = () => {
  const backupsDir = path.join(root, "backups");
  if (!fs.existsSync(backupsDir)) return null;
  return fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = path.join(backupsDir, entry.name);
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .filter((entry) => /^\d{4}-\d{2}-\d{2}T/.test(path.basename(entry.fullPath)) && fs.existsSync(path.join(entry.fullPath, "manifest.json")))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0]?.fullPath || null;
};

loadDotEnv();
const backupPath = backupArg && !backupArg.startsWith("--") ? path.resolve(root, backupArg) : latestBackup();
if (!backupPath || !fs.existsSync(backupPath)) {
  console.error("[restore-supabase-backup] No backup folder found.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(path.join(backupPath, "manifest.json"), "utf8"));
if (manifest.backup_type === "encrypted-postgres-storage") {
  if (!dryRun) throw new Error("Encrypted restores require restore:backup:full and its dedicated local target guard.");
  const result = verifyFullPackage(backupPath, root);
  console.log(`[restore-supabase-backup] Dry run OK: ${result.table_count} tables, ${result.storage_file_count} media files. No data was imported.`);
} else if (manifest.backup_type !== "rest-json") {
  console.log("[restore-supabase-backup] SQL dump backups should be restored with psql after testing on staging.");
} else {
  const tablesDir = path.join(backupPath, "tables");
  const availableFiles = fs.readdirSync(tablesDir).filter((file) => file.endsWith(".json"));
  const declaredTables = Array.isArray(manifest.tables) ? manifest.tables.map((entry) => entry.table) : [];
  if (declaredTables.some((table) => !/^[a-z][a-z0-9_]*$/.test(table))) throw new Error("Invalid backup table name");
  // The backup manifest orders parent tables before children. Alphabetical order
  // puts lead_followups before leads and can fail on otherwise valid backups.
  const tableFiles = [...declaredTables.map((table) => `${table}.json`),
    ...availableFiles.filter((file) => !declaredTables.includes(file.replace(/\.json$/, "")))];
  const summary = tableFiles.map((file) => {
    const rows = JSON.parse(fs.readFileSync(path.join(tablesDir, file), "utf8"));
    return { table: file.replace(/\.json$/, ""), rows: Array.isArray(rows) ? rows.length : 0 };
  });

  if (dryRun) {
    console.log("[restore-supabase-backup] Dry run OK.");
    console.log(JSON.stringify({ backupPath, tables: summary }, null, 2));
    // Validation is read-only; do not insert a health event into a dotenv project.
  } else {
    if (!confirmWrite) {
      console.error("[restore-supabase-backup] Refusing to write. Set RESTORE_CONFIRM=YES after testing on staging.");
      process.exit(1);
    }

    const supabaseUrl = targetUrlArg;
    const serviceRoleKey = explicitServiceRoleKey;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[restore-supabase-backup] Writes require --target-url and an explicitly supplied SUPABASE_SERVICE_ROLE_KEY.");
      process.exit(1);
    }
    const target = new URL(supabaseUrl);
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(target.hostname);
    if (target.hostname === `${manifest.project}.supabase.co` || target.username || target.password
        || target.search || target.hash || !["http:", "https:"].includes(target.protocol)
        || (!local && target.protocol !== "https:")) {
      console.error("[restore-supabase-backup] Refusing the original production project or an unsafe target URL. Restore to an isolated test environment first.");
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    for (const { table } of summary) {
      const rows = JSON.parse(fs.readFileSync(path.join(tablesDir, `${table}.json`), "utf8"));
      if (!rows.length) continue;
      const { error } = await supabase.from(table).upsert(rows);
      if (error) {
        console.error(`[restore-supabase-backup] ${table} failed: ${error.message}`);
        process.exit(1);
      }
      console.log(`[restore-supabase-backup] restored ${table}: ${rows.length}`);
    }

    const storageRoot = path.join(backupPath, "site-images");
    const storageFiles = [];
    const walkStorage = (folder) => {
      if (!fs.existsSync(folder)) return;
      for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        if (entry.isSymbolicLink()) throw new Error("Storage backup cannot contain symbolic links");
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) walkStorage(full);
        else if (entry.isFile()) storageFiles.push(full);
      }
    };
    walkStorage(storageRoot);
    if (storageFiles.length !== manifest.storage_file_count) throw new Error("Storage backup count differs from manifest");
    const mediaTypes = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".avif": "image/avif" };
    for (const file of storageFiles) {
      const objectPath = path.relative(storageRoot, file).split(path.sep).join("/");
      const { error } = await supabase.storage.from(manifest.storage_bucket).upload(objectPath, fs.readFileSync(file),
        { upsert: true, contentType: mediaTypes[path.extname(file).toLowerCase()] || "application/octet-stream" });
      if (error) throw new Error("Storage restore failed; check the isolated environment without printing private records");
    }
    console.log(`[restore-supabase-backup] restored storage objects: ${storageFiles.length}`);

    // Any operational receipt belongs to the explicit restore target too.
    process.env.VITE_SUPABASE_URL = supabaseUrl;
    process.env.SUPABASE_URL = supabaseUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
    await logSystemHealthEvent({
      event_type: "backup_restore_completed",
      severity: "warn",
      message: "Backup restore completed.",
      metadata: {
        backup_folder: path.basename(backupPath),
        backup_type: manifest.backup_type,
        table_count: summary.length,
        total_rows: summary.reduce((total, item) => total + item.rows, 0),
        restored_at: new Date().toISOString(),
      },
    }, root);
    console.log("[restore-supabase-backup] Restore completed.");
  }
}
