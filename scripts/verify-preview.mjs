import { chromium } from "@playwright/test";

const baseUrl = process.env.PREVIEW_URL || "http://127.0.0.1:4191";

const paths = [
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

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const results = [];

for (const path of paths) {
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
    hasRawHtml: /<\/?p>|<br\s*\/?|&lt;p&gt;/.test(bodyText),
    hasReplacementChar: /�/.test(bodyText),
    textSample: bodyText.slice(0, 240),
  });
}

await browser.close();

console.log(JSON.stringify(results, null, 2));
