import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "public", "images", "projects");
const OUTPUT_ROOT = path.join(ROOT, "public", "images", "_responsive", "projects");
const WIDTHS = (process.env.PROJECT_IMAGE_WIDTHS || "360,560,720,900,1200")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0)
  .sort((a, b) => a - b);
const QUALITY = Number(process.env.PROJECT_IMAGE_QUALITY || 72);

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("Missing dependency: run `npm install -D sharp` first.");
  process.exit(1);
}

const report = { generated: [], skipped: [], failed: [] };

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.webp$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const isFresh = (source, target) => {
  if (!fs.existsSync(target)) return false;
  return fs.statSync(target).mtimeMs >= fs.statSync(source).mtimeMs;
};

async function generateVariant(source, width) {
  const relative = path.relative(SOURCE_ROOT, source);
  const target = path.join(OUTPUT_ROOT, `w${width}`, relative);

  if (isFresh(source, target)) {
    report.skipped.push({ source: path.relative(ROOT, source), target: path.relative(ROOT, target), width });
    return;
  }

  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(target);
    report.generated.push({ source: path.relative(ROOT, source), target: path.relative(ROOT, target), width });
  } catch (error) {
    report.failed.push({
      source: path.relative(ROOT, source),
      width,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

for (const source of walk(SOURCE_ROOT)) {
  for (const width of WIDTHS) {
    await generateVariant(source, width);
  }
}

console.log(
  JSON.stringify(
    {
      ok: report.failed.length === 0,
      widths: WIDTHS,
      quality: QUALITY,
      summary: {
        generated: report.generated.length,
        skipped: report.skipped.length,
        failed: report.failed.length,
      },
      ...report,
    },
    null,
    2,
  ),
);

if (report.failed.length) process.exit(1);
