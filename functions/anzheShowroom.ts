import { ANZHE_SHOWROOM_ORIGIN } from "../src/config/anzheShowroom";
import { isSupportedLanguage, type Language } from "../src/i18n/languageDetection";
import {
  applyPublicHtmlEdgeCacheHeaders, createContentEtag, createHtmlEtag, createPublicHtmlBrowserResponse,
  getEdgeCache, getPublicHtmlCacheRequest, requestMatchesValidators,
} from "./publicHtmlCache";

export const ANZHE_ASSET_PREFIX = "/anzhe-showroom";
type AssetBinding = { fetch: (request: Request) => Promise<Response> };

const staticFiles = /^\/(?:assets\/[a-z\d][a-z\d-]*\.(?:webp|woff2)|showroom-boot\.js|catalog\.js|features\.js|strings\.js|(?:studio|directory|panels|contact|contact-float)\.(?:js|css)|robots\.txt|sitemap\.xml)$/;
const pagePath = /^\/(zh|en|ms)(?:\/(index\.html)?)?$/;
const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    // Cloudflare injects either the plain beacon URL or a version below beacon.min.js/.
    "script-src 'self' https://static.cloudflareinsights.com/beacon.min.js https://static.cloudflareinsights.com/beacon.min.js/",
    "connect-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "form-action 'none'",
  ].join("; "),
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function redirect(url: URL, path: string, status: 301 | 302) {
  url.pathname = path;
  return new Response(null, {
    status,
    headers: { Location: url.href, "Cache-Control": "private, no-store", Vary: "Cookie, Accept-Language" },
  });
}

function expectedContentType(path: string) {
  if (path.endsWith("/")) return "text/html";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".xml")) return "xml";
  if (path.endsWith(".txt")) return "text/plain";
  if (path.endsWith(".woff2")) return "font/woff2";
  return "image/webp";
}

const nonCacheableHeaders = {
  "Cache-Control": "no-store",
  "CDN-Cache-Control": "no-store",
  "Cloudflare-CDN-Cache-Control": "no-store",
};

// Serve the critical boot with the first HTML bytes, as the main site does. The static
// source keeps its external entry for file previews. Only the pinned, site-owned
// asset may be inlined and authorised by this document's script policy.
async function inlineDocumentBoot(html: string, binding: AssetBinding) {
  const tag = /<script fetchpriority="high" src="\.\.\/showroom-boot\.js\?v=([a-f0-9]{12})"><\/script>/.exec(html);
  const fallback = { html, hash: "" };
  if (!tag) return fallback;
  const file = new URL(ANZHE_ASSET_PREFIX + "/showroom-boot.js", ANZHE_SHOWROOM_ORIGIN);
  const asset = await binding.fetch(new Request(file)).catch(() => null);
  if (!asset?.ok || !asset.headers.get("content-type")?.includes("javascript")) return fallback;
  const source = await asset.text();
  if (/<\/script/i.test(source)) return fallback;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source)));
  const version = Array.from(digest.subarray(0, 6), byte => byte.toString(16).padStart(2, "0")).join("");
  if (version !== tag[1]) return fallback;
  const hash = "'sha256-" + btoa(String.fromCharCode(...digest)) + "'";
  return { html: html.replace(tag[0], () => `<script data-showroom-boot>${source}</script>`), hash };
}

