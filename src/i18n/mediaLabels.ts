import type { Language } from "@/i18n/routes";

export const mediaLabels: Record<Language, { renderingConcept: string; aiConceptDisclosure: string; materialPalette: string }> = {
  en: {
    renderingConcept: "Design rendering",
    aiConceptDisclosure: "Design rendering",
    materialPalette: "Material palette study",
  },
  zh: {
    renderingConcept: "设计效果图",
    aiConceptDisclosure: "设计效果图",
    materialPalette: "材质搭配示意",
  },
};
