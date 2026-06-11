import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { SITE_CSP_POLICY } from "./site-csp.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const RETAINED_ASSET_CACHE = path.join(ROOT, ".deploy-cache/assets");
const PUBLIC_HTML_CACHE_PATHS = ["/", "/index.html", "/*.html", "/zh", "/zh/*", "/en", "/en/*"];
const HTML_NO_STORE_PATHS = ["/admin", "/admin/*"];
const IMMUTABLE_ASSET_PATHS = ["/assets/*", "/images/*", "/videos/*", "/*.webp", "/*.jpg", "/*.png"];

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

const listAssetFiles = async (root) => {
  if (!(await pathExists(root))) return [];

  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(fullPath);
        if (!entry.isFile()) return [];
        return [{ fullPath, relativePath: path.relative(root, fullPath) }];
      }),
    );

    return files.flat();
  };

  return walk(root);
};

const parseHeaderBlocks = (headers) => {
  const blocks = new Map();
  let currentPath = null;

  for (const line of headers.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    if (/^\s/.test(line)) {
      if (!currentPath) continue;
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) continue;
      const name = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      blocks.get(currentPath).set(name, value);
      continue;
    }

    currentPath = line.trim();
    if (!blocks.has(currentPath)) blocks.set(currentPath, new Map());
  }

  return blocks;
};

const assertHeaderBlock = (headerBlocks, headerPath) => {
  const block = headerBlocks.get(headerPath);
  assert(block, `public/_headers is missing a block for ${headerPath}.`);
  return block;
};

const assertHtmlNoStoreHeaders = (headerBlocks, headerPath) => {
  const block = assertHeaderBlock(headerBlocks, headerPath);
  assert(
    /^no-store,\s*no-cache,\s*must-revalidate,\s*max-age=0$/i.test(block.get("cache-control") || ""),
    `${headerPath} must set HTML Cache-Control to no-store, no-cache, must-revalidate, max-age=0.`,
  );
  assert(/^no-store$/i.test(block.get("cdn-cache-control") || ""), `${headerPath} must set CDN-Cache-Control: no-store.`);
  assert(
    /^no-store$/i.test(block.get("cloudflare-cdn-cache-control") || ""),
    `${headerPath} must set Cloudflare-CDN-Cache-Control: no-store.`,
  );
  assert(/^no-cache$/i.test(block.get("pragma") || ""), `${headerPath} must set Pragma: no-cache.`);
  assert(/^0$/.test(block.get("expires") || ""), `${headerPath} must set Expires: 0.`);
};

const assertPublicHtmlCacheHeaders = (headerBlocks, headerPath) => {
  const block = assertHeaderBlock(headerBlocks, headerPath);
  assert(
    /^public,\s*max-age=60,\s*stale-while-revalidate=300$/i.test(block.get("cache-control") || ""),
    `${headerPath} must set public HTML Cache-Control to public, max-age=60, stale-while-revalidate=300.`,
  );
  assert(/^public,\s*max-age=300$/i.test(block.get("cdn-cache-control") || ""), `${headerPath} must set CDN-Cache-Control: public, max-age=300.`);
  assert(
    /^public,\s*max-age=300$/i.test(block.get("cloudflare-cdn-cache-control") || ""),
    `${headerPath} must set Cloudflare-CDN-Cache-Control: public, max-age=300.`,
  );
  assert(!block.has("pragma"), `${headerPath} must not keep Pragma after public HTML caching is enabled.`);
  assert(!block.has("expires"), `${headerPath} must not keep Expires after public HTML caching is enabled.`);
};

const assertImmutableAssetHeaders = (headerBlocks, headerPath) => {
  const block = assertHeaderBlock(headerBlocks, headerPath);
  assert(
    /^public,\s*max-age=31536000,\s*immutable$/i.test(block.get("cache-control") || ""),
    `${headerPath} must keep immutable long-term asset caching.`,
  );
};

const cspDirective = (policy, name) =>
  policy
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith(`${name} `)) || "";

const main = async () => {
  const indexHtml = await readDistFile("index.html");
  const headers = await readDistFile("_headers");
  const redirects = (await readDistFile("_redirects").catch(() => "")).trim();
  const headerBlocks = parseHeaderBlocks(headers);
  const assetRefs = findAssetRefs(indexHtml);
  const missingAssets = [];

  for (const assetRef of assetRefs) {
    const assetPath = path.join(DIST, assetRef.slice(1));
    if (!(await pathExists(assetPath))) missingAssets.push(assetRef);
  }

  assert(assetRefs.length > 0, "dist/index.html does not reference any /assets files.");
  assert(missingAssets.length === 0, `dist/index.html references missing assets: ${missingAssets.join(", ")}`);
  for (const headerPath of PUBLIC_HTML_CACHE_PATHS) assertPublicHtmlCacheHeaders(headerBlocks, headerPath);
  for (const headerPath of HTML_NO_STORE_PATHS) assertHtmlNoStoreHeaders(headerBlocks, headerPath);
  for (const headerPath of IMMUTABLE_ASSET_PATHS) assertImmutableAssetHeaders(headerBlocks, headerPath);
  assert(headers.includes(`Content-Security-Policy: ${SITE_CSP_POLICY}`), "public/_headers CSP is not in sync with scripts/site-csp.mjs.");
  assert(!SITE_CSP_POLICY.includes("'unsafe-eval'"), "Production CSP must not include unsafe-eval.");
  assert(!cspDirective(SITE_CSP_POLICY, "script-src").includes("'unsafe-inline'"), "Production script-src must not include unsafe-inline.");
  assert(!/^\/\*\s+\/index\.html\s+200\b/m.test(redirects), "Global SPA redirect would turn missing hashed assets into HTML.");
  assert(await pathExists(path.join(DIST, "404.html")), "dist/404.html is missing.");

  const retainedCacheFiles = await listAssetFiles(RETAINED_ASSET_CACHE);
  const missingRetainedAssets = [];
  for (const file of retainedCacheFiles) {
    if (!(await pathExists(path.join(DIST, "assets", file.relativePath)))) {
      missingRetainedAssets.push(file.relativePath);
    }
  }
  assert(
    missingRetainedAssets.length === 0,
    `Retained hashed assets were not merged into dist/assets: ${missingRetainedAssets.slice(0, 20).join(", ")}`,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        assetRefCount: assetRefs.length,
        retainedAssetCount: retainedCacheFiles.length,
        publicHtmlCache: "public, max-age=60, stale-while-revalidate=300",
        publicHtmlCachePaths: PUBLIC_HTML_CACHE_PATHS,
        adminHtmlCache: "no-store",
        htmlNoStorePaths: HTML_NO_STORE_PATHS,
        assetCache: "public, max-age=31536000, immutable",
        immutableAssetPaths: IMMUTABLE_ASSET_PATHS,
        productionCsp: "synced without unsafe-eval or script-src unsafe-inline",
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
