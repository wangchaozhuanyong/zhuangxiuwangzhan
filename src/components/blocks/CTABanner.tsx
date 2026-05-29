/**
 * CTA banner for sub-pages with Quote + WhatsApp buttons.
 */

import Link from "@/components/LocalizedLink";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
  const settings = useSiteSettings();

  return (
    <section className="section-padding relative overflow-hidden bg-surface-dark text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,164,106,0.1),transparent_50%)]" aria-hidden />
      <Reveal>
        <div className="container-narrow relative">
          <h2 className="heading-safe mb-4 font-display text-3xl font-bold text-surface-dark-foreground">{title}</h2>
          <p className="mx-auto mb-6 max-w-lg text-surface-dark-foreground/75">{description}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to={quotePath} className="btn-on-dark-primary min-h-12 w-full justify-center px-8 sm:w-auto">
              {quoteLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={settings.whatsapp_url()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-on-dark-secondary min-h-12 w-full justify-center px-8 sm:w-auto"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-whatsapp" /> {whatsappLabel}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default CTABanner;
