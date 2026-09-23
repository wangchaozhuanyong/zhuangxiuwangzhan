import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertLockedDryRunResult,
  assertLockedPublishGate,
  assertLockedRollbackCurrent,
  assertLockedServiceCandidate,
  buildLockedDryRunRequest,
  stableDigest,
  targetConfigs,
} from "../../scripts/publish-content-trust-fixes.mjs";

const lockedTargets = [
  {
    name: "builtin-whole-house-custom-v1",
    taskId: "fc-20260920-builtin-whole-house-custom-v1",
    recordId: "b401a610-a4dc-4a0b-a7e0-efcac6c81d71",
    slug: "builtin",
    fieldCount: 22,
    sourceSha256: "1c2e381e6393dc588d11df2e960641a3d37a5c0145d61dc3b95804129fa1dd45",
  },
  {
    name: "en-renovation-owner-cms-v2",
    taskId: "fc-20260920-en-renovation-owner-publish-v2",
    recordId: "0d947129-0595-43ef-baa1-0fd9d8b870e6",
    slug: "renovation",
    fieldCount: 7,
    sourceSha256: "85826741469e39663ab6bf42411eaccb4186dacc128c0b32f8846d6549510c50",
  },
  {
    name: "pg002-shop-cms-v1",
    taskId: "fc-20260921-seo-pg002-shop-candidate-v1",
    recordId: "32f5374f-9919-41ea-80c7-00b5ac917532",
    slug: "shop-renovation",
    fieldCount: 8,
    sourceSha256: "cfeecb6ae5bcb55c9c2bb2f0993aaf4de309906dd1e2ed6dd189e29e18e2c988",
  },
] as const;

const newTargets = [
  { name: "kitchen-r1-cms-row-20260924-v1", contentType: "service", slug: "kitchen", fields: ["faqs_zh", "faqs_en"] },
  { name: "design-r1-cms-row-20260924-v1", contentType: "service", slug: "design", fields: ["content_zh", "content_en", "faqs_zh", "faqs_en"] },
  { name: "selangor-service-area-r1-v4", contentType: "service_area", slug: "selangor", fields: ["content_zh", "content_en", "property_types"] },
] as const;

const makeCurrent = (name: string) => {
  const config = targetConfigs[name];
  const locked = config.lockedCandidate;
  const row = Object.fromEntries(config.fields.map((field: string) => [field, null]));
  row.id = locked.recordId;
  row.slug = locked.slug;
  row.status = locked.status;
  row.updated_at = locked.expectedUpdatedAt;
  return { config, locked: { ...locked, baselineFieldsSha256: stableDigest(row) }, row };
};

