import { readBrowserPreference, writeBrowserPreference } from "@/lib/browserPreference";
import {
  detectLanguageFromTags,
  isSupportedLanguage,
  PUBLIC_LANGUAGE_COOKIE, PUBLIC_LANGUAGE_DOMAIN, SHARED_LANGUAGE_COOKIE, sharesPublicLanguage,
  type Language,
} from "@/i18n/languageDetection";

export type { Language } from "@/i18n/languageDetection";

export const supportedLanguages: Language[] = ["en", "zh", "ms"];
const PUBLIC_LANG_KEY = "fc-lang";

let inMemoryLanguage: Language | null = null;

export const isLanguage = (value?: string | null): value is Language =>
  isSupportedLanguage(value);

export const getLanguageFromPath = (pathname = window.location.pathname): Language | null => {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLanguage(segment) ? segment : null;
};

export const getDefaultLanguage = (): Language => {
  if (isLanguage(inMemoryLanguage)) return inMemoryLanguage;

  if (sharesPublicLanguage(location.hostname)) {
    const shared = readBrowserPreference(SHARED_LANGUAGE_COOKIE, SHARED_LANGUAGE_COOKIE);
    if (isLanguage(shared)) return shared;
  }
  const saved = readBrowserPreference(PUBLIC_LANG_KEY, PUBLIC_LANGUAGE_COOKIE);
  if (isLanguage(saved)) return saved;

  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return detectLanguageFromTags(browserLanguages);
};

export const rememberLanguage = (language: Language) => {
  inMemoryLanguage = language;
  writeBrowserPreference(PUBLIC_LANG_KEY, language, PUBLIC_LANGUAGE_COOKIE);
  if (sharesPublicLanguage(location.hostname) && location.protocol === "https:") {
    try {
      document.cookie = `${SHARED_LANGUAGE_COOKIE}=${language}; Domain=${PUBLIC_LANGUAGE_DOMAIN}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`;
    } catch { /* The host preference and in-memory choice still work when cookies are blocked. */ }
  }
};

export const stripLanguagePrefix = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  if (isLanguage(parts[0])) parts.shift();
  return `/${parts.join("/")}`.replace(/\/$/, "") || "/";
};

export const withLanguagePrefix = (path: string, language: Language) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const strippedPath = stripLanguagePrefix(normalizedPath);
  return strippedPath === "/" ? `/${language}` : `/${language}${strippedPath}`;
};

export const switchLanguagePath = (pathname: string, nextLanguage: Language, search = "", hash = "") =>
  `${withLanguagePrefix(stripLanguagePrefix(pathname), nextLanguage)}${search}${hash}`;
