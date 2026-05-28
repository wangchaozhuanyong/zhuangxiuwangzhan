import { useState, useRef, useCallback } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";

import beforeKitchen from "@/assets/before-after/before-kitchen.jpg";
import afterKitchen from "@/assets/before-after/after-kitchen.jpg";
import beforeLiving from "@/assets/before-after/before-living.jpg";
import afterLiving from "@/assets/before-after/after-living.jpg";
import beforeBathroom from "@/assets/before-after/before-bathroom.jpg";
import afterBathroom from "@/assets/before-after/after-bathroom.jpg";

const comparisons = {
  en: [
    {
      before: beforeKitchen,
      after: afterKitchen,
      title: "Kitchen Renovation",
      location: "Mont Kiara, KL",
      desc: "From dated cabinets to a sleek modern kitchen with marble countertops and integrated appliances.",
    },
    {
      before: beforeLiving,
      after: afterLiving,
      title: "Living Room Transformation",
      location: "Damansara Heights, KL",
      desc: "Complete overhaul with new flooring, built-in TV wall, ambient lighting, and premium finishes.",
    },
    {
      before: beforeBathroom,
      after: afterBathroom,
      title: "Bathroom Upgrade",
      location: "Bangsar, KL",
      desc: "From old fixtures to a luxury marble bathroom with rain shower and floating vanity.",
    },
  ],
  zh: [
    {
      before: beforeKitchen,
      after: afterKitchen,
      title: "厨房翻新",
      location: "Mont Kiara, KL",
      desc: "从老旧橱柜升级为现代感厨房，搭配大理石台面与内嵌式电器。",
    },
    {
      before: beforeLiving,
      after: afterLiving,
      title: "客厅改造",
      location: "Damansara Heights, KL",
      desc: "整体升级，包括新地板、电视背景墙、氛围灯光与更高质感的收口。",
    },
    {
      before: beforeBathroom,
      after: afterBathroom,
      title: "浴室升级",
      location: "Bangsar, KL",
      desc: "从旧洁具升级为大理石质感浴室，配备顶喷淋浴与悬浮洗手台。",
    },
  ],
};

const BeforeAfterSlider = ({
  before,
  after,
  alt,
  beforeLabel,
  afterLabel,
}: {
  before: string;
  after: string;
  alt: string;
  beforeLabel: string;
  afterLabel: string;
}) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) updatePosition(e.clientX);
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    isDragging.current = false;
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    touchStart.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touchStart.current) {
      touchStart.current = { x: touch.clientX, y: touch.clientY };
      return;
    }

    const deltaX = Math.abs(touch.clientX - touchStart.current.x);
    const deltaY = Math.abs(touch.clientY - touchStart.current.y);

    if (!isDragging.current) {
      if (deltaX < 8 && deltaY < 8) return;
      if (deltaY > deltaX) return;
      isDragging.current = true;
    }

    e.preventDefault();
    updatePosition(touch.clientX);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 5;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setPosition((value) => Math.max(0, value - step));
    }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setPosition((value) => Math.min(100, value + step));
    }
    if (e.key === "Home") {
      e.preventDefault();
      setPosition(0);
    }
    if (e.key === "End") {
      e.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-col-resize select-none [touch-action:pan-y] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      aria-valuetext={`${Math.round(position)}% ${beforeLabel}, ${100 - Math.round(position)}% ${afterLabel}`}
      aria-label={`${beforeLabel} / ${afterLabel}: ${alt}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onKeyDown={handleKeyDown}
      onClick={(e) => updatePosition(e.clientX)}
    >
      <img src={after} alt={`After: ${alt}`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img
          src={before}
          alt={`Before: ${alt}`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ minWidth: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%" }}
          loading="lazy"
        />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${position}%`, transform: "translateX(-50%)" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-foreground -mr-1" />
          <ChevronRight className="w-4 h-4 text-foreground -ml-1" />
        </div>
      </div>
      <span className="absolute top-3 left-3 bg-foreground/80 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 bg-white/90 text-foreground text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm">
        {afterLabel}
      </span>
    </div>
  );
};

const BeforeAfterSection = () => {
  const { language } = useLanguage();
  const sectionCopy = {
    en: {
      title: "See the Transformation",
      subtitle: "Drag the slider to compare before and after - real projects by FLASH CAST.",
      viewAll: "View All Projects",
      before: "Before",
      after: "After",
    },
    zh: {
      title: "看看变化前后",
      subtitle: "拖动滑块对比施工前后，查看 FLASH CAST 的真实项目成果。",
      viewAll: "查看全部案例",
      before: "施工前",
      after: "施工后",
    },
  }[language];

  return (
    <section className="section-padding bg-background" id="before-after">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{sectionCopy.title}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
              {sectionCopy.subtitle}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparisons[language].map((item, i) => (
            <Reveal key={item.title} delay={i * 120}>
              <div className="bg-card rounded-lg border border-border overflow-hidden hover-lift">
                <BeforeAfterSlider
                  before={item.before}
                  after={item.after}
                  alt={item.title}
                  beforeLabel={sectionCopy.before}
                  afterLabel={sectionCopy.after}
                />
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-xs mb-2">{translateDisplayText(item.location, language)}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="text-center mt-10">
            <Button variant="outline" className="btn-press" asChild>
              <Link to="/projects">{sectionCopy.viewAll} <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
