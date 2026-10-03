import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readRecoveryEnv } from "./lib/backup-env.mjs";
import { postgresInvocation } from "./lib/database-recovery.mjs";
import { runDailyBackup } from "./backup-supabase-daily.mjs";
import { ownedPackage } from "./backup-offsite-r2.mjs";

export function checkCloudTools(root, { execute = spawnSync, env = process.env } = {}) {
  readRecoveryEnv(root, { cloud: true, env });
  for (const tool of ["psql", "pg_dump", "pg_restore"]) {
    const invocation = postgresInvocation(tool, ["--version"], { cloud: true });
    const result = execute(invocation.executable, invocation.args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 10000 });
    if (result.status !== 0 || !/\(PostgreSQL\) 17\./.test(result.stdout || "")) throw new Error("Native PostgreSQL 17 backup tools are required.");
  }
}

export function removeEphemeralCloudCopy(root, result, { env = process.env } = {}) {
  readRecoveryEnv(root, { cloud: true, env });
  if (result.offsite_readback_verified !== true || result.operational_records_read_back !== true
    || result.r2_lifecycle_verified !== true || result.runtime !== "github-actions-native-postgres"
    || result.permanent_backup_location !== "cloudflare-r2-only") throw new Error("Verify cloud backup success before removing its temporary copy.");
  const folder = path.join(root, "backups", result.backup_folder);
  const base = fs.realpathSync(path.join(root, "backups"));
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(result.backup_folder)
    || fs.realpathSync(folder) !== path.join(base, result.backup_folder)) throw new Error("Unexpected temporary cloud backup directory.");
  const selected = ownedPackage(folder, root);
  if (selected.manifest.project !== "rbsnyexjifounogswrjp" || selected.manifest.sha256 !== result.backup_sha256) {
    throw new Error("Temporary cloud package does not match the verified backup.");
  }
  fs.rmSync(folder, { recursive: true });
  return { ...result, ephemeral_runner_copy_removed: true };
}

export async function runCloudBackup(root = process.cwd()) {
  checkCloudTools(root);
  const result = removeEphemeralCloudCopy(root, await runDailyBackup(root, { cloud: true, authentication: "api-token" }));
  const base = fs.realpathSync(path.join(root, "backups"));
  fs.writeFileSync(path.join(base, "daily-backup-result.json"), JSON.stringify(result, null, 2) + "\n", { mode: 0o600 });
  return result;
}

if (path.resolve(process.argv[1] || "") === path.resolve(import.meta.filename)) {
  try { console.log(JSON.stringify(await runCloudBackup())); }
  catch (error) { console.error(`[backup-supabase-cloud] ${error.message}`); process.exitCode = 1; }
}
