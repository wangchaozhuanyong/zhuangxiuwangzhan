import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { readFrozenRegistry, APPROVAL_ID } from "../../scripts/publish-remaining-completion-20261009.mjs";
import { readRemainderRegistry, readRemainderHistoricalRegistry, assertRemainderRendererSource, REMAINDER_NAME, REMAINDER_PATH, assertCompletedRow, assertCompletedPermits, verifyCompletedBeforeRemainder } from "../../scripts/publish-remainder18-after-37893433883.mjs";
import { inspectRawMetadata, assertRenderedEvidence, reviewedBodyPhrases } from "../../scripts/lib/publisher-public-readback.mjs";
import { targetConfigs } from "../../scripts/publish-content-trust-fixes.mjs";

const prepared = readRemainderHistoricalRegistry();
const completedEntries = prepared.original.entries.slice(0, 2);
const proofFor = (entry) => prepared.proof.completed.find((item) => item.target === entry.target);
const pagePass = { ok: true, rawStatus: 200, renderedOk: true, productionWrites: 0 };
describe("the fixed forward 18-row remainder after an actual stopped run", () => {
  it("allows historical permit regression while still rejecting an unreviewed executable renderer", () => {
    const historical = readRemainderHistoricalRegistry();
    expect(historical.proof.originalRunOutcome).toBe("FAILED_STOPPED");
    const altered = structuredClone(historical);
    altered.proof.sourceRendererSha256["src/pages/BlogDetail.tsx"] = "0".repeat(64);
    expect(() => assertRemainderRendererSource(altered)).toThrow(/renderer source fingerprint differs/);
    const currentMatches = Object.entries(historical.proof.sourceRendererSha256).every(([file, sha]) => {
      return createHash("sha256").update(readFileSync(file)).digest("hex") === sha;
    });
    if (currentMatches) expect(readRemainderRegistry().proof).toEqual(historical.proof);
    else {
      expect(() => readRemainderRegistry()).toThrow(/renderer source fingerprint differs/);
      const dir = `audits/content-publish-wrong-renderer-eighteen-${process.pid}`;
      const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/publish-remainder18-after-37893433883.mjs", `--artifact-dir=${dir}`],
        { encoding: "utf8", env: { PATH: process.env.PATH, PUBLISH_TARGET: REMAINDER_NAME } });
      expect(result.status).not.toBe(0); expect(result.stderr).toContain("renderer source fingerprint differs"); expect(existsSync(dir)).toBe(false);
    }
  });
  it("retains the failed original run while excluding only its two actually completed rows", () => {
    expect(readFrozenRegistry().entries).toHaveLength(20); expect(prepared.registry.entries).toHaveLength(18);
    expect(prepared.registry.sourceQaReceipts).toHaveLength(20);
    expect(prepared.registry.entries.map((entry) => entry.target)).toEqual(prepared.original.entries.slice(2).map((entry) => entry.target));
    expect(prepared.proof.originalRunOutcome).toBe("FAILED_STOPPED");
    expect(prepared.proof.completed[1].originalPublisherStatus).toMatchObject({ receiptOk: false, savedOk: true, postcheckOk: false, rowMismatches: [] });
    expect(prepared.proof.completed.every((item) => item.permit.status === "completed")).toBe(true);
    expect(() => readRemainderRegistry(Buffer.from(readFileSync(REMAINDER_PATH, "utf8").replace('"remainingRowCount": 18', '"remainingRowCount": 17')))).toThrow(/hash differs/);
  });
  it.each(completedEntries)("rejects desired, retained or actual saved CAS drift for $target", (entry) => {
    const proof = proofFor(entry); const row = proof.publicCurrentProjection;
    expect(() => assertCompletedRow(entry, proof, row)).not.toThrow();
    for (const drift of [{ updated_at: "2026-10-10T00:00:00Z" }, { [entry.changedFields[0]]: "newer body" }, { title_en: "newer title" }, { status: "draft" }]) {
      expect(() => assertCompletedRow(entry, proof, { ...row, ...drift })).toThrow(/drifted/);
    }
  });
  it.each(completedEntries)("freshly requires the full original completed permit tuple for $target", (entry) => {
    const proof = proofFor(entry);
    expect(() => assertCompletedPermits(entry, proof, [proof.permit])).not.toThrow();
    for (const drift of [{ status: "issued" }, { status: "writing" }, { github_run_id: 1 }, { github_actor_id: 1 },
      { permit_id: "11111111-1111-4111-8111-111111111111" }, { saved_updated_at: "2026-10-10T00:00:00Z" }, { payload_sha256: "a".repeat(64) }]) {
      expect(() => assertCompletedPermits(entry, proof, [{ ...proof.permit, ...drift }])).toThrow(/original exact completed permit/);
    }
    expect(() => assertCompletedPermits(entry, proof, [proof.permit, { ...proof.permit, permit_id: "duplicate", status: "issued" }])).toThrow();
  });
  it("dry-run refreshes both public rows and four real-page contracts without reading private permits", async () => {
    const calls: string[] = []; let saved;
    const result = await verifyCompletedBeforeRemainder({ prepared, mode: "dry-run",
      readCurrent: async (entry) => { calls.push("row:" + entry.target); return proofFor(entry).publicCurrentProjection; },
      readPermits: () => { throw Error("dry-run must not load service client or query private permits"); },
      checkPage: async ({ path, requiredText }) => { calls.push("DOM:" + path); expect(requiredText).not.toHaveLength(0); return { ...pagePass, path }; },
      save: (receipt) => { saved = structuredClone(receipt); } });
    expect(result.ok).toBe(true); expect(result.privatePermitRead).toBe(false); expect(calls.filter((call) => call.startsWith("DOM:"))).toHaveLength(4);
    expect(saved.rows.every((row) => row.permitStatus === "FROZEN_COMPLETED_NOT_PRIVATELY_REFRESHED")).toBe(true);
  });
  it("publish requires fresh completed permits and stops before any remainder work on a failed guard", async () => {
    const events: string[] = []; let saved;
    const dependencies = { prepared, mode: "publish", readCurrent: async (entry) => { events.push("row"); return proofFor(entry).publicCurrentProjection; },
      readPermits: async (entry) => { events.push("permit"); return [proofFor(entry).permit]; },
      checkPage: async () => { events.push("DOM"); return pagePass; }, save: (receipt) => { saved = structuredClone(receipt); } };
    await expect(verifyCompletedBeforeRemainder(dependencies)).resolves.toMatchObject({ ok: true, privatePermitRead: true });
    expect(events).toEqual(["row", "permit", "DOM", "DOM", "row", "permit", "DOM", "DOM"]);
    events.length = 0;
    await expect(verifyCompletedBeforeRemainder({ ...dependencies, readPermits: async (entry) => [{ ...proofFor(entry).permit, status: "uncertain" }] })).rejects.toThrow(/original exact completed permit/);
    expect(events).toEqual(["row"]); expect(saved.ok).toBe(false); expect(saved.rows).toHaveLength(1);
    expect(saved.rows[0].stage).toBe("PRIVATE_PERMIT_READ_STARTED"); expect(saved.rows[0].pages).toHaveLength(0);
    await expect(verifyCompletedBeforeRemainder({ ...dependencies, checkPage: async () => ({ ...pagePass, ok: false }) })).rejects.toThrow(/real visible content/);
    expect(saved.rows[0].pages).toHaveLength(1); expect(saved.rows[0].pages[0].ok).toBe(false);
    expect(saved.failedPath).toBe(targetConfigs[completedEntries[0].target].publicPaths[0].path);
  });
  it("checks raw metadata and visible body separately; raw heading absence cannot replace DOM proof", () => {
    const v18 = targetConfigs[completedEntries[1].target].publicPaths;
    expect(v18[0].renderedRequiredPhrases).toEqual(["Before comparing quotations: a project checklist"]);
    expect(v18[1].renderedRequiredPhrases).toEqual(["比较报价前：先核对整体项目步骤"]);
    const raw = '<title>Malaysia Renovation Quotation Checklist | FLASH CAST</title><meta name="description" content="Scope &amp; quantities">';
    expect(raw).not.toContain(v18[0].renderedRequiredPhrases[0]);
    expect(inspectRawMetadata(raw, v18[0].expected, "Scope & quantities")).toEqual({ titleFound: true, descriptionMatches: true });
    const evidence = { status: 200, ready: true, runtimeErrors: 0, visibleHeadings: v18[0].renderedRequiredPhrases, visibleMainText: "" };
    expect(assertRenderedEvidence(evidence, v18[0].renderedRequiredPhrases, true)).toBe(true);
    expect(assertRenderedEvidence({ ...evidence, visibleHeadings: [] }, v18[0].renderedRequiredPhrases, true)).toBe(false);
    expect(assertRenderedEvidence({ ...evidence, runtimeErrors: 1 }, v18[0].renderedRequiredPhrases, true)).toBe(false);
    expect(reviewedBodyPhrases('<h2>Reviewed heading</h2><p>Exact <a href="/en/quote">quotation</a> scope &amp; boundaries.</p>')).toEqual(["Reviewed heading", "Exact quotation scope & boundaries."]);
    expect(reviewedBodyPhrases('<p>Compare <a href="/en/furniture">furniture</a>.</p><p>核对<a href="/zh/quote">报价</a>，再确认。</p><p>First<br>second <strong>point</strong>.</p>')).toEqual(["Compare furniture.", "核对报价，再确认。", "First second point."]);
  });
  it("both actual entry commands reject arbitrary skip arguments before network or artifacts", () => {
    const dir = `audits/content-publish-rejected-remainder-${process.pid}`;
    for (const script of ["scripts/publish-remainder18-after-37893433883.mjs", "scripts/publish-remaining-completion-20261009.mjs"]) {
      const result = spawnSync(process.execPath, ["--experimental-strip-types", script, "--skip=v17", `--artifact-dir=${dir}`],
        { encoding: "utf8", env: { PATH: process.env.PATH, PUBLISH_TARGET: REMAINDER_NAME } });
      expect(result.status).not.toBe(0); expect(result.stderr).toContain("accepts only mode"); expect(existsSync(dir)).toBe(false);
    }
  });
  it("keeps service-role only in the exact publish step and always uploads actual guard/body receipts", () => {
    const workflow = readFileSync(".github/workflows/content-publish-approved.yml", "utf8");
    const preview = workflow.split("      - name: Preview the exact frozen completion batch")[1].split("      - name: Issue and consume")[0];
    const publish = workflow.split("      - name: Issue and consume")[1].split("      - name: Upload audit package")[0];
    expect(preview).toContain(REMAINDER_NAME); expect(preview).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(publish).toContain(REMAINDER_NAME); expect(publish).toContain("inputs.mode == 'publish'");
    expect(workflow.split("SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}")).toHaveLength(2);
    expect(workflow).not.toContain("MANAGED_CMS_PERMIT_ISSUER_SECRET"); expect(workflow).toContain("PLAYWRIGHT_CHROMIUM_CHANNEL: chrome");
    expect(workflow).toContain("      - name: Upload audit package\n        if: always()");
    const shell = workflow.split("        run: |\n")[1].split("\n      - name:")[0].split("\n").map((line) => line.replace(/^ {10}/, "")).join("\n");
    const gate = (drift) => spawnSync("bash", ["-e", "-c", shell], { encoding: "utf8", env: { PATH: process.env.PATH,
      GITHUB_REF: "refs/heads/main", PUBLISH_TARGET: REMAINDER_NAME, PUBLISH_MODE: "publish", MANAGED_OPERATION: "publish", APPROVAL_ID, ...drift } });
    expect(gate({}).status).toBe(0); expect(gate({ PUBLISH_MODE: "dry-run" }).status).toBe(0);
    for (const drift of [{ APPROVAL_ID: "forged" }, { MANAGED_PERMIT_ID: "old-permit" }, { PARENT_RUN_ID: "37893433883" }, { MANAGED_OPERATION: "rollback" }]) expect(gate(drift).status).not.toBe(0);
  });
});
