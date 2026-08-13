import { expect, test } from "@playwright/test";

const publicPaths = [
  "/zh",
  "/zh/about",
  "/zh/services",
  "/zh/materials",
  "/zh/products",
  "/zh/promotions",
  "/zh/projects",
  "/zh/blog",
  "/zh/faq",
  "/zh/locations",
  "/zh/quote",
  "/zh/contact",
  "/zh/process",
];

const detailImageFrames = [
  { path: "/zh/services/renovation", selector: '[data-forest-page-hero="true"] .page-hero__media' },
  { path: "/zh/services/old-house", selector: '[data-forest-page-hero="true"] .page-hero__media' },
  { path: "/zh/materials/category/flooring", selector: '[data-forest-page-hero="true"] .page-hero__media' },
  { path: "/zh/materials/category/flooring/spc-vinyl", selector: '[data-forest-page-hero="true"] .page-hero__media' },
  { path: "/zh/materials/spc-flooring-natural-oak", selector: '[data-forest-page-hero="true"] .page-hero__media' },
  { path: "/zh/products/spc-flooring-natural-oak", selector: ".product-detail-opening__media" },
  { path: "/zh/projects/modern-condo-mont-kiara", selector: '[data-forest-page-hero="true"] .page-hero__media' },
  { path: "/zh/blog/how-to-plan-condo-renovation-kl", selector: '[data-forest-page-hero="true"] .page-hero__media' },
  { path: "/zh/locations/kuala-lumpur", selector: '[data-forest-page-hero="true"] .page-hero__media' },
];

const immersiveHeaderPaths = Array.from(new Set([
  ...publicPaths,
  ...detailImageFrames
    .filter(({ path }) => !path.startsWith("/zh/products/"))
    .map(({ path }) => path),
]));

const viewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "small-desktop", width: 1024, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
];

