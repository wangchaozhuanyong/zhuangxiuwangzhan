import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedHeroSlides } from "@/hooks/usePublishedContent";

const heroCopy = {
  en: {
    title: "Renovation & Interior Fit-Out in Malaysia",
    subtitle:
      "We manage site measurement, space planning, material advice, renovation works, and handover follow-up for residential and commercial projects.",
    videoAlt:
      "FLASH CAST premium renovation project film featuring interiors, materials, construction and handover",
  },
  zh: {
    title: "马来西亚专业装修与空间改造公司",
    subtitle:
      "FLASH CAST 提供现场测量、空间规划、材料建议、施工管理与交付跟进，让住宅与商业装修更清楚、更安心。",
    videoAlt: "FLASH CAST 高级装修宣传视频，展示室内空间、材料质感、施工管理与完工交付",
  },
};

const HeroSection = () => {
  const { language } = useLanguage();
  const copy = heroCopy[language];
  const { data: slides } = usePublishedHeroSlides(language);
  const slide = slides?.[0] ?? null;
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

  const visualTitle = slide?.title || copy.title;
  const visualSubtitle = slide?.excerpt || copy.subtitle;
  const showVideo = !reduceMotion && !saveData;
  const posterFetchPriority = { fetchpriority: "high" } as const;

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-surface-dark"
      aria-labelledby="home-hero-title"
    >
      <div className="absolute inset-0 bg-surface-dark" aria-hidden="true">
        <video
          className={`h-full w-full object-cover transition-opacity duration-500 ${showVideo && videoReady ? "opacity-100" : "opacity-0"}`}
          poster="/videos/home-hero-poster.webp?v=20260529-luxury"
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
        <img
          src="/videos/home-hero-poster.webp?v=20260529-luxury"
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${!showVideo || !videoReady ? "opacity-100" : "opacity-0"}`}
          {...posterFetchPriority}
          decoding="async"
        />
        <div className="absolute inset-0 home-hero-overlay" />
      </div>

      <h1 id="home-hero-title" className="sr-only">
        {visualTitle}
      </h1>
      <p className="sr-only">{visualSubtitle}</p>
    </section>
  );
};

export default HeroSection;
