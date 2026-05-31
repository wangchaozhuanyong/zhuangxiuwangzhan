import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "https://flashcast.com.my";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(process.cwd(), "tmp", `full-client-content-scan-${timestamp}.json`);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
const sitemapXml = await fetch(sitemapUrl).then((res) => res.text());
const urls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => !url.includes("/admin"))
  .map((url) => {
    const original = new URL(url);
    const target = new URL(original.pathname, baseUrl);
    target.searchParams.set("scan", timestamp);
    return target.toString();
  });

const zhSuspicious = [
  /\?{3,}/,
  /Frequently Asked Questions/,
  /Corporate Office in KL Sentral/,
  /Co-Working Space in PJ/,
  /Retail Shop in Bangsar/,
  /Cafe Renovation in SS2/,
  /Storage System for Logistics Co\./,
  /Drawer island/,
  /Lighting integration/,
  /High-performance/,
  /material only/,
  /Smooth 人造石/,
  /Commercial Kitchen Setup/,
  /Signage Fabrication/,
  /Salon reception/,
  /opening timeline/,
  /retail fit-out/,
];

const enSuspicious = [
  /旧屋翻新常见问题/,
  /关于马来西亚旧屋翻新/,
  /\?{3,}/,
];

async function scanUrl(context, url, viewportName) {
  const page = await context.newPage();
  const badImageResponses = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "image") {
      const contentType = response.headers()["content-type"] || "";
      if (response.status() >= 400 || (contentType && !contentType.startsWith("image/"))) {
        badImageResponses.push({ status: response.status(), contentType, url: response.url() });
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const text = await page.locator("body").innerText({ timeout: 10000 });
    const brokenImages = await page.locator("img").evaluateAll((imgs) =>
      imgs
        .filter((img) => img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0))
        .map((img) => ({ src: img.currentSrc || img.src, alt: img.alt })),
    );
    const overflowX = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    const pathname = new URL(url).pathname;
    const patterns = pathname.startsWith("/zh/") ? zhSuspicious : pathname.startsWith("/en/") ? enSuspicious : [/\?{3,}/];
    const matches = patterns
      .map((pattern) => text.match(pattern)?.[0] || null)
      .filter(Boolean);
    return { viewportName, url, ok: !badImageResponses.length && !brokenImages.length && !matches.length && overflowX <= 2, badImageResponses, brokenImages, matches, overflowX };
  } catch (error) {
    return { viewportName, url, ok: false, error: error.message };
  } finally {
    await page.close();
  }
}

async function runPool(items, limit, worker) {
  const results = [];
  let index = 0;
  async function next() {
    const current = index++;
    if (current >= items.length) return;
    results[current] = await worker(items[current], current);
    await next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });

const desktopResults = await runPool(urls, 5, (url) => scanUrl(desktop, url, "desktop"));
const mobileResults = await runPool(urls, 5, (url) => scanUrl(mobile, url, "mobile"));

await desktop.close();
await mobile.close();
await browser.close();

const results = [...desktopResults, ...mobileResults];
const failed = results.filter((result) => !result.ok);
const report = {
  baseUrl,
  sitemapUrl,
  urlCount: urls.length,
  checked: results.length,
  failedCount: failed.length,
  failedByViewport: failed.reduce((acc, item) => {
    acc[item.viewportName] = (acc[item.viewportName] || 0) + 1;
    return acc;
  }, {}),
  failed,
};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(reportPath);
console.log(JSON.stringify({ urlCount: report.urlCount, checked: report.checked, failedCount: report.failedCount, failedByViewport: report.failedByViewport }, null, 2));
for (const item of failed.slice(0, 40)) {
  console.log(`${item.viewportName} ${new URL(item.url).pathname} ${JSON.stringify({ error: item.error, badImageResponses: item.badImageResponses?.length, brokenImages: item.brokenImages?.length, matches: item.matches, overflowX: item.overflowX })}`);
}
