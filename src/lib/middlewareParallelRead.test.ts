import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { getPublicHtmlCacheRequest, getPublicHtmlFreshnessRequest } from "../../functions/publicHtmlCache";

const shell = '<!doctype html><html><head><title>FLASH CAST</title></head><body><div id="root"></div></body></html>';
const html = (body: string) => new Response(body, { headers: { "content-type": "text/html", etag: '"fixture"' } });
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));
let sequence = 0;
const environment = () => ({
  VITE_SUPABASE_URL: `https://parallel-read-${++sequence}.supabase.co`, VITE_SUPABASE_ANON_KEY: "fixture-public-key",
  CF_PAGES_COMMIT_SHA: "parallel-read-fixture", ASSETS: { fetch: vi.fn(async () => html(shell)) },
});
beforeEach(() => vi.stubGlobal("caches", undefined));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("public HTML dependency ordering", () => {
  it.each([
    { language: "en" as const, displayOnly: false },
    { language: "zh" as const, displayOnly: false },
    { language: "en" as const, displayOnly: true },
    { language: "zh" as const, displayOnly: true },
  ])("hydrates the configured public contacts without a settings request: $language, displayOnly=$displayOnly", async ({ language, displayOnly }) => {
    const env = environment();
    const settings = {
      id: "default", company_name: "Public contact fixture", updated_at: "contact-fixture-revision",
      phone_e164: displayOnly ? "" : "+60 3-1234 5678", phone_display: "03 1234 5678", whatsapp_number: "+60 (12) 345-6789",
      admin_only_fixture: "MUST_NOT_ENTER_PUBLIC_SEED",
    };
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (!url.pathname.endsWith("/site_settings")) return json([]);
      expect(url.searchParams.get("id")).toBe("eq.default");
      expect(url.searchParams.get("limit")).toBe("1");
      const selected = url.searchParams.get("select")!.split(",");
      expect(selected).not.toContain("*");
      return json([Object.fromEntries(selected.filter(key => key in settings).map(key => [key, settings[key as keyof typeof settings]]))]);
    });
    vi.stubGlobal("fetch", fetcher);
    const response = await onRequest({ request: new Request(`https://flashcast.com.my/${language}`), env, next: vi.fn() } as never);
    const body = await response.text();
    const document = new DOMParser().parseFromString(body, "text/html");
    const payload = JSON.parse(document.getElementById("flashcast-public-data")!.textContent!);
    expect(response.status).toBe(200);
    expect(payload.siteSettings).toMatchObject({ id: "default", phone_e164: settings.phone_e164, phone_display: settings.phone_display, whatsapp_number: settings.whatsapp_number, updated_at: settings.updated_at });
    expect(body).not.toContain(settings.admin_only_fixture);

    vi.resetModules();
    const { QueryClient } = await import("@tanstack/react-query");
    const { claimPublicQuerySeed } = await import("@/lib/publicQuerySeedCache");
    const { resolveSiteSettings } = await import("@/lib/siteSettingsApi");
    const previousBody = window.document.body.innerHTML;
    try {
      const node = window.document.createElement("script");
      node.id = "flashcast-public-data";
      node.type = "application/json";
      node.textContent = JSON.stringify(payload);
      window.document.body.replaceChildren(node);
      fetcher.mockClear();
      const seeded = claimPublicQuerySeed(new QueryClient(), ["site-settings"]);
      const resolved = resolveSiteSettings(seeded as Parameters<typeof resolveSiteSettings>[0], language);
      expect(resolved.phone_display).toBe(settings.phone_display);
      expect(resolved.phone_href).toBe(displayOnly ? "tel:0312345678" : "tel:+60312345678");
      expect(new URL(resolved.whatsapp_url()).pathname).toBe("/60123456789");
      expect(new URL(resolved.whatsapp_url()).searchParams.get("text")).toContain(language === "zh" ? "你好 FLASH CAST" : "Hi FLASH CAST");
      expect(new URL(resolved.whatsapp_url("  fixture enquiry  ")).searchParams.get("text")).toBe("fixture enquiry");
      expect(fetcher).not.toHaveBeenCalled();
    } finally {
      window.document.body.innerHTML = previousBody;
    }
  });

  it.each([false, true])("overlaps cache lookup with settings validation without serving a changed revision: changed=%s", async changed => {
    const env = environment();
    let finishSettings!: (response: Response) => void;
    let held = false;
    const fetcher = vi.fn(async () => held ? new Promise<Response>(resolve => { finishSettings = resolve; })
      : json([{ company_name: "Current fixture", updated_at: "revision-a" }]));
    vi.stubGlobal("fetch", fetcher);
    await onRequest({ request: new Request("https://flashcast.com.my/__flashcast/version"), env, next: vi.fn() } as never);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 6000);
    const request = new Request("https://flashcast.com.my/zh/services");
    const keyA = getPublicHtmlCacheRequest(request, env, "revision-a");
    const keyB = getPublicHtmlCacheRequest(request, env, "revision-b");
    const entries = new Map([
      [keyA.url, "CONFIRMED_REVISION_A"], [getPublicHtmlFreshnessRequest(keyA).url, "fresh"],
      [keyB.url, "CONFIRMED_REVISION_B"], [getPublicHtmlFreshnessRequest(keyB).url, "fresh"],
    ]);
    const match = vi.fn(async (cacheRequest: Request) => entries.has(cacheRequest.url) ? html(entries.get(cacheRequest.url)!) : undefined);
    vi.stubGlobal("caches", { default: { match, put: vi.fn() } });
    held = true;
    const pending = onRequest({ request, env, next: vi.fn() } as never);
    await tick();
    expect(match).toHaveBeenCalledWith(expect.objectContaining({ url: keyA.url }));
    expect(finishSettings).toBeTypeOf("function");
    finishSettings(json([{ company_name: "Current fixture", updated_at: changed ? "revision-b" : "revision-a" }]));
    const response = await pending;
    expect(await response.text()).toBe(changed ? "CONFIRMED_REVISION_B" : "CONFIRMED_REVISION_A");
    expect(response.headers.get("x-flashcast-html-cache")).toBe("hit");
    expect(response.headers.get("cache-control")).toBe("no-cache, max-age=0, must-revalidate");
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("starts the shell, page seed and collection revision before slow route metadata completes", async () => {
    const env = environment();
    const requests: URL[] = [];
    let finishRoute!: (response: Response) => void;
    const servicePage = { id: "service-page", page_key: "services", path: "/services", status: "published", title_zh: "当前服务", title_en: "Current services", updated_at: "2026-10-10T00:00:00Z" };
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input)); requests.push(url);
      if (url.pathname.endsWith("/site_pages") && url.searchParams.get("path")) return new Promise<Response>(resolve => { finishRoute = resolve; });
      if (url.pathname.endsWith("/site_pages")) return json([servicePage]);
      if (url.pathname.endsWith("/site_settings")) return json([{ updated_at: "fixture-version" }]);
      if (url.pathname.endsWith("/services")) return json([{ id: "service", slug: "renovation", title_zh: "装修服务", title_en: "Renovation", updated_at: "2026-10-10T01:00:00Z" }]);
      return json([]);
    }));
    const pending = onRequest({ request: new Request("https://flashcast.com.my/zh/services"), env, next: vi.fn() } as never);
    await tick();
    expect(env.ASSETS.fetch).toHaveBeenCalledOnce();
    expect(requests.some(url => url.pathname.endsWith("/site_pages") && url.searchParams.get("page_key") === "eq.services")).toBe(true);
    const latest = requests.filter(url => url.pathname.endsWith("/services") && url.searchParams.get("select") === "id,updated_at");
    expect(latest).toHaveLength(1);
    expect(latest[0].searchParams.get("status")).toBe("eq.published");
    finishRoute(json([servicePage]));
    const response = await pending;
    const document = new DOMParser().parseFromString(await response.text(), "text/html");
    expect(response.status).toBe(200);
    expect(document.title).toContain("当前服务");
    const seed = JSON.parse(document.getElementById("flashcast-public-data")!.textContent!);
    expect(seed.sitePages.services.site_pages[0].title_zh).toBe("当前服务");
    expect(document.querySelector('link[rel="preload"][as="image"][media="(max-width: 767px)"]')?.getAttribute("imagesrcset")).toContain("hero-services-v5-desktop.webp");
    expect(requests.filter(url => url.pathname.endsWith("/services") && url.searchParams.get("select") === "id,updated_at")).toHaveLength(1);
  });

  it("starts compact home discovery before its core bundle arrives and retains independent failure omission", async () => {
    const env = environment();
    const requests: URL[] = [];
    let finishBundle!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input)); requests.push(url);
      if (url.pathname.endsWith("/rpc/get_public_home_bundle")) return new Promise<Response>(resolve => { finishBundle = resolve; });
      if (url.pathname.endsWith("/site_settings")) return json([{ updated_at: "fixture-version" }]);
      if (url.pathname.endsWith("/blog_posts")) return new Response("Unavailable", { status: 503 });
      return json([]);
    }));
    const pending = onRequest({ request: new Request("https://flashcast.com.my/en"), env, next: vi.fn() } as never);
    await tick();
    expect(env.ASSETS.fetch).toHaveBeenCalledOnce();
    expect(requests.some(url => url.pathname.endsWith("/materials") && url.searchParams.get("category") === "eq.furniture")).toBe(true);
    expect(requests.some(url => url.pathname.endsWith("/blog_posts") && url.searchParams.get("limit") === "3")).toBe(true);
    expect(requests.some(url => url.pathname.endsWith("/service_areas") && url.searchParams.get("limit") === "8")).toBe(true);
    finishBundle(json({ site_pages: [{ page_key: "home", path: "/", title_en: "Current homepage", title_zh: "当前首页", status: "published" }] }));
    const response = await pending;
    const document = new DOMParser().parseFromString(await response.text(), "text/html");
    const seed = JSON.parse(document.getElementById("flashcast-public-data")!.textContent!);
    expect(response.status).toBe(200);
    expect(seed.homeContentBundle.site_pages[0].title_en).toBe("Current homepage");
    expect(seed).not.toHaveProperty("homeJournalPosts");
    expect(seed.homeFurniture).toBeDefined();
    expect(seed.homeServiceAreas).toEqual([]);
  });
});
