import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { ownedPackage, BACKUP_BUCKET } from "../backup-offsite-r2.mjs";

export const RETENTION_DAYS = 7;
const DAY = 86400000;
const DATED_FOLDER = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/;
const CONTENTS = {
  "rest-json": new Set(["manifest.json", "tables", "site-images"]),
  "sql-dump": new Set(["manifest.json", "public-schema.sql", "public-data.sql"]),
  "encrypted-postgres-storage": new Set(["manifest.json", "recovery.fcbackup", "offsite-readback.json", "operational-records.json"]),
};

function snapshot(folder) {
  const entries = []; let bytes = 0;
  function visit(current) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) throw new Error("Unsupported backup entry.");
    entries.push([path.relative(folder, current), stat.dev, stat.ino, stat.size, stat.mtimeMs]);
    if (stat.isDirectory()) for (const name of fs.readdirSync(current).sort()) visit(path.join(current, name));
    else bytes += stat.size;
  }
  visit(folder);
  return { bytes, fingerprint: createHash("sha256").update(JSON.stringify(entries)).digest("hex") };
}

function inspect(base, name, project, cutoff) {
  if (!DATED_FOLDER.test(name)) return null;
  const folder = path.join(base, name);
  try {
    if (!fs.lstatSync(folder).isDirectory() || fs.lstatSync(folder).isSymbolicLink()) return null;
    const manifestPath = path.join(folder, "manifest.json");
    if (!fs.lstatSync(manifestPath).isFile() || fs.lstatSync(manifestPath).isSymbolicLink()) return null;
    const bytes = fs.readFileSync(manifestPath);
    const manifest = JSON.parse(bytes.toString("utf8"));
    const created = Date.parse(manifest.created_at);
    const named = Date.parse(name.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, "T$1:$2:$3.$4Z"));
    const allowed = CONTENTS[manifest.backup_type];
    if (manifest.project !== project || !allowed || !Number.isFinite(created) || !Number.isFinite(named)
      || created < named || created - named >= DAY || created > cutoff
      || fs.readdirSync(folder).some(entry => !allowed.has(entry))) return null;
    if (manifest.backup_type === "encrypted-postgres-storage" && (manifest.version !== 1
      || manifest.archive_file !== "recovery.fcbackup" || !/^[a-f0-9]{64}$/.test(manifest.sha256))) return null;
    return { folder: name, created_at: manifest.created_at, backup_type: manifest.backup_type,
      manifest_sha256: createHash("sha256").update(bytes).digest("hex"), ...snapshot(folder) };
  } catch { return null; }
}

export function planExpiredBackups(root, project, now = new Date()) {
  if (!/^[a-z0-9-]+$/.test(project || "") || !Number.isFinite(now.getTime())) throw new Error("Invalid retention context.");
  const base = path.join(fs.realpathSync(root), "backups");
  if (fs.lstatSync(base).isSymbolicLink() || fs.realpathSync(base) !== base) throw new Error("Backup base must belong to the project.");
  const cutoff = now.getTime() - RETENTION_DAYS * DAY;
  return { retention_days: RETENTION_DAYS, cutoff: new Date(cutoff).toISOString(),
    targets: fs.readdirSync(base).sort().flatMap(name => {
      const target = inspect(base, name, project, cutoff);
      return target ? [target] : [];
    }) };
}

// Called only after today's package, remote readback and operational records succeed.
export function purgeExpiredBackups(root, { project, folder, offsite, now = new Date() }) {
  const selected = ownedPackage(folder, root);
  const created = Date.parse(selected.manifest.created_at);
  const checked = Date.parse(offsite?.checked_at);
  if (path.dirname(selected.folder) !== fs.realpathSync(path.join(root, "backups"))
    || selected.manifest.project !== project || !Number.isFinite(created) || created > now.getTime()
    || now.getTime() - created >= DAY || !Number.isFinite(checked)
    || checked > now.getTime() || now.getTime() - checked > 15 * 60000
    || offsite.bucket !== BACKUP_BUCKET || offsite.backup_folder !== path.basename(selected.folder)
    || offsite.backup_sha256 !== selected.manifest.sha256 || offsite.remote_readback_matched !== true
    || offsite.remote_ciphertext_authenticated !== true || offsite.public_access_disabled !== true
    || offsite.custom_domains_absent !== true) throw new Error("Fresh verified offsite backup is required before local cleanup.");
  const plan = planExpiredBackups(root, project, now);
  const base = path.join(fs.realpathSync(root), "backups");
  const result = { ...plan, checked_at: now.toISOString(), protected_backup: path.basename(selected.folder),
    deleted_backup_folders: [], reclaimed_bytes: 0, complete: false };
  const save = () => fs.writeFileSync(path.join(base, "retention-cleanup-result.json"), JSON.stringify(result, null, 2) + "\n", { mode: 0o600 });
  save();
  for (const target of plan.targets) {
    const current = inspect(base, target.folder, project, Date.parse(plan.cutoff));
    if (!current || current.manifest_sha256 !== target.manifest_sha256 || current.fingerprint !== target.fingerprint
      || target.folder === result.protected_backup) throw new Error("Backup cleanup target changed; stop and inspect it.");
    fs.rmSync(path.join(base, target.folder), { recursive: true });
    result.deleted_backup_folders.push(target.folder);
    result.reclaimed_bytes += target.bytes;
    save();
  }
  result.complete = true; save();
  return result;
}
