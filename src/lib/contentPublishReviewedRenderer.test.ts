import { spawnSync } from "node:child_process";
import { describe, it, expect } from "vitest";
import { assertRenderedEvidence, missingRenderedPhrases } from "../../scripts/lib/publisher-public-readback.mjs";
describe("actual reviewed native renderer expectations", () => {
  it("keeps strict readiness separate from the actual one-paragraph diagnostic", () => {
    const body = { status: 200, ready: false, runtimeErrors: 0, visibleMainText: "Exact first paragraph. Exact second paragraph.", visibleHeadings: [] };
    expect(assertRenderedEvidence(body, ["Exact first paragraph.", "Exact missing paragraph."])).toBe(false);
    expect(missingRenderedPhrases(body, ["Exact first paragraph.", "Exact missing paragraph."])).toEqual(["Exact missing paragraph."]);
    expect(missingRenderedPhrases(body, ["Exact first paragraph.", "Exact second paragraph."])).toEqual([]);
    expect(assertRenderedEvidence(body, ["Exact first paragraph.", "Exact second paragraph."])).toBe(false);
  });
  it("runs the native Node/Chrome actual mapper, sanitizer and splitter contracts without a DOM-emulator realm", () => {
    const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/check-publisher-reviewed-renderer.mjs"], { encoding: "utf8", timeout: 90000 });
    expect(result.status, result.stderr).toBe(0); const report = JSON.parse(result.stdout.trim());
    expect(report).toMatchObject({ pass: true, fixtureOnly: true, actualProductionAcceptance: false, productionWrites: 0,
      attemptedNetworkRequests: 0, faithfulCandidates: 18, readinessRemainsStrict: true, diagnosticReportsActualMissingOnly: true });
    expect(Object.keys(report.pipelineSourceSha256)).toHaveLength(7);
    expect(report.c06).toMatchObject({ rawBlocks: 12, mappedBlocks: 12, unchangedPrefixBlocks: 11, changedLinkBoundaryBlocks: 1, rawReviewedBytesUnchanged: true });
    expect(report.negatives).toHaveLength(9); expect(report.negatives.every((item) => item.rejected)).toBe(true);
  }, 100000);
});
