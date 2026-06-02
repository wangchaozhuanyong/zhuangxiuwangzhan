import manifest from "./seo-manifest.json";

type SeoEntry = {
  lang: string;
  path?: string;
  title: string;
  description: string;
  keywords?: string;
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
  phone_e164?: string | null;
  email?: string | null;
  address_en?: string | null;
  address_zh?: string | null;
  map_latitude?: string | null;
  map_longitude?: string | null;
  updated_at?: string | null;
};

type PagesEnv = {
  [key: string]: unknown;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  ASSETS?: {
    fetch: (input: Request | string | URL, init?: RequestInit) => Promise<Response>;
  };
};

const DEFAULT_OG_IMAGE = (manifest as Record<string, SeoEntry>)["/en"]?.ogImage ?? "";
const DEFAULT_FAVICON = "/favicon.ico";
const DEFAULT_ADDRESS = "94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia";
const DEFAULT_PHONE = "+601128853888";
const DEFAULT_EMAIL = "info@flashcast.com.my";
const DEFAULT_MAP_LATITUDE = "3.0830403";
const DEFAULT_MAP_LONGITUDE = "101.6708234";

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

const escapeJsonForHtml = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const formatBreadcrumbName = (segment: string, lang: string) => {
  const mapped: Record<string, { en: string; zh: string }> = {
    about: { en: "About", zh: "关于我们" },
    services: { en: "Services", zh: "服务项目" },
    materials: { en: "Materials", zh: "材料库" },
    projects: { en: "Projects", zh: "装修案例" },
    process: { en: "Process", zh: "施工流程" },
    faq: { en: "FAQ", zh: "常见问题" },
    contact: { en: "Contact", zh: "联系我们" },
    quote: { en: "Quote", zh: "免费报价" },
    blog: { en: "Blog", zh: "装修博客" },
    locations: { en: "Locations", zh: "服务地区" },
    landing: { en: "Landing Page", zh: "落地页" },
    privacy: { en: "Privacy Policy", zh: "隐私政策" },
    terms: { en: "Terms", zh: "服务条款" },
    category: { en: "Category", zh: "分类" },
  };
  if (mapped[segment]) return mapped[segment][lang === "zh" ? "zh" : "en"];

  const decoded = decodeURIComponent(segment).replace(/-/g, " ");
  return decoded.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const buildBreadcrumb = (meta: SeoEntry, origin: string) => {
  const canonical = new URL(meta.canonical);
  const segments = canonical.pathname.split("/").filter(Boolean);
  const lang = segments[0] === "zh" ? "zh" : "en";
  const pathSegments = segments.slice(1);
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: lang === "zh" ? "首页" : "Home",
      item: `${origin}/${lang}`,
    },
  ];

  let currentPath = `/${lang}`;
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    items.push({
      "@type": "ListItem",
      position: index + 2,
      name: index === pathSegments.length - 1 ? meta.title.replace(/\s*\|\s*FLASH CAST.*$/i, "") : formatBreadcrumbName(segment, lang),
      item: `${origin}${currentPath}`,
    });
  });

  return {
    "@type": "BreadcrumbList",
    "@id": `${meta.canonical}#breadcrumb`,
    itemListElement: items,
  };
};

const buildEdgeStructuredData = (meta: SeoEntry, siteSettings?: SiteSettingsHead | null) => {
  const canonical = new URL(meta.canonical);
  const origin = canonical.origin;
  const siteName = siteSettings?.company_name || siteSettings?.brand_name || "FLASH CAST SDN. BHD.";
  const logo = siteSettings?.logo_url || `${origin}/logo-flashcast.png`;
  const image = siteSettings?.og_image_url || meta.ogImage || DEFAULT_OG_IMAGE;
  const lang = meta.lang === "zh" ? "zh-CN" : "en";
  const businessId = `${origin}/#localbusiness`;
  const websiteId = `${origin}/#website`;
  const pageId = `${meta.canonical}#webpage`;
  const breadcrumb = buildBreadcrumb(meta, origin);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HomeAndConstructionBusiness",
        "@id": businessId,
        name: siteName,
        alternateName: siteSettings?.brand_name || "FLASH CAST",
        url: origin,
        logo,
        image,
        telephone: siteSettings?.phone_e164 || DEFAULT_PHONE,
        email: siteSettings?.email || DEFAULT_EMAIL,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteSettings?.address_en || siteSettings?.address_zh || DEFAULT_ADDRESS,
          addressLocality: "Kuala Lumpur",
          addressRegion: "Kuala Lumpur",
          postalCode: "58200",
          addressCountry: "MY",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: siteSettings?.map_latitude || DEFAULT_MAP_LATITUDE,
          longitude: siteSettings?.map_longitude || DEFAULT_MAP_LONGITUDE,
        },
        areaServed: [
          "Kuala Lumpur",
          "Selangor",
          "Petaling Jaya",
          "Cheras",
          "Mont Kiara",
          "Bangsar",
          "Subang Jaya",
          "Shah Alam",
          "Puchong",
        ],
        knowsAbout: [
          "renovation",
          "interior design",
          "custom built-in furniture",
          "kitchen renovation",
          "bathroom renovation",
          "office renovation",
          "commercial fit-out",
          "Kuala Lumpur renovation",
          "Selangor renovation",
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: origin,
        name: siteName,
        inLanguage: ["en", "zh-CN"],
        publisher: { "@id": businessId },
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: meta.canonical,
        name: meta.title,
        description: meta.description,
        inLanguage: lang,
        isPartOf: { "@id": websiteId },
        about: { "@id": businessId },
        provider: { "@id": businessId },
        primaryImageOfPage: image
          ? {
              "@type": "ImageObject",
              url: image,
            }
          : undefined,
        breadcrumb: { "@id": breadcrumb["@id"] },
        keywords: meta.keywords || undefined,
      },
      breadcrumb,
    ],
  };
};

