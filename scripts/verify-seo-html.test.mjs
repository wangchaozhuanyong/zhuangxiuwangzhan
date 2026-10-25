import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "reports", "seo-html-verifier-fixtures");
mkdirSync(output, { recursive: true });

function verify(extraPath, { contentMatch = false, incorrectField, customBrand = false } = {}) {
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
  writeFileSync(bootstrap, `const manifest = ${JSON.stringify(manifest)};
  const contentMatch = ${JSON.stringify(contentMatch)}, incorrectField = ${JSON.stringify(incorrectField)}, customBrand = ${JSON.stringify(customBrand)};
  const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  globalThis.fetch = async input => {
    const url = new URL(input);
    if (url.origin !== "https://fixture.invalid") throw new Error("Unexpected network request");
    const lang = url.pathname.startsWith("/zh") ? "zh-CN" : "en";
    if (!contentMatch) return new Response('<html lang="'+lang+'"><title>Fixture</title><meta name="description" content="Fixture"><meta property="og:title" content="Fixture"><link rel="canonical" href="'+url+'"><link hreflang="en"><link hreflang="zh-CN"></html>');
    const expected = manifest[url.pathname];
    let title = expected.title, description = expected.description;
    if (url.pathname === '/zh' && !customBrand) {
      title = '闪铸装饰 FLASH CAST | 吉隆坡装修、室内设计与定制柜';
      description = '闪铸装饰亦称“闪铸设计”，为吉隆坡、雪兰莪与巴生谷提供住宅及商业装修、室内设计、定制柜体与项目协调。按现场情况和确认范围准备报价。';
    }
    if (url.pathname === '/zh/contact' && !customBrand) {
      title = '联系闪铸装饰 FLASH CAST | 吉隆坡装修咨询';
    }
    const home = url.pathname === '/zh';
    const ogDescription = home && incorrectField === 'ogDescription' ? 'Unexpected sharing description' : description;
    if (home && incorrectField === 'title') title = 'Unexpected title';
    if (home && incorrectField === 'description') description = 'Unexpected description';
    const identity = { company_name: customBrand ? 'Fixture Company' : 'FLASH CAST SDN. BHD.', brand_name: customBrand ? 'Fixture' : 'FLASH CAST' };
    return new Response('<html lang="'+lang+'"><title>'+escape(title)+'</title><meta name="description" content="'+escape(description)+'"><meta property="og:title" content="'+escape(title)+'"><meta property="og:description" content="'+escape(ogDescription)+'"><link rel="canonical" href="'+url+'"><link hreflang="en"><link hreflang="zh-CN"><script id="flashcast-public-data" type="application/json">'+JSON.stringify({siteSettings:identity})+'</script></html>');
  };`);
  return execFileSync(process.execPath, ["--import", bootstrap, join(root, "scripts/verify-seo-html.mjs")], {
    cwd: fixture, encoding: "utf8",
    env: { PATH: process.env.PATH, PREVIEW_URL: "https://fixture.invalid", VERIFY_EDGE_SEO: "0", VERIFY_GEO_HTML: "0", VERIFY_CONTENT_MATCH: contentMatch ? "1" : "0", VERIFY_SITEMAP_CRAWL: "0" },
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

test("content matching honors the existing Chinese brand rule and current public identity", () => {
  for (const customBrand of [false, true]) {
    assert.equal(JSON.parse(verify("/ms/audit-locale", { contentMatch: true, customBrand })).ok, true);
  }
});

test("branded metadata still rejects each incorrect title, description and sharing description", () => {
  for (const [incorrectField, message] of [["title", "title does not match"], ["description", "description does not match"], ["ogDescription", "og:description does not match"]]) {
    assert.throws(() => verify("/ms/audit-locale", { contentMatch: true, incorrectField }), error => {
      assert.ok(String(error.stderr).includes(message));
      return true;
    });
  }
});
