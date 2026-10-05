import { describe, expect, it } from "vitest";
import {
  applyHtmlNoStoreHeaders,
  applyPublicHtmlEdgeCacheHeaders,
  createPublicHtmlBrowserResponse,
  createPublicHtmlFreshnessResponse,
  getPublicHtmlCacheRequest,
  getPublicHtmlFreshnessRequest,
  PUBLIC_HTML_CACHE_TAG,
} from "../../functions/publicHtmlCache";
import { PUBLIC_HTML_CACHE_TAG as publishCacheTag } from "../../supabase/functions/content-publish/cache-invalidation";

const htmlResponse = () => new Response("<html>confirmed body</html>", {
  headers: { etag: '"known-version"', "last-modified": "Mon, 05 Oct 2026 01:00:00 GMT", "cache-control": "public, max-age=300" },
});

describe("isolated public HTML cache policy", () => {
  it("keys Edge cache by deployment and content revision while removing request search/hash", () => {
    const request = new Request("https://fixture.example/zh/projects?utm_source=test#old");
    const first = getPublicHtmlCacheRequest(request, { CF_PAGES_COMMIT_SHA: "  fixture-a  " }, " revision-a ");
    const second = getPublicHtmlCacheRequest(request, { CF_PAGES_COMMIT_SHA: "fixture-b" }, "revision-a");
    const third = getPublicHtmlCacheRequest(request, { CF_PAGES_COMMIT_SHA: "fixture-a" }, "revision-b");
    const url = new URL(first.url);
    expect(url.pathname).toBe("/zh/projects");
    expect(url.hash).toBe("");
    expect(url.searchParams.has("utm_source")).toBe(false);
    expect(url.searchParams.get("__flashcast_deploy_v")).toBe("fixture-a");
    expect(url.searchParams.get("__flashcast_content_v")).toBe("revision-a");
    expect(first.url).not.toBe(second.url);
    expect(first.url).not.toBe(third.url);
    expect(first.method).toBe("GET");
    expect(new URL(getPublicHtmlFreshnessRequest(first).url).searchParams.get("__flashcast_html_fresh")).toBe("1");
  });

  it("honors weak/list ETags before Last-Modified and keeps browser HTML revalidation", async () => {
    const matched = createPublicHtmlBrowserResponse(htmlResponse(), new Request("https://fixture.example/zh", {
      headers: { "if-none-match": '"other", W/"known-version"' },
    }), "hit");
    expect(matched.status).toBe(304);
    expect(await matched.text()).toBe("");
    expect(matched.headers.get("cache-control")).toBe("no-cache, max-age=0, must-revalidate");
    expect(matched.headers.get("cloudflare-cdn-cache-control")).toBe("no-store");

    const etagWins = createPublicHtmlBrowserResponse(htmlResponse(), new Request("https://fixture.example/zh", {
      headers: { "if-none-match": '"other"', "if-modified-since": "Mon, 05 Oct 2026 02:00:00 GMT" },
    }), "stale");
    expect(etagWins.status).toBe(200);
    expect(await etagWins.text()).toContain("confirmed body");
  });

  it("retains Last-Modified fallback and a body-free HEAD response", async () => {
    const response = createPublicHtmlBrowserResponse(htmlResponse(), new Request("https://fixture.example/en", {
      headers: { "if-modified-since": "Mon, 05 Oct 2026 02:00:00 GMT" },
    }), "hit");
    expect(response.status).toBe(304);
    const head = createPublicHtmlBrowserResponse(htmlResponse(), new Request("https://fixture.example/en", { method: "HEAD" }), "miss");
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
    expect(head.headers.get("etag")).toBe('"known-version"');
  });

  it("retains separate no-store, Edge TTL and freshness TTL with the publishing purge tag", () => {
    const noStore = new Headers();
    applyHtmlNoStoreHeaders(noStore);
    expect(noStore.get("cache-control")).toContain("no-store");
    const edge = new Headers({ pragma: "no-cache", expires: "0" });
    applyPublicHtmlEdgeCacheHeaders(edge);
    expect(edge.get("cache-control")).toBe("public, max-age=300");
    expect(edge.has("pragma")).toBe(false);
    expect(edge.has("expires")).toBe(false);
    expect(createPublicHtmlFreshnessResponse().headers.get("cache-control")).toBe("public, max-age=60");
    expect(edge.get("cache-tag")).toBe(PUBLIC_HTML_CACHE_TAG);
    expect(PUBLIC_HTML_CACHE_TAG).toBe(publishCacheTag);
  });
});
