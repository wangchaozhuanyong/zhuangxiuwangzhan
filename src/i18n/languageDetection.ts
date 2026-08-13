export type Language = "en" | "zh";

const DEFAULT_LANGUAGE: Language = "en";
export const PUBLIC_LANGUAGE_COOKIE = "flashcast_lang";

export const isSupportedLanguage = (value?: string | null): value is Language =>
  value === "en" || value === "zh";

const normalizeLanguageTag = (value: string) => value.trim().toLowerCase().replace(/_/g, "-");

export const detectLanguageFromTags = (languageTags: readonly string[]): Language => {
  for (const tag of languageTags) {
    const normalized = normalizeLanguageTag(tag);
    if (normalized === "zh" || normalized.startsWith("zh-")) return "zh";
    if (normalized === "en" || normalized.startsWith("en-")) return "en";
  }

  return DEFAULT_LANGUAGE;
};

export const parseAcceptLanguage = (header?: string | null): string[] => {
  if (!header) return [];

  return header
    .split(",")
    .map((entry, index) => {
      const [rawTag, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().toLowerCase().startsWith("q="));
      const parsedQuality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      const quality = Number.isFinite(parsedQuality) ? Math.min(Math.max(parsedQuality, 0), 1) : 0;

      return { tag: rawTag?.trim() || "", quality, index };
    })
    .filter(({ tag, quality }) => Boolean(tag) && tag !== "*" && quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index)
    .map(({ tag }) => tag);
};

export const readCookieValue = (cookieHeader: string | null | undefined, name: string) => {
  if (!cookieHeader) return null;

  for (const entry of cookieHeader.split(";")) {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex === -1) continue;

    const rawName = entry.slice(0, separatorIndex).trim();
    if (rawName !== name) continue;

    const rawValue = entry.slice(separatorIndex + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
};

export const resolvePreferredLanguage = ({
  savedLanguage,
  acceptLanguage,
}: {
  savedLanguage?: string | null;
  acceptLanguage?: string | null;
}): Language => {
  if (isSupportedLanguage(savedLanguage)) return savedLanguage;
  return detectLanguageFromTags(parseAcceptLanguage(acceptLanguage));
};
