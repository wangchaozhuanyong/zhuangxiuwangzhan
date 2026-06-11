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

type ProjectSummaryRow = Record<string, unknown>;
type ProjectDetailRow = Record<string, unknown>;
type HomeContentBundleRow = Record<string, unknown>;
type PublicDataRow = Record<string, unknown>;

type PagesEnv = {
  [key: string]: unknown;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  ASSETS?: {
    fetch: (input: Request | string | URL, init?: RequestInit) => Promise<Response>;
  };
};

const DEFAULT_OG_IMAGE = (manifest as Record<string, SeoEntry>)["/en"]?.ogImage ?? "";
const DEFAULT_LOGO_PNG_PATH = "/logo-flashcast.png";
const DEFAULT_LOGO_WEBP_PATH = "/logo-flashcast.webp";
const DEFAULT_LOGO_VERSIONED_WEBP_PATH = "/logo-flashcast-20260605.webp";
const DEFAULT_FAVICON = "/favicon-20260604.png";
const DEFAULT_TOUCH_ICON = "/apple-touch-icon-20260604.png";
const DEFAULT_ADDRESS = "94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia";
const DEFAULT_PHONE = "+601128853888";
const DEFAULT_EMAIL = "info@flashcast.com.my";
const DEFAULT_MAP_LATITUDE = "3.0830403";
const DEFAULT_MAP_LONGITUDE = "101.6708234";
const PUBLIC_HTML_BROWSER_TTL_SECONDS = 60;
const PUBLIC_HTML_EDGE_TTL_SECONDS = 300;
const PUBLIC_HTML_CACHE_VERSION = "20260610-google-ads-tag";
const SITE_SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;
const PUBLIC_PROJECT_SUMMARIES_CACHE_TTL_MS = 5 * 60 * 1000;
const PUBLIC_PROJECT_DETAIL_CACHE_TTL_MS = 5 * 60 * 1000;
const PUBLIC_HOME_BUNDLE_CACHE_TTL_MS = 5 * 60 * 1000;
const PUBLIC_PAGE_DATA_CACHE_TTL_MS = 5 * 60 * 1000;
const HERO_MEDIA_VERSION = "20260531-mobile-source-fix";
const HTML_CACHE_DEBUG_HEADER = "x-flashcast-html-cache";
const PRODUCTION_SCRIPT_SRC = [
  "'self'",
  "https://challenges.cloudflare.com",
  "https://static.cloudflareinsights.com",
  "https://www.googletagmanager.com",
];
const CSP_DIRECTIVES = (scriptSrc: string[]) => [
  ["default-src", "'self'"],
  ["base-uri", "'self'"],
  ["object-src", "'none'"],
  ["frame-ancestors", "'none'"],
  ["script-src", ...scriptSrc],
  ["style-src", "'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  ["font-src", "'self'", "https://fonts.gstatic.com", "data:"],
  ["img-src", "'self'", "data:", "blob:", "https:"],
  ["media-src", "'self'", "blob:", "https:"],
  [
    "connect-src",
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.telegram.org",
    "https://nominatim.openstreetmap.org",
    "https://cloudflareinsights.com",
    "https://challenges.cloudflare.com",
    "https://static.cloudflareinsights.com",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://www.googleadservices.com",
    "https://googleads.g.doubleclick.net",
    "https://stats.g.doubleclick.net",
    "https://region1.google-analytics.com",
  ],
  ["frame-src", "https://www.google.com", "https://maps.google.com", "https://challenges.cloudflare.com"],
  ["form-action", "'self'"],
];
const INLINE_SCRIPT_PATTERN = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
type HtmlCacheDebugState = "hit" | "miss" | "bypass-admin" | "bypass-not-found";

let siteSettingsCache:
  | {
      key: string;
      value: SiteSettingsHead | null;
      expiresAt: number;
    }
  | null = null;

let projectSummariesCache:
  | {
      key: string;
      value: ProjectSummaryRow[] | null;
      expiresAt: number;
    }
  | null = null;

let projectDetailCache:
  | {
      key: string;
      value: ProjectDetailRow | null;
      expiresAt: number;
    }
  | null = null;

let homeContentBundleCache:
  | {
      key: string;
      value: HomeContentBundleRow | null;
      expiresAt: number;
    }
  | null = null;

const publicRowsCache = new Map<string, { value: PublicDataRow[] | null; expiresAt: number }>();

const PROJECT_SUMMARY_SELECT = [
  "id",
  "slug",
  "title_en",
  "title_zh",
  "project_type",
  "location",
  "excerpt_en",
  "excerpt_zh",
  "image_url",
  "sort_order",
  "project_images(id,image_url,image_type,sort_order,alt_en,alt_zh)",
].join(",");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const serializeCsp = (items: string[][]) => items.map(([name, ...values]) => `${name} ${values.join(" ")}`).join("; ");

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const getInlineScriptHashes = async (html: string) => {
  const hashes = new Set<string>();
  const encoder = new TextEncoder();

  for (const match of html.matchAll(INLINE_SCRIPT_PATTERN)) {
    const content = match[1] ?? "";
    if (!content.trim()) continue;
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(content));
    hashes.add(`'sha256-${toBase64(digest)}'`);
  }

  return [...hashes];
};

