import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, "backups", timestamp);
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.error("[backup-supabase] Missing SUPABASE_ACCESS_TOKEN. Run this with a Supabase access token in the environment.");
  process.exit(1);
}

fs.mkdirSync(backupRoot, { recursive: true });

const run = (args, label) => {
  console.log(`[backup-supabase] ${label}`);
  const result = spawnSync(npxBin, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
};

const schemaFile = path.join(backupRoot, "public-schema.sql");
const dataFile = path.join(backupRoot, "public-data.sql");
const storageDir = path.join(backupRoot, "site-images");

run(["supabase", "db", "dump", "--linked", "--schema", "public", "--file", schemaFile], "dump public schema");
run(["supabase", "db", "dump", "--linked", "--schema", "public", "--data-only", "--use-copy", "--file", dataFile], "dump public data");

try {
  fs.mkdirSync(storageDir, { recursive: true });
  run(["supabase", "storage", "cp", "--linked", "--recursive", "ss:///site-images", storageDir], "download site-images storage");
} catch (error) {
  console.warn(`[backup-supabase] Storage backup warning: ${error instanceof Error ? error.message : String(error)}`);
}

const fileSize = (file) => (fs.existsSync(file) ? fs.statSync(file).size : 0);
const countFiles = (dir) => {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else count += 1;
  }
  return count;
};

const manifest = {
  created_at: new Date().toISOString(),
  project: "rbsnyexjifounogswrjp",
  schema_file: path.basename(schemaFile),
  data_file: path.basename(dataFile),
  schema_bytes: fileSize(schemaFile),
  data_bytes: fileSize(dataFile),
  storage_bucket: "site-images",
  storage_file_count: countFiles(storageDir),
  restore_note: "Restore schema first, then data, then upload files under site-images. Test on staging before production.",
};

fs.writeFileSync(path.join(backupRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`[backup-supabase] Backup written to ${backupRoot}`);
