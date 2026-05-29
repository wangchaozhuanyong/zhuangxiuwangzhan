/**
 * Hero banner component for sub-pages.
 */

import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";

interface HeroBannerProps {
  image: string;
  imageAlt: string;
  label?: string;
  title: string;
  description?: string;
}

const HeroBanner = ({ image, imageAlt, label, title, description }: HeroBannerProps) => {
  return (
    <section className="relative min-h-[45vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <SmartImage
          src={image}
          alt={imageAlt}
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          width={1920}
          height={800}
        />
        <div className="absolute inset-0 media-readable-overlay" />
      </div>
      <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
        {label && (
          <p
            className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4 text-gold"
          >
            {label}
          </p>
        )}
        <h1
          className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg text-on-media"
        >
          {title}
        </h1>
        {description && (
          <p
            className="max-w-xl text-base md:text-lg leading-relaxed text-on-media-muted"
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;
