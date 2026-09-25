import type { Language } from "@/i18n/routes";

export const mediaLabels: Record<Language, { renderingConcept: string; aiConceptDisclosure: string }> = {
  en: {
    renderingConcept: "Rendering concept",
    aiConceptDisclosure: "AI-generated concept illustration, not a completed client project",
  },
  zh: {
    renderingConcept: "效果图方案",
    aiConceptDisclosure: "AI 生成概念示意，非客户完工实景",
  },
};
