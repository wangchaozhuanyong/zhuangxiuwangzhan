import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

const compatPages = [
  {
    label: "zh home",
    path: "/zh",
    selectors: [".site-header__brand", "main", "footer", 'a[href^="tel:"]'],
    minTextLength: 800,
  },
  {
    label: "en home",
    path: "/en",
    selectors: [".site-header__brand", "main", "footer", 'a[href^="tel:"]'],
    minTextLength: 800,
  },
  {
    label: "services",
    path: "/zh/services",
    selectors: [".site-header__brand", "main", "footer", 'a[href*="/quote"]'],
    minTextLength: 800,
  },
  {
    label: "materials",
    path: "/zh/materials",
    selectors: [".site-header__brand", "main", "footer"],
    minTextLength: 500,
  },
  {
    label: "projects",
    path: "/zh/projects",
    selectors: [".site-header__brand", "main", "footer", 'a[href*="/quote"]'],
    minTextLength: 500,
  },
  {
    label: "quote form",
    path: "/zh/quote",
    selectors: ["main", "#quote-name", "#quote-phone", "#quote-project-type", "#quote-details"],
    minTextLength: 500,
  },
  {
    label: "contact form",
    path: "/zh/contact",
    selectors: ["main", "#contact-name", "#contact-phone", "#contact-message", 'a[href^="tel:"]'],
    minTextLength: 500,
  },
  {
    label: "process",
    path: "/zh/process",
    selectors: [".site-header__brand", "main", "footer"],
    minTextLength: 500,
  },
  {
    label: "admin login",
    path: "/admin",
    selectors: ['input[type="email"]', 'input[type="password"]', 'button[type="submit"]'],
    minTextLength: 100,
  },
];

const ignoredConsoleErrorPatterns = [
  /favicon/i,
  /ResizeObserver loop/i,
  /net::ERR_ABORTED/i,
  /net::ERR_BLOCKED_BY_CLIENT/i,
  /Cookie .+ has been rejected for invalid domain/i,
  /Image corrupt or truncated/i,
];

const hasVisibleElement = async (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((elements) =>
    elements.some((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    }),
  );

const expectCompatPage = async (page: Page, compatPage: (typeof compatPages)[number]) => {
  const consoleErrors: string[] = [];
  const collectConsoleError = (message: ConsoleMessage) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (ignoredConsoleErrorPatterns.some((pattern) => pattern.test(text))) return;
    consoleErrors.push(text);
  };

  page.on("console", collectConsoleError);

  try {
    const response = await page.goto(compatPage.path, { waitUntil: "domcontentloaded" });
    expect(response, `${compatPage.path} should return a document response`).not.toBeNull();
    expect(response!.ok(), `${compatPage.path} should return 2xx/3xx`).toBe(true);

    await page.waitForLoadState("load");
    await page.waitForTimeout(700);

    for (const selector of compatPage.selectors) {
      await expect
        .poll(() => hasVisibleElement(page, selector), { message: `${compatPage.path} requires ${selector}`, timeout: 10_000 })
        .toBe(true);
    }

    const result = await page.evaluate(() => {
      const root = document.documentElement;
      const bodyText = document.body.innerText;
      const visibleBrokenImages = Array.from(document.images).filter((image) => {
        const rect = image.getBoundingClientRect();
        const isVisible = rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.top < window.innerHeight;
        return isVisible && image.complete && image.naturalWidth === 0;
      });

      return {
        bodyTextLength: bodyText.trim().length,
        hasReplacementCharacter: bodyText.includes("\uFFFD"),
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        visibleBrokenImageCount: visibleBrokenImages.length,
        supportsCssGrid: CSS.supports("display", "grid"),
        supportsFlex: CSS.supports("display", "flex"),
        supportsClamp: CSS.supports("width", "clamp(1rem, 2vw, 2rem)"),
        supportsFetch: typeof window.fetch === "function",
      };
    });

    expect(result.bodyTextLength).toBeGreaterThanOrEqual(compatPage.minTextLength);
    expect(result.hasReplacementCharacter).toBe(false);
    expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth + 1);
    expect(result.visibleBrokenImageCount).toBe(0);
    expect(result.supportsCssGrid).toBe(true);
    expect(result.supportsFlex).toBe(true);
    expect(result.supportsClamp).toBe(true);
    expect(result.supportsFetch).toBe(true);
    expect(consoleErrors).toEqual([]);
  } finally {
    page.off("console", collectConsoleError);
  }
};

test.describe("mainstream browser compatibility", () => {
  test("core pages render and stay usable", async ({ page }) => {
    for (const compatPage of compatPages) {
      await expectCompatPage(page, compatPage);
    }
  });

  test("mobile menu and quote form accept basic interaction", async ({ page }) => {
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const mobileMenuButton = page.locator('button[aria-controls="mobile-navigation"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.locator("#mobile-navigation")).toBeVisible();
      await expect(page.locator('#mobile-navigation a[href*="/quote"]').first()).toBeVisible();
    }

    await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.locator("#quote-name").fill("Browser Test");
    await page.locator("#quote-phone").fill("+60123456789");
    await page.locator("#quote-location").fill("Kuala Lumpur");
    await page.locator("#quote-project-type").selectOption({ index: 1 });
    await page.locator("#quote-details").fill("Compatibility smoke test");

    await expect(page.locator("#quote-name")).toHaveValue("Browser Test");
    await expect(page.locator("#quote-phone")).toHaveValue("+60123456789");
    await expect(page.locator("#quote-location")).toHaveValue("Kuala Lumpur");
    await expect(page.locator("#quote-details")).toHaveValue("Compatibility smoke test");
  });
});
