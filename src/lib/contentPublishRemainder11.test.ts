import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { readRemainder11Registry, readRemainder11HistoricalRegistry, assertRemainder11RendererSource, REMAINDER11_NAME, REMAINDER11_PATH, assertNineCompletedPermit, verifyNineBeforeRemainder11 } from "../../scripts/publish-remainder11-after-37898568406.mjs";
import { assertCompletedRow } from "../../scripts/publish-remainder18-after-37893433883.mjs";
import { APPROVAL_ID } from "../../scripts/publish-remaining-completion-20261009.mjs";
import { reviewedBodyPhrases, readVisibleBodyEvidence, assertRenderedEvidence } from "../../scripts/lib/publisher-public-readback.mjs";
import { targetConfigs } from "../../scripts/publish-content-trust-fixes.mjs";

const prepared = readRemainder11HistoricalRegistry();
const completed = prepared.original.entries.slice(0, 9);
const proofFor = (entry) => prepared.proof.completed.find((item) => item.target === entry.target);
const pagePass = { ok: true, rawStatus: 200, renderedOk: true, productionWrites: 0 };
describe("the fixed eleven-row forward remainder after two truthful stopped runs", () => {
  it("keeps historical contracts readable and refuses executable source drift before credentials or artifacts", () => {
    const historical = readRemainder11HistoricalRegistry();
    expect(historical.proof.stoppedRuns.every((run) => run.outcome === "FAILED_STOPPED")).toBe(true);
    const altered = structuredClone(historical);
    altered.proof.sourceRendererSha256["src/pages/BlogDetail.tsx"] = "0".repeat(64);
    expect(() => assertRemainder11RendererSource(altered)).toThrow(/renderer fingerprint differs/);
    const currentMatches = Object.entries(historical.proof.sourceRendererSha256).every(([file, sha]) => {
      return createHash("sha256").update(readFileSync(file)).digest("hex") === sha;
    });
    if (currentMatches) expect(readRemainder11Registry().proof).toEqual(historical.proof);
    else {
      expect(() => readRemainder11Registry()).toThrow(/renderer fingerprint differs/);
      const dir = `audits/content-publish-wrong-renderer-eleven-${process.pid}`;
      const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/publish-remainder11-after-37898568406.mjs", `--artifact-dir=${dir}`],
        { encoding: "utf8", env: { PATH: process.env.PATH, PUBLISH_TARGET: REMAINDER11_NAME } });
      expect(result.status).not.toBe(0); expect(result.stderr).toContain("renderer fingerprint differs"); expect(existsSync(dir)).toBe(false);
    }
  });
  it("admits exactly c05 through c15 and retains both failures and all nine actual saves", () => {
    expect(prepared.registry.entries.map((entry) => entry.target)).toEqual(Array.from({ length: 11 }, (_, index) => `c${String(index + 5).padStart(2, "0")}-bilingual-body-v1`));
    expect(prepared.registry.sourceQaReceipts).toHaveLength(11); expect(prepared.proof.completed).toHaveLength(9);
    expect(prepared.proof.stoppedRuns).toMatchObject([{ runId: 37893433883, outcome: "FAILED_STOPPED", actualCompletedRows: 2 }, { runId: 37898568406, outcome: "FAILED_STOPPED", actualCompletedRows: 7 }]);
    expect(prepared.proof.completed[1].originalPublisherStatus.receiptOk).toBe(false);
    expect(prepared.proof.completed[8].originalPublisherStatus).toMatchObject({ receiptOk: true, savedOk: true, originalRealBodyPostcheckOk: false });
    expect(prepared.proof.completed[8].originalPublisherStatus.originalMissingRequired).toHaveLength(9);
    expect(() => readRemainder11Registry(Buffer.from(readFileSync(REMAINDER11_PATH, "utf8").replace('"remainingRowCount": 11', '"remainingRowCount": 10')))).toThrow(/hash differs/);
  });
  it.each(completed)("rejects current desired/retained/CAS drift and any original permit drift for $target", (entry) => {
    const proof = proofFor(entry); const index = completed.indexOf(entry);
    expect(() => assertCompletedRow(entry, proof, proof.publicCurrentProjection)).not.toThrow();
    expect(() => assertNineCompletedPermit(entry, proof, [proof.permit], index)).not.toThrow();
    for (const drift of [{ updated_at: "2026-10-10T00:00:00Z" }, { [entry.changedFields[0]]: "newer content" }, { title_en: "newer title" }, { status: "draft" }]) {
      expect(() => assertCompletedRow(entry, proof, { ...proof.publicCurrentProjection, ...drift })).toThrow(/drifted/);
    }
    for (const drift of [{ status: "issued" }, { status: "writing" }, { github_run_id: 1 }, { github_workflow_sha: "a".repeat(40) },
      { github_actor_id: 1 }, { qa_receipt_id: "forged" }, { operations_decision_id: "forged" }, { issuer_evidence_sha256: "a".repeat(64) },
      { saved_updated_at: "2026-10-10T00:00:00Z" }, { permit_id: "forged" }]) {
      expect(() => assertNineCompletedPermit(entry, proof, [{ ...proof.permit, ...drift }], index)).toThrow(/exact completed permit/);
    }
    expect(() => assertNineCompletedPermit(entry, proof, [proof.permit, { ...proof.permit, permit_id: "duplicate", status: "uncertain" }], index)).toThrow();
  });
  it("dry-run refreshes nine public rows and eighteen exact real-page contracts without a service client", async () => {
    const pages: string[] = []; let saved;
    const result = await verifyNineBeforeRemainder11({ prepared, mode: "dry-run", readCurrent: async (entry) => proofFor(entry).publicCurrentProjection,
      readPermits: () => { throw Error("Dry-run cannot query private permits"); },
      checkPage: async ({ path, requiredText }) => { pages.push(path); if (path.endsWith("/services/warehouse")) expect(requiredText).toEqual(reviewedBodyPhrases(targetConfigs[completed[8].target].lockedCandidate.desiredFields[path.startsWith("/zh/") ? "content_zh" : "content_en"])); return { ...pagePass, path }; },
      save: (receipt) => { saved = structuredClone(receipt); } });
    expect(result.ok).toBe(true); expect(result.privatePermitRead).toBe(false); expect(pages).toHaveLength(18);
    expect(saved.rows.every((row) => row.permitStatus === "FROZEN_COMPLETED_NOT_PRIVATELY_REFRESHED")).toBe(true);
  });
  it("publish rejects a changed old or second-run permit before remainder work, preserving the failed guard", async () => {
    let saved; let calls = 0;
    const dependencies = { prepared, mode: "publish", readCurrent: async (entry) => proofFor(entry).publicCurrentProjection,
      readPermits: async (entry) => [proofFor(entry).permit], checkPage: async () => { calls++; return pagePass; },
      save: (receipt) => { saved = structuredClone(receipt); } };
    await expect(verifyNineBeforeRemainder11(dependencies)).resolves.toMatchObject({ ok: true, privatePermitRead: true }); expect(calls).toBe(18);
    for (const target of [completed[0].target, completed[8].target]) {
      await expect(verifyNineBeforeRemainder11({ ...dependencies, readPermits: async (entry) => [{ ...proofFor(entry).permit, ...(entry.target === target ? { status: "uncertain" } : {}) }] })).rejects.toThrow(/exact completed permit/);
      expect(saved.ok).toBe(false); expect(saved.rows.at(-1).stage).toBe("PRIVATE_PERMIT_READ_STARTED");
    }
    await expect(verifyNineBeforeRemainder11({ ...dependencies, checkPage: async () => ({ ...pagePass, ok: false }) })).rejects.toThrow(/actual visible body/);
    expect(saved.rows[0].pages[0].ok).toBe(false); expect(saved.failedPath).toBeTruthy();
  });
  it("rejects arbitrary skip, supplied old permits and rollback; private role remains publish-only", () => {
    const dir = `audits/content-publish-rejected-eleven-${process.pid}`;
    const invalid = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/publish-remainder11-after-37898568406.mjs", "--skip=c04", `--artifact-dir=${dir}`],
      { encoding: "utf8", env: { PATH: process.env.PATH, PUBLISH_TARGET: REMAINDER11_NAME } });
    expect(invalid.status).not.toBe(0); expect(invalid.stderr).toContain("accepts only mode"); expect(existsSync(dir)).toBe(false);
    const workflow = readFileSync(".github/workflows/content-publish-approved.yml", "utf8");
    const preview = workflow.split("      - name: Preview the exact frozen completion batch")[1].split("      - name: Issue and consume")[0];
    const publish = workflow.split("      - name: Issue and consume")[1].split("      - name: Upload audit package")[0];
    expect(preview).toContain(REMAINDER11_NAME); expect(preview).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(publish).toContain(REMAINDER11_NAME); expect(publish).toContain("inputs.mode == 'publish'");
    expect(workflow.split("SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}")).toHaveLength(2);
    expect(workflow).toContain("      - name: Upload audit package\n        if: always()");
    const shell = workflow.split("        run: |\n")[1].split("\n      - name:")[0].split("\n").map((line) => line.replace(/^ {10}/, "")).join("\n");
    const gate = (drift) => spawnSync("bash", ["-e", "-c", shell], { encoding: "utf8", env: { PATH: process.env.PATH, GITHUB_REF: "refs/heads/main",
      PUBLISH_TARGET: REMAINDER11_NAME, PUBLISH_MODE: "publish", MANAGED_OPERATION: "publish", APPROVAL_ID, ...drift } });
    expect(gate({}).status).toBe(0); expect(gate({ PUBLISH_MODE: "dry-run" }).status).toBe(0);
    for (const drift of [{ APPROVAL_ID: "forged" }, { MANAGED_PERMIT_ID: "old-permit" }, { PARENT_RUN_ID: "37898568406" }, { MANAGED_OPERATION: "rollback" }]) expect(gate(drift).status).not.toBe(0);
  });
  it("reads real visible direct and boxless text without accepting hidden, inert or transparent text", async () => {
    const { chromium } = await import("@playwright/test"); const browser = await chromium.launch({ channel: "chrome", headless: true });
    try {
      const context = await browser.newContext(); await context.route("**/*", (route) => route.abort()); const page = await context.newPage();
      const expected = ["Exact heading", "Direct list sentence.", "核对报价，再确认。", "First second point."];
      const html = '<main><h2>Exact heading</h2><div style="display:contents">Direct list sentence.</div><p>核对<a href="/zh/quote">报价</a>，再确认。</p><p>First<br>second <strong>point</strong>.</p></main>';
      await page.setContent(html); const visible = await readVisibleBodyEvidence(page);
      expect(assertRenderedEvidence({ status: 200, ready: true, runtimeErrors: 0, ...visible }, expected)).toBe(true);
      for (const replacement of ['hidden', 'inert', 'style="opacity:0"', 'style="display:none"', 'style="visibility:hidden"']) {
        await page.setContent(html.replace('<main>', `<main ${replacement}>`));
        expect(assertRenderedEvidence({ status: 200, ready: true, runtimeErrors: 0, ...await readVisibleBodyEvidence(page) }, expected)).toBe(false);
      }
      for (const subtree of ['<div style="opacity:0"><p>Secret sentence.</p><h2>Secret heading</h2></div>', '<div inert><span>Secret sentence.</span><h2>Secret heading</h2></div>', '<div hidden>Secret sentence.</div>']) {
        await page.setContent(`<main>${subtree}<p>Visible sentence.</p></main>`); const body = await readVisibleBodyEvidence(page);
        expect(body.visibleMainText).not.toContain("Secret"); expect(body.visibleHeadings).not.toContain("Secret heading");
      }
      for (const changed of [html.replace("Direct list", "Different list"), html.replace("<h2>Exact heading</h2>", ""), html.replace("Direct list sentence.", "")]) {
        await page.setContent(changed); expect(assertRenderedEvidence({ status: 200, ready: true, runtimeErrors: 0, ...await readVisibleBodyEvidence(page) }, expected)).toBe(false);
      }
      await page.setContent('<main><p>First<br hidden>second point.</p></main>');
      expect(assertRenderedEvidence({ status: 200, ready: true, runtimeErrors: 0, ...await readVisibleBodyEvidence(page) }, ["First second point."])).toBe(false);
    } finally { await browser.close(); }
  }, 30000);
});
