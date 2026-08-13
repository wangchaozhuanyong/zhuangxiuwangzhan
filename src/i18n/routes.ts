import { readBrowserPreference, writeBrowserPreference } from "@/lib/browserPreference";
import {
  detectLanguageFromTags,
  isSupportedLanguage,
  PUBLIC_LANGUAGE_COOKIE,
  type Language,
} from "@/i18n/languageDetection";

export type { Language } from "@/i18n/languageDetection";

export const supportedLanguages: Language[] = ["en", "zh"];
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
