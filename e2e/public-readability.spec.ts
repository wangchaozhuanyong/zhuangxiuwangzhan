import { expect, test, type Locator, type Page } from "@playwright/test";

type Theme = "dark";

const themes: Theme[] = ["dark"];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
];

async function setPublicTheme(page: Page, theme: Theme) {
  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-public-theme", theme);
}

async function readContrast(locator: Locator) {
  return locator.evaluate((element) => {
    type Rgb = [number, number, number];
    const parseRgb = (value: string): Rgb => {
      const channels = value.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3) throw new Error(`Unsupported color: ${value}`);
      return [channels[0], channels[1], channels[2]];
    };
    const luminance = (color: Rgb) => {
      const linear = color.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const style = getComputedStyle(element);
    const fill = style.getPropertyValue("-webkit-text-fill-color");
    if (fill && fill !== style.color) throw new Error(`Glyph fill ${fill} differs from color ${style.color}`);
    const foregroundLuminance = luminance(parseRgb(fill || style.color));
    let background: Rgb = [255, 255, 255];
    const layers: number[][] = [];
    for (let node: Element | null = element; node; node = node.parentElement) {
      const values = getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number);
      if (values?.length && values.length >= 3) layers.push(values);
    }
    for (const values of layers.reverse()) {
      const alpha = values[3] ?? 1;
      background = background.map((value, index) => values[index] * alpha + value * (1 - alpha)) as Rgb;
    }
    const backgroundLuminance = luminance(background);
    return {
      backgroundImage: style.backgroundImage,
      contrast: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
    };
  });
}