describe("three locked CMS targets in the existing protected workflow", () => {
  it.each(lockedTargets)("maps $name to the original candidate and a strict no-write request", ({ name, taskId, recordId, slug, fieldCount, sourceSha256 }) => {
    const { config, locked, row } = makeCurrent(name);
    expect(locked.taskId).toBe(taskId);
    expect(locked.candidateVersion).toBe(name);
    expect(locked.recordId).toBe(recordId);
    expect(locked.slug).toBe(slug);
    expect(locked.actionClass).toBe("cms_write");
    expect(locked.scope).toMatch(/^flashcast\.com\.my:/);
    expect(locked.sourceCandidateSha256).toBe(sourceSha256);
    expect(locked.rollbackPackagePath).toBeTruthy();
    expect(locked.rollbackPackageSha256).toMatch(/^[a-f0-9]{64}$/);
    if (locked.rollbackRecordPath) {
      expect(locked.rollbackRecordSha256).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(locked.changedFields).toHaveLength(fieldCount);
    expect(locked.publicPaths.map(({ path }: { path: string }) => path)).toEqual([
      `/en/services/${slug}`,
      `/zh/services/${slug}`,
    ]);

    expect(() => assertLockedServiceCandidate(locked, row)).not.toThrow();
    const desired = config.buildRecord(row);
    expect(Object.keys(desired).filter((field) => JSON.stringify(desired[field]) !== JSON.stringify(row[field])).sort())
      .toEqual([...locked.changedFields].sort());
    const request = buildLockedDryRunRequest(locked, desired, `managed-cms:${taskId}:${locked.actionId}`);
    expect(request).toMatchObject({
      contentType: "service",
      mode: "dry-run",
      nextStatus: "published",
      expectedUpdatedAt: locked.expectedUpdatedAt,
      record: desired,
    });
    expect(request).not.toHaveProperty("ownerApproved");
    expect(request).not.toHaveProperty("explicitExecution");
  });

  it("rejects record drift, wrong identity and changes to the locked payload", () => {
    const { locked, row } = makeCurrent(lockedTargets[0].name);
    expect(() => assertLockedServiceCandidate(locked, { ...row, id: "wrong-id" })).toThrow(/identity mismatch/);
    expect(() => assertLockedServiceCandidate(locked, { ...row, updated_at: "later" })).toThrow(/updated_at drift/);
    expect(() => assertLockedServiceCandidate(locked, { ...row, title_en: "changed" })).toThrow(/field drift/);
    expect(() => assertLockedServiceCandidate({ ...locked, desiredFields: { ...locked.desiredFields, title_en: "changed" } }, row))
      .toThrow(/payload mismatch/);
  });

  it("allows rollback only while the exact published candidate remains current", () => {
    const { locked, row } = makeCurrent(lockedTargets[0].name);
    const published = { ...row, ...locked.desiredFields, updated_at: "2026-09-21T12:30:00Z" };
    expect(() => assertLockedRollbackCurrent(locked, published)).not.toThrow();
    expect(() => assertLockedRollbackCurrent(locked, { ...published, content_en: "changed later" }))
      .toThrow(/does not match/);
    expect(() => assertLockedRollbackCurrent(locked, { ...published, id: "other-record" }))
      .toThrow(/does not match/);
  });

  it("accepts only an HTTP 200 dry-run on the exact unchanged row", () => {
    const { locked, row } = makeCurrent(lockedTargets[2].name);
    const response = { ok: true, dry_run: true, content_type: "service", existing_id: locked.recordId, slug: locked.slug };
    expect(() => assertLockedDryRunResult(locked, response, 200, row, { ...row })).not.toThrow();
    expect(() => assertLockedDryRunResult(locked, response, 401, row, row)).toThrow(/did not confirm/);
    expect(() => assertLockedDryRunResult(locked, { ...response, dry_run: false }, 200, row, row)).toThrow(/did not confirm/);
    expect(() => assertLockedDryRunResult(locked, { ...response, saved_id: "unexpected" }, 200, row, row)).toThrow(/did not confirm/);
    expect(() => assertLockedDryRunResult(locked, response, 200, row, { ...row, updated_at: "later" })).toThrow(/changed during dry-run/);
  });

  it("rejects forged text references without a verified main run and exact permit ID", () => {
    const { locked } = makeCurrent(lockedTargets[1].name);
    const forged = {
      approvalId: "owner-standing-flashcast-site-publish-20260906",
      qaStatus: "PASS",
      qaReceiptId: "forged-qa-receipt",
      releaseDecision: "AUTO_RELEASE",
      releaseDecisionId: "forged-operations-decision",
      policyPermitId: "forged-single-use-permit",
      policyScope: locked.scope,
      taskId: locked.taskId,
      actionId: locked.actionId,
      actionClass: locked.actionClass,
      candidateVersion: locked.candidateVersion,
    };
    const attempts = [
      forged,
      { ...forged, taskId: "other-task" },
      { ...forged, actionId: "other-action" },
      { ...forged, actionClass: "site_publish" },
      { ...forged, policyScope: "flashcast.com.my:services/other" },
      { ...forged, candidateVersion: "other-candidate" },
    ];
    for (const attempt of attempts) {
      expect(() => assertLockedPublishGate(locked, attempt)).toThrow(/approved main workflow and an exact single-use permit/);
    }
    const run = { GITHUB_ACTIONS: "true", GITHUB_REF: "refs/heads/main", ACTIONS_ID_TOKEN_REQUEST_URL: "https://example.test", ACTIONS_ID_TOKEN_REQUEST_TOKEN: "test-only" };
    expect(() => assertLockedPublishGate(locked, run, "not-a-uuid")).toThrow(/exact single-use permit/);
    expect(() => assertLockedPublishGate(locked, run, "11111111-1111-4111-8111-111111111111")).not.toThrow();
  });

  it.each(lockedTargets)("fails direct publish of $name before credential loading or audit creation", ({ name }) => {
    const artifactDir = resolve(process.cwd(), `audits/managed-workflow-guard-test-${process.pid}-${name}`);
    const argv = [
      resolve(process.cwd(), "scripts/publish-content-trust-fixes.mjs"),
      `--target=${name}`,
      "--execute",
      "--approval-id=owner-standing-flashcast-site-publish-20260906",
      "--qa-status=PASS",
      "--qa-receipt-id=forged-qa-receipt",
      "--release-decision=AUTO_RELEASE",
      "--release-decision-id=forged-operations-decision",
      "--policy-permit-id=forged-single-use-permit",
      `--policy-scope=${targetConfigs[name].lockedCandidate.scope}`,
      "--env-dir=/missing-managed-workflow-test-env",
      `--artifact-dir=${artifactDir}`,
    ];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = spawnSync(process.execPath, argv, { cwd: process.cwd(), encoding: "utf8" });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("approved main workflow and an exact single-use permit");
      expect(result.stderr).not.toContain("CONTENT_PUBLISH_SECRET");
      expect(existsSync(artifactDir)).toBe(false);
    }
  });

  it.each(newTargets)("pins $name to exact changed fields and the correct protected content type", ({ name, contentType, slug, fields }) => {
    const { config, locked, row } = makeCurrent(name);
    expect(config.contentType).toBe(contentType);
    expect(locked.slug).toBe(slug);
    expect(locked.changedFields).toEqual(fields);
    expect(stableDigest(locked.desiredFields)).toBe(locked.desiredFieldsSha256);
    expect(locked.sourceCandidateSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(locked.rollbackRecordSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(locked.publicPaths.map(({ path }: { path: string }) => path)).toEqual(
      ["en", "zh"].map((lang) => `/${lang}/${contentType === "service_area" ? "locations" : "services"}/${slug}`),
    );
    expect(() => assertLockedServiceCandidate(locked, row)).not.toThrow();
    const desired = config.buildRecord(row);
    expect(buildLockedDryRunRequest(locked, desired, "test")).toMatchObject({
      contentType, mode: "dry-run", expectedUpdatedAt: locked.expectedUpdatedAt,
    });
    expect(() => assertLockedServiceCandidate({ ...locked, desiredFields: { ...locked.desiredFields, [fields[0]]: "forged" } }, row))
      .toThrow(/payload mismatch/);
  });

  it.each(newTargets)("rejects direct $name writes before reading credentials", ({ name }) => {
    const artifactDir = resolve(process.cwd(), `audits/managed-workflow-guard-test-${process.pid}-${name}`);
    const result = spawnSync(process.execPath, [resolve(process.cwd(), "scripts/publish-content-trust-fixes.mjs"),
      `--target=${name}`, "--execute", "--approval-id=forged", `--artifact-dir=${artifactDir}`],
    { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("approved main workflow and an exact single-use permit");
    expect(existsSync(artifactDir)).toBe(false);
  });

  it("keeps prior targets available without a locked-candidate publish gate", () => {
    for (const target of ["kitchen", "builtin", "shop-renovation", "old-house-renovation-checklist", "malaysia-renovation-budget-guide"]) {
      expect(targetConfigs[target]).toBeDefined();
      expect(targetConfigs[target].lockedCandidate).toBeUndefined();
    }
    expect(Object.keys(targetConfigs).filter((target) => targetConfigs[target].lockedCandidate).sort())
      .toEqual([...lockedTargets, ...newTargets].map((item) => item.name).sort());
  });
});
