import { describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

describe("edge language routing", () => {
  it.each([
    ["/", "ja-JP,zh-CN;q=0.9,en;q=0.8", "", "/en"],
    ["/services", "ms-MY,zh-CN;q=0.9", "", "/en/services"],
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
