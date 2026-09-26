import type { Language } from "@/i18n/routes";

export const mediaLabels: Record<Language, { renderingConcept: string; aiConceptDisclosure: string }> = {
  en: {
    renderingConcept: "Design rendering",
    aiConceptDisclosure: "Design rendering",
  },
  zh: {
    renderingConcept: "设计效果图",
    aiConceptDisclosure: "设计效果图",
  },
};
