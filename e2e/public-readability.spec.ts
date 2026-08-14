import { expect, test, type Page } from "@playwright/test";

type Theme = "light" | "dark";

const themes: Theme[] = ["light", "dark"];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
];

async function setPublicTheme(page: Page, theme: Theme) {
  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await page.evaluate((value) => localStorage.setItem("flashcast-public-theme", value), theme);
}

test.describe("public text readability", () => {
  for (const viewport of viewports) {
    for (const theme of themes) {
      for (const formPage of [
        { path: "/zh/contact", selector: ".forest-contact-form form" },
        { path: "/zh/quote", selector: ".forest-quote-form form" },
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
            expect(field.backgroundImage, `${field.id} must not inherit a light gradient`).toBe("none");
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
      test(`${viewport.name} ${theme} overlay header has a deterministic contrast layer`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await setPublicTheme(page, theme);
        await page.goto("/zh", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("load");
        const header = page.locator(".site-header.is-overlay");
        await expect(header).toBeVisible();
        await expect.poll(() => header.evaluate((element) => {
          const targets = Array.from(element.querySelectorAll(
            ".site-header__nav-link, .site-header__language-option, .site-header__control, .site-header__icon-action, .site-header__quote-button, .site-header__mobile-button",
          )).filter((target) => {
            const style = getComputedStyle(target);
            return style.display !== "none" && style.visibility !== "hidden" && target.getClientRects().length > 0;
          });
          return targets.length > 0 && targets.every((target) => getComputedStyle(target).color === "rgb(255, 255, 255)");
        }), { timeout: 3_000 }).toBe(true);

        const result = await header.evaluate((element) => {
          const scrim = getComputedStyle(element, "::before");
          const textTargets = Array.from(element.querySelectorAll(
            ".site-header__nav-link, .site-header__language-option, .site-header__control, .site-header__icon-action, .site-header__quote-button, .site-header__mobile-button",
          )).filter((target) => {
            const style = getComputedStyle(target);
            return style.display !== "none" && style.visibility !== "hidden" && target.getClientRects().length > 0;
          });
          const weakestOpacity = Math.min(...textTargets.map((target) => Number(getComputedStyle(target).opacity)));
          const stops = Array.from(scrim.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)).map((match) => {
            const channels = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
            return [channels[0], channels[1], channels[2], channels[3] ?? 1];
          });
          const luminance = (color: number[]) => {
            const linear = color.slice(0, 3).map((channel) => {
              const normalized = channel / 255;
              return normalized <= 0.04045
                ? normalized / 12.92
                : ((normalized + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
          };
          const worstCaseContrast = Math.min(...stops.map((stop) => {
            const surface = stop.slice(0, 3).map((channel) => channel * stop[3] + 255 * (1 - stop[3]));
            const foreground = surface.map((channel) => 255 * weakestOpacity + channel * (1 - weakestOpacity));
            return (luminance(foreground) + 0.05) / (luminance(surface) + 0.05);
          }));

          return {
            backgroundImage: scrim.backgroundImage,
            opacity: Number(scrim.opacity),
            colors: textTargets.map((target) => getComputedStyle(target).color),
            weakestOpacity,
            worstCaseContrast,
            blendModes: Array.from(element.querySelectorAll(".site-header__brand, .site-header__nav-link"))
              .map((target) => getComputedStyle(target).mixBlendMode),
          };
        });

        expect(result.backgroundImage).toContain("linear-gradient");
        expect(result.backgroundImage).not.toBe("none");
        expect(result.opacity).toBe(1);
        expect(result.colors.length).toBeGreaterThan(0);
        expect(result.colors.every((color) => color === "rgb(255, 255, 255)")).toBe(true);
        expect(result.weakestOpacity).toBeGreaterThanOrEqual(0.86);
        expect(result.worstCaseContrast).toBeGreaterThanOrEqual(4.5);
        expect(result.blendModes.every((mode) => mode === "normal")).toBe(true);
      });
    }
  }

  for (const theme of themes) {
    test(`${theme} project CTA keeps its intended dark surface`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await setPublicTheme(page, theme);
      await page.goto("/zh/projects/modern-condo-mont-kiara", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      const card = page.locator(".subpage-dark-card");
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      const styles = await card.evaluate((element) => ({
        backgroundImage: getComputedStyle(element).backgroundImage,
        titleColor: getComputedStyle(element.querySelector("h3") as Element).color,
        copyColor: getComputedStyle(element.querySelector("p") as Element).color,
        primaryText: getComputedStyle(element.querySelector(".btn-on-dark-primary") as Element).color,
        secondaryText: getComputedStyle(element.querySelector(".btn-on-dark-secondary") as Element).color,
      }));

      expect(styles.backgroundImage).toContain("linear-gradient");
      expect(styles.titleColor).not.toBe("rgb(21, 28, 24)");
      expect(styles.copyColor).not.toBe("rgb(21, 28, 24)");
      expect(styles.primaryText).not.toBe("rgb(21, 28, 24)");
      expect(styles.secondaryText).not.toBe("rgb(21, 28, 24)");
    });
  }
});
