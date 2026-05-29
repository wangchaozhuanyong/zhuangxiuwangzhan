import { ArrowRight } from "lucide-react";
import Link from "@/components/LocalizedLink";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedHeroSlides } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { PublishedSitePage } from "@/lib/homeContentApi";

const heroCopy = {
  en: {
    quote: "Get Free Quote",
    whatsapp: "WhatsApp Us",
    videoAlt:
      "FLASH CAST premium renovation project film featuring interiors, materials, construction and handover",
  },
  zh: {
    quote: "获取免费报价",
    whatsapp: "WhatsApp 咨询",
    videoAlt: "FLASH CAST 装修项目视频，展示室内空间、材料质感、施工管理与完工交付",
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
  const posterImage = "/videos/home-hero-poster.webp?v=20260529-luxury";
  const primaryLabel = slide?.buttonLabel || copy.quote;
  const primaryUrl = slide?.buttonUrl || "/quote";
  const primaryIsExternal = isExternalUrl(primaryUrl);
  const heroTitle = slide?.title || pageContent?.title || "FLASH CAST";
  const heroButtonClass =
    "group inline-flex h-11 w-full max-w-[280px] items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold leading-none shadow-[0_18px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:min-w-[148px] sm:max-w-[220px]";
  const primaryButtonClass = `${heroButtonClass} border-white/65 bg-white/90 text-[#17130e] hover:bg-white`;
  const secondaryButtonClass = `${heroButtonClass} border-white/30 bg-black/20 text-white hover:border-white/45 hover:bg-black/30`;

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-surface-dark"
      aria-labelledby="home-hero-title"
    >
      <div className="absolute inset-0 bg-surface-dark" aria-hidden="true">
        <video
          className="h-full w-full object-cover"
          poster={posterImage}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={copy.videoAlt}
        >
          <source src="/videos/home-hero-mobile.webm?v=20260529-luxury" type="video/webm" media="(max-width: 767px)" />
          <source src="/videos/home-hero-mobile.mp4?v=20260529-luxury" type="video/mp4" media="(max-width: 767px)" />
          <source src="/videos/home-hero.webm?v=20260529-luxury" type="video/webm" />
          <source src="/videos/home-hero.mp4?v=20260529-luxury" type="video/mp4" />
        </video>
        <div className="absolute inset-0 home-hero-overlay" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-24">
        <div className="flex w-full max-w-[520px] flex-col items-center justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <h1 id="home-hero-title" className="sr-only">
            {heroTitle}
          </h1>

          {primaryIsExternal ? (
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className={primaryButtonClass}>
              <span className="min-w-0 truncate">{primaryLabel}</span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          ) : (
            <Link to={primaryUrl} className={primaryButtonClass}>
              <span className="min-w-0 truncate">{primaryLabel}</span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          )}

          <a
            href={settings.whatsapp_url("Homepage hero")}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryButtonClass}
          >
            <WhatsAppIcon className="h-[17px] w-[17px] shrink-0 text-whatsapp" />
            <span className="min-w-0 truncate">{copy.whatsapp}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
