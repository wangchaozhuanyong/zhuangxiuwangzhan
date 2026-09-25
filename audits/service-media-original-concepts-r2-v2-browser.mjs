import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const [mapPath, cmsCandidatePath, cmsLockPath] = process.argv.slice(2);
if (!mapPath) throw new Error("Visual replacement-map path is required");
const replacement = JSON.parse(readFileSync(mapPath, "utf8"));
if (Boolean(cmsCandidatePath) !== Boolean(cmsLockPath)) throw new Error("CMS candidate and row lock paths must be supplied together");
const cmsRows = cmsCandidatePath && cmsLockPath
  ? (() => {
      const candidate = JSON.parse(readFileSync(cmsCandidatePath, "utf8"));
      const lock = JSON.parse(readFileSync(cmsLockPath, "utf8"));
      return candidate.items.map((item) => ({
        ...lock.rows[item.slug],
        ...Object.fromEntries(Object.entries(item.field_diff).map(([field, change]) => [field, change.after])),
      }));
    })()
  : null;
const mode = cmsRows ? "cms" : "fallback";
const output = resolve("audits/service-media-original-concepts-r2-v2");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [];
try {
  for (const language of ["en", "zh"]) {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 1, bypassCSP: Boolean(cmsRows) });
      const page = await context.newPage();
      if (cmsRows) {
        await page.route("https://flashcast-test.invalid/**", async (route) => {
          const url = new URL(route.request().url());
          if (url.pathname.endsWith("/rest/v1/services")) {
            const slug = url.searchParams.get("slug")?.replace(/^eq\./, "");
            const data = slug ? cmsRows.find((row) => row.slug === slug) || null : cmsRows;
            await route.fulfill({ status: 200, contentType: "application/json", headers: { "content-range": "0-2/3" }, body: JSON.stringify(data) });
          } else {
            await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
          }
        });
      }
      await page.goto(`http://127.0.0.1:4200/${language}/services`, { waitUntil: "domcontentloaded" });
      for (const item of replacement.items) {
        const card = page.locator(`.fc-route-card[href="/${language}/services/${item.slug}"]`).first();
        await card.waitFor({ timeout: 15000 });
        await card.scrollIntoViewIfNeeded();
        const image = card.locator("img").first();
        const media = await image.evaluate(async (element) => {
          try { await element.decode(); } catch { /* recorded below */ }
          return { src: element.currentSrc || element.src, alt: element.alt, loaded: element.complete && element.naturalWidth > 0 };
        });
        const disclosure = await card.locator(".fc-route-card-disclosure").innerText();
        const expectedDisclosure = replacement.required_visible_disclosure[language];
        const expectedAlt = item[`alt_${language}`];
        if (!media.loaded || !media.src.includes(`/ai-concepts/${item.slug}-concept.webp`) || media.alt !== expectedAlt || disclosure !== expectedDisclosure) {
          throw new Error(`Listing mismatch ${language}/${width}/${item.slug}: ${JSON.stringify({ media, disclosure, expectedAlt, expectedDisclosure })}`);
        }
        if (width === 390 && language === "zh") await card.screenshot({ path: resolve(output, `${item.slug}-zh-390-card-${mode}.png`) });
        checks.push({ language, width, slug: item.slug, position: "listing", ...media, disclosure });
      }
      for (const item of replacement.items) {
        await page.goto(`http://127.0.0.1:4200/${language}/services/${item.slug}`, { waitUntil: "domcontentloaded" });
        const hero = page.locator(".fc-route-hero").first();
        await hero.waitFor({ timeout: 15000 });
        const image = hero.locator(".fc-route-hero-media img").first();
        const media = await image.evaluate(async (element) => {
          try { await element.decode(); } catch { /* recorded below */ }
          return { src: element.currentSrc || element.src, alt: element.alt, loaded: element.complete && element.naturalWidth > 0 };
        });
        const disclosure = await hero.locator(".fc-route-media-disclosure").innerText();
        const quoteHref = await hero.locator(".fc-route-hero-actions a[href*='/quote?']").first().getAttribute("href");
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        if (!media.loaded || !media.src.includes(`/ai-concepts/${item.slug}-concept.webp`) || media.alt !== item[`alt_${language}`] || disclosure !== replacement.required_visible_disclosure[language] || !quoteHref?.startsWith(`/${language}/quote?source=service`) || documentWidth > width + 2) {
          throw new Error(`Detail mismatch ${language}/${width}/${item.slug}: ${JSON.stringify({ media, disclosure, quoteHref, documentWidth })}`);
        }
        if (width === 390 && language === "en") await hero.screenshot({ path: resolve(output, `${item.slug}-en-390-hero-${mode}.png`) });
        checks.push({ language, width, slug: item.slug, position: "detail", ...media, disclosure, quoteHref, documentWidth });
      }
      await page.close();
      await context.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(resolve(output, `browser-validation-${mode}.json`), JSON.stringify({ candidateVersion: "service-media-original-concepts-r2-v5", mode: cmsRows ? "local preview injected exact CMS candidate rows" : "local preview fallback data", checks }, null, 2) + "\n");
console.log(JSON.stringify({ checks: checks.length, loaded: checks.filter((item) => item.loaded).length, bilingualDisclosures: [...new Set(checks.map((item) => item.disclosure))] }, null, 2));
