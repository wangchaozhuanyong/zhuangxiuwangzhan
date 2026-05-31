import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CACHE_DIR = ".deploy-cache/assets";
const DEFAULT_DIST_DIR = "dist/assets";
const DEFAULT_MAX_FILES = 3000;
const ASSET_FILE_RE = /\.(?:js|css|map|mjs|json|webp|png|jpe?g|gif|svg|avif|ico|woff2?|ttf)$/i;

const readArgs = () => {
  const args = process.argv.slice(2);
  const out = {
    cacheDir: DEFAULT_CACHE_DIR,
    distDir: DEFAULT_DIST_DIR,
    maxFiles: DEFAULT_MAX_FILES,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    if (arg === "--cache" && next) {
      out.cacheDir = next;
      i += 1;
    } else if (arg === "--dist" && next) {
      out.distDir = next;
      i += 1;
    } else if (arg === "--max-files" && next) {
      out.maxFiles = Number(next);
      i += 1;
    }
  }

  return out;
};

const pathExists = async (target) => {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
};

const listAssetFiles = async (root) => {
  if (!(await pathExists(root))) return [];

  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(fullPath);
        if (!entry.isFile() || !ASSET_FILE_RE.test(entry.name)) return [];
        const fileStat = await stat(fullPath);
        return [{ fullPath, relativePath: path.relative(root, fullPath), mtimeMs: fileStat.mtimeMs }];
      }),
    );

    return files.flat();
  };

  return walk(root);
};

const copyMissingAssets = async (fromRoot, toRoot) => {
  const files = await listAssetFiles(fromRoot);
  let copied = 0;

  await mkdir(toRoot, { recursive: true });

  for (const file of files) {
    const target = path.join(toRoot, file.relativePath);
    if (await pathExists(target)) continue;
    await mkdir(path.dirname(target), { recursive: true });
    await cp(file.fullPath, target, { force: false, preserveTimestamps: true });
    copied += 1;
  }

  return copied;
};

const pruneCache = async (cacheDir, maxFiles) => {
  if (!Number.isFinite(maxFiles) || maxFiles <= 0) return 0;

  const files = await listAssetFiles(cacheDir);
  if (files.length <= maxFiles) return 0;

  const stale = files.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(maxFiles);
  await Promise.all(stale.map((file) => rm(file.fullPath, { force: true })));
  return stale.length;
};

const main = async () => {
  const { cacheDir, distDir, maxFiles } = readArgs();
  const cacheRoot = path.resolve(cacheDir);
  const distRoot = path.resolve(distDir);

  if (!(await pathExists(distRoot))) {
    throw new Error(`Dist assets directory does not exist: ${distRoot}`);
  }

  await mkdir(cacheRoot, { recursive: true });

  const restoredToDist = await copyMissingAssets(cacheRoot, distRoot);
  const savedToCache = await copyMissingAssets(distRoot, cacheRoot);
  const prunedFromCache = await pruneCache(cacheRoot, maxFiles);
  const [cacheFiles, distFiles] = await Promise.all([listAssetFiles(cacheRoot), listAssetFiles(distRoot)]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        cacheDir,
        distDir,
        restoredToDist,
        savedToCache,
        prunedFromCache,
        cacheFileCount: cacheFiles.length,
        distFileCount: distFiles.length,
        maxFiles,
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
