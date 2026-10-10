// Pure offline Node/Chrome contracts. Never load production env or contact a provider.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { readFrozenRegistry } from "./publish-remaining-completion-20261009.mjs";
import { targetConfigs } from "./publish-content-trust-fixes.mjs";
import { reviewedBodyPhrases, reviewedRenderedBodyPhrases, verifyCandidateTextContracts, readVisibleBodyEvidence, assertRenderedEvidence, missingRenderedPhrases } from "./lib/publisher-public-readback.mjs";
import { renderReviewedRow } from "./lib/publisher-reviewed-renderer.mjs";
export async function checkReviewedRenderer() {
  const original = readFrozenRegistry(); const rowFor = (entry) => targetConfigs[entry.target].buildRecord(
    JSON.parse(readFileSync(targetConfigs[entry.target].lockedCandidate.rollbackRecordPath, "utf8")));
  const notReady = { status: 200, ready: false, runtimeErrors: 0, visibleMainText: "Exact first paragraph. Exact second paragraph.", visibleHeadings: [] };
  assert.equal(assertRenderedEvidence(notReady, ["Exact first paragraph.", "Exact missing paragraph."]), false);
  assert.deepEqual(missingRenderedPhrases(notReady, ["Exact first paragraph.", "Exact missing paragraph."]), ["Exact missing paragraph."]);
  assert.deepEqual(missingRenderedPhrases(notReady, ["Exact first paragraph.", "Exact second paragraph."]), []);
  assert.equal(assertRenderedEvidence(notReady, ["Exact first paragraph.", "Exact second paragraph."]), false);
  const candidates = original.entries.slice(11).flatMap((entry) => ["en", "zh"].map((language) => ({ target: entry.target, entry, language, row: rowFor(entry) })));
  const contract = await verifyCandidateTextContracts(candidates, "chrome");
  assert.equal(contract.ok, true); assert.equal(contract.checkedCandidates, 18);
  assert.equal(contract.fixtureOnly, true); assert.equal(contract.livePageAcceptance, false);
  assert.ok(contract.rows.every((row) => row.actualProductPipeline && row.missingRequired.length === 0 && Object.keys(row.pipelineSourceSha256).length === 7));
  const entry = original.entries[10]; const row = rowFor(entry);
  const raw = reviewedBodyPhrases(row.content_zh); const mapped = await reviewedRenderedBodyPhrases({ entry, row, language: "zh" }, "chrome");
  assert.equal(raw.length, 12); assert.equal(mapped.length, 12); assert.deepEqual(raw.slice(0, 11), mapped.slice(0, 11));
  assert.notEqual(raw[11], mapped[11]); assert.ok(mapped[11].includes("可查看地板材料比较；")); assert.ok(raw[11].includes("可查看 地板材料比较；"));
  assert.equal(row.content_zh, targetConfigs[entry.target].lockedCandidate.desiredFields.content_zh);
  assert.deepEqual(await reviewedRenderedBodyPhrases({ entry, row, language: "en" }, "chrome"), reviewedBodyPhrases(row.content_en));
  const { chromium } = await import("@playwright/test"); const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const negatives = []; let network = 0;
  try {
    const context = await browser.newContext({ bypassCSP: false }); await context.route("**/*", (route) => { network++; return route.abort(); }); const page = await context.newPage();
    const candidate = { entry, row, language: "zh" };
    const rendered = await renderReviewedRow(page, candidate); const required = reviewedBodyPhrases(rendered.mappedContent);
    const evidence = async () => ({ status: 200, ready: true, runtimeErrors: 0, ...await readVisibleBodyEvidence(page) });
    assert.equal(assertRenderedEvidence(await evidence(), required), true);
    for (const [name, mutation] of [
      ["missing-reviewed-paragraph", () => [...document.querySelectorAll("article p")].at(-1).remove()],
      ["wrong-reviewed-paragraph", () => { document.querySelector("article p").textContent = "不同正文。"; }],
      ["missing-reviewed-heading", () => document.querySelector("article h2").remove()],
      ["wrong-inline-link", () => { document.querySelector("article a").textContent = "错误链接文字"; }],
      ["hidden-inline-link", () => document.querySelector("article a").setAttribute("hidden", "")],
      ["hidden-article", () => { document.querySelector("article").hidden = true; }],
      ["inert-article", () => document.querySelector("article").setAttribute("inert", "")],
      ["transparent-ancestor", () => { document.querySelector("main").style.opacity = "0"; }],
      ["extra-visible-space", () => { document.querySelector("article a").after(document.createTextNode(" ")); }],
    ]) {
      await renderReviewedRow(page, candidate); await page.evaluate(mutation);
      const rejected = !assertRenderedEvidence(await evidence(), required); negatives.push({ name, rejected }); assert.equal(rejected, true);
    }
    await assert.rejects(renderReviewedRow(page, { ...candidate, row: { ...row, id: "wrong-row" } }), /identity/);
    assert.equal(network, 0);
  } finally { await browser.close(); }
  return { checkedAt: new Date().toISOString(), fixtureOnly: true, actualProductionAcceptance: false, productionWrites: 0,
    attemptedNetworkRequests: network, faithfulCandidates: 18, faithfulPhrases: contract.rows.reduce((sum, row) => sum + row.checkedBlocks, 0),
    pipelineSourceSha256: contract.rows[0].pipelineSourceSha256, c06: { rawBlocks: 12, mappedBlocks: 12, unchangedPrefixBlocks: 11, changedLinkBoundaryBlocks: 1, rawReviewedBytesUnchanged: true },
    readinessRemainsStrict: true, diagnosticReportsActualMissingOnly: true, negatives, pass: true };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) checkReviewedRenderer().then((report) => console.log(JSON.stringify(report))).catch((error) => {
  console.error(error instanceof Error ? error.message : "Reviewed renderer contract failed"); process.exitCode = 1;
});
