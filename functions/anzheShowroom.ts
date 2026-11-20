import { ANZHE_SHOWROOM_ORIGIN } from "../src/config/anzheShowroom";
import { isSupportedLanguage, type Language } from "../src/i18n/languageDetection";

export const ANZHE_ASSET_PREFIX = "/anzhe-showroom";
type AssetBinding = { fetch: (request: Request) => Promise<Response> };

const staticFiles = /^\/(?:assets\/[a-z\d][a-z\d-]*\.(?:webp|woff2)|catalog\.js|features\.js|strings\.js|(?:studio|directory|panels|contact|contact-float)\.(?:js|css)|robots\.txt|sitemap\.xml)$/;
const pagePath = /^\/(zh|en|ms)(?:\/(index\.html)?)?$/;
const securityHeaders = {
  "Cache-Control": "no-cache",
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; form-action 'none'",
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

export async function serveAnzheShowroom(
  request: Request,
  assetBinding: AssetBinding | undefined,
  preferredLanguage: Language,
  deploymentVersion: string,
): Promise<Response> {
  const incoming = new URL(request.url);
  const url = new URL(ANZHE_SHOWROOM_ORIGIN);
  url.pathname = incoming.pathname;
  url.search = incoming.search;
  const head = request.method === "HEAD";
  if (request.method !== "GET" && !head) {
    return new Response(null, { status: 405, headers: { ...securityHeaders, Allow: "GET, HEAD" } });
  }
  if (url.pathname === "/__flashcast/version") {
    return new Response(head ? null : JSON.stringify({ deploymentVersion }), {
      headers: { ...securityHeaders, "Cache-Control": "no-store", "Content-Type": "application/json" },
    });
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const language = url.searchParams.get("lang");
    return redirect(url, `/${isSupportedLanguage(language) ? language : preferredLanguage}/`, 302);
  }
  const locale = pagePath.exec(url.pathname)?.[1];
  if (locale && url.pathname !== `/${locale}/`) return redirect(url, `/${locale}/`, 301);
  if (assetBinding && (locale || staticFiles.test(url.pathname))) {
    url.pathname = ANZHE_ASSET_PREFIX + url.pathname;
    const asset = await assetBinding.fetch(new Request(url, { method: request.method }));
    // Pages can serve the parent site's shell when a static file is missing.
    if (asset.ok && asset.headers.get("Content-Type")?.includes(expectedContentType(url.pathname))) {
      const headers = new Headers(asset.headers);
      for (const [key, value] of Object.entries(securityHeaders)) headers.set(key, value);
      return new Response(head ? null : asset.body, { headers });
    }
  }
  return new Response(head ? null : "Not found", { status: 404, headers: securityHeaders });
}
