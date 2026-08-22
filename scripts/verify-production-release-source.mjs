#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { DEFAULT_PRODUCTION_BRANCH, validateProductionReleaseState } from "./production-release-policy.mjs";

const args = new Set(process.argv.slice(2));
const requireRemote = args.has("--require-remote");

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
const dirty = Boolean(captureGit(["status", "--porcelain", "--untracked-files=all"]));

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
  process.exit(1);
}

console.log(`[release-guard] Approved ${expectedBranch}@${checkedOutSha} for production release.`);
