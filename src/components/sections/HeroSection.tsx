import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "@/components/LocalizedLink";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedHeroSlides } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { PublishedSitePage } from "@/lib/homeContentApi";

const heroCopy = {
  en: {
    eyebrow: "FLASH CAST SDN. BHD.",
    title: "Renovation & Interior Fit-Out in Kuala Lumpur and Selangor",
    subtitle:
      "We manage site measurement, space planning, material advice, renovation works, and handover follow-up for residential and commercial projects.",
    quote: "Get Free Quote",
    whatsapp: "WhatsApp Us",
    videoAlt:
      "FLASH CAST premium renovation project film featuring interiors, materials, construction and handover",
  },
  zh: {
    eyebrow: "FLASH CAST SDN. BHD.",
    title: "马来西亚专业装修与空间改造公司",
    subtitle:
      "FLASH CAST 提供现场测量、空间规划、材料建议、施工管理与交付跟进，让住宅与商业装修更清楚、更安心。",
    videoAlt: "FLASH CAST 高级装修宣传视频，展示室内空间、材料质感、施工管理与完工交付",
  },
};

type HeroSectionProps = {
  pageContent?: PublishedSitePage | null;
};

const isExternalUrl = (url: string) => /^(https?:)?\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:");

const HeroSection = ({ pageContent }: HeroSectionProps) => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const copy = heroCopy[language];
  const { data: slides } = usePublishedHeroSlides(language);
  const slide = slides?.[0] ?? null;
  const heroImage = slide?.image || pageContent?.image_url || "";
  const [reduceMotion, setReduceMotion] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dataQuery = window.matchMedia("(prefers-reduced-data: reduce)");
    const update = () => {
      setReduceMotion(motionQuery.matches);
      setSaveData(dataQuery.matches);
    };
    update();
    motionQuery.addEventListener("change", update);
    dataQuery.addEventListener("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      dataQuery.removeEventListener("change", update);
    };
  }, []);

  const visualTitle = slide?.title || pageContent?.title || copy.title;
  const visualSubtitle = slide?.excerpt || pageContent?.subtitle || pageContent?.description || copy.subtitle;
  const quoteLabel = language === "zh" ? "获取免费报价" : heroCopy.en.quote;
  const whatsappLabel = language === "zh" ? "WhatsApp 咨询" : heroCopy.en.whatsapp;
  const primaryLabel = slide?.buttonLabel || quoteLabel;
  const primaryUrl = slide?.buttonUrl || "/quote";
  const primaryIsExternal = isExternalUrl(primaryUrl);
  const showVideo = !heroImage && !reduceMotion && !saveData;
  const fallbackHeroImage = "/videos/home-hero-poster.webp?v=20260529-luxury";
  const posterFetchPriority = { fetchpriority: "high" } as const;

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-surface-dark"
      aria-labelledby="home-hero-title"
    >
      <div className="absolute inset-0 bg-surface-dark" aria-hidden="true">
        <video
          className={`h-full w-full object-cover transition-opacity duration-500 ${showVideo && videoReady ? "opacity-100" : "opacity-0"}`}
          poster={fallbackHeroImage}
          autoPlay={showVideo}
          muted
          loop={showVideo}
          playsInline
          preload={showVideo ? "metadata" : "none"}
          aria-label={copy.videoAlt}
          onLoadedData={() => setVideoReady(true)}
        >
          <source src="/videos/home-hero-mobile.webm?v=20260529-luxury" type="video/webm" media="(max-width: 767px)" />
          <source src="/videos/home-hero-mobile.mp4?v=20260529-luxury" type="video/mp4" media="(max-width: 767px)" />
          <source src="/videos/home-hero.webm?v=20260529-luxury" type="video/webm" />
          <source src="/videos/home-hero.mp4?v=20260529-luxury" type="video/mp4" />
        </video>
        {heroImage ? (
          <SmartImage
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            width={1920}
            height={1080}
            loading="eager"
            fetchPriority="high"
            aria-label={slide?.alt || pageContent?.alt || copy.videoAlt}
          />
        ) : (
          <img
            src={fallbackHeroImage}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${!showVideo || !videoReady ? "opacity-100" : "opacity-0"}`}
            {...posterFetchPriority}
            decoding="async"
          />
        )}
        <div className="absolute inset-0 home-hero-overlay" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-end">
        <div className="site-container pb-28 pt-28 md:pb-20 md:pt-32">
          <div className="max-w-3xl">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-gold md:text-xs">{copy.eyebrow}</p>
            <h1 id="home-hero-title" className="heading-safe max-w-3xl font-display text-4xl font-bold leading-tight text-on-media md:text-6xl">
              {visualTitle}
            </h1>
            <p className="prose-safe mt-4 max-w-2xl text-sm leading-6 text-on-media-muted md:text-lg md:leading-8">
              {visualSubtitle}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {primaryIsExternal ? (
                <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="btn-on-dark-primary min-h-12 justify-center px-7 sm:w-auto">
                  {primaryLabel} <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <Link to={primaryUrl} className="btn-on-dark-primary min-h-12 justify-center px-7 sm:w-auto">
                  {primaryLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <a
                href={settings.whatsapp_url("Homepage hero")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-on-dark-secondary min-h-12 justify-center px-7 sm:w-auto"
              >
                <WhatsAppIcon className="mr-2 h-[18px] w-[18px] text-whatsapp" /> {whatsappLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
