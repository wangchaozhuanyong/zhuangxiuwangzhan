/**
 * Reusable Hero Banner component for sub-pages.
 * Used by: About, Services, Projects, Materials, Process, FAQ, Contact, Quote
 */

import Reveal from "@/components/Reveal";

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
        <img
          src={image}
          alt={imageAlt}
          className="w-full h-full object-cover"
          loading="eager"
          width={1920}
          height={800}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      </div>
      <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
        {label && (
          <p
            className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4"
            style={{ color: "hsl(var(--gold))" }}
          >
            {label}
          </p>
        )}
        <h1
          className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg"
          style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="max-w-xl text-base md:text-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;
