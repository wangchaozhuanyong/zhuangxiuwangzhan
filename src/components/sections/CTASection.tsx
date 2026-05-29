import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
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
    <section className="bg-surface-dark section-padding relative overflow-hidden" id="cta">
      <div
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(184,149,94,0.16),transparent_42%,rgba(255,255,255,0.04))]"
        aria-hidden="true"
      />
      <div className="container-narrow">
        <Reveal>
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-surface-dark-foreground">
              {title}
            </h2>
            <p className="text-base md:text-lg mb-8 leading-relaxed text-surface-dark-foreground/80">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="btn-press min-h-[3rem] text-sm font-bold tracking-wide bg-card text-card-foreground hover:bg-card/90 rounded-md px-8 py-3"
                asChild
              >
                <Link to={primaryUrl}>
                  <ArrowRight className="w-4 h-4 mr-2" /> {primaryLabel}
                </Link>
              </Button>
              <Button
                size="lg"
                className="btn-press min-h-[3rem] text-sm font-semibold bg-transparent border border-white/30 text-surface-dark-foreground hover:bg-white/10 rounded-md px-8 py-3"
                asChild
              >
                <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-whatsapp" /> {t("cta.whatsapp")}
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTASection;
