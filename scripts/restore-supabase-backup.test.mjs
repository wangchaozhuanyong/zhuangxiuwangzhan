import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root = path.resolve(import.meta.dirname, "..");
const parent = path.join(root, ".release");
fs.mkdirSync(parent, { recursive: true });
function fixture() {
  const folder = fs.mkdtempSync(path.join(parent, "restore-guard-"));
  fs.mkdirSync(path.join(folder, "tables"));
  fs.writeFileSync(path.join(folder, "manifest.json"), JSON.stringify({ backup_type: "rest-json", project: "original-project",
    tables: [{ table: "leads", ok: true, rows: 0 }, { table: "lead_followups", ok: true, rows: 0 }],
    storage_bucket: "site-images", storage_file_count: 0 }));
  for (const table of ["lead_followups", "leads"]) fs.writeFileSync(path.join(folder, "tables", `${table}.json`), "[]");
  return folder;
}
function run(folder, args, withExplicitKey = false) {
  const env = { ...process.env, RESTORE_CONFIRM: "YES", DISABLE_SYSTEM_HEALTH_LOG: "1" };
  delete env.SUPABASE_SERVICE_ROLE_KEY;
  if (withExplicitKey) env.SUPABASE_SERVICE_ROLE_KEY = "invalid-test-only-key";
  return spawnSync(process.execPath, [path.join(root, "scripts/restore-supabase-backup.mjs"), folder, ...args],
    { cwd: folder, encoding: "utf8", env });
}
test("dry run follows the declared dependency order rather than file-name order", () => {
  const folder = fixture();
  try {
    const result = run(folder, ["--dry-run"]);
    assert.equal(result.status, 0);
    const report = JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
    assert.deepEqual(report.tables.map(item => item.table), ["leads", "lead_followups"]);
  } finally { fs.rmSync(folder, { recursive: true, force: true }); }
});
test("a backup supplied after the dry-run flag is actually checked", () => {
  const folder = fixture();
  try {
    const env = { ...process.env, DISABLE_SYSTEM_HEALTH_LOG: "1" };
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    const result = spawnSync(process.execPath, [path.join(root, "scripts/restore-supabase-backup.mjs"), "--dry-run", folder], { cwd: folder, env, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout.slice(result.stdout.indexOf("{"))).backupPath, folder);
  } finally { fs.rmSync(folder, { recursive: true, force: true }); }
});
test("writes refuse the original production project and a missing explicit target", () => {
  const folder = fixture();
  try {
    assert.equal(run(folder, ["--target-url=https://original-project.supabase.co"], true).status, 1);
    assert.equal(run(folder, [], true).status, 1);
  } finally { fs.rmSync(folder, { recursive: true, force: true }); }
});
test("a repository dotenv credential cannot implicitly authorize a restore", () => {
  const folder = fixture();
  fs.writeFileSync(path.join(folder, ".env"), "SUPABASE_SERVICE_ROLE_KEY=invalid-test-only-key\n");
  try { assert.equal(run(folder, ["--target-url=http://127.0.0.1:1"]).status, 1); }
  finally { fs.rmSync(folder, { recursive: true, force: true }); }
});
