import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import wechatContact from "../src/config/wechatContact.json" with { type: "json" };

function pendingAsset() {
  let release!: () => void;
  const wait = new Promise<void>(resolveWait => { release = resolveWait; });
  return { wait, release };
}

const origin = "https://locks.flashcast.com.my";

async function serveShowroom(page: Page, beforeAsset?: (path: string) => Promise<void>) {
  const showroom = resolve("public/anzhe-showroom");
  await page.route(origin + "/**", async route => {
    const path = new URL(route.request().url()).pathname;
    await beforeAsset?.(path);
    const file = ["/public-section-spacing.css", "/public-contact-entry.css", wechatContact.wechatQrUrl, wechatContact.wechatQrDownloadUrl.split("?")[0]].includes(path) ? resolve("public", "." + path)
      : resolve(showroom, "." + path + (path.endsWith("/") ? "index.html" : ""));
    await route.fulfill({ path: file });
  });
}

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });

test("shows all four navigation entries with a separate text-only return on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await serveShowroom(page);
  await page.goto(origin + "/zh/#fc-return=%2Fzh%2Ffurniture");
  await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
  const back = page.locator(".mast-return");
  await expect(back).toHaveText("返回主站");
  await expect(back).toHaveAttribute("href", "https://flashcast.com.my/zh/furniture");
  await expect(back.locator("svg")).toHaveCount(0);
  await expect(page.locator(".mast-contact")).toBeHidden();
  const toolbarCenters = await page.locator(".mast-return, .mast .brand, .mast .lang-switch").evaluateAll(controls =>
    controls.map(control => {
      const bounds = control.getBoundingClientRect();
      return bounds.top + bounds.height / 2;
    }),
  );
  expect(Math.max(...toolbarCenters) - Math.min(...toolbarCenters)).toBeLessThan(1);
  const nav = page.locator(".site-nav");
  await expect(nav.locator(":scope > :is(a,button)")).toHaveText(["选购门锁", "型号对比", "安装服务", "联系我们"]);
  await expect.poll(() => nav.evaluate(el => el.scrollWidth - el.clientWidth)).toBe(0);
});

