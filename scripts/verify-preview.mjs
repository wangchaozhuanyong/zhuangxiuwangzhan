import { chromium } from "@playwright/test";

const baseUrl = process.env.PREVIEW_URL || "http://127.0.0.1:4191";
const chromiumChannel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL;

const paths = [
  "/admin",
  "/zh",
  "/en",
  "/zh/materials/spc-flooring-natural-oak",
  "/zh/projects/mont-kiara-condo-renovation",
  "/zh/services/kitchen",
  "/zh/blog/malaysia-renovation-budget-guide",
  "/zh/landing/kitchen-cabinet",
  "/zh/quote",
  "/zh/contact",
];

const browser = await chromium.launch({ headless: true, ...(chromiumChannel ? { channel: chromiumChannel } : {}) });
const results = [];

for (const path of paths) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  const pageErrors = [];
  const failedAssets = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/assets/") && response.status() >= 400) {
      failedAssets.push({ url, status: response.status() });
    }
  });

  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle", timeout: 30_000 });

  const bodyText = await page.locator("body").innerText({ timeout: 10_000 });
  const title = await page.title();
  const description = await page.locator('meta[name="description"]').getAttribute("content").catch(() => "");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href").catch(() => "");
  const hreflangs = await page
    .locator('link[rel="alternate"]')
    .evaluateAll((nodes) => nodes.map((node) => ({ lang: node.getAttribute("hreflang"), href: node.getAttribute("href") })));
  const images = await page
    .locator("img")
    .evaluateAll((nodes) => nodes.map((img) => ({ src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" })));

  results.push({
    path,
    title,
    description: description?.slice(0, 140),
    canonical,
    hreflangCount: hreflangs.length,
    imageCount: images.length,
    emptyAltCount: images.filter((image) => !image.alt.trim()).length,
    consoleErrorCount: consoleErrors.length,
    pageErrorCount: pageErrors.length,
    failedAssetCount: failedAssets.length,
    consoleErrors: consoleErrors.slice(0, 3),
    pageErrors: pageErrors.slice(0, 3),
    failedAssets: failedAssets.slice(0, 3),
    hasRawHtml: /<\/?p>|<br\s*\/?|&lt;p&gt;/.test(bodyText),
    hasReplacementChar: /\uFFFD|锟/.test(bodyText),
    textSample: bodyText.slice(0, 240),
  });

  await page.close();
}

await browser.close();

console.log(JSON.stringify(results, null, 2));

const failures = results.filter((result) => result.consoleErrorCount || result.pageErrorCount || result.failedAssetCount);
if (failures.length > 0) {
  throw new Error(`Preview verification found runtime errors on: ${failures.map((result) => result.path).join(", ")}`);
}