async function serveDocument(request: Request, binding: AssetBinding, locale: Language, version: string, waitUntil?: (write: Promise<unknown>) => void) {
  const cache = getEdgeCache();
  const origin = new URL(ANZHE_SHOWROOM_ORIGIN);
  origin.pathname = `/${locale}/`;
  const key = getPublicHtmlCacheRequest(new Request(origin), { CF_PAGES_COMMIT_SHA: version });
  const cached = cache && await cache.match(key).catch(() => undefined);
  if (cached) return createPublicHtmlBrowserResponse(cached, request, "hit");

  origin.pathname = ANZHE_ASSET_PREFIX + origin.pathname;
  const asset = await binding.fetch(new Request(origin));
  if (!asset.ok || !asset.headers.get("content-type")?.includes("text/html")) return null;
  const boot = await inlineDocumentBoot(await asset.text(), binding);
  const document = boot.html.replace("<head>", `<head><meta name="flashcast-deployment-version" content="${encodeURIComponent(version)}">`);
  const headers = new Headers(asset.headers);
  // The deployment marker changes the representation. Retain upstream security headers only with valid body metadata.
  for (const name of ["content-length", "content-encoding", "accept-ranges", "set-cookie"]) headers.delete(name);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  if (boot.hash) headers.set("Content-Security-Policy", securityHeaders["Content-Security-Policy"].replace("script-src 'self'", "script-src 'self' " + boot.hash));
  applyPublicHtmlEdgeCacheHeaders(headers);
  headers.set("etag", await createHtmlEtag(document));
  headers.set("last-modified", new Date().toUTCString());
  const response = new Response(document, { headers });
  if (cache) {
    const write = cache.put(key, response.clone()).catch(() => undefined);
    if (waitUntil) waitUntil(write);
    else await write;
  }
  return createPublicHtmlBrowserResponse(response, request, "miss");
}

async function serveStaticFile(request: Request, binding: AssetBinding, target: URL) {
  const path = target.pathname;
  // The shared spacing stylesheet belongs to both hosts. Showroom files live in their private asset directory.
  if (path !== "/public-section-spacing.css") target.pathname = ANZHE_ASSET_PREFIX + path;
  const requestedVersion = target.searchParams.get("v");
  target.search = "";
  const asset = await binding.fetch(new Request(target));
  if (!asset.ok || !asset.headers.get("content-type")?.includes(expectedContentType(path))) return null;
  const headers = new Headers(asset.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  let body: BodyInit | null = asset.body;
  let fingerprintMatches = false;
  const checkFingerprint = Boolean(requestedVersion && /^[a-f0-9]{12}$/.test(requestedVersion));
  if (checkFingerprint || !headers.has("etag")) {
    const bytes = await asset.arrayBuffer();
    const etag = await createContentEtag(bytes);
    headers.set("etag", etag);
    fingerprintMatches = checkFingerprint && etag.startsWith(`"sha256-${requestedVersion}`);
    headers.delete("content-encoding");
    headers.delete("content-length");
    body = bytes;
  }
  headers.set("cache-control", fingerprintMatches ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate");
  if (requestMatchesValidators(request, headers)) return new Response(null, { status: 304, headers });
  return new Response(request.method === "HEAD" ? null : body, { headers });
}

export async function serveAnzheShowroom(
  request: Request,
  assetBinding: AssetBinding | undefined,
  preferredLanguage: Language,
  deploymentVersion: string,
  waitUntil?: (write: Promise<unknown>) => void,
): Promise<Response> {
  const incoming = new URL(request.url);
  const url = new URL(ANZHE_SHOWROOM_ORIGIN);
  url.pathname = incoming.pathname;
  url.search = incoming.search;
  const head = request.method === "HEAD";
  if (request.method !== "GET" && !head) {
    return new Response(null, { status: 405, headers: { ...securityHeaders, ...nonCacheableHeaders, Allow: "GET, HEAD" } });
  }
  if (url.pathname === "/__flashcast/version") {
    return new Response(head ? null : JSON.stringify({ deploymentVersion }), {
      headers: { ...securityHeaders, ...nonCacheableHeaders, "Content-Type": "application/json" },
    });
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const language = url.searchParams.get("lang");
    return redirect(url, `/${isSupportedLanguage(language) ? language : preferredLanguage}/`, 302);
  }
  const locale = pagePath.exec(url.pathname)?.[1];
  if (locale && url.pathname !== `/${locale}/`) return redirect(url, `/${locale}/`, 301);
  if (assetBinding && isSupportedLanguage(locale)) {
    const document = await serveDocument(request, assetBinding, locale, deploymentVersion, waitUntil);
    if (document) return document;
  }
  if (assetBinding && (staticFiles.test(url.pathname) || url.pathname === "/public-section-spacing.css")) {
    const file = await serveStaticFile(request, assetBinding, url);
    if (file) return file;
  }
  return new Response(head ? null : "Not found", { status: 404, headers: { ...securityHeaders, ...nonCacheableHeaders } });
}
