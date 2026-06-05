import { siteConfig } from "@/config/site";
import {
  fetchDefaultSiteSettingsRecord,
  hasSiteSettingsDatabaseClient,
  upsertDefaultSiteSettingsRecord,
} from "@/backend/modules/settings/repository/siteSettingsRepository";
import { readPreloadedPublicData } from "@/lib/publicPreload";
import { toRecord } from "@/lib/recordUtils";

export type SiteSettings = {
  updated_at?: string;
  company_name: string;
  brand_name: string;
  ssm_number: string;
  email: string;
  phone_display: string;
  phone_e164: string;
  whatsapp_number: string;
  address_zh: string;
  address_en: string;
  short_address_zh: string;
  short_address_en: string;
  map_latitude: string;
  map_longitude: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  xiaohongshu_url: string;
  linkedin_url: string;
  logo_url: string;
  favicon_url: string;
  og_image_url: string;
  default_seo_title_zh: string;
  default_seo_title_en: string;
  default_seo_description_zh: string;
  default_seo_description_en: string;
};

export const addCacheBuster = (url: string, version?: string) => {
  if (!url || !version) return url;

  try {
    const parsed = new URL(url, "https://example.com");
    parsed.searchParams.set("v", version);
    return url.startsWith("/") ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString();
  } catch {
    return url;
  }
};

export const DEFAULT_FAVICON_URL = "/favicon-20260604.png";
export const DEFAULT_TOUCH_ICON_URL = "/apple-touch-icon-20260604.png";
const DEFAULT_LOGO_PNG_PATH = "/logo-flashcast.png";
const DEFAULT_LOGO_WEBP_PATH = "/logo-flashcast.webp";
const DEFAULT_LOGO_VERSIONED_WEBP_PATH = "/logo-flashcast-20260605.webp";
const STATIC_SITE_HOSTS = new Set(["flashcast.com.my", "www.flashcast.com.my"]);

const getConfiguredSiteHost = () => {
  try {
    return new URL(siteConfig.url).hostname.toLowerCase();
  } catch {
    return "";
  }
};

export const normalizeBuiltInLogoUrl = (url: string) => {
  if (!url) return url;

  const trimmed = url.trim();
  const isRootRelative = trimmed.startsWith("/") && !trimmed.startsWith("//");

  try {
    const parsed = new URL(trimmed, siteConfig.url);
    const host = parsed.hostname.toLowerCase();
    const configuredSiteHost = getConfiguredSiteHost();
    const isKnownSiteLogo =
      isRootRelative ||
      STATIC_SITE_HOSTS.has(host) ||
      (configuredSiteHost ? host === configuredSiteHost : false);

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

export const resolveBrowserFaviconUrl = (
  settings: Partial<Pick<SiteSettings, "favicon_url" | "updated_at">> | null | undefined,
) => {
  const faviconUrl = settings?.favicon_url;
  const source = hasIconExtension(faviconUrl, ["ico", "png", "svg"]) ? faviconUrl || DEFAULT_FAVICON_URL : DEFAULT_FAVICON_URL;
  return addCacheBuster(source, settings?.updated_at);
};

export const resolveAppleTouchIconUrl = (
  settings: Partial<Pick<SiteSettings, "favicon_url" | "updated_at">> | null | undefined,
) => {
  const faviconUrl = settings?.favicon_url;
  const isCustomFavicon = Boolean(faviconUrl && faviconUrl !== DEFAULT_FAVICON_URL);
  const source = isCustomFavicon && hasIconExtension(faviconUrl, ["png"]) ? faviconUrl || DEFAULT_TOUCH_ICON_URL : DEFAULT_TOUCH_ICON_URL;
  return addCacheBuster(source, settings?.updated_at);
};

const normalizePhoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const normalizeWhatsAppNumber = (phone: string) => phone.replace(/[^\d]/g, "");

export const fallbackSiteSettings: SiteSettings = {
  company_name: siteConfig.name,
  brand_name: "FLASH CAST",
  ssm_number: siteConfig.ssmNumber,
  email: siteConfig.email,
  phone_display: siteConfig.phoneDisplay,
  phone_e164: siteConfig.phoneE164,
  whatsapp_number: siteConfig.whatsappNumber,
  address_zh: siteConfig.address,
  address_en: siteConfig.address,
  short_address_zh: siteConfig.shortAddress,
  short_address_en: siteConfig.shortAddress,
  map_latitude: siteConfig.mapLatitude,
  map_longitude: siteConfig.mapLongitude,
  facebook_url: siteConfig.socialLinks.facebook,
  instagram_url: siteConfig.socialLinks.instagram,
  tiktok_url: siteConfig.socialLinks.tiktok,
  xiaohongshu_url: siteConfig.socialLinks.xiaohongshu,
  linkedin_url: siteConfig.socialLinks.linkedin,
  logo_url: siteConfig.logoUrl,
  favicon_url: DEFAULT_FAVICON_URL,
  og_image_url: siteConfig.ogImage,
  default_seo_title_zh: "吉隆坡装修公司 | 住宅商业装修与定制家具 | FLASH CAST",
  default_seo_title_en: "Renovation Company Kuala Lumpur | FLASH CAST",
  default_seo_description_zh:
    "FLASH CAST 服务吉隆坡、雪兰莪与巴生谷，提供住宅装修、商业空间装修、厨房翻新、旧屋翻新、定制家具、材料建议与项目管理。",
  default_seo_description_en:
    "FLASH CAST provides renovation, interior design, custom built-in furniture, and commercial fit-out services in Kuala Lumpur and Selangor.",
};

export type ResolvedSiteSettings = SiteSettings & {
  phone_href: string;
  whatsapp_url: (message?: string) => string;
  address: string;
  short_address: string;
};

export const resolveSiteSettings = (
  settings: Partial<SiteSettings> | null | undefined,
  language: "en" | "zh" = "en",
): ResolvedSiteSettings => {
  const merged = { ...fallbackSiteSettings, ...(settings || {}) };
  const phoneE164 = merged.phone_e164 || normalizePhoneHref(merged.phone_display);
  const whatsappNumber = normalizeWhatsAppNumber(merged.whatsapp_number || phoneE164);
  const address = language === "zh" ? merged.address_zh || merged.address_en : merged.address_en || merged.address_zh;
  const shortAddress = language === "zh" ? merged.short_address_zh || merged.short_address_en : merged.short_address_en || merged.short_address_zh;
  const logoUrl = normalizeBuiltInLogoUrl(merged.logo_url);

  return {
    ...merged,
    logo_url: logoUrl,
    phone_href: normalizePhoneHref(phoneE164),
    whatsapp_url: (message?: string) => {
      const baseUrl = `https://wa.me/${whatsappNumber}`;
      return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
    },
    address,
    short_address: shortAddress,
  };
};

export const fetchSiteSettings = async () => {
  const preloadedSiteSettings = toRecord(readPreloadedPublicData()?.siteSettings);
  if (Object.keys(preloadedSiteSettings).length) {
    return { ...fallbackSiteSettings, ...preloadedSiteSettings } as SiteSettings;
  }

  if (!hasSiteSettingsDatabaseClient()) return fallbackSiteSettings;

  const data = await fetchDefaultSiteSettingsRecord();
  if (!data) return fallbackSiteSettings;
  return { ...fallbackSiteSettings, ...data } as SiteSettings;
};

export const saveSiteSettings = async (settings: SiteSettings) => {
  await upsertDefaultSiteSettingsRecord(settings);
};
