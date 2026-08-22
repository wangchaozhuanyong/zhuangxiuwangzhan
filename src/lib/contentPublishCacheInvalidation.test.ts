import { describe, expect, it, vi } from "vitest";
import {
  PUBLIC_HTML_CACHE_TAG,
  purgePublicHtmlCache,
} from "../../supabase/functions/content-publish/cache-invalidation";

describe("content publish cache invalidation", () => {
  it("purges every tagged public HTML entry after publish", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ success: true }));

    const result = await purgePublicHtmlCache({
      apiToken: "test-token",
      zoneId: "test-zone",
      fetchImpl,
    });

    expect(result).toMatchObject({ ok: true, attempted: true, tag: PUBLIC_HTML_CACHE_TAG, status: 200 });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/zones/test-zone/purge_cache",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tags: [PUBLIC_HTML_CACHE_TAG] }),
      }),
    );
  });

  it("reports missing purge configuration without making a request", async () => {
    const fetchImpl = vi.fn();

    const result = await purgePublicHtmlCache({ fetchImpl });

    expect(result).toMatchObject({ ok: false, attempted: false, tag: PUBLIC_HTML_CACHE_TAG });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("surfaces Cloudflare API failures without exposing credentials", async () => {
    const fetchImpl = vi.fn(async () => Response.json(
      { success: false, errors: [{ message: "Cache Purge permission denied" }] },
      { status: 403 },
    ));

    const result = await purgePublicHtmlCache({
      apiToken: "secret-token",
      zoneId: "test-zone",
      fetchImpl,
    });

    expect(result).toMatchObject({ ok: false, attempted: true, status: 403 });
    expect(result.error).toBe("Cache Purge permission denied");
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });
});
