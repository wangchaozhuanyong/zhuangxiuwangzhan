import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_CSP_POLICY } from "./site-csp.mjs";

const ROOT = process.cwd();

const read = (relativePath) => readFile(path.join(ROOT, relativePath), "utf8");

const listFiles = async (dir) => {
  const entries = await readdir(path.join(ROOT, dir), { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFiles(relativePath);
      return relativePath;
    }),
  );
  return files.flat();
};

const fail = (message) => {
  console.error(`[verify-edge-security] ${message}`);
  process.exitCode = 1;
};

const functionFiles = (await listFiles("supabase/functions")).filter((file) => file.endsWith(".ts"));
const functionSources = await Promise.all(functionFiles.map(async (file) => [file, await read(file)]));

for (const [file, source] of functionSources) {
  if (/Access-Control-Allow-Origin["']\s*:\s*["']\*/.test(source)) {
    fail(`${file} still allows wildcard CORS origin`);
  }
}

for (const functionName of [
  "submit-lead",
  "generate-english-content",
  "notify-lead",
  "geocode-address",
  "form-attempts-maintenance",
  "health-check",
  "maintenance-reminder",
  "notification-settings",
]) {
  const source = await read(`supabase/functions/${functionName}/index.ts`);
  if (!source.includes("corsHeadersFor") || !source.includes("handleCorsPreflight")) {
    fail(`${functionName} does not use the shared CORS helper`);
  }
}

const submitLeadIndex = await read("supabase/functions/submit-lead/index.ts");
if (!submitLeadIndex.includes("verifyTurnstileToken")) {
  fail("submit-lead does not verify Turnstile tokens");
}

const turnstileHelper = await read("supabase/functions/_shared/turnstile.ts");
if (!turnstileHelper.includes("TURNSTILE_SECRET_KEY")) {
  fail("Turnstile helper does not read TURNSTILE_SECRET_KEY");
}

const headers = await read("public/_headers");
if (!headers.includes(`Content-Security-Policy: ${SITE_CSP_POLICY}`)) {
  fail("public/_headers CSP is not synchronized with scripts/site-csp.mjs");
}

const cspDirective = (policy, name) =>
  policy
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith(`${name} `)) || "";

const scriptSrc = cspDirective(SITE_CSP_POLICY, "script-src");
if (scriptSrc.includes("'unsafe-inline'")) {
  fail("production script-src still allows unsafe-inline");
}

const pagesMiddleware = await read("functions/_middleware.ts");
if (!pagesMiddleware.includes("buildHtmlContentSecurityPolicy") || !pagesMiddleware.includes("getInlineScriptHashes")) {
  fail("Cloudflare Pages middleware does not build dynamic CSP hashes for inline HTML scripts");
}

const clientJsonLd = await read("src/components/JsonLd.tsx");
if (!clientJsonLd.includes("import.meta.env.DEV")) {
  fail("client JsonLd scripts are not disabled in production");
}

if (!process.exitCode) {
  console.log("[verify-edge-security] OK");
}
