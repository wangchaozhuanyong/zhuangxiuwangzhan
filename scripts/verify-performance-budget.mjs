import { existsSync, readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { collectInitialJavaScriptAssets } from "./lib/performance-budget.mjs";

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, process.env.PERFORMANCE_BUDGET_DIST_DIR || "dist");
const htmlPath = path.join(distDir, "index.html");
const kib = 1024;
const budgets = {
  initialJsGzip: 180 * kib,
  initialCssGzip: 40 * kib,
  publicRouteCssGzip: 60 * kib,
};

const fail = (message) => {
  console.error(`[performance-budget] ${message}`);
  process.exitCode = 1;
};

if (!existsSync(htmlPath)) {
  fail("dist/index.html is missing. Run npm run build first.");
} else {
  const html = readFileSync(htmlPath, "utf8");
  const assetRefs = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map((match) => match[1]);
  const htmlJsRefs = [...new Set(assetRefs.filter((ref) => ref.endsWith(".js")))];
  let initialJsRefs = [];
  try {
    initialJsRefs = collectInitialJavaScriptAssets(distDir, htmlJsRefs);
  } catch (error) {
    fail(error.message);
  }
  const initialCssRefs = [...new Set(assetRefs.filter((ref) => ref.endsWith(".css")))];
  const publicRouteCssRefs = readdirSync(path.join(distDir, "assets"))
    .filter((fileName) => /^public-(?:forms|home|pages)-.+\.css$/.test(fileName))
    .map((fileName) => `/assets/${fileName}`);

  const gzipBytes = (refs) => refs.reduce((total, ref) => {
    const filePath = path.join(distDir, ref.replace(/^\//, ""));
    if (!existsSync(filePath)) {
      fail(`Referenced asset is missing: ${ref}`);
      return total;
    }
    return total + gzipSync(readFileSync(filePath)).byteLength;
  }, 0);

  const initialJsGzip = gzipBytes(initialJsRefs);
  const initialCssGzip = gzipBytes(initialCssRefs);
  const publicRouteCssGzip = publicRouteCssRefs.reduce(
    (largest, ref) => Math.max(largest, initialCssGzip + gzipBytes([ref])),
    initialCssGzip,
  );
  const formatKib = (bytes) => `${(bytes / kib).toFixed(1)} KiB gzip`;

  if (initialJsGzip > budgets.initialJsGzip) {
    fail(`Initial JS is ${formatKib(initialJsGzip)}; budget is ${formatKib(budgets.initialJsGzip)}.`);
  }
  if (initialCssGzip > budgets.initialCssGzip) {
    fail(`Initial CSS is ${formatKib(initialCssGzip)}; budget is ${formatKib(budgets.initialCssGzip)}.`);
  }
  if (publicRouteCssRefs.length === 0) {
    fail("No public route CSS chunks were found; the route-level budget cannot be verified.");
  }
  if (publicRouteCssGzip > budgets.publicRouteCssGzip) {
    fail(`Public route CSS is ${formatKib(publicRouteCssGzip)}; budget is ${formatKib(budgets.publicRouteCssGzip)}.`);
  }

  // supabaseConfig is the small public configuration boundary, not the SDK.
  // It becomes visible now that the budget includes transitive modules.
  const forbiddenInitialChunks = initialJsRefs.filter((ref) =>
    /(?:supabase|radix|tooltip|toast)/i.test(ref) && !/\/supabaseConfig(?:-[^/]*)?\.js$/i.test(ref));
  if (forbiddenInitialChunks.length > 0) {
    fail(`Admin/data dependencies leaked into the public entry: ${forbiddenInitialChunks.join(", ")}`);
  }

  if (/googletagmanager\.com\/gtag\/js|id=["']flashcast-google-tag["']/i.test(html)) {
    fail("Google Tag must not be statically loaded from dist/index.html.");
  }

  const duplicateHeroAliases = [
    "home-hero.mp4",
    "home-hero.webm",
    "home-hero-tablet.mp4",
    "home-hero-tablet.webm",
    "home-hero-mobile.mp4",
    "home-hero-mobile.webm",
  ];
  const retainedAliases = duplicateHeroAliases.filter((fileName) => existsSync(path.join(distDir, "videos", fileName)));
  if (retainedAliases.length > 0) {
    fail(`Duplicate hero video aliases remain in dist: ${retainedAliases.join(", ")}`);
  }

  console.log(`[performance-budget] Initial JS: ${formatKib(initialJsGzip)} (${initialJsRefs.length} static modules; ${htmlJsRefs.length} HTML references)`);
  if (!process.exitCode) {
    console.log(`[performance-budget] Initial CSS: ${formatKib(initialCssGzip)} (${initialCssRefs.length} files)`);
    console.log(`[performance-budget] Largest public route CSS: ${formatKib(publicRouteCssGzip)} (${publicRouteCssRefs.length} route chunks checked)`);
    console.log("[performance-budget] PASS");
  }
}
