import type { Language } from "@/i18n/routes";
import { whatsappOpeningText } from "@/i18n/whatsappOpeningText";
import { currentInquirySources } from "@/lib/inquirySource";
import { siteConfig } from "@/config/site";

export type WhatsAppMessageOptions = {
  /** Only an explicitly authored/confirmed message may bypass the default opening. */
  mode?: "default" | "user-composed";
  businessNumber?: string;
};

export function withInquiryWhatsAppHref(href: string, language: Language, options: WhatsAppMessageOptions = {}) {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return href;
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" || url.username || url.password || url.port
      || !(url.hostname === "wa.me" && /^\/\d+$/.test(url.pathname) || url.hostname === "api.whatsapp.com" && /^\/send\/?$/.test(url.pathname))) return href;
    if (url.hostname === "api.whatsapp.com" && url.searchParams.getAll("phone").length !== 1) return href;
    const number = url.hostname === "wa.me" ? url.pathname.slice(1) : url.searchParams.get("phone") || "";
    const businessNumber = (options.businessNumber ?? siteConfig.whatsappNumber).replace(/[^\d]/g, "");
    // Do not rewrite customer/admin or unrelated third-party WhatsApp recipients.
    if (!businessNumber || number.replace(/[^\d]/g, "") !== businessNumber || options.mode === "user-composed") return href;
    url.searchParams.set("text", whatsappOpeningText(language, currentInquirySources().last));
    return url.toString();
  } catch { return href; }
}

const cleanPhone = (phone?: string | null) => String(phone || "").trim();

export const whatsappHrefFromPhone = (phone?: string | null) => {
  const digits = cleanPhone(phone).replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
};

export const telHrefFromPhone = (phone?: string | null) => {
  const value = cleanPhone(phone).replace(/[^\d+]/g, "");
  return value ? `tel:${value}` : "";
};
