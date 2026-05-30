/**
 * CTA banner for sub-pages with Quote + WhatsApp buttons.
 */

import FooterPreludeCta from "@/components/blocks/FooterPreludeCta";
import { useLanguage } from "@/i18n/LanguageContext";

interface CTABannerProps {
  title?: string;
  description?: string;
  quoteLabel?: string;
  whatsappLabel?: string;
  quotePath?: string;
}

const CTABanner = ({
  title = "Ready to Start Your Project?",
  description = "Get a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.",
  quoteLabel = "Get a Free Quote",
  whatsappLabel = "WhatsApp Us",
  quotePath = "/quote",
}: CTABannerProps) => {
  const { language } = useLanguage();
  const eyebrow = language === "zh" ? "项目咨询" : "Project Consultation";

  return (
    <FooterPreludeCta
      className="subpage-footer-prelude"
      eyebrow={eyebrow}
      title={title}
      description={description}
      quoteLabel={quoteLabel}
      whatsappLabel={whatsappLabel}
      quotePath={quotePath}
      whatsappSource="Subpage CTA"
    />
  );
};

export default CTABanner;
