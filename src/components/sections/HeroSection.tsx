import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useT } from "@/i18n/useT";
import { useLanguage } from "@/i18n/LanguageContext";
import { getPublishedHeroSlides } from "@/lib/contentApi";
import LocalizedLink from "@/components/LocalizedLink";
import { whatsappUrl } from "@/config/site";

const HeroSection = () => {
  const t = useT();
  const { language } = useLanguage();
  const [slide, setSlide] = useState<any>(null);

  useEffect(() => {
    void getPublishedHeroSlides(language).then((slides) => setSlide(slides[0] || null));
  }, [language]);

  const title = slide?.title;
  const subtitle = slide?.excerpt || t("hero.subtitle");
  const buttonLabel = slide?.buttonLabel || t("cta.getQuote");
  const buttonUrl = slide?.buttonUrl || "/quote";
  const seoTitle = title || `${t("hero.title.line1")} ${t("hero.title.line2")} ${t("hero.title.line3")}`;

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-surface-dark" aria-label="FLASH CAST cinematic renovation showcase">
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          poster="/videos/home-hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/videos/home-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(17,16,14,0.16)_0%,rgba(17,16,14,0.24)_42%,rgba(17,16,14,0.78)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-end">
        <div className="container-narrow w-full px-5 pb-24 pt-24 md:px-8 md:pb-10">
          <h1 className="sr-only">{seoTitle}</h1>
          <p className="sr-only">{subtitle}</p>

          <div className="hero-action-dock ml-auto w-full max-w-[37rem] animate-fade-in lg:mr-28 xl:mr-36">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
                {t("hero.badge")}
              </p>
              <p className="text-sm leading-relaxed text-white/78 md:text-[15px]">
                {subtitle}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[18rem] sm:flex-row sm:justify-end">
            <Button
              size="lg"
              className="btn-press min-h-[3rem] w-full justify-center rounded-md bg-white px-6 py-3 text-sm font-bold tracking-wide text-foreground shadow-xl hover:bg-white/90 sm:w-auto"
              asChild
            >
              <LocalizedLink to={buttonUrl}>
                <ArrowRight className="w-4 h-4 mr-2" /> {buttonLabel}
              </LocalizedLink>
            </Button>
            <Button
              size="lg"
              className="btn-press min-h-[3rem] w-full justify-center rounded-md border border-white/35 bg-white/5 px-6 py-3 text-sm font-semibold text-white shadow-md backdrop-blur-sm hover:bg-white/12 sm:w-auto"
              asChild
            >
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="Contact FLASH CAST on WhatsApp">
                <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t("cta.whatsapp")}
              </a>
            </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
