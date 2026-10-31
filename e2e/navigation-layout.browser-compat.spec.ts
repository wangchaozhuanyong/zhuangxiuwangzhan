import { expect, test, type Page } from "@playwright/test";

const widths = [320, 360, 390, 768, 1024, 1179, 1180, 1200, 1280, 1365, 1366, 1440, 1920];
const languages = ["zh", "en", "ms"] as const;

// Keep geometry checks independent of a staging CMS being available. The actual
// public components, translations, fonts and fallback content still render.
test.beforeEach(async ({ page }) => {
  await page.route("**/rest/v1/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
});

const layoutProblems = (page: Page) => page.evaluate(() => {
  const problems: string[] = [];
  const bar = document.querySelector<HTMLElement>(".scheme-a-chrome__bar")!;
  const box = bar.getBoundingClientRect();
  const style = getComputedStyle(bar);
  const left = box.left + parseFloat(style.paddingLeft);
  const right = box.right - parseFloat(style.paddingRight);
  const visible = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden"
      && !element.closest('[aria-hidden="true"], [inert]');
  };
  const controls = Array.from(bar.querySelectorAll(
    ".scheme-a-chrome__brand, .scheme-a-chrome__primary > *, .scheme-a-chrome__actions > :not(.scheme-a-chrome__contacts), .scheme-a-chrome__contacts > *",
  )).filter(visible);
  controls.forEach((element, index) => {
    const rect = element.getBoundingClientRect();
    const label = element.getAttribute("aria-label") || element.textContent?.trim();
    if (rect.left < left - 1 || rect.right > right + 1) problems.push(`header outside: ${label}`);
    for (const other of controls.slice(index + 1)) {
      const otherRect = other.getBoundingClientRect();
      if (Math.min(rect.right, otherRect.right) - Math.max(rect.left, otherRect.left) > 1
        && Math.min(rect.bottom, otherRect.bottom) - Math.max(rect.top, otherRect.top) > 1) {
        problems.push(`header overlap: ${label} / ${other.textContent?.trim()}`);
      }
    }
  });
  const viewport = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > viewport + 1) problems.push("document horizontal overflow");
  for (const element of document.querySelectorAll(
    ".scheme-a-footer a, .scheme-a-footer button, .scheme-a-mobile-dock a, .scheme-a-directory a, .scheme-a-directory button, .language-drawer a, .language-drawer button",
  )) {
    if (!visible(element)) continue;
    const rect = element.getBoundingClientRect();
    if (rect.left < -1 || rect.right > viewport + 1) problems.push(`shared control outside: ${element.textContent?.trim()}`);
  }
  return problems;
});

const ready = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".scheme-a-chrome__brand")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
};

for (const language of languages) {
  test(`${language}: shared navigation fits desktop breakpoints and narrow phones`, async ({ page }) => {
    await ready(page, `/${language}`);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => layoutProblems(page), { message: `${language} at ${width}px` }).toEqual([]);
    }
    // Reverse the resize and retain a usable menu even when translated labels still need compact navigation.
    await page.setViewportSize({ width: 1180, height: 900 });
    await expect.poll(() => layoutProblems(page)).toEqual([]);
    await page.setViewportSize({ width: 1920, height: 900 });
    await expect(page.locator(".scheme-a-chrome__nav-more:visible, .scheme-a-chrome__menu-trigger--compact:visible")).toBeVisible();
  });

  test(`${language}: service, catalog, article and contact pages share the safe layout`, async ({ page }) => {
    for (const path of ["/services", "/projects", "/materials", "/blog/office-fit-out-me-it-planning-checklist-malaysia", "/furniture", "/contact"]) {
      await ready(page, `/${language}${path}`);
      for (const width of [360, 1180, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect.poll(() => layoutProblems(page), { message: `${language}${path} at ${width}px` }).toEqual([]);
      }
    }
  });
}

test("directory and language drawers fit narrow screens in every language", async ({ page }) => {
  for (const language of languages) {
    await ready(page, `/${language}/services`);
    for (const width of [320, 390, 768, 1180, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => layoutProblems(page)).toEqual([]);
      await page.locator(".scheme-a-chrome__nav-more:visible, .scheme-a-chrome__menu-trigger--compact:visible").click();
      await expect(page.locator(".scheme-a-directory")).toHaveAttribute("data-state", "open");
      await expect.poll(() => layoutProblems(page), { message: `${language} directory at ${width}px` }).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(page.locator(".scheme-a-directory")).toHaveAttribute("data-state", "closed");
      await page.locator(".language-selector--header").click();
      await expect(page.locator(".language-drawer")).toBeVisible();
      await expect.poll(() => layoutProblems(page), { message: `${language} languages at ${width}px` }).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(page.locator(".language-drawer")).toHaveCount(0);
    }
  }
});

test("navigation adapts to enlarged text and changing labels without losing menu access or focus", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await ready(page, "/zh");
  const navigation = page.locator(".scheme-a-chrome__primary");
  const desktopTrigger = page.locator(".scheme-a-chrome__nav-more");
  const compactTrigger = page.locator(".scheme-a-chrome__menu-trigger--compact");
  await expect(navigation).toBeVisible();
  await desktopTrigger.focus();
  const firstLink = navigation.locator("a").first();
  const originalLabel = await firstLink.textContent();
  await firstLink.evaluate((element) => { element.textContent = "Laman utama ".repeat(15); });
  await expect(compactTrigger).toBeVisible();
  await expect(compactTrigger).toBeFocused();
  await expect.poll(() => layoutProblems(page)).toEqual([]);
  await firstLink.evaluate((element, label) => { element.textContent = label; }, originalLabel);
  await expect(navigation).toBeVisible();
  await expect(desktopTrigger).toBeFocused();

  await page.setViewportSize({ width: 1180, height: 900 });
  await page.addStyleTag({ content: ".scheme-a-chrome__primary a, .scheme-a-chrome__nav-more { font-size: 20px !important; }" });
  await expect.poll(() => layoutProblems(page)).toEqual([]);
  const enlargedTextTrigger = page.locator(".scheme-a-chrome__nav-more:visible, .scheme-a-chrome__menu-trigger--compact:visible");
  await expect(enlargedTextTrigger).toBeVisible();
  await enlargedTextTrigger.click();
  await expect(page.locator(".scheme-a-directory")).toHaveAttribute("data-state", "open");
  await expect.poll(() => layoutProblems(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.locator(".scheme-a-directory")).toHaveAttribute("data-state", "closed");
  await expect(enlargedTextTrigger).toBeFocused();
});
