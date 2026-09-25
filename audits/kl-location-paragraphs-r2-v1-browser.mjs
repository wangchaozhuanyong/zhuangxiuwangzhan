import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const [candidatePath, baselinePath] = process.argv.slice(2);
if (!candidatePath || !baselinePath) throw new Error("Candidate and baseline paths are required");
const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const row = {
  ...baseline.cmsRow,
  content_en: candidate.field_diff.content_en.after,
  content_zh: candidate.field_diff.content_zh.after,
};
const outputDir = resolve("audits/kl-location-paragraphs-r2-v1");
mkdirSync(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const language of ["en", "zh"]) {
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 1, bypassCSP: true });
      const page = await context.newPage();
      const failedRequests = [];
      const requestUrls = [];
      page.on("request", (request) => requestUrls.push(request.url()));
      page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
      await page.route("https://flashcast-test.invalid/**", async (route) => {
        const url = route.request().url();
        if (url.includes("/rest/v1/service_areas")) {
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "content-range": "0-0/1" }, body: JSON.stringify(row) });
        } else {
          await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        }
      });
      await page.goto(`http://127.0.0.1:4199/${language}/locations/kuala-lumpur`, { waitUntil: "domcontentloaded" });
      const first = language === "zh" ? "FLASH CAST 承接吉隆坡" : "FLASH CAST handles renovation";
      const introHeader = page.locator(".fc-route-section-head").filter({ hasText: first }).first();
      try {
        await introHeader.waitFor({ timeout: 15000 });
      } catch (error) {
        await page.screenshot({ path: resolve(outputDir, `${language}-${width}-debug.png`), fullPage: true });
        console.error(JSON.stringify({ pageText: (await page.locator("body").innerText()).slice(0, 1800), requestUrls, failedRequests }));
        throw error;
      }
      const paragraphTexts = await introHeader.locator("p").allTextContents();
      const serviceHrefs = await page.locator(".fc-route-section a[href*='/services/']").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      const quoteHref = await page.locator(".scheme-a-page-cta a[href*='/quote?']").first().getAttribute("href");
      const bounds = await introHeader.boundingBox();
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const result = { language, width, paragraphs: paragraphTexts.length, paragraphTexts, serviceHrefs, quoteHref, introBounds: bounds, documentWidth, failedRequests };
      if (paragraphTexts.length !== 3 || !serviceHrefs.length || !quoteHref?.startsWith(`/${language}/quote?source=location`) || !bounds || bounds.x < 0 || bounds.x + bounds.width > width + 2 || documentWidth > width + 2) {
        throw new Error(`Browser acceptance failed: ${JSON.stringify(result)}`);
      }
      await introHeader.screenshot({ path: resolve(outputDir, `${language}-${width}-intro.png`) });
      results.push({ ...result, paragraphTexts: undefined });
      await page.close();
      await context.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(resolve(outputDir, "browser-validation.json"), JSON.stringify({ candidateVersion: candidate.candidate_version, results }, null, 2));
console.log(JSON.stringify({ checks: results.map(({ language, width, paragraphs, serviceHrefs, quoteHref, documentWidth }) => ({ language, width, paragraphs, serviceLinks: serviceHrefs.length, quoteHref, documentWidth })) }, null, 2));
