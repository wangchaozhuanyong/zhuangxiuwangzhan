import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createFullBackup } from "./backup-supabase-full.mjs";
import { verifyFullPackage } from "./verify-supabase-full.mjs";
import { r2Context, checkPrivateBucket, checkSevenDayRetention, uploadEncryptedBackup } from "./backup-offsite-r2.mjs";
import { purgeExpiredBackups, RETENTION_DAYS } from "./lib/backup-retention.mjs";

export const localDay = (value = new Date()) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);

export function todaysPackage(root, day = localDay()) {
  const base = path.join(root, "backups");
  if (!fs.existsSync(base)) return null;
  const found = fs.readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory()).flatMap((entry) => {
    const folder = path.join(base, entry.name);
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(folder, "manifest.json"), "utf8"));
      return manifest.backup_type === "encrypted-postgres-storage" && manifest.version === 1
        && !Number.isNaN(Date.parse(manifest.created_at)) && localDay(new Date(manifest.created_at)) === day
        ? [{ folder, createdAt: manifest.created_at }] : [];
    } catch { return []; }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return found[0]?.folder || null;
}

export async function runDailyBackup(root = process.cwd(), options = {}) {
  const base = path.join(root, "backups");
  fs.mkdirSync(base, { recursive: true, mode: 0o700 });
  const lock = path.join(base, ".daily-backup.lock");
  let descriptor;
  try { descriptor = fs.openSync(lock, "wx", 0o600); }
  catch { throw new Error("Another backup run or interrupted lock exists; inspect it before retrying."); }
  fs.writeSync(descriptor, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
  fs.closeSync(descriptor);
  try {
    const context = r2Context(root, fetch, options);
    await checkPrivateBucket(context);
    await checkSevenDayRetention(context);
    let folder = todaysPackage(root);
    const reused = Boolean(folder);
    if (!folder) ({ folder } = await createFullBackup(root, options));
    const verified = verifyFullPackage(folder, root, options);
    const offsite = await uploadEncryptedBackup(folder, root, { context });
    const recorded = spawnSync(process.execPath, [path.join(root, "scripts/record-recovery-status.mjs"), folder, "--backup-only", ...(options.cloud ? ["--cloud"] : [])], {
      cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000,
    });
    if (recorded.status !== 0) throw new Error("Offsite copy verified, but operational record/readback failed; private output withheld.");
    const retention = options.cloud ? { deleted_backup_folders: [], reclaimed_bytes: 0 }
      : purgeExpiredBackups(root, { project: context.project, folder, offsite });
    const result = { completed_at: new Date().toISOString(), day: localDay(), timezone: "Asia/Kuala_Lumpur",
      backup_folder: path.basename(folder), backup_sha256: verified.manifest.sha256,
      reused_todays_package: reused, table_count: verified.table_count, storage_file_count: verified.storage_file_count,
      offsite_readback_verified: offsite.remote_readback_matched === true,
      operational_records_read_back: true, new_restore_acceptance_claimed: false,
      retention_days: RETENTION_DAYS, r2_lifecycle_verified: true,
      runtime: options.cloud ? "github-actions-native-postgres" : "local-docker",
      permanent_backup_location: options.cloud ? "cloudflare-r2-only" : "local-and-cloudflare-r2",
      deleted_backup_folders: retention.deleted_backup_folders, reclaimed_bytes: retention.reclaimed_bytes,
      old_backups_deleted: retention.deleted_backup_folders.length > 0 };
    fs.writeFileSync(path.join(base, "daily-backup-result.json"), JSON.stringify(result, null, 2) + "\n", { mode: 0o600 });
    return result;
  } finally { fs.unlinkSync(lock); }
}

if (path.resolve(process.argv[1] || "") === path.resolve(import.meta.filename)) {
  try { console.log(JSON.stringify(await runDailyBackup(process.cwd(), {
    authentication: process.argv.includes("--auth=wrangler") ? "wrangler" : "api-token",
  }))); }
  catch (error) { console.error(`[backup-supabase-daily] ${error.message}`); process.exitCode = 1; }
}
