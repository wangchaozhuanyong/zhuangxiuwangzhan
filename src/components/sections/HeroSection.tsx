import { useEffect, useState } from "react";
import LocalizedLink from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useLanguage } from "@/i18n/LanguageContext";
import { getPublishedHeroSlides } from "@/lib/contentApi";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const heroCopy = {
  en: {
    title: "Renovation & Interior Fit-Out in Malaysia",
    subtitle:
      "We manage site measurement, space planning, material advice, renovation works, and handover follow-up for residential and commercial projects.",
    quoteCta: "Get Free Quote",
    whatsappCta: "WhatsApp Consultation",
    videoAlt:
      "FLASH CAST premium renovation project film featuring interiors, materials, construction and handover",
  },
  zh: {
    title: "马来西亚专业装修与空间改造公司",
    subtitle:
      "FLASH CAST 提供现场测量、空间规划、材料建议、施工管理与交付跟进，让住宅与商业装修更清楚、更安心。",
    quoteCta: "获取免费报价",
    whatsappCta: "WhatsApp 咨询",
    videoAlt: "FLASH CAST 高端装修宣传视频，展示室内空间、材料质感、施工管理与完工交付",
  },
};

const HeroSection = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const copy = heroCopy[language];
  const [slide, setSlide] = useState<any>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void getPublishedHeroSlides(language).then((slides) => setSlide(slides[0] || null));
  }, [language]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const visualTitle = slide?.title || copy.title;
  const visualSubtitle = slide?.excerpt || copy.subtitle;

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-surface-dark"
      aria-labelledby="home-hero-title"
    >
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          poster="/videos/home-hero-poster.jpg?v=20260526-hq"
          autoPlay={!reduceMotion}
          muted
          loop={!reduceMotion}
          playsInline
          preload="metadata"
          aria-label={copy.videoAlt}
        >
          <source src="/videos/home-hero-mobile.mp4?v=20260526-hq" type="video/mp4" media="(max-width: 767px)" />
          <source src="/videos/home-hero.mp4?v=20260526-hq" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/35 to-black/15" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-end px-5 pb-24 pt-28 md:px-8 md:pb-24 lg:px-16">
        <div className="container-narrow w-full">
          <div className="max-w-3xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">
              FLASH CAST SDN. BHD.
            </p>
            <h1 id="home-hero-title" className="font-display text-4xl font-bold leading-tight text-white text-shadow-hero md:text-6xl lg:text-7xl">
              {visualTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/88 md:text-lg">
              {visualSubtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="btn-press min-h-12 px-7 text-sm font-bold" asChild>
                <LocalizedLink to="/quote">{copy.quoteCta}</LocalizedLink>
              </Button>
              <Button size="lg" variant="outline" className="btn-press min-h-12 border-white/35 bg-white/10 px-7 text-sm font-semibold text-white hover:bg-white/20 hover:text-white" asChild>
                <a href={settings.whatsapp_url("Home hero CTA")} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="mr-2 h-4 w-4 text-[#25D366]" />
                  {copy.whatsappCta}
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
