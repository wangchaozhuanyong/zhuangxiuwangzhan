import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useLanguage } from "@/i18n/LanguageContext";
import { getPublishedHeroSlides } from "@/lib/contentApi";
import LocalizedLink from "@/components/LocalizedLink";
import { whatsappUrl } from "@/config/site";

const heroCopy = {
  en: {
    eyebrow: "FLASH CAST SDN. BHD.",
    title: "Renovation & Interior Fit-Out in Malaysia",
    subtitle:
      "We manage site measurement, space planning, material advice, renovation works, and handover follow-up for residential and commercial projects.",
    quote: "Get Free Quote",
    whatsapp: "WhatsApp Consultation",
    videoAlt:
      "FLASH CAST premium renovation project film featuring interiors, materials, construction and handover",
  },
  zh: {
    eyebrow: "FLASH CAST SDN. BHD.",
    title: "马来西亚专业装修与空间改造公司",
    subtitle:
      "FLASH CAST 提供现场测量、空间规划、材料建议、施工管理与交付跟进，让住宅与商业装修更清楚、更安心。",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 咨询",
    videoAlt: "FLASH CAST 高端装修宣传视频，展示室内空间、材料质感、施工管理与完工交付",
  },
};

const HeroSection = () => {
  const { language } = useLanguage();
  const copy = heroCopy[language];
  const [slide, setSlide] = useState<any>(null);

  useEffect(() => {
    void getPublishedHeroSlides(language).then((slides) => setSlide(slides[0] || null));
  }, [language]);

  const buttonLabel = slide?.buttonLabel || copy.quote;
  const buttonUrl = slide?.buttonUrl || "/quote";

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-surface-dark"
      aria-labelledby="home-hero-title"
    >
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          poster="/videos/home-hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={copy.videoAlt}
        >
          <source src="/videos/home-hero-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
          <source src="/videos/home-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_34%,rgba(255,255,255,0.1),transparent_31%),linear-gradient(90deg,rgba(17,16,14,0.8)_0%,rgba(17,16,14,0.42)_44%,rgba(17,16,14,0.18)_100%),linear-gradient(180deg,rgba(17,16,14,0.12)_0%,rgba(17,16,14,0.24)_48%,rgba(17,16,14,0.86)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-end">
        <div className="container-narrow w-full px-5 pb-28 pt-24 md:px-8 md:pb-16 lg:pb-20">
          <div className="max-w-3xl animate-fade-up text-white">
            <div className="mb-6 h-px w-20 bg-[hsl(var(--gold))]" />
            <span className="mb-5 block text-xs font-semibold uppercase tracking-[0.42em] text-gold md:text-sm">
              {copy.eyebrow}
            </span>
            <h1
              id="home-hero-title"
              className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white drop-shadow-2xl md:text-6xl lg:text-7xl"
            >
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-white/88 md:text-xl md:leading-9">
              {copy.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="luxury" className="h-14 justify-center px-7 text-base">
                <LocalizedLink to={buttonUrl}>
                  <ArrowRight className="mr-2 h-5 w-5" />
                  {buttonLabel}
                </LocalizedLink>
              </Button>
              <Button asChild size="lg" variant="outline-light" className="h-14 justify-center px-7 text-base">
                <a href={whatsappUrl("Hero video consultation")} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="mr-2 h-5 w-5 text-[#25D366]" />
                  {copy.whatsapp}
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
