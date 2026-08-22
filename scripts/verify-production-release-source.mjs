#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  DEFAULT_PRODUCTION_BRANCH,
  findUnexpectedChangedPaths,
  validateProductionReleaseState,
} from "./production-release-policy.mjs";

const args = new Set(process.argv.slice(2));
const requireRemote = args.has("--require-remote");
const allowGeneratedOutput = args.has("--allow-generated-output");

const captureGit = (gitArgs) =>
  execFileSync("git", gitArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

const expectedBranch = process.env.PRODUCTION_BRANCH?.trim() || DEFAULT_PRODUCTION_BRANCH;
const checkedOutSha = captureGit(["rev-parse", "HEAD"]);
const currentBranch = captureGit(["rev-parse", "--abbrev-ref", "HEAD"]);
const sourceBranch = process.env.RELEASE_SOURCE_BRANCH?.trim() || currentBranch;
const sourceSha = process.env.RELEASE_SOURCE_SHA?.trim() || checkedOutSha;
const listGitPaths = (gitArgs) => captureGit(gitArgs).split("\n").filter(Boolean);
const changedPaths = [
  ...listGitPaths(["diff", "--name-only"]),
  ...listGitPaths(["diff", "--cached", "--name-only"]),
  ...listGitPaths(["ls-files", "--others", "--exclude-standard"]),
];
const unexpectedChangedPaths = findUnexpectedChangedPaths(changedPaths, allowGeneratedOutput);
const dirty = unexpectedChangedPaths.length > 0;

let remoteSha = "";
if (requireRemote) {
  try {
    const remoteOutput = captureGit(["ls-remote", "--heads", "origin", `refs/heads/${expectedBranch}`]);
    remoteSha = remoteOutput.split(/\s+/)[0] || "";
  } catch (error) {
    console.error(`[release-guard] Unable to verify origin/${expectedBranch}: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

const issues = validateProductionReleaseState({
  expectedBranch,
  sourceBranch,
  sourceSha,
  checkedOutSha,
  dirty,
  requireRemote,
  remoteSha,
});

if (issues.length) {
  console.error("[release-guard] Production release blocked:");
  for (const issue of issues) console.error(`- ${issue}`);
  if (unexpectedChangedPaths.length) {
    console.error(`[release-guard] Unexpected changed paths: ${unexpectedChangedPaths.slice(0, 20).join(", ")}`);
  }
  process.exit(1);
}

if (allowGeneratedOutput && changedPaths.length) {
  console.log(`[release-guard] Accepted ${new Set(changedPaths).size} generated post-build path(s).`);
}
console.log(`[release-guard] Approved ${expectedBranch}@${checkedOutSha} for production release.`);
