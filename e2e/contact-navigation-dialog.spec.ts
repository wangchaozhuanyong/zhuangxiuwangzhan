import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

for (const { width, selector } of [
  { width: 390, selector: ".public-contact-list button[aria-haspopup='dialog']" },
  { width: 1440, selector: ".forest-map-heading button[aria-haspopup='dialog']" },
]) {
  test(`contact navigation closes on its first Escape and restores focus at ${width}px`, async ({ context, page, baseURL }) => {
    const base = new URL(baseURL!);
    const isLocal = ["127.0.0.1", "localhost"].includes(base.hostname);
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const sameOrigin = url.origin === base.origin;
      if (sameOrigin && url.pathname === "/__visit") return route.fulfill({ status: 204 });
      const tracking = /^\/(?:cdn-cgi\/rum|__analytics|__track)(?:\/|$)/.test(url.pathname);
      const publicContent = url.protocol === "https:" && url.hostname.endsWith(".supabase.co") &&
        /^\/(?:rest\/v1\/(?:site_pages|site_settings)$|storage\/v1\/(?:object|render\/image)\/public\/)/.test(url.pathname);
      if (!/^(GET|HEAD)$/.test(request.method()) || tracking || (!sameOrigin && (isLocal || !publicContent))) {
        return route.abort();
      }
      if (isLocal && sameOrigin && url.pathname === "/zh/contact" && request.isNavigationRequest()) {
        const response = await route.fetch();
        const html = await response.text();
        const seed = `<script id="flashcast-public-data" type="application/json">${JSON.stringify({
          sitePages: { contact: { site_pages: [{ id: "fixture-contact", page_key: "contact", title_zh: "联系我们" }] } },
          siteSettings: {},
          ctaBlocks: { home_final: null },
        })}</script>`;
        return route.fulfill({ response, body: html.includes('id="flashcast-public-data"') ? html : html.replace("</head>", `${seed}</head>`) });
      }
      return route.continue();
    });
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/zh/contact", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".public-route-content")).toHaveAttribute("data-route-visual-state", "ready", { timeout: 15_000 });

    const trigger = page.locator(selector);
    const dialog = page.locator(".navigation-dialog");
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.evaluate(() => {
      // Dispatch at the first focus transfer, before waiting for the dialog's enter animation.
      function escapeOnDialogFocus(event: FocusEvent) {
        if (!(event.target instanceof Element) || !event.target.closest('.navigation-dialog[data-state="open"]')) return;
        document.removeEventListener("focusin", escapeOnDialogFocus);
        document.documentElement.dataset.testContactEscape = "sent";
        event.target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      }
      document.addEventListener("focusin", escapeOnDialogFocus);
    });
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-test-contact-escape", "sent");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog).toHaveAttribute("data-state", "open");
    await expect(dialog.getByRole("link")).toHaveCount(3);
    await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
    await expect(dialog).toHaveCSS("opacity", "1");
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
