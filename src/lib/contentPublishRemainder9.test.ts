import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { readRemainder9Registry, REMAINDER9_NAME, REMAINDER9_PATH, assertElevenCompletedPermit, assertRemainder9CompletedProof, verifyElevenBeforeRemainder9 } from "../../scripts/publish-remainder9-after-37903094390.mjs";
import { assertCompletedRow } from "../../scripts/publish-remainder18-after-37893433883.mjs";
import { APPROVAL_ID } from "../../scripts/publish-remaining-completion-20261009.mjs";
import { targetConfigs } from "../../scripts/publish-content-trust-fixes.mjs";

const prepared = readRemainder9Registry();
const completed = prepared.original.entries.slice(0, 11);
const proofFor = (entry) => prepared.proof.completed.find((item) => item.target === entry.target);
const metadataReview = JSON.parse(readFileSync(prepared.proof.rendererReviewPath, "utf8"));
const deriveMetadataFixture = async ({ path }) => {
  const page = metadataReview.metadataContract.rows.find((item) => item.path === path);
  return { raw: page.raw, hydrated: page.hydrated, sourceSha256: prepared.proof.metadataSourceSha256 };
};
const deriveFixture = async ({ entry, language, row }) => {
  expect(row).toEqual(proofFor(entry).publicCurrentProjection);
  return proofFor(entry).freshBilingualReadback.find((page) => page.path.startsWith(`/${language}/`)).requiredText;
};
const pagePass = { ok: true, rawStatus: 200, renderedOk: true, productionWrites: 0 };
describe("the fixed nine-row forward remainder after three truthful stopped runs", () => {
  it("admits exactly c07 through c15 and retains three failures and all eleven actual saves", () => {
    expect(prepared.registry.entries.map((entry) => entry.target)).toEqual(Array.from({ length: 9 }, (_, index) => `c${String(index + 7).padStart(2, "0")}-bilingual-body-v1`));
    expect(prepared.registry.sourceQaReceipts).toHaveLength(9); expect(prepared.proof.completed).toHaveLength(11);
    expect(prepared.proof.stoppedRuns).toMatchObject([{ runId: 37893433883, outcome: "FAILED_STOPPED", actualCompletedRows: 2 }, { runId: 37898568406, outcome: "FAILED_STOPPED", actualCompletedRows: 7 }, { runId: 37903094390, outcome: "FAILED_STOPPED", actualCompletedRows: 2 }]);
    expect(prepared.proof.completed[1].originalPublisherStatus.receiptOk).toBe(false);
    expect(prepared.proof.completed[8].originalPublisherStatus).toMatchObject({ receiptOk: true, savedOk: true, originalRealBodyPostcheckOk: false });
    expect(prepared.proof.completed[8].originalPublisherStatus.originalMissingRequired).toHaveLength(9);
    expect(prepared.proof.completed[10].originalPublisherStatus).toMatchObject({ receiptOk: true, savedOk: true, originalRealBodyPostcheckOk: false });
    expect(prepared.proof.completed[10].originalPublisherStatus.originalMissingRequired).toHaveLength(12);
    expect(prepared.proof.actualQaCount).toBe(13);
    expect(prepared.proof.stoppedRunSummaries.map((snapshot) => snapshot.summary.stoppedAt)).toEqual([completed[1].target, completed[8].target, completed[10].target]);
    expect(() => readRemainder9Registry(Buffer.from(readFileSync(REMAINDER9_PATH, "utf8").replace('"remainingRowCount": 9', '"remainingRowCount": 8')))).toThrow(/hash differs/);
  });
  it.each(completed)("rejects current desired/retained/CAS drift and any original permit drift for $target", (entry) => {
    const proof = proofFor(entry); const index = completed.indexOf(entry);
    expect(() => assertCompletedRow(entry, proof, proof.publicCurrentProjection)).not.toThrow();
    expect(() => assertElevenCompletedPermit(entry, proof, [proof.permit], index)).not.toThrow();
    for (const drift of [{ updated_at: "2026-10-10T00:00:00Z" }, { [entry.changedFields[0]]: "newer content" }, { title_en: "newer title" }, { status: "draft" }]) {
      expect(() => assertCompletedRow(entry, proof, { ...proof.publicCurrentProjection, ...drift })).toThrow(/drifted/);
    }
    for (const [field, value] of Object.entries(proof.permit)) {
      const changed = value === null ? "forged" : typeof value === "number" ? value + 1 : `${value}-forged`;
      expect(() => assertElevenCompletedPermit(entry, proof, [{ ...proof.permit, [field]: changed }], index)).toThrow(/exact completed permit/);
    }
    for (const origin of [{ originRunId: 1 }, { originReleaseSha: "a".repeat(40) }]) {
      expect(() => assertElevenCompletedPermit(entry, { ...proof, ...origin }, [proof.permit], index)).toThrow(/exact completed permit/);
    }
    for (const status of ["issued", "writing", "uncertain", "completed"]) {
      expect(() => assertElevenCompletedPermit(entry, proof, [proof.permit, { ...proof.permit, permit_id: "duplicate", status }], index)).toThrow();
    }
    expect(() => assertElevenCompletedPermit(entry, proof, [{ ...proof.permit, status: "revoked" }], index)).toThrow();
  });
  it("rejects proof provenance, renderer set, QA, real-browser evidence and any rewritten stopped summary", () => {
    const check = (mutate) => { const altered = structuredClone(prepared.proof); mutate(altered); expect(() => assertRemainder9CompletedProof(altered, prepared.original, prepared.binding)).toThrow(); };
    for (const mutation of [
      (proof) => { proof.browserReadbackStatus = "PENDING_FRESH_22_PAGES"; },
      (proof) => { proof.stoppedRuns[2].releaseSha = "a".repeat(40); },
      (proof) => { proof.completed[10].qa[0].actual = "a".repeat(64); },
      (proof) => { proof.completed[10].freshBilingualReadback[0].ready = false; },
      (proof) => { proof.completed[10].freshBilingualReadback[0].path = "/zh/unrelated"; },
      (proof) => { proof.completed[10].freshBilingualReadback[0].metadata.descriptionMatches = false; },
      (proof) => { proof.completed[1].originalPublisherStatus.receiptOk = true; },
      (proof) => { proof.completed[8].originalPublisherStatus.originalRealBodyPostcheckOk = true; },
      (proof) => { proof.completed[10].originalPublisherStatus.originalRealBodyPostcheckOk = true; },
      (proof) => { proof.stoppedRunSummaries[2].summary.rows[1].status = "PUBLISH_PASS"; },
      (proof) => { proof.stoppedRunSummaries[2].summary.registrySha256 = "a".repeat(64); },
      (proof) => { proof.stoppedRunSummaries[2].summary.batch = "arbitrary-target"; },
      (proof) => { proof.reviewedPipelineSourceSha256 = {}; },
      (proof) => { proof.sourceRendererSha256 = {}; },
      (proof) => { proof.rendererReviewSha256 = "a".repeat(64); },
      (proof) => { proof.metadataSourceSha256 = {}; },
      (proof) => { proof.publicIdentity.brand_name = "Changed identity"; },
    ]) check(mutation);
  });
  it("dry-run refreshes eleven public rows and twenty-two mapped real-page contracts without a service client", async () => {
    const pages: string[] = []; let saved;
    const result = await verifyElevenBeforeRemainder9({ prepared, mode: "dry-run", readCurrent: async (entry) => proofFor(entry).publicCurrentProjection,
      readPermits: () => { throw Error("Dry-run cannot query private permits"); },
      deriveBody: deriveFixture, deriveMetadata: deriveMetadataFixture,
      checkPage: async ({ path, requiredText, title, description, strictMetadata, hydratedMetadata }) => {
        pages.push(path); const expected = await deriveMetadataFixture({ path });
        expect(strictMetadata).toBe(true); expect({ title, description }).toEqual(expected.raw); expect(hydratedMetadata).toEqual(expected.hydrated);
        const entry = completed.find((item) => targetConfigs[item.target].publicPaths.some((config) => config.path === path)); if (completed.indexOf(entry) >= 2) expect(requiredText).toEqual(proofFor(entry).freshBilingualReadback.find((page) => page.path === path).requiredText); return { ...pagePass, path }; },
      save: (receipt) => { saved = structuredClone(receipt); } });
    expect(result.ok).toBe(true); expect(result.privatePermitRead).toBe(false); expect(pages).toHaveLength(22);
    expect(saved.rows.every((row) => row.permitStatus === "FROZEN_COMPLETED_NOT_PRIVATELY_REFRESHED")).toBe(true);
  });
  it("publish rejects a changed old, middle or third-run permit before remainder work, preserving the failed guard", async () => {
    let saved; let calls = 0;
    const dependencies = { prepared, mode: "publish", readCurrent: async (entry) => proofFor(entry).publicCurrentProjection,
      readPermits: async (entry) => [proofFor(entry).permit], deriveBody: deriveFixture, deriveMetadata: deriveMetadataFixture, checkPage: async () => { calls++; return pagePass; },
      save: (receipt) => { saved = structuredClone(receipt); } };
    await expect(verifyElevenBeforeRemainder9(dependencies)).resolves.toMatchObject({ ok: true, privatePermitRead: true }); expect(calls).toBe(22);
    for (const target of [completed[0].target, completed[8].target, completed[10].target]) {
      await expect(verifyElevenBeforeRemainder9({ ...dependencies, readPermits: async (entry) => [{ ...proofFor(entry).permit, ...(entry.target === target ? { status: "uncertain" } : {}) }] })).rejects.toThrow(/exact completed permit/);
      expect(saved.ok).toBe(false); expect(saved.rows.at(-1).stage).toBe("PRIVATE_PERMIT_READ_STARTED");
    }
    await expect(verifyElevenBeforeRemainder9({ ...dependencies, checkPage: async () => ({ ...pagePass, ok: false }) })).rejects.toThrow(/actual visible body/);
    expect(saved.rows[0].pages[0].ok).toBe(false); expect(saved.failedPath).toBeTruthy();
  });
  it("rejects arbitrary skip, supplied old permits and rollback; private role remains publish-only", () => {
    const source = readFileSync("scripts/publish-remainder9-after-37903094390.mjs", "utf8");
    expect(source).toContain("deriveBody = reviewedRenderedBodyPhrases");
    expect(source).toContain("await deriveBody({ entry, language: lang, row })");
    expect(source).toContain("await reviewedRenderedBodyPhrases({ entry, language: lang, row: baseline })");
    expect(source).not.toContain("reviewedBodyPhrases(");
    expect(source).toContain("contracts.checkedCandidates === 18");
    expect(source).toContain("row.actualProductPipeline === true");
    expect(source).toContain("same(row.pipelineSourceSha256, prepared.proof.reviewedPipelineSourceSha256)");
    expect(source).not.toContain("deriveBody: ");
    expect(readFileSync(".github/workflows/r3-managed-cms-pr-ci.yml", "utf8")).toContain("scripts/lib/publisher-reviewed-renderer.mjs");
    const dir = `audits/content-publish-rejected-nine-${process.pid}`;
    const invalid = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/publish-remainder9-after-37903094390.mjs", "--skip=c06", `--artifact-dir=${dir}`],
      { encoding: "utf8", env: { PATH: process.env.PATH, PUBLISH_TARGET: REMAINDER9_NAME } });
    expect(invalid.status).not.toBe(0); expect(invalid.stderr).toContain("accepts only mode"); expect(existsSync(dir)).toBe(false);
    const workflow = readFileSync(".github/workflows/content-publish-approved.yml", "utf8");
    const preview = workflow.split("      - name: Preview the exact frozen completion batch")[1].split("      - name: Issue and consume")[0];
    const publish = workflow.split("      - name: Issue and consume")[1].split("      - name: Upload audit package")[0];
    expect(preview).toContain(REMAINDER9_NAME); expect(preview).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(publish).toContain(REMAINDER9_NAME); expect(publish).toContain("inputs.mode == 'publish'");
    expect(workflow.split("SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}")).toHaveLength(2);
    expect(workflow).toContain("      - name: Upload audit package\n        if: always()");
    const shell = workflow.split("        run: |\n")[1].split("\n      - name:")[0].split("\n").map((line) => line.replace(/^ {10}/, "")).join("\n");
    const gate = (drift) => spawnSync("bash", ["-e", "-c", shell], { encoding: "utf8", env: { PATH: process.env.PATH, GITHUB_REF: "refs/heads/main",
      PUBLISH_TARGET: REMAINDER9_NAME, PUBLISH_MODE: "publish", MANAGED_OPERATION: "publish", APPROVAL_ID, ...drift } });
    expect(gate({}).status).toBe(0); expect(gate({ PUBLISH_MODE: "dry-run" }).status).toBe(0);
    for (const drift of [{ APPROVAL_ID: "forged" }, { MANAGED_PERMIT_ID: "old-permit" }, { PARENT_RUN_ID: "37903094390" }, { MANAGED_OPERATION: "rollback" }]) expect(gate(drift).status).not.toBe(0);
  });
});
