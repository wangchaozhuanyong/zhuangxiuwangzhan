import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findArchitectureBoundaryIssues, findDirectDatabaseCalls } from "./lib/architecture-boundaries.mjs";

const file = (module, layer, name = "example") => `src/backend/modules/${module}/${layer}/${name}.ts`;
const check = (entries, debt = []) => findArchitectureBoundaryIssues(new Map(entries), debt);

describe("architecture execution boundaries", () => {
  it("rejects an aliased cross-domain internal import while permitting its public entry", () => {
    const quote = file("quotes", "service"); const followup = file("followups", "service");
    const result = check([[quote, 'import { follow as begin } from "@/backend/modules/followups/service/example";'], [followup, "export const follow = () => 1;"]]);
    assert.deepEqual(result.errors.map((issue) => issue.rule), ["cross-module-private"]);
    assert.deepEqual(check([[quote, 'import { follow } from "@/backend/modules/followups";'], ["src/backend/modules/followups/index.ts", 'export { follow } from "./service/example";'], [followup, "export const follow = () => 1;"]]).errors, []);
  });

  it("rejects upward relative imports and re-exports", () => {
    const repo = file("projects", "repository"); const service = file("projects", "service");
    const result = check([[repo, 'export { save } from "../service/example";'], [service, "export const save = () => 1;"]]);
    assert.ok(result.errors.some((issue) => issue.rule === "repository-upward"));
  });

  it("does not mistake another module's internal index for its public entry", () => {
    const result = check([[file("quotes", "service"), 'import { follow } from "@/backend/modules/followups/service/index";'], ["src/backend/modules/followups/service/index.ts", "export const follow = () => 1;"]]);
    assert.ok(result.errors.some((issue) => issue.rule === "cross-module-private"));
  });

  it("checks literal dynamic imports and type-only query-state dependencies", () => {
    const service = file("projects", "service");
    const result = check([[service, 'import type { QueryClient } from "@tanstack/react-query"; const read = () => import("@/components/Example");']]);
    assert.equal(result.errors.filter((issue) => issue.rule === "frontend-dependency").length, 2);
  });

  it("does not let a legacy exception cover a new file or import direction", () => {
    const service = file("projects", "service"); const repo = file("projects", "repository");
    const exception = { rule: "frontend-adapter", source: service, specifier: "@/lib/adminMutation" };
    const result = check([[service, 'import { save } from "@/lib/adminMutation";'], [repo, 'import { save } from "@/lib/adminMutation";']], [exception]);
    assert.equal(result.legacy.length, 1);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].source, repo);
  });

  it("rejects the same frontend adapter reached through a relative path", () => {
    const service = file("projects", "service");
    const result = check([[service, 'export { save } from "../../../../lib/adminMutation";'], ["src/lib/adminMutation.ts", "export const save = () => 1;"]]);
    assert.equal(result.errors.filter((issue) => issue.rule === "frontend-adapter").length, 1);
  });

  it("recognizes renamed clients and factories without matching comments or strings", () => {
    const source = 'import { supabase as db, requireSupabase as client } from "@/lib/supabase";\n// db.from("fake")\nconst comment = "client()";\nconst database = client();\ndatabase.from("projects");\ndb.rpc("operation");';
    assert.deepEqual(findDirectDatabaseCalls("example.ts", source), [4, 5, 6]);
  });

  it("recognizes a renamed database client reached through a relative import", () => {
    assert.deepEqual(findDirectDatabaseCalls(file("projects", "service"), 'import { supabase as db } from "../../../../lib/supabase";\ndb.from("projects");'), [2]);
  });

  it("finds runtime re-export cycles but permits type-only dependencies", () => {
    const service = file("projects", "service"); const repo = file("projects", "repository");
    assert.deepEqual(check([[service, 'export * from "../repository/example";'], [repo, 'export * from "../service/example";']]).errors.some((issue) => issue.rule === "runtime-cycle"), true);
    assert.deepEqual(check([[service, 'import type { Row } from "../repository/example";'], [repo, "export type Row = {}; "]]).errors, []);
  });

  it("does not count named type re-exports as runtime cycle edges", () => {
    const one = file("projects", "service", "one"); const two = file("projects", "service", "two");
    const result = check([[one, 'export { type Two } from "./two"; export type One = {};'], [two, 'export { type One } from "./one"; export type Two = {};']]);
    assert.deepEqual(result.errors, []);
  });
});
