/**
 * Fetch key URLs and assert raw HTML contains expected SEO tags (no JS).
 */
import { readFileSync } from "node:fs";

const BASE = (process.env.PREVIEW_URL || process.env.SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
const RUN_EDGE_CHECKS = process.env.VERIFY_EDGE_SEO === "1";

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

if (failures.length) {
  console.error("[verify-seo-html] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: paths.length, sitemapUrls: sitemapLocs.length, base: BASE, warnings }, null, 2));
