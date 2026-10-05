import assert from "node:assert/strict";
import test from "node:test";
import { verifyAdminMutationContracts } from "./lib/admin-foundation-contracts.mjs";

const facade = "src/lib/adminMutation.ts";
const core = "src/backend/modules/system/service/adminMutationService.ts";
const entry = "src/backend/modules/system/index.ts";
// Small static modules exercise dependency/call/export relationships. They do
// not copy implementation assertions or execute database/browser code.
const fixture = () => new Map([
  [facade, `
    import { persistAdminRecord as saveCore, persistAdminRecordRemoval as removeCore,
      requestPublicContentInvalidation as deliver, AdminMutationError } from "@/backend/modules/system";
    import { invalidateAdminResource as refresh } from "@/lib/adminInvalidate";
    import { registerPublicSyncIssue as register, resolvePublicSyncIssue as resolve } from "@/lib/publicSyncRecovery";
    export { AdminMutationError };
    async function completeMutationDelivery() { await refresh(); await deliver(); register(); resolve(); }
    export async function saveAdminRecord() { const record = await saveCore(); await completeMutationDelivery(); return record; }
    export async function archiveOrDeleteAdminRecord() { const record = await removeCore(); await completeMutationDelivery(); return record; }
  `],
  [core, `
    export class AdminMutationError extends Error {}
    export async function persistAdminRecord() { return {}; }
    export async function persistAdminRecordRemoval() { return {}; }
  `],
  [entry, `
    export { AdminMutationError, persistAdminRecord, persistAdminRecordRemoval,
      type AdminMutationResult, type PersistAdminRecordOptions, type PersistAdminRecordRemovalOptions } from "./service/adminMutationService";
    export { requestPublicContentInvalidation } from "./repository/adminMutationRepository";
    export type { AdminMutationDbRecord } from "./repository/adminMutationRepository";
  `],
]);
const change = (sources, file, oldText, newText) => {
  assert.ok(sources.get(file).includes(oldText), `Fixture replacement missing: ${oldText}`);
  sources.set(file, sources.get(file).replace(oldText, newText));
  return sources;
};

test("accepts separate browser facade, pure core and public re-exports with renamed imports", () => {
  assert.deepEqual(verifyAdminMutationContracts(fixture()), []);
});

test("accepts an equivalent relative import of the public module entry", () => {
  const sources = change(fixture(), facade, '"@/backend/modules/system"', '"../backend/modules/system/index.ts"');
  assert.deepEqual(verifyAdminMutationContracts(sources), []);
});

test("rejects bypassing the public entry for persistence calls", () => {
  const sources = change(fixture(), facade, '"@/backend/modules/system"', '"@/backend/modules/system/service/adminMutationService"');
  assert.ok(verifyAdminMutationContracts(sources).some((failure) => failure.includes("saveAdminRecord must call persistAdminRecord through the system public entry")));
});

test("requires legacy functions to be actual exported async interfaces, not comments", () => {
  const sources = change(fixture(), facade, "export async function saveAdminRecord()", "/* export async function saveAdminRecord */ async function internalSave()");
  assert.ok(verifyAdminMutationContracts(sources).some((failure) => failure.includes("must export async function saveAdminRecord")));
});

test("rejects a deletion wrapper which skips cache and public delivery", () => {
  const sources = change(fixture(), facade,
    "const record = await removeCore(); await completeMutationDelivery(); return record;",
    "const record = await removeCore(); return record; /* completeMutationDelivery() */");
  assert.ok(verifyAdminMutationContracts(sources).some((failure) => failure.includes("archiveOrDeleteAdminRecord must execute cache/public delivery")));
});

test("does not count a cache-call comment or string as actual orchestration", () => {
  const sources = change(fixture(), facade, "await refresh();", '/* refresh() */ const text = "refresh()";');
  assert.ok(verifyAdminMutationContracts(sources).some((failure) => failure.includes("delivery must call imported invalidateAdminResource")));
});

test("rejects persistence imported as a type even if a same-named call is written", () => {
  const sources = change(fixture(), facade, "persistAdminRecord as saveCore", "type persistAdminRecord as saveCore");
  assert.ok(verifyAdminMutationContracts(sources).some((failure) => failure.includes("saveAdminRecord must call persistAdminRecord")));
});

test("requires the public index to export persistence from the actual core", () => {
  const sources = change(fixture(), entry, '"./service/adminMutationService"', '"./repository/adminMutationRepository"');
  assert.ok(verifyAdminMutationContracts(sources).some((failure) => failure.includes("must publicly re-export persistAdminRecord from the persistence core")));
});

test("requires core persistence interfaces and declared public option types", () => {
  const sources = change(fixture(), core, "export async function persistAdminRecordRemoval()", "async function persistAdminRecordRemoval()");
  change(sources, entry, "type PersistAdminRecordRemovalOptions", "type OtherOptions");
  const failures = verifyAdminMutationContracts(sources);
  assert.ok(failures.some((failure) => failure.includes("must export async function persistAdminRecordRemoval")));
  assert.ok(failures.some((failure) => failure.includes("must publicly re-export type PersistAdminRecordRemovalOptions")));
});

test("rejects query-state and relative frontend adapter imports in the core", () => {
  const sources = fixture();
  sources.set(core, `import type { QueryClient as Client } from "@tanstack/react-query";
    import { saveAdminRecord } from "../../../../lib/adminMutation";\n${sources.get(core)}`);
  const failures = verifyAdminMutationContracts(sources);
  assert.ok(failures.some((failure) => failure.includes("violates frontend-dependency")));
  assert.ok(failures.some((failure) => failure.includes("violates frontend-adapter")));
});

test("rejects a locally declared QueryClient and direct SDK access in the core", () => {
  const sources = fixture();
  sources.set(core, `import { requireSupabase as database } from "@/lib/supabase";
    type QueryClient = unknown; const client = database(); client.from("services");\n${sources.get(core)}`);
  const failures = verifyAdminMutationContracts(sources);
  assert.ok(failures.some((failure) => failure.includes("must not own QueryClient")));
  assert.ok(failures.some((failure) => failure.includes("violates direct-database")));
});

test("reports missing or malformed contract source instead of passing", () => {
  const sources = fixture(); sources.delete(entry);
  sources.set(core, "export async function persistAdminRecord( {");
  const failures = verifyAdminMutationContracts(sources);
  assert.ok(failures.some((failure) => failure.includes(`${entry} is missing`)));
  assert.ok(failures.some((failure) => failure.includes("cannot be parsed as TypeScript")));
});
