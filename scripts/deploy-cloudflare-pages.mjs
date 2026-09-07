#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME?.trim() || "flashcast-website";

const run = (command, args) => {
  console.log(`\n[production-deploy] ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });
};

run(npmCommand, ["run", "build"]);

run(npxCommand, [
  "wrangler",
  "pages",
  "deploy",
  "dist",
  "--project-name",
  projectName,
  "--env-file",
  "/dev/null",
]);
