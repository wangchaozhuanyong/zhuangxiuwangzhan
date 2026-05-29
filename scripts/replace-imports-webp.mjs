/**
 * Rewrite @/assets/*.jpg|jpeg|png imports to .webp when sibling webp exists.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src");
const report = { updated: [], skipped: [] };

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const importRe = /from\s+["']@\/assets\/([^"']+)\.(jpe?g|png)["']/gi;

for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;
  const next = content.replace(importRe, (full, relPath, ext) => {
    const webpAbs = path.join(ROOT, "assets", `${relPath}.webp`);
    if (!fs.existsSync(webpAbs)) {
      report.skipped.push({ file: path.relative(process.cwd(), file), import: relPath, ext });
      return full;
    }
    changed = true;
    return `from "@/assets/${relPath}.webp"`;
  });
  if (changed) {
    fs.writeFileSync(file, next);
    report.updated.push(path.relative(process.cwd(), file));
  }
}

console.log(JSON.stringify({ updated: report.updated.length, files: report.updated, skippedMissingWebp: report.skipped.length }, null, 2));