const buildHtmlContentSecurityPolicy = async (html: string) => {
  const inlineScriptHashes = await getInlineScriptHashes(html);
  return `${serializeCsp(CSP_DIRECTIVES([...PRODUCTION_SCRIPT_SRC, ...inlineScriptHashes]))}; upgrade-insecure-requests`;
};

const applyHtmlSecurityHeaders = async (headers: Headers, html: string) => {
  headers.delete("access-control-allow-origin");
  headers.set("content-security-policy", await buildHtmlContentSecurityPolicy(html));
};

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

const normalizeBuiltInLogoUrl = (url: string | null | undefined, origin = "https://flashcast.com.my") => {
  if (!url) return url;

  const trimmed = url.trim();
  const isRootRelative = trimmed.startsWith("/") && !trimmed.startsWith("//");

  try {
    const parsed = new URL(trimmed, origin);
    const originHost = new URL(origin).hostname.toLowerCase();
    const host = parsed.hostname.toLowerCase();
    const isKnownSiteLogo = isRootRelative || host === originHost || host === "flashcast.com.my" || host === "www.flashcast.com.my";

    if (
      isKnownSiteLogo &&
      (parsed.pathname.toLowerCase() === DEFAULT_LOGO_PNG_PATH ||
        parsed.pathname.toLowerCase() === DEFAULT_LOGO_WEBP_PATH)
    ) {
      parsed.pathname = DEFAULT_LOGO_VERSIONED_WEBP_PATH;
      return isRootRelative ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString();
    }
  } catch {
    if (/^\/logo-flashcast\.(?:png|webp)(?:[?#]|$)/i.test(trimmed)) {
      return trimmed.replace(/\/logo-flashcast\.(?:png|webp)/i, DEFAULT_LOGO_VERSIONED_WEBP_PATH);
    }
  }

  return url;
};

const HEAD_ICON_LINK_PATTERN =
  /<link\b(?=[^>]*\brel=(?:"(?:icon|shortcut icon|apple-touch-icon)"|'(?:icon|shortcut icon|apple-touch-icon)'))[^>]*>\s*/gi;

const hasIconExtension = (url: string | null | undefined, extensions: string[]) => {
  if (!url) return false;

  try {
    const parsed = new URL(url, "https://example.com");
    const pathname = parsed.pathname.toLowerCase();
    return extensions.some((extension) => pathname.endsWith(`.${extension}`));
  } catch {
    const [withoutQuery = ""] = url.split(/[?#]/);
    const normalized = withoutQuery.toLowerCase();
    return extensions.some((extension) => normalized.endsWith(`.${extension}`));
  }
};

const resolveHeadIcons = (siteSettings?: SiteSettingsHead | null) => {
  const version = siteSettings?.updated_at || undefined;
  const isCustomFavicon = Boolean(siteSettings?.favicon_url && siteSettings.favicon_url !== DEFAULT_FAVICON);
  const faviconSource = hasIconExtension(siteSettings?.favicon_url, ["ico", "png", "svg"])
    ? siteSettings?.favicon_url || DEFAULT_FAVICON
    : DEFAULT_FAVICON;
  const touchIconSource = isCustomFavicon && hasIconExtension(siteSettings?.favicon_url, ["png"])
    ? siteSettings?.favicon_url || DEFAULT_TOUCH_ICON
    : DEFAULT_TOUCH_ICON;

  return {
    favicon: escapeHtml(addCacheBuster(faviconSource, version)),
    touchIcon: escapeHtml(addCacheBuster(touchIconSource, version)),
  };
};

const injectHeadIcons = (html: string, favicon: string, touchIcon: string) => {
  const cleaned = html.replace(HEAD_ICON_LINK_PATTERN, "");
  const tags = [
    `<link data-rh="true" rel="icon" href="/favicon.ico" sizes="any" />`,
    `<link data-rh="true" rel="icon" type="image/png" sizes="512x512" href="${favicon}" />`,
    `<link data-rh="true" rel="apple-touch-icon" sizes="180x180" href="${touchIcon}" />`,
  ].join("\n    ");

  if (/<\/head>/i.test(cleaned)) {
    return cleaned.replace(/<\/head>/i, `    ${tags}\n  </head>`);
  }

  return `${tags}\n${cleaned}`;
};

const replaceOrInsertTag = (html: string, pattern: RegExp, replacement: string) => {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace("</head>", `    ${replacement}\n  </head>`);
};

const getSupabaseOrigin = (env: Record<string, string | undefined>) => {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return "";

  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return "";
  }
};

const injectPerformanceHints = (html: string, env: Record<string, string | undefined>) => {
  if (html.includes("data-flashcast-performance-hints")) return html;

  const supabaseOrigin = getSupabaseOrigin(env);
  const hints = [
    '<meta data-flashcast-performance-hints="true" />',
    supabaseOrigin ? `<link rel="preconnect" href="${escapeHtml(supabaseOrigin)}" crossorigin />` : "",
    supabaseOrigin ? `<link rel="dns-prefetch" href="//${escapeHtml(new URL(supabaseOrigin).hostname)}" />` : "",
    `<link rel="preload" as="image" href="/videos/home-hero-poster-mobile.webp?v=${HERO_MEDIA_VERSION}" media="(max-width: 767px)" fetchpriority="high" />`,
    `<link rel="preload" as="image" href="/videos/home-hero-poster-tablet.webp?v=${HERO_MEDIA_VERSION}" media="(min-width: 768px) and (max-width: 1180px) and (orientation: portrait)" fetchpriority="high" />`,
    `<link rel="preload" as="image" href="/videos/home-hero-poster.webp?v=${HERO_MEDIA_VERSION}" media="(min-width: 768px) and (orientation: landscape), (min-width: 1181px)" fetchpriority="high" />`,
  ].filter(Boolean);

  return html.replace("</head>", `    ${hints.join("\n    ")}\n  </head>`);
};

const injectPublicData = (html: string, payload: unknown) => {
  const script = `<script type="application/json" id="flashcast-public-data">${escapeJsonForHtml(payload)}</script>`;
  if (html.includes('id="flashcast-public-data"')) {
    return html.replace(
      /<script\b(?=[^>]*\bid="flashcast-public-data")[^>]*>[\s\S]*?<\/script>/i,
      script,
    );
  }

  return html.replace("</head>", `    ${script}\n  </head>`);
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
  const logo = normalizeBuiltInLogoUrl(siteSettings?.logo_url, origin) || `${origin}${DEFAULT_LOGO_VERSIONED_WEBP_PATH}`;
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
  const cacheKey = supabaseUrl;
  const now = Date.now();
  if (siteSettingsCache?.key === cacheKey && siteSettingsCache.expiresAt > now) {
    return siteSettingsCache.value;
  }

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
    const row = rows[0] ?? null;
    const value = row ? { ...row, logo_url: normalizeBuiltInLogoUrl(row.logo_url) } : null;
    siteSettingsCache = {
      key: cacheKey,
      value,
      expiresAt: now + SITE_SETTINGS_CACHE_TTL_MS,
    };
    return value;
  } catch {
    return null;
  }
};

const fetchProjectSummaries = async (env: Record<string, string | undefined>) => {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;
  const cacheKey = `${supabaseUrl}:project_summaries`;
  const now = Date.now();
  if (projectSummariesCache?.key === cacheKey && projectSummariesCache.expiresAt > now) {
    return projectSummariesCache.value;
  }

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/projects`);
    url.searchParams.set("select", PROJECT_SUMMARY_SELECT);
    url.searchParams.set("status", "eq.published");
    url.searchParams.set("order", "sort_order.asc");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) return null;

    const value = (await response.json()) as ProjectSummaryRow[];
    projectSummariesCache = {
      key: cacheKey,
      value,
      expiresAt: now + PUBLIC_PROJECT_SUMMARIES_CACHE_TTL_MS,
    };
    return value;
  } catch {
    return null;
  }
};

const fetchHomeContentBundle = async (env: Record<string, string | undefined>) => {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;
  const cacheKey = `${supabaseUrl}:home_content_bundle`;
  const now = Date.now();
  if (homeContentBundleCache?.key === cacheKey && homeContentBundleCache.expiresAt > now) {
    return homeContentBundleCache.value;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_public_home_bundle`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });

    if (!response.ok) return null;

    const value = (await response.json()) as HomeContentBundleRow;
    homeContentBundleCache = {
      key: cacheKey,
      value,
      expiresAt: now + PUBLIC_HOME_BUNDLE_CACHE_TTL_MS,
    };
    return value;
  } catch {
    return null;
  }
};

