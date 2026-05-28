import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

const stripWeird = (value) =>
  String(value ?? "")
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

loadDotEnv();

const SUPABASE_URL = stripWeird(process.env.VITE_SUPABASE_URL);
const SERVICE_ROLE_KEY = stripWeird(process.env.SUPABASE_SERVICE_ROLE_KEY);
const ANON_KEY = stripWeird(process.env.VITE_SUPABASE_ANON_KEY);

if (!SUPABASE_URL) throw new Error("Missing env: VITE_SUPABASE_URL");
const supabaseKey = SERVICE_ROLE_KEY || ANON_KEY;
if (!supabaseKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY (preferred) or VITE_SUPABASE_ANON_KEY");

const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const targets = [
  { table: "project_images", columns: ["image_url"] },
  { table: "projects", columns: [] }, // no direct url columns, kept for clarity
  { table: "blog_posts", columns: ["cover_image_url"] },
  { table: "materials", columns: ["image_url"] },
  { table: "hero_slides", columns: ["image_url"] },
  { table: "landing_pages", columns: ["hero_image_url"] },
  { table: "site_settings", columns: ["logo_url", "favicon_url", "og_image_url"] },
  { table: "home_sections", columns: ["image_url"] },
  { table: "before_after_items", columns: ["before_image_url", "after_image_url"] },
  { table: "brand_partners", columns: ["logo_url"] },
];

function normalizeUrl(raw) {
  if (!raw) return "";
  const value = String(raw).trim();
  if (!value) return "";
  // allow relative urls ("/images/..")
  if (value.startsWith("/")) return value;
  try {
    const u = new URL(value);
    u.hash = "";
    return u.toString();
  } catch {
    return value;
  }
}

function getOriginOrType(url) {
  if (!url) return "";
  if (url.startsWith("/")) return "(relative)";
  try {
    return new URL(url).origin;
  } catch {
    return "(invalid)";
  }
}

function isSupabaseStoragePublic(url) {
  return url.includes("/storage/v1/object/public/") || url.includes(".supabase.co/storage/v1/object/public/");
}

async function selectAll(table, columns) {
  if (!columns.length) return [];
  const colList = columns.join(",");
  const rows = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(table).select(colList).range(from, to);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += data.length;
  }
  return rows;
}

async function main() {
  const originCounts = new Map();
  const sampleByOrigin = new Map();
  let totalUrls = 0;
  let supabasePublicCount = 0;
  let relativeCount = 0;
  let emptyCount = 0;

  for (const t of targets) {
    if (!t.columns.length) continue;
    const rows = await selectAll(t.table, t.columns);
    for (const row of rows) {
      for (const col of t.columns) {
        const raw = row[col];
        if (raw == null || String(raw).trim() === "") {
          emptyCount += 1;
          continue;
        }
        const url = normalizeUrl(raw);
        totalUrls += 1;
        if (url.startsWith("/")) relativeCount += 1;
        if (isSupabaseStoragePublic(url)) supabasePublicCount += 1;
        const origin = getOriginOrType(url);
        originCounts.set(origin, (originCounts.get(origin) || 0) + 1);
        const key = `${t.table}.${col}`;
        if (!sampleByOrigin.has(origin)) sampleByOrigin.set(origin, new Set());
        const set = sampleByOrigin.get(origin);
        if (set.size < 5) set.add(`${key} => ${String(raw).slice(0, 140)}`);
      }
    }
  }

  const sorted = Array.from(originCounts.entries()).sort((a, b) => b[1] - a[1]);

  // eslint-disable-next-line no-console
  console.log(`Total non-empty image urls: ${totalUrls}`);
  // eslint-disable-next-line no-console
  console.log(`Empty/null fields encountered: ${emptyCount}`);
  // eslint-disable-next-line no-console
  console.log(`Relative urls (start with "/"): ${relativeCount}`);
  // eslint-disable-next-line no-console
  console.log(`Supabase public storage urls: ${supabasePublicCount}`);
  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log("Origins by count:");
  for (const [origin, count] of sorted) {
    // eslint-disable-next-line no-console
    console.log(`- ${origin}: ${count}`);
    const samples = sampleByOrigin.get(origin);
    if (samples) {
      for (const s of samples) {
        // eslint-disable-next-line no-console
        console.log(`    ${s}`);
      }
    }
  }
}

await main();

