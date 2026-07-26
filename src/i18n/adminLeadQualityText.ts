export const leadQualityValues = ["unclassified", "high", "medium", "low", "spam"] as const;
export type LeadQualityValue = (typeof leadQualityValues)[number];

export const adminLeadQualityLabels: Record<LeadQualityValue, { en: string; zh: string }> = {
  unclassified: { en: "Not classified", zh: "未分类" },
  high: { en: "High-quality lead", zh: "高质量询盘" },
  medium: { en: "Medium-quality lead", zh: "中等质量询盘" },
  low: { en: "Low-quality lead", zh: "低质量询盘" },
  spam: { en: "Spam / irrelevant", zh: "垃圾或无关询盘" },
};
