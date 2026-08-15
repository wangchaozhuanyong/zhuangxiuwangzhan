import { expect, test } from "@playwright/test";

const publicPaths = [
  "/zh",
  "/zh/about",
  "/zh/services",
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
];

const detailImageFrames = [
  {
    path: "/zh/services/renovation",
    selector: '[data-forest-page-hero="true"] .page-hero__media',
  },
  {
    path: "/zh/services/old-house",
    selector: '[data-forest-page-hero="true"] .page-hero__media',
  },
  {
    path: "/zh/materials/category/flooring",
    selector: '[data-forest-page-hero="true"] .page-hero__media',
  },
  {
    path: "/zh/materials/category/flooring/spc-vinyl",
    selector: '[data-forest-page-hero="true"] .page-hero__media',
  },
  {
    path: "/zh/materials/spc-flooring-natural-oak",
    selector: '[data-forest-page-hero="true"] .page-hero__media',
  },
  {
    path: "/zh/products/spc-flooring-natural-oak",
    selector: ".product-detail-opening__media",
  },
  {
    path: "/zh/projects/modern-condo-mont-kiara",
    selector: '[data-forest-page-hero="true"] .page-hero__media',
  },
  {
    path: "/zh/blog/how-to-plan-condo-renovation-kl",
    selector: '[data-forest-page-hero="true"] .page-hero__media',
  },
  {
    path: "/zh/locations/kuala-lumpur",
    selector: '[data-forest-page-hero="true"] .page-hero__media',
  },
];

