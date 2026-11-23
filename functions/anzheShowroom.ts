import { ANZHE_SHOWROOM_ORIGIN } from "../src/config/anzheShowroom";
import { isSupportedLanguage, type Language } from "../src/i18n/languageDetection";
import {
  applyPublicHtmlEdgeCacheHeaders, createContentEtag, createHtmlEtag, createPublicHtmlBrowserResponse,
  getEdgeCache, getPublicHtmlCacheRequest, requestMatchesValidators,
} from "./publicHtmlCache";

export const ANZHE_ASSET_PREFIX = "/anzhe-showroom";
type AssetBinding = { fetch: (request: Request) => Promise<Response> };

const staticFiles = /^\/(?:assets\/[a-z\d][a-z\d-]*\.(?:webp|woff2)|assets\/film-0(?:37[7-9]|38[0-4])\.mp4|showroom-(?:boot|updates|films|nav)\.js|showroom-(?:intro|fit|films|catalog|model)\.css|conversion-track\.js|catalog\.js|features\.js|strings\.js|(?:studio|directory|panels|contact|contact-float)\.(?:js|css)|robots\.txt|sitemap\.xml|llms\.txt|[a-fA-F0-9]{32}\.txt)$/;
const sharedStylesheets = new Set(["/public-section-spacing.css", "/public-contact-entry.css"]);
const LOCK_SLUGS = "v37j-p16|p59j-pro|k16j-k19|q58j-k19|k19j|q8j|r10j-22|k26j-pro|t06j|a88-face-id|gp08|f8|g53-pro|g86f-pro|g5|g13|d10b";
const TYPE_SLUGS = "entrance-door|interior-door|aluminium-door";
const FEATURE_SLUGS = "face-recognition|palm-vein|video-intercom";
const pagePath = new RegExp(
  `^/(zh|en|ms)(?:/lock/(${LOCK_SLUGS}|type/(?:${TYPE_SLUGS})|feature/(?:${FEATURE_SLUGS})))?(?:/(?:index\\.html)?)?$`,
);
const categoryLinkText = {
  zh: { label: "按门型查看品类页", all: "查看全部型号", types: ["入户门品类", "室内门品类", "窄框铝门品类"] },
  en: { label: "Browse lock categories by door type", all: "View all models", types: ["Entrance door locks", "Interior door locks", "Aluminium door locks"] },
  ms: { label: "Lihat kategori kunci mengikut jenis pintu", all: "Lihat semua model", types: ["Kunci pintu utama", "Kunci pintu dalaman", "Kunci pintu aluminium"] },
};
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

function addHomeCategoryLinks(html: string, locale: Language) {
  const copy = categoryLinkText[locale];
  const links = TYPE_SLUGS.split("|").map((slug, index) =>
    `<a class="studio-link" href="/${locale}/lock/type/${slug}/"><span>${copy.types[index]}</span></a>`);
  const navigation = `<nav class="section-actions" data-lock-category-links style="margin-top:clamp(8px,1.8vw,12px);margin-bottom:clamp(16px,3vw,20px);" aria-label="${copy.label}">`
    + `<a class="studio-link" href="#model-details"><span>${copy.all}</span></a>${links.join("")}</nav>`;
  // The interactive directory replaces its own markup when it mounts or filters.
  return html.replace('<div id="directory"', `${navigation}<div id="directory"`);
}

