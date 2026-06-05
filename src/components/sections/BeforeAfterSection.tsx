import { useMemo, useState, useRef, useCallback } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";
import { formatHomeSectionText, homeSectionText } from "@/i18n/homeSectionsText";
import { usePublishedBeforeAfterItems } from "@/hooks/usePublishedContent";
import type { PublishedBeforeAfterItem } from "@/lib/homeContentApi";

const beforeKitchen = "/images/before-after/before-kitchen.webp";
const afterKitchen = "/images/before-after/after-kitchen.webp";
const beforeLiving = "/images/before-after/before-living.webp";
const afterLiving = "/images/before-after/after-living.webp";
const beforeBathroom = "/images/before-after/before-bathroom.webp";
const afterBathroom = "/images/before-after/after-bathroom.webp";
const BEFORE_AFTER_IMAGE_WIDTHS = [360, 560, 720];

const fallbackComparisonMedia = [
  { before: beforeKitchen, after: afterKitchen },
  { before: beforeLiving, after: afterLiving },
  { before: beforeBathroom, after: afterBathroom },
];

const BeforeAfterSlider = ({
  before,
  after,
  alt,
  beforeLabel,
  afterLabel,
  beforeAltTemplate,
  afterAltTemplate,
}: {
  before: string;
  after: string;
  alt: string;
  beforeLabel: string;
  afterLabel: string;
  beforeAltTemplate: string;
  afterAltTemplate: string;
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
      className="relative aspect-[4/3] cursor-col-resize select-none overflow-hidden rounded-card-lg [touch-action:pan-y] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
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
      <SmartImage
        src={after}
        alt={formatHomeSectionText(afterAltTemplate, { alt })}
        className="absolute inset-0 w-full h-full object-cover"
        width={800}
        height={600}
        sizes="(max-width: 768px) 92vw, 30vw"
        candidateWidths={BEFORE_AFTER_IMAGE_WIDTHS}
        quality={72}
      />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <SmartImage
          src={before}
          alt={formatHomeSectionText(beforeAltTemplate, { alt })}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ minWidth: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%" }}
          width={800}
          height={600}
          sizes="(max-width: 768px) 92vw, 30vw"
          candidateWidths={BEFORE_AFTER_IMAGE_WIDTHS}
          quality={72}
        />
      </div>
      <div className="absolute bottom-0 top-0 w-0.5 bg-white/90 shadow-[0_0_20px_rgba(0,0,0,0.25)]" style={{ left: `${position}%`, transform: "translateX(-50%)" }}>
        <div className="absolute left-1/2 top-1/2 flex h-11 w-11 min-h-[44px] min-w-[44px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white shadow-luxury-soft">
          <ChevronLeft className="-mr-1 h-4 w-4 text-foreground" />
          <ChevronRight className="-ml-1 h-4 w-4 text-foreground" />
        </div>
      </div>
      <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-white/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur-sm">
        {afterLabel}
      </span>
    </div>
  );
};

type BeforeAfterSectionProps = {
  items?: PublishedBeforeAfterItem[];
};

const BeforeAfterSection = ({ items: providedItems }: BeforeAfterSectionProps) => {
  const { language } = useLanguage();
  const { data: fetchedItems } = usePublishedBeforeAfterItems(language, { enabled: providedItems === undefined });
  const publishedItems = providedItems === undefined ? fetchedItems : providedItems;
  const dynamicComparisons = useMemo(() => {
    if (!publishedItems?.length) return [];
    return publishedItems.map((item) => ({
      before: item.before_image_url,
      after: item.after_image_url,
      title: item.title,
      location: item.location,
      desc: item.description,
    }));
  }, [publishedItems]);
  const sectionCopy = {
    ...homeSectionText.beforeAfter[language],
    comparisons: homeSectionText.beforeAfter[language].comparisons.map((item, index) => ({
      ...item,
      ...(fallbackComparisonMedia[index] || {}),
    })),
  };

  if (!dynamicComparisons.length) return null;

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

        <div className="card-grid grid-cols-1 gap-6 md:grid-cols-3">
          {dynamicComparisons.map((item, i) => (
            <Reveal key={item.title} delay={i * 120}>
              <div className="card-equal luxury-card overflow-hidden hover-lift">
                <BeforeAfterSlider
                  before={item.before}
                  after={item.after}
                  alt={item.title}
                  beforeLabel={sectionCopy.before}
                  afterLabel={sectionCopy.after}
                  beforeAltTemplate={sectionCopy.beforeAlt}
                  afterAltTemplate={sectionCopy.afterAlt}
                />
                <div className="card-equal-body p-5">
                  <h3 className="text-limit-2 font-display text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-limit-1 text-muted-foreground text-xs mb-2">{translateDisplayText(item.location, language)}</p>
                  <p className="text-limit-3 text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
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
