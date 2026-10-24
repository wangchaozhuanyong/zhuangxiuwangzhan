import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "reports", "seo-html-verifier-fixtures");
mkdirSync(output, { recursive: true });

function verify(extraPath) {
  const fixture = mkdtempSync(join(output, "locale-"));
  mkdirSync(join(fixture, "public"));
  symlinkSync(join(root, "src"), join(fixture, "src"));
  const manifest = JSON.parse(readFileSync(join(root, "public/seo-manifest.json"), "utf8"));
  manifest[extraPath] = { ...manifest["/en/contact"], canonical: `https://flashcast.com.my${extraPath}` };
  writeFileSync(join(fixture, "public/seo-manifest.json"), JSON.stringify(manifest));
  const locs = Object.keys(manifest).map(path => `<url><loc>https://flashcast.com.my${path}</loc></url>`).join("");
  writeFileSync(join(fixture, "public/sitemap.xml"), `<urlset>${locs}</urlset>`);
  for (const name of ["robots.txt", "llms.txt"]) {
    writeFileSync(join(fixture, "public", name), readFileSync(join(root, "public", name)));
  }
  const bootstrap = join(fixture, "read-only-fetch.mjs");
  writeFileSync(bootstrap, `globalThis.fetch = async input => {
    const url = new URL(input);
    if (url.origin !== "https://fixture.invalid") throw new Error("Unexpected network request");
    const lang = url.pathname.startsWith("/zh") ? "zh-CN" : "en";
    return new Response('<html lang="'+lang+'"><title>Fixture</title><meta name="description" content="Fixture"><meta property="og:title" content="Fixture"><link rel="canonical" href="'+url+'"><link hreflang="en"><link hreflang="zh-CN"></html>');
  };`);
  return execFileSync(process.execPath, ["--import", bootstrap, join(root, "scripts/verify-seo-html.mjs")], {
    cwd: fixture, encoding: "utf8",
    env: { PATH: process.env.PATH, PREVIEW_URL: "https://fixture.invalid", VERIFY_EDGE_SEO: "0", VERIFY_GEO_HTML: "0", VERIFY_CONTENT_MATCH: "0", VERIFY_SITEMAP_CRAWL: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("SEO verifier accepts Malay canonical URLs alongside English and Chinese", () => {
  assert.equal(JSON.parse(verify("/ms/audit-locale")).ok, true);
});

test("SEO verifier continues rejecting unsupported language and legacy URLs", () => {
  for (const path of ["/de/audit-locale", "/audit-legacy"]) {
    assert.throws(() => verify(path), error => {
      assert.match(String(error.stderr), /URLs without \/en, \/zh or \/ms prefix/);
      return true;
    });
  }
});
