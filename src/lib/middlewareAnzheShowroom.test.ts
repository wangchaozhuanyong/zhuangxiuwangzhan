import { describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { ANZHE_SHOWROOM_ORIGIN } from "../config/anzheShowroom";

const requestPage = (request: Request, fetch = vi.fn()) => onRequest({
  request,
  env: { ASSETS: { fetch }, CF_PAGES_COMMIT_SHA: "anzhe-verified-source" },
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

  it("publishes the exact Pages revision on the showroom hostname", async () => {
    const response = await requestPage(new Request(ANZHE_SHOWROOM_ORIGIN + "/__flashcast/version"));
    expect(await response.json()).toEqual({ deploymentVersion: "anzhe-verified-source" });
  });
});
