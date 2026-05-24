import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";

const CTASection = () => {
  return (
    <section className="bg-surface-dark section-padding" id="cta">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: "hsl(var(--surface-dark-foreground))" }}>
              Planning to Renovate Your Home or Office?
            </h2>
            <p className="text-base md:text-lg mb-8 leading-relaxed" style={{ color: "hsl(var(--surface-dark-foreground) / 0.8)" }}>
              Get a free consultation and quotation today. Tell us about your project and we'll get back to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="btn-press min-h-[3rem] text-sm font-bold tracking-wide bg-white text-foreground hover:bg-white/90 rounded-md px-8 py-3"
                asChild
              >
                <Link to="/quote">
                  <ArrowRight className="w-4 h-4 mr-2" /> Get Free Quote
                </Link>
              </Button>
              <Button
                size="lg"
                className="btn-press min-h-[3rem] text-sm font-semibold bg-transparent border border-white/30 hover:bg-white/10 rounded-md px-8 py-3"
                style={{ color: "hsl(var(--surface-dark-foreground))" }}
                asChild
              >
                <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
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
