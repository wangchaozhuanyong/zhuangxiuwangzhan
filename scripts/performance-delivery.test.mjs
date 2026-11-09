import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { collectHtmlAssetReferences, collectInitialJavaScriptAssets } from "./lib/performance-budget.mjs";
import { resolvePublicModulePreloadDependencies } from "./vite-module-preload.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
test("committed font CSS retains the original matching order and content hash", () => {
  const result = spawnSync(process.execPath, [path.join(root, "scripts/generate-noto-font-css.mjs"), "--check"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const record = JSON.parse(result.stdout);
  assert.equal(record.faceCount, 707);
  assert.equal(record.matchingOrderPreserved, true);
  assert.equal(record.inputSha256, "2cf5d5b258b289311fd39274f2b2f4b34d2353df5394a703a3b1b5aa2cb3de4c");
  assert.ok(record.afterGzip < record.beforeGzip);
});
const fixture = (t, files) => {
  const fixtureRoot = path.join(root, "tmp");
  mkdirSync(fixtureRoot, { recursive: true });
  const dir = mkdtempSync(path.join(fixtureRoot, "flashcast-performance-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [name, source] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), source);
  }
  return dir;
};

test("document preload includes nested static chunks while lazy routes keep CSS-only preloads", () => {
  const dependencies = ["assets/vendor.js", "assets/publicContentQueries.js", "assets/malayContent.js", "assets/public-home.css"];
  assert.deepEqual(resolvePublicModulePreloadDependencies("entry.js", dependencies, { hostType: "html" }), dependencies);
  assert.deepEqual(resolvePublicModulePreloadDependencies("route.js", dependencies, { hostType: "js" }), ["assets/public-home.css"]);
});

test("initial budget follows imports and re-exports once without counting dynamic imports or strings", (t) => {
  const dir = fixture(t, {
    "assets/entry.js": `import { value } from './shared.js'; import './side-effect.js';
      export * from './bridge.js'; export { other } from './other.js';
      const route = () => import('./lazy-route.js');
      const sample = "import './not-a-dependency.js'";`,
    "assets/shared.js": "import './entry.js'; export const value = 1;",
    "assets/side-effect.js": "import './shared.js';",
    "assets/bridge.js": "export { value } from './shared.js';",
    "assets/other.js": "export const other = 2;",
  });
  assert.deepEqual(collectInitialJavaScriptAssets(dir, ["/assets/entry.js", "/assets/shared.js"]).sort(), [
    "/assets/bridge.js", "/assets/entry.js", "/assets/other.js", "/assets/shared.js", "/assets/side-effect.js",
  ]);
});

test("missing static dependencies fail the budget instead of silently undercounting", (t) => {
  const dir = fixture(t, { "assets/entry.js": "import './missing.js';" });
  assert.throws(() => collectInitialJavaScriptAssets(dir, ["/assets/entry.js"]), /Referenced initial module is missing: \/assets\/missing\.js/);
});

test("the unchanged 180 KiB budget rejects a large transitive dependency omitted from HTML", (t) => {
  const dir = fixture(t, {
    "index.html": '<script type="module" src="/assets/entry.js"></script>',
    "assets/entry.js": "import './dictionary.js'; const lazy = () => import('./lazy-route.js');",
    "assets/dictionary.js": `export const dictionary = ${JSON.stringify(randomBytes(220 * 1024).toString("base64"))};`,
    "assets/public-home-test.css": ".page { color: inherit; }",
  });
  const result = spawnSync(process.execPath, [path.join(root, "scripts/verify-performance-budget.mjs")], {
    cwd: root, encoding: "utf8", env: { ...process.env, PERFORMANCE_BUDGET_DIST_DIR: dir },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Initial JS is .*budget is 180\.0 KiB gzip/);
  assert.match(result.stdout, /2 static modules; 1 HTML references/);
  assert.doesNotMatch(result.stderr, /missing/);
});

test("the public configuration boundary is allowed while a transitive Supabase SDK still fails", (t) => {
  const dir = fixture(t, {
    "index.html": '<script type="module" src="/assets/entry.js"></script>',
    "assets/entry.js": "import './supabaseConfig-test.js';",
    "assets/supabaseConfig-test.js": "export const isSupabaseConfigured = false;",
    "assets/supabase-test.js": "export const sdk = {};",
    "assets/public-home-test.css": ".page { color: inherit; }",
  });
  const run = () => spawnSync(process.execPath, [path.join(root, "scripts/verify-performance-budget.mjs")], {
    cwd: root, encoding: "utf8", env: { ...process.env, PERFORMANCE_BUDGET_DIST_DIR: dir },
  });
  assert.equal(run().status, 0);
  writeFileSync(path.join(dir, "assets/entry.js"), "import './supabaseConfig-test.js'; import './supabase-test.js';");
  const result = run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Admin\/data dependencies leaked into the public entry: \/assets\/supabase-test\.js/);
  assert.doesNotMatch(result.stderr, /supabaseConfig/);
});

test("HTML references exclude inline code, comments and data attributes while retaining real static tags", () => {
  const html = `<script type="module" src="/assets/entry.js"></script>
    <script>const sample = 'href="/assets/route.css"'; const tag = '<link href="/assets/fake.css">';</script>
    <!-- <link href="/assets/comment.css"> -->
    <style>.x:after { content: '<link href="/assets/style.css">'; }</style>
    <link rel="stylesheet" href="/assets/shell.css" data-href="/assets/deferred.css">
    <link rel="preload" as="style" href="/assets/real-preload.css">`;
  assert.deepEqual(collectHtmlAssetReferences(html), ["/assets/entry.js", "/assets/shell.css", "/assets/real-preload.css"]);
});
test("CSS budgets retain 40/60 KiB limits and count a shared route stylesheet once", t => {
  const css = bytes => `.page{--fixture:"${randomBytes(bytes * 1024).toString("base64")}"}`;
  const dir = fixture(t, {
    "index.html": '<script type="module" src="/assets/entry.js"></script><link rel="stylesheet" href="/assets/public-home-test.css">',
    "assets/entry.js": "export const value = 1;",
    "assets/public-home-test.css": css(35),
  });
  const run = () => spawnSync(process.execPath, [path.join(root, "scripts/verify-performance-budget.mjs")], {
    cwd: root, encoding: "utf8", env: { ...process.env, PERFORMANCE_BUDGET_DIST_DIR: dir },
  });
  assert.equal(run().status, 0, "35 KiB shared CSS must not be counted twice");
  writeFileSync(path.join(dir, "assets/public-home-test.css"), css(45));
  assert.match(run().stderr, /Initial CSS is .*budget is 40\.0 KiB gzip/);
  writeFileSync(path.join(dir, "index.html"), `<script src="/assets/entry.js"></script><script>const hint = 'href="/assets/public-home-test.css"';</script>`);
  assert.equal(run().status, 0, "route-only CSS remains within the 60 KiB route budget");
  writeFileSync(path.join(dir, "assets/public-home-test.css"), css(65));
  assert.match(run().stderr, /Public route CSS is .*budget is 60\.0 KiB gzip/);
});
