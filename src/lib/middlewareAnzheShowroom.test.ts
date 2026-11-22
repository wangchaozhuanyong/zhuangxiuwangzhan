import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { ANZHE_SHOWROOM_ORIGIN } from "../config/anzheShowroom";

const requestPage = (request: Request, fetch = vi.fn(), version = "anzhe-verified-source") => onRequest({
  request,
  env: { ASSETS: { fetch }, CF_PAGES_COMMIT_SHA: version },
  next: vi.fn(),
} as Parameters<typeof onRequest>[0]);

describe("ANZHE showroom on the independent hostname", () => {
  it("uses the preferred language and preserves the campaign query", async () => {
    const response = await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/?utm_source=launch", {
      headers: { "accept-language": "en-US", cookie: "flashcast_lang=ms" },
    }));
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(ANZHE_SHOWROOM_ORIGIN + "/ms/?utm_source=launch");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("vary")).toContain("Accept-Language");
  });

  it.each(["zh", "en", "ms"])("serves the %s page with an asset binding without a main-site fallback", async (lang) => {
    const fetch = vi.fn(async () => new Response("<h1>ANZHE</h1>", { headers: { "content-type": "text/html; charset=utf-8" } }));
    const response = await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/" + lang + "/"), fetch);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("ANZHE");
    expect(fetch).toHaveBeenCalledWith(expect.objectContaining({ url: ANZHE_SHOWROOM_ORIGIN + "/anzhe-showroom/" + lang + "/" }));
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    const policy = response.headers.get("content-security-policy")?.split("; ");
    expect(policy).toEqual(expect.arrayContaining([
      "default-src 'self'",
      "script-src 'self' https://static.cloudflareinsights.com/beacon.min.js https://static.cloudflareinsights.com/beacon.min.js/",
      "connect-src 'self'",
    ]));
  });

  it.each([
    ["zh-Hant-HK,en;q=0.9", "zh"], ["en-GB,zh;q=0.7", "en"],
    ["fr-FR,zh;q=0.9", "en"], ["en;q=0.6,ms-MY;q=1", "ms"],
  ])("chooses the same first preferred language as the main site (%s)", async (header, language) => {
    const response = await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN, { headers: { "accept-language": header } }));
    expect(response.headers.get("location")).toBe(ANZHE_SHOWROOM_ORIGIN + "/" + language + "/");
  });

  it("delivers the approved early boot with the HTML and reuses its exact CSP hash", async () => {
    const source = "window.booted=true;";
    const bytes = createHash("sha256").update(source).digest();
    const tag = `<script fetchpriority="high" src="../showroom-boot.js?v=${bytes.toString("hex").slice(0,12)}"></script>`;
    const fetchPage = (asset: string) => requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/zh/"), vi.fn(async (request: Request) =>
      request.url.endsWith(".js") ? new Response(asset, { headers: { "content-type": "text/javascript" } })
        : new Response("<html><head>" + tag + "</head></html>", { headers: { "content-type": "text/html" } })));
    const response = await fetchPage(source);
    expect(await response.text()).toContain(`<script data-showroom-boot>${source}</script>`);
    expect(response.headers.get("content-security-policy")).toContain(`'sha256-${bytes.toString("base64")}'`);
    const different = await fetchPage("window.different=true;");
    expect(await different.text()).toContain(tag);
    expect(different.headers.get("content-security-policy")).not.toContain("'sha256-");
  });

  it("revalidates the final document with a release-specific ETag and retains a Last-Modified fallback", async () => {
    const url = ANZHE_SHOWROOM_ORIGIN + "/en/";
    const fetch = vi.fn(async () => new Response("<html><head></head><body>ANZHE</body></html>", { headers: { "content-type": "text/html" } }));
    const first = await requestPage(new Request(url), fetch);
    expect(await first.text()).toContain('name="flashcast-deployment-version" content="anzhe-verified-source"');
    expect(first.headers.get("cache-control")).toBe("no-cache, max-age=0, must-revalidate");
    const etag = first.headers.get("etag")!;
    expect(etag).toMatch(/^"sha256-/);
    expect(first.headers.get("last-modified")).toBeTruthy();
    const headers = { "if-none-match": etag };
    const unchanged = await requestPage(new Request(url, { headers }), fetch);
    expect(unchanged.status).toBe(304);
    expect(await unchanged.text()).toBe("");
    const next = await requestPage(new Request(url, { method: "HEAD", headers }), fetch, "later-release");
    expect(next.status).toBe(200);
    expect(await next.text()).toBe("");
    expect(next.headers.get("etag")).not.toBe(etag);
  });

  it("caches the dated representation for the same locale and release across entry contexts", async () => {
    const entries = new Map<string, Response>();
    const cache = {
      match: vi.fn(async (key: Request) => entries.get(key.url)?.clone()),
      put: vi.fn(async (key: Request, response: Response) => entries.set(key.url, response)),
    };
    vi.stubGlobal("caches", { default: cache });
    try {
      const url = ANZHE_SHOWROOM_ORIGIN + "/zh/";
      const asset = vi.fn(async () => new Response("<html><head></head></html>", { headers: { "content-type": "text/html" } }));
      const first = await requestPage(new Request(url + "?utm_source=first"), asset);
      const cached = await requestPage(new Request(url, { headers: { "if-modified-since": first.headers.get("last-modified")! } }), asset);
      expect(cached.status).toBe(304);
      expect(cached.headers.get("x-flashcast-html-cache")).toBe("hit");
      expect(asset).toHaveBeenCalledTimes(1);
      await requestPage(new Request(url), asset, "different-release");
      await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/ms/"), asset);
      expect(asset).toHaveBeenCalledTimes(3);
    } finally { vi.unstubAllGlobals(); }
  });

  it.each([
    ["/public-section-spacing.css", "/public-section-spacing.css"],
    ["/public-contact-entry.css", "/public-contact-entry.css"],
    ["/showroom-intro.css", "/anzhe-showroom/showroom-intro.css"],
    ["/showroom-films.css", "/anzhe-showroom/showroom-films.css"],
    ["/showroom-catalog.css", "/anzhe-showroom/showroom-catalog.css"],
    ["/showroom-fit.css", "/anzhe-showroom/showroom-fit.css"],
  ])("only caches %s as immutable when its content matches its fingerprint", async (path, assetPath) => {
    const body = "body{}";
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 12);
    const asset = vi.fn(async () => new Response(body, { headers: { "content-type": "text/css", "cache-control": "immutable" } }));
    const url = ANZHE_SHOWROOM_ORIGIN + path;
    for (const suffix of ["", "?v=000000000000", "?v=bad"]) {
      const response = await requestPage(new Request(url + suffix), asset);
      expect(response.headers.get("cache-control")).toBe("no-cache, max-age=0, must-revalidate");
      expect(response.headers.get("cdn-cache-control")).toBe("no-store");
      expect(response.headers.get("cloudflare-cdn-cache-control")).toBe("no-store");
      const conditional = await requestPage(new Request(url + suffix, {
        headers: { "if-none-match": response.headers.get("etag")! },
      }), asset);
      expect(conditional.status).toBe(304);
      expect(conditional.headers.get("cache-control")).toBe(response.headers.get("cache-control"));
    }
    const fresh = await requestPage(new Request(url + "?v=" + hash), asset);
    expect(fresh.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(asset).toHaveBeenLastCalledWith(expect.objectContaining({ url: ANZHE_SHOWROOM_ORIGIN + assetPath }));
    expect(await fresh.text()).toBe(body);
    const revalidated = await requestPage(new Request(url + "?v=" + hash, { headers: { "if-none-match": fresh.headers.get("etag")! } }), asset);
    expect(revalidated.status).toBe(304);
  });

  it.each([
    ["bytes=1-2", 206, "bytes 1-2/4", "bc"],
    ["bytes=2-", 206, "bytes 2-3/4", "cd"],
    ["bytes=-1", 206, "bytes 3-3/4", "d"],
    ["bytes=8-", 416, "bytes */4", ""],
  ] as const)("supports film seeking when the binding returns the whole asset for %s", async (range, status, contentRange, body) => {
    const asset = vi.fn(async () => new Response("abcd", { headers: { "content-type": "video/mp4" } }));
    const response = await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/assets/film-0377.mp4", { headers: { range } }), asset);
    expect(response.status).toBe(status);
    expect(response.headers.get("content-range")).toBe(contentRange);
    expect(await response.text()).toBe(body);
  });

  it("preserves native partial film responses and forwards only media request headers", async () => {
    const asset = vi.fn(async (request: Request) => {
      expect(request.headers.get("range")).toBe("bytes=1-2");
      expect(request.headers.has("cookie")).toBe(false);
      return new Response("bc", { status: 206, headers: { "content-type": "video/mp4", "content-range": "bytes 1-2/4" } });
    });
    const response = await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/assets/film-0384.mp4", {
      headers: { range: "bytes=1-2", cookie: "language=zh" },
    }), asset);
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 1-2/4");
    expect(await response.text()).toBe("bc");
  });

  it("only serves showroom routes, and rejects a fallback shell for missing assets", async () => {
    const fetch = vi.fn(async () => new Response("<h1>Parent site</h1>", { headers: { "content-type": "text/html" } }));
    for (const url of [ANZHE_SHOWROOM_ORIGIN + "/zh/services", ANZHE_SHOWROOM_ORIGIN + "/admin", "https://flashcast.com.my/anzhe-showroom/zh/"]) {
      expect((await requestPage(new Request(url), fetch)).status).toBe(404);
    }
    expect(fetch).not.toHaveBeenCalled();
    expect((await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/assets/missing.webp"), fetch)).status).toBe(404);
    expect((await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/zh/", { method: "POST" }), fetch)).status).toBe(405);
  });

  it("serves the standalone update script as same-origin fingerprinted JavaScript", async () => {
    const body = "window.updateNoticeLoaded = true;";
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 12);
    const fetch = vi.fn(async () => new Response(body, { headers: { "content-type": "text/javascript" } }));
    const response = await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/showroom-updates.js?v=" + hash), fetch);
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(expect.objectContaining({ url: ANZHE_SHOWROOM_ORIGIN + "/anzhe-showroom/showroom-updates.js" }));
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(await response.text()).toBe(body);
  });

  it("publishes the exact Pages revision on the showroom hostname", async () => {
    const response = await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/__flashcast/version"));
    expect(await response.json()).toEqual({ deploymentVersion: "anzhe-verified-source" });
  });
});
