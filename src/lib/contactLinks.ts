import type { Language } from "@/i18n/routes";
import { formatInquirySources, inquirySourceText } from "@/i18n/inquirySourceText";
import { currentInquirySources } from "@/lib/inquirySource";

export function withInquiryWhatsAppHref(href: string, language: Language) {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return href;
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" || url.username || url.password
      || !(url.hostname === "wa.me" && /^\/\d+$/.test(url.pathname) || url.hostname === "api.whatsapp.com" && url.pathname === "/send")) return href;
    let message = url.searchParams.get("text") || "";
    for (const t of Object.values(inquirySourceText)) {
      const boundary = message.lastIndexOf(`\n\n${t.reference}: `);
      if (boundary >= 0 && !message.slice(boundary + 2).includes("\n")) message = message.slice(0, boundary);
    }
    const reference = formatInquirySources(currentInquirySources(), language);
    url.searchParams.set("text", message ? `${message}\n\n${reference}` : reference);
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
