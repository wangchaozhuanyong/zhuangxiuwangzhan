import manifest from "./seo-manifest.json";
import {
  PUBLIC_LANGUAGE_COOKIE,
  readCookieValue,
  resolvePreferredLanguage,
} from "../src/i18n/languageDetection";
import {
  buildLocalResponsiveSrcSet,
  isLocalResponsiveImageCandidate,
  normalizeLocalResponsiveImageWidths,
  toLocalResponsiveImageSrc,
} from "../src/lib/localResponsiveImage";
import {
  projectBlogPostSummariesForPreload,
  projectCtaBlockForPreload,
  projectHomeContentBundleForPreload,
  projectMaterialsForPreload,
  projectProjectSummariesForPreload,
  projectServiceAreaSummariesForPreload,
  projectServiceSummariesForPreload,
  projectSitePageBundleForPreload,
} from "./publicDataProjection";

type SeoEntry = {
  lang: string;
  path?: string;
  title: string;
  description: string;
  keywords?: string;
  faqs?: { question: string; answer: string }[];
  canonical: string;
  hreflang: { en: string; zh: string; xDefault: string };
  ogImage: string;
  schemaType?: "BlogPosting";
  headline?: string;
  datePublished?: string;
  dateModified?: string;
  articleSection?: string;
  imageAlt?: string;
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
type DynamicRouteKind = "service" | "project" | "material" | "blog" | "service_area" | "landing_page" | "site_page" | "cms_page";
type DynamicRouteState = {
  kind: DynamicRouteKind;
  row: PublicDataRow;
  meta: SeoEntry;
  contentVersion: string;
};

type PagesEnv = {
  [key: string]: unknown;
  CF_PAGES_COMMIT_SHA?: string;
  CF_PAGES_URL?: string;
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
const DEFAULT_EMAIL = "support@flashcast.com.my";
const DEFAULT_MAP_LATITUDE = "3.0830403";
const DEFAULT_MAP_LONGITUDE = "101.6708234";
const PUBLIC_SITE_URL = "https://flashcast.com.my";
const PUBLIC_HTML_EDGE_TTL_SECONDS = 300;
const PUBLIC_HTML_FRESHNESS_TTL_SECONDS = 60;
const PUBLIC_HTML_CACHE_VERSION = "20260821-public-browser-revalidate-v5";
const PUBLIC_HTML_CACHE_TAG = "flashcast-public-html";
const PUBLIC_VERSION_PATH = "/__flashcast/version";
const SITE_SETTINGS_CACHE_TTL_MS = 5 * 1000;
const PUBLIC_PROJECT_SUMMARIES_CACHE_TTL_MS = 0;
const PUBLIC_PROJECT_DETAIL_CACHE_TTL_MS = 0;
const PUBLIC_HOME_BUNDLE_CACHE_TTL_MS = 60 * 1000;
const PUBLIC_PAGE_DATA_CACHE_TTL_MS = 0;
const HTML_CACHE_DEBUG_HEADER = "x-flashcast-html-cache";
const PRODUCTION_SCRIPT_SRC = [
  "'self'",
  "https://challenges.cloudflare.com",
  "https://static.cloudflareinsights.com",
  "https://www.googletagmanager.com",
  "https://googleads.g.doubleclick.net",
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
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://www.googleadservices.com",
    "https://www.google.com",
    "https://ad.doubleclick.net",
    "https://googleads.g.doubleclick.net",
    "https://stats.g.doubleclick.net",
    "https://region1.google-analytics.com",
  ],
  ["frame-src", "https://www.google.com", "https://maps.google.com", "https://challenges.cloudflare.com"],
  ["form-action", "'self'"],
];
const INLINE_SCRIPT_PATTERN = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
type HtmlCacheDebugState = "hit" | "stale" | "miss" | "bypass-admin" | "bypass-not-found";

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
const publicHtmlRefreshes = new Map<string, Promise<void>>();

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

type ImagePreload = {
  href: string;
  srcSet?: string;
  sizes?: string;
  media?: string;
};

const PROJECT_CARD_IMAGE_WIDTHS = [360, 560, 720, 900];
const HOME_HERO_IMAGE_WIDTHS = [480, 720, 960, 1280, 1600];
const DEFAULT_HOME_HERO_IMAGE = "/images/heroes/hero-luxury-living.webp";
const HOME_HERO_IMAGE_SIZES = "(max-width: 767px) 100vw, (max-width: 1199px) 58vw, 60vw";
const HOME_ATELIER_HERO_PRELOADS: ImagePreload[] = [
  {
    href: "/images/_responsive/heroes/w360/v4/home-atelier-mobile.webp",
    srcSet: [
      "/images/_responsive/heroes/w360/v4/home-atelier-mobile.webp 360w",
      "/images/_responsive/heroes/w560/v4/home-atelier-mobile.webp 560w",
      "/images/_responsive/heroes/w720/v4/home-atelier-mobile.webp 720w",
      "/images/_responsive/heroes/w900/v4/home-atelier-mobile.webp 900w",
      "/images/heroes/v4/home-atelier-mobile.webp 1200w",
    ].join(", "),
    sizes: "100vw",
    media: "(max-width: 767px)",
  },
  {
    href: "/images/_responsive/heroes/w560/v4/home-atelier-tablet.webp",
    srcSet: [
      "/images/_responsive/heroes/w560/v4/home-atelier-tablet.webp 560w",
      "/images/_responsive/heroes/w720/v4/home-atelier-tablet.webp 720w",
      "/images/_responsive/heroes/w900/v4/home-atelier-tablet.webp 900w",
      "/images/_responsive/heroes/w1200/v4/home-atelier-tablet.webp 1200w",
      "/images/heroes/v4/home-atelier-tablet.webp 1600w",
    ].join(", "),
    sizes: "100vw",
    media: "(min-width: 768px) and (max-width: 1179px)",
  },
  {
    href: "/images/_responsive/heroes/w720/v4/home-atelier-desktop.webp",
    srcSet: [
      "/images/_responsive/heroes/w720/v4/home-atelier-desktop.webp 720w",
      "/images/_responsive/heroes/w900/v4/home-atelier-desktop.webp 900w",
      "/images/_responsive/heroes/w1200/v4/home-atelier-desktop.webp 1200w",
      "/images/_responsive/heroes/w1600/v4/home-atelier-desktop.webp 1600w",
      "/images/heroes/v4/home-atelier-desktop.webp 2880w",
    ].join(", "),
    sizes: "(min-width: 90rem) max(58vw, 178vh), (min-width: 73.75rem) max(60vw, 178vh), 100vw",
    media: "(min-width: 1180px)",
  },
];
const SUPABASE_PUBLIC_OBJECT_SEGMENT = "/storage/v1/object/public/";
const SUPABASE_PUBLIC_RENDER_SEGMENT = "/storage/v1/render/image/public/";
const STATIC_SITE_HOSTS = new Set(["flashcast.com.my", "www.flashcast.com.my"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const readString = (record: Record<string, unknown> | null | undefined, field: string) => {
  const value = record?.[field];
  return typeof value === "string" ? value : "";
};

const readRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const PUBLIC_DRAFT_MARKER_REPLACEMENTS: [RegExp, string][] = [
  [
    /FLASH CAST image-rich draft for shop renovation and retail fit-out planning, including pre-opening preparation, customer flow, counter and storage planning, rendering concepts, FAQ, and consultation CTA\./gi,
    "FLASH CAST plans shop renovation and retail fit-out for shoplots, retail stores, clinics, beauty front areas, F&B spaces, display flow, counter storage, material direction, and quotation preparation.",
  ],
  [
    /FLASH CAST 店铺装修图文内容草案，包含开店前准备、展示动线、柜台收纳、材料方向、效果图方案、FAQ 和咨询 CTA。/g,
    "FLASH CAST 提供店铺装修与零售空间规划，适合 shoplot、零售门店、诊所前区、beauty 前场和小型餐饮空间，重点整理展示动线、柜台收纳、材料方向和报价前准备。",
  ],
  [
    /FLASH CAST 店铺装修双语图文草案，覆盖 shoplot、零售门店、展示空间、柜台收纳、开店前准备、效果图方案、FAQ 和咨询路径。/g,
    "FLASH CAST 提供店铺装修与零售空间规划，覆盖 shoplot、零售门店、展示动线、柜台收纳、开店前准备、效果图方案和咨询路径。",
  ],
  [
    /FLASH CAST image-rich draft for shop renovation and retail fit-out planning/gi,
    "FLASH CAST shop renovation and retail fit-out planning guide",
  ],
  [
    /Bilingual shop renovation and retail fit-out planning content for FLASH CAST, covering/gi,
    "Plan shop renovation and retail fit-out with FLASH CAST, covering",
  ],
  [/image-rich draft/gi, "image-rich guide"],
  [/FLASH CAST 店铺装修双语图文草案/g, "FLASH CAST 店铺装修与零售空间规划服务"],
  [/FLASH CAST 店铺装修图文内容草案/g, "FLASH CAST 店铺装修与零售空间规划指南"],
  [/双语图文草案/g, "双语服务指南"],
  [/图文内容草案/g, "图文内容指南"],
  [/图文草案/g, "服务规划指南"],
  [/works best when/gi, "works well when"],
  [/warranty, and exclusions/gi, "after-sales terms, and exclusions"],
  [/保修和不包含项目/g, "售后条款和不包含项目"],
  [/第一印象/g, "入口观感"],
  [/第一眼/g, "入口观感"],
];

const sanitizePublicDraftMarkers = (value: string) =>
  PUBLIC_DRAFT_MARKER_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );

const sanitizePublicDataDraftMarkers = (value: unknown): unknown => {
  if (typeof value === "string") return sanitizePublicDraftMarkers(value);
  if (Array.isArray(value)) return value.map((item) => sanitizePublicDataDraftMarkers(item));
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, sanitizePublicDataDraftMarkers(item)]),
  );
};