const fetchPublicRows = async (
  env: Record<string, string | undefined>,
  cacheKey: string,
  table: string,
  configureUrl: (url: URL) => void,
) => {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;
  const key = `${supabaseUrl}:${cacheKey}`;
  const now = Date.now();
  const cached = publicRowsCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
    configureUrl(url);

    const response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) return null;

    const value = (await response.json()) as PublicDataRow[];
    publicRowsCache.set(key, {
      value,
      expiresAt: now + PUBLIC_PAGE_DATA_CACHE_TTL_MS,
    });
    return value;
  } catch {
    return null;
  }
};

const fetchPublicServices = async (env: Record<string, string | undefined>) =>
  fetchPublicRows(env, "services", "services", (url) => {
    url.searchParams.set("select", "*");
    url.searchParams.set("status", "eq.published");
    url.searchParams.set("order", "sort_order.asc");
  });

const fetchPublicMaterials = async (env: Record<string, string | undefined>) =>
  fetchPublicRows(env, "materials", "materials", (url) => {
    url.searchParams.set("select", "*");
    url.searchParams.set("status", "eq.published");
    url.searchParams.set("order", "sort_order.asc");
  });

const fetchPublicBlogPosts = async (env: Record<string, string | undefined>) =>
  fetchPublicRows(env, "blog_posts", "blog_posts", (url) => {
    url.searchParams.set("select", "*");
    url.searchParams.set("status", "eq.published");
    url.searchParams.set("order", "published_at.desc");
  });

