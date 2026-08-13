import { expect, test, type Page } from "@playwright/test";

const clearLanguagePreference = async (page: Page) => {
  await page.context().clearCookies();
  await page.goto("/en", { waitUntil: "domcontentloaded" });
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

    await page.goto("/en/services", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/en\/services$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await context.close();
  });
});
