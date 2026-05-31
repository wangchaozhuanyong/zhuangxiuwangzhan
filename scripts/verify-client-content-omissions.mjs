import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "https://flashcast.com.my";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(process.cwd(), "tmp", `client-content-verify-${timestamp}.json`);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const pages = [
  "/en/landing/kitchen-cabinet",
  "/zh/landing/kitchen-cabinet",
  "/en/landing/flooring",
  "/zh/landing/flooring",
  "/en/landing/office-renovation",
  "/zh/landing/office-renovation",
  "/en/landing/shop-renovation",
  "/zh/landing/shop-renovation",
  "/en/landing/warehouse-shelving",
  "/zh/landing/warehouse-shelving",
  "/zh/services/bathroom",
  "/zh/services/builtin",
  "/zh/services/kitchen",
  "/zh/services/office-renovation",
  "/zh/services/shop-renovation",
  "/zh/services/warehouse",
  "/en/services/old-house",
  "/zh/blog/office-fit-out-checklist-selangor",
  "/zh/blog/shop-renovation-opening-timeline-malaysia",
  "/zh/materials/anti-slip-bathroom-tile",
  "/zh/materials/subway-wall-tile",
  "/zh/materials/sintered-stone-grey",
  "/zh/materials/solid-surface-warm-white",
  "/zh/projects/bangsar-walk-in-wardrobe-system",
  "/zh/projects/corporate-office-petaling-jaya",
  "/zh/projects/damansara-heights-semi-d-refurbishment",
  "/zh/projects/home-office-puchong",
  "/zh/projects/kl-showroom-gallery-renovation",
  "/zh/projects/luxury-master-bedroom-damansara",
  "/zh/projects/mont-kiara-luxury-condo-renovation",
  "/zh/projects/restaurant-fitout-subang",
  "/zh/projects/shopfront-renovation-cheras",
  "/zh/projects/sri-petaling-beauty-salon-fit-out",
];

const suspiciousPatterns = [
  /\?{3,}/,
  /旧屋翻新常见问题/,
  /关于马来西亚旧屋翻新/,
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
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const page = await context.newPage();
const results = [];

for (const route of pages) {
  const url = new URL(route, baseUrl);
  url.searchParams.set("verify", timestamp);
  const responses = [];
  page.removeAllListeners("response");
  page.on("response", (response) => {
    const request = response.request();
    if (request.resourceType() === "image" && response.status() >= 400) {
      responses.push({ status: response.status(), url: response.url() });
    }
  });

  try {
    await page.goto(url.toString(), { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    const text = await page.locator("body").innerText({ timeout: 10000 });
    const brokenImages = await page.locator("img").evaluateAll((imgs) =>
      imgs
        .filter((img) => img.naturalWidth === 0 || img.naturalHeight === 0)
        .map((img) => ({ src: img.currentSrc || img.src, alt: img.alt })),
    );
    const patterns = route.startsWith("/zh/")
      ? [/Frequently Asked Questions/, ...suspiciousPatterns]
      : suspiciousPatterns;
    const matches = patterns
      .map((pattern) => {
        const match = text.match(pattern);
        return match ? match[0] : null;
      })
      .filter(Boolean);
    results.push({ route, ok: !brokenImages.length && !responses.length && !matches.length, brokenImages, badImageResponses: responses, matches });
  } catch (error) {
    results.push({ route, ok: false, error: error.message });
  }
}

await browser.close();
const summary = {
  baseUrl,
  checked: results.length,
  failed: results.filter((item) => !item.ok).length,
  results,
};
fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
console.log(reportPath);
console.log(JSON.stringify({ checked: summary.checked, failed: summary.failed }, null, 2));
for (const item of results.filter((result) => !result.ok)) {
  console.log(`${item.route} ${JSON.stringify({ error: item.error, brokenImages: item.brokenImages?.length, badImageResponses: item.badImageResponses?.length, matches: item.matches })}`);
}
