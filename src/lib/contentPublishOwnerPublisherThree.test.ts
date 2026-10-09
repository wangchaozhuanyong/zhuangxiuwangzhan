import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { OWNER_PUBLISHER_THREE_TARGETS } from "../../supabase/functions/content-publish/owner-publisher-three-targets.ts";
import { NATIVE_BODY_TARGETS } from "../../supabase/functions/content-publish/native-body-targets.ts";
import { MANAGED_TARGETS, findManagedTarget } from "../../supabase/functions/content-publish/managed-targets.ts";
import { lockedOwnerPublisherThreeCandidates, readOwnerPublisherThreeCandidate } from "../../scripts/managed-cms-targets-owner-publisher-three-v1.mjs";
import { targetConfigs, buildLockedDryRunRequest, stableDigest, assertLockedPublishGate } from "../../scripts/publish-content-trust-fixes.mjs";

const names = ["v17", "v18", "v20"].map((item) => `${item}-owner-publisher-native-preparation-v2-20261007`);
const workflow = readFileSync(".github/workflows/content-publish-approved.yml", "utf8");
const firstGate = workflow.split("        run: |\n")[1].split("\n      - name:")[0]
  .split("\n").map((line) => line.replace(/^ {10}/, "")).join("\n");
const gate = (name: string, mode: string, operation = "publish", permit = "") => spawnSync("bash", ["-c", firstGate], {
  encoding: "utf8",
  env: { PATH: process.env.PATH, GITHUB_REF: "refs/heads/main", PUBLISH_TARGET: name, PUBLISH_MODE: mode,
    MANAGED_OPERATION: operation, MANAGED_PERMIT_ID: permit, PARENT_RUN_ID: "12345" },
});

