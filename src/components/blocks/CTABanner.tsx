import Link from "@/components/LocalizedLink";
import Reveal from "@/components/Reveal";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface CTABannerProps {
  title?: string;
  description?: string;
  quoteLabel?: string;
  whatsappLabel?: string;
  quotePath?: string;
  eyebrow?: string;
  className?: string;
  whatsappSource?: string;
}

const CTABanner = ({
  title = "Ready to Start Your Project?",
  description = "Get a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.",
  quoteLabel = "Get a Free Quote",
  whatsappLabel = "WhatsApp Us",
  quotePath = "/quote",
  eyebrow,
  className,
  whatsappSource = "Subpage CTA",
}: CTABannerProps) => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const displayEyebrow = eyebrow || (language === "zh" ? "项目咨询" : "Project Consultation");

  return (
    <section className={cn("subpage-cta section-padding", className)}>
      <div className="subpage-cta__beam" aria-hidden="true" />
      <div className="container-narrow relative z-10">
        <Reveal>
          <div className="subpage-cta__panel">
            <span className="subpage-cta__rule" aria-hidden="true" />
            <div className="subpage-cta__copy">
              <p className="subpage-cta__eyebrow">{displayEyebrow}</p>
              <h2 className="subpage-cta__title font-display">{title}</h2>
              <p className="subpage-cta__text">{description}</p>
            </div>
            <div className="subpage-cta__actions">
              <Link to={quotePath} className="subpage-cta__button subpage-cta__button--primary">
                <ArrowRight className="h-4 w-4" />
                <span>{quoteLabel}</span>
              </Link>
              <a
                href={settings.whatsapp_url(whatsappSource)}
                target="_blank"
                rel="noopener noreferrer"
                className="subpage-cta__button subpage-cta__button--secondary"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] text-whatsapp" />
                <span>{whatsappLabel}</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CTABanner;
