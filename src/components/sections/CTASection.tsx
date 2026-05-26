import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { whatsappUrl } from "@/config/site";

const copy = {
  en: {
    title: "Planning to Renovate Your Home or Office?",
    description: "Get a free consultation and quotation today. Tell us about your project and we'll get back to you within 24 hours.",
    quote: "Get Free Quote",
    whatsapp: "WhatsApp Us",
  },
  zh: {
    title: "正在规划住宅或办公室装修？",
    description: "立即获取免费咨询和报价。告诉我们你的项目需求，我们会尽快回复并协助评估。",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 咨询",
  },
};

const CTASection = () => {
  const { language } = useLanguage();
  const t = copy[language];

  return (
    <section className="bg-surface-dark section-padding" id="cta">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: "hsl(var(--surface-dark-foreground))" }}>
              {t.title}
            </h2>
            <p className="text-base md:text-lg mb-8 leading-relaxed" style={{ color: "hsl(var(--surface-dark-foreground) / 0.8)" }}>
              {t.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="btn-press min-h-[3rem] text-sm font-bold tracking-wide bg-white text-foreground hover:bg-white/90 rounded-md px-8 py-3"
                asChild
              >
                <Link to="/quote">
                  <ArrowRight className="w-4 h-4 mr-2" /> {t.quote}
                </Link>
              </Button>
              <Button
                size="lg"
                className="btn-press min-h-[3rem] text-sm font-semibold bg-transparent border border-white/30 hover:bg-white/10 rounded-md px-8 py-3"
                style={{ color: "hsl(var(--surface-dark-foreground))" }}
                asChild
              >
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsapp}
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
