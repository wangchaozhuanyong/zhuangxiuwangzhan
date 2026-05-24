import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useT } from "@/i18n/useT";
import heroImg from "@/assets/hero-luxury-living.jpg";

const HeroSection = () => {
  const t = useT();

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Modern luxury living room renovation by FLASH CAST in Kuala Lumpur"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="relative z-10 container-narrow px-5 md:px-8 py-24 md:py-32 lg:py-40">
        <div className="max-w-2xl">
          <p
            className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-5 animate-fade-in"
            style={{ animationDelay: "0.15s", color: "hsl(var(--gold))" }}
          >
            {t("hero.badge")}
          </p>

          <h1
            className="font-display text-[1.85rem] sm:text-[2.3rem] md:text-[2.8rem] lg:text-[3.25rem] font-bold leading-[1.12] mb-6 animate-slide-up"
            style={{
              animationDelay: "0.25s",
              opacity: 0,
              color: "#ffffff",
              textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.2)",
              letterSpacing: "-0.02em",
            }}
          >
            {t("hero.title.line1")}
            <br />
            {t("hero.title.line2")}
            <br />
            {t("hero.title.line3")}
          </h1>

          <p
            className="text-[14px] md:text-[16px] leading-relaxed mb-10 max-w-lg animate-fade-in"
            style={{
              animationDelay: "0.45s",
              opacity: 0,
              color: "rgba(255,255,255,0.92)",
              textShadow: "0 1px 8px rgba(0,0,0,0.5)",
            }}
          >
            {t("hero.subtitle")}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in"
            style={{ animationDelay: "0.6s", opacity: 0 }}
          >
            <Button
              size="lg"
              className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide shadow-xl bg-white text-foreground hover:bg-white/90 rounded-md px-8 py-3 justify-center"
              asChild
            >
              <Link to="/quote">
                <ArrowRight className="w-4 h-4 mr-2" /> {t("cta.getQuote")}
              </Link>
            </Button>
            <Button
              size="lg"
              className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-transparent text-white border border-white/40 hover:bg-white/10 backdrop-blur-sm shadow-md rounded-md px-8 py-3 justify-center"
              asChild
            >
              <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer" aria-label="Contact FLASH CAST on WhatsApp">
                <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t("cta.whatsapp")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
