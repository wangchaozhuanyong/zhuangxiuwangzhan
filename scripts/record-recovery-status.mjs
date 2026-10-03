import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { productionConnection } from "./lib/database-recovery.mjs";
import { verifyFullPackage } from "./verify-supabase-full.mjs";
import { sha256 } from "./lib/private-backup.mjs";

async function record() {
  const root = process.cwd();
  const options = { cloud: process.argv.includes("--cloud") };
  const folder = path.resolve(root, process.argv[2] || "");
  if (!folder.startsWith(`${path.join(root, "backups")}${path.sep}`)) throw new Error("Select a project-owned recovery package.");
  const verified = verifyFullPackage(folder, root, options);
  const manifest = verified.manifest;
  const backupOnly = process.argv.includes("--backup-only");
  const receipt = backupOnly ? null : JSON.parse(fs.readFileSync(path.join(root, "audits/environment-recovery-20261003/restore-result.json"), "utf8"));
  if (!backupOnly && (receipt.backup_sha256 !== manifest.sha256 || receipt.backup_folder !== path.basename(folder)
    || receipt.target !== "isolated-local-flashcast-full-restore-20261003")) throw new Error("Restore receipt does not match this backup.");
  const scopes = ["data_verified", "schema_verified", "auth_verified", "media_verified", "original_admin_login_verified", "original_admin_mfa_verified", "permissions_verified"];
  if (!backupOnly && !scopes.slice(0, 4).every((key) => receipt[key] === true)) throw new Error("Complete database and media readback before recording a recovery result.");
  const complete = !backupOnly && scopes.every((key) => receipt[key] === true);
  let offsite;
  if (backupOnly) {
    offsite = JSON.parse(fs.readFileSync(path.join(folder, "offsite-readback.json"), "utf8"));
    if (offsite.backup_sha256 !== manifest.sha256 || offsite.backup_folder !== path.basename(folder)
      || offsite.provider !== "cloudflare-r2" || offsite.remote_readback_matched !== true
      || offsite.remote_ciphertext_authenticated !== true || offsite.public_access_disabled !== true
      || offsite.custom_domains_absent !== true) throw new Error("Verify the private offsite copy before recording daily backup success.");
  }
  const context = await productionConnection(root, options);
  if (manifest.project !== context.ref) throw new Error("Recovery package belongs to another production project.");
  const client = createClient(context.env.VITE_SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const base = { backup_folder: path.basename(folder), backup_sha256: manifest.sha256, backup_type: manifest.backup_type,
    full_access: true, table_count: manifest.table_count, storage_file_count: manifest.storage_file_count, created_at: manifest.created_at,
    ...(offsite ? { offsite_verified: true, offsite_provider: "cloudflare-r2", offsite_checked_at: offsite.checked_at } : {}) };
  const operations = [
    { event_type: "backup_supabase_completed", severity: "info", message: "Fresh encrypted business, schema, Auth and media backup completed.", metadata: { ...base, schema_included: true, auth_included: true, live_sessions_included: false } },
    { event_type: "backup_package_verified", severity: "info", message: "Encrypted package authentication, archive table counts and media hashes verified.", metadata: { ...base, total_rows: verified.total_rows, encrypted_integrity_verified: true, database_archive_parsed: true } },
    // Daily copies do not invent a fresh recovery drill or password/MFA acceptance.
    ...(!backupOnly ? [
    // Keep older deployed health-check versions requiring attention until original password acceptance is complete.
    { event_type: "backup_restore_dry_run_completed", severity: complete ? "info" : "warn", message: complete ? "Package dry-run and isolated recovery acceptance completed." : "Package dry-run passed; original administrator password acceptance remains pending.", metadata: { ...base, package_dry_run_verified: true, recovery_acceptance_complete: complete } },
    { event_type: "backup_restore_verified", severity: complete ? "info" : "warn", message: complete ? "Isolated schema, data, account, media, password, MFA and permission recovery accepted." : "Isolated schema, data, account, media, MFA and permissions verified; original administrator password login remains pending.", metadata: { ...base, ...Object.fromEntries(scopes.map((key) => [key, receipt[key] === true])), target: receipt.target, login_method: receipt.login_method || "not_verified", recovered_account_auth_session_verified: receipt.recovered_account_auth_session_verified === true, checked_at: receipt.checked_at } },
    ] : []),
  ];
  const saved = [];
  for (const operation of operations) {
    const fingerprint = sha256(Buffer.from(JSON.stringify({ severity: operation.severity, metadata: operation.metadata })));
    const existing = await client.from("system_event_logs").select("severity,metadata").eq("source", "ops").eq("event_type", operation.event_type)
      .eq("metadata->>backup_folder", base.backup_folder).order("created_at", { ascending: false }).limit(1);
    if (existing.error) throw new Error("Operational record lookup failed.");
    if (existing.data?.[0]?.metadata?.receipt_fingerprint === fingerprint) { saved.push({ event_type: operation.event_type, severity: operation.severity, already_recorded: true }); continue; }
    const result = await client.from("system_event_logs").insert({ ...operation, source: "ops", actor_id: null, metadata: { ...operation.metadata, receipt_fingerprint: fingerprint } }).select("id,event_type,severity,metadata").single();
    if (result.error || result.data?.metadata?.receipt_fingerprint !== fingerprint) throw new Error("Operational record save/readback failed.");
    saved.push({ event_type: result.data.event_type, severity: result.data.severity, saved_and_read_back: true });
  }
  const output = { recorded_at: new Date().toISOString(), backup_folder: base.backup_folder, backup_only: backupOnly, acceptance_complete: backupOnly ? null : complete, production_changes: "system_event_logs summary records only; no business data, Auth, schema or settings changes", records: saved };
  const outputPath = backupOnly ? path.join(folder, "operational-records.json") : path.join(root, "audits/environment-recovery-20261003/operational-records.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(output));
}
try { await record(); }
catch (error) { console.error(`[record-recovery-status] ${error.message}`); process.exitCode = 1; }
