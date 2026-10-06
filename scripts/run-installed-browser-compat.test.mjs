import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { getBrowserTargets, resolveTarget, selectRunnableTargets, validateBrowserBaseUrl } from "./run-installed-browser-compat.mjs";

test("macOS discovers system and per-user vendor browsers without Windows paths", async () => {
  const targets = getBrowserTargets("darwin", { HOME: "/Users/qa" });
  const resolved = await Promise.all(targets.map((target) => resolveTarget(target, async (candidate) => candidate === "/Users/qa/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge")));
  assert.equal(selectRunnableTargets(resolved, ["edge"])[0].executablePath, "/Users/qa/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge");
  assert.ok(targets.every((target) => target.candidates.every((candidate) => !candidate.includes("undefined") && !candidate.endsWith(".exe"))));
});

test("a requested missing browser cannot pass because another browser is installed", () => {
  const targets = [{ id: "chrome", executablePath: "/browser/chrome" }, { id: "edge" }];
  assert.throws(() => selectRunnableTargets(targets, ["chrome", "edge"]), /not installed: edge/);
  assert.throws(() => selectRunnableTargets(targets, ["firefox"]), /Unsupported.*firefox/);
  assert.throws(() => selectRunnableTargets([{ id: "chrome" }]), /No supported/);
  assert.deepEqual(selectRunnableTargets(targets).map((target) => target.id), ["chrome"]);
});

test("browser test origins cannot leak credentials or tokens into test reports", () => {
  assert.equal(validateBrowserBaseUrl("http://127.0.0.1:4229/"), "http://127.0.0.1:4229");
  for (const value of ["http://qa:secret@localhost", "https://example.test?token=x", "https://example.test#token=x", "file:///Applications", "https://example.test/admin"]) {
    assert.throws(() => validateBrowserBaseUrl(value));
  }
});

test("Windows discovery ignores absent roots and uses the configured per-user installation", async () => {
  const targets = getBrowserTargets("win32", { LOCALAPPDATA: "C:\\Users\\qa\\AppData\\Local" });
  const resolved = await resolveTarget(targets.find((target) => target.id === "chrome"), async () => true);
  assert.equal(resolved.executablePath, "C:\\Users\\qa\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe");
});

test("a partially misspelled cloud target list fails before sessions are created", () => {
  const result = spawnSync(process.execPath, ["scripts/run-browserstack-compat.mjs"], {
    env: { ...process.env, BROWSERSTACK_USERNAME: "", BROWSERSTACK_ACCESS_KEY: "", REAL_BROWSER_BASE_URL: "http://127.0.0.1:4229", REAL_BROWSER_TARGETS: "windows-chrome,windows-edeg" },
    encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported BrowserStack target ids: windows-edeg/);
  assert.ok(!result.stdout.includes("starting"));
});
