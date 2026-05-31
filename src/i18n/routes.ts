export type Language = "en" | "zh";

export const supportedLanguages: Language[] = ["en", "zh"];

export const isLanguage = (value?: string | null): value is Language =>
  value === "en" || value === "zh";

export const getLanguageFromPath = (pathname = window.location.pathname): Language | null => {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLanguage(segment) ? segment : null;
};

export const getDefaultLanguage = (): Language => {
  const saved = localStorage.getItem("fc-lang");
  if (isLanguage(saved)) return saved;

  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
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

export const switchLanguagePath = (pathname: string, nextLanguage: Language) =>
  withLanguagePrefix(stripLanguagePrefix(pathname), nextLanguage);
