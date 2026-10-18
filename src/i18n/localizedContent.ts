import type { Language } from "./languageDetection";
import { hasCompleteMalayContent } from "../lib/publicContentQualification.mjs";

const isEmpty = (value: unknown) => value === undefined || value === null || typeof value === "string" && !value.trim()
  || Array.isArray(value) && value.length === 0
  || typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0;

export const isMalayContentReady = (value: object | null | undefined) =>
  (value as { translationComplete?: boolean } | null | undefined)?.translationComplete !== false;

/** Old records stay readable while Malay translations are added. Never copy fallback into CMS fields. */
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

/** SEO alternates require translated metadata and the actual primary body. */
export function hasMalayContent(row: Record<string, unknown> | null | undefined): boolean {
  return hasCompleteMalayContent(row);
}
