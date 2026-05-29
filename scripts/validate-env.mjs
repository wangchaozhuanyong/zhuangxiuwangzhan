/**
 * Fail production/CI builds when required VITE_* env vars are missing.
 */
import { existsSync, readFileSync } from "node:fs";

const loadEnvFile = () => {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!process.env[key]) process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
};

loadEnvFile();

const required = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SITE_URL",
  "VITE_SITE_EMAIL",
  "VITE_SITE_PHONE_DISPLAY",
  "VITE_SITE_PHONE_E164",
  "VITE_SITE_WHATSAPP_NUMBER",
  "VITE_SITE_SSM_NUMBER",
  "VITE_SITE_ADDRESS",
];

const isStrict =
  process.argv.includes("--strict") ||
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.NODE_ENV === "production";

if (!isStrict) {
  console.log("[validate-env] skipped (not production/CI). Use --strict to force.");
  process.exit(0);
}

const missing = required.filter((key) => !String(process.env[key] || "").trim());

if (missing.length) {
  console.error("[validate-env] Missing required environment variables:");
  for (const key of missing) console.error(`  - ${key}`);
  process.exit(1);
}

console.log("[validate-env] OK");
