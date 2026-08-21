import Link from "@/components/LocalizedLink";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { trackCtaClick } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface CTABannerProps {
  title?: string;
  description?: string;
  quoteLabel?: string;
  whatsappLabel?: string;
  quotePath?: string;
  className?: string;
  whatsappSource?: string;
}

const CTABanner = ({
  title = "Ready to Start Your Project?",
  description = "Get a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.",
  quoteLabel = "Get a Free Quote",
  whatsappLabel = "WhatsApp Us",
  quotePath = "/quote",
  className,
  whatsappSource = "Subpage CTA",
}: CTABannerProps) => {
  const settings = useSiteSettings();

  return (
    <section className={cn("subpage-cta scheme-a-page-cta", className)} data-cinematic-section>
      <div className="scheme-a-frame scheme-a-page-cta__layout">
        <div className="scheme-a-page-cta__copy">
          <p>FLASH CAST</p>
          <h2>{title}</h2>
          <span>{description}</span>
        </div>
        <div className="scheme-a-page-cta__actions">
          <Link
            to={quotePath}
            className="scheme-a-page-cta__button scheme-a-page-cta__button--primary"
            onClick={() => trackCtaClick("quote", whatsappSource, { destination: quotePath })}
          >
            <span>{quoteLabel}</span>
            <ArrowRight aria-hidden="true" />
          </Link>
          <a
            href={settings.whatsapp_url()}
            target="_blank"
            rel="noopener noreferrer"
            className="scheme-a-page-cta__button scheme-a-page-cta__button--secondary"
            onClick={() => trackCtaClick("whatsapp", whatsappSource, { destination: "whatsapp" })}
          >
            <WhatsAppIcon aria-hidden="true" />
            <span>{whatsappLabel}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
