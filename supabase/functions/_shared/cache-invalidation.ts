export const PUBLIC_HTML_CACHE_TAG = "flashcast-public-html";

export type PublicHtmlCacheInvalidationResult = {
  ok: boolean;
  attempted: boolean;
  tag: string;
  status?: number;
  error?: string;
};

type PurgePublicHtmlCacheInput = {
  apiToken?: string | null;
  zoneId?: string | null;
  fetchImpl?: typeof fetch;
};

type CloudflarePurgeResponse = {
  success?: boolean;
  errors?: Array<{ message?: string }>;
};

export const purgePublicHtmlCache = async ({
  apiToken,
  zoneId,
  fetchImpl = fetch,
}: PurgePublicHtmlCacheInput): Promise<PublicHtmlCacheInvalidationResult> => {
  const token = apiToken?.trim();
  const zone = zoneId?.trim();
  if (!token || !zone) {
    return {
      ok: false,
      attempted: false,
      tag: PUBLIC_HTML_CACHE_TAG,
      error: "Cloudflare cache purge is not configured.",
    };
  }

  try {
    const response = await fetchImpl(`https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zone)}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags: [PUBLIC_HTML_CACHE_TAG] }),
    });
    const payload = await response.json().catch(() => null) as CloudflarePurgeResponse | null;
    if (!response.ok || payload?.success !== true) {
      const apiMessage = payload?.errors?.map((error) => error.message).filter(Boolean).join("; ");
      return {
        ok: false,
        attempted: true,
        tag: PUBLIC_HTML_CACHE_TAG,
        status: response.status,
        error: apiMessage || `Cloudflare cache purge failed with HTTP ${response.status}.`,
      };
    }

    return {
      ok: true,
      attempted: true,
      tag: PUBLIC_HTML_CACHE_TAG,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      attempted: true,
      tag: PUBLIC_HTML_CACHE_TAG,
      error: error instanceof Error ? error.message : "Cloudflare cache purge request failed.",
    };
  }
};