const injectEdgeStructuredData = (html: string, meta: SeoEntry, siteSettings?: SiteSettingsHead | null) => {
  const script = `<script type="application/ld+json" data-flashcast-edge-schema>${escapeJsonForHtml(buildEdgeStructuredData(meta, siteSettings))}</script>`;
  return replaceOrInsertTag(
    html,
    /<script\b(?=[^>]*\btype="application\/ld\+json")(?=[^>]*\bdata-flashcast-edge-schema)[^>]*>[\s\S]*?<\/script>/i,
    script,
  );
};

const injectGeoSummary = (html: string, meta: SeoEntry) => {
  if (html.includes("data-flashcast-geo-summary")) return html;

  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = escapeHtml(meta.canonical);
  const lang = meta.lang === "zh" ? "zh-CN" : "en";
  const summary = `<noscript data-flashcast-geo-summary><section lang="${lang}" aria-label="Page summary"><h1>${title}</h1><p>${description}</p><p><a href="${canonical}">${canonical}</a></p></section></noscript>`;
  return html.replace(/<body([^>]*)>/i, `<body$1>\n    ${summary}`);
};

const fetchSiteSettings = async (env: Record<string, string | undefined>) => {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?select=company_name,brand_name,logo_url,favicon_url,og_image_url,phone_e164,email,address_en,address_zh,map_latitude,map_longitude,updated_at&id=eq.default&limit=1`,
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

const EXACT_LEGACY_REDIRECTS: Record<string, string> = {
  "/en/materials/spc-vinyl-natural-oak": "/en/materials/spc-flooring-natural-oak",
  "/zh/materials/spc-vinyl-natural-oak": "/zh/materials/spc-flooring-natural-oak",
  "/en/projects/mont-kiara-condo-renovation": "/en/projects/mont-kiara-luxury-condo-renovation",
  "/zh/projects/mont-kiara-condo-renovation": "/zh/projects/mont-kiara-luxury-condo-renovation",
};

const redirect = (to: URL) =>
  new Response(null, {
    status: 301,
    headers: {
      Location: to.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });

const isLanguagePrefixedPath = (pathname: string) => /^\/(en|zh)(?:\/|$)/.test(pathname);

const getLegacyCanonicalPath = (pathname: string) => {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  if (isLanguagePrefixedPath(cleaned) || cleaned === "/admin" || cleaned.startsWith("/admin/")) {
    return null;
  }

  const englishPath = cleaned === "/" ? "/en" : `/en${cleaned}`;
  return (manifest as Record<string, SeoEntry>)[englishPath] ? englishPath : null;
};

const getExactLegacyRedirectPath = (pathname: string) => {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  return EXACT_LEGACY_REDIRECTS[cleaned] || null;
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
  out = out.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title data-rh="true">${title}</title>`);
  out = replaceOrInsertTag(
    out,
    /<meta\b(?=[^>]*\bname="description")[^>]*>/i,
    `<meta data-rh="true" name="description" content="${description}" />`,
  );

  out = replaceOrInsertTag(out, /<link\b[^>]*rel="canonical"[^>]*>/i, `<link data-rh="true" rel="canonical" href="${canonical}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*hreflang="zh-CN"[^>]*>/i, `<link data-rh="true" rel="alternate" hreflang="zh-CN" href="${escapeHtml(meta.hreflang.zh)}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*hreflang="en"[^>]*>/i, `<link data-rh="true" rel="alternate" hreflang="en" href="${escapeHtml(meta.hreflang.en)}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*hreflang="x-default"[^>]*>/i, `<link data-rh="true" rel="alternate" hreflang="x-default" href="${escapeHtml(meta.hreflang.xDefault)}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:site_name"[^>]*>/i, `<meta data-rh="true" property="og:site_name" content="${siteName}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:title"[^>]*>/i, `<meta data-rh="true" property="og:title" content="${title}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:description"[^>]*>/i, `<meta data-rh="true" property="og:description" content="${description}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:image"[^>]*>/i, `<meta data-rh="true" property="og:image" content="${ogImage}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:url"[^>]*>/i, `<meta data-rh="true" property="og:url" content="${canonical}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="twitter:title"[^>]*>/i, `<meta data-rh="true" name="twitter:title" content="${title}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="twitter:description"[^>]*>/i, `<meta data-rh="true" name="twitter:description" content="${description}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="twitter:image"[^>]*>/i, `<meta data-rh="true" name="twitter:image" content="${ogImage}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*rel="icon"[^>]*>/i, `<link data-rh="true" rel="icon" href="${favicon}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*rel="apple-touch-icon"[^>]*>/i, `<link data-rh="true" rel="apple-touch-icon" href="${favicon}" />`);
  out = injectEdgeStructuredData(out, meta, siteSettings);
  out = injectGeoSummary(out, meta);

  return out;
};

