import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Committed list-only variants: production builds do not need a new generation step.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await fs.readFile(path.join(root, "src/data/furnitureCatalog.json"), "utf8"));
const sources = [...new Set(catalog.products.map(product => product.images[0] || product.sourceImages[0]))]
  .filter(source => /^\/images\/furniture\/assets\/[a-f0-9]+\.webp$/.test(source)).sort();
const manifest = {};
let originalBytes = 0;
const variantBytes = { 360: 0, 640: 0 };
for (const source of sources) {
  const original = path.join(root, "public", source);
  const metadata = await sharp(original).metadata();
  const variants = {};
  originalBytes += (await fs.stat(original)).size;
  for (const width of [360, 640]) {
    const destination = path.join(root, "public", "images/furniture/listing", `w${width}`, path.basename(source));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const result = await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toFile(destination);
    variants[width] = result.width;
    variantBytes[width] += result.size;
  }
  manifest[source] = { width: metadata.width, variants };
}
await fs.writeFile(path.join(root, "src/data/furnitureListingImages.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ covers: sources.length, originalBytes, variantBytes }));
