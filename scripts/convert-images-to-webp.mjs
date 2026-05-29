/**
 * Convert jpg/jpeg/png under src/assets and public/images to .webp (keeps originals).
 * Requires: npm install -D sharp
 */
import fs from "node:fs";
import path from "node:path";

const QUALITY = Number(process.env.WEBP_QUALITY || 80);
const ROOT = process.cwd();
const SCAN_DIRS = ["src/assets", "public/images", "public/videos"];

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("Missing dependency: run `npm install -D sharp` first.");
  process.exit(1);
}

const report = { converted: [], skipped: [], failed: [] };

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

async function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) return;

  const outPath = filePath.replace(/\.(jpe?g|png)$/i, ".webp");
  if (fs.existsSync(outPath)) {
    report.skipped.push({ file: filePath, reason: "webp exists" });
    return;
  }

  try {
    const pipeline = sharp(filePath);
    if (ext === ".png") pipeline.png();
    await pipeline.webp({ quality: QUALITY }).toFile(outPath);
    const before = fs.statSync(filePath).size;
    const after = fs.statSync(outPath).size;
    report.converted.push({ from: filePath, to: outPath, before, after });
  } catch (e) {
    report.failed.push({ file: filePath, error: e instanceof Error ? e.message : String(e) });
  }
}

for (const rel of SCAN_DIRS) {
  const abs = path.join(ROOT, rel);
  for (const file of walk(abs)) {
    await convertFile(file);
  }
}

// og-image + poster at public root
for (const name of ["public/og-image.jpg", "public/videos/home-hero-poster.jpg"]) {
  const abs = path.join(ROOT, name);
  if (fs.existsSync(abs)) await convertFile(abs);
}

console.log(JSON.stringify({ quality: QUALITY, ...report, summary: {
  converted: report.converted.length,
  skipped: report.skipped.length,
  failed: report.failed.length,
}}, null, 2));
