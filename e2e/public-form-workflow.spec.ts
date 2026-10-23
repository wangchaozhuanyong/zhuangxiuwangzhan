import { expect, test } from "@playwright/test";

type Attempt = { submissionId?: string; type: string; name: string };
type AuditWindow = Window & { syntheticLeadAttempts: Attempt[] };

// Intercept in the page before the SDK calls fetch: WebKit performs CORS preflight
// before Playwright's network routes. No submission may reach a production service.
test.beforeEach(async ({ page }) => {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const readRpc = request.method() === "POST" && url.pathname === "/rest/v1/rpc/get_public_home_bundle";
    if (/google-analytics|googletagmanager|googleadservices|doubleclick|clarity\.ms/.test(url.href)
      || (!["GET", "HEAD", "OPTIONS"].includes(request.method()) && !readRpc)) {
      return route.fulfill({ status: 204 });
    }
    await route.fallback();
  });
  await page.addInitScript(() => {
    const attempts: Attempt[] = [];
    Object.assign(window, { syntheticLeadAttempts: attempts });
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      if (url.pathname.endsWith("/functions/v1/submit-lead")) {
        const body = input instanceof Request ? await input.clone().text() : String(init?.body);
        attempts.push(JSON.parse(body) as Attempt);
        return new Response(JSON.stringify(attempts.length === 1
          ? { error: "Submission could not be saved. Please try again later." }
          : { ok: true, id: "cf00cf00-1234-4234-8234-012345678901", deduplicated: true }), {
          status: attempts.length === 1 ? 500 : 200, headers: { "content-type": "application/json" },
        });
      }
      return originalFetch(input, init);
    };
    const callbacks = new Map<string, (token: string) => void>();
    Object.assign(window, { turnstile: {
      render: (_container: HTMLElement, options: { callback: (token: string) => void }) => {
        const id = `synthetic-${callbacks.size}`;
        callbacks.set(id, options.callback);
        return id;
      },
      execute: (id: string) => callbacks.get(id)?.("synthetic-no-write-token"),
      remove: (id: string) => callbacks.delete(id),
    } });
  });
});

for (const language of ["zh", "en", "ms"] as const) {
  for (const width of [390, 1440]) {
    for (const kind of ["contact", "quote"] as const) {
      test(`${language} ${width}px ${kind}: validation, failure, retained draft and same-attempt retry`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const attempts = () => page.evaluate(() => (window as AuditWindow).syntheticLeadAttempts);
        await page.goto(`/${language}/${kind}`, { waitUntil: "domcontentloaded" });
        await expect(page.locator(".public-route-content")).toHaveAttribute("data-route-visual-state", "ready", { timeout: 30_000 });
        await expect(page.locator("form button[type=submit]")).toBeVisible();
        await page.locator("form button[type=submit]").click();
        await expect(page.locator(`[id^=${kind}-][role=alert]`).first()).toBeVisible();
        await expect(page.locator(`#${kind}-name`)).toBeFocused();
        expect(await attempts()).toHaveLength(0);

        await page.locator(`#${kind}-name`).fill("Synthetic isolated browser fixture");
        await page.locator(`#${kind}-phone`).fill("+601100000000");
        if (kind === "quote") {
          await page.locator("#quote-project-type").selectOption("Other");
          await page.locator("#quote-location").fill("Synthetic fixture location");
        } else {
          await page.locator("#contact-message").fill("Synthetic browser verification with no customer data.");
        }
        await page.locator("form button[type=submit]").click();
        await expect.poll(async () => (await attempts()).length).toBe(1);
        await expect(page.getByRole("alert").first()).toBeVisible();
        await expect(page.locator("form button[type=submit]")).toBeEnabled();
        await expect(page.locator(`#${kind}-name`)).toHaveValue("Synthetic isolated browser fixture");
        await page.locator("form button[type=submit]").click();
        if (kind === "quote") await expect(page.locator("#quote-success-status")).toBeVisible();
        else {
          await expect(page.locator("form")).toHaveCount(0);
          await expect(page.locator("#contact-form-title")).toBeVisible();
        }
        const savedAttempts = await attempts();
        expect(savedAttempts).toHaveLength(2);
        expect(savedAttempts[0].type).toBe(kind);
        expect(savedAttempts[0].submissionId).toMatch(/^[0-9a-f-]{36}$/);
        expect(savedAttempts[1].submissionId).toBe(savedAttempts[0].submissionId);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
      });
    }
  }
}
