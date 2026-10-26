import type { Language } from "@/i18n/routes";
import { formatInquirySources } from "@/i18n/inquirySourceText";
import { readInquirySources } from "./inquirySourcePath";

import { sourceLabels, unknownSourceText } from "@/i18n/leadSourceText";

const fallbackSourceLabel = sourceLabels.unknown ?? unknownSourceText;

const sourceLabel = (key: string, language: Language) =>
  sourceLabels[key]?.[language] || fallbackSourceLabel[language];

export const formatSourcePath = (value: string | null | undefined, language: Language = "zh") => {
  const raw = (value || "").trim();
  const reference = formatInquirySources(readInquirySources(raw), language);
  if (!raw) return reference;

  try {
    const url = new URL(raw, "https://flashcast.local");
    const pathParts = url.pathname.split("/").filter(Boolean);
    const withoutLang = ["zh", "en", "ms"].includes(pathParts[0] ?? "") ? pathParts.slice(1) : pathParts;
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
    return `${reference} · ${titleParam ? `${label}：${titleParam}` : label}`;
  } catch {
    return `${reference} · ${unknownSourceText[language]}`;
  }
};
