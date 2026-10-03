import { expect, test, type Page } from "@playwright/test";

const clearLanguagePreference = async (page: Page) => {
  await page.context().clearCookies();
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.context().cookies().then((cookies) => cookies.find(({ name }) => name === "flashcast_lang")?.value)).toBe("en");
  await page.evaluate(() => window.localStorage.removeItem("fc-lang"));
  await page.context().clearCookies();
};

test.describe("public language routing", () => {
  test("Chinese browser opens the Chinese home page and keeps advertising context", async ({ browser }) => {
    const context = await browser.newContext({ locale: "zh-CN" });
    const page = await context.newPage();
    await clearLanguagePreference(page);

    await page.goto("/?gclid=demo-click&utm_source=google#consultation", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/zh\?gclid=demo-click&utm_source=google#consultation$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await context.close();
  });

  test("English browser opens the English home page", async ({ browser }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();
    await clearLanguagePreference(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await context.close();
  });

  for (const width of [1440, 390]) {
    test(`Japanese first and Chinese second opens English at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({
        locale: "ja-JP",
        viewport: { width, height: 900 },
        extraHTTPHeaders: { "Accept-Language": "ja-JP,zh-CN;q=0.9,en;q=0.8" },
      });
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "languages", { get: () => ["ja-JP", "zh-CN", "en-US"] });
      });
      const page = await context.newPage();

      await page.goto("/?utm_source=language-test#consultation", { waitUntil: "domcontentloaded" });

      await expect(page).toHaveURL(/\/en\?utm_source=language-test#consultation$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("main")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

      await clearLanguagePreference(page);
      await page.goto("/services?utm_source=language-test#consultation", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/en\/services\?utm_source=language-test#consultation$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await context.close();
    });
  }

  test("manual Chinese selection persists over a Japanese browser preference", async ({ browser }) => {
    const context = await browser.newContext({ locale: "ja-JP" });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en$/);

    await page.locator('.scheme-a-language-option[lang="zh-CN"]:visible').first().click();

    await expect(page).toHaveURL(/\/zh$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect.poll(() => context.cookies().then((cookies) => cookies.find(({ name }) => name === "flashcast_lang")?.value)).toBe("zh");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/zh$/);
    await context.close();
  });

  test("saved user choice wins over browser language", async ({ browser }) => {
    const context = await browser.newContext({ locale: "zh-CN" });
    const page = await context.newPage();
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    await expect.poll(() => context.cookies().then((cookies) => cookies.find(({ name }) => name === "flashcast_lang")?.value)).toBe("en");
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/en$/);
    await context.close();
  });

  test("explicit language URL is never replaced by browser detection", async ({ browser }) => {
    const context = await browser.newContext({ locale: "zh-CN" });
    const page = await context.newPage();

    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await expect.poll(() => context.cookies().then((cookies) => cookies.find(({ name }) => name === "flashcast_lang")?.value)).toBe("zh");
    await page.goto("/en/services", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/en\/services$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await context.close();
  });
});
