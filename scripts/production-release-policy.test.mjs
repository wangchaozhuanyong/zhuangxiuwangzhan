import assert from "node:assert/strict";
import test from "node:test";
import { validateProductionReleaseState } from "./production-release-policy.mjs";

const SHA = "a".repeat(40);

test("accepts a clean production-branch commit", () => {
  assert.deepEqual(validateProductionReleaseState({
    sourceBranch: "main",
    sourceSha: SHA,
    checkedOutSha: SHA,
  }), []);
});

test("rejects feature branches and dirty worktrees", () => {
  const issues = validateProductionReleaseState({
    sourceBranch: "feature/mobile-dock",
    sourceSha: SHA,
    checkedOutSha: SHA,
    dirty: true,
  });

  assert.equal(issues.length, 2);
  assert.match(issues[0], /must come from "main"/);
  assert.match(issues[1], /working tree is dirty/);
});

test("rejects a checkout that does not match the requested SHA", () => {
  const issues = validateProductionReleaseState({
    sourceBranch: "main",
    sourceSha: SHA,
    checkedOutSha: "b".repeat(40),
  });

  assert.equal(issues.length, 1);
  assert.match(issues[0], /does not match/);
});

test("requires local production releases to match origin main", () => {
  const issues = validateProductionReleaseState({
    sourceBranch: "main",
    sourceSha: SHA,
    checkedOutSha: SHA,
    requireRemote: true,
    remoteSha: "c".repeat(40),
  });

  assert.equal(issues.length, 1);
  assert.match(issues[0], /not the same commit as origin\/main/);
});
