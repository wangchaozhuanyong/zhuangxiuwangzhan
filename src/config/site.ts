const env = import.meta.env;

const normalizePhoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const normalizeWhatsAppNumber = (phone: string) => phone.replace(/[^\d]/g, "");

const phoneDisplay = env.VITE_SITE_PHONE_DISPLAY || "+60 11-2885 3888";
const phoneE164 = env.VITE_SITE_PHONE_E164 || "+601128853888";
const whatsappNumber = normalizeWhatsAppNumber(env.VITE_SITE_WHATSAPP_NUMBER || phoneE164);

export const siteConfig = {
  name: "FLASH CAST SDN. BHD.",
  ssmNumber: env.VITE_SITE_SSM_NUMBER || "202501027419 (1628831-M)",
  url: env.VITE_SITE_URL || "https://flashcast.com.my",
  email: env.VITE_SITE_EMAIL || "info@flashcast.com.my",
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
  ogImage: `${env.VITE_SITE_URL || "https://flashcast.com.my"}/og-image.webp`,
  logoUrl: `${env.VITE_SITE_URL || "https://flashcast.com.my"}/logo-flashcast.png`,
  socialLinks: {
    facebook: env.VITE_SOCIAL_FACEBOOK || "",
    instagram: env.VITE_SOCIAL_INSTAGRAM || "",
    tiktok: env.VITE_SOCIAL_TIKTOK || "",
    xiaohongshu: env.VITE_SOCIAL_XIAOHONGSHU || "",
    linkedin: env.VITE_SOCIAL_LINKEDIN || "",
  },
};

export const socialProfileUrls = Object.values(siteConfig.socialLinks).filter(Boolean);
