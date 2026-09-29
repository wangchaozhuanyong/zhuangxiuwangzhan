import { expect, test, type Locator } from "@playwright/test";
import { resolve } from "node:path";

const screenshotDirectory = resolve("audits/service-interaction-20260927");
const readFeedback = (link: Locator) => link.evaluate((element) => {
  const title = element.querySelector("span")!;
  const arrow = element.querySelector("svg")!;
  return {
    background: getComputedStyle(element).backgroundColor,
    rowBackground: getComputedStyle(element.parentElement!).backgroundColor,
    underline: getComputedStyle(title).textDecorationLine,
    arrowBackground: getComputedStyle(arrow).backgroundColor,
    transform: getComputedStyle(arrow).transform,
    transition: getComputedStyle(arrow).transitionDuration,
    focus: element.matches(":focus-visible"),
    active: (element as HTMLElement).dataset.servicePressed === "true",
    rect: element.getBoundingClientRect().toJSON(),
  };
});

for (const language of ["zh", "en"]) {
  test(`home services preserve desktop hover and keyboard navigation (${language})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${language}`);
    const links = page.locator(".scheme-a-services li a");
    await expect(links).toHaveCount(6);
    const link = links.first();
    await expect(page.locator(".scheme-a-services")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await link.scrollIntoViewIfNeeded();
    await link.click({ trial: true });
    await expect.poll(() => page.locator(".scheme-a-services").evaluate(element => getComputedStyle(element).transform)).toBe("matrix(1, 0, 0, 1, 0, 0)");
    await page.mouse.move(0, 0);
    const initial = await readFeedback(link);
    await link.hover();
    await expect.poll(async () => (await readFeedback(link)).arrowBackground).toBe("rgb(216, 184, 122)");
    const hovered = await readFeedback(link);
    expect(hovered.underline).toBe("underline");
    expect(hovered.background).toBe(initial.background);
    expect(hovered.rowBackground).toBe(initial.rowBackground);
    expect(hovered.rect).toEqual(initial.rect);
    await page.screenshot({ path: resolve(screenshotDirectory, `${language}-desktop-hover.png`) });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(async () => (await readFeedback(link)).transform).toBe("none");
    expect(parseFloat((await readFeedback(link)).transition)).toBeLessThanOrEqual(0.00001);
    await page.mouse.move(0, 0);
    await link.focus();
    await page.keyboard.press("Tab");
    await expect.poll(async () => (await readFeedback(links.nth(1))).focus).toBe(true);
    const target = await links.nth(1).getAttribute("href");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${target}$`));
  });
}

test.describe("touch service interaction", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  for (const language of ["zh", "en"]) {
    test(`home services respond to touch and clear cancelled presses (${language})`, async ({ page, context }) => {
      await page.goto(`/${language}`);
      const link = page.locator(".scheme-a-services li a").first();
      await expect(page.locator(".scheme-a-services")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await link.scrollIntoViewIfNeeded();
      await link.click({ trial: true });
      const initial = await readFeedback(link);
      const rect = await link.boundingBox();
      expect(rect!.height).toBeGreaterThanOrEqual(44);
      const session = await context.newCDPSession(page);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: rect!.x + rect!.width / 2, y: rect!.y + rect!.height / 2 }],
      });
      await expect.poll(async () => (await readFeedback(link)).active).toBe(true);
      const pressed = await readFeedback(link);
      expect(pressed.transform).toBe("matrix(0.9, 0, 0, 0.9, 0, 0)");
      expect(pressed.arrowBackground).toBe("rgb(216, 184, 122)");
      expect(pressed.background).toBe(initial.background);
      expect(pressed.rowBackground).toBe(initial.rowBackground);
      await page.screenshot({ path: resolve(screenshotDirectory, `${language}-mobile-pressed.png`) });
      await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
      await expect.poll(async () => (await readFeedback(link)).active).toBe(false);
      await expect.poll(async () => (await readFeedback(link)).arrowBackground).toBe(initial.arrowBackground);
      await page.screenshot({ path: resolve(screenshotDirectory, `${language}-mobile-idle.png`) });
      const target = await link.getAttribute("href");
      await link.tap();
      await expect(page).toHaveURL(new RegExp(`${target}$`));
      await session.detach();
    });
  }
});

test("home service links fit all supported widths and languages", async ({ page }) => {
  for (const language of ["zh", "en"]) {
    await page.goto(`/${language}`);
    const links = page.locator(".scheme-a-services li a");
    await expect(links).toHaveCount(6);
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await links.evaluateAll((elements) => elements.map((element) => {
        const row = element.getBoundingClientRect();
        const title = element.querySelector("span")!.getBoundingClientRect();
        const summary = element.querySelector("small")!.getBoundingClientRect();
        return row.height >= 44 && row.left >= 0 && row.right <= window.innerWidth
          && title.right <= row.right && summary.right <= row.right && title.bottom <= summary.top;
      }));
      expect(layout, `${language} at ${width}px`).toEqual(Array(6).fill(true));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});