test("a delayed showroom stylesheet and visible lock photo keep their place in the initial mobile handoff", async ({ page }) => {
  const style = pendingAsset();
  const photo = pendingAsset();
  await serveShowroom(page, async path => {
    if (path === "/studio.css") await style.wait;
    if (path === "/assets/v37-out.webp") await photo.wait;
  });
  try {
    await page.goto(origin + "/zh/", { waitUntil: "commit" });
    const root = page.locator("#root");
    await expect(page.locator("#flashcast-public-boot")).toBeVisible();
    await expect(root).toHaveAttribute("inert", "");
    style.release();
    await page.waitForFunction(() => window.showroomInteractive && !document.querySelector('link[data-public-style]:not([media="all"])'));
    const image = page.locator('.hero-board img[src$="v37-out.webp"]');
    await expect(image).toBeInViewport();
    await expect(root).toHaveAttribute("inert", "");
    photo.release();
    await expect(root).not.toHaveAttribute("inert", "");
    expect(await image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const contact = page.locator("#quick-contact .fc-contact-entry");
    await expect(contact).toBeVisible();
    await expect(contact).toHaveAccessibleName("联系我们");
  } finally {
    style.release();
    photo.release();
  }
});

test("keeps the contact launcher in place while mobile visitors scroll past catalogue controls", async ({ page }) => {
  await serveShowroom(page);
  await page.goto(origin + "/zh/");
  await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
  const contact = page.locator("#quick-contact .fc-contact-entry");
  await expect(contact).toBeVisible();
  const samples = await contact.evaluate(async button => {
    const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
    await document.fonts.ready;
    await frame();
    await frame();
    const positions = [button.getBoundingClientRect().top];
    for (let y = 32; y <= 640; y += 32) {
      window.scrollTo({ top: y, behavior: "instant" });
      await frame();
      await frame();
      if (getComputedStyle(button).visibility !== "visible") return [];
      positions.push(button.getBoundingClientRect().top);
    }
    return positions;
  });
  expect(samples).toHaveLength(21);
  expect(Math.max(...samples) - Math.min(...samples), JSON.stringify(samples)).toBeLessThan(1);
});

test("lets visitors tap the featured lock when the action row reaches the floating contact entry", async ({ page }) => {
  await serveShowroom(page);
  await page.goto(origin + "/en/");
  await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
  const featured = page.locator("[data-show-featured]");
  const contact = page.locator("#quick-contact .fc-contact-entry");
  await expect(contact).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const button = (await featured.boundingBox())!;
  const launcher = (await contact.boundingBox())!;
  const point = { x: button.x + button.width / 2, y: button.y + button.height / 2 };
  const bottomInset = page.viewportSize()!.height - launcher.y - launcher.height;
  await page.setViewportSize({ width: 390, height: Math.round(point.y + launcher.height / 2 + bottomInset) });
  await expect(contact).toBeHidden();
  await page.touchscreen.tap(point.x, point.y);
  await expect(page.locator("#details")).toBeVisible();
  await expect(page.locator("#qc-options")).toBeHidden();
  await page.locator("#details [data-dir-back]").tap();
  await page.evaluate(() => window.scrollBy({ top: 140, behavior: "instant" }));
  await expect(contact).toBeVisible();
  await contact.tap();
  await expect(page.locator("#qc-options")).toBeVisible();
});

test("keeps contact available through the model index and footer, yielding to an open detail dialog", async ({ page }) => {
  await serveShowroom(page);
  await page.goto(origin + "/zh/");
  await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
  const contact = page.locator("#quick-contact .fc-contact-entry");
  await expect(contact).toBeVisible();
  await page.evaluate(async () => { await document.fonts.ready; });
  const corner = (await contact.boundingBox())!;

  for (const section of ["#model-details", "#contact", "#model-details"]) {
    await page.locator(section).evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
    const stayedAtCorner = await contact.evaluate(async (button, position) => {
      // Include the frames after scrolling settles, when the old placement timer ran.
      const end = performance.now() + 400;
      do {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        const box = button.getBoundingClientRect();
        if (getComputedStyle(button).visibility !== "visible" || box.width === 0 ||
            Math.abs(box.x - position.x) >= 1 || Math.abs(box.y - position.y) >= 1) return false;
      } while (performance.now() < end);
      return true;
    }, corner);
    expect(stayedAtCorner, section).toBe(true);
    if (section === "#contact") {
      await contact.tap();
      await expect(page.locator('#qc-options [data-qc="wa"]')).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(contact).toBeFocused();
      await expect(contact).toHaveAttribute("aria-expanded", "false");
    }
  }

  await page.locator('[data-dir-card="f8"]').tap();
  const details = page.locator("#details");
  await expect(details).toBeVisible();
  await expect(contact).toBeHidden();
  await details.locator("[data-dir-back]").tap();
  await expect(details).toBeHidden();
  await expect(contact).toBeVisible();
});

for (const lang of ["zh", "en", "ms"]) {
  test(`opens the shared WeChat QR and copies the configured ID in the ${lang} showroom`, async ({ page }) => {
    await serveShowroom(page);
    await page.addInitScript(() => {
      let copied = "";
      Object.defineProperty(navigator, "clipboard", { value: {
        writeText: async (value: string) => { copied = value; },
        readText: async () => copied,
      } });
    });
    await page.goto(origin + "/" + lang + "/#collection");
    await page.locator("#quick-contact .fc-contact-entry").tap();
    const panel = page.locator("#qc-options");
    await expect(panel.locator('[data-qc="wa"]')).toBeFocused();
    const qr = panel.locator(".fc-contact-panel__wechat");
    await expect(qr).toBeHidden();
    await panel.locator("summary").tap();
    await expect(qr).toBeVisible();
    await expect(qr.locator("img")).toBeInViewport({ ratio: 1 });
    await expect(qr.locator("[data-contact-wechat]")).toHaveText(wechatContact.wechatId);
    await expect(page).toHaveURL(origin + "/" + lang + "/#collection");
    const digest = await qr.locator("img").evaluate(async node => {
      const image = node as HTMLImageElement;
      await image.decode();
      const response = await fetch(image.currentSrc);
      const hash = await crypto.subtle.digest("SHA-256", await response.arrayBuffer());
      return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
    });
    const sharedQr = readFileSync(resolve("public", "." + wechatContact.wechatQrUrl));
    expect(digest).toBe(createHash("sha256").update(sharedQr).digest("hex"));
    const [download] = await Promise.all([page.waitForEvent("download"), qr.locator("a[download]").tap()]);
    expect(download.suggestedFilename()).toBe("FLASH-CAST-WeChat.png");
    const png = readFileSync(resolve("public", "." + wechatContact.wechatQrDownloadUrl.split("?")[0]));
    // This fixture intercepts browser requests. Chromium delegates the final file transfer
    // outside the intercepted page, so read the same URL through the page to verify bytes.
    const savedDigest = await qr.locator("a[download]").evaluate(async anchor => {
      const response = await fetch((anchor as HTMLAnchorElement).href);
      const hash = await crypto.subtle.digest("SHA-256", await response.arrayBuffer());
      return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
    });
    expect(savedDigest).toBe(createHash("sha256").update(png).digest("hex"));
    const copy = qr.locator("[data-copy-wechat]");
    await copy.tap();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(wechatContact.wechatId);

    if (lang === "zh") {
      await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error("Denied"); }; });
      await copy.tap();
      await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe(wechatContact.wechatId);
    }
    await expect(qr).toBeVisible();
    await page.goBack();
    await expect(qr).toBeHidden();
    await expect(page).toHaveURL(origin + "/" + lang + "/#collection");
    await page.locator("#quick-contact button").tap();
    await expect(qr).toBeHidden();
    await expect(panel.locator('[data-qc="wa"]')).toBeFocused();
    await page.keyboard.press("Escape");
    const wechatEntry = page.locator("#contact .ct-wechat summary");
    await wechatEntry.tap();
    await expect(qr.locator("[data-copy-wechat]")).toBeFocused();
    await expect(qr.locator("a[download]")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(wechatEntry).toBeFocused();
  });
  test(`keeps the selected model or category in the ${lang} floating enquiry`, async ({ page }) => {
    await serveShowroom(page);
    for (const slug of ["f8", "type/entrance-door"]) {
      await page.goto(origin + "/" + lang + "/lock/" + slug + "/");
      const enquiry = page.locator('.model-actions a[href^="https://wa.me/"], .hero-actions a[href^="https://wa.me/"]');
      const expected = await enquiry.first().evaluate(a => (a as HTMLAnchorElement).href);
      await page.locator("footer").scrollIntoViewIfNeeded();
      const trigger = page.locator("#quick-contact button");
      await trigger.tap();
      const panel = page.getByRole("dialog");
      await expect(panel.locator('[data-qc="wa"]')).toHaveAttribute("href", expected!);
      await expect(panel.locator("[data-qc=visit]")).toHaveAttribute("href", "/" + lang + "/#contact");
      await expect(panel.locator("details")).not.toHaveAttribute("open", "");
      await page.goBack();
      await expect(panel).toBeHidden();
      await expect(trigger).toBeFocused();
      await page.goForward();
      await expect(panel).toBeVisible();
    }
  });
}

