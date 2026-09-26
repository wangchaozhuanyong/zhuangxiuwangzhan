import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
  { name: "org-017-bathroom-faq-parity-reconciliation-v4", contentType: "service", slug: "bathroom", fields: ["faqs_zh", "faqs_en"] },
  { name: "office-service-scope-r1-v1", contentType: "service", slug: "office-renovation", fields: ["content_en", "content_zh"] },
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
  it("locks the Office candidate to its original two fields and exact source row", () => {
    const config = targetConfigs["office-service-scope-r1-v1"];
    const locked = config.lockedCandidate;
    const baseline = JSON.parse(readFileSync(resolve(process.cwd(), locked.rollbackRecordPath), "utf8"));
    const sourceSha = createHash("sha256").update(readFileSync(resolve(process.cwd(), locked.sourceCandidatePath))).digest("hex");
    expect(sourceSha).toBe(locked.sourceCandidateSha256);
    expect(locked.scope).toBe("flashcast.com.my:services/a87541ac-1cba-4f1a-972d-428dccdbcc0f:content_en,content_zh");
    expect(locked.changedFields).toEqual(["content_en", "content_zh"]);
    expect(() => assertLockedServiceCandidate(locked, baseline)).not.toThrow();
    expect(() => assertLockedServiceCandidate(locked, { ...baseline, updated_at: "2026-08-22T06:48:26.731612+00:00" })).toThrow();
    expect(() => assertLockedServiceCandidate(locked, { ...baseline, title_en: "unapproved" })).toThrow();
  });

  it("exposes only the four approved new targets in each protected workflow gate", () => {
    const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/content-publish-approved.yml"), "utf8");
    const four = ["office-service-scope-r1-v1", "blog-kitchen-cabinet-cost-r1-v1",
      "blog-renovation-quotation-links-r1-v1", "blog-office-checklist-links-r1-v1"];
    for (const name of four) {
      expect(workflow.split(name)).toHaveLength(4);
      expect(targetConfigs[name]).toBeDefined();
      expect(targetConfigs[name].lockedCandidate).toBeDefined();
    }
  });
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
    const { config, locked, row } = makeCurrent(lockedTargets[2].name);
    const desired = config.buildRecord(row);
    const patch = Object.fromEntries(locked.changedFields.map((field: string) => [field, desired[field]]));
    const response = { ok: true, dry_run: true, content_type: "service", existing_id: locked.recordId, slug: locked.slug,
      payload_preview: patch };
    expect(() => assertLockedDryRunResult(locked, response, 200, row, { ...row }, desired)).not.toThrow();
    expect(() => assertLockedDryRunResult(locked, response, 401, row, row, desired)).toThrow(/did not confirm/);
    expect(() => assertLockedDryRunResult(locked, { ...response, dry_run: false }, 200, row, row, desired)).toThrow(/did not confirm/);
    expect(() => assertLockedDryRunResult(locked, { ...response, saved_id: "unexpected" }, 200, row, row, desired)).toThrow(/did not confirm/);
    expect(() => assertLockedDryRunResult(locked, response, 200, row, { ...row, updated_at: "later" }, desired)).toThrow(/changed during dry-run/);
    expect(() => assertLockedDryRunResult(locked, { ...response, payload_preview: { ...patch, title_en: "extra" } }, 200, row, row, desired))
      .toThrow(/exact SQL patch/);
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

  it("binds Bathroom V4 to the QA row, two new public questions and exact rollback source", () => {
    const locked = targetConfigs["org-017-bathroom-faq-parity-reconciliation-v4"].lockedCandidate;
    expect(locked.taskId).toBe("fc-20260924-org-017-bathroom-faq-rework-v3");
    expect(locked.actionId).toBe("org-017-bathroom-faq-parity-reconcile-v4");
    expect(locked.scope).toBe("flashcast.com.my:services/0f294e6d-2e2c-4f13-a93f-096728ccc6af:faqs_en,faqs_zh");
    expect(locked.expectedUpdatedAt).toBe("2026-08-22T07:17:42.361636+00:00");
    expect(locked.baselineFieldsSha256).toBe("d684889815ec35bdd864f4100448b8e663870bdab710b3b5f29e5b70b3ebd9f1");
    expect(locked.desiredFieldsSha256).toBe("f39d92eda1447c558c42c2ab07878ba75b712c1355a65b7d5c07b4edcdc96f5d");
    expect(locked.desiredFields.faqs_en).toHaveLength(6);
    expect(locked.desiredFields.faqs_zh).toHaveLength(6);
    expect(locked.publicPaths[0].requiredPhrases).toEqual([
      "What should I prepare before starting a bathroom renovation?",
      "Why should waterproofing scope be checked first?",
    ]);
    expect(locked.publicPaths[1].requiredPhrases).toEqual([
      "浴室装修前需要准备什么资料？",
      "浴室防水为什么要先检查范围？",
    ]);
    expect(locked.rollbackRecordSha256).toBe("732d8396cb6c65291fdc9f8a12ea0d85edef48ce9046729a92d3055d3a0e5be5");
    const { row } = makeCurrent("org-017-bathroom-faq-parity-reconciliation-v4");
    const published = { ...row, ...locked.desiredFields, updated_at: "2026-09-24T11:21:00.000001Z" };
    expect(() => assertLockedRollbackCurrent(locked, published)).not.toThrow();
    expect(() => assertLockedRollbackCurrent(locked, { ...published, faqs_en: row.faqs_en }))
      .toThrow(/does not match/);
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
      .toEqual([...lockedTargets.map((item) => item.name), ...newTargets.map((item) => item.name),
        "blog-kitchen-cabinet-cost-r1-v1", "blog-renovation-quotation-links-r1-v1", "blog-office-checklist-links-r1-v1",
        "kl-location-intent-r1-v2", "org026-builtin-media-r1-v5", "org026-warehouse-media-r1-v5",
        "org026-office-renovation-media-r1-v5"].sort());
  });
});
