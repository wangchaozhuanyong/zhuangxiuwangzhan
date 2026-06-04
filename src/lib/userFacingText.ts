import type { Language } from "@/i18n/routes";

const fallbackErrorText: Record<Language, string> = {
  en: "The operation failed. Please try again later.",
  zh: "操作失败，请稍后再试。",
};

const permissionErrorText: Record<Language, string> = {
  en: "You do not have permission to perform this action.",
  zh: "当前账号没有这个操作权限。",
};

const duplicateErrorText: Record<Language, string> = {
  en: "A record with the same unique value already exists.",
  zh: "保存失败：唯一字段已经存在，请换一个。",
};

const invalidStatusErrorText: Record<Language, string> = {
  en: "The selected status is invalid. Please choose one of the available options.",
  zh: "保存失败：状态值不合法，请选择后台提供的状态。",
};

const unavailableErrorText: Record<Language, string> = {
  en: "The service is temporarily unavailable. Please try again later.",
  zh: "服务暂时不可用，请稍后再试。",
};

const unknownSourceText: Record<Language, string> = {
  en: "Unknown source",
  zh: "未知来源",
};

const sourceLabels: Record<string, Record<Language, string>> = {
  contact: { en: "Contact page", zh: "联系页" },
  quote: { en: "Quote page", zh: "报价页" },
  services: { en: "Services page", zh: "服务页" },
  service: { en: "Service page", zh: "服务详情页" },
  projects: { en: "Projects page", zh: "案例页" },
  project: { en: "Project page", zh: "案例详情页" },
  materials: { en: "Materials page", zh: "材料页" },
  material: { en: "Material page", zh: "材料详情页" },
  blog: { en: "Blog page", zh: "博客页" },
  home: { en: "Home page", zh: "首页" },
  old_house_renovation: { en: "Old house renovation page", zh: "老房翻新页" },
  unknown: unknownSourceText,
};
const fallbackSourceLabel = sourceLabels.unknown ?? unknownSourceText;

const CODE_LIKE_PATTERN = /^[a-z0-9]+(?:[_-][a-z0-9]+)+$/i;
const CJK_PATTERN = /[\u3400-\u9FFF]/;
const LATIN_WORD_PATTERN = /[A-Za-z]{3,}/;
const RAW_ERROR_PATTERN =
  /\b(?:error|exception|failed|denied|forbidden|unauthorized|supabase|postgrest|rls|jwt|token|stack|trace|policy|violates|relation|column|function|database|select|insert|update|delete)\b/i;

const getRawErrorText = (error: unknown) => {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as { message?: unknown; error?: unknown; reason?: unknown; code?: unknown };
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
    if (typeof record.reason === "string") return record.reason;
    if (typeof record.code === "string") return record.code;
  }
  return String(error || "");
};

export const isTechnicalFieldLeak = (value: string, language: Language = "zh") => {
  const text = value.trim();
  if (!text) return true;
  if (CODE_LIKE_PATTERN.test(text) || RAW_ERROR_PATTERN.test(text)) return true;
  if (language === "zh" && LATIN_WORD_PATTERN.test(text) && !CJK_PATTERN.test(text)) return true;
  if (language === "en" && CJK_PATTERN.test(text)) return true;
  return false;
};

export const formatUserFacingError = (
  error: unknown,
  language: Language = "zh",
  fallback = fallbackErrorText[language],
) => {
  const raw = getRawErrorText(error).trim();
  if (!raw) return fallback;
  const lower = raw.toLowerCase();
  const record = error as { code?: string };

  if (lower.includes("duplicate key") || record?.code === "23505") return duplicateErrorText[language];
  if (lower.includes("invalid input value for enum")) return invalidStatusErrorText[language];
  if (
    lower.includes("violates row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("permission_denied") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("jwt")
  ) {
    return permissionErrorText[language];
  }
  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("temporarily unavailable")) {
    return unavailableErrorText[language];
  }

  return isTechnicalFieldLeak(raw, language) ? fallback : raw;
};

const sourceLabel = (key: string, language: Language) =>
  sourceLabels[key]?.[language] || fallbackSourceLabel[language];

export const formatSourcePath = (value: string | null | undefined, language: Language = "zh") => {
  const raw = (value || "").trim();
  if (!raw) return "-";

  try {
    const url = new URL(raw, "https://flashcast.local");
    const pathParts = url.pathname.split("/").filter(Boolean);
    const withoutLang = pathParts[0] === "zh" || pathParts[0] === "en" ? pathParts.slice(1) : pathParts;
    const first = withoutLang[0] || "home";
    const sourceParam = url.searchParams.get("source");
    const titleParam = url.searchParams.get("title");
    const key =
      sourceParam === "service" || sourceParam === "project" || sourceParam === "material"
        ? sourceParam
        : first === "old-house-renovation"
          ? "old_house_renovation"
          : first;
    const label = sourceLabel(key, language);
    return titleParam ? `${label}：${titleParam}` : label;
  } catch {
    return unknownSourceText[language];
  }
};
