import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptBackup, decryptBackup, assertArchivePath, assertLocalRestoreContainer } from "./lib/private-backup.mjs";
import { normalizeStructure } from "./lib/database-recovery.mjs";

test("private recovery archive authenticates saved bytes, wrong keys and corruption before restore", () => {
  const bytes = Buffer.from("synthetic database and media bytes");
  const encrypted = encryptBackup(bytes, "fixture-private-password");
  assert.deepEqual(decryptBackup(encrypted, "fixture-private-password"), bytes);
  assert.ok(!encrypted.includes(bytes));
  assert.throws(() => decryptBackup(encrypted, "another-password"), /authentication failed/);
  for (const offset of [0, 8, 24, 36, 52, encrypted.length - 1]) {
    const tampered = Buffer.from(encrypted); tampered[offset] ^= 1;
    assert.throws(() => decryptBackup(tampered, "fixture-private-password"));
  }
  assert.throws(() => decryptBackup(encrypted.subarray(0, 52), "fixture-private-password"));
});
test("restore target is restricted to the dedicated FLASH CAST rehearsal", () => {
  assert.doesNotThrow(() => assertLocalRestoreContainer("supabase_db_flashcast-full-restore-20261003"));
  for (const name of ["production", "supabase_db_flashcast-dev-20261003", "supabase_db_another-project", "supabase_db_flashcast-full-restore-20261003;bad"]) assert.throws(() => assertLocalRestoreContainer(name));
});
test("object paths cannot escape the package", () => {
  assert.equal(assertArchivePath("projects/example.webp"), "projects/example.webp");
  for (const value of ["../secret", "/secret", "nested/../secret", "nested\\secret", "./secret", "nested//secret"]) assert.throws(() => assertArchivePath(value));
});
test("schema comparison preserves visible order and types while normalizing dropped-column gaps", () => {
  const columns = [{ table_schema: "public", table_name: "fixture", column_name: "first", ordinal_position: 1, data_type: "text" }, { table_schema: "public", table_name: "fixture", column_name: "second", ordinal_position: 3, data_type: "integer" }];
  const dense = columns.map((column, index) => ({ ...column, ordinal_position: index + 1 }));
  assert.deepEqual(normalizeStructure({ columns }), normalizeStructure({ columns: dense }));
  assert.notDeepEqual(normalizeStructure({ columns }), normalizeStructure({ columns: [...dense].reverse() }));
  assert.notDeepEqual(normalizeStructure({ columns }), normalizeStructure({ columns: dense.map((column) => ({ ...column, data_type: "text" })) }));
});
