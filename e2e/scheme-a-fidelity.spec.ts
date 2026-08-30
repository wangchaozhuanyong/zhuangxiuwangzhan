import { expect, test } from "@playwright/test";

const portraitHeroRoutes = [
  "/zh/about",
  "/zh/services",
  "/zh/services/old-house",
  "/zh/materials",
  "/zh/products",
  "/zh/promotions",
  "/zh/projects",
  "/zh/before-after",
  "/zh/blog",
  "/zh/blog/how-to-plan-condo-renovation-kl",
  "/zh/faq",
  "/zh/locations",
  "/zh/locations/kuala-lumpur",
  "/zh/quote",
  "/zh/contact",
  "/zh/process",
] as const;

const responsiveViewports = [
  { width: 320, height: 720 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
] as const;

test.describe("Scheme A approved-design fidelity", () => {
  test("refreshed local imagery uses cache-safe versioned paths", async ({ page }) => {
    await page.goto("/zh", { waitUntil: "domcontentloaded" });

    const footerPreludeImage = page.locator(".scheme-a-footer-prelude img");
    await expect(footerPreludeImage).toHaveAttribute(
      "src",
      /\/images\/_responsive\/projects\/w\d+\/v20260824\/generated-portfolio\/mont-kiara-luxury-condo-renovation\.webp/,
    );
    await expect(footerPreludeImage).toHaveAttribute("srcset", /\/v20260824\//);
  });

  test("mobile route heroes load the dedicated portrait art direction", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of portraitHeroRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const image = page.locator(".fc-route-hero-media img");
      await expect(image).toBeVisible();
      await expect(page.locator(".fc-route-hero h1")).toBeVisible();
      await expect(page.locator('.fc-route-hero-media source[media="(max-width: 767px)"]')).toHaveCount(1);
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);

      const ratio = await image.evaluate((element: HTMLImageElement) => element.naturalWidth / element.naturalHeight);
      expect(ratio).toBeLessThan(1);
    }
  });

  test("representative pages stay aligned across every approved viewport", async ({ page }) => {
    for (const viewport of responsiveViewports) {
      await page.setViewportSize(viewport);

      for (const route of ["/zh", "/zh/projects", "/zh/blog", "/zh/contact"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      }
    }
  });

  test("desktop more control opens and closes the complete directory", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/zh/services", { waitUntil: "domcontentloaded" });

    const desktopNavigation = page.locator(".scheme-a-chrome__primary");
    const trigger = desktopNavigation.getByRole("button", { name: "打开完整网站目录", exact: true });
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText("更多");
    await expect(desktopNavigation.locator("a").last()).toContainText("材料库");
    const desktopOrder = await desktopNavigation.locator(":scope > *").evaluateAll((items) =>
      items.map((item) => ({ text: item.textContent?.trim(), left: item.getBoundingClientRect().left })),
    );
    expect(desktopOrder.at(-1)?.text).toContain("更多");
    expect(desktopOrder.at(-1)?.left).toBeGreaterThan(desktopOrder.at(-2)?.left || 0);
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "完整目录" });
    await expect(dialog).toBeVisible();
    const close = dialog.getByRole("button", { name: "关闭网站目录", exact: true });
    await expect(close).toContainText("更多");
    await close.click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(dialog).toBeVisible();
    await dialog.click({ position: { x: 720, y: 32 } });
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("desktop heroes add useful density and avoid upscaling the home artwork", async ({ page }) => {
    await page.setViewportSize({ width: 2048, height: 990 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });

    const homeHero = page.locator(".scheme-a-home--atelier .scheme-a-hero");
    const heroImage = homeHero.locator(".scheme-a-hero__media img");
    await expect(homeHero.locator(".scheme-a-hero__capabilities-label")).toBeVisible();
    await expect(homeHero.locator(".scheme-a-hero__disciplines li")).toHaveCount(3);
    const imageScale = await heroImage.evaluate((image: HTMLImageElement) => {
      const rect = image.getBoundingClientRect();
      return {
        currentSrc: image.currentSrc,
        horizontal: (rect.width * window.devicePixelRatio) / 2880,
        vertical: (rect.height * window.devicePixelRatio) / 1620,
      };
    });
    expect(imageScale.currentSrc).toContain("/images/heroes/v4/home-atelier-desktop.webp");
    expect(imageScale.horizontal).toBeLessThanOrEqual(1);
    expect(imageScale.vertical).toBeLessThanOrEqual(1);

    await page.goto("/zh/services", { waitUntil: "domcontentloaded" });
    const support = page.locator(".fc-route-hero-support");
    await expect(support).toBeVisible();
    await expect(support.locator(":scope > div")).toHaveCount(3);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".fc-route-hero-support")).not.toBeVisible();
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".scheme-a-home--atelier .scheme-a-hero__capabilities-label")).not.toBeVisible();
  });

  test("mobile directory is complete, collapsible and keyboard safe", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/projects", { waitUntil: "domcontentloaded" });

    const trigger = page.locator(".scheme-a-chrome__menu-trigger--compact");
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "完整目录" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".scheme-a-directory__groups section")).toHaveCount(4);
    await expect(dialog.locator(".scheme-a-directory__groups a")).toHaveCount(16);
    await expect(dialog.locator('.scheme-a-directory__groups section[data-open="true"]')).toHaveCount(1);
    await expect(dialog.getByRole("button", { name: "空间作品", exact: true })).toHaveAttribute("aria-expanded", "true");
    await expect(dialog.locator(".scheme-a-directory__preview")).toBeVisible();
    const languageSwitch = dialog.getByRole("group", { name: "切换语言" });
    await expect(languageSwitch.getByRole("link", { name: "切换到中文" })).toContainText("中文");
    await expect(languageSwitch.getByRole("link", { name: "切换到英文" })).toContainText("EN");
    await expect(dialog).toContainText("营业时间");
    await expect(dialog.locator(".scheme-a-directory__preview figcaption strong")).toContainText("项目案例");

    const openGroupLabels = dialog.locator('.scheme-a-directory__groups section[data-open="true"] a > span:first-child');
    const labelLeftEdges = await openGroupLabels.evaluateAll((labels) => labels.map((label) => label.getBoundingClientRect().left));
    expect(Math.max(...labelLeftEdges) - Math.min(...labelLeftEdges)).toBeLessThanOrEqual(1);

    const hierarchy = await dialog.locator('.scheme-a-directory__groups section[data-open="true"]').evaluate((section) => {
      const primary = section.querySelector<HTMLElement>(".scheme-a-directory__group-toggle");
      const secondary = section.querySelector<HTMLElement>("a");
      if (!primary || !secondary) throw new Error("Missing directory hierarchy");
      return {
        primaryFontSize: Number.parseFloat(getComputedStyle(primary).fontSize),
        primaryHeight: primary.getBoundingClientRect().height,
        secondaryFontSize: Number.parseFloat(getComputedStyle(secondary).fontSize),
        secondaryHeight: secondary.getBoundingClientRect().height,
      };
    });
    expect(hierarchy.primaryFontSize).toBeGreaterThan(hierarchy.secondaryFontSize);
    expect(hierarchy.primaryHeight).toBeGreaterThanOrEqual(52);
    expect(hierarchy.secondaryHeight).toBeGreaterThanOrEqual(44);

    const callButton = dialog.locator(".scheme-a-directory__call");
    await expect(callButton).toHaveAttribute("href", /^tel:\+/);
    await expect(callButton).toContainText("立即拨打");
    const contactMetrics = await dialog.locator(".scheme-a-directory__contact").evaluate((contact) => {
      const call = contact.querySelector<HTMLElement>(".scheme-a-directory__call");
      const callLabel = call?.querySelector<HTMLElement>("small");
      const hoursLabel = contact.querySelector<HTMLElement>(".scheme-a-directory__hours small");
      if (!call || !callLabel || !hoursLabel) throw new Error("Missing directory contact actions");
      return {
        callHeight: call.getBoundingClientRect().height,
        callLabelSize: Number.parseFloat(getComputedStyle(callLabel).fontSize),
        hoursLabelSize: Number.parseFloat(getComputedStyle(hoursLabel).fontSize),
      };
    });
    expect(contactMetrics.callHeight).toBeGreaterThanOrEqual(60);
    expect(contactMetrics.callLabelSize).toBeGreaterThanOrEqual(14);
    expect(contactMetrics.hoursLabelSize).toBeGreaterThanOrEqual(14);

    await dialog.getByRole("button", { name: "服务体系", exact: true }).click();
    await expect(dialog.getByRole("link", { name: "装修报价专题", exact: true })).toHaveAttribute("href", "/zh/landing/office-renovation");

    const whatsapp = dialog.locator(".scheme-a-directory__foot .is-whatsapp");
    await expect(whatsapp).toBeVisible();
    await expect(whatsapp.locator("svg")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(dialog.locator('.scheme-a-directory__groups section[data-open="true"]')).toHaveCount(1);
    await expect(dialog.getByRole("button", { name: "空间作品", exact: true })).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("home project cards use the approved mobile and desktop image slots", async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/zh", { waitUntil: "domcontentloaded" });

      const collection = page.locator(".scheme-a-project__collection");
      await expect(collection).toBeVisible();
      await collection.scrollIntoViewIfNeeded();

      const frames = collection.locator(".scheme-a-project__collection-media");
      const frameCount = await frames.count();
      expect(frameCount).toBeGreaterThanOrEqual(2);
      await expect(collection.locator(".scheme-a-project__collection-media img").first()).toBeAttached();

      const metrics = await collection.evaluate((element) => {
        const media = Array.from(element.querySelectorAll<HTMLElement>(".scheme-a-project__collection-media"));
        return {
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          frames: media.map((frame) => {
            const rect = frame.getBoundingClientRect();
            const image = frame.querySelector<HTMLImageElement>("img");
            return {
              width: rect.width,
              height: rect.height,
              objectFit: image ? getComputedStyle(image).objectFit : "missing",
            };
          }),
        };
      });

      const widths = metrics.frames.map((frame) => frame.width);
      expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
      for (const frame of metrics.frames) {
        expect(frame.height / frame.width).toBeCloseTo(0.625, 2);
        if (frame.objectFit !== "missing") expect(frame.objectFit).toBe("cover");
      }
      expect(metrics.frames.some((frame) => frame.objectFit === "cover")).toBe(true);
      expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    const desktopFrames = page.locator(".scheme-a-project__collection-media");
    await expect(desktopFrames.first()).toBeVisible();
    const desktopRatios = await desktopFrames.evaluateAll((frames) => frames.map((frame) => {
      const rect = frame.getBoundingClientRect();
      return rect.height / rect.width;
    }));
    expect(desktopRatios).toHaveLength(3);
    expect(desktopRatios[0]).toBeCloseTo(0.6875, 2);
    expect(desktopRatios[1]).toBeCloseTo(0.6875, 2);
    expect(desktopRatios[2]).toBeCloseTo(0.6875, 2);
  });

  test("home feature media stays horizontally balanced", async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
      { width: 2560, height: 1200 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/zh", { waitUntil: "domcontentloaded" });
      await expect(page.locator(".scheme-a-project__media")).toBeAttached();
      await expect(page.locator(".scheme-a-compare")).toBeAttached();

      const metrics = await page.evaluate(() => {
        const horizontalGaps = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) throw new Error(`Missing home feature region: ${selector}`);
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: document.documentElement.clientWidth - rect.right,
          };
        };

        return {
          projectMedia: horizontalGaps(".scheme-a-project__media"),
          projectMeta: horizontalGaps(".scheme-a-project__meta"),
          comparison: horizontalGaps(".scheme-a-compare"),
          comparisonNote: horizontalGaps(".scheme-a-before__note"),
        };
      });

      for (const region of Object.values(metrics)) {
        expect(Math.abs(region.left - region.right), `${viewport.width}px viewport`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("desktop opening preserves a full-viewport editorial stage", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".scheme-a-hero")).toBeVisible();
    await expect(page.locator(".scheme-a-principle")).toBeAttached();

    const metrics = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>(".scheme-a-hero");
      const next = document.querySelector<HTMLElement>(".scheme-a-principle");
      const header = document.querySelector<HTMLElement>(".scheme-a-chrome");
      if (!hero || !next || !header) throw new Error("Missing Scheme A opening regions");
      return {
        heroHeight: Math.round(hero.getBoundingClientRect().height),
        heroTop: Math.round(hero.getBoundingClientRect().top),
        nextTop: Math.round(next.getBoundingClientRect().top),
        headerPosition: getComputedStyle(header).position,
      };
    });

    expect(metrics.heroHeight).toBeGreaterThanOrEqual(899);
    expect(metrics.heroHeight).toBeLessThanOrEqual(901);
    const chapterGap = metrics.nextTop - metrics.heroTop - metrics.heroHeight;
    expect(chapterGap).toBeGreaterThanOrEqual(0);
    expect(chapterGap).toBeLessThanOrEqual(40);
    expect(metrics.headerPosition).toBe("fixed");

    const header = page.locator(".scheme-a-chrome");
    await expect(header).toHaveClass(/is-overlay/);
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo(0, 160));
    await expect(header).toHaveClass(/is-solid/);
    await expect(header).toBeVisible();
  });

  test("footer is separated into a visual prelude and an orderly mobile directory", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });

    const prelude = page.locator(".scheme-a-footer-prelude");
    const footer = page.locator(".scheme-a-footer");
    await expect(prelude).toHaveCount(1);
    await expect(footer).toHaveCount(1);
    await footer.scrollIntoViewIfNeeded();

    await expect(footer.locator(".scheme-a-footer__mobile-directory details")).toHaveCount(4);
    await expect(footer.locator(".scheme-a-footer__studio")).toBeVisible();
    await expect(page.locator(".scheme-a-mobile-dock a")).toHaveCount(5);
    const footerMetrics = await footer.evaluate((element) => {
      const wordmark = element.querySelector<HTMLElement>(".scheme-a-footer__wordmark");
      const areaLinks = Array.from(element.querySelectorAll<HTMLElement>(".scheme-a-footer__areas a"));
      if (!wordmark) throw new Error("Missing footer wordmark");
      return {
        wordmarkOverflow: wordmark.scrollWidth - wordmark.clientWidth,
        minimumAreaTarget: Math.min(...areaLinks.map((link) => link.getBoundingClientRect().height)),
      };
    });
    expect(footerMetrics.wordmarkOverflow).toBeLessThanOrEqual(1);
    expect(footerMetrics.minimumAreaTarget).toBeGreaterThanOrEqual(44);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });

  test("quote keeps its form progress above the contextual mobile action bar", async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 720 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);

      const hero = page.locator(".fc-route-quote-page .fc-route-hero-form");
      const progress = page.locator(".quote-form-guide__summary");
      const switcher = page.getByTestId("mobile-bottom-dock");
      const actionBar = page.locator(".scheme-a-contact-dock");
      await expect(hero).toBeVisible();
      await expect(progress).toBeVisible();
      await expect(switcher).toHaveAttribute("data-mode", "navigation");
      await page.evaluate(() => window.scrollTo({ top: 200, behavior: "auto" }));
      await expect(switcher).toHaveAttribute("data-mode", "actions");
      await expect(actionBar).toBeVisible();
      await expect(page.locator(".scheme-a-mobile-dock")).not.toBeVisible();

      const metrics = await page.evaluate(() => {
        const hero = document.querySelector<HTMLElement>(".fc-route-quote-page .fc-route-hero-form");
        const heroMedia = hero?.querySelector<HTMLElement>(".fc-route-hero-media");
        const heroCopy = hero?.querySelector<HTMLElement>(".fc-route-hero-copy");
        const title = document.querySelector<HTMLElement>(".fc-route-quote-form h2");
        const progress = document.querySelector<HTMLElement>(".quote-form-guide__summary");
        const actionBar = document.querySelector<HTMLElement>(".scheme-a-contact-dock");
        if (!hero || !heroMedia || !heroCopy || !title || !progress || !actionBar) {
          throw new Error("Missing quote conversion regions");
        }
        const mediaRect = heroMedia.getBoundingClientRect();
        const copyRect = heroCopy.getBoundingClientRect();
        return {
          heroHeight: hero.getBoundingClientRect().height,
          mediaHeight: mediaRect.height,
          copyBelowMedia: copyRect.top >= mediaRect.bottom - 1,
          titleTop: title.getBoundingClientRect().top,
          progressBottom: progress.getBoundingClientRect().bottom,
          actionBarTop: actionBar.getBoundingClientRect().top,
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      expect(metrics.heroHeight).toBeGreaterThanOrEqual(360);
      expect(metrics.mediaHeight).toBeGreaterThanOrEqual(300);
      expect(metrics.mediaHeight).toBeLessThanOrEqual(390);
      expect(metrics.copyBelowMedia).toBe(true);
      expect(metrics.titleTop).toBeGreaterThanOrEqual(0);
      expect(metrics.progressBottom).toBeLessThanOrEqual(metrics.actionBarTop - 8);
      expect(metrics.horizontalOverflow).toBeLessThanOrEqual(1);
    }

    await page.locator('.scheme-a-contact-dock a[href="#quote-name"]').click();
    await expect(page.locator("#quote-name")).toBeFocused();
    await expect(page.getByTestId("mobile-bottom-dock")).toHaveAttribute("data-mode", "hidden");

    const menuTrigger = page.locator(".scheme-a-chrome__menu-trigger--compact");
    await menuTrigger.click();
    await expect(page.getByTestId("mobile-bottom-dock")).toHaveAttribute("data-mode", "hidden");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("mobile-bottom-dock")).toHaveAttribute("data-mode", "actions");
    await expect(page.locator(".scheme-a-contact-dock")).toBeVisible();
    await expect(menuTrigger).toBeFocused();
  });

  test("product search remains readable inside the current dark surface", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/products", { waitUntil: "domcontentloaded" });

    const input = page.locator('.fc-route-search input[type="search"]');
    await expect(input).toBeVisible();
    const colors = await input.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));
    expect(colors.background).toBe("rgba(0, 0, 0, 0)");
    expect(colors.color).toBe("rgb(255, 255, 255)");
  });

  test("CMS hydration does not replace the promotions hero headline", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/promotions", { waitUntil: "domcontentloaded" });

    const title = page.locator(".fc-route-hero h1");
    const initial = (await title.textContent())?.trim();
    expect(initial).toBeTruthy();
    await page.waitForTimeout(1_200);
    await expect(title).toHaveText(initial || "");
  });

  test("reduced motion keeps every chapter visible", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/projects", { waitUntil: "domcontentloaded" });

    const sections = page.locator(".fc-route-section");
    await expect(sections.first()).toBeVisible();
    const styles = await sections.first().evaluate((element) => ({
      opacity: getComputedStyle(element).opacity,
      visibility: getComputedStyle(element).visibility,
    }));
    expect(styles).toEqual({ opacity: "1", visibility: "visible" });
  });

  test("shared route layout keeps the editorial rail aligned with the image seam", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const route of [...portraitHeroRoutes, "/zh/privacy", "/zh/terms"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.locator(".fc-route-hero-copy").waitFor();

      const metrics = await page.evaluate(() => {
        const main = document.querySelector<HTMLElement>("main.fc-route-page");
        const hero = document.querySelector<HTMLElement>(".fc-route-hero");
        const heroCopy = document.querySelector<HTMLElement>(".fc-route-hero-copy");
        const heroMedia = document.querySelector<HTMLElement>(".fc-route-hero-media");
        const heroTitle = heroCopy?.querySelector<HTMLElement>("h1");
        const sectionHeads = Array.from(document.querySelectorAll<HTMLElement>(".fc-route-section-head"));
        return {
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          mainRightGap: main ? Math.round(document.documentElement.clientWidth - main.getBoundingClientRect().right) : 0,
          mainLeft: main ? Math.round(main.getBoundingClientRect().left) : 0,
          heroCopyLeft: heroCopy ? Math.round(heroCopy.getBoundingClientRect().left) : null,
          copyToMediaSeam: heroCopy && heroMedia
            ? Math.abs(heroCopy.getBoundingClientRect().right - heroMedia.getBoundingClientRect().left)
            : null,
          mediaRightGap: heroMedia && hero
            ? Math.abs(hero.getBoundingClientRect().right - heroMedia.getBoundingClientRect().right)
            : null,
          copyShare: heroCopy && hero
            ? heroCopy.getBoundingClientRect().width / hero.getBoundingClientRect().width
            : null,
          heroTitleLeft: heroTitle ? Math.round(heroTitle.getBoundingClientRect().left) : null,
          headings: sectionHeads.map((head) => {
            const title = head.querySelector<HTMLElement>("h2");
            const copy = head.querySelector<HTMLElement>("p");
            if (!title || !copy) return null;
            const titleRect = title.getBoundingClientRect();
            const copyRect = copy.getBoundingClientRect();
            return {
              titleBottom: titleRect.bottom,
              copyTop: copyRect.top,
              leftDelta: Math.abs(titleRect.left - copyRect.left),
              display: getComputedStyle(head).display,
            };
          }).filter(Boolean),
        };
      });

      expect(metrics.horizontalOverflow, route).toBeLessThanOrEqual(1);
      expect(metrics.mainLeft, route).toBe(0);
      expect(metrics.mainRightGap, route).toBe(0);
      expect(metrics.heroCopyLeft, route).toBe(0);
      expect(metrics.copyToMediaSeam, route).toBeLessThanOrEqual(1);
      expect(metrics.mediaRightGap, route).toBeLessThanOrEqual(1);
      expect(metrics.copyShare, route).toBeGreaterThanOrEqual(0.329);
      expect(metrics.copyShare, route).toBeLessThanOrEqual(0.42);
      expect(metrics.heroTitleLeft, route).toBeLessThanOrEqual(80);
      for (const heading of metrics.headings) {
        if (!heading) continue;
        expect(heading.display, route).toBe("block");
        expect(heading.copyTop, route).toBeGreaterThanOrEqual(heading.titleBottom);
        expect(heading.leftDelta, route).toBeLessThanOrEqual(1);
      }
    }
  });

  test("route hero copy and artwork stay separate at responsive breakpoints", async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 800 },
      { width: 768, height: 1024 },
      { width: 1024, height: 900 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);

      for (const route of ["/zh/services", "/en/services", "/zh/services/old-house", "/zh/contact"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        const image = page.locator(".fc-route-hero-media img");
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);

        const metrics = await page.evaluate(() => {
          const copy = document.querySelector<HTMLElement>(".fc-route-hero-copy");
          const media = document.querySelector<HTMLElement>(".fc-route-hero-media");
          if (!copy || !media) throw new Error("Missing route hero copy or media");
          const copyRect = copy.getBoundingClientRect();
          const mediaRect = media.getBoundingClientRect();
          return {
            horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            horizontalOverlap: Math.max(0, Math.min(copyRect.right, mediaRect.right) - Math.max(copyRect.left, mediaRect.left)),
            verticalOverlap: Math.max(0, Math.min(copyRect.bottom, mediaRect.bottom) - Math.max(copyRect.top, mediaRect.top)),
            mediaAboveCopy: mediaRect.bottom <= copyRect.top + 1,
          };
        });

        expect(metrics.horizontalOverflow, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(1);
        if (viewport.width >= 1024) {
          expect(metrics.horizontalOverlap, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(1);
          expect(metrics.verticalOverlap, `${route} at ${viewport.width}px`).toBeGreaterThan(0);
        } else {
          expect(metrics.mediaAboveCopy, `${route} at ${viewport.width}px`).toBe(true);
          expect(metrics.verticalOverlap, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test("known wide-screen heroes no longer stretch thumbnail sources", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const route of ["/zh/products", "/zh/promotions"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const image = page.locator(".fc-route-hero-media img");
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.currentSrc)).toMatch(/\/w(?:1200|1600)\//);
    }

    await page.goto("/zh/blog/how-to-plan-condo-renovation-kl", { waitUntil: "domcontentloaded" });
    const editorialImage = page.locator(".fc-route-hero-media img");
    await expect(editorialImage).toBeVisible();
    await expect.poll(() => editorialImage.evaluate((element: HTMLImageElement) => element.currentSrc)).not.toBe("");
    const editorialSource = await editorialImage.evaluate((element: HTMLImageElement) => element.currentSrc);
    const editorialUrl = new URL(editorialSource);
    if (editorialUrl.hostname === "images.unsplash.com") {
      expect(editorialUrl.searchParams.get("w")).toBe("1800");
      expect(editorialUrl.searchParams.get("h")).toBe("1100");
    } else {
      expect(editorialUrl.pathname).toMatch(/\/w(?:1200|1600)\//);
    }
  });

  test("legacy dark skin cannot repaint comparison controls or premium actions", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/zh/before-after", { waitUntil: "domcontentloaded" });

    const rangeStyle = await page.locator('input[type="range"]').first().evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      border: getComputedStyle(element).borderTopWidth,
      shadow: getComputedStyle(element).boxShadow,
    }));
    expect(rangeStyle).toEqual({ background: "rgba(0, 0, 0, 0)", border: "0px", shadow: "none" });

    await page.goto("/zh/contact", { waitUntil: "domcontentloaded" });
    const mapAction = page.getByRole("button", { name: "前往导航" }).last();
    const mapActionStyle = await mapAction.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      background: getComputedStyle(element).backgroundColor,
      border: getComputedStyle(element).borderTopWidth,
    }));
    expect(mapActionStyle.height).toBeGreaterThanOrEqual(44);
    expect(mapActionStyle.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(mapActionStyle.border).toBe("1px");

    const footerBack = page.locator(".scheme-a-footer__legal button");
    await expect(footerBack).toBeVisible();
    expect(await footerBack.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  });

  test("contact actions stay aligned to the right of their details", async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 900 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);

      for (const route of ["/zh/contact", "/en/contact"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        const actionableRows = page.locator(".contact-detail-row:has(.contact-detail-row__action)");
        await expect(actionableRows).toHaveCount(4);

        const alignments = await actionableRows.evaluateAll((rows) => rows.map((row) => {
          const copy = row.querySelector<HTMLElement>(".contact-detail-row__copy");
          const action = row.querySelector<HTMLElement>(".contact-detail-row__action");
          if (!copy || !action) throw new Error("Missing contact detail content or action");

          const rowRect = row.getBoundingClientRect();
          const copyRect = copy.getBoundingClientRect();
          const actionRect = action.getBoundingClientRect();
          return {
            actionToTheRight: actionRect.left >= copyRect.right - 1,
            actionInsideRow: actionRect.right <= rowRect.right + 1,
            actionVerticallyAligned: actionRect.top < copyRect.bottom && actionRect.bottom > copyRect.top,
          };
        }));

        for (const alignment of alignments) {
          expect(alignment.actionToTheRight, `${route} at ${viewport.width}px`).toBe(true);
          expect(alignment.actionInsideRow, `${route} at ${viewport.width}px`).toBe(true);
          expect(alignment.actionVerticallyAligned, `${route} at ${viewport.width}px`).toBe(true);
        }

        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      }
    }
  });

  test("representative mobile actions keep a usable touch target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of ["/zh", "/zh/projects", "/zh/products", "/zh/promotions", "/zh/faq", "/zh/contact", "/zh/quote"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const undersized = await page.locator("button, summary").evaluateAll((elements) => elements.flatMap((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const visible = rect.width > 0
          && rect.height > 0
          && style.display !== "none"
          && style.visibility !== "hidden"
          && style.opacity !== "0";
        if (!visible || rect.height >= 43.5) return [];
        return [{
          text: (element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
          className: element.getAttribute("class") || "",
          height: Math.round(rect.height * 10) / 10,
        }];
      }));

      expect(undersized, `${route}: ${JSON.stringify(undersized)}`).toEqual([]);
    }
  });
});
