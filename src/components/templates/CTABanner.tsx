/**
 * Reusable CTA Banner component — bottom CTA section with Quote + WhatsApp buttons.
 * Used across all sub-pages for consistent call-to-action.
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";

interface CTABannerProps {
  title?: string;
  description?: string;
  quoteLabel?: string;
  quotePath?: string;
}

const CTABanner = ({
  title = "Ready to Start Your Project?",
  description = "Get a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.",
  quoteLabel = "Get a Free Quote",
  quotePath = "/quote",
}: CTABannerProps) => {
  return (
    <section className="section-padding bg-accent text-accent-foreground text-center">
      <Reveal>
        <div className="container-narrow">
          <h2 className="font-display text-3xl font-bold mb-4">{title}</h2>
          <p className="text-accent-foreground/80 mb-6 max-w-lg mx-auto">{description}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center"
              asChild
            >
              <Link to={quotePath}>
                {quoteLabel} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center"
              asChild
            >
              <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default CTABanner;
