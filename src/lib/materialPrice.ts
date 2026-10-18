import { malayFormat } from "@/i18n/malayText";
export type MaterialPriceMode = "range" | "from" | "specification" | "size" | "scope" | "none";
export type MaterialPriceUnit = "sqft" | "foot_run" | "unit" | "set" | "panel" | "scope" | "none";

export type MaterialPriceInput = {
  mode?: MaterialPriceMode | string | null;
  min?: number | string | null;
  max?: number | string | null;
  currency?: string | null;
  unit?: MaterialPriceUnit | string | null;
  legacyText?: string | null;
};

const unitLabels: Record<"en" | "zh" | "ms", Record<MaterialPriceUnit, string>> = {
  ms: { sqft: "kaki persegi", foot_run: "kaki panjang", unit: "unit", set: "set", panel: "panel", scope: "skop", none: "" },
  en: {
    sqft: "sq ft",
    foot_run: "ft run",
    unit: "unit",
    set: "set",
    panel: "panel",
    scope: "scope",
    none: "",
  },
  zh: {
    sqft: "平方尺",
    foot_run: "延尺",
    unit: "件",
    set: "套",
    panel: "片",
    scope: "工程范围",
    none: "",
  },
};

const quoteLabels: Record<"en" | "zh" | "ms", Record<Exclude<MaterialPriceMode, "range" | "from" | "none">, string>> = {
  ms: { specification: "Sebut harga mengikut spesifikasi", size: "Sebut harga mengikut saiz", scope: "Sebut harga mengikut skop projek" },
  en: {
    specification: "Quote by specification",
    size: "Quote by size",
    scope: "Quote by project scope",
  },
  zh: {
    specification: "按规格报价",
    size: "按尺寸报价",
    scope: "按工程范围报价",
  },
};

const toAmount = (value: MaterialPriceInput["min"]) => {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const formatAmount = (value: number, language: "en" | "zh" | "ms") =>
  new Intl.NumberFormat(language === "zh" ? "zh-CN" : language === "ms" ? "ms-MY" : "en-MY", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatUnit = (unit: string | null | undefined, language: "en" | "zh" | "ms") => {
  const normalized = unit && unit in unitLabels[language] ? (unit as MaterialPriceUnit) : "none";
  const label = unitLabels[language][normalized];
  return label ? ` / ${label}` : "";
};

export const localizeLegacyMaterialPrice = (value: string | null | undefined, language: "en" | "zh" | "ms") => {
  const text = String(value || "").trim();
  if (!text || language === "en") return text;

  const quoteMode = text.match(/^Quote by (specification|size|scope)$/i)?.[1]?.toLowerCase();
  if (quoteMode === "specification") return quoteLabels.zh.specification;
  if (quoteMode === "size") return quoteLabels.zh.size;
  if (quoteMode === "scope") return quoteLabels.zh.scope;

  return text
    .replace(/^From\s+/i, "")
    .replace(/\s*\/\s*sq\s*ft\b/gi, " / 平方尺")
    .replace(/\s*\/\s*ft\s*run\b/gi, " / 延尺")
    .replace(/\s*\/\s*panel\b/gi, " / 片")
    .replace(/\s*\/\s*set\b/gi, " / 套")
    .replace(/\s*\/\s*unit\b/gi, " / 件")
    .replace(/\s*-\s*/g, "–")
    .concat(/^From\s+/i.test(text) ? "起" : "");
};

export const formatMaterialPrice = (input: MaterialPriceInput, language: "en" | "zh" | "ms") => {
  const mode = String(input.mode || "") as MaterialPriceMode;
  if (!mode || mode === "none") return localizeLegacyMaterialPrice(input.legacyText, language);
  if (mode === "specification" || mode === "size" || mode === "scope") return quoteLabels[language][mode];

  const min = toAmount(input.min);
  const max = toAmount(input.max);
  if (min === null) return localizeLegacyMaterialPrice(input.legacyText, language);

  const currency = String(input.currency || "MYR").trim().toUpperCase() === "MYR" ? "RM" : String(input.currency || "MYR").trim().toUpperCase();
  const unit = formatUnit(input.unit, language);
  const minLabel = formatAmount(min, language);
  const maxLabel = max !== null && max !== min ? formatAmount(max, language) : "";

  if (mode === "range" && maxLabel) return `${currency} ${minLabel}–${maxLabel}${unit}`;
  return language === "ms" ? malayFormat("From __FC0__ __FC1____FC2__", [currency, minLabel, unit]) : (language === "zh" ? `${currency} ${minLabel}${unit}起` : `From ${currency} ${minLabel}${unit}`);
};