describe("three exact owner-publisher successor bindings", () => {
  it("adds only three candidates while retaining all historical body targets", () => {
    expect(Object.keys(lockedOwnerPublisherThreeCandidates)).toEqual(names);
    expect(OWNER_PUBLISHER_THREE_TARGETS).toHaveLength(3);
    expect(NATIVE_BODY_TARGETS).toHaveLength(18);
    expect(MANAGED_TARGETS).toHaveLength(68);
    expect(MANAGED_TARGETS.filter((target) => !target.rollbackFieldsSha256)).toHaveLength(45);
  });

  it.each(names)("%s binds the exact tuple, projection, CAS and six original field values", (name) => {
    const locked = lockedOwnerPublisherThreeCandidates[name];
    const target = findManagedTarget(MANAGED_TARGETS, locked.recordId, locked.slug, { ...locked, operation: "publish" });
    expect(target).toBeDefined();
    expect(target).toMatchObject({ id: locked.recordId, slug: locked.slug, taskId: locked.taskId,
      candidateVersion: name, actionId: locked.actionId, scope: locked.scope, table: locked.table,
      changedFields: locked.changedFields, baselineProjectionFields: locked.baselineProjectionFields,
      expectedUpdatedAt: locked.expectedUpdatedAt, baselineFieldsSha256: locked.baselineFieldsSha256,
      desiredFieldsSha256: stableDigest(locked.desiredFields), rollbackFieldsSha256: locked.rollbackFieldsSha256,
      retainedProjectionFields: locked.retainedProjectionFields, retainedFieldsSha256: locked.retainedFieldsSha256,
      rollbackAllowed: false, requiresParentRun: true });
    expect(locked.taskId).toBe("fc-20260928-keyword-page-answer-implementation-v1");
    expect(locked.changedFields).toHaveLength(2);
    expect(Object.keys(locked.desiredFields).sort()).toEqual([...locked.changedFields].sort());
    expect(locked.baselineProjectionFields).toContain("version");
    expect(locked.retainedProjectionFields).toEqual(locked.baselineProjectionFields
      .filter((field: string) => ![...locked.changedFields, "version", "updated_at"].includes(field)));
    expect(targetConfigs[name].lockedCandidate).toEqual(locked);
    expect(targetConfigs[name].keyField).toBe("id");
    expect(targetConfigs[name].key).toBe(locked.recordId);
    expect(targetConfigs[name].fields).toEqual(locked.baselineProjectionFields);
    const bytes = readFileSync(locked.sourceCandidatePath);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(locked.sourceCandidateSha256);
    const source = JSON.parse(bytes.toString("utf8"));
    expect(source.source_provenance.preparation_candidate.sha256).toBe(locked.producerSourceCandidateSha256);
    expect(source.source_provenance.original_frozen_candidate.sha256).toBe(locked.originalFrozenSourceSha256);
    for (const proof of source.source_provenance.field_source_proof) {
      const value = locked.desiredFields[proof.native_storage_key];
      const hash = typeof value === "string" ? createHash("sha256").update(value).digest("hex") : stableDigest(value);
      expect(hash).toBe(proof.after_native_value_sha256);
    }
    expect(source).not.toHaveProperty("before_fields");
    expect(source).not.toHaveProperty("record");
    expect(Object.isFrozen(locked.desiredFields)).toBe(true);
  });

  it.each(names)("%s refuses modified payload, identities and source provenance", (name) => {
    const locked = lockedOwnerPublisherThreeCandidates[name];
    const original = JSON.parse(readFileSync(locked.sourceCandidatePath, "utf8"));
    for (const source of [
      { ...original, task_id: "different-task" },
      { ...original, desired_fields: { ...original.desired_fields, title_en: "extra field" } },
      { ...original, source_provenance: { ...original.source_provenance, preparation_candidate: { path: "../arbitrary.json" } } },
    ]) {
      expect(() => readOwnerPublisherThreeCandidate(name, Buffer.from(JSON.stringify(source)))).toThrow(/package hash differs/);
    }
  });

  it("accepts no arbitrary candidate or external path", () => {
    for (const name of ["constructor", "__proto__", "../v17.json", "v17-owner-publisher-native-preparation-v1-20261007"]) {
      expect(() => readOwnerPublisherThreeCandidate(name, Buffer.from("{}"))).toThrow(/Unknown designated/);
    }
  });

  it.each(names)("%s builds a zero-write request without granting approval", (name) => {
    const locked = lockedOwnerPublisherThreeCandidates[name];
    const current = { id: locked.recordId, slug: locked.slug, status: "published", updated_at: locked.expectedUpdatedAt };
    const desired = targetConfigs[name].buildRecord(current);
    const request = buildLockedDryRunRequest(locked, desired, "local-contract-test");
    expect(request).toMatchObject({ mode: "dry-run", nextStatus: "published", expectedUpdatedAt: locked.expectedUpdatedAt,
      managedCandidate: { taskId: locked.taskId, actionId: locked.actionId, candidateVersion: name, scope: locked.scope, operation: "publish" } });
    expect(Object.keys(desired).filter((field) => !(field in current)).sort()).toEqual([...locked.changedFields].sort());
    expect(request).not.toHaveProperty("ownerApproved");
    expect(request).not.toHaveProperty("explicitExecution");
    expect(request).not.toHaveProperty("managedPermit");
    expect(() => assertLockedPublishGate(locked, {}, "not-a-permit")).toThrow(/exact single-use permit/);
  });

  it.each(names)("%s is selectable for protected forward execution and rejects rollback before credentials", (name) => {
    expect(workflow.split(name)).toHaveLength(3);
    expect(gate(name, "dry-run").status).toBe(0);
    expect(gate(name, "publish").status).not.toBe(0);
    expect(gate(name, "publish", "publish", "11111111-1111-4111-8111-111111111111").status).toBe(0);
    expect(gate(name, "dry-run", "rollback").status).not.toBe(0);
    expect(gate(name, "publish", "rollback", "11111111-1111-4111-8111-111111111111").status).not.toBe(0);
    const rejected = spawnSync(process.execPath, ["scripts/publish-content-trust-fixes.mjs", `--target=${name}`, "--rollback-from=unused.json"], {
      encoding: "utf8", env: { PATH: process.env.PATH },
    });
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toMatch(/blocked; prepare a separately reviewed forward correction/);
  });
});
