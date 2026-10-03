import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadProjectEnv, requestedEnvMode } from "./lib/project-env.mjs";

test("default developer mode excludes production files and explicit operations select production", (t) => {
  const fixtures = path.join(process.cwd(), ".release/environment-recovery-fixtures");
  fs.mkdirSync(fixtures, { recursive: true });
  const root = fs.mkdtempSync(path.join(fixtures, "env-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, ".env"), "APP_ENV=development\nVITE_SITE_URL=http://localhost:8080\n");
  fs.writeFileSync(path.join(root, ".env.development.local"), "VITE_SUPABASE_URL=http://127.0.0.1:56221\nKEY=local-fixture\n");
  fs.writeFileSync(path.join(root, ".env.production.local"), "APP_ENV=production\nVITE_SUPABASE_URL=https://production.fixture.invalid\nKEY=private-fixture\n");
  const dev = {};
  assert.equal(loadProjectEnv({ root, env: dev }).mode, "development");
  assert.equal(dev.KEY, "local-fixture");
  assert.ok(!dev.VITE_SUPABASE_URL.includes("production"));
  const prod = {};
  loadProjectEnv({ root, env: prod, mode: "production" });
  assert.equal(prod.APP_ENV, "production");
  assert.equal(prod.KEY, "private-fixture");
  const override = { KEY: "", VITE_SUPABASE_URL: "http://isolated.fixture.invalid" };
  loadProjectEnv({ root, env: override, mode: "production" });
  assert.equal(override.KEY, "");
  assert.equal(override.VITE_SUPABASE_URL, "http://isolated.fixture.invalid");
  assert.throws(() => loadProjectEnv({ root, env: {}, mode: "unknown" }));
});
test("mode arguments reject missing values instead of choosing a production default", () => {
  assert.equal(requestedEnvMode(["--mode", "production"]), "production");
  assert.equal(requestedEnvMode(["--mode=development"]), "development");
  assert.equal(requestedEnvMode(["--mode"]), "");
});

test("strict production prebuild selects production when CI has no mode and still rejects missing fields", (t) => {
  const fixtures = path.join(process.cwd(), ".release/environment-recovery-fixtures");
  fs.mkdirSync(fixtures, { recursive: true });
  const root = fs.mkdtempSync(path.join(fixtures, "build-env-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const env = { ...process.env, CI: "true" };
  delete env.APP_ENV;
  delete env.NODE_ENV;
  const keys = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_SITE_URL", "VITE_SITE_EMAIL", "VITE_SITE_PHONE_DISPLAY", "VITE_SITE_PHONE_E164", "VITE_SITE_WHATSAPP_NUMBER", "VITE_SITE_SSM_NUMBER", "VITE_SITE_ADDRESS"];
  for (const key of keys) delete env[key];
  fs.writeFileSync(path.join(root, ".env.production.local"), keys.map(key => `${key}=build-fixture`).join("\n"));
  const script = path.join(process.cwd(), "scripts/validate-env.mjs");
  const valid = spawnSync(process.execPath, [script, "--strict"], { cwd: root, env, encoding: "utf8" });
  assert.equal(valid.status, 0);
  assert.match(valid.stdout, /\[validate-env\] OK/);
  fs.writeFileSync(path.join(root, ".env.production.local"), "");
  const missing = spawnSync(process.execPath, [script, "--strict"], { cwd: root, env, encoding: "utf8" });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Missing required environment variables/);
  const invalid = spawnSync(process.execPath, [script, "--mode"], { cwd: root, env, encoding: "utf8" });
  assert.notEqual(invalid.status, 0);
});
