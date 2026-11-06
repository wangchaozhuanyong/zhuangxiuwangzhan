import { describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

describe("edge language routing", () => {
  it.each([
    ["/", "en-US", "flashcast_lang=zh", "/zh", 302],
    ["/services/", "ms-MY", "", "/ms/services", 302],
    ["/zh/services", "en-US", "flashcast_lang=en", "/zh/services", 301],
    ["/en/products", "zh-CN", "", "/en/materials", 301],
    ["/zh/landing/kitchen-cabinet", "en-US", "", "/zh/services/kitchen", 301],
    ["/images/heroes/hero.webp", "zh-CN", "", "/images/heroes/hero.webp", 301],
    ["/admin", "zh-CN", "", "/admin", 301],
  ])("combines the www canonical host and public path for %s", async (path, acceptLanguage, cookie, expectedPath, status) => {
    const suffix = "?utm_source=entry-test#consultation";
    const next = vi.fn();
    const response = await onRequest({
      request: new Request(`https://www.flashcast.com.my${path}${suffix}`, {
        headers: { "accept-language": acceptLanguage, cookie },
      }), env: {}, next,
    } as Parameters<typeof onRequest>[0]);
    expect(response.status).toBe(status);
    expect(response.headers.get("location")).toBe(`https://flashcast.com.my${expectedPath}${suffix}`);
    if (status === 302) {
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
    } else {
      expect(response.headers.has("vary")).toBe(false);
    }
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ["/", "ja-JP,zh-CN;q=0.9,en;q=0.8", "", "/en"],
    ["/services", "ms-MY,zh-CN;q=0.9", "", "/ms/services"],
    ["/", "zh-CN", "flashcast_lang=ms", "/ms"],
    ["/", "zh-CN;q=0.8,ja-JP;q=1", "", "/en"],
    ["/", "en-US;q=0.8,zh-TW;q=0.9", "", "/zh"],
    ["/", "ja-JP,zh-CN;q=0.9", "flashcast_lang=zh", "/zh"],
    ["/", "zh-CN,zh;q=0.9", "flashcast_lang=en", "/en"],
    ["/", "ja-JP,zh-CN;q=0.9", "flashcast_lang=invalid", "/en"],
  ])("redirects %s with %s and cookie %s to %s", async (path, acceptLanguage, cookie, expectedPath) => {
    const queryAndHash = "?gclid=language-test&utm_source=google#consultation";
    const request = new Request(`https://flashcast.com.my${path}${queryAndHash}`, {
      headers: { "accept-language": acceptLanguage, cookie },
    });
    const next = vi.fn();

    const response = await onRequest({ request, env: {}, next } as Parameters<typeof onRequest>[0]);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(`https://flashcast.com.my${expectedPath}${queryAndHash}`);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("vary")).toBe("Accept-Language, Cookie");
    expect(next).not.toHaveBeenCalled();
  });
});
