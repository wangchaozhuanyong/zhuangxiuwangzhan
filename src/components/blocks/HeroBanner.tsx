/**
 * Hero banner component for sub-pages.
 */

import { ArrowLeft } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import SmartImage from "@/components/SmartImage";

interface HeroBannerProps {
  image: string;
  imageAlt: string;
  label?: string;
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
}

const HeroBanner = ({ image, imageAlt, label, title, description, backTo, backLabel }: HeroBannerProps) => {
  return (
    <section className="page-hero">
      <div className="page-hero__media absolute inset-0">
        <SmartImage
          src={image}
          alt={imageAlt}
          className="page-hero__image h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          width={1920}
          height={800}
        />
        <div className="page-hero__overlay absolute inset-0 media-readable-overlay" aria-hidden="true" />
      </div>
      <div className="page-hero__content site-container">
        {backTo && backLabel ? (
          <LocalizedLink
            to={backTo}
            className="page-hero__back mb-6 inline-flex items-center gap-1.5 text-sm text-on-media-muted transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </LocalizedLink>
        ) : null}
        {label ? (
          <p className="page-hero__label mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{label}</p>
        ) : null}
        <h1 className="page-hero__title heading-safe mb-4 max-w-2xl text-3xl font-bold text-on-media md:text-5xl">{title}</h1>
        {description ? (
          <p className="page-hero__description prose-safe max-w-xl text-base leading-relaxed text-on-media-muted md:text-lg">{description}</p>
        ) : null}
      </div>
    </section>
  );
};

export default HeroBanner;
