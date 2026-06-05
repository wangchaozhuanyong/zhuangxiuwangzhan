import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IMAGE_FOLDERS = (process.env.RESPONSIVE_IMAGE_FOLDERS || "projects,services,materials,heroes,before-after")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
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
  const relative = path.relative(source.root, source.file);
  const target = path.join(ROOT, "public", "images", "_responsive", source.folder, `w${width}`, relative);

  if (isFresh(source.file, target)) {
    report.skipped.push({ source: path.relative(ROOT, source.file), target: path.relative(ROOT, target), width });
    return;
  }

  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await sharp(source.file)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(target);
    report.generated.push({ source: path.relative(ROOT, source.file), target: path.relative(ROOT, target), width });
  } catch (error) {
    report.failed.push({
      source: path.relative(ROOT, source.file),
      width,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

for (const folder of IMAGE_FOLDERS) {
  const root = path.join(ROOT, "public", "images", folder);
  for (const file of walk(root)) {
    for (const width of WIDTHS) {
      await generateVariant({ folder, root, file }, width);
    }
  }
}

console.log(
  JSON.stringify(
    {
      ok: report.failed.length === 0,
      folders: IMAGE_FOLDERS,
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
