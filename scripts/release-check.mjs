import { execSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const allowDirty = args.has("--allow-dirty");
const performanceOnly = args.has("--performance-only");
const includePerformance = args.has("--include-performance");

const run = (command, options = {}) => {
  console.log(`\n[release-check] ${command}`);
  execSync(command, {
    stdio: "inherit",
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    ...options,
  });
};

const capture = (command) =>
  execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
  }).trim();

const assertCleanGit = () => {
  const status = capture("git status --porcelain");
  if (!status) return;

  if (allowDirty) {
    console.warn("[release-check] Git working tree is dirty, but --allow-dirty was provided.");
    return;
  }

  console.error("[release-check] Refusing release checks because the Git working tree is dirty.");
  console.error("[release-check] Commit or stash local changes first so production cannot drift away from Git.");
  console.error(status.split("\n").slice(0, 40).join("\n"));
  if (status.split("\n").length > 40) {
    console.error(`[release-check] ...and ${status.split("\n").length - 40} more entries.`);
  }
  process.exit(1);
};

if (performanceOnly) {
  run("npm run verify:public-performance");
  process.exit(0);
}

assertCleanGit();

const stableChecks = [
  "npm run arch:check",
  "npm run lint",
  "npm run typecheck",
  "npm run typecheck:strict-core",
  "npm run test",
  "npm run build",
  "npm run deploy:retain-assets -- --cache .deploy-cache/assets --dist dist/assets --max-files 3000",
  "npm run verify:deploy-cache",
  "npm run verify:seo-html",
];

for (const command of stableChecks) run(command);

if (includePerformance) {
  run("npm run verify:public-performance");
} else {
  console.log("\n[release-check] Stable release checks passed.");
  console.log("[release-check] Deep performance check is separate: npm run release:performance");
}