async function serveDocument(request: Request, binding: AssetBinding, pathname: string, locale: Language, version: string, waitUntil?: (write: Promise<unknown>) => void) {
  const cache = getEdgeCache();
  const origin = new URL(ANZHE_SHOWROOM_ORIGIN);
  origin.pathname = pathname;
  const key = getPublicHtmlCacheRequest(new Request(origin), { CF_PAGES_COMMIT_SHA: version });
  const cached = cache && await cache.match(key).catch(() => undefined);
  if (cached) return createPublicHtmlBrowserResponse(cached, request, "hit");

  origin.pathname = ANZHE_ASSET_PREFIX + origin.pathname;
  const asset = await binding.fetch(new Request(origin));
  if (!asset.ok || !asset.headers.get("content-type")?.includes("text/html")) return null;
  const boot = await inlineDocumentBoot(await asset.text(), binding);
  const html = pathname === `/${locale}/` ? addHomeCategoryLinks(boot.html, locale) : boot.html;
  const document = html.replace("<head>", `<head><meta name="flashcast-deployment-version" content="${encodeURIComponent(version)}">`);
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

// A Pages binding can return either a native range or the complete small showroom clip.
async function serveFilm(request: Request, binding: AssetBinding, target: URL) {
  const forwarded = new Headers();
  for (const name of ["range", "if-range", "if-none-match", "if-modified-since"]) {
    const value = request.headers.get(name);
    if (value && (name !== "range" || request.method === "GET")) forwarded.set(name, value);
  }
  const asset = await binding.fetch(new Request(target, { method: request.method, headers: forwarded }));
  if (asset.status !== 304 && asset.status !== 416 &&
    (!asset.ok || !asset.headers.get("content-type")?.includes("video/mp4"))) return null;
  const headers = new Headers(asset.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  headers.set("cache-control", "public, no-cache");
  headers.set("accept-ranges", "bytes");
  const range = /^bytes=(\d*)-(\d*)$/i.exec(forwarded.get("range") || "");
  const ifRange = forwarded.get("if-range");
  const matches = !ifRange || (!ifRange.startsWith("W/") &&
    (ifRange === headers.get("etag") || ifRange === headers.get("last-modified")));
  if (asset.status === 200 && request.method === "GET" && matches && range && (range[1] || range[2])) {
    const bytes = await asset.arrayBuffer();
    const size = bytes.byteLength;
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    headers.delete("content-encoding");
    if (start >= size || start > end) {
      headers.set("content-range", `bytes */${size}`);
      headers.set("content-length", "0");
      return new Response(null, { status: 416, headers });
    }
    headers.set("content-range", `bytes ${start}-${end}/${size}`);
    headers.set("content-length", String(end - start + 1));
    return new Response(new Uint8Array(bytes, start, end - start + 1), { status: 206, headers });
  }
  return new Response(request.method === "HEAD" ? null : asset.body, { status: asset.status, headers });
}

async function serveStaticFile(request: Request, binding: AssetBinding, target: URL) {
  const path = target.pathname;
  // Shared stylesheets are served from the root asset directory on both hosts.
  if (!sharedStylesheets.has(path)) target.pathname = ANZHE_ASSET_PREFIX + path;
  const requestedVersion = target.searchParams.get("v");
  target.search = "";
  if (path.endsWith(".mp4")) return serveFilm(request, binding, target);
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
  if (fingerprintMatches) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  } else {
    // Pages can raise max-age=0 to the zone's browser TTL. Require validation on unpinned URLs.
    headers.set("cache-control", "no-cache, max-age=0, must-revalidate");
    headers.set("cdn-cache-control", "no-store");
    headers.set("cloudflare-cdn-cache-control", "no-store");
  }
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
  const page = pagePath.exec(url.pathname);
  if (page) {
    const [, locale, slug] = page;
    const canonicalPath = slug ? `/${locale}/lock/${slug}/` : `/${locale}/`;
    if (url.pathname !== canonicalPath) return redirect(url, canonicalPath, 301);
    if (assetBinding) {
      const document = await serveDocument(request, assetBinding, canonicalPath, locale as Language, deploymentVersion, waitUntil);
      if (document) return document;
    }
  }
  if (assetBinding && (staticFiles.test(url.pathname) || sharedStylesheets.has(url.pathname))) {
    const file = await serveStaticFile(request, assetBinding, url);
    if (file) return file;
  }
  return new Response(head ? null : "Not found", { status: 404, headers: { ...securityHeaders, ...nonCacheableHeaders } });
}
