import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const fixtureRoot = path.join(root, ".release");
fs.mkdirSync(fixtureRoot, { recursive: true });
const projectRef = "abcdefghijklmnopqrst";
const productionDatabase = `https://${projectRef}.supabase.co`;
const validProduction = { APP_ENV: "production", VITE_SITE_URL: "https://flashcast.com.my", VITE_SUPABASE_URL: productionDatabase };
const validDevelopment = { APP_ENV: "development", VITE_SITE_URL: "http://localhost:8080", VITE_SUPABASE_URL: "http://127.0.0.1:54321" };
function verify(values, { dotenv = "", refs = [projectRef] } = {}) {
  const folder = fs.mkdtempSync(path.join(fixtureRoot, "env-separation-"));
  try {
    if (refs !== null) {
      fs.mkdirSync(path.join(folder, ".github/workflows"), { recursive: true });
      fs.writeFileSync(path.join(folder, ".github/workflows/supabase-content-publish-r3.yml"), refs.map((ref) => `run: supabase link --project-ref ${ref}`).join("\n"));
    }
    fs.writeFileSync(path.join(folder, ".env"), dotenv);
    const env = { ...process.env };
    for (const key of ["APP_ENV", "NODE_ENV", "VITE_SITE_URL", "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) delete env[key];
    return spawnSync(process.execPath, [path.join(root, "scripts/verify-env-separation.mjs")], { cwd: folder, env: { ...env, ...values }, encoding: "utf8" });
  } finally { fs.rmSync(folder, { recursive: true, force: true }); }
}
const succeeds = (result) => assert.equal(result.status, 0, result.stderr);
const fails = (result) => assert.equal(result.status, 1, result.stdout);

test("accepts declared production and isolated development, test, staging and preview origins", () => {
  succeeds(verify(validProduction));
  succeeds(verify({ ...validProduction, VITE_SITE_URL: "https://www.flashcast.com.my:443/" }));
  for (const APP_ENV of ["development", "test", "staging", "preview"]) succeeds(verify({ ...validDevelopment, APP_ENV }));
  succeeds(verify({ NODE_ENV: "test", VITE_SITE_URL: validDevelopment.VITE_SITE_URL, VITE_SUPABASE_URL: validDevelopment.VITE_SUPABASE_URL }));
});
test("rejects production URLs in non-production configurations", () => {
  for (const APP_ENV of ["development", "test", "staging", "preview"]) {
    fails(verify({ ...validDevelopment, APP_ENV, VITE_SITE_URL: validProduction.VITE_SITE_URL }));
    fails(verify({ ...validDevelopment, APP_ENV, VITE_SUPABASE_URL: productionDatabase }));
    fails(verify({ ...validDevelopment, APP_ENV, VITE_SITE_URL: "https://flashcast.com.my." }));
    fails(verify({ ...validDevelopment, APP_ENV, VITE_SUPABASE_URL: `${productionDatabase}.` }));
  }
});
test("rejects local, numeric, IPv6, lookalike, insecure or nonstandard production site origins", () => {
  for (const VITE_SITE_URL of ["http://127.0.0.1", "http://localhost", "http://[::1]", "http://2130706433", "https://flashcast.com.my.evil.invalid", "https://evilflashcast.com.my", "http://flashcast.com.my", "https://flashcast.com.my:8080"]) {
    fails(verify({ ...validProduction, VITE_SITE_URL }));
  }
});
test("rejects production database misidentification, local targets and insecure protocols", () => {
  for (const VITE_SUPABASE_URL of ["http://localhost:54321", "http://[::1]:54321", "https://another-project.supabase.co", `${productionDatabase}.evil.invalid`, productionDatabase.replace("https:", "http:"), `${productionDatabase}:8080`]) {
    fails(verify({ ...validProduction, VITE_SUPABASE_URL }));
  }
});
test("fails closed for missing or unsupported mode and missing or ambiguous declared database identity", () => {
  for (const APP_ENV of ["", "prod", "invalid"]) fails(verify({ ...validDevelopment, APP_ENV }));
  const missingMode = { ...validDevelopment };
  delete missingMode.APP_ENV;
  fails(verify(missingMode));
  fails(verify({ ...validDevelopment, APP_ENV: "", NODE_ENV: "production" }));
  for (const refs of [null, [], [projectRef, "uvwxyzabcdefghijklmn"], ["invalid"]]) fails(verify(validProduction, { refs }));
});
test("rejects paths, query strings and fragments where a production origin is required", () => {
  for (const suffix of ["/unexpected-path", "?unexpected=value", "#unexpected"]) {
    fails(verify({ ...validProduction, VITE_SITE_URL: `${validProduction.VITE_SITE_URL}${suffix}` }));
    fails(verify({ ...validProduction, VITE_SUPABASE_URL: `${productionDatabase}${suffix}` }));
  }
});
test("rejects malformed and credential-bearing URLs without exposing their values", () => {
  for (const key of ["VITE_SITE_URL", "VITE_SUPABASE_URL"]) {
    for (const value of ["not-a-url", "file:///private/path", "https://fixture-user:fixture-private-marker@flashcast.com.my"]) {
      const result = verify({ ...validProduction, [key]: value });
      fails(result);
      assert.ok(!`${result.stdout}${result.stderr}`.includes("fixture-private-marker"));
    }
  }
});
test("reads quoted dotenv values while preserving explicit process values, including empty strings", () => {
  const dotenv = `APP_ENV='production'\nVITE_SITE_URL="https://flashcast.com.my"\nVITE_SUPABASE_URL='${productionDatabase}'\n`;
  succeeds(verify({}, { dotenv }));
  succeeds(verify(validDevelopment, { dotenv }));
  fails(verify({ APP_ENV: "", NODE_ENV: "", VITE_SITE_URL: "", VITE_SUPABASE_URL: "" }, { dotenv }));
});
test("rejects identical anonymous and privileged keys without exposing either key", () => {
  const result = verify({ ...validProduction, VITE_SUPABASE_ANON_KEY: "fixture-secret-marker", SUPABASE_SERVICE_ROLE_KEY: "fixture-secret-marker" });
  fails(result);
  assert.ok(!`${result.stdout}${result.stderr}`.includes("fixture-secret-marker"));
});
