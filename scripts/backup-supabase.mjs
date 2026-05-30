import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, "backups", timestamp);
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";

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

loadDotEnv();
fs.mkdirSync(backupRoot, { recursive: true });

function runCliDump(args, label) {
  console.log(`[backup-supabase] ${label}`);
  const result = spawnSync(npxBin, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

async function backupViaRest() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const fullAccess = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !key) {
    throw new Error("Missing VITE_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.");
  }

  const supabase = createClient(supabaseUrl, key, { auth: { persistSession: false } });
  const tables = fullAccess
    ? [
        "site_settings",
        "cms_pages",
        "cms_sections",
        "cms_content_entries",
        "cms_revisions",
        "site_pages",
        "home_sections",
        "about_sections",
        "process_steps",
        "cta_blocks",
        "services",
        "projects",
        "project_images",
        "materials",
        "blog_posts",
        "faqs",
        "before_after_items",
        "brand_partners",
        "testimonials",
        "hero_slides",
        "service_areas",
        "landing_pages",
        "leads",
        "quote_requests",
        "lead_followups",
        "media_assets",
        "notification_settings",
        "maintenance_reminder_items",
        "admin_audit_logs",
        "system_event_logs",
        "admin_users",
      ]
    : [
        "site_settings",
        "cms_pages",
        "cms_sections",
        "cms_content_entries",
        "site_pages",
        "home_sections",
        "about_sections",
        "process_steps",
        "cta_blocks",
        "services",
        "projects",
        "project_images",
        "materials",
        "blog_posts",
        "faqs",
        "before_after_items",
        "brand_partners",
        "testimonials",
        "hero_slides",
        "service_areas",
        "landing_pages",
        "media_assets",
      ];

  const tablesDir = path.join(backupRoot, "tables");
  const filesDir = path.join(backupRoot, "site-images");
  fs.mkdirSync(tablesDir, { recursive: true });
  fs.mkdirSync(filesDir, { recursive: true });

  const tableResults = [];
  for (const table of tables) {
    let from = 0;
    const pageSize = 1000;
    const rows = [];
    for (;;) {
      const { data, error } = await supabase.from(table).select("*").range(from, from + pageSize - 1);
      if (error) {
        tableResults.push({ table, ok: false, message: error.message });
        break;
      }
      rows.push(...(data || []));
      if (!data || data.length < pageSize) break;
      from += pageSize;
    }
    if (tableResults.at(-1)?.table === table && tableResults.at(-1)?.ok === false) continue;
    fs.writeFileSync(path.join(tablesDir, `${table}.json`), JSON.stringify(rows, null, 2));
    tableResults.push({ table, ok: true, rows: rows.length });
  }

  const storagePaths = [];
  async function walkStorage(prefix = "") {
    const { data, error } = await supabase.storage.from("site-images").list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
    if (error) return;
    for (const entry of data || []) {
      const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) await walkStorage(objectPath);
      else storagePaths.push(objectPath);
    }
  }

  await walkStorage();
  let downloadedFiles = 0;
  for (const objectPath of storagePaths) {
    const { data, error } = await supabase.storage.from("site-images").download(objectPath);
    if (error || !data) continue;
    const out = path.join(filesDir, objectPath);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(await data.arrayBuffer()));
    downloadedFiles += 1;
  }

  return {
    backup_type: "rest-json",
    full_access: fullAccess,
    tables: tableResults,
    storage_bucket: "site-images",
    storage_file_count: downloadedFiles,
  };
}

const schemaFile = path.join(backupRoot, "public-schema.sql");
const dataFile = path.join(backupRoot, "public-data.sql");
let manifest;

if (process.env.SUPABASE_ACCESS_TOKEN && process.env.USE_SUPABASE_CLI_DUMP === "1") {
  const schemaOk = runCliDump(["supabase", "db", "dump", "--linked", "--schema", "public", "--file", schemaFile], "dump public schema");
  const dataOk = schemaOk && runCliDump(["supabase", "db", "dump", "--linked", "--schema", "public", "--data-only", "--use-copy", "--file", dataFile], "dump public data");
  if (schemaOk && dataOk) {
    manifest = {
      backup_type: "sql-dump",
      full_access: true,
      schema_file: path.basename(schemaFile),
      data_file: path.basename(dataFile),
      storage_bucket: "site-images",
      storage_file_count: 0,
    };
  }
}

if (!manifest) {
  console.warn("[backup-supabase] Using REST JSON backup. Set USE_SUPABASE_CLI_DUMP=1 on a machine with Docker to create SQL dumps.");
  manifest = await backupViaRest();
}

manifest.created_at = new Date().toISOString();
manifest.project = "rbsnyexjifounogswrjp";
manifest.restore_note = "Restore only to staging first. SQL dumps use psql. REST JSON backups can be replayed table by table with service role access.";

fs.writeFileSync(path.join(backupRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`[backup-supabase] Backup written to ${backupRoot}`);
