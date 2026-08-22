#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const guardScript = path.join(rootDir, "scripts", "verify-production-release-source.mjs");
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME?.trim() || "flashcast-website";

const run = (command, args) => {
  console.log(`\n[production-deploy] ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: { ...process.env, PRODUCTION_BRANCH: "main" },
  });
};

const captureGit = (args) =>
  execFileSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

run(process.execPath, [guardScript, "--require-remote"]);
run(npmCommand, ["run", "release:check"]);
run(process.execPath, [guardScript, "--require-remote", "--allow-generated-dirty"]);

const commitSha = captureGit(["rev-parse", "HEAD"]);
run(npxCommand, [
  "wrangler",
  "pages",
  "deploy",
  "dist",
  "--project-name",
  projectName,
  "--branch",
  "main",
  "--commit-hash",
  commitSha,
  "--env-file",
  "/dev/null",
]);
