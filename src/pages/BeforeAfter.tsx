import { useState, type CSSProperties } from "react";
import { MapPin } from "lucide-react";
import CTABanner from "@/components/blocks/CTABanner";
import { DeferredSmartImage } from "@/components/DeferredSmartImage";
import HeroBanner from "@/components/blocks/HeroBanner";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import PageMeta from "@/components/PageMeta";
import { ForestContentState, ForestSectionHeading } from "@/components/forest/ForestPagePrimitives";
import { usePublishedBeforeAfterItems } from "@/hooks/usePublishedContent";
import { beforeAfterFallbackMedia } from "@/data/beforeAfterFallback";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";
import type { PublishedBeforeAfterItem } from "@/lib/homeContentApi";
import { pageHeroImages } from "@/lib/pageHeroImages";
import { beforeAfterPageText } from "@/i18n/beforeAfterPageText";

function BeforeAfterComparison({
  item,
  index,
  language,
}: {
  item: PublishedBeforeAfterItem;
  index: number;
  language: "en" | "zh";
}) {
  const t = beforeAfterPageText[language];
  const [position, setPosition] = useState(index % 2 === 0 ? 55 : 48);
  const location = translateDisplayText(item.location, language);
  const imageAlt = item.alt || item.title;

  return (
    <article className="forest-comparison-story">
      <div className="forest-comparison-story__copy">
        <h2>{item.title}</h2>
        {location ? (
          <p className="forest-comparison-story__location">
            <MapPin aria-hidden="true" size={16} strokeWidth={1.7} />
            <span>{location}</span>
          </p>
        ) : null}
        {item.description ? <p className="forest-comparison-story__description">{item.description}</p> : null}
      </div>

      <div
        className="forest-comparison-slider"
        style={{ "--compare-position": `${position}%` } as CSSProperties}
      >
        <DeferredSmartImage
          src={item.after_image_url}
          alt={`${imageAlt} - ${t.after}`}
          className="forest-comparison-slider__image forest-comparison-slider__image--after"
          placeholderClassName="forest-comparison-slider__image-shell"
          width={1200}
          height={800}
          quality={82}
          sizes="(max-width: 767px) 100vw, 66vw"
          rootMargin="900px 0px"
        />
        <div className="forest-comparison-slider__before" aria-hidden="true">
          <DeferredSmartImage
            src={item.before_image_url}
            alt=""
            className="forest-comparison-slider__image forest-comparison-slider__image--before"
            placeholderClassName="forest-comparison-slider__image-shell"
            width={1200}
            height={800}
            quality={82}
            sizes="(max-width: 767px) 100vw, 66vw"
            rootMargin="900px 0px"
          />
        </div>

        <span className="forest-comparison-slider__label forest-comparison-slider__label--before">
          {t.before}
        </span>
        <span className="forest-comparison-slider__label forest-comparison-slider__label--after">
          {t.after}
        </span>
        <span className="forest-comparison-slider__divider" aria-hidden="true" />
        <span className="forest-comparison-slider__handle" aria-hidden="true">
          ↔
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={position}
          aria-label={t.compareAria(item.title)}
          aria-valuetext={`${position}%`}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
      </div>
    </article>
  );
}

export default function BeforeAfter() {
  const { language } = useLanguage();
  const t = beforeAfterPageText[language];
  const { data: items = [], isLoading, isError, refetch } = usePublishedBeforeAfterItems(language);
  const fallbackItems: readonly PublishedBeforeAfterItem[] = beforeAfterFallbackMedia.map((media, index) => ({
    ...media,
    ...t.fallbackItems[index],
  }));
  const displayItems: readonly PublishedBeforeAfterItem[] = items.length
    ? items
    : fallbackItems;
  const hero = pageHeroImages.projects;
  const ogImage = displayItems[0]?.after_image_url || hero.desktop;

  return (
    <main className="pt-site-header">
      <PageMeta
        title={t.metaTitle}
        description={t.metaDescription}
        keywords={t.metaKeywords}
        canonicalPath="/before-after"
        ogImage={ogImage}
      />
      <JsonLdBreadcrumb
        items={[
          { name: t.breadcrumbHome, url: "/" },
          { name: t.breadcrumbPage, url: "/before-after" },
        ]}
      />

      <HeroBanner
        image={hero.desktop}
        imageMobile={hero.mobile}
        imageAlt={t.heroAlt}
        label={t.heroLabel}
        title={t.heroTitle}
        description={t.heroDescription}
      />

      <section className="forest-chapter forest-before-after-page">
        <ForestSectionHeading
          eyebrow={t.heroLabel}
          title={t.sectionTitle}
          description={t.sectionDescription}
        />

        {isLoading ? <ForestContentState variant="loading" description={t.loading} /> : null}
        {!isLoading && isError ? (
          <ForestContentState variant="error" description={t.error} onRetry={() => void refetch()} />
        ) : null}
        {!isLoading && !isError ? (
          <div className="forest-comparison-list">
            {displayItems.map((item, index) => (
              <BeforeAfterComparison
                key={item.id || `${item.title}-${index}`}
                item={item}
                index={index}
                language={language}
              />
            ))}
          </div>
        ) : null}
      </section>

      <CTABanner
        title={t.ctaTitle}
        description={t.ctaDescription}
        quoteLabel={t.ctaPrimary}
        quotePath="/quote"
        whatsappLabel={t.ctaSecondary}
        whatsappSource="Before After CTA"
      />
    </main>
  );
}
