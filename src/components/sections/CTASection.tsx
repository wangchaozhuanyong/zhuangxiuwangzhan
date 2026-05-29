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
      "Get a free consultation and quotation today. Tell us about your project and we'll get back to you within 24 hours.",
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
    <section className="section-padding relative overflow-hidden bg-surface-dark" id="cta">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(198,164,106,0.12),transparent_45%)]"
        aria-hidden="true"
      />
      <div className="container-narrow relative">
        <Reveal>
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="heading-safe mb-4 font-display text-3xl font-bold text-surface-dark-foreground md:text-4xl">
              {title}
            </h2>
            <p className="mb-8 text-base leading-relaxed text-surface-dark-foreground/80 md:text-lg">
              {description}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={primaryUrl} className="btn-on-dark-primary min-h-12 justify-center px-8">
                <ArrowRight className="h-4 w-4" /> {primaryLabel}
              </Link>
              <a
                href={settings.whatsapp_url()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-on-dark-secondary min-h-12 justify-center px-8"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] text-whatsapp" /> {t("cta.whatsapp")}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTASection;
