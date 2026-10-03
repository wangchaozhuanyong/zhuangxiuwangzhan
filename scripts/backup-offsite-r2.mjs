import fs from "node:fs";
import path from "node:path";
import { readRecoveryEnv } from "./lib/backup-env.mjs";
import { decryptBackup, sha256 } from "./lib/private-backup.mjs";
import { wranglerR2Request } from "./lib/wrangler-r2-transfer.mjs";

export const BACKUP_BUCKET = "flashcast-recovery-backups";
const LIMIT = 100 * 1024 * 1024;

export function ownedPackage(folder, root) {
  const base = fs.realpathSync(path.join(root, "backups"));
  const selected = fs.realpathSync(folder);
  if (!selected.startsWith(`${base}${path.sep}`)) throw new Error("Select a project-owned backup folder.");
  const manifestPath = fs.realpathSync(path.join(selected, "manifest.json"));
  if (path.dirname(manifestPath) !== selected) throw new Error("Backup manifest escapes its folder.");
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (manifest.backup_type !== "encrypted-postgres-storage" || manifest.version !== 1
    || manifest.archive_file !== "recovery.fcbackup" || !/^[a-f0-9]{64}$/.test(manifest.sha256)) {
    throw new Error("Only the complete encrypted recovery package can be uploaded.");
  }
  const archivePath = fs.realpathSync(path.join(selected, manifest.archive_file));
  if (path.dirname(archivePath) !== selected) throw new Error("Backup archive escapes its folder.");
  const archive = fs.readFileSync(archivePath);
  if (archive.length > LIMIT) throw new Error("Backup exceeds the 100 MiB upload safety limit.");
  if (sha256(archive) !== manifest.sha256) throw new Error("Backup checksum mismatch; nothing uploaded.");
  return { folder: selected, manifest, manifestBytes, archive };
}

