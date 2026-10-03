import fs from "node:fs";
import path from "node:path";
import { loadProjectEnv } from "./lib/project-env.mjs";

try { loadProjectEnv(); } catch (error) {
  console.error(`[verify-env-separation] ${error.message}`);
  process.exit(1);
}

const mode = (process.env.APP_ENV ?? process.env.NODE_ENV ?? "").trim();
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const siteUrl = process.env.VITE_SITE_URL || "";

const isProd = mode === "production";
const failures = [];

if (!["development", "test", "staging", "preview", "production"].includes(mode)) {
  failures.push("Set APP_ENV or NODE_ENV to a supported environment explicitly.");
}

const parseUrl = (value, key) => {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
    return url;
  } catch {
    failures.push(`${key} must be a valid HTTP(S) URL without credentials.`);
    return null;
  }
};
const site = parseUrl(siteUrl, "VITE_SITE_URL");
const database = parseUrl(supabaseUrl, "VITE_SUPABASE_URL");
const productionSiteHosts = new Set(["flashcast.com.my", "www.flashcast.com.my"]);
const hostname = (url) => url.hostname.replace(/\.$/, "");
const isOriginOnly = (url) => url.pathname === "/" && !url.search && !url.hash;

// Reuse the production target already declared by the governed release workflow.
// Do not infer it from the environment being checked, which may already be wrong.
const workflowPath = path.join(process.cwd(), ".github/workflows/supabase-content-publish-r3.yml");
const productionProjectRefs = fs.existsSync(workflowPath)
  ? [...new Set([...fs.readFileSync(workflowPath, "utf8").matchAll(/--project-ref\s+([a-z0-9]+)/g)].map((match) => match[1]))]
  : [];
const productionDatabaseHost = productionProjectRefs.length === 1 && /^[a-z0-9]{20}$/.test(productionProjectRefs[0])
  ? `${productionProjectRefs[0]}.supabase.co` : null;
if (!productionDatabaseHost) failures.push("The production database target is missing or ambiguous in the release workflow.");

if (!isProd && site && productionSiteHosts.has(hostname(site))) {
  failures.push("Non-production APP_ENV is using the production site URL.");
}

if (isProd && site && (!productionSiteHosts.has(hostname(site)) || site.protocol !== "https:" || site.port || !isOriginOnly(site))) {
  failures.push("Production APP_ENV must use the HTTPS production site origin.");
}

if (database && productionDatabaseHost) {
  if (!isProd && hostname(database) === productionDatabaseHost) {
    failures.push("Non-production APP_ENV is using the production database.");
  }
  if (isProd && (hostname(database) !== productionDatabaseHost || database.protocol !== "https:" || database.port || !isOriginOnly(database))) {
    failures.push("Production APP_ENV must use the declared HTTPS production database origin.");
  }
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