const fetchPublicSitePageBundle = async (env: Record<string, string | undefined>, pageKey: string) => {
  if (!pageKey) return null;
  const [legacyRows, cmsRows] = await Promise.all([
    fetchPublicRows(env, `site_pages:${pageKey}`, "site_pages", (url) => {
      url.searchParams.set("select", "*");
      url.searchParams.set("status", "eq.published");
      url.searchParams.set("page_key", `eq.${pageKey}`);
      url.searchParams.set("limit", "1");
    }),
    fetchPublicRows(env, `cms_pages:${pageKey}`, "cms_pages", (url) => {
      url.searchParams.set("select", "*,cms_sections(*)");
      url.searchParams.set("status", "eq.published");
      url.searchParams.set("deleted_at", "is.null");
      url.searchParams.set("page_key", `eq.${pageKey}`);
      url.searchParams.set("limit", "1");
    }),
  ]);

  const bundle: PublicDataRow = {};
  if (legacyRows?.length) bundle.site_pages = legacyRows;
  if (cmsRows?.length) bundle.cms_pages = cmsRows;
  return Object.keys(bundle).length ? bundle : null;
};

const fetchPublicCtaBlock = async (env: Record<string, string | undefined>, blockKey: string) => {
  const rows = await fetchPublicRows(env, `cta_blocks:${blockKey}`, "cta_blocks", (url) => {
    url.searchParams.set("select", "*");
    url.searchParams.set("status", "eq.published");
    url.searchParams.set("block_key", `eq.${blockKey}`);
    url.searchParams.set("limit", "1");
  });
  return rows?.[0] ?? null;
};

