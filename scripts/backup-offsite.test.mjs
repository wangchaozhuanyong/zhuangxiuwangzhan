import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { encryptBackup, sha256 } from "./lib/private-backup.mjs";
import { BACKUP_BUCKET, ownedPackage, uploadEncryptedBackup } from "./backup-offsite-r2.mjs";
import { localDay, todaysPackage, runDailyBackup } from "./backup-supabase-daily.mjs";
import { wranglerR2Request } from "./lib/wrangler-r2-transfer.mjs";

function fixture() {
  const base = path.resolve(".release/offsite-backup-fixtures");
  fs.mkdirSync(base, { recursive: true });
  const root = fs.mkdtempSync(path.join(base, "case-"));
  const folder = path.join(root, "backups", "2026-10-03T06-10-04-244Z");
  fs.mkdirSync(folder, { recursive: true });
  const archive = encryptBackup(Buffer.from('{"synthetic":true}'), "fixture-only-password");
  const manifest = { version: 1, backup_type: "encrypted-postgres-storage", archive_file: "recovery.fcbackup",
    sha256: sha256(archive), project: "synthetic-project", created_at: "2026-10-03T06:10:04.244Z" };
  fs.writeFileSync(path.join(folder, "recovery.fcbackup"), archive);
  fs.writeFileSync(path.join(folder, "manifest.json"), JSON.stringify(manifest));
  return { root, folder, archive, manifest, clean: () => fs.rmSync(root, { recursive: true, force: true }) };
}

function remote({ publicAccess = false, domains = [], mismatch = false, corruptReadback = false, existing = false } = {}) {
  const objects = new Map();
  const requests = [];
  const request = async (url, options) => {
    const target = new URL(url).pathname;
    requests.push({ target, method: options.method || "GET" });
    const json = (result, status = 200) => Response.json({ success: status === 200, result }, { status });
    if (target.endsWith("/domains/managed")) return json({ enabled: publicAccess });
    if (target.endsWith("/domains/custom")) return json({ domains });
    if (target.endsWith(`/${BACKUP_BUCKET}`)) return json({ name: BACKUP_BUCKET });
    const key = target.split("/objects/")[1];
    assert.ok(key, "Only the project backup API is called");
    if (options.method === "PUT") {
      assert.equal(options.headers["If-None-Match"], "*");
      objects.set(key, Buffer.from(options.body));
      return json({ key });
    }
    if (mismatch && key.endsWith("recovery.fcbackup")) return new Response("another package");
    if (existing && !objects.has(key)) return new Response("missing", { status: 404 });
    if (!objects.has(key)) return new Response("missing", { status: 404 });
    return new Response(corruptReadback && key.endsWith("recovery.fcbackup") ? "corrupt" : objects.get(key));
  };
  return { objects, requests, context: { request, project: "synthetic-project", base: "https://api.cloudflare.com/client/v4/accounts/synthetic/r2/buckets",
    env: { CLOUDFLARE_API_TOKEN: "fixture-only-token", SUPABASE_DB_PASSWORD: "fixture-only-password" } } };
}

test("encrypted offsite copy is downloaded, authenticated and private before success is recorded", async () => {
  const f = fixture(); const r = remote();
  try {
    const result = await uploadEncryptedBackup(f.folder, f.root, { context: r.context });
    assert.equal(result.remote_readback_matched, true);
    assert.equal(result.remote_ciphertext_authenticated, true);
    assert.equal(result.public_access_disabled, true);
    assert.equal(result.old_backups_deleted, false);
    assert.equal(r.objects.size, 2);
    assert.ok(r.objects.get(`${path.basename(f.folder)}/recovery.fcbackup`).equals(f.archive));
    assert.ok(fs.existsSync(path.join(f.folder, "offsite-readback.json")));
  } finally { f.clean(); }
});

for (const options of [{ publicAccess: true }, { domains: [{ domain: "public.example.test" }] }]) {
  test(`a public backup bucket is rejected before upload: ${JSON.stringify(options)}`, async () => {
    const f = fixture(); const r = remote(options);
    try { await assert.rejects(uploadEncryptedBackup(f.folder, f.root, { context: r.context }), /public access disabled/);
      assert.equal(r.requests.some(x => x.method === "PUT"), false); }
    finally { f.clean(); }
  });
}

