import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const pages = [
  { path: "projects", selector: ".fc-route-hero-copy > p, .fc-route-section-head > p" },
  { path: "services", selector: ".fc-route-hero-copy > p, .fc-route-section-head > p" },
  { path: "materials", selector: ".fc-route-hero-copy > p, .fc-route-section-head > p" },
  { path: "blog", selector: ".fc-route-hero-copy > p, .fc-route-section-head > p" },
  { path: "", selector: ".scheme-a-hero__lead, .scheme-a-home-summary__description" },
  { path: "services/design", selector: ".fc-design .fcd-design-hero__lead, .fc-design .fcd-section-heading > p" },
] as const;

// The browser-compat filename opts into the existing Safari / Chrome projects.
test.describe("mobile paragraph wrapping", () => {

  for (const language of ["zh", "en"] as const) {
    for (const entry of pages) {
      test(`${language}/${entry.path || "home"} uses the available line width`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: 430, height: 932 });
        await page.goto(`/${language}/${entry.path}`, { waitUntil: "domcontentloaded" });
        const paragraphs = page.locator(entry.selector);
        await expect(paragraphs.first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);

        for (const width of [430, 360, 390, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: 932 });
          const audit = await paragraphs.evaluateAll((elements) => elements.map((element) => {
            const style = getComputedStyle(element);
            const bounds = element.getBoundingClientRect();
            const parent = element.parentElement!;
            const parentStyle = getComputedStyle(parent);
            const availableWidth = parent.clientWidth - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight);
            const lines: { top: number; left: number; right: number; text: string }[] = [];
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            while ((node = walker.nextNode())) {
              const text = node.textContent || "";
              for (let index = 0; index < text.length; index += 1) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + 1);
                const rect = range.getBoundingClientRect();
                if (!rect.width) continue;
                let line = lines.find((item) => Math.abs(item.top - rect.top) < 1);
                if (!line) {
                  line = { top: rect.top, left: rect.left, right: rect.right, text: "" };
                  lines.push(line);
                }
                line.left = Math.min(line.left, rect.left);
                line.right = Math.max(line.right, rect.right);
                line.text += text[index];
              }
            }
            return {
              text: element.textContent,
              width: bounds.width,
              availableWidth,
              fontSize: parseFloat(style.fontSize),
              textWrap: style.textWrap,
              whiteSpace: style.whiteSpace,
              lines: lines.map((line) => ({ text: line.text, unusedWidth: bounds.width - (line.right - line.left) })),
            };
          }));
          const auditPath = testInfo.outputPath(`wrapping-${width}.json`);
          await writeFile(auditPath, JSON.stringify(audit, null, 2));
          await testInfo.attach(`wrapping-${width}.json`, { path: auditPath, contentType: "application/json" });

          if (entry.path === "projects" && language === "zh" && (width === 430 || width === 1440)) {
            await page.screenshot({ path: testInfo.outputPath(`projects-${width}.png`), fullPage: false });
          }

          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
          for (const paragraph of audit) {
            expect(paragraph.text).not.toContain("�");
            if (width >= 768) continue;
            expect(paragraph.textWrap).toBe("wrap");
            expect(paragraph.whiteSpace).toBe("normal");
            expect(Math.abs(paragraph.width - paragraph.availableWidth)).toBeLessThanOrEqual(1);
            // Chinese punctuation may move with its preceding character.
            // Mixed English place names also legitimately move whole words.
            if (language === "zh" && !/[A-Za-z]/.test(paragraph.text || "")) {
              for (const line of paragraph.lines.slice(0, -1)) {
                expect(line.unusedWidth, line.text).toBeLessThan(paragraph.fontSize * 2.5);
              }
            }
          }
        }
      });
    }
  }
});
