import { expect, test, type ConsoleMessage } from "@playwright/test";

const primaryRoutes = [
  "/zh",
  "/zh/about",
  "/zh/services",
  "/zh/services/renovation",
  "/zh/materials",
  "/zh/products",
  "/zh/promotions",
  "/zh/projects",
  "/zh/before-after",
  "/zh/blog",
  "/zh/faq",
  "/zh/locations",
  "/zh/quote",
  "/zh/contact",
  "/zh/process",
] as const;

const targetViewports = [
  { name: "mobile-320", width: 320, height: 720 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const ignoredConsoleErrorPatterns = [
  /favicon/i,
  /ResizeObserver loop/i,
  /net::ERR_ABORTED/i,
  /net::ERR_BLOCKED_BY_CLIENT/i,
];

test.describe("public responsive layout", () => {
  for (const viewport of targetViewports) {
    for (const route of primaryRoutes) {
      test(`${viewport.name} ${route} has no horizontal overflow or broken text`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main").first()).toBeVisible();

        const metrics = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyText: document.body.innerText,
          mainWidth: document.querySelector("main")?.getBoundingClientRect().width || 0,
        }));

        expect(metrics.scrollWidth - metrics.clientWidth, route).toBeLessThanOrEqual(1);
        expect(metrics.bodyText.includes("\uFFFD"), route).toBe(false);
        expect(metrics.mainWidth, route).toBeGreaterThan(0);
      });
    }
  }

  test("wide desktop keeps full-bleed chapters and readable inner rails", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });

    await expect(page.locator(".scheme-a-hero")).toBeVisible();
    await expect(page.locator(".scheme-a-principle")).toBeAttached();
    const metrics = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>(".scheme-a-hero");
      const chapter = document.querySelector<HTMLElement>(".scheme-a-principle");
      const headerRail = document.querySelector<HTMLElement>(".scheme-a-chrome__bar");
      if (!hero || !chapter || !headerRail) throw new Error("Missing Scheme A layout regions");
      const headerRect = headerRail.getBoundingClientRect();
      return {
        heroWidth: Math.round(hero.getBoundingClientRect().width),
        chapterWidth: Math.round(chapter.getBoundingClientRect().width),
        headerLeft: Math.round(headerRect.left),
        headerRight: Math.round(innerWidth - headerRect.right),
      };
    });

    expect(metrics.heroWidth).toBe(1440);
    expect(metrics.chapterWidth).toBe(1440);
    expect(metrics.headerLeft).toBeGreaterThanOrEqual(20);
    expect(metrics.headerRight).toBeGreaterThanOrEqual(20);
  });

  test("mobile home CTA separates the quote button from service regions with balanced whitespace", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });

    const contact = page.locator(".scheme-a-contact");
    const button = contact.locator(".scheme-a-button");
    const regions = contact.locator(".scheme-a-contact__regions");
    await contact.scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
    await expect(regions).toBeVisible();

    const metrics = await contact.evaluate((element) => {
      const button = element.querySelector<HTMLElement>(".scheme-a-button");
      const regions = element.querySelector<HTMLElement>(".scheme-a-contact__regions");
      const firstRegion = regions?.querySelector<HTMLElement>("span");
      if (!button || !regions || !firstRegion) throw new Error("Missing home CTA layout regions");

      const contactRect = element.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const regionsRect = regions.getBoundingClientRect();
      const firstRegionRect = firstRegion.getBoundingClientRect();
      const regionsStyle = getComputedStyle(regions);
      return {
        buttonToRegions: Math.round(regionsRect.top - buttonRect.bottom),
        regionsToBottom: Math.round(contactRect.bottom - firstRegionRect.bottom),
        borderTopWidth: regionsStyle.borderTopWidth,
        borderTopStyle: regionsStyle.borderTopStyle,
      };
    });

    expect(metrics.borderTopWidth).toBe("0px");
    expect(metrics.borderTopStyle).toBe("none");
    expect(metrics.buttonToRegions).toBeGreaterThanOrEqual(44);
    expect(metrics.buttonToRegions).toBeLessThanOrEqual(48);
    expect(metrics.regionsToBottom).toBeGreaterThanOrEqual(56);
    expect(metrics.regionsToBottom).toBeLessThanOrEqual(68);
  });

  test("mobile contact panels stay centered inside equal page gutters", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/contact", { waitUntil: "domcontentloaded" });

    const info = page.locator(".fc-route-contact-info");
    const form = page.locator(".fc-route-contact-form");
    await expect(info).toBeVisible();
    await expect(form).toBeVisible();

    const metrics = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const getGutters = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing contact panel: ${selector}`);
        const rect = element.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          right: Math.round(viewportWidth - rect.right),
          width: Math.round(rect.width),
        };
      };

      return {
        info: getGutters(".fc-route-contact-info"),
        form: getGutters(".fc-route-contact-form"),
      };
    });

    for (const panel of [metrics.info, metrics.form]) {
      expect(Math.abs(panel.left - panel.right)).toBeLessThanOrEqual(1);
      expect(panel.left).toBeGreaterThanOrEqual(20);
      expect(panel.width).toBeLessThanOrEqual(350);
    }
  });

  test("mobile contact actions reflow without squeezing the phone number", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/contact", { waitUntil: "domcontentloaded" });

    const phoneText = page.locator(".contact-detail-row__copy p", { hasText: "+60 11-2885 3888" }).first();
    const row = phoneText.locator("..").locator("..");
    const action = row.locator(".contact-detail-row__action");
    await expect(phoneText).toBeVisible();
    await expect(action).toBeVisible();

    const metrics = await row.evaluate((element) => {
      const copy = element.querySelector<HTMLElement>(".contact-detail-row__copy");
      const phone = copy?.querySelector<HTMLElement>("p");
      const action = element.querySelector<HTMLElement>(".contact-detail-row__action");
      if (!copy || !phone || !action) throw new Error("Missing contact row content");
      const range = document.createRange();
      range.selectNodeContents(phone);
      return {
        display: getComputedStyle(element).display,
        copyWidth: Math.round(copy.getBoundingClientRect().width),
        phoneLines: range.getClientRects().length,
        actionBelowCopy: action.getBoundingClientRect().top >= copy.getBoundingClientRect().bottom,
      };
    });

    expect(metrics.display).toBe("grid");
    expect(metrics.copyWidth).toBeGreaterThanOrEqual(180);
    expect(metrics.phoneLines).toBe(1);
    expect(metrics.actionBelowCopy).toBe(true);
  });

  test("mobile header keeps a stable control row when language changes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/about", { waitUntil: "domcontentloaded" });

    const header = page.locator(".scheme-a-chrome");
    const language = page.locator(".scheme-a-lang-pill").first();
    const menu = page.locator('button[aria-controls="scheme-a-directory"]');
    await expect(header).toBeVisible();
    await expect(language).toBeVisible();
    await expect(menu).toBeVisible();
    const before = await header.evaluate((element) => element.getBoundingClientRect().height);

    await language.click();
    await expect(page).toHaveURL(/\/en\/about$/);
    await expect(page.locator(".scheme-a-lang-pill").first()).toBeVisible();
    const after = await page.locator(".scheme-a-chrome").evaluate((element) => element.getBoundingClientRect().height);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
  });

  test("product catalog keeps its editorial grid and direct filter controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/products", { waitUntil: "domcontentloaded" });

    const grid = page.locator(".fc-route-grid");
    const filters = page.locator(".fc-route-filter button");
    await expect(grid).toBeVisible();
    await expect(filters.first()).toBeVisible();
    expect(await filters.count()).toBeGreaterThan(1);
    const mobileColumns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    expect(mobileColumns).toBe(1);

    await filters.nth(1).click();
    await expect(filters.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".fc-route-card").first()).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/zh/products", { waitUntil: "domcontentloaded" });
    const desktopColumns = await page.locator(".fc-route-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    expect(desktopColumns).toBe(3);
  });

  test("route heroes keep a loaded cover image inside a stable frame", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of ["/zh/about", "/zh/services", "/zh/projects", "/zh/contact"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const hero = page.locator(".fc-route-hero");
      const image = page.locator(".fc-route-hero-media img");
      await expect(hero).toBeVisible();
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);

      const frame = await hero.evaluate((element) => {
        const image = element.querySelector<HTMLImageElement>("img");
        return {
          height: element.getBoundingClientRect().height,
          imageHeight: image?.getBoundingClientRect().height || 0,
          objectFit: image ? getComputedStyle(image).objectFit : "",
        };
      });
      expect(frame.height, route).toBeGreaterThanOrEqual(route === "/zh/projects" ? 400 : 480);
      expect(frame.imageHeight / frame.height, route).toBeGreaterThanOrEqual(0.96);
      expect(frame.imageHeight / frame.height, route).toBeLessThanOrEqual(1.08);
      expect(frame.objectFit, route).toBe("cover");
    }
  });

  test("quote links can land directly on the accessible form heading", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/quote#quote-form", { waitUntil: "domcontentloaded" });

    const form = page.locator("#quote-form");
    const title = page.locator("#quote-form-title");
    const header = page.locator(".scheme-a-chrome");
    await expect(form).toBeVisible();
    await expect(title).toBeFocused();
    await expect.poll(() => title.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(180);
    await expect.poll(async () => {
      const titleTop = await title.evaluate((element) => element.getBoundingClientRect().top);
      const headerBottom = await header.evaluate((element) => element.getBoundingClientRect().bottom);
      return titleTop - headerBottom;
    }).toBeGreaterThanOrEqual(16);
  });

  test("quote form stays on a readable paper surface with semantic required fields", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });

    const form = page.locator(".fc-route-quote-form form");
    await expect(form).toBeVisible();
    await expect(page.locator("#quote-name")).toHaveAttribute("required", "");
    await expect(page.locator("#quote-phone")).toHaveAttribute("required", "");
    await expect(page.locator("#quote-project-type")).toHaveAttribute("required", "");
    await expect(page.locator("#quote-location")).toHaveAttribute("required", "");

    const surface = await form.evaluate((element) => {
      const wrapper = element.closest(".fc-route-quote-form-wrap");
      const panel = element.closest(".fc-route-quote-form");
      const label = element.querySelector("label");
      return {
        wrapperBackground: wrapper ? getComputedStyle(wrapper).backgroundColor : "missing",
        panelBackground: panel ? getComputedStyle(panel).backgroundColor : "missing",
        labelColor: label ? getComputedStyle(label).color : "missing",
      };
    });
    expect(surface.wrapperBackground).toBe("rgba(0, 0, 0, 0)");
    expect(surface.panelBackground).not.toBe("rgba(0, 0, 0, 0)");
    expect(surface.labelColor).toBe("rgb(247, 244, 238)");
  });

  test("Scheme A footer and mobile dock expose the complete navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });

    const footer = page.locator(".scheme-a-footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.locator(".scheme-a-footer__wordmark")).toContainText("FLASH");
    await expect(footer.locator(".scheme-a-footer__mobile-directory details")).toHaveCount(4);
    await expect(page.locator(".scheme-a-mobile-dock a")).toHaveCount(5);
    await expect(page.locator('.scheme-a-mobile-dock a[aria-current="page"]')).toHaveAttribute("href", "/zh");
  });

  test("primary pages stay free of unexpected console and page errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const onConsole = (message: ConsoleMessage) => {
      if (message.type() !== "error") return;
      if (ignoredConsoleErrorPatterns.some((pattern) => pattern.test(message.text()))) return;
      consoleErrors.push(message.text());
    };
    page.on("console", onConsole);
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const route of ["/zh", "/zh/services", "/zh/products", "/zh/projects", "/zh/quote", "/zh/contact"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main").first()).toBeVisible();
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