const fetchProjectDetailBySlug = async (env: Record<string, string | undefined>, slug: string) => {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !slug) return null;
  const cacheKey = `${supabaseUrl}:project_detail:${slug}`;
  const now = Date.now();
  if (projectDetailCache?.key === cacheKey && projectDetailCache.expiresAt > now) {
    return projectDetailCache.value;
  }

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/projects`);
    url.searchParams.set("select", "*,project_images(*)");
    url.searchParams.set("status", "eq.published");
    url.searchParams.set("slug", `eq.${slug}`);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) return null;

    const rows = (await response.json()) as ProjectDetailRow[];
    const value = rows[0] ?? null;
    projectDetailCache = {
      key: cacheKey,
      value,
      expiresAt: now + PUBLIC_PROJECT_DETAIL_CACHE_TTL_MS,
    };
    return value;
  } catch {
    return null;
  }
};

const normalizePath = (pathname: string) => {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  if (cleaned === "/") return "/en";
  return cleaned;
};

const isHomePageKey = (key: string) => key === "/en" || key === "/zh";

const getTopLevelPublicPageKey = (key: string) => {
  const parts = key.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const pageKey = parts[1];
  return pageKey === "services" || pageKey === "materials" || pageKey === "blog" || pageKey === "projects" ? pageKey : null;
};

const getPathWithoutLanguage = (key: string) => {
  const parts = key.split("/").filter(Boolean);
  const pathParts = parts.slice(1);
  return pathParts.length ? `/${pathParts.join("/")}` : "/";
};

const shouldPreloadFooterCtaBlock = (key: string) => {
  const path = getPathWithoutLanguage(key);
  const hasDedicatedSubpageCta =
    path === "/services" ||
    path.startsWith("/services/") ||
    path === "/projects" ||
    path === "/materials" ||
    path.startsWith("/materials/category/") ||
    path === "/faq" ||
    path.startsWith("/landing/");

  return path !== "/" && !hasDedicatedSubpageCta;
};

const getProjectDetailSlugFromKey = (key: string) => {
  const match = key.match(/^\/(?:en|zh)\/projects\/([^/]+)$/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const EXACT_LEGACY_REDIRECTS: Record<string, string> = {
  "/en/materials/acrylic-high-gloss-white": "/en/materials/acrylic-cabinet-gloss-white",
  "/zh/materials/acrylic-high-gloss-white": "/zh/materials/acrylic-cabinet-gloss-white",
  "/en/materials/melamine-grey-oak": "/en/materials/melamine-cabinet-grey-oak",
  "/zh/materials/melamine-grey-oak": "/zh/materials/melamine-cabinet-grey-oak",
  "/en/materials/spc-vinyl-natural-oak": "/en/materials/spc-flooring-natural-oak",
  "/zh/materials/spc-vinyl-natural-oak": "/zh/materials/spc-flooring-natural-oak",
  "/en/projects/mont-kiara-condo-renovation": "/en/projects/mont-kiara-luxury-condo-renovation",
  "/zh/projects/mont-kiara-condo-renovation": "/zh/projects/mont-kiara-luxury-condo-renovation",
  "/en/services/office": "/en/services/office-renovation",
  "/zh/services/office": "/zh/services/office-renovation",
  "/en/services/shoplot": "/en/services/shop-renovation",
  "/zh/services/shoplot": "/zh/services/shop-renovation",
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
  // Keep the root document crawlable for ownership verification bots. The SPA
  // still sends visitors to the default language route after hydration.
  if (cleaned === "/") {
    return null;
  }

  if (isLanguagePrefixedPath(cleaned) || cleaned === "/admin" || cleaned.startsWith("/admin/")) {
    return null;
  }

  const englishPath = `/en${cleaned}`;
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
  const { favicon, touchIcon } = resolveHeadIcons(siteSettings);
  const defaultOgImage = siteSettings?.og_image_url || normalizeBuiltInLogoUrl(siteSettings?.logo_url, canonical.origin) || meta.ogImage;
  const ogImage =
    meta.ogImage === DEFAULT_OG_IMAGE
      ? escapeHtml(addCacheBuster(defaultOgImage, version))
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
  out = injectHeadIcons(out, favicon, touchIcon);
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
  const { favicon, touchIcon } = resolveHeadIcons(siteSettings);
  const ogImage = escapeHtml(addCacheBuster(siteSettings.og_image_url || normalizeBuiltInLogoUrl(siteSettings.logo_url) || DEFAULT_OG_IMAGE, version));
  const siteName = escapeHtml(siteSettings.company_name || siteSettings.brand_name || "FLASH CAST SDN. BHD.");

  let out = html;
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:site_name"[^>]*>/i, `<meta data-rh="true" property="og:site_name" content="${siteName}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*property="og:image"[^>]*>/i, `<meta data-rh="true" property="og:image" content="${ogImage}" />`);
  out = replaceOrInsertTag(out, /<meta\b[^>]*name="twitter:image"[^>]*>/i, `<meta data-rh="true" name="twitter:image" content="${ogImage}" />`);
  return injectHeadIcons(out, favicon, touchIcon);
};

