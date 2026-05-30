import Link from "@/components/LocalizedLink";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublishedCtaBlock } from "@/hooks/usePublishedContent";

const copy = {
  en: {
    title: "Planning to Renovate Your Home or Office?",
    description:
      "Tell us about your project, location, budget range, and timeline. We will review the details and follow up during business hours.",
  },
  zh: {
    title: "正在规划住宅或办公室装修？",
    description: "立即获取免费咨询和报价。告诉我们您的项目需求，我们会在 24 小时内与您联系。",
  },
};

const CTASection = () => {
  const { language } = useLanguage();
  const t = useT();
  const settings = useSiteSettings();
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
    <section className="home-footer-prelude section-padding" id="cta">
      <div className="home-footer-prelude__beam" aria-hidden="true" />
      <div className="container-narrow relative z-10">
        <Reveal>
          <div className="home-footer-prelude__panel">
            <span className="home-footer-prelude__rule" aria-hidden="true" />
            <div className="home-footer-prelude__copy">
              <p className="home-footer-prelude__eyebrow">{eyebrow}</p>
              <h2 className="home-footer-prelude__title">{title}</h2>
              <p className="home-footer-prelude__text">{description}</p>
            </div>
            <div className="home-footer-prelude__actions">
              <Link to={primaryUrl} className="home-footer-prelude__button home-footer-prelude__button--primary">
                <ArrowRight className="h-4 w-4" />
                <span>{primaryLabel}</span>
              </Link>
              <a
                href={settings.whatsapp_url()}
                target="_blank"
                rel="noopener noreferrer"
                className="home-footer-prelude__button home-footer-prelude__button--secondary"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] text-whatsapp" />
                <span>{t("cta.whatsapp")}</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTASection;
