import { siteConfig } from "@/config/site";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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
  favicon_url: "/favicon-transparent-20260602.png",
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
  const whatsappNumber = merged.whatsapp_number || normalizeWhatsAppNumber(phoneE164);
  const address = language === "zh" ? merged.address_zh || merged.address_en : merged.address_en || merged.address_zh;
  const shortAddress = language === "zh" ? merged.short_address_zh || merged.short_address_en : merged.short_address_en || merged.short_address_zh;

  return {
    ...merged,
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
  if (!isSupabaseConfigured) return fallbackSiteSettings;

  const { data, error } = await supabase!
    .from("site_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) return fallbackSiteSettings;
  return { ...fallbackSiteSettings, ...data } as SiteSettings;
};

export const saveSiteSettings = async (settings: SiteSettings) => {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");

  const { error } = await supabase!
    .from("site_settings")
    .upsert({ id: "default", ...settings }, { onConflict: "id" });

  if (error) throw error;
};
