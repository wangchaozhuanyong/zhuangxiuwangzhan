/**
 * Fetch key URLs and assert raw HTML contains expected SEO tags (no JS).
 */
import { existsSync, readFileSync } from "node:fs";
import { loadMaterialSeoPaths } from "./seo-material-pages.mjs";

const BASE = (process.env.PREVIEW_URL || process.env.SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
const RUN_EDGE_CHECKS = process.env.VERIFY_EDGE_SEO === "1";
const RUN_GEO_CHECKS = process.env.VERIFY_GEO_HTML === "1";
const RUN_CONTENT_MATCH_CHECKS = process.env.VERIFY_CONTENT_MATCH === "1";
const RUN_SITEMAP_CRAWL_CHECKS = process.env.VERIFY_SITEMAP_CRAWL === "1";

const paths = [
  "/zh",
  "/en",
  "/zh/services",
  "/en/projects",
  "/zh/materials",
  "/zh/contact",
  "/zh/quote",
  "/zh/blog",
];

const failures = [];
const warnings = [];
const manifest = JSON.parse(readFileSync("public/seo-manifest.json", "utf8"));
const materialSeoPaths = await loadMaterialSeoPaths();

const decodeHtml = (value = "") =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const getTitle = (html) => decodeHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");

const getMetaContent = (html, attr, value) => {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find((item) => new RegExp(`\\b${attr}=["']${value}["']`, "i").test(item));
  return decodeHtml((tag?.match(/\bcontent=["']([^"']*)["']/i) || [])[1] || "");
};

const normalizePath = (path) => path.replace(/\/+$/, "") || "/";

const fetchText = async (url, init = {}) => {
  const res = await fetch(url, { headers: { "user-agent": "flashcast-seo-verify" }, ...init });
  const html = await res.text();
  return { res, html };
};

for (const path of paths) {
  const url = `${BASE}${path}`;
  const { res, html } = await fetchText(url);
  const lang = path.startsWith("/zh") ? "zh" : "en";
  const expectedLang = lang === "zh" ? 'lang="zh-CN"' : 'lang="en"';

  if (!res.ok) failures.push(`${path}: HTTP ${res.status}`);
  if (!html.includes("<title")) failures.push(`${path}: missing <title>`);
  if (!html.includes('name="description"')) failures.push(`${path}: missing description`);
  if (!html.includes('rel="canonical"')) failures.push(`${path}: missing canonical`);
  if (!html.includes('hreflang="en"') || !html.includes('hreflang="zh-CN"')) failures.push(`${path}: missing hreflang`);
  if (!html.includes(expectedLang)) failures.push(`${path}: expected ${expectedLang} on <html>`);
  if (!html.includes('property="og:title"')) failures.push(`${path}: missing og:title`);

  const expected = manifest[normalizePath(path)];
  if (!expected) failures.push(`${path}: missing route in seo manifest`);

  if (RUN_CONTENT_MATCH_CHECKS && expected) {
    const title = getTitle(html);
    const description = getMetaContent(html, "name", "description");
    const ogDescription = getMetaContent(html, "property", "og:description");

    if (title !== expected.title) failures.push(`${path}: title does not match manifest`);
    if (description !== expected.description) failures.push(`${path}: description does not match manifest`);
    if (ogDescription !== expected.description) failures.push(`${path}: og:description does not match manifest`);
  }

  if (RUN_GEO_CHECKS) {
    if (!html.includes('type="application/ld+json"')) failures.push(`${path}: missing JSON-LD in raw HTML`);
    if (!html.includes("data-flashcast-edge-schema")) failures.push(`${path}: missing edge schema marker`);
    if (!html.includes("data-flashcast-geo-summary")) failures.push(`${path}: missing noscript GEO summary`);
    if (!html.includes('"@type":"WebPage"')) failures.push(`${path}: missing WebPage schema`);
    if (!html.includes('"@type":"HomeAndConstructionBusiness"')) failures.push(`${path}: missing business schema`);
  }
}

const sitemapXml = readFileSync("public/sitemap.xml", "utf8");
const sitemapLocs = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const duplicateLocs = sitemapLocs.filter((loc, index) => sitemapLocs.indexOf(loc) !== index);
const nonCanonicalLocs = sitemapLocs.filter((loc) => !loc.startsWith("https://flashcast.com.my/"));
const legacyLocs = sitemapLocs.filter((loc) => !/^https:\/\/flashcast\.com\.my\/(en|zh)(\/|$)/.test(loc));
const queryLocs = sitemapLocs.filter((loc) => loc.includes("?"));

if (!sitemapLocs.length) failures.push("sitemap: no <loc> entries");
if (duplicateLocs.length) failures.push(`sitemap: duplicate URLs: ${[...new Set(duplicateLocs)].slice(0, 5).join(", ")}`);
if (nonCanonicalLocs.length) failures.push(`sitemap: non-canonical host URLs: ${nonCanonicalLocs.slice(0, 5).join(", ")}`);
if (legacyLocs.length) failures.push(`sitemap: URLs without /en or /zh prefix: ${legacyLocs.slice(0, 5).join(", ")}`);
if (queryLocs.length) failures.push(`sitemap: query URLs should not be listed: ${queryLocs.slice(0, 5).join(", ")}`);

if (RUN_SITEMAP_CRAWL_CHECKS) {
  const crawlSitemapUrl = async (loc) => {
    const response = await fetch(loc, {
      redirect: "manual",
      headers: { "user-agent": "flashcast-seo-verify" },
    });
    return {
      loc,
      status: response.status,
      location: response.headers.get("location") || "",
    };
  };
  const sitemapCrawlResults = [];
  const concurrency = 12;
  for (let index = 0; index < sitemapLocs.length; index += concurrency) {
    const batch = sitemapLocs.slice(index, index + concurrency);
    sitemapCrawlResults.push(...(await Promise.all(batch.map(crawlSitemapUrl))));
  }
  const sitemapRedirects = sitemapCrawlResults.filter((item) => item.status >= 300 && item.status < 400);
  const sitemapErrors = sitemapCrawlResults.filter((item) => item.status >= 400 || item.status === 0);

  if (sitemapRedirects.length) {
    failures.push(
      `sitemap: URLs should resolve directly without redirects: ${sitemapRedirects
        .slice(0, 5)
        .map((item) => `${item.loc} -> ${item.status} ${item.location}`)
        .join(", ")}`,
    );
  }
  if (sitemapErrors.length) {
    failures.push(
      `sitemap: URLs should not return errors: ${sitemapErrors
        .slice(0, 5)
        .map((item) => `${item.loc} -> ${item.status}`)
        .join(", ")}`,
    );
  }
} else {
  warnings.push("sitemap crawl checks skipped; set VERIFY_SITEMAP_CRAWL=1 before validating Google indexing fixes");
}

const manifestLocs = Object.keys(manifest).map((path) => `https://flashcast.com.my${normalizePath(path)}`);
const sitemapSet = new Set(sitemapLocs);
const manifestSet = new Set(manifestLocs);
const missingInManifest = sitemapLocs.filter((loc) => !manifestSet.has(loc));
const missingInSitemap = manifestLocs.filter((loc) => !sitemapSet.has(loc));
const materialSeoLocs = materialSeoPaths.flatMap((path) => [
  `https://flashcast.com.my/en${path}`,
  `https://flashcast.com.my/zh${path}`,
]);
const missingMaterialInManifest = materialSeoLocs.filter((loc) => !manifestSet.has(loc));
const missingMaterialInSitemap = materialSeoLocs.filter((loc) => !sitemapSet.has(loc));

if (missingInManifest.length) failures.push(`manifest: sitemap URLs missing from manifest: ${missingInManifest.slice(0, 5).join(", ")}`);
if (missingInSitemap.length) failures.push(`sitemap: manifest URLs missing from sitemap: ${missingInSitemap.slice(0, 5).join(", ")}`);
if (missingMaterialInManifest.length) failures.push(`manifest: material category URLs missing from manifest: ${missingMaterialInManifest.slice(0, 5).join(", ")}`);
if (missingMaterialInSitemap.length) failures.push(`sitemap: material category URLs missing from sitemap: ${missingMaterialInSitemap.slice(0, 5).join(", ")}`);

if (!existsSync("public/llms.txt")) {
  failures.push("llms: public/llms.txt is missing");
} else {
  const llms = readFileSync("public/llms.txt", "utf8");
  if (!llms.includes("FLASH CAST SDN. BHD.")) failures.push("llms: missing site identity");
  if (!llms.includes("https://flashcast.com.my/sitemap.xml")) failures.push("llms: missing sitemap reference");
  if (!llms.includes("## Canonical URL List")) failures.push("llms: missing canonical URL list");
}

const robotsTxt = readFileSync("public/robots.txt", "utf8");
if (!robotsTxt.includes("https://flashcast.com.my/llms.txt")) failures.push("robots: missing llms.txt reference");

if (RUN_EDGE_CHECKS) {
  const legacy = await fetch(`${BASE}/about`, { redirect: "manual", headers: { "user-agent": "flashcast-seo-verify" } });
  const legacyLocation = legacy.headers.get("location") || "";
  if (legacy.status !== 301 || !legacyLocation.endsWith("/en/about")) {
    failures.push(`/about: expected 301 to /en/about, got ${legacy.status} ${legacyLocation}`);
  }

  const missing = await fetchText(`${BASE}/random-google-test-xyz`, { redirect: "manual" });
  if (missing.res.status !== 404 && !missing.html.includes("noindex")) {
    failures.push(`/random-google-test-xyz: expected 404 or noindex, got ${missing.res.status}`);
  }

  const baseUrl = new URL(BASE);
  if (baseUrl.hostname === "flashcast.com.my") {
    baseUrl.hostname = "www.flashcast.com.my";
    baseUrl.pathname = "/en";
    baseUrl.search = "";
    const www = await fetch(baseUrl.toString(), { redirect: "manual", headers: { "user-agent": "flashcast-seo-verify" } });
    const wwwLocation = www.headers.get("location") || "";
    if (www.status !== 301 || wwwLocation !== `${BASE}/en`) {
      failures.push(`www host: expected 301 to ${BASE}/en, got ${www.status} ${wwwLocation}`);
    }
  }
} else {
  warnings.push("edge redirect/404 checks skipped; set VERIFY_EDGE_SEO=1 against a deployed preview or production URL after deploy");
}

if (!RUN_CONTENT_MATCH_CHECKS) {
  warnings.push("content match checks skipped; set VERIFY_CONTENT_MATCH=1 after the deployed edge middleware is current");
}

if (!RUN_GEO_CHECKS) {
  warnings.push("raw GEO JSON-LD checks skipped; set VERIFY_GEO_HTML=1 after deploying the edge middleware");
}

if (failures.length) {
  console.error("[verify-seo-html] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: paths.length, sitemapUrls: sitemapLocs.length, base: BASE, warnings }, null, 2));
