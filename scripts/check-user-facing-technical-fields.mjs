import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["src/pages/admin", "src/components/admin"];

const ignoredFiles = new Set([
  "src/pages/admin/AdminEnglishCenter.tsx",
  "src/pages/admin/AdminTranslationJobs.tsx",
]);

const allowedLinePatterns = [
  /friendlyTranslationError\(/,
  /formatUserFacingError\(/,
  /formatSourcePath\(/,
  /formatAdminMutationError\(/,
  /adminStatusLabel\(/,
  /translateStatusLabel\(/,
  /fields = \[/,
  /type .*source_path/,
  /source_path\?:/,
];

const checks = [
  {
    pattern: /error\s+instanceof\s+Error\s*\?\s*error\.message/,
    reason: "用户界面不能直接展示 error.message，请使用 formatUserFacingError。",
  },
  {
    pattern: /String\(error(?:\s*\|\|\s*""|\s*)\)/,
    reason: "用户界面不能直接展示 String(error)，请使用 formatUserFacingError。",
  },
  {
    pattern: /\{\s*[^}\n]*\.source_path\s*\|\|/,
    reason: "用户界面不能直接展示 source_path，请使用 formatSourcePath。",
  },
  {
    pattern: /\$\{[^}\n]*source_path/,
    reason: "用户界面不能直接展示 source_path，请使用 formatSourcePath。",
  },
  {
    pattern: /status(?:Inline|Prefix).*record\.status/,
    reason: "用户界面不能直接展示 record.status，请使用 adminStatusLabel 或 translateStatusLabel。",
  },
];

const listFiles = (dir) => {
  const abs = path.join(root, dir);
  return readdirSync(abs).flatMap((entry) => {
    const full = path.join(abs, entry);
    const rel = path.relative(root, full).replaceAll(path.sep, "/");
    if (statSync(full).isDirectory()) return listFiles(rel);
    if (!/\.(tsx|ts)$/.test(rel)) return [];
    if (rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) return [];
    return [rel];
  });
};

const findings = [];

for (const file of scanRoots.flatMap(listFiles)) {
  const content = readFileSync(path.join(root, file), "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (ignoredFiles.has(file) && allowedLinePatterns.some((allowed) => allowed.test(line))) return;
    if (allowedLinePatterns.some((allowed) => allowed.test(line))) return;
    for (const check of checks) {
      if (check.pattern.test(line)) {
        findings.push(`${file}:${index + 1} ${check.reason}\n  ${line.trim()}`);
      }
    }
  });
}

if (findings.length) {
  console.error("User-facing technical field check failed:\n");
  console.error(findings.join("\n\n"));
  process.exit(1);
}

console.log("User-facing technical field check passed.");
