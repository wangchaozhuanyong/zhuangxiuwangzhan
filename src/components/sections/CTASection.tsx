import FooterPreludeCta from "@/components/blocks/FooterPreludeCta";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { usePublishedCtaBlock } from "@/hooks/usePublishedContent";

const copy = {
  en: {
    title: "Planning to Renovate Your Home or Office?",
    description:
      "Tell us about your project, location, budget range, and timeline. We will review the details and follow up during business hours.",
  },
  zh: {
    title: "计划装修您的住宅或办公室？",
    description: "立即获取免费咨询和报价。我们服务吉隆坡、雪兰莪及周边地区。",
  },
};

const CTASection = () => {
  const { language } = useLanguage();
  const t = useT();
  const content = copy[language];
  const eyebrow = language === "zh" ? "项目咨询" : "Project Consultation";
  const { data: ctaBlock } = usePublishedCtaBlock(language, "home_final");
  const dynamic = ctaBlock
    ? {
        title: ctaBlock.title,
        description: ctaBlock.description,
        primary_label: ctaBlock.primary_label,
        primary_url: ctaBlock.primary_url,
      }
    : {};

  const title = dynamic?.title || content.title;
  const description = dynamic?.description || content.description;
  const primaryLabel = dynamic?.primary_label || t("cta.getQuote");
  const primaryUrl = dynamic?.primary_url || "/quote";

  return (
    <FooterPreludeCta
      id="cta"
      eyebrow={eyebrow}
      title={title}
      description={description}
      quoteLabel={primaryLabel}
      quotePath={primaryUrl}
      whatsappLabel={t("cta.whatsapp")}
      whatsappSource="Home CTA"
    />
  );
};

export default CTASection;