const injectNoIndexNotFound = (html: string, siteSettings?: SiteSettingsHead | null) => {
  const siteName = escapeHtml(siteSettings?.company_name || siteSettings?.brand_name || "FLASH CAST SDN. BHD.");
  let out = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title data-rh="true">Page not found | ${siteName}</title>`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="description"[^>]*>/i, `<meta data-rh="true" name="description" content="The requested page was not found." />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="robots"[^>]*>/i, `<meta data-rh="true" name="robots" content="noindex, nofollow" />`);
  return injectBrandAssets(out, siteSettings);
};

const injectBrandAssets = (html: string, siteSettings?: SiteSettingsHead | null) => {
  if (!siteSettings) return html;

  const version = siteSettings.updated_at || undefined;
  const favicon = escapeHtml(addCacheBuster(siteSettings.favicon_url || siteSettings.logo_url || DEFAULT_FAVICON, version));
  const ogImage = escapeHtml(addCacheBuster(siteSettings.og_image_url || siteSettings.logo_url || DEFAULT_OG_IMAGE, version));
  const siteName = escapeHtml(siteSettings.company_name || siteSettings.brand_name || "FLASH CAST SDN. BHD.");

  let out = html;
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:site_name"[^>]*>/i, `<meta data-rh="true" property="og:site_name" content="${siteName}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:image"[^>]*>/i, `<meta data-rh="true" property="og:image" content="${ogImage}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="twitter:image"[^>]*>/i, `<meta data-rh="true" name="twitter:image" content="${ogImage}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*rel="icon"[^>]*>/i, `<link data-rh="true" rel="icon" href="${favicon}" />`);
  out = replaceOrInsertTag(out, /<link\b[^>]*rel="apple-touch-icon"[^>]*>/i, `<link data-rh="true" rel="apple-touch-icon" href="${favicon}" />`);
  return out;
};

const STATIC_PATH_PREFIXES = ["/assets/", "/images/", "/videos/"];

const isAssetPath = (pathname: string) =>
  STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  (/\.[a-z0-9]+$/i.test(pathname) && !pathname.endsWith(".html"));

const applyHtmlNoStoreHeaders = (headers: Headers) => {
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("cdn-cache-control", "no-store");
  headers.set("cloudflare-cdn-cache-control", "no-store");
  headers.set("pragma", "no-cache");
  headers.set("expires", "0");
};

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const env = ((context as unknown as { env?: PagesEnv }).env ?? {}) as PagesEnv;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return next();
  }

  if (url.hostname === "www.flashcast.com.my") {
    url.hostname = "flashcast.com.my";
    url.protocol = "https:";
    return redirect(url);
  }

  const exactLegacyRedirectPath = getExactLegacyRedirectPath(url.pathname);
  if (exactLegacyRedirectPath) {
    url.pathname = exactLegacyRedirectPath;
    return redirect(url);
  }

  if (isAssetPath(url.pathname)) {
    return next();
  }

  const legacyCanonicalPath = getLegacyCanonicalPath(url.pathname);
  if (legacyCanonicalPath) {
    url.pathname = legacyCanonicalPath;
    return redirect(url);
  }

  const appShellUrl = new URL(request.url);
  appShellUrl.pathname = "/";
  appShellUrl.search = "";
  const response = env.ASSETS
    ? await env.ASSETS.fetch(new Request(appShellUrl.toString(), request))
    : await next("/");
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    const html = await response.text();
    const robotsTag = '<meta data-rh="true" name="robots" content="noindex, nofollow" />';
    const transformed = html.includes("noindex")
      ? html
      : html.replace("</head>", `    ${robotsTag}\n  </head>`);
    const headers = new Headers(response.headers);
    applyHtmlNoStoreHeaders(headers);
    return new Response(transformed, { status: response.status, headers });
  }

  const key = normalizePath(url.pathname);
  const meta = (manifest as Record<string, SeoEntry>)[key];
  const siteSettings = await fetchSiteSettings(env as Record<string, string | undefined>);

  const html = await response.text();
  const transformed = meta ? injectSeo(html, meta, siteSettings) : injectNoIndexNotFound(html, siteSettings);
  const headers = new Headers(response.headers);
  applyHtmlNoStoreHeaders(headers);
  return new Response(transformed, { status: meta ? response.status : 404, headers });
};
