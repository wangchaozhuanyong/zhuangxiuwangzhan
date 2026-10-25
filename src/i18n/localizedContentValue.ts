import type { Language } from "./languageDetection";

const isEmpty = (value: unknown) => value === undefined || value === null || typeof value === "string" && !value.trim()
  || Array.isArray(value) && value.length === 0
  || typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0;

export function localizedContentValue<T = unknown>(
  row: Record<string, unknown> | null | undefined,
  field: string,
  language: Language,
  fallback: T,
): T {
  const preferred = row?.[`${field}_${language}`];
  if (!isEmpty(preferred)) return preferred as T;
  if (language === "ms") {
    const english = row?.[`${field}_en`];
    if (!isEmpty(english)) return english as T;
  }
  return fallback;
}
