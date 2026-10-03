import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { planExpiredBackups, purgeExpiredBackups } from "./lib/backup-retention.mjs";
import { encryptBackup, sha256 } from "./lib/private-backup.mjs";
import { BACKUP_BUCKET, checkSevenDayRetention } from "./backup-offsite-r2.mjs";
import { wranglerR2Request } from "./lib/wrangler-r2-transfer.mjs";

const NOW = new Date("2026-10-03T08:00:00.000Z");
const PROJECT = "synthetic-project";

function fixture() {
  const base = path.resolve(".release/backup-retention-fixtures");
  fs.mkdirSync(base, { recursive: true });
  const root = fs.mkdtempSync(path.join(base, "case-"));
  fs.mkdirSync(path.join(root, "backups"));
  const add = (created, extra = {}) => {
    const name = created.replace(/[:.]/g, "-");
    const folder = path.join(root, "backups", name);
    fs.mkdirSync(folder);
    fs.writeFileSync(path.join(folder, "manifest.json"), JSON.stringify({
      project: PROJECT, created_at: created, backup_type: "rest-json", ...extra }));
    return folder;
  };
  const folder = add("2026-10-03T06:10:04.244Z", { version: 1, backup_type: "encrypted-postgres-storage", archive_file: "recovery.fcbackup" });
  const archive = encryptBackup(Buffer.from("synthetic recovery"), "fixture-only-password");
  fs.writeFileSync(path.join(folder, "recovery.fcbackup"), archive);
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, "manifest.json")));
  manifest.sha256 = sha256(archive);
  fs.writeFileSync(path.join(folder, "manifest.json"), JSON.stringify(manifest));
  const offsite = { checked_at: NOW.toISOString(), bucket: BACKUP_BUCKET, backup_folder: path.basename(folder),
    backup_sha256: manifest.sha256, remote_readback_matched: true, remote_ciphertext_authenticated: true,
    public_access_disabled: true, custom_domains_absent: true };
  return { root, folder, offsite, add, clean: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test("seven days is a rolling 168-hour boundary, without a thirty-day tier", () => {
  const f = fixture();
  try {
    const expired = f.add("2026-09-26T07:59:59.999Z");
    const boundary = f.add("2026-09-26T08:00:00.000Z");
    f.add("2026-09-26T08:00:00.001Z");
    const monthOld = f.add("2026-09-01T08:00:00.000Z");
    const plan = planExpiredBackups(f.root, PROJECT, NOW);
    assert.equal(plan.retention_days, 7);
    assert.deepEqual(plan.targets.map(x => x.folder).sort(), [expired, boundary, monthOld].map(folder => path.basename(folder)).sort());
    assert.equal(fs.existsSync(monthOld), true, "Planning is read-only");
  } finally { f.clean(); }
});

test("actual cleanup removes only expired owned snapshots and records its exact targets", () => {
  const f = fixture();
  try {
    const expired = f.add("2026-09-06T08:38:08.736Z");
    fs.mkdirSync(path.join(expired, "tables"));
    fs.writeFileSync(path.join(expired, "tables/synthetic.json"), "[]");
    const recent = f.add("2026-10-01T08:00:00.000Z");
    const foreign = f.add("2026-08-22T04:24:24.210Z", { project: "another-project" });
    const unrelated = path.join(f.root, "backups/environment-recovery-20261003");
    fs.mkdirSync(unrelated);
    fs.writeFileSync(path.join(unrelated, "preserved"), "restore lab");
    const result = purgeExpiredBackups(f.root, { project: PROJECT, folder: f.folder, offsite: f.offsite, now: NOW });
    assert.deepEqual(result.deleted_backup_folders, [path.basename(expired)]);
    assert.equal(result.complete, true);
    assert.ok(result.reclaimed_bytes > 0);
    assert.equal(fs.existsSync(expired), false);
    for (const folder of [recent, foreign, unrelated, f.folder]) assert.equal(fs.existsSync(folder), true);
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.root, "backups/retention-cleanup-result.json"))).complete, true);
  } finally { f.clean(); }
});

test("unrecognized types, extra source files, invalid dates and symlinks are preserved", () => {
  const f = fixture();
  try {
    const unknown = f.add("2026-08-22T04:24:24.210Z", { backup_type: "workspace-copy" });
    const extra = f.add("2026-08-23T04:24:24.210Z");
    fs.writeFileSync(path.join(extra, "source.ts"), "preserve");
    f.add("2026-08-24T04:24:24.210Z", { created_at: "invalid" });
    const linked = f.add("2026-08-25T04:24:24.210Z");
    fs.symlinkSync(unknown, path.join(linked, "tables"));
    fs.symlinkSync(extra, path.join(f.root, "backups/2026-08-26T04-24-24-210Z"));
    assert.deepEqual(planExpiredBackups(f.root, PROJECT, NOW).targets, []);
  } finally { f.clean(); }
});

