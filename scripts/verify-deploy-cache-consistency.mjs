import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const pathExists = async (target) => {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
};

const readDistFile = (relativePath) => readFile(path.join(DIST, relativePath), "utf8");

const findAssetRefs = (html) =>
  Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g))
    .map((match) => match[1])
    .filter((value, index, values) => values.indexOf(value) === index);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const main = async () => {
  const indexHtml = await readDistFile("index.html");
  const headers = await readDistFile("_headers");
  const redirects = (await readDistFile("_redirects").catch(() => "")).trim();
  const assetRefs = findAssetRefs(indexHtml);
  const missingAssets = [];

  for (const assetRef of assetRefs) {
    const assetPath = path.join(DIST, assetRef.slice(1));
    if (!(await pathExists(assetPath))) missingAssets.push(assetRef);
  }

  assert(assetRefs.length > 0, "dist/index.html does not reference any /assets files.");
  assert(missingAssets.length === 0, `dist/index.html references missing assets: ${missingAssets.join(", ")}`);
  assert(/\/\s+Cache-Control:\s*no-store,\s*no-cache,\s*must-revalidate,\s*max-age=0/i.test(headers), "Root HTML no-store header is missing.");
  assert(/\/admin\/\*\s+Cache-Control:\s*no-store,\s*no-cache,\s*must-revalidate,\s*max-age=0/i.test(headers), "Admin HTML no-store header is missing.");
  assert(/\/assets\/\*\s+Cache-Control:\s*public,\s*max-age=31536000,\s*immutable/i.test(headers), "Immutable assets cache header is missing.");
  assert(!/^\/\*\s+\/index\.html\s+200\b/m.test(redirects), "Global SPA redirect would turn missing hashed assets into HTML.");
  assert(await pathExists(path.join(DIST, "404.html")), "dist/404.html is missing.");

  console.log(
    JSON.stringify(
      {
        ok: true,
        assetRefCount: assetRefs.length,
        htmlCache: "no-store",
        assetCache: "public, max-age=31536000, immutable",
        spaFallback: "functions/_middleware.ts",
      },
      null,
      2,
    ),
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
