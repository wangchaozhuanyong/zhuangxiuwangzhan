import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "@/components/LocalizedLink";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedHeroSlides } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { trackCtaClick } from "@/lib/analytics";
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

type HeroMediaVariant = "desktop" | "tablet" | "mobile";

const getHeroMediaVariant = (): HeroMediaVariant => {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
  if (window.matchMedia("(min-width: 768px) and (max-width: 1180px) and (orientation: portrait)").matches) {
    return "tablet";
  }
  return "desktop";
};

const isExternalUrl = (url: string) => /^(https?:)?\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:");

const HeroSection = ({ pageContent }: HeroSectionProps) => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const copy = heroCopy[language];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [mediaVariant, setMediaVariant] = useState<HeroMediaVariant>(getHeroMediaVariant);
  const { data: slides } = usePublishedHeroSlides(language);
  const slide = slides?.[0] ?? null;
  const mediaVersion = "20260531-mobile-source-fix";
  const mediaByVariant = {
    desktop: {
      poster: `/videos/home-hero-poster.webp?v=${mediaVersion}`,
      webm: `/videos/home-hero.webm?v=${mediaVersion}`,
      mp4: `/videos/home-hero.mp4?v=${mediaVersion}`,
    },
    tablet: {
      poster: `/videos/home-hero-poster-tablet.webp?v=${mediaVersion}`,
      webm: `/videos/home-hero-tablet.webm?v=${mediaVersion}`,
      mp4: `/videos/home-hero-tablet.mp4?v=${mediaVersion}`,
    },
    mobile: {
      poster: `/videos/home-hero-poster-mobile.webp?v=${mediaVersion}`,
      webm: `/videos/home-hero-mobile.webm?v=${mediaVersion}`,
      mp4: `/videos/home-hero-mobile.mp4?v=${mediaVersion}`,
    },
  } satisfies Record<HeroMediaVariant, { poster: string; webm: string; mp4: string }>;
  const activeMedia = mediaByVariant[mediaVariant];
  const primaryLabel = slide?.buttonLabel || copy.quote;
  const primaryUrl = slide?.buttonUrl || "/quote";
  const primaryIsExternal = isExternalUrl(primaryUrl);
  const heroTitle =
    slide?.title ||
    (language === "zh" ? "马来西亚专业装修与空间改造公司" : "Renovation & Interior Fit-Out in Malaysia");
  const heroDescription =
    slide?.excerpt ||
    pageContent?.description ||
    (language === "zh"
      ? "从现场测量、空间规划、材料建议到施工交付，FLASH CAST 让住宅与商业装修更清楚、更安心。"
      : "FLASH CAST manages measurement, planning, material advice, renovation works, and handover follow-up for residential and commercial projects.");
  const heroButtonClass =
    "home-hero-action group relative inline-flex h-11 w-full max-w-[260px] items-center justify-center gap-2 overflow-hidden rounded-full border px-5 text-sm font-semibold leading-none shadow-[0_18px_50px_-28px_rgba(0,0,0,0.85)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:min-w-[148px] sm:max-w-[210px]";
  const primaryButtonClass = `${heroButtonClass} home-hero-action-primary border-white/70 bg-white/[0.92] text-[#17130e] hover:bg-white`;
  const secondaryButtonClass = `${heroButtonClass} home-hero-action-secondary border-white/35 bg-black/[0.18] text-white hover:border-white/50 hover:bg-black/[0.28]`;
  const trackPrimaryClick = () => {
    trackCtaClick(primaryUrl === "/quote" ? "quote" : "hero_primary", "home_hero", { destination: primaryUrl });
  };
  const trackWhatsAppClick = () => {
    trackCtaClick("whatsapp", "home_hero", { destination: "whatsapp" });
  };
  const handleScrollCue = useCallback(() => {
    trackCtaClick("scroll_cue", "home_hero");
    document.getElementById("trust")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const markHeroVideoReady = useCallback(() => {
    if ((videoRef.current?.readyState || 0) >= 2) setVideoLoaded(true);
  }, []);

  const requestHeroVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (!shouldLoadVideo || !video || document.visibilityState === "hidden") return;

    video.muted = true;
    video.playsInline = true;
    if (video.readyState >= 2) setVideoLoaded(true);
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.then(markHeroVideoReady).catch(() => setVideoLoaded(false));
    }
  }, [markHeroVideoReady, shouldLoadVideo]);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    let timeoutId: number | undefined;
    let idleId: number | undefined;
    const startVideoLoad = () => setShouldLoadVideo(true);
    const scheduleVideoLoad = () => {
      timeoutId = window.setTimeout(() => {
        const requestIdle = window.requestIdleCallback;
        if (requestIdle) {
          idleId = requestIdle(startVideoLoad, { timeout: 1200 });
        } else {
          startVideoLoad();
        }
      }, 1200);
    };

    if (document.readyState === "complete") {
      scheduleVideoLoad();
    } else {
      window.addEventListener("load", scheduleVideoLoad, { once: true });
    }

    return () => {
      window.removeEventListener("load", scheduleVideoLoad);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (idleId !== undefined && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
    };
  }, []);

  useEffect(() => {
    const mediaQueries = [
      window.matchMedia("(max-width: 767px)"),
      window.matchMedia("(min-width: 768px) and (max-width: 1180px) and (orientation: portrait)"),
    ];
    const syncMediaVariant = () => {
      const nextVariant = getHeroMediaVariant();
      setMediaVariant((currentVariant) => (currentVariant === nextVariant ? currentVariant : nextVariant));
    };
    const addMediaQueryListener = (query: MediaQueryList) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", syncMediaVariant);
      } else {
        query.addListener(syncMediaVariant);
      }
    };
    const removeMediaQueryListener = (query: MediaQueryList) => {
      if (typeof query.removeEventListener === "function") {
        query.removeEventListener("change", syncMediaVariant);
      } else {
        query.removeListener(syncMediaVariant);
      }
    };

    syncMediaVariant();
    mediaQueries.forEach(addMediaQueryListener);

    return () => {
      mediaQueries.forEach(removeMediaQueryListener);
    };
  }, []);

  useEffect(() => {
    setVideoLoaded(false);
    videoRef.current?.load();
    const playTimer = window.setTimeout(requestHeroVideoPlay, 50);
    return () => window.clearTimeout(playTimer);
  }, [mediaVariant, requestHeroVideoPlay]);

  useEffect(() => {
    if (!shouldLoadVideo) return;
    videoRef.current?.load();
    requestHeroVideoPlay();
  }, [mediaVariant, requestHeroVideoPlay, shouldLoadVideo]);

  useEffect(() => {
    const replayWhenVisible = () => {
      if (document.visibilityState === "visible") {
        requestHeroVideoPlay();
      } else {
        videoRef.current?.pause();
      }
    };

    requestHeroVideoPlay();
    markHeroVideoReady();
    document.addEventListener("visibilitychange", replayWhenVisible);
    window.addEventListener("focus", requestHeroVideoPlay);
    window.addEventListener("pageshow", requestHeroVideoPlay);

    return () => {
      document.removeEventListener("visibilitychange", replayWhenVisible);
      window.removeEventListener("focus", requestHeroVideoPlay);
      window.removeEventListener("pageshow", requestHeroVideoPlay);
    };
  }, [markHeroVideoReady, requestHeroVideoPlay]);

  return (
    <section
      className="home-hero-section relative min-h-[100svh] overflow-hidden bg-surface-dark"
      aria-labelledby="home-hero-title"
    >
      <div className="absolute inset-0 bg-surface-dark" aria-hidden="true">
        <picture>
          <source srcSet={mediaByVariant.mobile.poster} media="(max-width: 767px)" />
          <source srcSet={mediaByVariant.tablet.poster} media="(min-width: 768px) and (max-width: 1180px) and (orientation: portrait)" />
          <img
            src={mediaByVariant.desktop.poster}
            alt=""
            className="home-hero-media absolute inset-0 h-full w-full object-cover"
            loading="eager"
            {...({ fetchpriority: "high" } as { fetchpriority: "high" })}
          />
        </picture>
        <video
          key={mediaVariant}
          ref={videoRef}
          className={`home-hero-media absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          poster={activeMedia.poster}
          autoPlay
          muted
          loop
          playsInline
          preload={shouldLoadVideo ? "metadata" : "none"}
          data-video-variant={mediaVariant}
          aria-hidden="true"
          tabIndex={-1}
          onLoadedMetadata={markHeroVideoReady}
          onLoadedData={() => {
            setVideoLoaded(true);
            requestHeroVideoPlay();
          }}
          onCanPlay={() => {
            setVideoLoaded(true);
            requestHeroVideoPlay();
          }}
          onPlaying={markHeroVideoReady}
          onError={() => setVideoLoaded(false)}
          onStalled={() => {
            if ((videoRef.current?.readyState || 0) < 2) setVideoLoaded(false);
          }}
          onPause={() => {
            if (document.visibilityState === "visible") window.setTimeout(requestHeroVideoPlay, 150);
          }}
        >
          {shouldLoadVideo && (
            <>
              <source src={activeMedia.webm} type="video/webm" />
              <source src={activeMedia.mp4} type="video/mp4" />
            </>
          )}
        </video>
        <div className="absolute inset-0 home-hero-overlay" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-24">
        <div className="home-hero-content flex w-full max-w-4xl flex-col items-center justify-center text-center">
          <h1 id="home-hero-title" className="home-hero-title">
            {heroTitle}
          </h1>
          {heroDescription && (
            <p className="home-hero-description">
              {heroDescription}
            </p>
          )}

          <div className="home-hero-actions flex w-full max-w-[500px] flex-col items-center justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row">
            {primaryIsExternal ? (
              <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className={primaryButtonClass} onClick={trackPrimaryClick}>
                <span className="min-w-0 truncate">{primaryLabel}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
            ) : (
              <Link to={primaryUrl} className={primaryButtonClass} onClick={trackPrimaryClick}>
                <span className="min-w-0 truncate">{primaryLabel}</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            )}

            <a
              href={settings.whatsapp_url("Homepage hero")}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryButtonClass}
              onClick={trackWhatsAppClick}
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
        <span className="home-hero-scroll-cue__label">{language === "zh" ? "继续探索" : "Explore"}</span>
        <span className="home-hero-scroll-cue__track" aria-hidden="true">
          <span className="home-hero-scroll-cue__runner" />
        </span>
        <span className="home-hero-scroll-cue__arrow-stack" aria-hidden="true">
          <ChevronDown className="home-hero-scroll-cue__icon home-hero-scroll-cue__icon--top" />
          <ChevronDown className="home-hero-scroll-cue__icon home-hero-scroll-cue__icon--bottom" />
        </span>
      </button>
    </section>
  );
};

export default HeroSection;