for (const section of ["hero", "specifications", "installation"]) {
  test(`recovers from delayed scripts while reading ${section}`, async ({ page }) => {
    const script = pendingAsset();
    await serveShowroom(page, async path => { if (path === "/studio.js") await script.wait; });
    try {
      await page.goto(origin + "/zh/", { waitUntil: "commit" });
      await page.locator('[data-boot-action="continue"]').click();
      const sheets = page.locator(".static-catalog article");
      await expect(sheets).toHaveCount(17);
      const sheet = sheets.nth(3);
      const installation = page.locator("#installation");
      let originalTop = 0;
      if (section === "specifications") await sheet.evaluate(el => el.scrollIntoView({ block: "start" }));
      if (section === "installation") {
        await installation.evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
        originalTop = (await installation.boundingBox())!.y;
      }
      script.release();
      await page.waitForFunction(() => window.showroomInteractive);
      if (section === "specifications") {
        await expect(sheet).toBeInViewport();
        await page.locator('.site-nav a[href="#collection"]').click();
      }
      await expect(sheets).toHaveCount(0);
      if (section === "installation") expect(Math.abs((await installation.boundingBox())!.y - originalTop)).toBeLessThan(2);
      await expect(page.locator("#directory")).toBeVisible();
      await page.locator('[data-dir-card="f8"]').click();
      await expect(page.locator("#details")).toBeVisible();
    } finally {
      script.release();
    }
  });
}

for (const selector of ['[data-dir-card="f8"]', '[data-show-featured]']) {
  test(`mobile detail from ${selector} respects touch and keyboard focus`, async ({ page }) => {
    await serveShowroom(page);
    await page.goto(origin + "/zh/");
    const opener = page.locator(selector);
    const dialog = page.locator("#details");
    const back = dialog.locator("[data-dir-back]");
    await opener.tap();
    await expect(dialog).toBeFocused();
    await expect(back).toHaveCSS("outline-style", "none");
    await back.tap();
    await expect(opener).toBeFocused();
    await opener.press("Enter");
    await expect(back).toBeFocused();
    await expect(back).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
  });
}

test("comparison cards, specification columns and the two footer actions stay aligned", async ({ page }) => {
  await serveShowroom(page);
  await page.goto(origin + "/zh/");
  await page.locator("[data-example]").click();
  for (const width of [320, 500, 640, 641, 1100]) {
    await page.setViewportSize({ width, height: 844 });
    const panel = page.locator("#panel");
    const cards = panel.locator(".pn-pair > [data-slot]");
    const values = panel.locator(".pn-spec-table").first().locator("tbody tr").first().locator("td");
    for (const index of [0, 1]) {
      const card = (await cards.nth(index).boundingBox())!;
      const value = (await values.nth(index).boundingBox())!;
      expect(Math.abs(card.x - value.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(card.width - value.width)).toBeLessThanOrEqual(1);
    }
    const footer = panel.locator(".pn-comparison-actions");
    const row = (await footer.boundingBox())!;
    const first = (await footer.locator("a").boundingBox())!;
    const second = (await footer.locator("button").boundingBox())!;
    expect(Math.abs(first.width - second.width)).toBeLessThanOrEqual(1);
    expect(first.y).toBe(second.y);
    expect(Math.abs(first.x - row.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(second.x + second.width - row.x - row.width)).toBeLessThanOrEqual(1);
  }
});