test("a package from another project never reaches the remote API", async () => {
  const f = fixture(); const r = remote(); r.context.project = "other-project";
  try { await assert.rejects(uploadEncryptedBackup(f.folder, f.root, { context: r.context }), /another production project/);
    assert.equal(r.requests.length, 0); } finally { f.clean(); }
});

test("tampered local ciphertext is rejected before upload", async () => {
  const f = fixture(); const r = remote(); fs.appendFileSync(path.join(f.folder, "recovery.fcbackup"), "tamper");
  try { await assert.rejects(uploadEncryptedBackup(f.folder, f.root, { context: r.context }), /checksum mismatch/);
    assert.equal(r.requests.length, 0); } finally { f.clean(); }
});

test("an existing different object is preserved", async () => {
  const f = fixture(); const r = remote({ mismatch: true });
  try { await assert.rejects(uploadEncryptedBackup(f.folder, f.root, { context: r.context }), /will not be overwritten/);
    assert.equal(r.requests.some(x => x.method === "PUT"), false); } finally { f.clean(); }
});

test("a repeated copy verifies the existing objects without reuploading them", async () => {
  const f = fixture(); const r = remote();
  try { await uploadEncryptedBackup(f.folder, f.root, { context: r.context });
    r.requests.length = 0;
    const second = await uploadEncryptedBackup(f.folder, f.root, { context: r.context });
    assert.equal(second.already_present, true);
    assert.equal(r.requests.some(x => x.method === "PUT"), false); } finally { f.clean(); }
});

test("corrupt remote readback cannot produce a successful receipt", async () => {
  const f = fixture(); const r = remote({ corruptReadback: true });
  try { await assert.rejects(uploadEncryptedBackup(f.folder, f.root, { context: r.context }), /checksum mismatch/);
    assert.equal(fs.existsSync(path.join(f.folder, "offsite-readback.json")), false); } finally { f.clean(); }
});

test("archive symlinks outside the selected backup are rejected", () => {
  const f = fixture();
  try { const archivePath = path.join(f.folder, "recovery.fcbackup");
    fs.unlinkSync(archivePath); fs.writeFileSync(path.join(f.root, "outside"), f.archive);
    fs.symlinkSync(path.join(f.root, "outside"), archivePath);
    assert.throws(() => ownedPackage(f.folder, f.root), /escapes/); } finally { f.clean(); }
});

test("network errors cannot disclose credential-bearing request details", async () => {
  const f = fixture(); const r = remote();
  r.context.request = async () => { throw new Error("fixture-only-token"); };
  try { await assert.rejects(uploadEncryptedBackup(f.folder, f.root, { context: r.context }), e =>
    e.message.includes("private request details withheld") && !e.message.includes("fixture-only-token")); } finally { f.clean(); }
});

test("daily backup reuse uses the Malaysia day boundary and ignores older packages", () => {
  assert.equal(localDay(new Date("2026-10-02T16:00:00.000Z")), "2026-10-03");
  const f = fixture();
  try { assert.equal(todaysPackage(f.root, "2026-10-03"), f.folder);
    assert.equal(todaysPackage(f.root, "2026-10-04"), null); } finally { f.clean(); }
});

test("an active or interrupted backup lock prevents another run before any operation", async () => {
  const f = fixture(); fs.writeFileSync(path.join(f.root, "backups/.daily-backup.lock"), "synthetic");
  try { await assert.rejects(runDailyBackup(f.root), /interrupted lock/); } finally { f.clean(); }
});

