const env = import.meta.env;
const siteUrl = env.VITE_SITE_URL || "https://flashcast.com.my";

const normalizePhoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const normalizeWhatsAppNumber = (phone: string) => phone.replace(/[^\d]/g, "");

const phoneDisplay = env.VITE_SITE_PHONE_DISPLAY || "+60 11-2885 3888";
const phoneE164 = env.VITE_SITE_PHONE_E164 || "+601128853888";
const whatsappNumber = normalizeWhatsAppNumber(env.VITE_SITE_WHATSAPP_NUMBER || phoneE164);

export const siteConfig = {
  name: "FLASH CAST SDN. BHD.",
  ssmNumber: env.VITE_SITE_SSM_NUMBER || "202501027419 (1628831-M)",
  url: siteUrl,
  email: env.VITE_SITE_EMAIL || "support@flashcast.com.my",
  phoneDisplay,
  phoneHref: env.VITE_SITE_PHONE_HREF || normalizePhoneHref(phoneE164),
  phoneE164,
  whatsappNumber,
  address: env.VITE_SITE_ADDRESS || "94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia",
  shortAddress: env.VITE_SITE_SHORT_ADDRESS || "94, Jalan Mega Mendung, 58200",
  /** 办公室坐标（用于地图嵌入，避免每次按地址 geocode） */
  mapLatitude: env.VITE_SITE_MAP_LAT || "3.0830403",
  mapLongitude: env.VITE_SITE_MAP_LNG || "101.6708234",
  mapZoom: Number(env.VITE_SITE_MAP_ZOOM || 16),
  ogImage: `${siteUrl}/og-image.webp`,
  logoUrl: `${siteUrl}/logo-flashcast-20260605.webp`,
  socialLinks: {
    facebook: env.VITE_SOCIAL_FACEBOOK || "",
    instagram: env.VITE_SOCIAL_INSTAGRAM || "",
    tiktok: env.VITE_SOCIAL_TIKTOK || "",
    xiaohongshu: env.VITE_SOCIAL_XIAOHONGSHU || "",
    linkedin: env.VITE_SOCIAL_LINKEDIN || "",
  },
};

export type ConfirmedSocialPlatform = "facebook" | "instagram";

const ownerConfirmedSocialProfiles: Record<ConfirmedSocialPlatform, readonly string[]> = {
  // No social account has been confirmed by the owner yet.
  facebook: [],
  instagram: [],
};

const approvedSocialHosts: Record<ConfirmedSocialPlatform, ReadonlySet<string>> = {
  facebook: new Set(["facebook.com", "www.facebook.com"]),
  instagram: new Set(["instagram.com", "www.instagram.com"]),
};

export const safeSocialProfileUrl = (
  value: string | null | undefined,
  platform: ConfirmedSocialPlatform,
  confirmedProfiles: readonly string[] = ownerConfirmedSocialProfiles[platform],
): string => {
  if (!value || confirmedProfiles.length === 0) return "";
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.search
      || url.hash
      || !approvedSocialHosts[platform].has(url.hostname.toLowerCase())
    ) return "";

    const normalizedUrl = url.toString();
    const isOwnerConfirmed = confirmedProfiles.some((confirmedProfile) => {
      try {
        return new URL(confirmedProfile).toString() === normalizedUrl;
      } catch {
        return false;
      }
    });
    return isOwnerConfirmed ? normalizedUrl : "";
  } catch {
    return "";
  }
};

// Until the owner confirms exact account URLs, settings and build-time values
// must not be published as organization identity links.
export const socialProfileUrls: string[] = [];
