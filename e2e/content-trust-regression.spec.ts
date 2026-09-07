import { expect, test, type Page } from "@playwright/test";

const gotoPublicPage = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor({ state: "visible" });
};

test.describe("public content trust boundaries", () => {
  test("homepage shows the same FAQ content exposed to structured data", async ({ page }) => {
    await gotoPublicPage(page, "/en");

    await expect(page.getByRole("heading", { name: "Clarify the essentials before an enquiry" })).toBeVisible();
    expect(await page.locator(".scheme-a-home-faq .fc-route-faq > div").count()).toBeGreaterThan(0);
    const hero = page.locator(".scheme-a-hero");
    await expect(hero).toContainText("Design & Build");
    await expect(hero).toContainText("Clear Quotes");
    await expect(hero).toContainText("Written scope and material details");
    const metricLayout = await hero.locator(".scheme-a-hero__metric-item").evaluateAll((items) => items.map((item) => {
      const title = item.querySelector<HTMLElement>("strong");
      const label = item.querySelector<HTMLElement>("span");
      return {
        itemWidth: item.getBoundingClientRect().width,
        titleTop: title?.getBoundingClientRect().top ?? 0,
        labelWidth: label?.getBoundingClientRect().width ?? 0,
        labelOverflow: label ? label.scrollWidth - label.clientWidth : 0,
      };
    }));
    expect(Math.max(...metricLayout.map((item) => item.titleTop)) - Math.min(...metricLayout.map((item) => item.titleTop))).toBeLessThanOrEqual(1);
    for (const metric of metricLayout) {
      expect(metric.labelWidth).toBeLessThanOrEqual(metric.itemWidth);
      expect(metric.labelOverflow).toBeLessThanOrEqual(1);
    }
    await expect(hero).not.toContainText("12+ Yrs");
    await expect(hero).not.toContainText("450+");
    await expect(hero).not.toContainText("Licensed & Scope Warranty");
    await expect(page.locator("main")).toContainText("PROJECT REFERENCES");
    await expect(page.locator("main")).not.toContainText("REAL PROJECTS");
  });

  test("office service hides editorial instructions and keeps relevant actions", async ({ page }) => {
    await gotoPublicPage(page, "/en/services/office-renovation");
    const main = page.locator("main");

    await expect(page.getByRole("heading", { level: 1, name: "Office Renovation & Fit-Out in Kuala Lumpur" })).toBeVisible();
    await expect(main).not.toContainText("This page should not state");
    await expect(main).not.toContainText("should not be expanded into unconfirmed");
    await expect(main).not.toContainText("flashcast001@gmail.com");
    await expect(main).toContainText("Shop Renovation & Retail Fit-Out");
    await expect(main).toContainText("Permit & Drawing Support");
    await expect(main.getByText("View Service", { exact: true })).toHaveCount(3);
    await expect(main.locator('a[href*="projectType=Office+Renovation"]').first()).toBeVisible();
  });

  test("Chinese shop service localizes the approval related-service card", async ({ page }) => {
    await gotoPublicPage(page, "/zh/services/shop-renovation");
    const main = page.locator("main");

    await expect(main).toContainText("装修准证与图纸支持");
    await expect(main).toContainText("根据房产类型与已确认项目范围，检查装修审批、管理方、图纸与文件协调需求。");
    await expect(main).not.toContainText("Permit & Drawing Support");
    await expect(main).not.toContainText("Review renovation approval");
  });

  test("generated project is presented as a concept without customer or timeline claims", async ({ page }) => {
    await gotoPublicPage(page, "/en/projects/mont-kiara-luxury-condo-renovation");
    const main = page.locator("main");

    await expect(page.getByRole("heading", { level: 1, name: "Luxury Condo Living & Dining Rendering Concept" })).toBeVisible();
    await expect(main).toContainText("Rendering Concept");
    await expect(main).toContainText("Planning Brief");
    await expect(main).not.toContainText("Client's Requirements");
    await expect(main).not.toContainText("8 weeks");
    await expect(main).not.toContainText("Mont Kiara, Kuala Lumpur");
    await expect(main.getByText("Request a Quote", { exact: true })).toBeVisible();
  });

  test("legacy project media follows the explicit rendering-concept disclosure", async ({ page }) => {
    await gotoPublicPage(page, "/en/projects/corporate-office-petaling-jaya");
    let main = page.locator("main");

    await expect(page.getByRole("heading", { level: 1, name: "Corporate Office Space Planning Rendering Concept" })).toBeVisible();
    await expect(main).toContainText("Rendering Concept");
    await expect(main).toContainText("Planning Brief");
    await expect(main).not.toContainText("Client's Requirements");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /rendering concept/i);

    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPublicPage(page, "/zh/projects/modern-condo-mont-kiara");
    main = page.locator("main");
    await expect(page.getByRole("heading", { level: 1, name: "现代公寓空间规划效果图概念" })).toBeVisible();
    await expect(main).toContainText("效果图概念");
    await expect(main).toContainText("规划说明");
    await expect(main).not.toContainText("客户需求");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /效果图概念/);
    const metrics = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });

  test("about and comparison pages avoid unsupported proof claims", async ({ page }) => {
    await gotoPublicPage(page, "/en/about");
    let main = page.locator("main");

    await expect(main).toContainText("How Work Is Coordinated");
    await expect(main).toContainText("How a Project Moves Forward");
    await expect(main).not.toContainText("Founded in 2015");
    await expect(main).not.toContainText("Mon-Sat: 9:00 AM - 6:00 PM");

    await gotoPublicPage(page, "/en/before-after");
    main = page.locator("main");
    await expect(page.getByRole("heading", { level: 1, name: "Space Planning Comparisons" })).toBeVisible();
    await expect(main).toContainText("Existing reference");
    await expect(main).toContainText("Planning direction");
    await expect(main).toContainText("not verified same-angle photos");
    await expect(main).not.toContainText("original condition with the completed space");
  });

  test("location references are labeled as concepts without fixed proof claims", async ({ page }) => {
    await gotoPublicPage(page, "/en/locations/mont-kiara");
    const main = page.locator("main");

    await expect(main).toContainText("Space Planning References for Mont Kiara");
    await expect(main).toContainText("Rendering concept");
    await expect(main).not.toContainText("completed numerous");
    await expect(main).not.toContainText("RM 5,000");
    await expect(main).not.toContainText("Free consultation and site measurement");
  });

  test("content trust sections do not overflow a 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/en", "/en/about", "/en/before-after", "/en/projects/mont-kiara-luxury-condo-renovation"]) {
      await gotoPublicPage(page, path);
      const metrics = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
      expect(metrics.scrollWidth, `${path} should not overflow horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1);
    }
  });
});
