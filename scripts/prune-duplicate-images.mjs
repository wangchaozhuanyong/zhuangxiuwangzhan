/**
 * Remove jpg/png/jpeg when a sibling .webp exists (keeps logo PNG and poster JPG as exceptions).
 */
import { readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";

const roots = ["src/assets", "public/images"];
const keepBasenames = new Set(["logo-flashcast", "home-hero-poster"]);

const walk = (dir, files = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
};

let removed = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    if (!/\.(jpe?g|png)$/i.test(file)) continue;
    const base = path.basename(file, path.extname(file));
    if (keepBasenames.has(base)) continue;
    const webp = file.replace(/\.(jpe?g|png)$/i, ".webp");
    try {
      if (statSync(webp).isFile()) {
        unlinkSync(file);
        removed += 1;
      }
    } catch {
      // no webp sibling
    }
  }
}

console.log(JSON.stringify({ ok: true, removed }, null, 2));