function officialCli(f, { publicAccess = false, domains = false, denied = false, existing } = {}) {
  const objects = new Map(existing || []); const commands = [];
  const account = "0".repeat(32);
  const request = wranglerR2Request(f.root, account, { execute: (_node, args, options) => {
    assert.equal(options.env.CLOUDFLARE_ACCOUNT_ID, account);
    assert.equal(options.env.CLOUDFLARE_API_TOKEN, undefined);
    assert.equal(options.stdio[0], "ignore");
    const command = args.slice(1); commands.push(command);
    if (denied) return { status: 1, stderr: "private fixture-only-token authentication failure" };
    const ok = stdout => ({ status: 0, stdout });
    if (command[1] === "bucket") {
      assert.ok(command.includes(BACKUP_BUCKET));
      if (command[2] === "info") return ok(JSON.stringify({ name: BACKUP_BUCKET }));
      if (command[2] === "dev-url") return ok(publicAccess ? "Public access is enabled." : "Public access via the r2.dev URL is disabled.");
      return ok(domains ? "Domain: public.example.test" : "There are no custom domains connected to this bucket.");
    }
    const key = command[3].slice(BACKUP_BUCKET.length + 1);
    const file = command[command.indexOf("--file") + 1];
    if (command[2] === "get") {
      if (!objects.has(key)) return { status: 1, stderr: "The specified key does not exist. [code: 10007]" };
      fs.writeFileSync(file, objects.get(key)); return ok("Download complete.");
    }
    assert.equal(command[2], "put"); objects.set(key, fs.readFileSync(file)); return ok("Upload complete.");
  } });
  return { objects, commands, context: { request, project: "synthetic-project", authentication: "wrangler",
    base: `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets`,
    env: { SUPABASE_DB_PASSWORD: "fixture-only-password" } } };
}

test("official CLI authentication uploads exact manifest bytes and verifies both objects without reading credentials", async () => {
  const f = fixture(); const r = officialCli(f);
  const manifestPath = path.join(f.folder, "manifest.json");
  fs.appendFileSync(manifestPath, "\n");
  try {
    const result = await uploadEncryptedBackup(f.folder, f.root, { context: r.context });
    assert.equal(result.authentication, "wrangler");
    assert.equal(result.remote_ciphertext_authenticated, true);
    assert.ok(r.objects.get(`${path.basename(f.folder)}/manifest.json`).equals(fs.readFileSync(manifestPath)));
    r.commands.length = 0;
    await uploadEncryptedBackup(f.folder, f.root, { context: r.context });
    assert.equal(r.commands.some(x => x[2] === "put"), false);
  } finally { f.clean(); }
});

for (const setting of [{ publicAccess: true }, { domains: true }, { denied: true }]) {
  test(`official CLI fails closed before object transfer: ${JSON.stringify(setting)}`, async () => {
    const f = fixture(); const r = officialCli(f, setting);
    try {
      await assert.rejects(uploadEncryptedBackup(f.folder, f.root, { context: r.context }), e => !e.message.includes("fixture-only-token"));
      assert.equal(r.commands.some(x => x[1] === "object"), false);
      assert.equal(fs.existsSync(path.join(f.folder, "offsite-readback.json")), false);
    } finally { f.clean(); }
  });
}

test("official CLI refuses foreign buckets, unexpected paths and destructive commands", async () => {
  const f = fixture(); const r = officialCli(f);
  try {
    for (const [url, method] of [[r.context.base + "/another-bucket", "GET"],
      [r.context.base + `/${BACKUP_BUCKET}/objects/../secret`, "GET"],
      [r.context.base + `/${BACKUP_BUCKET}/domains/managed`, "PUT"],
      [r.context.base + `/${BACKUP_BUCKET}`, "DELETE"]]) {
      await assert.rejects(r.context.request(url, { method }));
    }
    assert.equal(r.commands.length, 0);
  } finally { f.clean(); }
});

test("official CLI preserves a conflicting existing encrypted object", async () => {
  const f = fixture(); const key = `${path.basename(f.folder)}/recovery.fcbackup`;
  const r = officialCli(f, { existing: [[key, Buffer.from("another package")]] });
  try {
    await assert.rejects(uploadEncryptedBackup(f.folder, f.root, { context: r.context }), /will not be overwritten/);
    assert.equal(r.commands.some(x => x[2] === "put"), false);
  } finally { f.clean(); }
});

test("an escaped manifest is rejected before credentials or remote access", () => {
  const f = fixture(); const target = path.join(f.folder, "manifest.json");
  try {
    fs.renameSync(target, path.join(f.root, "outside-manifest.json"));
    fs.symlinkSync(path.join(f.root, "outside-manifest.json"), target);
    assert.throws(() => ownedPackage(f.folder, f.root), /manifest escapes/);
  } finally { f.clean(); }
});