const isSupabasePublicObjectUrl = (value: string) =>
  /^https?:\/\//i.test(value) && value.includes(SUPABASE_PUBLIC_OBJECT_SEGMENT);

const toSupabaseRenderImageUrl = (value: string, width: number, height: number) => {
  const renderBase = value.replace(SUPABASE_PUBLIC_OBJECT_SEGMENT, SUPABASE_PUBLIC_RENDER_SEGMENT);
  const separator = renderBase.includes("?") ? "&" : "?";
  const params = new URLSearchParams({
    quality: "70",
    width: String(width),
    height: String(height),
    format: "webp",
  });

  return `${renderBase}${separator}${params.toString()}`;
};

const normalizePreloadImageUrl = (value: string) => {
  if (!value) return value;
  let normalized = value;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (STATIC_SITE_HOSTS.has(parsed.hostname.toLowerCase()) && /^\/(?:images|videos)\//i.test(parsed.pathname)) {
        normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return value;
    }
  }

  return normalized.startsWith("/")
    ? normalized.replace(/\.(?:jpe?g|png)(\?[^#]*)?($|#)/i, ".webp$1$2")
    : normalized;
};

const buildImagePreload = (
  imageUrl: string,
  widths: number[],
  options: { height: number; sizes: string },
): ImagePreload => {
  if (isSupabasePublicObjectUrl(imageUrl)) {
    return {
      href: toSupabaseRenderImageUrl(imageUrl, widths[0] ?? 480, options.height),
      srcSet: widths
        .map((width) => `${toSupabaseRenderImageUrl(imageUrl, width, options.height)} ${width}w`)
        .join(", "),
      sizes: options.sizes,
    };
  }

  const normalizedUrl = normalizePreloadImageUrl(imageUrl);
  if (isLocalResponsiveImageCandidate(normalizedUrl)) {
    const responsiveWidths = normalizeLocalResponsiveImageWidths(widths);
    return {
      href: toLocalResponsiveImageSrc(normalizedUrl, responsiveWidths[0] ?? widths[0] ?? 480),
      srcSet: buildLocalResponsiveSrcSet(normalizedUrl, responsiveWidths),
      sizes: options.sizes,
    };
  }

  return { href: normalizedUrl };
};

const getHomeHeroImageUrl = (bundle: HomeContentBundleRow | null, key: string) => {
  const slideImage = readString(readRecordArray(bundle?.hero_slides)[0], "image_url");
  if (slideImage) return slideImage;

  const language = key.startsWith("/zh") ? "zh" : "en";
  const cmsPage = readRecordArray(bundle?.cms_pages)[0];
  const cmsSections = readRecordArray(cmsPage?.cms_sections).sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  );
  const cmsHero = cmsSections.find(
    (section) => section.section_key === "hero" || section.section_type === "hero",
  );
  const localizedContent = cmsHero && isRecord(cmsHero[`content_${language}`])
    ? (cmsHero[`content_${language}`] as Record<string, unknown>)
    : null;
  const cmsImage = readString(localizedContent, "image_url") || readString(
    isRecord(cmsHero?.settings) ? cmsHero.settings : null,
    "image_url",
  );
  if (cmsImage) return cmsImage;

  return readString(readRecordArray(bundle?.site_pages)[0], "image_url") || DEFAULT_HOME_HERO_IMAGE;
};

const getProjectImageRank = (record: Record<string, unknown>) => {
  const imageType = readString(record, "image_type");
  if (imageType === "cover") return 0;
  if (imageType === "gallery") return 1;
  if (imageType === "before" || imageType === "after") return 2;
  return 3;
};

const getProjectThumbnailUrl = (project: Record<string, unknown>) => {
  const images = readRecordArray(project.project_images).sort((a, b) => {
    const rank = getProjectImageRank(a) - getProjectImageRank(b);
    if (rank !== 0) return rank;
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });

  return readString(images[0], "image_url") || readString(project, "image_url");
};

const buildProjectImagePreloads = (
  projects: unknown,
  maxImages: number,
  options: { height: number; sizes: string },
) => {
  const seen = new Set<string>();
  const preloads: ImagePreload[] = [];

  for (const project of readRecordArray(projects)) {
    if (preloads.length >= maxImages) break;
    const imageUrl = getProjectThumbnailUrl(project);
    if (!imageUrl || !isSupabasePublicObjectUrl(imageUrl) || seen.has(imageUrl)) continue;
    seen.add(imageUrl);

    const srcSet = PROJECT_CARD_IMAGE_WIDTHS.map(
      (width) => `${toSupabaseRenderImageUrl(imageUrl, width, options.height)} ${width}w`,
    ).join(", ");

    preloads.push({
      href: toSupabaseRenderImageUrl(imageUrl, PROJECT_CARD_IMAGE_WIDTHS[0], options.height),
      srcSet,
      sizes: options.sizes,
    });
  }

  return preloads;
};

const getDynamicImagePreloads = (
  key: string,
  projectSummaries: ProjectSummaryRow[] | null,
  homeContentBundle: HomeContentBundleRow | null,
) => {
  if (isHomePageKey(key)) {
    const heroImageUrl = getHomeHeroImageUrl(homeContentBundle, key);
    if (normalizePreloadImageUrl(heroImageUrl).split(/[?#]/, 1)[0].endsWith("/hero-luxury-living.webp")) {
      return HOME_ATELIER_HERO_PRELOADS;
    }

    return [
      buildImagePreload(heroImageUrl, HOME_HERO_IMAGE_WIDTHS, {
        height: 1100,
        sizes: HOME_HERO_IMAGE_SIZES,
      }),
    ];
  }

  if (getTopLevelPublicPageKey(key) === "projects") {
    return buildProjectImagePreloads(projectSummaries, 12, {
      height: 500,
      sizes: "(max-width: 768px) 92vw, 45vw",
    });
  }

  return [];
};

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
  ].filter(Boolean);

  return html.replace("</head>", `    ${hints.join("\n    ")}\n  </head>`);
};

const injectDynamicImagePreloads = (html: string, preloads: ImagePreload[]) => {
  if (!preloads.length || html.includes("data-flashcast-dynamic-image-preloads")) return html;

  const tags = [
    '<meta data-flashcast-dynamic-image-preloads="true" />',
    ...preloads.map((preload) => {
      const responsiveAttributes = preload.srcSet && preload.sizes
        ? ` imagesrcset="${escapeHtml(preload.srcSet)}" imagesizes="${escapeHtml(preload.sizes)}"`
        : "";
      const mediaAttribute = preload.media ? ` media="${escapeHtml(preload.media)}"` : "";
      return `<link rel="preload" as="image" href="${escapeHtml(preload.href)}"${responsiveAttributes}${mediaAttribute} fetchpriority="high" />`;
    }),
  ];

  return html.replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);
};