export function r2Context(root, request = fetch, { authentication = "api-token", cloud = false } = {}) {
  const env = readRecoveryEnv(root, { cloud });
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/supabase-content-publish-r3.yml"), "utf8");
  const refs = [...new Set([...workflow.matchAll(/--project-ref\s+([a-z0-9]{20})\b/g)].map((m) => m[1]))];
  if (refs.length !== 1 || env.APP_ENV !== "production"
    || new URL(env.VITE_SUPABASE_URL).hostname !== `${refs[0]}.supabase.co`
    || !/^[a-f0-9]{32}$/.test(env.CLOUDFLARE_ACCOUNT_ID || "")
    || !["api-token", "wrangler"].includes(authentication)
    || (authentication === "api-token" && !env.CLOUDFLARE_API_TOKEN) || !env.SUPABASE_DB_PASSWORD) {
    throw new Error("Private production configuration does not match this project.");
  }
  return { env, project: refs[0], authentication,
    request: authentication === "wrangler" ? wranglerR2Request(root, env.CLOUDFLARE_ACCOUNT_ID) : request,
    base: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets` };
}

async function api(context, suffix = "", options = {}) {
  try {
    return await context.request(`${context.base}${suffix}`, { ...options,
      headers: { Authorization: `Bearer ${context.env.CLOUDFLARE_API_TOKEN}`, ...options.headers },
      signal: AbortSignal.timeout(120000) });
  } catch { throw new Error("R2 request failed; private request details withheld."); }
}

async function jsonResult(response, operation) {
  let body;
  try { body = await response.json(); } catch { throw new Error(`${operation} returned an invalid response.`); }
  if (!response.ok || body.success !== true) throw new Error(`${operation} rejected (${response.status}); check the private Cloudflare token and R2 access.`);
  return body.result;
}

export async function checkPrivateBucket(context, { createBucket = false } = {}) {
  const suffix = `/${BACKUP_BUCKET}`;
  let response = await api(context, suffix);
  if (response.status === 404 && createBucket) {
    await jsonResult(await api(context, "", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: BACKUP_BUCKET, storageClass: "Standard" }) }), "Create private backup bucket");
    response = await api(context, suffix);
  }
  const bucket = await jsonResult(response, "Read backup bucket");
  if (bucket.name !== BACKUP_BUCKET) throw new Error("R2 returned another bucket.");
  const managed = await jsonResult(await api(context, `${suffix}/domains/managed`), "Check bucket public access");
  const custom = await jsonResult(await api(context, `${suffix}/domains/custom`), "Check bucket custom domains");
  if (managed.enabled !== false || !Array.isArray(custom.domains) || custom.domains.length !== 0) {
    throw new Error("Backup bucket must have public access disabled and no custom domains.");
  }
  return { public_access_disabled: true, custom_domains_absent: true };
}

export async function checkSevenDayRetention(context) {
  const lifecycle = await jsonResult(await api(context, `/${BACKUP_BUCKET}/lifecycle`), "Check backup expiration");
  const locks = await jsonResult(await api(context, `/${BACKUP_BUCKET}/lock`), "Check backup retention locks");
  const expiration = lifecycle.rules?.filter(rule => rule.enabled && rule.deleteObjectsTransition);
  if (!Array.isArray(expiration) || expiration.length !== 1 || expiration[0].conditions?.prefix !== ""
    || expiration[0].deleteObjectsTransition.condition?.type !== "Age"
    || expiration[0].deleteObjectsTransition.condition?.maxAge !== 7 * 86400
    || !Array.isArray(locks.rules) || locks.rules.length !== 0) {
    throw new Error("Backup bucket must expire all objects after exactly seven days, with no retention locks.");
  }
  return { retention_days: 7, r2_lifecycle_verified: true };
}

async function immutableCopy(context, key, bytes, contentType) {
  const suffix = `/${BACKUP_BUCKET}/objects/${key.split("/").map(encodeURIComponent).join("/")}`;
  const before = await api(context, suffix);
  let alreadyPresent = false;
  if (before.ok) {
    const existing = Buffer.from(await before.arrayBuffer());
    if (sha256(existing) !== sha256(bytes)) throw new Error("An existing offsite object differs; it will not be overwritten.");
    alreadyPresent = true;
  } else if (before.status === 404) {
    await jsonResult(await api(context, suffix, { method: "PUT", headers: { "Content-Type": contentType, "If-None-Match": "*" }, body: bytes }), "Upload encrypted backup object");
  } else { throw new Error(`Offsite object lookup rejected (${before.status}).`); }
  const response = await api(context, suffix);
  if (!response.ok) throw new Error(`Offsite object readback rejected (${response.status}).`);
  const downloaded = Buffer.from(await response.arrayBuffer());
  if (sha256(downloaded) !== sha256(bytes)) throw new Error("Offsite object readback checksum mismatch.");
  return { downloaded, alreadyPresent };
}

export async function uploadEncryptedBackup(folder, root = process.cwd(), options = {}) {
  const context = options.context || r2Context(root, fetch, options);
  const selected = ownedPackage(folder, root);
  if (selected.manifest.project !== context.project) throw new Error("Backup belongs to another production project.");
  decryptBackup(selected.archive, context.env.SUPABASE_DB_PASSWORD);
  const privacy = await checkPrivateBucket(context, options);
  const prefix = path.basename(selected.folder);
  const uploaded = await immutableCopy(context, `${prefix}/recovery.fcbackup`, selected.archive, "application/octet-stream");
  decryptBackup(uploaded.downloaded, context.env.SUPABASE_DB_PASSWORD);
  await immutableCopy(context, `${prefix}/manifest.json`, selected.manifestBytes, "application/json");
  const receipt = { checked_at: new Date().toISOString(), provider: "cloudflare-r2", bucket: BACKUP_BUCKET,
    backup_folder: prefix, backup_sha256: selected.manifest.sha256, encrypted_bytes: selected.archive.length,
    remote_readback_matched: true, remote_ciphertext_authenticated: true, ...privacy,
    authentication: context.authentication || "api-token",
    already_present: uploaded.alreadyPresent, old_backups_deleted: false };
  fs.writeFileSync(path.join(selected.folder, "offsite-readback.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
  return receipt;
}

if (path.resolve(process.argv[1] || "") === path.resolve(import.meta.filename)) {
  try {
    const argument = process.argv.slice(2).find((value) => !value.startsWith("--"));
    if (!argument) throw new Error("Provide a project backup folder.");
    console.log(JSON.stringify(await uploadEncryptedBackup(path.resolve(argument), process.cwd(), {
      createBucket: process.argv.includes("--create-bucket"),
      authentication: process.argv.includes("--auth=wrangler") ? "wrangler" : "api-token",
    })));
  } catch (error) { console.error(`[backup-offsite-r2] ${error.message}`); process.exitCode = 1; }
}
