#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { DEFAULT_PRODUCTION_BRANCH, isGeneratedReleaseArtifactPath, validateProductionReleaseState } from "./production-release-policy.mjs";

const args = new Set(process.argv.slice(2));
const requireRemote = args.has("--require-remote");
const allowGeneratedDirty = args.has("--allow-generated-dirty");

const captureGit = (gitArgs) =>
  execFileSync("git", gitArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

const captureGitStatus = () =>
  execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const expectedBranch = process.env.PRODUCTION_BRANCH?.trim() || DEFAULT_PRODUCTION_BRANCH;
const checkedOutSha = captureGit(["rev-parse", "HEAD"]);
const currentBranch = captureGit(["rev-parse", "--abbrev-ref", "HEAD"]);
const sourceBranch = process.env.RELEASE_SOURCE_BRANCH?.trim() || currentBranch;
const sourceSha = process.env.RELEASE_SOURCE_SHA?.trim() || checkedOutSha;
const statusOutput = captureGitStatus();
const dirtyPaths = statusOutput
  ? statusOutput.split("\n").flatMap((line) => line.slice(3).split(" -> ")).filter(Boolean)
  : [];
const unexpectedDirtyPaths = allowGeneratedDirty
  ? dirtyPaths.filter((filePath) => !isGeneratedReleaseArtifactPath(filePath))
  : dirtyPaths;
const dirty = unexpectedDirtyPaths.length > 0;

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
  if (unexpectedDirtyPaths.length) {
    console.error(`[release-guard] Unexpected dirty paths: ${unexpectedDirtyPaths.slice(0, 20).join(", ")}`);
  }
  process.exit(1);
}

if (allowGeneratedDirty && dirtyPaths.length) {
  console.log(`[release-guard] Accepted ${dirtyPaths.length} generated build artifact path(s) after the clean pre-build guard.`);
}

console.log(`[release-guard] Approved ${expectedBranch}@${checkedOutSha} for production release.`);
