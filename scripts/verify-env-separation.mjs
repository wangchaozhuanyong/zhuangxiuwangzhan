import fs from "node:fs";

if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=");
  }
}

const explicitMode = Boolean(process.env.APP_ENV || process.env.NODE_ENV);
const mode = process.env.APP_ENV || process.env.NODE_ENV || "development";
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const siteUrl = process.env.VITE_SITE_URL || "";

const isProd = mode === "production";
const failures = [];

if (!supabaseUrl) failures.push("VITE_SUPABASE_URL is missing");
if (!siteUrl) failures.push("VITE_SITE_URL is missing");

if (explicitMode && !isProd && /flashcast\\.com\\.my/i.test(siteUrl)) {
  failures.push("Non-production APP_ENV is using the production site URL.");
}

if (isProd && /localhost|127\\.0\\.0\\.1/i.test(siteUrl)) {
  failures.push("Production APP_ENV is using a local site URL.");
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_ANON_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY) {
  failures.push("Anon key and service role key must never be the same.");
}

if (failures.length) {
  console.error("[verify-env-separation] failures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`[verify-env-separation] OK (${mode})`);