const STATIC_PATH_PREFIXES = ["/assets/", "/images/", "/videos/"];
const BAIDU_VERIFY_PATH = "/baidu_verify_codeva-XKTTMi4PYh.html";
const BAIDU_VERIFY_HTML = "codeva-XKTTMi4PYh";
const STATIC_FILE_PATHS = new Set([
  BAIDU_VERIFY_PATH,
]);

const isAssetPath = (pathname: string) =>
  STATIC_FILE_PATHS.has(pathname) ||
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

const applyPublicHtmlCacheHeaders = (headers: Headers) => {
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set(
    "cache-control",
    `public, max-age=${PUBLIC_HTML_BROWSER_TTL_SECONDS}, stale-while-revalidate=${PUBLIC_HTML_EDGE_TTL_SECONDS}`,
  );
  headers.set("cdn-cache-control", `public, max-age=${PUBLIC_HTML_EDGE_TTL_SECONDS}`);
  headers.set("cloudflare-cdn-cache-control", `public, max-age=${PUBLIC_HTML_EDGE_TTL_SECONDS}`);
  headers.delete("pragma");
  headers.delete("expires");
};

const withHtmlCacheDebugHeader = (response: Response, state: HtmlCacheDebugState) => {
  const headers = new Headers(response.headers);
  headers.set(HTML_CACHE_DEBUG_HEADER, state);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const getEdgeCache = () => {
  if (typeof caches === "undefined" || !caches.default) return null;
  return caches.default;
};

const getPublicHtmlCacheRequest = (request: Request) => {
  const cacheUrl = new URL(request.url);
  cacheUrl.search = "";
  cacheUrl.searchParams.set("__flashcast_html_v", PUBLIC_HTML_CACHE_VERSION);
  cacheUrl.hash = "";
  return new Request(cacheUrl.toString(), { method: "GET" });
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

  if (url.pathname === BAIDU_VERIFY_PATH) {
    return new Response(BAIDU_VERIFY_HTML, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  }

  if (isAssetPath(url.pathname)) {
    return next();
  }

  const legacyCanonicalPath = getLegacyCanonicalPath(url.pathname);
  if (legacyCanonicalPath) {
    url.pathname = legacyCanonicalPath;
    return redirect(url);
  }

  const key = normalizePath(url.pathname);
  const meta = (manifest as Record<string, SeoEntry>)[key];
  const edgeCache = meta && request.method === "GET" ? getEdgeCache() : null;
  const publicHtmlCacheRequest = edgeCache ? getPublicHtmlCacheRequest(request) : null;
  const cachedPublicHtml = edgeCache && publicHtmlCacheRequest ? await edgeCache.match(publicHtmlCacheRequest) : null;
  if (cachedPublicHtml) {
    return withHtmlCacheDebugHeader(cachedPublicHtml, "hit");
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
	    await applyHtmlSecurityHeaders(headers, transformed);
	    return withHtmlCacheDebugHeader(new Response(transformed, { status: response.status, headers }), "bypass-admin");
	  }

  const projectDetailSlug = getProjectDetailSlugFromKey(key);
  const topLevelPublicPageKey = getTopLevelPublicPageKey(key);
  const shouldInjectHomeBundle = Boolean(meta && isHomePageKey(key));
  const shouldInjectProjectSummaries = Boolean(meta && (key === "/en/projects" || key === "/zh/projects" || projectDetailSlug));
  const shouldInjectPublicPageBundle = Boolean(meta && topLevelPublicPageKey);
  const shouldInjectServices = topLevelPublicPageKey === "services";
  const shouldInjectMaterials = topLevelPublicPageKey === "materials";
  const shouldInjectBlogPosts = topLevelPublicPageKey === "blog";
  const shouldInjectGlobalCtaBlock = Boolean(meta && shouldPreloadFooterCtaBlock(key));
  const [
    siteSettings,
    homeContentBundle,
    projectSummaries,
    projectDetail,
    publicPageBundle,
    services,
    materials,
    blogPosts,
    footerCtaBlock,
  ] = await Promise.all([
    fetchSiteSettings(env as Record<string, string | undefined>),
    shouldInjectHomeBundle ? fetchHomeContentBundle(env as Record<string, string | undefined>) : Promise.resolve(null),
    shouldInjectProjectSummaries ? fetchProjectSummaries(env as Record<string, string | undefined>) : Promise.resolve(null),
    projectDetailSlug ? fetchProjectDetailBySlug(env as Record<string, string | undefined>, projectDetailSlug) : Promise.resolve(null),
    shouldInjectPublicPageBundle && topLevelPublicPageKey
      ? fetchPublicSitePageBundle(env as Record<string, string | undefined>, topLevelPublicPageKey)
      : Promise.resolve(null),
    shouldInjectServices ? fetchPublicServices(env as Record<string, string | undefined>) : Promise.resolve(null),
    shouldInjectMaterials ? fetchPublicMaterials(env as Record<string, string | undefined>) : Promise.resolve(null),
    shouldInjectBlogPosts ? fetchPublicBlogPosts(env as Record<string, string | undefined>) : Promise.resolve(null),
    shouldInjectGlobalCtaBlock ? fetchPublicCtaBlock(env as Record<string, string | undefined>, "home_final") : Promise.resolve(null),
  ]);

  const html = await response.text();
  let transformed = meta ? injectSeo(html, meta, siteSettings) : injectNoIndexNotFound(html, siteSettings);
  const publicDataPayload: Record<string, unknown> = {};
  if (siteSettings) {
    publicDataPayload.siteSettings = siteSettings;
  }
  if (homeContentBundle && Object.keys(homeContentBundle).length) {
    publicDataPayload.homeContentBundle = homeContentBundle;
  }
  if (shouldInjectProjectSummaries && projectSummaries?.length) {
    publicDataPayload.projectSummaries = projectSummaries;
  }
  if (projectDetailSlug && projectDetail) {
    publicDataPayload.projectDetails = {
      [projectDetailSlug]: projectDetail,
    };
  }
  if (topLevelPublicPageKey && publicPageBundle) {
    publicDataPayload.sitePages = {
      [topLevelPublicPageKey]: publicPageBundle,
    };
  }
  if (services?.length) {
    publicDataPayload.services = services;
  }
  if (materials?.length) {
    publicDataPayload.materials = materials;
  }
  if (blogPosts?.length) {
    publicDataPayload.blogPosts = blogPosts;
  }
  if (footerCtaBlock) {
    publicDataPayload.ctaBlocks = {
      home_final: footerCtaBlock,
    };
  }
  if (Object.keys(publicDataPayload).length) {
    transformed = injectPublicData(transformed, {
      ...publicDataPayload,
      generatedAt: new Date().toISOString(),
    });
  }
  transformed = injectPerformanceHints(
    transformed,
    env as Record<string, string | undefined>,
  );
  const headers = new Headers(response.headers);
	  if (meta) {
	    applyPublicHtmlCacheHeaders(headers);
	  } else {
	    applyHtmlNoStoreHeaders(headers);
	  }
	  await applyHtmlSecurityHeaders(headers, transformed);

	  const finalResponse = withHtmlCacheDebugHeader(
    new Response(transformed, { status: meta ? response.status : 404, headers }),
    meta ? "miss" : "bypass-not-found",
  );
  if (edgeCache && publicHtmlCacheRequest) {
    const putPromise = edgeCache.put(publicHtmlCacheRequest, finalResponse.clone());
    const waitUntil = (context as unknown as { waitUntil?: (promise: Promise<unknown>) => void }).waitUntil;
    if (typeof waitUntil === "function") {
      waitUntil(putPromise);
    } else {
      await putPromise.catch(() => undefined);
    }
  }

  return finalResponse;
};
