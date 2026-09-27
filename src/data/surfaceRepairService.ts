import type { ServiceItem } from "@/data/types";
import { surfaceRepairPageText } from "@/i18n/surfaceRepairPageText";

export function surfaceRepairServiceForLanguage(language: "zh" | "en"): ServiceItem {
  const copy = surfaceRepairPageText[language];
  return {
    id: "surface-repair", slug: "surface-repair",
    title: copy.siteHero.titleLines.join(language === "zh" ? "" : " "),
    summary: copy.siteHero.description, description: copy.scopeDescription,
    image: "/images/services/surface-repair/hero.webp", imageAlt: copy.siteHero.imageAlt,
    seoTitle: copy.metaTitle, seoDescription: copy.metaDescription,
    suitableFor: copy.situations.split(" · "),
    commonProjects: copy.damageExamples.map(item => item.title),
    processSteps: copy.process.map(item => ({ title: item.title, desc: item.description })),
    items: copy.services.map(item => `${item.title}: ${item.summary}`),
    faqs: copy.faqs.map(item => ({ q: item.question, a: item.answer })),
  };
}

const zh = surfaceRepairServiceForLanguage("zh");
export const surfaceRepairService: ServiceItem = {
  ...surfaceRepairServiceForLanguage("en"),
  titleZh: zh.title, summaryZh: zh.summary, descriptionZh: zh.description,
  imageAltZh: zh.imageAlt, seoTitleZh: zh.seoTitle, seoDescriptionZh: zh.seoDescription,
  suitableForZh: zh.suitableFor, commonProjectsZh: zh.commonProjects,
  processStepsZh: zh.processSteps, itemsZh: zh.items, faqsZh: zh.faqs,
};