test.describe("public text readability", () => {
  test("shared light photo captions and footer legal links retain readable text roles", async ({ page }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const language of ["zh", "en"]) {
        for (const slug of ["kitchen-cabinet-price-malaysia", "office-renovation-checklist-malaysia"]) {
          await page.goto(`/${language}/blog/${slug}`, { waitUntil: "domcontentloaded" });
          const caption = page.locator(".fc-route-media-caption");
          await expect(caption).toBeVisible({ timeout: 20_000 });
          expect((await readContrast(caption)).contrast).toBeGreaterThanOrEqual(4.5);
          const legal = page.locator(".scheme-a-footer__legal");
          await legal.scrollIntoViewIfNeeded();
          expect((await readContrast(legal)).contrast).toBeGreaterThanOrEqual(4.5);
          expect((await readContrast(legal.locator("a").first())).contrast).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test("phone directory captions keep local contrast while leaving the photograph visible", async ({ page }) => {
    for (const language of ["zh", "en"]) {
      for (const width of [390, 767]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${language}/services/surface-repair`, { waitUntil: "domcontentloaded" });
        await expect(page.locator(".scheme-a-page-loader--overlay")).toBeHidden({ timeout: 15_000 });
        await page.getByRole("button", { name: language === "zh" ? "打开完整网站目录" : "Open the complete site directory", exact: true }).click();
        const preview = page.locator(".scheme-a-directory__preview");
        await expect(preview).toBeVisible();
        for (const tag of ["span", "strong"]) {
          expect((await readContrast(preview.locator(`figcaption ${tag}`))).contrast).toBeGreaterThanOrEqual(4.5);
        }
        expect(await preview.locator("img").evaluate((image) => getComputedStyle(image).filter)).toBe("none");
        await page.getByRole("button", { name: language === "zh" ? "关闭网站目录" : "Close the site directory", exact: true }).click();
      }
    }
  });

  test("blog topic cards keep readable dark-theme contrast", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/zh/blog", { waitUntil: "domcontentloaded" });

    const card = page.locator(".fc-blog-topic-card").first();
    await expect(card).toBeVisible();
    const contrast = await card.evaluate((element) => {
      type Rgb = [number, number, number];
      const parseRgb = (value: string): Rgb => {
        const channels = value.match(/[\d.]+/g)?.map(Number);
        if (!channels || channels.length < 3) throw new Error(`Unsupported color: ${value}`);
        return [channels[0], channels[1], channels[2]];
      };
      const luminance = (color: Rgb) => {
        const linear = color.map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const background = parseRgb(getComputedStyle(element).backgroundColor);
      return Array.from(element.querySelectorAll("button > span, button > strong, b, a")).map((target) => {
        const foreground = parseRgb(getComputedStyle(target).color);
        const foregroundLuminance = luminance(foreground);
        const backgroundLuminance = luminance(background);
        return {
          text: target.textContent?.trim() || target.tagName,
          value: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
            / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
        };
      });
    });

    expect(contrast.length).toBeGreaterThan(0);
    for (const item of contrast) {
      expect(item.value, `${item.text} contrast`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("selected project filter keeps AA contrast while hovered", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/zh/projects", { waitUntil: "domcontentloaded" });

    const selectedFilter = page.locator(".fc-route-filter button").nth(1);
    await selectedFilter.click();
    await expect(selectedFilter).toHaveAttribute("aria-pressed", "true");
    await selectedFilter.hover();
    await expect(selectedFilter).toHaveCSS("background-color", "rgb(63, 78, 66)");

    const colors = await readContrast(selectedFilter);

    expect(colors.backgroundImage).toBe("none");
    expect(colors.contrast).toBeGreaterThanOrEqual(4.5);
  });

  test("contextual mobile actions keep AA contrast", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".fc-route-form-page")).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 160, behavior: "auto" }));
    await expect(page.getByTestId("mobile-bottom-dock")).toHaveAttribute("data-mode", "actions");

    const actions = page.locator(".scheme-a-contact-dock__item");
    await expect(actions).toHaveCount(3);
    await expect(actions.nth(0)).toHaveCSS("background-color", "rgb(253, 252, 250)");
    await expect(actions.nth(1)).toHaveCSS("background-color", "rgb(253, 252, 250)");
    await expect(actions.nth(2)).toHaveCSS("background-color", "rgb(63, 78, 66)");
    for (let index = 0; index < await actions.count(); index += 1) {
      const colors = await readContrast(actions.nth(index));
      expect(colors.contrast, `mobile action ${index + 1} contrast`).toBeGreaterThanOrEqual(4.5);
    }
  });

  for (const viewport of viewports) {
    for (const theme of themes) {
      for (const formPage of [
        { path: "/zh/contact", selector: ".fc-route-contact-form form" },
        { path: "/zh/quote", selector: ".fc-route-quote-form form" },
      ]) {
        test(`${viewport.name} ${theme} ${formPage.path} keeps form copy readable`, async ({ page }) => {
          await page.setViewportSize(viewport);
          await setPublicTheme(page, theme);
          await page.goto(formPage.path, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("load");
          await expect(page.locator("html")).toHaveAttribute("data-public-theme", theme);
          await page.locator(formPage.selector).waitFor({ state: "attached" });
          await page.waitForTimeout(300);

          const audit = await page.locator(formPage.selector).evaluate((form) => {
            type Rgba = [number, number, number, number];

            const parseColor = (value: string): Rgba => {
              const match = value.match(/rgba?\(([^)]+)\)/);
              if (!match) throw new Error(`Unsupported color: ${value}`);
              const channels = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
              return [channels[0], channels[1], channels[2], channels[3] ?? 1];
            };
            const composite = (foreground: Rgba, background: Rgba): Rgba => {
              const alpha = foreground[3] + background[3] * (1 - foreground[3]);
              return [
                (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
                (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
                (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
                alpha,
              ];
            };
            const resolveBackground = (element: Element) => {
              const layers: Rgba[] = [];
              for (let current: Element | null = element; current; current = current.parentElement) {
                layers.push(parseColor(getComputedStyle(current).backgroundColor));
              }
              return layers.reverse().reduce(
                (background, layer) => composite(layer, background),
                [255, 255, 255, 1] as Rgba,
              );
            };
            const luminance = (color: Rgba) => {
              const linear = color.slice(0, 3).map((channel) => {
                const normalized = channel / 255;
                return normalized <= 0.04045
                  ? normalized / 12.92
                  : ((normalized + 0.055) / 1.055) ** 2.4;
              });
              return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
            };
            const contrast = (foreground: Rgba, background: Rgba) => {
              const foregroundLuminance = luminance(composite(foreground, background));
              const backgroundLuminance = luminance(background);
              return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
                / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
            };
            const isRendered = (element: Element) => {
              const style = getComputedStyle(element);
              return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
            };

            const fields = Array.from(form.querySelectorAll("input:not([type='hidden']), textarea, select"))
              .filter(isRendered)
              .map((field) => {
                const style = getComputedStyle(field);
                const background = resolveBackground(field);
                const placeholder = field.matches("input, textarea")
                  ? getComputedStyle(field, "::placeholder").color
                  : null;
                return {
                  id: field.id,
                  backgroundImage: style.backgroundImage,
                  textContrast: contrast(parseColor(style.color), background),
                  placeholderContrast: placeholder ? contrast(parseColor(placeholder), background) : null,
                };
              });
            const labels = Array.from(form.querySelectorAll("label"))
              .filter(isRendered)
              .map((label) => ({
                text: label.textContent?.trim() || "label",
                contrast: contrast(parseColor(getComputedStyle(label).color), resolveBackground(label)),
              }));

            return { fields, labels };
          });

          expect(audit.fields.length).toBeGreaterThan(0);
          expect(audit.labels.length).toBeGreaterThan(0);
          for (const field of audit.fields) {
            expect(field.backgroundImage, `${field.id} must not inherit a light gradient`).not.toContain("linear-gradient");
            expect(field.textContrast, `${field.id} text contrast`).toBeGreaterThanOrEqual(4.5);
            if (field.placeholderContrast !== null) {
              expect(field.placeholderContrast, `${field.id} placeholder contrast`).toBeGreaterThanOrEqual(4.5);
            }
          }
          for (const label of audit.labels) {
            expect(label.contrast, `${label.text} label contrast`).toBeGreaterThanOrEqual(4.5);
          }
        });
      }
    }
  }

  for (const viewport of viewports) {
    for (const theme of themes) {
      test(`${viewport.name} ${theme} immersive header remains readable over the hero`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await setPublicTheme(page, theme);
        await page.goto("/zh", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("load");
        const header = page.locator(".scheme-a-chrome.is-overlay");
        const hero = page.locator(".scheme-a-hero");
        const directoryTrigger = viewport.name === "desktop"
          ? header.locator(".scheme-a-chrome__nav-more")
          : header.locator(".scheme-a-chrome__menu-trigger--compact");
        await expect(header).toBeVisible();
        await expect(directoryTrigger).toBeVisible();
        await expect(hero).toBeVisible();
        if (await hero.getAttribute("data-hero-art") === "daylight") {
          await expect(header).toHaveCSS("color", "rgb(41, 46, 41)");
          await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        }
        await expect.poll(async () => {
          const headerBottom = await header.evaluate((element) => element.getBoundingClientRect().bottom);
          const heroTop = await hero.evaluate((element) => element.getBoundingClientRect().top);
          return heroTop < headerBottom;
        }).toBe(true);
        const result = await header.evaluate((element) => {
          const surface = getComputedStyle(element);
          const hero = document.querySelector<HTMLElement>(".scheme-a-hero");
          return {
            surfaceImage: surface.backgroundImage,
            surfaceColor: surface.backgroundColor,
            foreground: surface.color,
            heroArt: hero?.dataset.heroArt,
            headerBottom: Math.round(element.getBoundingClientRect().bottom),
            heroTop: Math.round(hero?.getBoundingClientRect().top ?? -1),
          };
        });

        if (result.heroArt === "daylight") {
          expect(result.surfaceImage).toBe("none");
          expect(result.surfaceColor).toBe("rgba(0, 0, 0, 0)");
          expect(result.foreground).toBe("rgb(41, 46, 41)");
        } else {
          expect(result.surfaceImage).toContain("linear-gradient");
        }
        expect(result.heroTop).toBeLessThan(result.headerBottom);
      });
    }
  }

  for (const theme of themes) {
    test(`${theme} service CTA keeps its intended dark surface`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await setPublicTheme(page, theme);
      await page.goto("/zh/services/renovation", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const card = page.locator(".scheme-a-page-cta");
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      const styles = await card.evaluate((element) => ({
        backgroundColor: getComputedStyle(element).backgroundColor,
        titleColor: getComputedStyle(element.querySelector("h2") as Element).color,
        copyColor: getComputedStyle(element.querySelector(".scheme-a-page-cta__copy > span") as Element).color,
        primaryText: getComputedStyle(element.querySelector(".scheme-a-page-cta__button--primary") as Element).color,
        secondaryText: getComputedStyle(element.querySelector(".scheme-a-page-cta__button--secondary") as Element).color,
      }));

      expect(styles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(styles.titleColor).not.toBe("rgb(21, 28, 24)");
      expect(styles.copyColor).not.toBe("rgb(21, 28, 24)");
      expect(styles.primaryText).not.toBe("rgb(21, 28, 24)");
      expect(styles.secondaryText).not.toBe("rgb(21, 28, 24)");
    });
  }
});