const immersiveHeaderPaths = Array.from(new Set([...publicPaths, ...detailImageFrames.filter(({ path }) => !path.startsWith("/zh/products/")).map(({ path }) => path)]));

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
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
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

  test("wide desktop uses full-bleed page bands with readable inner rails", async ({ page }) => {
    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 2560, height: 1200 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/zh", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      await expect(page.locator(".forest-home-hero")).toBeVisible();
      await expect(page.locator(".forest-home > .forest-chapter").first()).toBeVisible();
      await expect(page.locator(".site-header__nav-link--active")).toHaveCSS("box-shadow", "none");

      const homeMetrics = await page.evaluate(() => {
        const measure = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) throw new Error(`Missing ${selector}`);
          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            left: Math.round(box.left),
            width: Math.round(box.width),
            borderLeft: Number.parseFloat(style.borderLeftWidth),
            borderRight: Number.parseFloat(style.borderRightWidth),
          };
        };

        const activeLink = document.querySelector<HTMLElement>(".site-header__nav-link--active");
        if (!activeLink) throw new Error("Missing active desktop navigation link");

        return {
          viewportWidth: document.documentElement.clientWidth,
          headerInner: measure(".site-header__inner"),
          hero: measure(".forest-home-hero"),
          chapter: measure(".forest-home > .forest-chapter"),
          activeLink: {
            borderLeft: Number.parseFloat(getComputedStyle(activeLink).borderLeftWidth),
            borderRight: Number.parseFloat(getComputedStyle(activeLink).borderRightWidth),
            boxShadow: getComputedStyle(activeLink).boxShadow,
          },
        };
      });

      expect(homeMetrics.hero.left).toBe(0);
      expect(homeMetrics.hero.width).toBe(homeMetrics.viewportWidth);
      expect(homeMetrics.hero.borderLeft).toBe(0);
      expect(homeMetrics.hero.borderRight).toBe(0);
      expect(homeMetrics.chapter.left).toBe(0);
      expect(homeMetrics.chapter.width).toBe(homeMetrics.viewportWidth);
      expect(homeMetrics.chapter.borderLeft).toBe(0);
      expect(homeMetrics.chapter.borderRight).toBe(0);
      expect(homeMetrics.headerInner.width).toBeLessThanOrEqual(1760);
      expect(Math.abs(homeMetrics.headerInner.left - (homeMetrics.viewportWidth - homeMetrics.headerInner.width) / 2)).toBeLessThanOrEqual(1);
      expect(homeMetrics.activeLink).toEqual({ borderLeft: 0, borderRight: 0, boxShadow: "none" });

      await page.goto("/zh/projects", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      await expect(page.locator(".page-hero")).toBeVisible();
      await expect(page.locator(".forest-listing-chapter")).toBeVisible();

      const projectMetrics = await page.evaluate(() => {
        const hero = document.querySelector<HTMLElement>(".page-hero");
        const chapter = document.querySelector<HTMLElement>(".forest-listing-chapter");
        if (!hero || !chapter) throw new Error("Missing project page layout regions");
        const heroBox = hero.getBoundingClientRect();
        const chapterBox = chapter.getBoundingClientRect();
        return {
          viewportWidth: document.documentElement.clientWidth,
          heroLeft: Math.round(heroBox.left),
          heroWidth: Math.round(heroBox.width),
          chapterLeft: Math.round(chapterBox.left),
          chapterWidth: Math.round(chapterBox.width),
          featuredCount: document.querySelectorAll(".forest-project-row--wide").length,
        };
      });

      expect(projectMetrics.heroLeft).toBe(0);
      expect(projectMetrics.heroWidth).toBe(projectMetrics.viewportWidth);
      expect(projectMetrics.chapterLeft).toBe(0);
      expect(projectMetrics.chapterWidth).toBe(projectMetrics.viewportWidth);
      expect(projectMetrics.featuredCount).toBeLessThanOrEqual(1);
    }

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/zh/projects/modern-condo-mont-kiara", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator(".forest-project-detail-page > .section-padding > .container-narrow > .grid")).toBeVisible();
    await expect(page.locator(".forest-project-detail-page .prose")).toBeVisible();

    const detailMetrics = await page.evaluate(() => {
      const grid = document.querySelector<HTMLElement>(".forest-project-detail-page > .section-padding > .container-narrow > .grid");
      const prose = document.querySelector<HTMLElement>(".forest-project-detail-page .prose");
      if (!grid || !prose) throw new Error("Missing project detail reading layout");
      return {
        gridWidth: Math.round(grid.getBoundingClientRect().width),
        proseWidth: Math.round(prose.getBoundingClientRect().width),
      };
    });

    expect(detailMetrics.gridWidth).toBeLessThanOrEqual(1408);
    expect(detailMetrics.proseWidth).toBeLessThanOrEqual(736);

    await page.goto("/zh/contact", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator(".forest-contact-body")).toBeVisible();
    await expect(page.locator(".forest-contact-layout")).toBeVisible();
    const contactMetrics = await page.evaluate(() => {
      const body = document.querySelector<HTMLElement>(".forest-contact-body");
      const layout = document.querySelector<HTMLElement>(".forest-contact-layout");
      if (!body || !layout) throw new Error("Missing contact layout");
      return {
        viewportWidth: document.documentElement.clientWidth,
        bodyWidth: Math.round(body.getBoundingClientRect().width),
        layoutWidth: Math.round(layout.getBoundingClientRect().width),
      };
    });

    expect(contactMetrics.bodyWidth).toBe(contactMetrics.viewportWidth);
    expect(contactMetrics.layoutWidth).toBeLessThanOrEqual(1440);
  });

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

    const readTheme = () =>
      page.evaluate(() => ({
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

    const readFooterTheme = () =>
      page.evaluate(() => {
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
      await page.setViewportSize({
        width: scenario.width,
        height: scenario.height,
      });
      await page.goto("/zh/products", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      await expect(page.locator(".forest-product-catalog-card").first()).toBeVisible();
      await expect(page.locator(".forest-products-page .forest-listing-meta")).toHaveCount(0);

      const metrics = await page.locator(".forest-product-catalog-grid").evaluate((grid) => ({
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        columnGap: Number.parseFloat(getComputedStyle(grid).columnGap),
        overflow: grid.scrollWidth - grid.clientWidth,
        firstCardBorder: Number.parseFloat(getComputedStyle(grid.firstElementChild as Element).borderTopWidth),
        filterGap: Math.round(grid.getBoundingClientRect().top - document.querySelector(".forest-filter-nav")!.getBoundingClientRect().bottom),
        imageFrames: [...grid.querySelectorAll<HTMLElement>(".forest-listing-card__media")]
          .slice(0, 4)
          .map((media) => {
            const box = media.getBoundingClientRect();
            return { width: Math.round(box.width), height: Math.round(box.height) };
          }),
      }));

      expect(metrics.columns).toBe(scenario.columns);
      expect(metrics.columnGap).toBeGreaterThanOrEqual(scenario.minimumGap);
      expect(metrics.firstCardBorder).toBeGreaterThanOrEqual(1);
      expect(metrics.overflow).toBeLessThanOrEqual(1);
      expect(metrics.filterGap).toBeGreaterThanOrEqual(24);
      expect(metrics.filterGap).toBeLessThanOrEqual(40);
      expect(metrics.imageFrames.length).toBeGreaterThan(0);
      for (const frame of metrics.imageFrames) {
        expect(Math.abs(frame.width - frame.height)).toBeLessThanOrEqual(1);
      }
    }
  });

  test("mobile home hero keeps a horizontal title and a generous 5:4 image", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator(".forest-home-hero h1")).toBeVisible();

    const metrics = await page.evaluate(() => {
      const media = document.querySelector<HTMLElement>(".forest-home-hero__media");
      const copy = document.querySelector<HTMLElement>(".forest-home-hero__copy");
      const title = document.querySelector<HTMLElement>(".forest-home-hero h1");
      if (!media || !copy || !title) throw new Error("Missing mobile home hero");
      const mediaBox = media.getBoundingClientRect();
      const copyBox = copy.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      return {
        mediaRatio: mediaBox.width / mediaBox.height,
        copyWidth: Math.round(copyBox.width),
        titleWidth: Math.round(titleBox.width),
        titleHeight: Math.round(titleBox.height),
      };
    });

    expect(metrics.mediaRatio).toBeCloseTo(5 / 4, 1);
    expect(metrics.copyWidth).toBeGreaterThanOrEqual(374);
    expect(metrics.titleWidth).toBeGreaterThanOrEqual(300);
    expect(metrics.titleHeight).toBeLessThanOrEqual(200);
  });

  test("shared consultation blocks omit eyebrow copy and stay centered on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const scenarios = [
      {
        path: "/zh/before-after",
        prefix: "subpage-cta",
        singleLineTitle: true,
      },
      { path: "/zh/materials", prefix: "subpage-cta", singleLineTitle: false },
      {
        path: "/zh/products/spc-flooring-natural-oak",
        prefix: "home-footer-prelude",
        singleLineTitle: false,
      },
    ] as const;

    for (const scenario of scenarios) {
      await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const panel = page.locator(`.${scenario.prefix}__panel`).last();
      const title = panel.locator(`.${scenario.prefix}__title`);
      await expect(panel).toBeVisible();
      await expect(title).toBeVisible();
      await expect(panel.locator(`.${scenario.prefix}__eyebrow`)).toHaveCount(0);

      const metrics = await panel.evaluate(
        (element, { prefix }) => {
          const copy = element.querySelector<HTMLElement>(`.${prefix}__copy`)!;
          const heading = element.querySelector<HTMLElement>(`.${prefix}__title`)!;
          const actions = element.querySelector<HTMLElement>(`.${prefix}__actions`)!;
          const buttons = [...element.querySelectorAll<HTMLElement>(`.${prefix}__button`)];
          const panelRect = element.getBoundingClientRect();
          const copyRect = copy.getBoundingClientRect();
          const titleRect = heading.getBoundingClientRect();
          const actionsRect = actions.getBoundingClientRect();
          const lineHeight = Number.parseFloat(getComputedStyle(heading).lineHeight);

          return {
            copyCenterDelta: Math.abs(copyRect.left + copyRect.width / 2 - (panelRect.left + panelRect.width / 2)),
            titleCenterDelta: Math.abs(titleRect.left + titleRect.width / 2 - (copyRect.left + copyRect.width / 2)),
            actionsCenterDelta: Math.abs(actionsRect.left + actionsRect.width / 2 - (panelRect.left + panelRect.width / 2)),
            titleLineCount: Math.round(titleRect.height / lineHeight),
            titleTextAlign: getComputedStyle(heading).textAlign,
            buttonWidths: buttons.map((button) => Math.round(button.getBoundingClientRect().width)),
          };
        },
        { prefix: scenario.prefix },
      );

      expect(metrics.copyCenterDelta).toBeLessThanOrEqual(1);
      expect(metrics.titleCenterDelta).toBeLessThanOrEqual(1);
      expect(metrics.actionsCenterDelta).toBeLessThanOrEqual(1);
      expect(metrics.titleTextAlign).toBe("center");
      expect(new Set(metrics.buttonWidths).size).toBe(1);
      if (scenario.singleLineTitle) expect(metrics.titleLineCount).toBe(1);
    }
  });

  test("mobile subpages use one continuous surface hierarchy", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator(".forest-quote-form")).toBeVisible();

    const quoteMetrics = await page.evaluate(() => {
      const readBox = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          borderTop: Number.parseFloat(style.borderTopWidth),
          borderRight: Number.parseFloat(style.borderRightWidth),
          borderBottom: Number.parseFloat(style.borderBottomWidth),
          borderLeft: Number.parseFloat(style.borderLeftWidth),
        };
      };

      const headingRule = document.querySelector<HTMLElement>(".forest-quote-form .subpage-local-heading .accent-line");
      const steps = document.querySelector<HTMLElement>(".forest-quote-form .quote-form-steps");
      const firstSection = document.querySelector<HTMLElement>(".forest-quote-form form > .quote-form-section-label:first-child");
      if (!headingRule || !steps || !firstSection) throw new Error("Missing quote hierarchy elements");

      return {
        layout: readBox(".forest-quote-layout"),
        formWrap: readBox(".forest-quote-form-wrap"),
        guide: readBox(".forest-quote-form .quote-form-guide"),
        headingRuleDisplay: getComputedStyle(headingRule).display,
        stepColumns: getComputedStyle(steps).gridTemplateColumns.split(" ").length,
        firstSectionBorderTop: Number.parseFloat(getComputedStyle(firstSection).borderTopWidth),
      };
    });

    expect(quoteMetrics.layout).toEqual({
      background: "rgba(0, 0, 0, 0)",
      borderTop: 0,
      borderRight: 0,
      borderBottom: 0,
      borderLeft: 0,
    });
    expect(quoteMetrics.formWrap.background).toBe("rgba(0, 0, 0, 0)");
    expect(quoteMetrics.guide.background).toBe("rgba(0, 0, 0, 0)");
    expect(quoteMetrics.guide.borderRight).toBe(0);
    expect(quoteMetrics.guide.borderLeft).toBe(0);
    expect(quoteMetrics.headingRuleDisplay).toBe("none");
    expect(quoteMetrics.stepColumns).toBe(3);
    expect(quoteMetrics.firstSectionBorderTop).toBe(0);

    const chapterPaths = ["/zh/contact", "/zh/faq", "/zh/services", "/zh/materials", "/zh/about"];
    for (const path of chapterPaths) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const chapters = page.locator(".public-main--subpage > main > .forest-chapter, .public-main--subpage > main > .forest-contact-body");
      await expect(chapters.first()).toBeVisible();
      const borders = await chapters.evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return {
            right: Number.parseFloat(style.borderRightWidth),
            bottom: Number.parseFloat(style.borderBottomWidth),
            left: Number.parseFloat(style.borderLeftWidth),
          };
        }),
      );

      for (const border of borders) {
        expect(border).toEqual({ right: 0, bottom: 0, left: 0 });
      }
    }

    const detailSurfaces = [
      {
        path: "/zh/projects/modern-condo-mont-kiara",
        selector: ".forest-project-detail-page > .section-padding > .container-narrow > .grid",
      },
      {
        path: "/zh/blog/how-to-plan-condo-renovation-kl",
        selector: ".forest-blog-detail-page > .section-padding > .container-narrow",
      },
      {
        path: "/zh/materials/spc-flooring-natural-oak",
        selector: ".forest-material-detail-page .material-detail-showcase",
      },
    ] as const;

    for (const detail of detailSurfaces) {
      await page.goto(detail.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      const surface = page.locator(detail.selector).first();
      await expect(surface).toBeVisible();

      const style = await surface.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          background: computed.backgroundColor,
          top: Number.parseFloat(computed.borderTopWidth),
          right: Number.parseFloat(computed.borderRightWidth),
          bottom: Number.parseFloat(computed.borderBottomWidth),
          left: Number.parseFloat(computed.borderLeftWidth),
        };
      });
      expect(style).toEqual({
        background: "rgba(0, 0, 0, 0)",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      });
    }

    await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    const footerPrelude = page.locator(".home-footer-prelude");
    const footerPreludePanel = footerPrelude.locator(".home-footer-prelude__panel");
    await expect(footerPreludePanel).toBeVisible();
    await expect(footerPrelude).toHaveCSS("border-top-width", "0px");
    await expect(footerPrelude).toHaveCSS("border-bottom-width", "0px");
    await expect(footerPreludePanel).toHaveCSS("border-top-width", "0px");
    await expect(footerPreludePanel).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    const mobileDock = page.locator(".mobile-bottom-dock");
    await expect(mobileDock).toBeVisible();
    const dockBox = await mobileDock.boundingBox();
    expect(dockBox).not.toBeNull();
    expect(Math.abs(dockBox!.y + dockBox!.height - 844)).toBeLessThanOrEqual(1);
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

    await nav.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const top = box.top + window.scrollY - (window.innerHeight - box.height) / 2;
      window.scrollTo({ top, behavior: "instant" });
    });
    const before = await rail.evaluate((element) => element.scrollLeft);
    const bounds = await rail.boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.move(bounds!.x + bounds!.width - 24, bounds!.y + bounds!.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds!.x + 24, bounds!.y + bounds!.height / 2, {
      steps: 8,
    });
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

  test("all media hero pages place the solid header above the hero", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const path of immersiveHeaderPaths) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const header = page.locator(".site-header");
      const hero = page.locator('[data-immersive-hero="true"]');
      await expect(hero).toHaveCount(1);
      await expect(header).toHaveAttribute("data-header-state", "solid");
      await expect(page.locator(".forest-site-shell")).toHaveAttribute("data-header-overlay", "false");
      const headerStyle = await header.evaluate((element) => ({
        backgroundColor: getComputedStyle(element).backgroundColor,
        surfaceColor: getComputedStyle(element, "::before").backgroundColor,
        surfaceOpacity: getComputedStyle(element, "::before").opacity,
      }));
      expect(headerStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(headerStyle.surfaceColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(headerStyle.surfaceOpacity).toBe("1");

      const opening = await page.evaluate(() => {
        const headerElement = document.querySelector(".site-header");
        const heroElement = document.querySelector('[data-immersive-hero="true"]');
        if (!headerElement || !heroElement) throw new Error("Missing immersive header or hero");
        return {
          heroTop: Math.round(heroElement.getBoundingClientRect().top),
          headerBottom: Math.round(headerElement.getBoundingClientRect().bottom),
        };
      });
      expect(opening.heroTop).toBeGreaterThanOrEqual(opening.headerBottom);

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

  test("mobile header keeps independent controls on its own row", async ({ page }) => {
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

  test("contact keeps five-item navigation fixed and reveals actions only while scrolling up", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/contact", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const bottomNav = page.locator(".forest-bottom-nav");
    const actionBar = page.locator(".mobile-action-bar");
    const bottomDock = page.locator(".mobile-bottom-dock");
    await expect(bottomDock).toBeVisible();
    await expect(actionBar).toHaveCount(0);
    await expect(bottomNav).toBeVisible();
    await expect(page.locator(".forest-contact-page .subpage-local-heading .accent-line")).toHaveCount(0);

    await page.locator(".page-hero").evaluate((hero) => {
      window.scrollTo(0, hero.getBoundingClientRect().height + 80);
    });

    await expect(actionBar).toBeVisible();
    await expect(bottomNav).toBeVisible();
    await expect(actionBar.locator('a[href^="https://wa.me/"]')).toBeVisible();
    await expect(actionBar.locator('a[href^="tel:"]')).toBeVisible();
    await expect(actionBar.locator('a[href="#contact-name"]')).toHaveText("填写留言");
    await actionBar.evaluate(async (nav) => {
      await Promise.all(nav.getAnimations().map((animation) => animation.finished));
    });

    const position = await bottomDock.evaluate((dock) => {
      const actionRect = dock.querySelector(".mobile-action-bar")?.getBoundingClientRect();
      const navigationRect = dock.querySelector(".forest-bottom-nav")?.getBoundingClientRect();
      return {
        position: getComputedStyle(dock).position,
        dockBottom: Math.round(window.innerHeight - dock.getBoundingClientRect().bottom),
        navigationBottom: Math.round(window.innerHeight - (navigationRect?.bottom ?? 0)),
        stackGap: Math.round((navigationRect?.top ?? 0) - (actionRect?.bottom ?? 0)),
      };
    });
    expect(position).toEqual({ position: "fixed", dockBottom: 0, navigationBottom: 0, stackGap: 0 });

    await page.evaluate(() => window.scrollBy(0, -180));
    await expect(actionBar).toHaveCount(0);
    await expect(bottomNav).toBeVisible();
  });

  test("mobile bottom dock stays mounted when navigating from home to contact", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const bottomDock = page.locator(".mobile-bottom-dock");
    await expect(bottomDock).toBeVisible();
    await expect(page.locator(".forest-bottom-nav")).toBeVisible();
    await bottomDock.evaluate((dock) => dock.setAttribute("data-route-stability-check", "mounted"));

    await page.locator('.forest-bottom-nav a[href="/zh/contact"]').click();
    await expect(page).toHaveURL(/\/zh\/contact$/);
    await expect(bottomDock).toHaveAttribute("data-route-stability-check", "mounted");
    await expect(page.locator(".mobile-action-bar")).toHaveCount(0);
    await expect(page.locator(".forest-bottom-nav")).toBeVisible();

    const position = await bottomDock.evaluate((dock) => ({
      position: getComputedStyle(dock).position,
      bottom: Math.round(window.innerHeight - dock.getBoundingClientRect().bottom),
    }));
    expect(position).toEqual({ position: "fixed", bottom: 0 });
  });

  test("mobile bottom navigation restores each page's previous scroll position", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
    });

    const paths = ["/zh", "/zh/projects", "/zh/products", "/zh/promotions", "/zh/contact"];
    const savedPositions = new Map<string, number>();
    const bottomNav = page.locator(".forest-bottom-nav");

    for (const [index, path] of paths.entries()) {
      if (index > 0) {
        await bottomNav.locator(`a[href="${path}"]`).click();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(bottomNav.locator(`a[href="${path}"]`)).toHaveAttribute("aria-current", "page");
        await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeLessThanOrEqual(1);
      }

      await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(1200);
      const savedPosition = await page.evaluate((offset) => {
        const maximumPosition = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.min(maximumPosition, 560 + offset * 90));
        return Math.round(window.scrollY);
      }, index);
      expect(savedPosition).toBeGreaterThan(200);
      savedPositions.set(path, savedPosition);
    }

    for (const path of paths) {
      await bottomNav.locator(`a[href="${path}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      const savedPosition = savedPositions.get(path)!;
      await expect
        .poll(() => page.evaluate((target) => Math.abs(Math.round(window.scrollY) - target), savedPosition))
        .toBeLessThanOrEqual(2);
    }
  });

  test("mobile quote form keeps required fields semantic and submit action clear", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await expect(page.locator(".mobile-action-bar")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-mobile-action-bar", "true");
    await expect(page.locator(".forest-bottom-nav")).toBeVisible();
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
    expect(honeypot).toEqual({
      tabIndex: -1,
      autocomplete: "off",
      hasLayoutBox: false,
    });

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
      {
        width: 320,
        height: 800,
        path: "/zh",
        servicesTitle: "服务项目",
        companyTitle: "公司信息",
      },
      {
        width: 390,
        height: 844,
        path: "/zh",
        servicesTitle: "服务项目",
        companyTitle: "公司信息",
      },
      {
        width: 768,
        height: 1024,
        path: "/en",
        servicesTitle: "Services",
        companyTitle: "Company",
      },
    ]) {
      await page.setViewportSize({
        width: scenario.width,
        height: scenario.height,
      });
      await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      await page.locator("footer").scrollIntoViewIfNeeded();

      for (const title of [scenario.servicesTitle, scenario.companyTitle]) {
        const panel = page.locator(".footer-mobile-panel").filter({
          has: page.getByRole("button", { name: title, exact: true }),
        });
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

    await expect
      .poll(async () => {
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
      })
      .toBe(true);
  });

  test("mobile quote keeps page-aware actions stacked above the fixed navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator(".page-hero")).toHaveAttribute("data-forest-page-hero", "true");
    await expect.poll(() => page.locator(".page-hero").evaluate((hero) => hero.getBoundingClientRect().height)).toBeGreaterThanOrEqual(640);
    await expect.poll(() => page.locator(".page-hero").evaluate((hero) => hero.getBoundingClientRect().height)).toBeLessThanOrEqual(720);

    const actionBar = page.locator(".mobile-action-bar");
    const bottomNav = page.locator(".forest-bottom-nav");
    await expect(actionBar).toBeVisible();
    await expect(bottomNav).toBeVisible();
    await expect(actionBar.locator('a[href^="https://wa.me/"]')).toBeVisible();
    await expect(actionBar.locator('a[href^="tel:"]')).toBeVisible();
    await expect(actionBar.locator('a[href="#quote-name"]')).toHaveText("填写表单");
    await actionBar.evaluate(async (nav) => {
      await Promise.all(nav.getAnimations().map((animation) => animation.finished));
    });

    const fixedBars = await page.evaluate(() => {
      const actionRect = document.querySelector(".mobile-action-bar")?.getBoundingClientRect();
      const navigationRect = document.querySelector(".forest-bottom-nav")?.getBoundingClientRect();
      return {
        navigationBottom: Math.round(window.innerHeight - (navigationRect?.bottom ?? 0)),
        stackGap: Math.round((navigationRect?.top ?? 0) - (actionRect?.bottom ?? 0)),
      };
    });
    expect(fixedBars).toEqual({ navigationBottom: 0, stackGap: 0 });
  });

  test("primary subpages share one large editorial hero proportion", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });

    for (const path of publicPaths.filter((publicPath) => publicPath !== "/zh")) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const hero = page.locator('[data-forest-page-hero="true"]');
      await expect(hero).toHaveCount(1);

      const metrics = await hero.evaluate((element) => {
        const media = element.querySelector(".page-hero__media");
        const copy = element.querySelector(".page-hero__content");
        const label = element.querySelector(".page-hero__label")?.textContent?.trim().toLocaleLowerCase();
        const title = element.querySelector(".page-hero__title")?.textContent?.trim().toLocaleLowerCase();
        if (!media || !copy) throw new Error("Missing final hero regions");
        const heroBox = element.getBoundingClientRect();
        const mediaBox = media.getBoundingClientRect();
        const copyBox = copy.getBoundingClientRect();
        const heroStyle = getComputedStyle(element);
        const copyStyle = getComputedStyle(copy);
        return {
          display: heroStyle.display,
          mediaStartsAfterCopy: mediaBox.left >= copyBox.right - 1,
          mediaShare: mediaBox.width / heroBox.width,
          height: Math.round(heroBox.height),
          borderWidths: [heroStyle.borderTopWidth, heroStyle.borderRightWidth, heroStyle.borderBottomWidth, heroStyle.borderLeftWidth, copyStyle.borderRightWidth],
          labelDuplicatesTitle: Boolean(label && title && label === title),
        };
      });

      expect(metrics.display).toBe("grid");
      expect(metrics.mediaStartsAfterCopy).toBe(true);
      expect(metrics.mediaShare).toBeGreaterThanOrEqual(0.56);
      expect(metrics.mediaShare).toBeLessThanOrEqual(0.6);
      expect(metrics.labelDuplicatesTitle).toBe(false);
      expect(metrics.borderWidths).toEqual(["0px", "0px", "0px", "0px", "0px"]);
      expect(metrics.height).toBe(700);
    }
  });

  test("every primary page keeps its hero image inside a stable responsive frame", async ({ page }) => {
    const paths = publicPaths.filter((path) => path !== "/zh");

    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      for (const path of paths) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("load");

        const pageFrame = await page.locator('[data-forest-page-hero="true"] .page-hero__media').evaluate((media) => {
          const box = media.getBoundingClientRect();
          return {
            width: Math.round(box.width),
            height: Math.round(box.height),
          };
        });

        expect(pageFrame.width, `${path} hero image width`).toBeGreaterThanOrEqual(viewport.width <= 390 ? viewport.width - 16 : 300);
        expect(pageFrame.width, `${path} hero image width`).toBeLessThanOrEqual(viewport.width);
        if (viewport.width <= 390) {
          expect(pageFrame.width / pageFrame.height, `${path} mobile hero image ratio`).toBeCloseTo(5 / 4, 1);
        } else {
          expect(pageFrame.height, `${path} desktop hero image height`).toBe(700);
        }
      }
    }
  });

  test("home service and process tabs support arrow-key navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    for (const prefix of ["home-service", "home-process"]) {
      const firstTab = page.locator(`#${prefix}-tab-0`);
      await expect(firstTab).toBeVisible();
      await firstTab.focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.locator(`#${prefix}-tab-1`)).toBeFocused();
      await expect(page.locator(`#${prefix}-tab-1`)).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("Home");
      await expect(firstTab).toBeFocused();
    }
  });

  test("before-and-after sliders expose a visible keyboard focus state", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/before-after", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    const slider = page.locator(".forest-comparison-slider").first();
    const input = slider.locator('input[type="range"]');
    await expect(input).toBeAttached();
    await input.focus();
    await expect(input).toBeFocused();
    await expect.poll(() => slider.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  });

  test("detail pages share one consistent image frame", async ({ page }) => {
    const detailHeroes = detailImageFrames.filter(({ selector }) => selector.includes("data-forest-page-hero"));

    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      let referenceFrame: { width: number; height: number } | null = null;

      for (const detail of detailHeroes) {
        await page.goto(detail.path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("load");

        const pageFrame = await page.locator(detail.selector).evaluate((media) => {
          const box = media.getBoundingClientRect();
          return {
            width: Math.round(box.width),
            height: Math.round(box.height),
          };
        });

        referenceFrame ??= pageFrame;
        expect(Math.abs(pageFrame.width - referenceFrame.width), `${detail.path} hero image frame width`).toBeLessThanOrEqual(1);
        expect(Math.abs(pageFrame.height - referenceFrame.height), `${detail.path} hero image frame height`).toBeLessThanOrEqual(1);

        if (viewport.width <= 390) {
          expect(pageFrame.width / pageFrame.height, `${detail.path} mobile detail image ratio`).toBeCloseTo(5 / 4, 1);
        } else {
          expect(pageFrame.height, `${detail.path} desktop detail image height`).toBe(700);
        }
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
          [".forest-section-heading h2", ".forest-chapter--raised"],
          [".forest-section-heading__copy > p:not(.forest-eyebrow)", ".forest-chapter--raised"],
        ],
      },
      {
        path: "/zh/quote",
        targets: [
          [".quote-form-guide__summary span", ".quote-form-guide__summary span"],
          [".quote-form-guide__text", ".forest-quote-form"],
          [".forest-quote-form label", ".forest-quote-form"],
        ],
      },
      {
        path: "/zh/materials/spc-flooring-natural-oak",
        targets: [[".page-hero__meta > span", ".page-hero__meta > span"]],
      },
      {
        path: "/zh/products/spc-flooring-natural-oak",
        targets: [[".home-footer-prelude__title", ".home-footer-prelude__panel"]],
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
                  const channels = rgb[1]
                    .split(/[\s,/]+/)
                    .filter(Boolean)
                    .map(Number);
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
              return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
            },
            { foregroundSelector, backgroundSelector },
          );

          expect(contrast, `${theme} ${scenario.path} ${foregroundSelector}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test("detail pages inherit the separated solid header", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/zh/projects", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    const detailHref = await page.locator(".forest-project-row").first().getAttribute("href");
    expect(detailHref).toBeTruthy();

    await page.goto(detailHref!, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator(".forest-site-shell")).toHaveAttribute("data-header-overlay", "false");
    await expect(page.locator(".site-header")).toHaveAttribute("data-header-state", "solid");
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

  test("navigation state resets when crossing the desktop breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await page.getByRole("button", { name: "打开导航菜单" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-menu-open", "true");
    await expect(page.locator(".public-page-frame")).toHaveAttribute("inert", "");

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator(".mobile-navigation")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveAttribute("data-menu-open", "true");
    await expect(page.locator(".public-page-frame")).not.toHaveAttribute("inert", "");
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .not.toBe("hidden");

    await page.getByRole("button", { name: "更多" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-desktop-menu-open", "true");
    await expect(page.locator(".site-header__more-menu")).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".site-header__more-menu")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveAttribute("data-desktop-menu-open", "true");
    await expect(page.getByRole("button", { name: "打开导航菜单" })).toBeVisible();
  });

  test("mobile menu uses a compact floating directory panel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.getByRole("button", { name: "打开导航菜单" }).click();

    const metrics = await page.evaluate(() => {
      const menu = document.querySelector(".mobile-navigation");
      const panel = document.querySelector(".mobile-navigation__panel");
      const scrim = document.querySelector(".mobile-navigation__scrim");
      const primaryGrid = document.querySelector(".mobile-navigation__primary-grid");
      const primaryLink = document.querySelector(".mobile-navigation__primary-link");
      const secondaryGroups = document.querySelectorAll<HTMLElement>(".mobile-navigation__secondary-group");
      const secondaryGroupList = secondaryGroups[0]?.querySelector(":scope > div");
      const secondaryTriggers = document.querySelectorAll<HTMLElement>(".mobile-navigation__secondary-trigger");
      const footer = document.querySelector(".mobile-navigation__footer");
      const footerCopy = footer?.querySelector(".mobile-navigation__footer-copy");
      const quote = footer?.querySelector(".mobile-navigation__quote");
      if (!menu || !panel || !scrim || !primaryGrid || !primaryLink || secondaryGroups.length !== 2 || secondaryTriggers.length !== 2 || !secondaryGroupList || !footer || !footerCopy || !quote) {
        throw new Error("Missing mobile menu structure");
      }

      const primaryGridStyle = getComputedStyle(primaryGrid);
      const primaryLinkStyle = getComputedStyle(primaryLink);
      const menuBox = menu.getBoundingClientRect();
      const panelBox = panel.getBoundingClientRect();
      const scrimBox = scrim.getBoundingClientRect();
      const quoteBox = quote.getBoundingClientRect();
      const footerBox = footer.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        menuBackground: getComputedStyle(menu).backgroundColor,
        menuFillsViewport: menuBox.width >= window.innerWidth - 1 && menuBox.bottom >= window.innerHeight - 1,
        scrimFillsMenu: scrimBox.width >= menuBox.width - 1 && scrimBox.height >= menuBox.height - 1,
        panelWidth: panelBox.width,
        panelHeight: panelBox.height,
        panelLeft: panelBox.left,
        panelRightGap: window.innerWidth - panelBox.right,
        panelTop: panelBox.top,
        primaryGridBorder: Number.parseFloat(primaryGridStyle.borderTopWidth),
        primaryGridBackground: primaryGridStyle.backgroundColor,
        primaryIndexCount: primaryGrid.querySelectorAll(".mobile-navigation__primary-index").length,
        primaryColumns: primaryLinkStyle.gridTemplateColumns.split(" ").length,
        primaryLinkBorders: [primaryLinkStyle.borderTopWidth, primaryLinkStyle.borderRightWidth, primaryLinkStyle.borderBottomWidth, primaryLinkStyle.borderLeftWidth].map(Number.parseFloat),
        secondaryGroupsHidden: Array.from(secondaryGroups).map((group) => group.querySelector(":scope > div")?.hasAttribute("hidden")),
        secondaryTriggersExpanded: Array.from(secondaryTriggers).map((trigger) => trigger.getAttribute("aria-expanded")),
        footerCopyDisplay: getComputedStyle(footerCopy).display,
        footerDivider: Number.parseFloat(getComputedStyle(footer).borderTopWidth),
        quoteFillsFooter: quoteBox.width >= footerBox.width - 32,
      };
    });

    expect(metrics.menuBackground).toBe("rgba(0, 0, 0, 0)");
    expect(metrics.menuFillsViewport).toBe(true);
    expect(metrics.scrimFillsMenu).toBe(true);
    expect(metrics.panelWidth).toBeLessThanOrEqual(345);
    expect(metrics.panelHeight).toBeLessThan(metrics.viewportHeight * 0.62);
    expect(metrics.panelLeft).toBeGreaterThanOrEqual(30);
    expect(metrics.panelRightGap).toBeGreaterThanOrEqual(10);
    expect(metrics.panelRightGap).toBeLessThanOrEqual(14);
    expect(metrics.panelTop).toBeGreaterThanOrEqual(58);
    expect(metrics.primaryGridBorder).toBe(0);
    expect(metrics.primaryGridBackground).toBe("rgba(0, 0, 0, 0)");
    expect(metrics.primaryIndexCount).toBe(0);
    expect(metrics.primaryColumns).toBe(3);
    expect(metrics.primaryLinkBorders).toEqual([0, 0, 1, 0]);
    expect(metrics.secondaryGroupsHidden).toEqual([true, true]);
    expect(metrics.secondaryTriggersExpanded).toEqual(["false", "false"]);
    expect(metrics.footerCopyDisplay).toBe("none");
    expect(metrics.footerDivider).toBeGreaterThanOrEqual(1);
    expect(metrics.quoteFillsFooter).toBe(true);

    const secondaryTriggers = page.locator(".mobile-navigation__secondary-trigger");
    const companyGroup = page.locator("#mobile-navigation-company");
    const exploreGroup = page.locator("#mobile-navigation-explore");

    await secondaryTriggers.nth(0).click();
    await expect(secondaryTriggers.nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(companyGroup).toBeVisible();
    await expect(exploreGroup).toBeHidden();

    await secondaryTriggers.nth(1).click();
    await expect(secondaryTriggers.nth(0)).toHaveAttribute("aria-expanded", "false");
    await expect(secondaryTriggers.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(companyGroup).toBeHidden();
    await expect(exploreGroup).toBeVisible();

    const primaryHrefs = await page.locator(".mobile-navigation__primary-link").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const secondaryHrefs = await page.locator(".mobile-navigation__secondary-link").evaluateAll((links) => links.map((link) => link.getAttribute("href")));

    expect(primaryHrefs).toEqual(["/zh", "/zh/projects", "/zh/products", "/zh/promotions", "/zh/contact"]);
    expect(secondaryHrefs).toEqual(["/zh/about", "/zh/process", "/zh/blog", "/zh/faq", "/zh/services", "/zh/materials", "/zh/locations", "/zh/before-after"]);

    await page.locator(".mobile-navigation__scrim").click({ position: { x: 8, y: 100 } });
    await expect(page.locator(".mobile-navigation")).toBeHidden();
  });
});
