import { expect, test, type Locator } from "@playwright/test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const screenshotDirectory = fileURLToPath(new URL("../audits/homepage-visual-refresh-20261007/", import.meta.url));
const primaryServiceSlugs = ["renovation", "office-renovation", "builtin"];
const directoryServiceSlugs = ["renovation", "kitchen", "builtin", "office-renovation", "shop-renovation", "bathroom"];

const readFeedback = (link: Locator) => link.evaluate((element) => {
  const title = element.querySelector("h3")!;
  const arrow = element.querySelector("svg")!;
  return {
    background: getComputedStyle(element).backgroundColor,
    underline: getComputedStyle(title).textDecorationLine,
    cardTransform: getComputedStyle(element).transform,
    arrowTransform: getComputedStyle(arrow).transform,
    focus: element.matches(":focus-visible"),
    active: (element as HTMLElement).dataset.servicePressed === "true",
    rect: element.getBoundingClientRect().toJSON(),
  };
});

const readDestinations = (links: Locator) => links.evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));

for (const language of ["zh", "en"]) {
  test(`home services preserve desktop hover and keyboard navigation (${language})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${language}`);
    const section = page.locator(".home-services");
    const links = section.locator(".home-services__card");
    await expect(links).toHaveCount(3);
    expect(await readDestinations(links)).toEqual(primaryServiceSlugs.map((slug) => `/${language}/services/${slug}`));
    const link = links.first();
    await expect(section).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await link.scrollIntoViewIfNeeded();
    await link.click({ trial: true });
    await page.mouse.move(0, 0);
    const initial = await readFeedback(link);
    await link.hover();
    await expect.poll(async () => (await readFeedback(link)).underline).toBe("underline");
    const hovered = await readFeedback(link);
    expect(hovered.background).toBe(initial.background);
    expect(hovered.cardTransform).toBe("none");
    expect(hovered.arrowTransform).toBe("none");
    expect(hovered.rect).toEqual(initial.rect);
    await page.screenshot({ path: resolve(screenshotDirectory, `${language}-services-desktop-hover.png`) });

    await page.emulateMedia({ reducedMotion: "reduce" });
    expect((await readFeedback(link)).cardTransform).toBe("none");
    expect((await readFeedback(link)).arrowTransform).toBe("none");
    await page.mouse.move(0, 0);
    await link.focus();
    await page.keyboard.press("Tab");
    await expect.poll(async () => (await readFeedback(links.nth(1))).focus).toBe(true);
    await expect.poll(async () => (await readFeedback(links.nth(1))).underline).toBe("underline");
    const target = await links.nth(1).getAttribute("href");
    expect(target).toBe(`/${language}/services/office-renovation`);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new URL(target!, page.url()).href);
  });

  test(`home service directory retains all scopes and keyboard disclosure (${language})`, async ({ page }) => {
    await page.goto(`/${language}`);
    // Keyboard focus is unavailable until the initial route gate releases inert content.
    await expect(page.locator(".public-route-content")).not.toHaveAttribute("inert", "");
    await expect(page.locator(".public-route-content")).not.toHaveAttribute("aria-busy", "true");
    const directory = page.locator(".home-services__directory a");
    const details = page.locator(".home-services__details");
    const summary = details.locator("summary");
    const descriptions = details.locator("li p");
    const destinations = directoryServiceSlugs.map((slug) => `/${language}/services/${slug}`);

    await expect(directory).toHaveCount(6);
    expect(await readDestinations(directory)).toEqual(destinations);
    await expect(details).not.toHaveAttribute("open", "");
    await expect(descriptions.first()).toBeHidden();
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press("Space");
    await expect(details).toHaveAttribute("open", "");
    await expect(descriptions).toHaveCount(6);
    expect(await readDestinations(details.locator("li a"))).toEqual(destinations);
    for (const description of await descriptions.all()) {
      await expect(description).toBeVisible();
      await expect(description).not.toHaveText("");
    }
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(details).not.toHaveAttribute("open", "");
    await expect(summary).toBeFocused();
  });
}