for (const changes of [{ remote_readback_matched: false }, { remote_ciphertext_authenticated: false },
  { public_access_disabled: false }, { custom_domains_absent: false }, { bucket: "foreign-bucket" },
  { backup_sha256: "0".repeat(64) }, { checked_at: "2026-10-02T08:00:00Z" }]) {
  test(`unsuccessful or stale offsite verification prevents deletion: ${JSON.stringify(changes)}`, () => {
    const f = fixture();
    try {
      const expired = f.add("2026-09-06T08:38:08.736Z");
      assert.throws(() => purgeExpiredBackups(f.root, { project: PROJECT, folder: f.folder,
        offsite: { ...f.offsite, ...changes }, now: NOW }), /Fresh verified/);
      assert.equal(fs.existsSync(expired), true);
    } finally { f.clean(); }
  });
}

test("a backup base symlink cannot redirect cleanup into another location", () => {
  const f = fixture();
  try {
    fs.renameSync(path.join(f.root, "backups"), path.join(f.root, "outside"));
    fs.symlinkSync(path.join(f.root, "outside"), path.join(f.root, "backups"));
    assert.throws(() => planExpiredBackups(f.root, PROJECT, NOW), /Backup base/);
  } finally { f.clean(); }
});

function policyContext({ days = 7, enabled = true, prefix = "", locks = [], extra = [] } = {}) {
  const rule = { id: "flashcast-backup-retention-7d", enabled, conditions: { prefix },
    deleteObjectsTransition: { condition: { type: "Age", maxAge: days * 86400 } } };
  return { base: "https://api.cloudflare.com/client/v4/accounts/synthetic/r2/buckets", env: {},
    request: async url => Response.json({ success: true,
      result: { rules: url.endsWith("/lifecycle") ? [rule, ...extra] : locks } }) };
}

test("daily policy verification accepts only all-object seven-day expiry with no locks", async () => {
  assert.equal((await checkSevenDayRetention(policyContext())).retention_days, 7);
  for (const options of [{ days: 30 }, { days: 6 }, { enabled: false }, { prefix: "partial/" }, { locks: [{ id: "hold" }] },
    { extra: [{ enabled: true, deleteObjectsTransition: { condition: { type: "Age", maxAge: 86400 } } }] }]) {
    await assert.rejects(checkSevenDayRetention(policyContext(options)), /exactly seven days/);
  }
});

test("Cloudflare's empty conditions object applies the seven-day rule to all objects", async () => {
  const context = policyContext(); const request = context.request;
  context.request = async url => {
    const response = await request(url);
    if (!url.endsWith("/lifecycle")) return response;
    const body = await response.json(); body.result.rules[0].conditions = {};
    body.result.rules.unshift({ id: "Default Multipart Abort Rule", enabled: true, conditions: {},
      abortMultipartUploadsTransition: { condition: { type: "Age", maxAge: 7 * 86400 } } });
    return Response.json(body);
  };
  assert.equal((await checkSevenDayRetention(context)).r2_lifecycle_verified, true);
});

test("missing or malformed lifecycle conditions cannot waive full-bucket coverage", async () => {
  for (const conditions of [undefined, null, [], { prefix: null }, { unexpected: true }]) {
    const context = policyContext(); const request = context.request;
    context.request = async url => {
      const response = await request(url);
      if (!url.endsWith("/lifecycle")) return response;
      const body = await response.json(); body.result.rules[0].conditions = conditions;
      return Response.json(body);
    };
    await assert.rejects(checkSevenDayRetention(context), /exactly seven days/);
  }
});

test("official CLI reads lifecycle and lock rules without granting mutation capability", async () => {
  const f = fixture(); const account = "0".repeat(32); const commands = [];
  try {
    const request = wranglerR2Request(f.root, account, { execute: (_node, args) => {
      const command = args.slice(1); commands.push(command);
      assert.deepEqual(command.slice(0, 2), ["r2", "bucket"]);
      assert.equal(command[3], "list");
      return { status: 0, stdout: command[2] === "lock" ? `There are no lock rules for bucket '${BACKUP_BUCKET}'.` :
        "name:     Default Multipart Abort Rule\nenabled:  Yes\nprefix:   (all prefixes)\naction:   Abort incomplete multipart uploads after 7 days\n\n" +
        "name:     flashcast-backup-retention-7d\nenabled:  Yes\nprefix:   (all prefixes)\naction:   Expire objects after 7 days\n" };
    } });
    const context = { request, base: `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets`, env: {} };
    assert.equal((await checkSevenDayRetention(context)).r2_lifecycle_verified, true);
    assert.equal(commands.length, 2);
    await assert.rejects(request(`${context.base}/${BACKUP_BUCKET}/lifecycle`, { method: "PUT" }));
    assert.equal(commands.length, 2);
  } finally { f.clean(); }
});
