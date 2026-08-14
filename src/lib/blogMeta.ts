type Language = "en" | "zh";

const defaultReadMinutes = 5;
const englishWordsPerMinute = 220;
const chineseCharactersPerMinute = 300;

const parseBlogDate = (value: string | null | undefined) => {
  if (!value) return null;

  const dateOnly = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatBlogDate = (value: string | null | undefined, language: Language) => {
  const date = parseBlogDate(value);
  if (!date) return "";

  if (language === "zh") {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kuala_Lumpur",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(date);
};

export const formatBlogReadTime = (value: string | number | null | undefined, language: Language) => {
  const minutes = typeof value === "number" ? value : Number(String(value || "").match(/\d+/)?.[0] || defaultReadMinutes);
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : defaultReadMinutes;

  return language === "zh" ? `${safeMinutes} \u5206\u949f\u9605\u8bfb` : `${safeMinutes} min read`;
};

export const estimateBlogReadMinutes = (value: string | null | undefined, language: Language) => {
  const text = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_>`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return defaultReadMinutes;

  if (language === "zh") {
    const chineseCharacters = text.match(/[\u3400-\u9fff\uf900-\ufaff]/g)?.length || 0;
    const latinWords = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length || 0;
    return Math.max(1, Math.ceil(chineseCharacters / chineseCharactersPerMinute + latinWords / englishWordsPerMinute));
  }

  const words = text.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu)?.length || 0;
  return Math.max(1, Math.ceil(words / englishWordsPerMinute));
};
