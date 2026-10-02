import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root = path.resolve(import.meta.dirname, "..");
const fixtures = path.join(root, ".release");
fs.mkdirSync(fixtures, { recursive: true });
function fixture({ missingStorage = false, incorrectRows = false } = {}) {
  const folder = fs.mkdtempSync(path.join(fixtures, "backup-verifier-"));
  fs.mkdirSync(path.join(folder, "tables"));
  const tables = ["cms_pages", "cms_sections", "cms_content_entries", "site_settings", "projects"];
  for (const table of tables) fs.writeFileSync(path.join(folder, "tables", `${table}.json`), "[]");
  fs.writeFileSync(path.join(folder, "manifest.json"), JSON.stringify({ backup_type: "rest-json", full_access: true,
    tables: tables.map(table => ({ table, ok: true, rows: incorrectRows && table === "projects" ? 1 : 0 })),
    storage_bucket: "site-images", storage_file_count: missingStorage ? 1 : 0 }));
  return folder;
}
function verify(folder) {
  return spawnSync(process.execPath, [path.join(root, "scripts/verify-backup-package.mjs"), folder],
    { cwd: root, encoding: "utf8", env: { ...process.env, DISABLE_SYSTEM_HEALTH_LOG: "1" } });
}
test("verifier rejects a missing declared media object or missing table rows", () => {
  for (const options of [{ missingStorage: true }, { incorrectRows: true }]) {
    const folder = fixture(options);
    try { assert.equal(verify(folder).status, 1); }
    finally { fs.rmSync(folder, { recursive: true, force: true }); }
  }
});
test("verifier accepts an internally consistent declared backup", () => {
  const folder = fixture();
  try { assert.equal(verify(folder).status, 0); }
  finally { fs.rmSync(folder, { recursive: true, force: true }); }
});
