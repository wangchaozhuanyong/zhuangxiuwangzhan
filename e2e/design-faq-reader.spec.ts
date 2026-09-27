import { expect, test, type Locator } from "@playwright/test";
import { resolve } from "node:path";

const evidence = resolve("audits/design-faq-reader-20260927", process.env.PLAYWRIGHT_BASE_URL?.startsWith("https:") ? "production" : "local");
const copy = {
  zh: { title: "常见问题", answers: ["现有平面图", "以正式报价为准", "修改轮次及交付格式", "实际衔接方式按项目约定执行"] },
  en: { title: "Frequently asked questions", answers: ["available plans", "formal quotation", "revisions and file formats", "actual arrangement follows the project agreement"] },
};
const feedback = (tab: Locator) => tab.evaluate(element => {
  const label = element.querySelector(".fcd-faq-question__text")!;
  return { background: getComputedStyle(element).backgroundColor, outline: getComputedStyle(element).outlineStyle,
    shadow: getComputedStyle(element).boxShadow, border: getComputedStyle(element).borderWidth,
    decoration: getComputedStyle(label).textDecorationLine, decorationStyle: getComputedStyle(label).textDecorationStyle,
    keyboardFocus: element.matches(":focus-visible") };
});

for (const language of ["zh", "en"] as const) {
  test(`design FAQ uses a separate reading area with keyboard feedback (${language})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${language}/services/design`);
    const section = page.getByRole("region", { name: copy[language].title, exact: true });
    const tabs = section.getByRole("tab");
    await expect(tabs).toHaveCount(4);
    await expect(section.locator(".fc-route-faq")).toHaveCount(0);
    await expect(section.getByRole("tabpanel")).toHaveCount(1);
    await expect(section.getByRole("tabpanel")).toContainText(copy[language].answers[0]);
    for (let i = 0; i < 4; i++) {
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute("aria-selected", "true");
      await expect(section.getByRole("tabpanel")).toHaveCount(1);
      await expect(section.getByRole("tabpanel")).toContainText(copy[language].answers[i]);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await tabs.last().focus();
    await page.keyboard.press("Home");
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(section.getByRole("tabpanel")).toContainText(copy[language].answers[1]);
    const focused = await feedback(tabs.nth(1));
    expect(focused).toMatchObject({ background: "rgba(0, 0, 0, 0)", outline: "none", shadow: "none", border: "0px", decoration: "underline", decorationStyle: "double", keyboardFocus: true });
    await tabs.nth(1).hover();
    expect((await feedback(tabs.nth(1))).background).toBe(focused.background);
    await page.keyboard.press("End");
    await expect(tabs.last()).toBeFocused();
    await expect(section.getByRole("tabpanel")).toContainText(copy[language].answers[3]);
    await page.keyboard.press("Tab");
    await expect(section.getByRole("tabpanel")).toBeFocused();
    await section.screenshot({ path: resolve(evidence, `${language}-desktop.png`) });
    const schema = await page.locator('script[type="application/ld+json"]').evaluateAll(elements => elements.map(e => JSON.parse(e.textContent || "{}")));
    const faq = schema.find(item => item["@type"] === "FAQPage");
    expect(faq.mainEntity).toHaveLength(4);
    expect(faq.mainEntity.every((item: { acceptedAnswer: { text: string } }) => item.acceptedAnswer.text.length > 20)).toBe(true);
  });
}

test.describe("mobile question selection", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  for (const language of ["zh", "en"] as const) {
    test(`design FAQ remains interactive by touch (${language})`, async ({ page }) => {
      await page.goto(`/${language}/services/design`);
      const section = page.getByRole("region", { name: copy[language].title, exact: true });
      const tabs = section.getByRole("tab");
      for (let i = 3; i >= 0; i--) {
        await tabs.nth(i).tap();
        await expect(tabs.nth(i)).toHaveAttribute("aria-selected", "true");
        await expect(section.getByRole("tabpanel")).toContainText(copy[language].answers[i]);
        const rect = await tabs.nth(i).boundingBox();
        expect(rect!.height).toBeGreaterThanOrEqual(44);
        expect((await feedback(tabs.nth(i))).background).toBe("rgba(0, 0, 0, 0)");
      }
      await section.screenshot({ path: resolve(evidence, `${language}-mobile.png`) });
      await section.getByRole("tabpanel").scrollIntoViewIfNeeded();
      const answer = await section.getByRole("tabpanel").getByRole("paragraph").boundingBox();
      expect(answer!.y + answer!.height).toBeLessThanOrEqual(844 - 60);
    });
  }
});

test("question navigation and answers fit desktop and mobile layouts in both languages", async ({ page }) => {
  for (const language of ["zh", "en"] as const) {
    await page.goto(`/${language}/services/design`);
    const section = page.getByRole("region", { name: copy[language].title, exact: true });
    await expect(section.getByRole("tab")).toHaveCount(4);
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await section.evaluate(element => {
        const questions = element.querySelector(".fcd-faq-questions")!.getBoundingClientRect();
        const panel = element.querySelector('.fcd-faq-answer:not([hidden])')!.getBoundingClientRect();
        const controls = Array.from(element.querySelectorAll("[role=tab]")).map(button => button.getBoundingClientRect());
        return { overflow: document.documentElement.scrollWidth > innerWidth, questions: questions.toJSON(), panel: panel.toJSON(),
          controlsFit: controls.every(rect => rect.left >= 0 && rect.right <= innerWidth && rect.height >= 44) };
      });
      expect(layout.overflow, `${language} at ${width}`).toBe(false);
      expect(layout.controlsFit).toBe(true);
      if (width < 768) expect(layout.panel.top).toBeGreaterThanOrEqual(layout.questions.bottom);
      else expect(layout.panel.left).toBeGreaterThanOrEqual(layout.questions.right);
    }
  }
});