test.describe("public responsive layout", () => {
  for (const viewport of viewports) {
    for (const path of publicPaths) {
      test(`${viewport.name} ${path} has no horizontal overflow or broken text`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("load");
        await page.waitForTimeout(500);

        const result = await page.evaluate(() => {
          const root = document.documentElement;
          const bodyText = document.body.innerText;
          return {
            clientWidth: root.clientWidth,
            scrollWidth: root.scrollWidth,
            hasReplacementCharacter: bodyText.includes("�"),
          };
        });

        expect(result.hasReplacementCharacter).toBe(false);
        expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth + 1);
      });
    }
  }

  test("mobile header keeps stable height when language changes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.locator(".site-header__mobile-controls").waitFor({ state: "visible" });

    const readHeaderMetrics = () =>
      page.evaluate(() => {
        const measure = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing ${selector}`);
          const rect = element.getBoundingClientRect();
          return Math.round(rect.height);
        };

        return {
          header: measure(".site-header"),
          inner: measure(".site-header__inner"),
          controls: measure(".site-header__mobile-controls"),
          languageButton: measure(".site-header__mobile-button"),
        };
      });

    const before = await readHeaderMetrics();

    await page.locator(".site-header__mobile-button").first().click();
    await expect(page).toHaveURL(/\/en$/);
    await page.locator(".site-header__mobile-controls").waitFor({ state: "visible" });

    const after = await readHeaderMetrics();

    expect(after).toEqual(before);
  });

  test("final public theme changes the rendered palette", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/products", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const readTheme = () => page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      background: getComputedStyle(document.body).backgroundColor,
      foreground: getComputedStyle(document.body).color,
      shellBackground: getComputedStyle(document.querySelector(".forest-site-shell") as HTMLElement).backgroundColor,
    }));

    const before = await readTheme();
    await page.locator(".site-header__mobile-button").nth(1).click();
    await page.waitForTimeout(300);
    const after = await readTheme();

    expect(after.theme).not.toBe(before.theme);
    expect(after.background).not.toBe(before.background);
    expect(after.foreground).not.toBe(before.foreground);
    expect(after.shellBackground).not.toBe(before.shellBackground);
  });

  test("footer follows the final light and dark theme palettes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const readFooterTheme = () => page.evaluate(() => {
      const surface = document.querySelector(".footer-surface");
      const brandCopy = document.querySelector(".footer-brand-copy");
      const legal = document.querySelector(".footer-legal");
      const logo = document.querySelector(".footer-logo-card img");
      if (!surface || !brandCopy || !legal || !logo) throw new Error("Missing footer theme elements");

      return {
        theme: document.documentElement.dataset.theme,
        surface: getComputedStyle(surface).backgroundColor,
        brandCopy: getComputedStyle(brandCopy).color,
        legal: getComputedStyle(legal).color,
        logoFilter: getComputedStyle(logo).filter,
      };
    });

    const before = await readFooterTheme();
    await page.locator(".site-header__icon-action").click();
    await page.waitForTimeout(300);
    const after = await readFooterTheme();

    expect(after.theme).not.toBe(before.theme);
    expect(after.surface).not.toBe(before.surface);
    expect(after.brandCopy).not.toBe(before.brandCopy);
    expect(after.legal).not.toBe(before.legal);
    expect(after.logoFilter).not.toBe(before.logoFilter);
  });

  test("product catalog uses four, three and two columns", async ({ page }) => {
    const scenarios = [
      { width: 1440, height: 1000, columns: 4, minimumGap: 12 },
      { width: 768, height: 1024, columns: 3, minimumGap: 12 },
      { width: 390, height: 844, columns: 2, minimumGap: 10 },
    ];

    for (const scenario of scenarios) {
      await page.setViewportSize({ width: scenario.width, height: scenario.height });
      await page.goto("/zh/products", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      await expect(page.locator(".forest-product-catalog-card").first()).toBeVisible();

      const metrics = await page.locator(".forest-product-catalog-grid").evaluate((grid) => ({
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        columnGap: Number.parseFloat(getComputedStyle(grid).columnGap),
        overflow: grid.scrollWidth - grid.clientWidth,
        firstCardBorder: Number.parseFloat(getComputedStyle(grid.firstElementChild as Element).borderTopWidth),
      }));

      expect(metrics.columns).toBe(scenario.columns);
      expect(metrics.columnGap).toBeGreaterThanOrEqual(scenario.minimumGap);
      expect(metrics.firstCardBorder).toBeGreaterThanOrEqual(1);
      expect(metrics.overflow).toBeLessThanOrEqual(1);
    }
  });

  test("category filter rails use direct manipulation without carousel controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/projects", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const nav = page.locator(".forest-filter-nav");
    const rail = nav.locator(".forest-filter-nav__rail");
    await expect(nav).toBeVisible();
    await expect(nav.locator(".forest-filter-nav__control")).toHaveCount(0);

    const styles = await nav.evaluate((element) => {
      const item = element.querySelector<HTMLElement>(".forest-filter-nav__item")!;
      const railElement = element.querySelector<HTMLElement>(".forest-filter-nav__rail")!;
      return {
        navBorder: Number.parseFloat(getComputedStyle(element).borderTopWidth),
        itemBorderRight: Number.parseFloat(getComputedStyle(item).borderRightWidth),
        snapType: getComputedStyle(railElement).scrollSnapType,
        touchAction: getComputedStyle(railElement).touchAction,
        transition: getComputedStyle(item).transitionTimingFunction,
      };
    });
    expect(styles.navBorder).toBe(0);
    expect(styles.itemBorderRight).toBe(0);
    expect(styles.snapType).toBe("none");
    expect(styles.touchAction).toContain("pan-x");
    expect(styles.transition).toContain("cubic-bezier");

    const before = await rail.evaluate((element) => element.scrollLeft);
    const bounds = await rail.boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.move(bounds!.x + bounds!.width - 24, bounds!.y + bounds!.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds!.x + 24, bounds!.y + bounds!.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(420);
    const after = await rail.evaluate((element) => element.scrollLeft);

    expect(after).toBeGreaterThan(before);
    await expect(nav).toHaveClass(/forest-filter-nav--start/);

    const target = nav.locator(".forest-filter-nav__item").last();
    const indicator = nav.locator(".forest-filter-nav__active-indicator");
    const indicatorBefore = await indicator.evaluate((element) => getComputedStyle(element).transform);
    await target.click();
    await expect(target).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(460);
    const indicatorAfter = await indicator.evaluate((element) => getComputedStyle(element).transform);
    expect(indicatorAfter).not.toBe(indicatorBefore);
  });

  test("all media hero pages with the global header share its overlay state", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const path of immersiveHeaderPaths) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const header = page.locator(".site-header");
      const hero = page.locator('[data-immersive-hero="true"]');
      await expect(hero).toHaveCount(1);
      await expect(header).toHaveAttribute("data-header-state", "overlay");
      await expect(page.locator(".forest-site-shell")).toHaveAttribute("data-header-overlay", "true");
      await expect.poll(() => header.evaluate((element) => getComputedStyle(element, "::before").opacity)).toBe("0");

      const opening = await page.evaluate(() => {
        const headerElement = document.querySelector(".site-header");
        const heroElement = document.querySelector('[data-immersive-hero="true"]');
        if (!headerElement || !heroElement) throw new Error("Missing immersive header or hero");
        return {
          heroTop: Math.round(heroElement.getBoundingClientRect().top),
          headerBottom: Math.round(headerElement.getBoundingClientRect().bottom),
        };
      });
      expect(opening.heroTop).toBeLessThan(opening.headerBottom);

      await page.evaluate(() => window.scrollTo(0, 120));
      await expect(header).toHaveAttribute("data-header-state", "solid");
      await expect.poll(() => header.evaluate((element) => getComputedStyle(element, "::before").opacity)).toBe("1");
    }
  });

  test("pages without a media hero keep a solid header", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });

    for (const path of ["/zh/privacy", "/zh/terms"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const header = page.locator(".site-header");
      await expect(page.locator('[data-forest-page-hero="true"]')).toHaveCount(0);
      await expect(header).toHaveAttribute("data-header-state", "solid");
      await expect(page.locator(".forest-site-shell")).toHaveAttribute("data-header-overlay", "false");
      await expect.poll(() => header.evaluate((element) => getComputedStyle(element, "::before").opacity)).toBe("1");
    }
  });

  test("mobile immersive header uses independent transparent controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const metrics = await page.evaluate(() => {
      const controls = document.querySelector(".site-header__mobile-controls");
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".site-header__mobile-button"));
      if (!(controls instanceof HTMLElement) || buttons.length !== 3) throw new Error("Missing mobile header controls");

      const first = buttons[0].getBoundingClientRect();
      const second = buttons[1].getBoundingClientRect();
      return {
        controlsBackground: getComputedStyle(controls).backgroundColor,
        controlsBorderWidth: Number.parseFloat(getComputedStyle(controls).borderTopWidth),
        buttonBorderWidths: buttons.map((button) => Number.parseFloat(getComputedStyle(button).borderTopWidth)),
        buttonGap: Math.round(second.left - first.right),
      };
    });

    expect(metrics.controlsBackground).toBe("rgba(0, 0, 0, 0)");
    expect(metrics.controlsBorderWidth).toBe(0);
    expect(metrics.buttonBorderWidths).toEqual([1, 1, 1]);
    expect(metrics.buttonGap).toBeGreaterThanOrEqual(8);

    const header = page.locator(".site-header");
    await page.locator(".site-header__mobile-button").last().click();
    await expect(header).toHaveAttribute("data-header-state", "solid");
    await expect.poll(() => header.evaluate((element) => getComputedStyle(element, "::before").opacity)).toBe("1");
  });

  test("contact keeps the page-aware action navigation fixed throughout scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/contact", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const bottomNav = page.locator(".forest-bottom-nav");
    const actionBar = page.locator(".mobile-action-bar");
    await expect(actionBar).toBeVisible();
    await expect(bottomNav).toHaveCount(0);

    await page.locator(".page-hero").evaluate((hero) => {
      window.scrollTo(0, hero.getBoundingClientRect().height + 80);
    });

    await expect(actionBar).toBeVisible();
    await expect(bottomNav).toHaveCount(0);
    await page.evaluate(() => window.scrollBy(0, -180));
    await expect(actionBar).toBeVisible();
    await expect(bottomNav).toHaveCount(0);
    await actionBar.evaluate(async (nav) => {
      await Promise.all(nav.getAnimations().map((animation) => animation.finished));
    });

    const position = await actionBar.evaluate((nav) => ({
      position: getComputedStyle(nav).position,
      bottom: Math.round(window.innerHeight - nav.getBoundingClientRect().bottom),
    }));
    expect(position).toEqual({ position: "fixed", bottom: 0 });
  });

  test("mobile quote form keeps required fields semantic and submit action clear", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await expect(page.locator(".mobile-action-bar")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-mobile-action-bar", "true");
    await expect(page.locator("#quote-name")).toBeVisible();

    const fieldSemantics = await page.evaluate(() =>
      ["quote-name", "quote-phone", "quote-project-type", "quote-location"].map((id) => {
        const field = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
        return {
          id,
          required: Boolean(field?.required),
          ariaRequired: field?.getAttribute("aria-required"),
        };
      }),
    );

    expect(fieldSemantics).toEqual([
      { id: "quote-name", required: true, ariaRequired: "true" },
      { id: "quote-phone", required: true, ariaRequired: "true" },
      { id: "quote-project-type", required: true, ariaRequired: "true" },
      { id: "quote-location", required: true, ariaRequired: "true" },
    ]);

    const honeypot = await page.locator("#quote-website").evaluate((field) => ({
      tabIndex: (field as HTMLInputElement).tabIndex,
      autocomplete: field.getAttribute("autocomplete"),
      hasLayoutBox: field.getClientRects().length > 0,
    }));
    expect(honeypot).toEqual({ tabIndex: -1, autocomplete: "off", hasLayoutBox: false });

    const submitButton = page.getByRole("button", { name: "提交报价请求" });
    await submitButton.scrollIntoViewIfNeeded();
    const submitIsClickable = await submitButton.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const topElement = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return topElement === button || button.contains(topElement);
    });

    expect(submitIsClickable).toBe(true);
  });

  test("mobile footer contact link opens the contact page from the company panel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await page.locator("footer").scrollIntoViewIfNeeded();
    const companyPanel = page.locator(".footer-mobile-panel").filter({
      has: page.locator('a[href$="/zh/contact"]'),
    });

    await expect(companyPanel.locator(".footer-mobile-panel-body")).toHaveAttribute("aria-hidden", "true");
    await companyPanel.getByRole("button").click();
    await expect(companyPanel.locator(".footer-mobile-panel-body")).toHaveAttribute("aria-hidden", "false");

    const companyGrid = await companyPanel.locator(".footer-mobile-link-list").evaluate((list) => ({
      columns: getComputedStyle(list).gridTemplateColumns.split(" ").length,
      overflow: list.scrollWidth - list.clientWidth,
      minimumLinkHeight: Math.min(...Array.from(list.querySelectorAll("a"), (link) => link.getBoundingClientRect().height)),
    }));
    expect(companyGrid.columns).toBe(2);
    expect(companyGrid.overflow).toBeLessThanOrEqual(1);
    expect(companyGrid.minimumLinkHeight).toBeGreaterThanOrEqual(44);

    await companyPanel.locator('a[href$="/zh/contact"]').click();

    await expect(page).toHaveURL(/\/zh\/contact$/);
    await expect(page.locator("#contact-name")).toBeVisible();
  });

  test("mobile footer service and company panels expand into a readable two-column grid", async ({ page }) => {
    for (const scenario of [
      { width: 320, height: 800, path: "/zh", servicesTitle: "服务项目", companyTitle: "公司信息" },
      { width: 390, height: 844, path: "/zh", servicesTitle: "服务项目", companyTitle: "公司信息" },
      { width: 768, height: 1024, path: "/en", servicesTitle: "Services", companyTitle: "Company" },
    ]) {
      await page.setViewportSize({ width: scenario.width, height: scenario.height });
      await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      await page.locator("footer").scrollIntoViewIfNeeded();

      for (const title of [scenario.servicesTitle, scenario.companyTitle]) {
        const panel = page.locator(".footer-mobile-panel").filter({ has: page.getByRole("button", { name: title, exact: true }) });
        const trigger = panel.getByRole("button", { name: title, exact: true });
        const body = panel.locator(".footer-mobile-panel-body");
        const list = panel.locator(".footer-mobile-link-list");

        await expect(trigger).toHaveAttribute("aria-expanded", "false");
        await expect(trigger).toHaveAttribute("aria-controls", /.+/);
        await expect(body).toHaveAttribute("aria-hidden", "true");
        await trigger.click();
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
        await expect(body).toHaveAttribute("aria-hidden", "false");

        const metrics = await list.evaluate((element) => ({
          columns: getComputedStyle(element).gridTemplateColumns.split(" ").length,
          overflow: element.scrollWidth - element.clientWidth,
          minimumLinkHeight: Math.min(...Array.from(element.querySelectorAll("a"), (link) => link.getBoundingClientRect().height)),
          links: Array.from(element.querySelectorAll("a"), (link) => link.textContent?.trim()),
        }));

        expect(metrics.columns).toBe(2);
        expect(metrics.overflow).toBeLessThanOrEqual(1);
        expect(metrics.minimumLinkHeight).toBeGreaterThanOrEqual(44);
        expect(metrics.links.every(Boolean)).toBe(true);
      }
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".footer-workbench")).toBeVisible();
    await expect(page.locator(".footer-mobile-stack")).toBeHidden();
  });

  test("mobile footer ends directly behind the fixed navigation without phantom action-bar space", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/projects", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await expect(page.locator("html")).not.toHaveAttribute("data-mobile-action-bar", "true");
    await expect(page.locator(".mobile-action-bar")).toHaveCount(0);

    await expect.poll(async () => {
      await page.locator(".footer-surface").scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
      return page.evaluate(() => {
        const footer = document.querySelector(".footer-surface");
        const legal = document.querySelector(".footer-legal");
        const navigation = document.querySelector(".forest-bottom-nav");
        if (!footer || !legal || !navigation) throw new Error("Missing mobile footer regions");
        const footerRect = footer.getBoundingClientRect();
        const navigationRect = navigation.getBoundingClientRect();
        const legalGap = Math.round(navigationRect.top - legal.getBoundingClientRect().bottom);
        return footerRect.bottom >= navigationRect.bottom && legalGap >= 10 && legalGap <= 24;
      });
    }).toBe(true);
  });

  test("mobile quote and contact pages keep page-aware bottom actions visible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const scenario of [
      { path: "/zh/quote", formHref: "#quote-name", formLabel: "填写表单" },
      { path: "/zh/contact", formHref: "#contact-name", formLabel: "填写留言" },
    ]) {
      await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      await expect(page.locator(".page-hero")).toHaveAttribute("data-forest-page-hero", "true");
      await expect
        .poll(() => page.locator(".page-hero").evaluate((hero) => hero.getBoundingClientRect().height))
        .toBeLessThanOrEqual(620);

      const actionBar = page.locator(".mobile-action-bar");
      await expect(actionBar).toBeVisible();
      await expect(page.locator(".forest-bottom-nav")).toHaveCount(0);

      await page.locator(".page-hero").evaluate((hero) => {
        window.scrollTo(0, hero.getBoundingClientRect().height + 80);
      });

      await expect(actionBar).toBeVisible();
      await expect(actionBar.locator('a[href^="https://wa.me/"]')).toBeVisible();
      await expect(actionBar.locator('a[href^="tel:"]')).toBeVisible();
      await expect(actionBar.locator(`a[href="${scenario.formHref}"]`)).toHaveText(scenario.formLabel);
      await page.evaluate(() => window.scrollBy(0, -180));
      await expect(actionBar).toBeVisible();
      await actionBar.evaluate(async (nav) => {
        await Promise.all(nav.getAnimations().map((animation) => animation.finished));
      });

      const fixedBars = await page.evaluate(() => {
        const actionRect = document.querySelector(".mobile-action-bar")?.getBoundingClientRect();
        return {
          actionBottom: Math.round(window.innerHeight - (actionRect?.bottom ?? 0)),
          navigationCount: document.querySelectorAll(".forest-bottom-nav").length,
        };
      });
      expect(fixedBars).toEqual({ actionBottom: 0, navigationCount: 0 });
    }
  });

  test("all primary subpages use the final shared hero instead of legacy page openings", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });

    for (const path of publicPaths.filter((path) => path !== "/zh")) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const hero = page.locator('[data-forest-page-hero="true"]');
      await expect(hero).toHaveCount(1);

      const metrics = await hero.evaluate((element) => {
        const media = element.querySelector(".page-hero__media");
        const copy = element.querySelector(".page-hero__content");
        if (!media || !copy) throw new Error("Missing final hero regions");
        const mediaBox = media.getBoundingClientRect();
        const copyBox = copy.getBoundingClientRect();
        return {
          display: getComputedStyle(element).display,
          mediaStartsAfterCopy: mediaBox.left >= copyBox.right - 1,
          height: Math.round(element.getBoundingClientRect().height),
        };
      });

      expect(metrics.display).toBe("grid");
      expect(metrics.mediaStartsAfterCopy).toBe(true);
      expect(metrics.height).toBeGreaterThanOrEqual(700);
      expect(metrics.height).toBeLessThanOrEqual(720);
    }
  });

  test("every primary page uses the same hero image frame as the home page", async ({ page }) => {
    const paths = publicPaths.filter((path) => path !== "/zh");

    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/zh", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const homeFrame = await page.locator(".forest-home-hero__media").evaluate((media) => {
        const box = media.getBoundingClientRect();
        return { width: Math.round(box.width), height: Math.round(box.height) };
      });

      for (const path of paths) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("load");

        const pageFrame = await page.locator('[data-forest-page-hero="true"] .page-hero__media').evaluate((media) => {
          const box = media.getBoundingClientRect();
          return { width: Math.round(box.width), height: Math.round(box.height) };
        });

        expect(Math.abs(pageFrame.width - homeFrame.width), `${path} hero image width`).toBeLessThanOrEqual(1);
        expect(Math.abs(pageFrame.height - homeFrame.height), `${path} hero image height`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("detail pages use the same image frame as the home page", async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/zh", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const homeFrame = await page.locator(".forest-home-hero__media").evaluate((media) => {
        const box = media.getBoundingClientRect();
        return { width: Math.round(box.width), height: Math.round(box.height) };
      });

      for (const detail of detailImageFrames) {
        await page.goto(detail.path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("load");

        const pageFrame = await page.locator(detail.selector).evaluate((media) => {
          const box = media.getBoundingClientRect();
          return { width: Math.round(box.width), height: Math.round(box.height) };
        });

        expect(pageFrame, `${detail.path} hero image frame`).toEqual(homeFrame);
      }
    }
  });

  test("final hero copy, actions and trust signals keep readable contrast in both themes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const scenarios = [
      {
        path: "/zh/services/builtin",
        targets: [
          [".page-hero__back", ".page-hero__content"],
          [".page-hero__label", ".page-hero__content"],
          [".page-hero__title", ".page-hero__content"],
          [".page-hero__description", ".page-hero__content"],
          [".btn-on-dark-primary", ".btn-on-dark-primary"],
          [".btn-on-dark-secondary", ".btn-on-dark-secondary"],
          [".page-hero__meta--trust strong", ".page-hero__meta--trust > span"],
          [".page-hero__meta-text", ".page-hero__meta--trust > span"],
        ],
      },
      {
        path: "/zh/services/old-house",
        targets: [
          [".page-hero__title", ".page-hero__content"],
          [".page-hero__description", ".page-hero__content"],
          [".btn-on-dark-primary", ".btn-on-dark-primary"],
          [".btn-on-dark-secondary", ".btn-on-dark-secondary"],
        ],
      },
      {
        path: "/zh/projects/modern-condo-mont-kiara",
        targets: [
          [".page-hero__back", ".page-hero__content"],
          [".page-hero__title", ".page-hero__content"],
          [".page-hero__content .text-on-media-muted", ".page-hero__content"],
        ],
      },
      {
        path: "/zh/blog/how-to-plan-condo-renovation-kl",
        targets: [
          [".page-hero__back", ".page-hero__content"],
          [".page-hero__title", ".page-hero__content"],
          [".page-hero__content .text-on-media-muted", ".page-hero__content"],
        ],
      },
      {
        path: "/zh/locations/kuala-lumpur",
        targets: [
          [".page-hero__title", ".page-hero__content"],
          [".page-hero__description", ".page-hero__content"],
          [".btn-on-dark-primary", ".btn-on-dark-primary"],
          [".btn-on-dark-secondary", ".btn-on-dark-secondary"],
        ],
      },
      {
        path: "/zh",
        targets: [[".forest-trust-rail > div span", ".forest-trust-rail"]],
      },
      {
        path: "/zh/materials",
        targets: [
          [".forest-section-heading .forest-eyebrow", ".forest-chapter--raised"],
          [".forest-section-heading__copy > p:not(.forest-eyebrow)", ".forest-chapter--raised"],
        ],
      },
      {
        path: "/zh/quote",
        targets: [
          [".quote-form-guide__summary span", ".quote-form-guide__summary span"],
          [".quote-form-guide__text", ".forest-quote-form"],
        ],
      },
      {
        path: "/zh/materials/spc-flooring-natural-oak",
        targets: [[".page-hero__meta > span", ".page-hero__meta > span"]],
      },
      {
        path: "/zh/products/spc-flooring-natural-oak",
        targets: [[".home-footer-prelude__eyebrow", ".home-footer-prelude__panel"]],
      },
    ] as const;

    for (const theme of ["light", "dark"] as const) {
      await page.goto("/zh", { waitUntil: "domcontentloaded" });
      await page.evaluate((nextTheme) => window.localStorage.setItem("flashcast-public-theme", nextTheme), theme);

      for (const scenario of scenarios) {
        await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("load");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator(scenario.targets[0][0]).first()).toBeVisible();

        for (const [foregroundSelector, backgroundSelector] of scenario.targets) {
          const contrast = await page.evaluate(
            ({ foregroundSelector: foreground, backgroundSelector: background }) => {
              const foregroundElement = document.querySelector(foreground);
              const backgroundElement = document.querySelector(background);
              if (!foregroundElement || !backgroundElement) throw new Error(`Missing contrast target: ${foreground} / ${background}`);

              const parseColor = (value: string): [number, number, number, number] => {
                const rgb = value.match(/rgba?\(([^)]+)\)/);
                if (rgb) {
                  const channels = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
                  return [channels[0], channels[1], channels[2], channels[3] ?? 1];
                }

                const srgb = value.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?/);
                if (srgb) {
                  return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255, Number(srgb[4] ?? 1)];
                }

                throw new Error(`Unsupported color: ${value}`);
              };
              const composite = (foreground: number[], background: number[]) => {
                const alpha = foreground[3] + background[3] * (1 - foreground[3]);
                if (alpha === 0) return [0, 0, 0, 0];
                return [
                  (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
                  (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
                  (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
                  alpha,
                ];
              };
              const resolveBackground = (element: Element) => {
                const layers: number[][] = [];
                for (let current: Element | null = element; current; current = current.parentElement) {
                  layers.push(parseColor(getComputedStyle(current).backgroundColor));
                }

                return layers.reverse().reduce((background, layer) => composite(layer, background), [255, 255, 255, 1]);
              };
              const luminance = (channels: number[]) => {
                const linear = channels.map((channel) => {
                  const normalized = channel / 255;
                  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
                });
                return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
              };

              const resolvedBackground = resolveBackground(backgroundElement);
              const resolvedForeground = composite(parseColor(getComputedStyle(foregroundElement).color), resolvedBackground);
              const foregroundLuminance = luminance(resolvedForeground);
              const backgroundLuminance = luminance(resolvedBackground);
              return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
                / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
            },
            { foregroundSelector, backgroundSelector },
          );

          expect(contrast, `${theme} ${scenario.path} ${foregroundSelector}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test("detail pages inherit the immersive final-design header", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/zh/projects", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    const detailHref = await page.locator(".forest-project-row").first().getAttribute("href");
    expect(detailHref).toBeTruthy();

    await page.goto(detailHref!, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator(".forest-site-shell")).toHaveAttribute("data-header-overlay", "true");
    await expect(page.locator(".site-header")).toHaveAttribute("data-header-state", "overlay");
    await expect(page.locator('[data-forest-page-hero="true"]')).toHaveCount(1);
  });

  test("desktop contact and quote forms are not covered by the consultation prompt", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const path of ["/zh/contact", "/zh/quote"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.45));

      await expect(page.locator(".desktop-floating-cta__prompt")).toHaveCount(0);
      await expect(page.locator(".desktop-floating-cta__button")).toBeVisible();
    }
  });

  test("redesigned navigation panels remain visible and usable across desktop and mobile", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await page.getByRole("button", { name: "更多" }).click();
    const desktopMenu = page.locator(".site-header__more-menu");
    await expect(desktopMenu).toBeVisible();
    await expect(desktopMenu.locator(".site-header__more-link")).toHaveCount(8);
    await expect(desktopMenu.locator(".site-header__more-group")).toHaveCount(2);
    await expect(desktopMenu.locator(".site-header__more-footer a")).toBeVisible();
    await expect(page.locator(".desktop-floating-cta")).toBeHidden();

    const desktopMenuBox = await desktopMenu.boundingBox();
    expect(desktopMenuBox?.height).toBeGreaterThan(300);
    expect(desktopMenuBox?.y).toBeGreaterThanOrEqual(55);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.getByRole("button", { name: "打开导航菜单" }).click();

    const mobileMenu = page.locator(".mobile-navigation");
    await expect(mobileMenu).toBeVisible();
    await expect(mobileMenu.locator(".mobile-navigation__primary-link")).toHaveCount(5);
    await expect(mobileMenu.locator(".mobile-navigation__secondary-link")).toHaveCount(8);
    await expect(mobileMenu.locator(".mobile-navigation__quote")).toBeVisible();
    await expect(page.locator(".forest-bottom-nav")).toBeHidden();

    const mobileMetrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(mobileMetrics.scrollWidth).toBeLessThanOrEqual(mobileMetrics.innerWidth + 2);
  });

  test("mobile menu keeps dividers sparse instead of drawing a full grid", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.getByRole("button", { name: "打开导航菜单" }).click();

    const metrics = await page.evaluate(() => {
      const menu = document.querySelector(".mobile-navigation");
      const primaryGrid = document.querySelector(".mobile-navigation__primary-grid");
      const primaryLink = document.querySelector(".mobile-navigation__primary-link");
      const secondaryLink = document.querySelector(".mobile-navigation__secondary-link");
      const secondaryGroups = document.querySelectorAll<HTMLElement>(".mobile-navigation__secondary-group");
      const footer = document.querySelector(".mobile-navigation__footer");
      if (!menu || !primaryGrid || !primaryLink || !secondaryLink || secondaryGroups.length !== 2 || !footer) {
        throw new Error("Missing mobile menu structure");
      }

      const primaryGridStyle = getComputedStyle(primaryGrid);
      const primaryLinkStyle = getComputedStyle(primaryLink);
      return {
        menuBackgroundImage: getComputedStyle(menu).backgroundImage,
        primaryGridBorder: Number.parseFloat(primaryGridStyle.borderTopWidth),
        primaryGridBackground: primaryGridStyle.backgroundColor,
        primaryLinkBorders: [
          primaryLinkStyle.borderTopWidth,
          primaryLinkStyle.borderRightWidth,
          primaryLinkStyle.borderBottomWidth,
          primaryLinkStyle.borderLeftWidth,
        ].map(Number.parseFloat),
        secondaryLinkBorder: Number.parseFloat(getComputedStyle(secondaryLink).borderTopWidth),
        groupDivider: Number.parseFloat(getComputedStyle(secondaryGroups[1]).borderTopWidth),
        footerDivider: Number.parseFloat(getComputedStyle(footer).borderTopWidth),
      };
    });

    expect(metrics.menuBackgroundImage).not.toContain("90deg");
    expect(metrics.primaryGridBorder).toBe(0);
    expect(metrics.primaryGridBackground).toBe("rgba(0, 0, 0, 0)");
    expect(metrics.primaryLinkBorders).toEqual([0, 0, 0, 0]);
    expect(metrics.secondaryLinkBorder).toBe(0);
    expect(metrics.groupDivider).toBeGreaterThanOrEqual(1);
    expect(metrics.footerDivider).toBeGreaterThanOrEqual(1);
  });
});
