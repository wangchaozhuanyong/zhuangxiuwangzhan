import { test } from "node:test";
import assert from "node:assert/strict";
import { runHealthCheck } from "../supabase/functions/health-check/service.ts";

const checkedAt = "2026-10-03T00:00:00Z";
const now = Date.parse(checkedAt);
const eventTypes = ["backup_supabase_completed", "backup_package_verified", "backup_restore_verified"];
const events = () => eventTypes.map((eventType) => ({
  id: eventType, event_type: eventType, severity: "info", source: "ops", message: "Fixture operation completed",
  metadata: { full_access: true, backup_folder: "fixture-backup", data_verified: true, schema_verified: true, auth_verified: true, media_verified: true, original_admin_login_verified: true, original_admin_mfa_verified: true, permissions_verified: true }, created_at: new Date(now - 3_600_000).toISOString(),
}));
const request = () => new Request("https://fixture.invalid/health-check", {
  headers: { authorization: `Bearer fixture.${Buffer.from(JSON.stringify({ aal: "aal2" })).toString("base64url")}.fixture` },
});
function clientFor(records, readFailure = false) {
  const writes = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "fixture-admin" } }, error: null }) },
    storage: { getBucket: async () => ({ error: null }) },
    from: (table) => {
      const filters = {};
      const query = {
        select: (_columns, options) => options?.head ? Promise.resolve({ count: 2, error: null }) : query,
        eq: (key, value) => { filters[key] = value; return query; },
        in: () => query,
        order: () => query,
        maybeSingle: async () => ({ data: { role: "super_admin", active: true }, error: null }),
        limit: async () => filters.source === "ops"
          ? { data: records, error: readFailure ? { message: "Fixture read failure" } : null }
          : { data: [], error: null },
        insert: async (row) => { writes.push({ table, ...row }); return { error: null }; },
      };
      return query;
    },
  };
  return { client, writes };
}
async function check(records, readFailure = false) {
  const { client, writes } = clientFor(records, readFailure);
  return { result: await runHealthCheck(request(), client, checkedAt), writes };
}

test("fresh backup, package verification and complete isolated restore of the same backup pass", async (t) => {
  t.mock.method(Date, "now", () => now);
  for (const severity of ["info", "debug"]) {
    const records = events().map((event) => ({ ...event, severity }));
    const { result, writes } = await check(records);
    assert.equal(result.status, 200);
    assert.equal(result.body.backup_status.ok, true);
    assert.equal(result.body.ok, true);
    assert.equal(writes[0].severity, "info");
    assert.match(result.body.backup_status.message, /isolated/);
  }
});
test("a dry run alone or a restore of a different backup does not complete recovery acceptance", async (t) => {
  t.mock.method(Date, "now", () => now);
  const dryRun = events();
  dryRun[2].event_type = "backup_restore_dry_run_completed";
  assert.equal((await check(dryRun)).result.body.backup_status.ok, false);
  for (const index of [1, 2]) {
    const different = events();
    different[index].metadata.backup_folder = "another-backup";
    assert.equal((await check(different)).result.body.backup_status.ok, false);
  }
});
test("each missing schema, data, account, media, original login, MFA or permission acceptance needs attention", async (t) => {
  t.mock.method(Date, "now", () => now);
  for (const scope of ["data_verified", "schema_verified", "auth_verified", "media_verified", "original_admin_login_verified", "original_admin_mfa_verified", "permissions_verified"]) {
    const incomplete = events();
    delete incomplete[2].metadata[scope];
    assert.equal((await check(incomplete)).result.body.backup_status.ok, false);
  }
});
test("a recent warning, error or critical event cannot make the overall health pass", async (t) => {
  t.mock.method(Date, "now", () => now);
  for (let index = 0; index < eventTypes.length; index += 1) {
    for (const severity of ["warn", "error", "critical"]) {
      const records = events();
      records[index].severity = severity;
      const { result, writes } = await check(records);
      assert.equal(result.status, 503);
      assert.equal(result.body.backup_status.ok, false);
      assert.equal(result.body.ok, false);
      assert.equal(writes[0].severity, "warn");
    }
  }
});
test("an explicitly incomplete backup, verification or dry-run record cannot pass", async (t) => {
  t.mock.method(Date, "now", () => now);
  for (let index = 0; index < eventTypes.length; index += 1) {
    const records = events();
    records[index].metadata.full_access = false;
    const { result } = await check(records);
    assert.equal(result.body.backup_status.ok, false);
    assert.equal(result.body.ok, false);
  }
});
test("expired, missing or invalid timestamps keep the backup warning", async (t) => {
  t.mock.method(Date, "now", () => now);
  for (let index = 0; index < eventTypes.length; index += 1) {
    for (const createdAt of [new Date(now - 169 * 3_600_000).toISOString(), "invalid-time"]) {
      const records = events();
      records[index].created_at = createdAt;
      assert.equal((await check(records)).result.body.backup_status.ok, false);
    }
    const records = events();
    records.splice(index, 1);
    const { result } = await check(records);
    assert.equal(result.body.backup_status.ok, false);
    assert.ok(result.body.reminders.includes(result.body.backup_status.message));
  }
});
test("a backup-log read failure requires attention instead of reporting a clean system", async (t) => {
  t.mock.method(Date, "now", () => now);
  const { result } = await check(events(), true);
  assert.equal(result.status, 503);
  assert.equal(result.body.backup_status.ok, false);
  assert.equal(result.body.backup_status.latest_backup, null);
});
