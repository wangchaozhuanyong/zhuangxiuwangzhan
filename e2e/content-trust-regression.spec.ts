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
    await expect(hero).not.toContainText("12+ Yrs");
    await expect(hero).not.toContainText("450+");
    await expect(hero).not.toContainText("Licensed & Scope Warranty");
    await expect(page.locator("main")).toContainText("PROJECT REFERENCES");
    await expect(page.locator("main")).not.toContainText("REAL PROJECTS");
  });

  test("office service hides editorial instructions and keeps relevant actions", async ({ page }) => {
    await gotoPublicPage(page, "/en/services/office-renovation");
    const main = page.locator("main");

    await expect(page.getByRole("heading", { level: 1, name: "Office Renovation & Commercial Fit-Out Malaysia" })).toBeVisible();
    await expect(main).not.toContainText("This page should not state");
    await expect(main).not.toContainText("should not be expanded into unconfirmed");
    await expect(main).not.toContainText("flashcast001@gmail.com");
    await expect(main).toContainText("Shop Renovation & Retail Fit-Out");
    await expect(main).toContainText("Permit & Drawing Support");
    await expect(main.getByText("View Service", { exact: true })).toHaveCount(3);
    await expect(main.locator('a[href*="projectType=Office+Renovation"]')).toBeVisible();
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
