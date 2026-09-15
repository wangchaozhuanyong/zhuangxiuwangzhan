#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { filesSince, git, liveVersion, priorAttempt, repository, runHistory, websiteInputsChanged, workflow } from "./pages-release.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(rootDir);
if (git("status", "--porcelain")) throw new Error("Release source must be clean");
git("fetch", "origin", "main", "--no-tags");
const sha = git("rev-parse", "HEAD");
if (sha !== git("rev-parse", "origin/main")) throw new Error("Release only the current main revision");
const live = await liveVersion();
if (!websiteInputsChanged(filesSince(live, sha))) {
  console.log("Production already contains the website changes; no build or deployment needed.");
} else {
  const prior = priorAttempt(runHistory(sha), sha);
  if (prior) {
    console.log(`Existing release: https://github.com/${repository}/actions/runs/${prior.id} (${prior.status}/${prior.conclusion || "pending"})`);
    if (prior.status === "completed") throw new Error("Inspect the existing release; do not redispatch the same SHA");
  } else {
    execFileSync("gh", ["workflow", "run", workflow, "--repo", repository, "--ref", "main", "--field", `expected_sha=${sha}`], { stdio: "inherit" });
    console.log(`Dispatched the single production workflow for ${sha}`);
  }
}
