import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
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
    whatsapp: "WhatsApp 联系",
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { data: slides } = usePublishedHeroSlides(language);
  const slide = slides?.[0] ?? null;
  const posterImage = "/videos/home-hero-poster.webp?v=20260529-luxury";
  const primaryLabel = slide?.buttonLabel || copy.quote;
  const primaryUrl = slide?.buttonUrl || "/quote";
  const primaryIsExternal = isExternalUrl(primaryUrl);
  const heroTitle = slide?.title || pageContent?.title || "FLASH CAST";
  const heroDescription = slide?.excerpt || pageContent?.description || "";
  const heroButtonClass =
    "home-hero-action group relative inline-flex h-11 w-full max-w-[260px] items-center justify-center gap-2 overflow-hidden rounded-full border px-5 text-sm font-semibold leading-none shadow-[0_18px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:min-w-[148px] sm:max-w-[210px]";
  const primaryButtonClass = `${heroButtonClass} home-hero-action-primary border-white/70 bg-white/[0.92] text-[#17130e] hover:bg-white`;
  const secondaryButtonClass = `${heroButtonClass} home-hero-action-secondary border-white/35 bg-black/[0.18] text-white hover:border-white/50 hover:bg-black/[0.28]`;
  const handleScrollCue = useCallback(() => {
    document.getElementById("trust")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const requestHeroVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || document.visibilityState === "hidden") return;

    video.muted = true;
    video.playsInline = true;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        setVideoLoaded(false);
      });
    }
  }, []);

  useEffect(() => {
    const replayWhenVisible = () => {
      if (document.visibilityState === "visible") requestHeroVideoPlay();
    };

    requestHeroVideoPlay();
    document.addEventListener("visibilitychange", replayWhenVisible);
    window.addEventListener("focus", requestHeroVideoPlay);
    window.addEventListener("pageshow", requestHeroVideoPlay);

    return () => {
      document.removeEventListener("visibilitychange", replayWhenVisible);
      window.removeEventListener("focus", requestHeroVideoPlay);
      window.removeEventListener("pageshow", requestHeroVideoPlay);
    };
  }, [requestHeroVideoPlay]);

  return (
    <section
      className="home-hero-section relative min-h-[100svh] overflow-hidden bg-surface-dark"
      aria-labelledby="home-hero-title"
    >
      <div className="absolute inset-0 bg-surface-dark" aria-hidden="true">
        <img
          src={posterImage}
          alt=""
          className="home-hero-media absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <video
          ref={videoRef}
          className={`home-hero-media absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          poster={posterImage}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={copy.videoAlt}
          onLoadedData={() => {
            setVideoLoaded(true);
            requestHeroVideoPlay();
          }}
          onCanPlay={() => {
            setVideoLoaded(true);
            requestHeroVideoPlay();
          }}
          onError={() => setVideoLoaded(false)}
          onStalled={() => setVideoLoaded(false)}
          onPause={() => {
            if (document.visibilityState === "visible") window.setTimeout(requestHeroVideoPlay, 150);
          }}
        >
          <source src="/videos/home-hero-mobile.webm?v=20260529-luxury" type="video/webm" media="(max-width: 767px)" />
          <source src="/videos/home-hero-mobile.mp4?v=20260529-luxury" type="video/mp4" media="(max-width: 767px)" />
          <source src="/videos/home-hero.webm?v=20260529-luxury" type="video/webm" />
          <source src="/videos/home-hero.mp4?v=20260529-luxury" type="video/mp4" />
        </video>
        <div className="absolute inset-0 home-hero-overlay" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-24">
        <div className="home-hero-content flex w-full max-w-4xl flex-col items-center text-center">
          <h1 id="home-hero-title" className="heading-safe max-w-3xl text-3xl font-bold leading-tight text-on-media md:text-5xl lg:text-6xl">
            {heroTitle}
          </h1>
          {heroDescription && (
            <p className="prose-safe mt-4 max-w-2xl text-sm leading-relaxed text-on-media-muted md:text-lg">
              {heroDescription}
            </p>
          )}

          <div className="home-hero-actions mt-7 flex w-full max-w-[500px] flex-col items-center justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row">
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
      </div>

      <button
        type="button"
        className="home-hero-scroll-cue"
        onClick={handleScrollCue}
        aria-label={language === "zh" ? "继续向下浏览" : "Scroll to next section"}
      >
        <span className="home-hero-scroll-cue__line" aria-hidden="true" />
        <span className="home-hero-scroll-cue__dot" aria-hidden="true" />
        <ChevronDown className="home-hero-scroll-cue__icon" aria-hidden="true" />
      </button>
    </section>
  );
};

export default HeroSection;
