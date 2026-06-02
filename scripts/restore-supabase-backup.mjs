import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { logSystemHealthEvent } from "./lib/system-health-events.mjs";

const root = process.cwd();
const backupArg = process.argv[2];
const dryRun = process.argv.includes("--dry-run") || process.env.RESTORE_DRY_RUN === "1";
const confirmWrite = process.env.RESTORE_CONFIRM === "YES";

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
if (manifest.backup_type !== "rest-json") {
  console.log("[restore-supabase-backup] SQL dump backups should be restored with psql after testing on staging.");
} else {
  const tablesDir = path.join(backupPath, "tables");
  const tableFiles = fs.readdirSync(tablesDir).filter((file) => file.endsWith(".json"));
  const summary = tableFiles.map((file) => {
    const rows = JSON.parse(fs.readFileSync(path.join(tablesDir, file), "utf8"));
    return { table: file.replace(/\.json$/, ""), rows: Array.isArray(rows) ? rows.length : 0 };
  });

  if (dryRun) {
    console.log("[restore-supabase-backup] Dry run OK.");
    console.log(JSON.stringify({ backupPath, tables: summary }, null, 2));
    await logSystemHealthEvent({
      event_type: "backup_restore_dry_run_completed",
      severity: "info",
      message: "Backup restore dry run completed.",
      metadata: {
        backup_folder: path.basename(backupPath),
        backup_type: manifest.backup_type,
        table_count: summary.length,
        total_rows: summary.reduce((total, item) => total + item.rows, 0),
        checked_at: new Date().toISOString(),
      },
    }, root);
  } else {
    if (!confirmWrite) {
      console.error("[restore-supabase-backup] Refusing to write. Set RESTORE_CONFIRM=YES after testing on staging.");
      process.exit(1);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[restore-supabase-backup] Restore writes require VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
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
