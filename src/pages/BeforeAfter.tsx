import { DeferredSmartImage } from "@/components/DeferredSmartImage";
import ImageComparisonSlider from "@/components/ImageComparisonSlider";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import PageMeta from "@/components/PageMeta";
import { ForestContentState } from "@/components/forest/ForestPagePrimitives";
import Link from "@/components/LocalizedLink";
import { SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedBeforeAfterItems } from "@/hooks/usePublishedContent";
import { beforeAfterFallbackMedia } from "@/data/beforeAfterFallback";
import { useLanguage } from "@/i18n/LanguageContext";
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
  const imageAlt = item.alt || item.title;

  return (
    <article className="scheme-a-transformation" data-cinematic-section>
      <header className="scheme-a-transformation__copy">
        <p className="scheme-a-transformation__index">{String(index + 1).padStart(2, "0")}</p>
        <div>
          <h2>{item.title}</h2>
          <p className="scheme-a-transformation__description">{t.itemDescription}</p>
        </div>
      </header>

      <ImageComparisonSlider
        className="scheme-a-transformation__compare"
        positionVariable="--compare-position"
        initialValue={index % 2 === 0 ? 55 : 48}
        ariaLabel={t.compareAria(item.title)}
      >
        <DeferredSmartImage
          src={item.after_image_url}
          alt={`${imageAlt} - ${t.after}`}
          className="scheme-a-transformation__image scheme-a-transformation__image--after"
          placeholderClassName="scheme-a-transformation__image-shell"
          width={1600}
          height={1000}
          quality={86}
          sizes="(max-width: 767px) 100vw, 88vw"
          rootMargin="900px 0px"
        />
        <div className="scheme-a-transformation__before" aria-hidden="true">
          <DeferredSmartImage
            src={item.before_image_url}
            alt=""
            className="scheme-a-transformation__image scheme-a-transformation__image--before"
            placeholderClassName="scheme-a-transformation__image-shell"
            width={1600}
            height={1000}
            quality={86}
            sizes="(max-width: 767px) 100vw, 88vw"
            rootMargin="900px 0px"
          />
        </div>

        <span className="scheme-a-transformation__label scheme-a-transformation__label--before">
          {t.before}
        </span>
        <span className="scheme-a-transformation__label scheme-a-transformation__label--after">
          {t.after}
        </span>
        <span className="scheme-a-transformation__divider" aria-hidden="true" />
        <span className="scheme-a-transformation__handle" aria-hidden="true">
          ↔
        </span>
      </ImageComparisonSlider>
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
    <main className="fc-route-page scheme-a-before-after-route">
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

      <SchemeARouteHero kind="compare" image={hero.desktop} mobileImage={hero.mobile} imageAlt={t.heroAlt} label={t.heroLabel} title={t.heroTitle} description={t.heroDescription} />

      <SchemeASection title={t.sectionTitle} description={t.sectionDescription} className="scheme-a-transformations">
        {isLoading ? <ForestContentState variant="loading" description={t.loading} /> : null}
        {!isLoading && isError ? (
          <ForestContentState variant="error" description={t.error} onRetry={() => void refetch()} />
        ) : null}
        {!isLoading && !isError ? (
          <div className="scheme-a-transformation-list">
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
        <div className="fc-route-action-panel"><h2>{t.ctaTitle}</h2><p>{t.ctaDescription}</p><div><Link to="/quote#quote-form">{t.ctaPrimary}</Link><Link to="/contact">{t.ctaSecondary}</Link></div></div>
      </SchemeASection>
    </main>
  );
}