const injectPublicData = (html: string, payload: unknown) => {
  const script = `<script type="application/json" id="flashcast-public-data">${escapeJsonForHtml(sanitizePublicDataDraftMarkers(payload))}</script>`;
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
    products: { en: "Products", zh: "装修商品" },
    promotions: { en: "Promotions", zh: "优惠活动" },
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
  const image = meta.ogImage === DEFAULT_OG_IMAGE
    ? siteSettings?.og_image_url || meta.ogImage || DEFAULT_OG_IMAGE
    : meta.ogImage;
  const lang = meta.lang === "zh" ? "zh-CN" : "en";
  const businessId = `${origin}/#localbusiness`;
  const websiteId = `${origin}/#website`;
  const pageId = `${meta.canonical}#webpage`;
  const breadcrumb = buildBreadcrumb(meta, origin);
  const articleNode = meta.schemaType === "BlogPosting"
    ? {
        "@type": "BlogPosting",
        "@id": `${meta.canonical}#article`,
        mainEntityOfPage: { "@id": pageId },
        headline: meta.headline || meta.title.replace(/\s*\|\s*FLASH CAST.*$/i, ""),
        description: meta.description,
        image: image
          ? {
              "@type": "ImageObject",
              url: image,
              caption: meta.imageAlt || meta.headline || meta.title,
            }
          : undefined,
        datePublished: meta.datePublished || undefined,
        dateModified: meta.dateModified || meta.datePublished || undefined,
        inLanguage: lang,
        articleSection: meta.articleSection || undefined,
        keywords: meta.keywords || undefined,
        author: { "@id": businessId },
        publisher: { "@id": businessId },
      }
    : undefined;
  const faqNode =
    meta.faqs && meta.faqs.length > 0
      ? {
          "@type": "FAQPage",
          "@id": `${meta.canonical}#faq`,
          mainEntity: meta.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : undefined;

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
        mainEntity: articleNode ? { "@id": articleNode["@id"] } : undefined,
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
      ...(articleNode ? [articleNode] : []),
      ...(faqNode ? [faqNode] : []),
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
    const [response, brandPartnersVisibilityRows] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/rpc/get_public_home_bundle`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: "{}",
      }),
      fetchPublicRows(env, "home_brand_partners_visibility", "home_sections", (url) => {
        url.searchParams.set("select", "section_key,status");
        url.searchParams.set("section_key", "eq.brand_partners");
        url.searchParams.set("status", "eq.published");
        url.searchParams.set("limit", "1");
      }),
    ]);

    if (!response.ok) return null;

    const value = (await response.json()) as HomeContentBundleRow;
    const homeSections = Array.isArray(value.home_sections) ? value.home_sections : [];
    value.home_sections = [
      ...homeSections,
      brandPartnersVisibilityRows?.[0] || { section_key: "brand_partners", status: "draft" },
    ];
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

const fetchFreshPublicRows = async (
  env: Record<string, string | undefined>,
  table: string,
  configureUrl: (url: URL) => void,
) => {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

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
    return (await response.json()) as PublicDataRow[];
  } catch {
    return null;
  }
};

const stripMarkup = (value: unknown) =>
  String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

const collectContentTimestamps = (value: unknown, timestamps: string[] = []): string[] => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectContentTimestamps(item, timestamps));
    return timestamps;
  }
  if (!isRecord(value)) return timestamps;
  for (const [key, item] of Object.entries(value)) {
    if ((key === "updated_at" || key === "published_at") && typeof item === "string" && item) timestamps.push(item);
    else if (Array.isArray(item) || isRecord(item)) collectContentTimestamps(item, timestamps);
  }
  return timestamps;
};

const hashContentVersion = (values: unknown[]) => {
  const input = values.map((value) => (typeof value === "string" ? value : JSON.stringify(value))).join("|");
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const localizedField = (row: PublicDataRow, base: string, lang: "en" | "zh") => {
  const preferred = readString(row, `${base}_${lang}`);
  if (preferred) return preferred;
  return readString(row, `${base}_${lang === "zh" ? "en" : "zh"}`);
};

const absolutePublicUrl = (value: string) => {
  if (!value) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(value)) return value;
  return `${PUBLIC_SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const buildDynamicSeoEntry = (
  key: string,
  row: PublicDataRow,
  kind: DynamicRouteKind,
  fallback?: SeoEntry,
): SeoEntry => {
  const lang: "en" | "zh" = key.startsWith("/zh") ? "zh" : "en";
  const alternateLang = lang === "zh" ? "en" : "zh";
  const rawTitle =
    localizedField(row, "seo_title", lang) ||
    localizedField(row, "title", lang) ||
    readString(row, "area_name") ||
    fallback?.title ||
    "FLASH CAST";
  const rawDescription =
    localizedField(row, "seo_description", lang) ||
    localizedField(row, "description", lang) ||
    localizedField(row, "excerpt", lang) ||
    localizedField(row, "content", lang) ||
    fallback?.description ||
    rawTitle;
  const title = /flash cast/i.test(rawTitle) ? rawTitle : `${rawTitle} | FLASH CAST`;
  const canonicalPath = key === "/" ? "/en" : key;
  const pathWithoutLanguage = canonicalPath.replace(/^\/(?:en|zh)/, "") || "/";
  const enPath = pathWithoutLanguage === "/" ? "/en" : `/en${pathWithoutLanguage}`;
  const zhPath = pathWithoutLanguage === "/" ? "/zh" : `/zh${pathWithoutLanguage}`;
  const keywordValue = localizedField(row, "seo_keywords", lang) || readString(row, "category");
  const tags = Array.isArray(row.tags) ? row.tags.map((item) => String(item)).filter(Boolean) : [];
  const faqRows = readRecordArray(row[`faqs_${lang}`]);
  const faqs = faqRows
    .map((faq) => ({
      question: readString(faq, "q") || readString(faq, "question"),
      answer: readString(faq, "a") || readString(faq, "answer"),
    }))
    .filter((faq) => faq.question && faq.answer);
  const imageUrl =
    readString(row, "cover_image_url") ||
    readString(row, "hero_image_url") ||
    readString(row, "image_url") ||
    fallback?.ogImage ||
    DEFAULT_OG_IMAGE;

  return {
    lang,
    path: pathWithoutLanguage,
    title: sanitizePublicDraftMarkers(stripMarkup(title)).slice(0, 180),
    description: sanitizePublicDraftMarkers(stripMarkup(rawDescription)).slice(0, 300),
    keywords: tags.length ? tags.join(", ") : keywordValue || fallback?.keywords,
    faqs: faqs.length ? faqs : fallback?.faqs,
    canonical: `${PUBLIC_SITE_URL}${canonicalPath}`,
    hreflang: {
      en: `${PUBLIC_SITE_URL}${enPath}`,
      zh: `${PUBLIC_SITE_URL}${zhPath}`,
      xDefault: `${PUBLIC_SITE_URL}${enPath}`,
    },
    ogImage: absolutePublicUrl(imageUrl),
    schemaType: kind === "blog" ? "BlogPosting" : fallback?.schemaType,
    headline: kind === "blog" ? localizedField(row, "title", lang) || rawTitle : fallback?.headline,
    datePublished: kind === "blog" ? readString(row, "published_at") || readString(row, "created_at") : fallback?.datePublished,
    dateModified: readString(row, "updated_at") || fallback?.dateModified,
    articleSection: kind === "blog" ? readString(row, "category") || undefined : fallback?.articleSection,
    imageAlt: localizedField(row, "alt", lang) || localizedField(row, "title", alternateLang) || fallback?.imageAlt,
  };
};

const dynamicCollectionTableByPath: Record<string, string> = {
  "/services": "services",
  "/projects": "projects",
  "/materials": "materials",
  "/products": "materials",
  "/blog": "blog_posts",
  "/locations": "service_areas",
};

const fetchDynamicRouteState = async (
  env: Record<string, string | undefined>,
  key: string,
  fallback?: SeoEntry,
): Promise<DynamicRouteState | null> => {
  const match = key.match(/^\/(en|zh)(\/.*)?$/);
  if (!match) return null;
  const path = match[2] || "/";
  const routePatterns: Array<{ pattern: RegExp; table: string; kind: DynamicRouteKind; select?: string }> = [
    { pattern: /^\/services\/([^/]+)$/, table: "services", kind: "service" },
    { pattern: /^\/projects\/([^/]+)$/, table: "projects", kind: "project", select: "*,project_images(*)" },
    { pattern: /^\/(?:materials|products)\/([^/]+)$/, table: "materials", kind: "material" },
    { pattern: /^\/blog\/([^/]+)$/, table: "blog_posts", kind: "blog" },
    { pattern: /^\/locations\/([^/]+)$/, table: "service_areas", kind: "service_area" },
    { pattern: /^\/landing\/([^/]+)$/, table: "landing_pages", kind: "landing_page" },
  ];

  for (const route of routePatterns) {
    const routeMatch = path.match(route.pattern);
    if (!routeMatch?.[1]) continue;
    const slug = decodeURIComponent(routeMatch[1]);
    const rows = await fetchFreshPublicRows(env, route.table, (url) => {
      url.searchParams.set("select", route.select || "*");
      url.searchParams.set("status", "eq.published");
      url.searchParams.set("slug", `eq.${slug}`);
      url.searchParams.set("limit", "1");
    });
    const row = rows?.[0];
    if (!row) return null;
    const contentVersion = hashContentVersion([...collectContentTimestamps(row), row.id, row.slug]);
    return { kind: route.kind, row, meta: buildDynamicSeoEntry(key, row, route.kind, fallback), contentVersion };
  }

  if (path === "/") {
    const bundle = await fetchHomeContentBundle(env);
    const sitePage = readRecordArray(bundle?.site_pages)[0];
    if (!bundle || !sitePage) return null;
    return {
      kind: "site_page",
      row: sitePage,
      meta: buildDynamicSeoEntry(key, sitePage, "site_page", fallback),
      contentVersion: hashContentVersion(collectContentTimestamps(bundle).length ? collectContentTimestamps(bundle) : [bundle]),
    };
  }

  const [sitePageRows, cmsPageRows] = await Promise.all([
    fetchFreshPublicRows(env, "site_pages", (url) => {
      url.searchParams.set("select", "*");
      url.searchParams.set("status", "eq.published");
      url.searchParams.set("path", `eq.${path}`);
      url.searchParams.set("limit", "1");
    }),
    fetchFreshPublicRows(env, "cms_pages", (url) => {
      url.searchParams.set("select", "*,cms_sections(*)");
      url.searchParams.set("status", "eq.published");
      url.searchParams.set("deleted_at", "is.null");
      url.searchParams.set("path", `eq.${path}`);
      url.searchParams.set("limit", "1");
    }),
  ]);
  const row = sitePageRows?.[0] || cmsPageRows?.[0];
  const collectionTable = dynamicCollectionTableByPath[path];
  if (!row && collectionTable && fallback) {
    const latestRows = await fetchFreshPublicRows(env, collectionTable, (url) => {
      url.searchParams.set("select", "id,updated_at");
      url.searchParams.set("status", "eq.published");
      url.searchParams.set("order", "updated_at.desc");
      url.searchParams.set("limit", "1");
    });
    const latest = latestRows?.[0];
    if (latest) {
      return {
        kind: "site_page",
        row: latest,
        meta: fallback,
        contentVersion: hashContentVersion([latest.id, latest.updated_at]),
      };
    }
  }
  if (!row) return null;
  const kind: DynamicRouteKind = sitePageRows?.[0] ? "site_page" : "cms_page";
  const versionParts: unknown[] = [...collectContentTimestamps(row), row.id, row.path];
  if (collectionTable) {
    const latestRows = await fetchFreshPublicRows(env, collectionTable, (url) => {
      url.searchParams.set("select", "updated_at");
      url.searchParams.set("status", "eq.published");
      url.searchParams.set("order", "updated_at.desc");
      url.searchParams.set("limit", "1");
    });
    if (latestRows?.[0]?.updated_at) versionParts.push(latestRows[0].updated_at);
  }
  return { kind, row, meta: buildDynamicSeoEntry(key, row, kind, fallback), contentVersion: hashContentVersion(versionParts) };
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

const fetchPublicMaterialDetail = async (
  env: Record<string, string | undefined>,
  slug: string,
  preloadedRow?: PublicDataRow | null,
) => {
  const material = preloadedRow || (await fetchFreshPublicRows(env, "materials", (url) => {
    url.searchParams.set("select", "*");
    url.searchParams.set("status", "eq.published");
    url.searchParams.set("slug", `eq.${slug}`);
    url.searchParams.set("limit", "1");
  }))?.[0];
  if (!material || !Object.prototype.hasOwnProperty.call(material, "price_mode")) return material || null;

  const gallery = await fetchPublicRows(env, `material_gallery:${material.id}`, "material_images", (url) => {
    url.searchParams.set("select", "*");
    url.searchParams.set("material_id", `eq.${material.id}`);
    url.searchParams.set("is_active", "eq.true");
    url.searchParams.set("order", "sort_order.asc");
  });
  return { ...material, material_images: gallery || [] };
};

const fetchPublicServiceAreas = async (env: Record<string, string | undefined>) =>
  fetchPublicRows(env, "service_areas", "service_areas", (url) => {
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
  return pageKey === "services" || pageKey === "materials" || pageKey === "products" || pageKey === "promotions" || pageKey === "locations" || pageKey === "blog" || pageKey === "projects" ? pageKey : null;
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
    path === "/products" ||
    path === "/promotions" ||
    path === "/locations" ||
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

const getProductDetailSlugFromKey = (key: string) => {
  const match = key.match(/^\/(?:en|zh)\/(?:materials|products)\/([^/]+)$/);
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
  "/en/blog/renovation-cost-malaysia-2025": "/en/blog/malaysia-renovation-budget-guide",
  "/zh/blog/renovation-cost-malaysia-2025": "/zh/blog/malaysia-renovation-budget-guide",
  "/en/blog/renovation-materials-for-malaysia-climate": "/en/blog/renovation-materials-malaysia",
  "/zh/blog/renovation-materials-for-malaysia-climate": "/zh/blog/renovation-materials-malaysia",
  "/en/blog/spc-vs-vinyl-flooring-malaysia": "/en/blog/spc-vinyl-vs-laminate-flooring",
  "/zh/blog/spc-vs-vinyl-flooring-malaysia": "/zh/blog/spc-vinyl-vs-laminate-flooring",
  "/en/blog/office-fit-out-checklist-selangor": "/en/blog/office-renovation-checklist-malaysia",
  "/zh/blog/office-fit-out-checklist-selangor": "/zh/blog/office-renovation-checklist-malaysia",
  "/en/blog/shop-renovation-opening-timeline-malaysia": "/en/blog/shop-renovation-before-opening",
  "/zh/blog/shop-renovation-opening-timeline-malaysia": "/zh/blog/shop-renovation-before-opening",
  "/en/blog/kl-condo-renovation-approval": "/en/blog/condo-renovation-management-approval-malaysia",
  "/zh/blog/kl-condo-renovation-approval": "/zh/blog/condo-renovation-management-approval-malaysia",
};

const permanentRedirect = (to: URL) =>
  new Response(null, {
    status: 301,
    headers: {
      Location: to.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });

const languageRedirect = (to: URL) =>
  new Response(null, {
    status: 302,
    headers: {
      Location: to.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Cloudflare-CDN-Cache-Control": "no-store",
      Vary: "Accept-Language, Cookie",
    },
  });

const isLanguagePrefixedPath = (pathname: string) => /^\/(en|zh)(?:\/|$)/.test(pathname);

const getUnprefixedPublicPath = (pathname: string) => {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  if (cleaned === "/") {
    return "/";
  }

  if (isLanguagePrefixedPath(cleaned) || cleaned === "/admin" || cleaned.startsWith("/admin/")) {
    return null;
  }

  const englishPath = `/en${cleaned}`;
  return (manifest as Record<string, SeoEntry>)[englishPath] ? cleaned : null;
};

const getRequestLanguage = (request: Request) =>
  resolvePreferredLanguage({
    savedLanguage: readCookieValue(request.headers.get("cookie"), PUBLIC_LANGUAGE_COOKIE),
    acceptLanguage: request.headers.get("accept-language"),
  });

const getExactLegacyRedirectPath = (pathname: string) => {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  return EXACT_LEGACY_REDIRECTS[cleaned] || null;
};

const LANDING_TO_SERVICE_SLUGS: Record<string, string> = {
  "office-renovation": "office-renovation",
  "shop-renovation": "shop-renovation",
  "bathroom-renovation": "bathroom",
  "old-house-renovation": "old-house",
  "custom-built-in": "builtin",
  "warehouse-shelving": "warehouse",
  "kitchen-cabinet": "kitchen",
  "flooring": "flooring",
};

const getLandingToServiceRedirectPath = (pathname: string) => {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  const match = cleaned.match(/^\/(en|zh)\/landing\/([^/]+)$/);
  const serviceSlug = match?.[2] ? LANDING_TO_SERVICE_SLUGS[match[2]] : null;
  return match && serviceSlug ? `/${match[1]}/services/${serviceSlug}` : null;
};

const injectSeo = (html: string, meta: SeoEntry, siteSettings?: SiteSettingsHead | null) => {
  const safeMeta = {
    ...meta,
    title: sanitizePublicDraftMarkers(meta.title),
    description: sanitizePublicDraftMarkers(meta.description),
  };
  const title = escapeHtml(safeMeta.title);
  const description = escapeHtml(safeMeta.description);
  const canonical = escapeHtml(meta.canonical);
  const siteName = escapeHtml(siteSettings?.company_name || siteSettings?.brand_name || "FLASH CAST SDN. BHD.");
  const version = siteSettings?.updated_at || undefined;
  const { favicon, touchIcon } = resolveHeadIcons(siteSettings);
  const defaultOgImage = siteSettings?.og_image_url || normalizeBuiltInLogoUrl(siteSettings?.logo_url, new URL(canonical).origin) || meta.ogImage;
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
  out = injectEdgeStructuredData(out, safeMeta, siteSettings);
  out = injectGeoSummary(out, safeMeta);

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
  "/offline",
  "/offline.html",
]);

const isAssetPath = (pathname: string) =>
  STATIC_FILE_PATHS.has(pathname) ||
  STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  (/\.[a-z0-9]+$/i.test(pathname) && !pathname.endsWith(".html"));

const fetchLiveSitemapXml = async (env: PagesEnv) => {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl) return "";
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/sitemap`, {
      headers: supabaseAnonKey
        ? { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }
        : undefined,
    });
    return response.ok ? await response.text() : "";
  } catch {
    return "";
  }
};

const mergeSitemapXml = (staticXml: string, dynamicXml: string) => {
  const blocks = [...staticXml.matchAll(/<url>\s*[\s\S]*?<\/url>/gi), ...dynamicXml.matchAll(/<url>\s*[\s\S]*?<\/url>/gi)];
  if (!blocks.length) return staticXml || dynamicXml;
  const byLocation = new Map<string, string>();
  for (const match of blocks) {
    const block = match[0].trim();
    const location = block.match(/<loc>([^<]+)<\/loc>/i)?.[1]?.trim();
    if (!location) continue;
    try {
      if (EXACT_LEGACY_REDIRECTS[new URL(location).pathname]) continue;
    } catch {
      continue;
    }
    if (!byLocation.has(location)) byLocation.set(location, block);
  }
  const body = Array.from(byLocation.values()).sort((a, b) => {
    const left = a.match(/<loc>([^<]+)<\/loc>/i)?.[1] || "";
    const right = b.match(/<loc>([^<]+)<\/loc>/i)?.[1] || "";
    return left.localeCompare(right);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body.join("\n")}\n</urlset>\n`;
};

const sitemapCanonicalUrls = (xml: string) =>
  Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi), (match) => match[1].trim())
    .filter((url) => url.startsWith(`${PUBLIC_SITE_URL}/`))
    .sort((a, b) => a.localeCompare(b));

const replaceLlmsCanonicalUrls = (source: string, urls: string[]) => {
  if (!source || !urls.length) return source;
  const section = `## Canonical URL List\n${urls.map((url) => `- ${url}`).join("\n")}\n`;
  if (/## Canonical URL List[\s\S]*?(?=\n## Notes For AI Assistants)/.test(source)) {
    return source.replace(/## Canonical URL List[\s\S]*?(?=\n## Notes For AI Assistants)/, section.trimEnd());
  }
  return `${source.trimEnd()}\n\n${section}`;
};

const dynamicAssetHeaders = (contentType: string) => ({
  "content-type": contentType,
  "cache-control": "public, max-age=60, stale-while-revalidate=300",
  "cdn-cache-control": "public, max-age=60",
  "cloudflare-cdn-cache-control": "public, max-age=60",
  "cache-tag": PUBLIC_HTML_CACHE_TAG,
  "x-content-type-options": "nosniff",
});

const serveDynamicSeoAsset = async (
  pathname: "/sitemap.xml" | "/llms.txt",
  request: Request,
  env: PagesEnv,
  loadStatic: () => Promise<Response>,
) => {
  const [staticResponse, dynamicXml] = await Promise.all([loadStatic(), fetchLiveSitemapXml(env)]);
  const staticText = staticResponse.ok ? await staticResponse.text() : "";
  if (pathname === "/sitemap.xml") {
    const xml = mergeSitemapXml(staticText, dynamicXml);
    return new Response(request.method === "HEAD" ? null : xml, {
      status: xml ? 200 : staticResponse.status,
      headers: dynamicAssetHeaders("application/xml; charset=utf-8"),
    });
  }

  const staticSitemapResponse = env.ASSETS
    ? await env.ASSETS.fetch(new Request(new URL("/sitemap.xml", request.url).toString(), request))
    : null;
  const staticSitemapXml = staticSitemapResponse?.ok ? await staticSitemapResponse.text() : "";
  const mergedSitemap = mergeSitemapXml(staticSitemapXml, dynamicXml);
  const llms = replaceLlmsCanonicalUrls(staticText, sitemapCanonicalUrls(mergedSitemap));
  return new Response(request.method === "HEAD" ? null : llms, {
    status: llms ? 200 : staticResponse.status,
    headers: dynamicAssetHeaders("text/plain; charset=utf-8"),
  });
};

const applyHtmlNoStoreHeaders = (headers: Headers) => {
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("cdn-cache-control", "no-store");
  headers.set("cloudflare-cdn-cache-control", "no-store");
  headers.set("pragma", "no-cache");
  headers.set("expires", "0");
};

const applyPublicHtmlEdgeCacheHeaders = (headers: Headers) => {
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

const createHtmlEtag = async (html: string) => {
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

const createPublicHtmlBrowserResponse = (
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

const getPublicHtmlDeploymentVersion = (env: PagesEnv) => {
  const version = env.CF_PAGES_COMMIT_SHA || env.CF_PAGES_URL;
  return typeof version === "string" && version.trim() ? version.trim().slice(0, 128) : "local";
};

const servePublicVersion = async (request: Request, env: PagesEnv) => {
  const siteSettings = await fetchSiteSettings(env as Record<string, string | undefined>);
  const payload = JSON.stringify({
    deploymentVersion: getPublicHtmlDeploymentVersion(env),
    contentVersion: String(siteSettings?.updated_at || "unknown").slice(0, 128),
  });

  return new Response(request.method === "HEAD" ? null : payload, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      "cdn-cache-control": "no-store",
      "cloudflare-cdn-cache-control": "no-store",
      pragma: "no-cache",
      expires: "0",
      "x-content-type-options": "nosniff",
    },
  });
};

const getPublicHtmlCacheRequest = (
  request: Request,
  env: PagesEnv,
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

const getPublicHtmlFreshnessRequest = (publicHtmlCacheRequest: Request) => {
  const cacheUrl = new URL(publicHtmlCacheRequest.url);
  cacheUrl.searchParams.set("__flashcast_html_fresh", "1");
  return new Request(cacheUrl.toString(), { method: "GET" });
};

const createPublicHtmlFreshnessResponse = () => new Response(null, {
  headers: {
    "cache-control": `public, max-age=${PUBLIC_HTML_FRESHNESS_TTL_SECONDS}`,
    "cdn-cache-control": `public, max-age=${PUBLIC_HTML_FRESHNESS_TTL_SECONDS}`,
    "cloudflare-cdn-cache-control": `public, max-age=${PUBLIC_HTML_FRESHNESS_TTL_SECONDS}`,
    "cache-tag": PUBLIC_HTML_CACHE_TAG,
  },
});

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
    return permanentRedirect(url);
  }

  const exactLegacyRedirectPath = getExactLegacyRedirectPath(url.pathname);
  if (exactLegacyRedirectPath) {
    url.pathname = exactLegacyRedirectPath;
    return permanentRedirect(url);
  }

  const landingToServiceRedirectPath = getLandingToServiceRedirectPath(url.pathname);
  if (landingToServiceRedirectPath) {
    url.pathname = landingToServiceRedirectPath;
    return permanentRedirect(url);
  }

  if (url.pathname === BAIDU_VERIFY_PATH) {
    return new Response(BAIDU_VERIFY_HTML, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  }

  if (url.pathname === PUBLIC_VERSION_PATH) {
    return servePublicVersion(request, env);
  }

  if (url.pathname === "/sitemap.xml" || url.pathname === "/llms.txt") {
    return serveDynamicSeoAsset(
      url.pathname,
      request,
      env,
      () => (env.ASSETS ? env.ASSETS.fetch(request) : next()),
    );
  }

  if (isAssetPath(url.pathname)) {
    return next();
  }

  const unprefixedPublicPath = getUnprefixedPublicPath(url.pathname);
  if (unprefixedPublicPath) {
    const language = getRequestLanguage(request);
    url.pathname = unprefixedPublicPath === "/" ? `/${language}` : `/${language}${unprefixedPublicPath}`;
    return languageRedirect(url);
  }

  const key = normalizePath(url.pathname);
  const staticMeta = (manifest as Record<string, SeoEntry>)[key];
  const isPublicLanguagePath = /^\/(?:en|zh)(?:\/|$)/.test(key);
  const edgeCache = request.method === "GET" && isPublicLanguagePath ? getEdgeCache() : null;
  const prefetchedSiteSettings = edgeCache
    ? await fetchSiteSettings(env as Record<string, string | undefined>)
    : undefined;
  const publicHtmlCacheRequest = edgeCache
    ? getPublicHtmlCacheRequest(request, env, prefetchedSiteSettings?.updated_at)
    : null;
  const publicHtmlFreshnessRequest = publicHtmlCacheRequest
    ? getPublicHtmlFreshnessRequest(publicHtmlCacheRequest)
    : null;

  const generatePublicHtml = async (existingLastModified?: string | null) => {
    const dynamicRouteState = await fetchDynamicRouteState(env as Record<string, string | undefined>, key, staticMeta);
    const meta = dynamicRouteState?.meta || staticMeta;

  const appShellUrl = new URL(request.url);
  appShellUrl.pathname = "/";
  appShellUrl.search = "";
  const response = env.ASSETS
    ? await env.ASSETS.fetch(new Request(appShellUrl.toString(), request))
    : await next("/");
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return { response, cacheWrite: null };
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
	    return {
        response: withHtmlCacheDebugHeader(new Response(transformed, { status: response.status, headers }), "bypass-admin"),
        cacheWrite: null,
      };
	  }

  const projectDetailSlug = getProjectDetailSlugFromKey(key);
  const productDetailSlug = getProductDetailSlugFromKey(key);
  const topLevelPublicPageKey = getTopLevelPublicPageKey(key);
  const shouldInjectHomeBundle = Boolean(meta && isHomePageKey(key));
  const shouldInjectProjectSummaries = Boolean(meta && (key === "/en/projects" || key === "/zh/projects" || projectDetailSlug));
  const shouldInjectPublicPageBundle = Boolean(meta && topLevelPublicPageKey);
  const shouldInjectServices = topLevelPublicPageKey === "services";
  const shouldInjectMaterials = topLevelPublicPageKey === "materials" || topLevelPublicPageKey === "products" || Boolean(productDetailSlug);
  const shouldInjectServiceAreas = topLevelPublicPageKey === "locations";
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
    materialDetail,
    serviceAreas,
    blogPosts,
    footerCtaBlock,
  ] = await Promise.all([
    prefetchedSiteSettings !== undefined
      ? Promise.resolve(prefetchedSiteSettings)
      : fetchSiteSettings(env as Record<string, string | undefined>),
    shouldInjectHomeBundle ? fetchHomeContentBundle(env as Record<string, string | undefined>) : Promise.resolve(null),
    shouldInjectProjectSummaries ? fetchProjectSummaries(env as Record<string, string | undefined>) : Promise.resolve(null),
    projectDetailSlug
      ? dynamicRouteState?.kind === "project"
        ? Promise.resolve(dynamicRouteState.row)
        : fetchProjectDetailBySlug(env as Record<string, string | undefined>, projectDetailSlug)
      : Promise.resolve(null),
    shouldInjectPublicPageBundle && topLevelPublicPageKey
      ? fetchPublicSitePageBundle(env as Record<string, string | undefined>, topLevelPublicPageKey)
      : Promise.resolve(null),
    shouldInjectServices ? fetchPublicServices(env as Record<string, string | undefined>) : Promise.resolve(null),
    shouldInjectMaterials ? fetchPublicMaterials(env as Record<string, string | undefined>) : Promise.resolve(null),
    productDetailSlug
      ? fetchPublicMaterialDetail(
          env as Record<string, string | undefined>,
          productDetailSlug,
          dynamicRouteState?.kind === "material" ? dynamicRouteState.row : null,
        )
      : Promise.resolve(null),
    shouldInjectServiceAreas ? fetchPublicServiceAreas(env as Record<string, string | undefined>) : Promise.resolve(null),
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
    publicDataPayload.homeContentBundle = projectHomeContentBundleForPreload(homeContentBundle);
  }
  if (shouldInjectProjectSummaries && projectSummaries?.length) {
    publicDataPayload.projectSummaries = projectProjectSummariesForPreload(projectSummaries);
  }
  if (projectDetailSlug && projectDetail) {
    publicDataPayload.projectDetails = {
      [projectDetailSlug]: projectDetail,
    };
  }
  if (shouldInjectPublicPageBundle && topLevelPublicPageKey) {
    publicDataPayload.sitePages = {
      [topLevelPublicPageKey]: publicPageBundle ? projectSitePageBundleForPreload(publicPageBundle) : {},
    };
  }
  if (services?.length) {
    publicDataPayload.services = projectServiceSummariesForPreload(services);
  }
  if (materials?.length || materialDetail) {
    const materialRows = materials?.length ? [...materials] : [];
    if (materialDetail) {
      const existingIndex = materialRows.findIndex((row) => String(row.slug || "") === productDetailSlug);
      if (existingIndex >= 0) materialRows[existingIndex] = materialDetail;
      else materialRows.push(materialDetail);
    }
    publicDataPayload.materials = projectMaterialsForPreload(materialRows, productDetailSlug);
  }
  if (serviceAreas?.length) {
    publicDataPayload.serviceAreas = projectServiceAreaSummariesForPreload(serviceAreas);
  }
  if (blogPosts?.length) {
    publicDataPayload.blogPosts = projectBlogPostSummariesForPreload(blogPosts);
  }
  if (footerCtaBlock) {
    publicDataPayload.ctaBlocks = {
      home_final: projectCtaBlockForPreload(footerCtaBlock),
    };
  }
  if (Object.keys(publicDataPayload).length) {
    transformed = injectPublicData(transformed, publicDataPayload);
  }
  transformed = injectDynamicImagePreloads(
    transformed,
    getDynamicImagePreloads(key, projectSummaries, homeContentBundle),
  );
  transformed = injectPerformanceHints(
    transformed,
    env as Record<string, string | undefined>,
  );
  const headers = new Headers(response.headers);
  if (meta) {
    applyPublicHtmlEdgeCacheHeaders(headers);
    headers.set("etag", await createHtmlEtag(transformed));
    headers.set("last-modified", existingLastModified || new Date().toUTCString());
  } else {
    applyHtmlNoStoreHeaders(headers);
  }
  await applyHtmlSecurityHeaders(headers, transformed);

  const generatedResponse = new Response(transformed, { status: meta ? response.status : 404, headers });
  const finalResponse = meta
    ? createPublicHtmlBrowserResponse(generatedResponse.clone(), request, "miss")
    : withHtmlCacheDebugHeader(generatedResponse, "bypass-not-found");
  const cacheWrite = meta && edgeCache && publicHtmlCacheRequest && publicHtmlFreshnessRequest
    ? Promise.all([
        edgeCache.put(publicHtmlCacheRequest, generatedResponse.clone()),
        edgeCache.put(publicHtmlFreshnessRequest, createPublicHtmlFreshnessResponse()),
      ]).then(() => undefined).catch(() => undefined)
    : null;

  return { response: finalResponse, cacheWrite };
  };

  if (edgeCache && publicHtmlCacheRequest && publicHtmlFreshnessRequest) {
    const [cachedPublicHtml, freshnessMarker] = await Promise.all([
      edgeCache.match(publicHtmlCacheRequest),
      edgeCache.match(publicHtmlFreshnessRequest),
    ]);
    if (cachedPublicHtml) {
      if (!freshnessMarker) {
        const refreshKey = publicHtmlCacheRequest.url;
        let refreshPromise = publicHtmlRefreshes.get(refreshKey);
        if (!refreshPromise) {
          refreshPromise = generatePublicHtml(cachedPublicHtml.headers.get("last-modified"))
            .then(async (generated) => {
              if (generated.cacheWrite) await generated.cacheWrite;
            })
            .catch(() => undefined)
            .finally(() => {
              publicHtmlRefreshes.delete(refreshKey);
            });
          publicHtmlRefreshes.set(refreshKey, refreshPromise);
        }

        const waitUntil = (context as unknown as { waitUntil?: (promise: Promise<unknown>) => void }).waitUntil;
        if (typeof waitUntil === "function") {
          waitUntil(refreshPromise);
        } else {
          await refreshPromise;
        }
      }

      return createPublicHtmlBrowserResponse(
        cachedPublicHtml,
        request,
        freshnessMarker ? "hit" : "stale",
      );
    }
  }

  const generated = await generatePublicHtml();
  if (generated.cacheWrite) {
    const waitUntil = (context as unknown as { waitUntil?: (promise: Promise<unknown>) => void }).waitUntil;
    if (typeof waitUntil === "function") {
      waitUntil(generated.cacheWrite);
    } else {
      await generated.cacheWrite;
    }
  }
  return generated.response;
};
