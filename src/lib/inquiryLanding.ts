import { isSupportedLanguage, type Language } from "@/i18n/languageDetection";
import { findServiceAreaRoute } from "./serviceAreaRoutes";

export type InquiryLanding = { page: string; language: Language };
const storageKey = "flashcast:inquiry-landing:v1";
const slug = "[a-z][a-z0-9-]*";
const publicPage = new RegExp(`^(?:about|custom-cabinets|promotions|before-after|process|faq|privacy|terms|(?:services|locations|landing|projects|blog|products|materials|furniture)(?:/${slug}){0,2})$`);
let firstLanding: InquiryLanding | null | undefined;

function serviceAreaPage(page: string) {
  const [section, area, service, extra] = page.split("/");
  return section === "locations" && !extra ? findServiceAreaRoute(area, service) : null;
}

function validated(page: unknown, language: unknown): InquiryLanding | null {
  if (typeof page !== "string" || page.length > 120 || typeof language !== "string" || !isSupportedLanguage(language)) return null;
  if (page !== "/" && !publicPage.test(page)) return null;
  if (page.startsWith("locations/") && page.split("/").length === 3 && !serviceAreaPage(page)) return null;
  return { page, language };
}

export function captureInquiryLanding(pathname: string, fallbackLanguage: Language) {
  if (firstLanding !== undefined || /^\/admin(?:\/|$)/.test(pathname)) return;
  try {
    const saved = window.sessionStorage.getItem(storageKey);
    if (saved !== null) {
      const entry = JSON.parse(saved);
      firstLanding = validated(entry?.page, entry?.language);
      return;
    }
  } catch { /* A blocked or corrupted store does not prevent enquiry submission. */ }

  const parts = pathname.split("/").filter(Boolean);
  const prefix = parts[0];
  const language = isSupportedLanguage(prefix) ? prefix : fallbackLanguage;
  if (isSupportedLanguage(prefix)) parts.shift();
  firstLanding = validated(parts.join("/") || "/", language);
  try { window.sessionStorage.setItem(storageKey, JSON.stringify(firstLanding)); }
  catch { /* Same-document navigation can still use the in-memory first page. */ }
}

export const currentInquiryLanding = () => firstLanding ?? null;

export function readInquiryLandingSource(params: URLSearchParams) {
  return validated(params.get("source_page"), params.get("source_lang"));
}

export function isDirectServiceAreaQuotePath(pathname: string) {
  const path = pathname.match(/^\/(en|zh|ms)\/(locations\/[^/]+\/[^/]+)\/?$/)?.[2];
  return Boolean(path && serviceAreaPage(path));
}

export function inquiryLandingKind(page: string) {
  if (page === "/") return "home";
  const [section, second] = page.split("/");
  if (section === "locations") return serviceAreaPage(page) ? "service" : second ? "location" : "locations";
  if (section === "services" && second) return "service";
  if (section === "projects" && second) return "project";
  if (section === "materials" && second) return "material";
  return section || "unknown";
}
