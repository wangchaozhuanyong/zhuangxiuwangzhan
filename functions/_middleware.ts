import manifest from "./seo-manifest.json";

type SeoEntry = {
  lang: string;
  title: string;
  description: string;
  canonical: string;
  hreflang: { en: string; zh: string; xDefault: string };
  ogImage: string;
};

type SiteSettingsHead = {
  company_name?: string | null;
  brand_name?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  og_image_url?: string | null;
  updated_at?: string | null;
};

const DEFAULT_OG_IMAGE = (manifest as Record<string, SeoEntry>)["/en"]?.ogImage ?? "";
const DEFAULT_FAVICON = "/favicon.ico";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const addCacheBuster = (url: string, version?: string | null) => {
  if (!url || !version) return url;

  try {
    const parsed = new URL(url, "https://example.com");
    parsed.searchParams.set("v", version);
    return url.startsWith("/") ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString();
  } catch {
    return url;
  }
};

const replaceOrInsertTag = (html: string, pattern: RegExp, replacement: string) => {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace("</head>", `    ${replacement}\n  </head>`);
};

const fetchSiteSettings = async (env: Record<string, string | undefined>) => {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?select=company_name,brand_name,logo_url,favicon_url,og_image_url,updated_at&id=eq.default&limit=1`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      },
    );

    if (!response.ok) return null;

    const rows = (await response.json()) as SiteSettingsHead[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
};

const normalizePath = (pathname: string) => {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  if (cleaned === "/") return "/en";
  return cleaned;
};

const injectSeo = (html: string, meta: SeoEntry, siteSettings?: SiteSettingsHead | null) => {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = escapeHtml(meta.canonical);
  const siteName = escapeHtml(siteSettings?.company_name || siteSettings?.brand_name || "FLASH CAST SDN. BHD.");
  const version = siteSettings?.updated_at || undefined;
  const favicon = escapeHtml(addCacheBuster(siteSettings?.favicon_url || siteSettings?.logo_url || DEFAULT_FAVICON, version));
  const ogImage =
    meta.ogImage === DEFAULT_OG_IMAGE
      ? escapeHtml(addCacheBuster(siteSettings?.og_image_url || siteSettings?.logo_url || meta.ogImage, version))
      : escapeHtml(meta.ogImage);
  const lang = meta.lang === "zh" ? "zh-CN" : "en";

  let out = html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${lang}"`);
  out = out.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`,
  );

  out = replaceOrInsertTag(out, /<link\b[^>]*rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*hreflang="zh-CN"[^>]*>/i, `<link rel="alternate" hreflang="zh-CN" href="${escapeHtml(meta.hreflang.zh)}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*hreflang="en"[^>]*>/i, `<link rel="alternate" hreflang="en" href="${escapeHtml(meta.hreflang.en)}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*hreflang="x-default"[^>]*>/i, `<link rel="alternate" hreflang="x-default" href="${escapeHtml(meta.hreflang.xDefault)}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:site_name"[^>]*>/i, `<meta property="og:site_name" content="${siteName}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:image"[^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*rel="icon"[^>]*>/i, `<link rel="icon" href="${favicon}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*rel="apple-touch-icon"[^>]*>/i, `<link rel="apple-touch-icon" href="${favicon}" />`);

  return out;
};

const injectBrandAssets = (html: string, siteSettings?: SiteSettingsHead | null) => {
  if (!siteSettings) return html;

  const version = siteSettings.updated_at || undefined;
  const favicon = escapeHtml(addCacheBuster(siteSettings.favicon_url || siteSettings.logo_url || DEFAULT_FAVICON, version));
  const ogImage = escapeHtml(addCacheBuster(siteSettings.og_image_url || siteSettings.logo_url || DEFAULT_OG_IMAGE, version));
  const siteName = escapeHtml(siteSettings.company_name || siteSettings.brand_name || "FLASH CAST SDN. BHD.");

  let out = html;
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:site_name"[^>]*>/i, `<meta property="og:site_name" content="${siteName}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:image"[^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*rel="icon"[^>]*>/i, `<link rel="icon" href="${favicon}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*rel="apple-touch-icon"[^>]*>/i, `<link rel="apple-touch-icon" href="${favicon}" />`);
  return out;
};

const isAssetPath = (pathname: string) => /\.[a-z0-9]+$/i.test(pathname) && !pathname.endsWith(".html");

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const env = (context as unknown as { env?: Record<string, string | undefined> }).env ?? {};

  if (request.method !== "GET" && request.method !== "HEAD") {
    return next();
  }

  if (isAssetPath(url.pathname)) {
    return next();
  }

  const response = await next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    const html = await response.text();
    const robotsTag = '<meta name="robots" content="noindex, nofollow" />';
    const transformed = html.includes("noindex")
      ? html
      : html.replace("</head>", `    ${robotsTag}\n  </head>`);
    const headers = new Headers(response.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    return new Response(transformed, { status: response.status, headers });
  }

  const key = normalizePath(url.pathname);
  const meta = (manifest as Record<string, SeoEntry>)[key];
  const siteSettings = await fetchSiteSettings(env);

  const html = await response.text();
  const transformed = meta ? injectSeo(html, meta, siteSettings) : injectBrandAssets(html, siteSettings);
  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(transformed, { status: response.status, headers });
};
