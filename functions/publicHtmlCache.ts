const PUBLIC_HTML_EDGE_TTL_SECONDS = 300;
const PUBLIC_HTML_FRESHNESS_TTL_SECONDS = 60;
const PUBLIC_HTML_CACHE_VERSION = "20260821-public-browser-revalidate-v5";
export const PUBLIC_HTML_CACHE_TAG = "flashcast-public-html";
const HTML_CACHE_DEBUG_HEADER = "x-flashcast-html-cache";

type HtmlCacheDebugState = "hit" | "stale" | "miss" | "bypass-admin" | "bypass-not-found";

type PublicHtmlDeploymentEnvironment = { CF_PAGES_COMMIT_SHA?: string; CF_PAGES_URL?: string };

export const applyHtmlNoStoreHeaders = (headers: Headers) => {
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("cdn-cache-control", "no-store");
  headers.set("cloudflare-cdn-cache-control", "no-store");
  headers.set("pragma", "no-cache");
  headers.set("expires", "0");
};

export const applyPublicHtmlEdgeCacheHeaders = (headers: Headers) => {
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", `public, max-age=${PUBLIC_HTML_EDGE_TTL_SECONDS}`);
  headers.set("cdn-cache-control", `public, max-age=${PUBLIC_HTML_EDGE_TTL_SECONDS}`);
  headers.set("cloudflare-cdn-cache-control", `public, max-age=${PUBLIC_HTML_EDGE_TTL_SECONDS}`);
  headers.set("cache-tag", PUBLIC_HTML_CACHE_TAG);
  headers.delete("pragma");
  headers.delete("expires");
};

const applyPublicHtmlBrowserCacheHeaders = (headers: Headers) => {
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-cache, max-age=0, must-revalidate");
  headers.set("cdn-cache-control", "no-store");
  headers.set("cloudflare-cdn-cache-control", "no-store");
  headers.set("pragma", "no-cache");
  headers.set("expires", "0");
};

export const createHtmlEtag = async (html: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(html));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `"sha256-${hash}"`;
};

const normalizeEtag = (etag: string) => etag.trim().replace(/^W\//i, "");

const requestAcceptsEtag = (request: Request, etag: string) => {
  const ifNoneMatch = request.headers.get("if-none-match");
  if (!ifNoneMatch) return false;
  const normalizedEtag = normalizeEtag(etag);
  return ifNoneMatch
    .split(",")
    .some((candidate) => candidate.trim() === "*" || normalizeEtag(candidate) === normalizedEtag);
};

const requestAcceptsLastModified = (request: Request, lastModified: string) => {
  // RFC conditional request precedence: If-None-Match wins whenever it is present.
  if (request.headers.has("if-none-match")) return false;
  const ifModifiedSince = request.headers.get("if-modified-since");
  if (!ifModifiedSince) return false;
  const lastModifiedTime = Date.parse(lastModified);
  const ifModifiedSinceTime = Date.parse(ifModifiedSince);
  return Number.isFinite(lastModifiedTime)
    && Number.isFinite(ifModifiedSinceTime)
    && lastModifiedTime <= ifModifiedSinceTime;
};

export const createPublicHtmlBrowserResponse = (
  response: Response,
  request: Request,
  state: HtmlCacheDebugState,
) => {
  const headers = new Headers(response.headers);
  applyPublicHtmlBrowserCacheHeaders(headers);
  headers.set(HTML_CACHE_DEBUG_HEADER, state);
  const etag = headers.get("etag");
  const lastModified = headers.get("last-modified");

  if (
    (etag && requestAcceptsEtag(request, etag))
    || (lastModified && requestAcceptsLastModified(request, lastModified))
  ) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const withHtmlCacheDebugHeader = (response: Response, state: HtmlCacheDebugState) => {
  const headers = new Headers(response.headers);
  headers.set(HTML_CACHE_DEBUG_HEADER, state);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const getEdgeCache = () => {
  if (typeof caches === "undefined" || !caches.default) return null;
  return caches.default;
};

export const getPublicHtmlDeploymentVersion = (env: PublicHtmlDeploymentEnvironment) => {
  const version = env.CF_PAGES_COMMIT_SHA || env.CF_PAGES_URL;
  return typeof version === "string" && version.trim() ? version.trim().slice(0, 128) : "local";
};

export const getPublicHtmlCacheRequest = (
  request: Request,
  env: PublicHtmlDeploymentEnvironment,
  contentRevision?: string | null,
) => {
  const cacheUrl = new URL(request.url);
  cacheUrl.search = "";
  cacheUrl.searchParams.set("__flashcast_html_v", PUBLIC_HTML_CACHE_VERSION);
  cacheUrl.searchParams.set("__flashcast_deploy_v", getPublicHtmlDeploymentVersion(env));
  cacheUrl.searchParams.set("__flashcast_content_v", contentRevision?.trim() || "unknown");
  cacheUrl.hash = "";
  return new Request(cacheUrl.toString(), { method: "GET" });
};

export const getPublicHtmlFreshnessRequest = (publicHtmlCacheRequest: Request) => {
  const cacheUrl = new URL(publicHtmlCacheRequest.url);
  cacheUrl.searchParams.set("__flashcast_html_fresh", "1");
  return new Request(cacheUrl.toString(), { method: "GET" });
};

export const createPublicHtmlFreshnessResponse = () => new Response(null, {
  headers: {
    "cache-control": `public, max-age=${PUBLIC_HTML_FRESHNESS_TTL_SECONDS}`,
    "cdn-cache-control": `public, max-age=${PUBLIC_HTML_FRESHNESS_TTL_SECONDS}`,
    "cloudflare-cdn-cache-control": `public, max-age=${PUBLIC_HTML_FRESHNESS_TTL_SECONDS}`,
    "cache-tag": PUBLIC_HTML_CACHE_TAG,
  },
});
