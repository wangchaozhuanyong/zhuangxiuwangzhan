import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { scopedR2Request } from "./lib/r2-scoped-transfer.mjs";

const env = { CLOUDFLARE_ACCOUNT_ID: "a7e061557092f924beb4a7c8adc39c3d", R2_CONFIG_READ_TOKEN: "fixture-read-only",
  R2_BACKUP_ACCESS_KEY_ID: "fixture-id", R2_BACKUP_SECRET_ACCESS_KEY: "fixture-secret" };
const base = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/flashcast-recovery-backups`;
const key = "2026-10-03T06-10-04-244Z/recovery.fcbackup";

test("configuration checks use only a dedicated read-only token and refuse redirects", async () => {
  const calls = [];
  const request = scopedR2Request("/nonexistent-fixture-root", env, { request: async (url, options) => {
    calls.push({ url, options }); return Response.json({ success: true });
  }, execute: () => assert.fail("Configuration must not invoke the object client.") });
  for (const suffix of ["", "/domains/managed", "/domains/custom", "/lifecycle", "/lock"]) await request(base + suffix);
  assert.equal(calls.length, 5);
  for (const call of calls) {
    assert.equal(call.options.method, "GET"); assert.equal(call.options.redirect, "error");
    assert.deepEqual(call.options.headers, { Authorization: "Bearer fixture-read-only" });
  }
});

test("foreign accounts, other buckets, configuration writes, deletion and unexpected keys are refused", async () => {
  const request = scopedR2Request("/nonexistent-fixture-root", env, { request: () => assert.fail("No remote call expected."),
    execute: () => assert.fail("No CLI call expected.") });
  for (const [url, options] of [[base.replace(env.CLOUDFLARE_ACCOUNT_ID, "0".repeat(32)), {}],
    [base.replace("flashcast-recovery-backups", "other-bucket"), {}], [base + "-suffix", {}],
    [base + "/lifecycle", { method: "PUT" }], [base + "/objects/" + key, { method: "DELETE" }],
    [base + "/objects/credentials.txt", {}], [base + "/objects/" + key + "?export=1", {}],
    [base + "/objects/" + key, { method: "PUT", body: "fixture" }]]) await assert.rejects(request(url, options));
});

test("official S3 object transfers preserve existing keys, keep credentials out of argv and remove temporary bytes", async t => {
  const fixtures = path.resolve(".release/cloud-backup-fixtures"); fs.mkdirSync(fixtures, { recursive: true });
  const root = fs.mkdtempSync(path.join(fixtures, "s3-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  let mode = "read"; const expected = Buffer.from("synthetic encrypted package");
  const request = scopedR2Request(root, env, { execute: (file, args, options) => {
    assert.equal(file, "aws"); assert.equal(args.includes(env.R2_BACKUP_SECRET_ACCESS_KEY), false);
    assert.equal(options.env.AWS_ACCESS_KEY_ID, env.R2_BACKUP_ACCESS_KEY_ID);
    assert.equal(options.env.AWS_SECRET_ACCESS_KEY, env.R2_BACKUP_SECRET_ACCESS_KEY);
    assert.equal(options.env.AWS_CONFIG_FILE, "/dev/null"); assert.equal(options.env.AWS_SESSION_TOKEN, undefined);
    assert.equal(args[args.indexOf("--bucket") + 1], "flashcast-recovery-backups");
    assert.equal(args[args.indexOf("--key") + 1], key);
    assert.equal(args[args.indexOf("--endpoint-url") + 1], `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    if (mode === "missing") return { status: 1, stderr: "An error occurred (NoSuchKey)" };
    if (mode === "denied") return { status: 1, stderr: "An error occurred (AccessDenied) fixture-secret" };
    if (mode === "write") {
      assert.equal(args[1], "put-object"); assert.equal(args[args.indexOf("--if-none-match") + 1], "*");
      assert.deepEqual(fs.readFileSync(args[args.indexOf("--body") + 1]), expected);
    } else fs.writeFileSync(args.at(-1), expected);
    return { status: 0, stdout: "{}" };
  } });
  assert.deepEqual(Buffer.from(await (await request(base + "/objects/" + key)).arrayBuffer()), expected);
  mode = "write";
  assert.equal((await (await request(base + "/objects/" + key, { method: "PUT", body: expected,
    headers: { "If-None-Match": "*", "Content-Type": "application/octet-stream" } })).json()).success, true);
  mode = "missing"; assert.equal((await request(base + "/objects/" + key)).status, 404);
  mode = "denied"; await assert.rejects(request(base + "/objects/" + key), error => {
    assert.equal(error.message.includes("fixture-secret"), false); return true;
  });
  assert.deepEqual(fs.readdirSync(path.join(root, ".release/r2-s3-transfer-readback")), []);
});