test.describe("touch service interaction", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  for (const language of ["zh", "en"]) {
    test(`home services respond to touch and clear cancelled presses (${language})`, async ({ page, context }) => {
      await page.goto(`/${language}`);
      const cards = page.locator(".home-services__card");
      await expect(cards).toHaveCount(3);
      const link = cards.first();
      await expect(page.locator(".home-services")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await link.scrollIntoViewIfNeeded();
      await link.click({ trial: true });
      const initial = await readFeedback(link);
      const rect = await link.boundingBox();
      expect(rect!.height).toBeGreaterThanOrEqual(44);
      const session = await context.newCDPSession(page);
      try {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: rect!.x + rect!.width / 2, y: rect!.y + rect!.height / 2 }],
        });
        await expect.poll(async () => (await readFeedback(link)).active).toBe(true);
        await expect.poll(async () => (await readFeedback(link)).underline).toBe("underline");
        const pressed = await readFeedback(link);
        expect(pressed.cardTransform).toBe("none");
        expect(pressed.arrowTransform).toBe("none");
        expect(pressed.background).toBe(initial.background);
        expect(pressed.rect).toEqual(initial.rect);
        await page.screenshot({ path: resolve(screenshotDirectory, `${language}-services-mobile-pressed.png`) });
        await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
        await expect.poll(async () => (await readFeedback(link)).active).toBe(false);
        await expect(page).toHaveURL(new RegExp(`/${language}/?$`));
        await page.screenshot({ path: resolve(screenshotDirectory, `${language}-services-mobile-idle.png`) });
        const target = await link.getAttribute("href");
        expect(target).toBe(`/${language}/services/renovation`);
        await link.tap();
        await expect(page).toHaveURL(new URL(target!, page.url()).href);
      } finally {
        await session.detach();
      }
    });
  }
});

test("home service links fit all supported widths and languages", async ({ page }) => {
  for (const language of ["zh", "en"]) {
    await page.goto(`/${language}`);
    const cards = page.locator(".home-services__card");
    const directory = page.locator(".home-services__directory a");
    const details = page.locator(".home-services__details");
    await expect(cards).toHaveCount(3);
    await expect(directory).toHaveCount(6);
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const cardLayout = await cards.evaluateAll((elements) => elements.map((element) => {
        const card = element.getBoundingClientRect();
        const image = element.querySelector(".home-services__image")!.getBoundingClientRect();
        const title = element.querySelector("h3")!.getBoundingClientRect();
        const description = element.querySelector(".home-services__copy p")!.getBoundingClientRect();
        return card.height >= 44 && card.left >= -1 && card.right <= window.innerWidth + 1
          && image.width > 0 && image.height > 0 && image.bottom <= title.top + 1
          && title.right <= card.right + 1 && description.right <= card.right + 1
          && title.bottom <= description.top + 1 && description.bottom <= card.bottom + 1;
      }));
      expect(cardLayout, `service cards: ${language} at ${width}px`).toEqual(Array(3).fill(true));
      const directoryLayout = await directory.evaluateAll((elements) => elements.map((element) => {
        const link = element.getBoundingClientRect();
        return link.height >= 44 && link.left >= -1 && link.right <= window.innerWidth + 1
          && element.scrollWidth <= element.clientWidth + 1;
      }));
      expect(directoryLayout, `service directory: ${language} at ${width}px`).toEqual(Array(6).fill(true));
      const detailLayout = await details.locator("li").evaluateAll((elements) => elements.map((element) => {
        const item = element.getBoundingClientRect();
        return item.left >= -1 && item.right <= window.innerWidth + 1 && element.scrollWidth <= element.clientWidth + 1;
      }));
      expect(detailLayout, `expanded scopes: ${language} at ${width}px`).toEqual(Array(6).fill(true));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
});
