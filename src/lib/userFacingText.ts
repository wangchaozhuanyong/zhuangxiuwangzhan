import type { Language } from "@/i18n/routes";

const fallbackErrorText: Record<Language, string> = {
  en: "The operation failed. Please try again later.",
  zh: "操作失败，请稍后再试。",

  ms: "Operasi gagal. Sila cuba lagi kemudian.",
};

const permissionErrorText: Record<Language, string> = {
  en: "You do not have permission to perform this action.",
  zh: "当前账号没有这个操作权限。",

  ms: "Anda tidak mempunyai kebenaran untuk melakukan tindakan ini.",
};

const duplicateErrorText: Record<Language, string> = {
  en: "A record with the same unique value already exists.",
  zh: "保存失败：唯一字段已经存在，请换一个。",

  ms: "Rekod dengan nilai unik yang sama sudah wujud.",
};

const invalidStatusErrorText: Record<Language, string> = {
  en: "The selected status is invalid. Please choose one of the available options.",
  zh: "保存失败：状态值不合法，请选择后台提供的状态。",

  ms: "Status yang dipilih adalah tidak sah. Sila pilih salah satu pilihan yang tersedia.",
};

const unavailableErrorText: Record<Language, string> = {
  en: "The service is temporarily unavailable. Please try again later.",
  zh: "服务暂时不可用，请稍后再试。",

  ms: "Perkhidmatan ini tidak tersedia buat sementara waktu. Sila cuba lagi kemudian.",
};

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
