import { DeferredSmartImage } from "@/components/DeferredSmartImage";
import ImageComparisonSlider from "@/components/ImageComparisonSlider";
import Link from "@/components/LocalizedLink";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb, JsonLdFAQ, JsonLdService } from "@/components/JsonLd";
import {
  SchemeAFaqList,
  SchemeALinkGrid,
  SchemeANumberList,
  SchemeARouteHero,
  SchemeASection,
} from "@/components/scheme-a/SchemeARoutePrimitives";
import { useLanguage } from "@/i18n/LanguageContext";
import { mediaLabels } from "@/i18n/mediaLabels";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { trackCtaClick } from "@/lib/analytics";
import { pageHeroImages } from "@/lib/pageHeroImages";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";
import { getServiceContextLinks } from "@/i18n/serviceContextLinks";

const oldHouseComparisonMedia = {
  "terrace-living": {
    before: "/images/before-after/old-terrace/living-before.webp",
    after: "/images/before-after/old-terrace/living-after.webp",
  },
  "terrace-kitchen": {
    before: "/images/before-after/old-terrace/kitchen-before.webp",
    after: "/images/before-after/old-terrace/kitchen-after.webp",
  },
  "terrace-bathroom": {
    before: "/images/before-after/old-terrace/bathroom-before.webp",
    after: "/images/before-after/old-terrace/bathroom-after.webp",
  },
} as const;

const OldHouseRenovation = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = oldHouseRenovationPageText[language];
  const contextLinks = getServiceContextLinks("old-house", language);

  return (
    <main className="fc-route-page scheme-a-old-house-route">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/services/old-house" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }, { name: t.breadcrumbCurrent, url: "/services/old-house" }]} />
      <JsonLdService name={t.title} description={t.description} />
      <JsonLdFAQ faqs={t.faqs.map((item) => ({ question: item.q, answer: item.a }))} />

      <SchemeARouteHero kind="detail" image={pageHeroImages.oldHouse.desktop} imageSourceWidth={pageHeroImages.oldHouse.desktopWidth} tabletImage={pageHeroImages.oldHouse.tablet} tabletImageSourceWidth={pageHeroImages.oldHouse.tabletWidth} mobileImage={pageHeroImages.oldHouse.mobile} mobileImageSourceWidth={pageHeroImages.oldHouse.mobileWidth} imagePosition={pageHeroImages.oldHouse.imagePosition} imageAlt={t.heroAlt} label={[t.label, mediaLabels[language].renderingConcept].join(" · ")} title={t.title} description={t.description} actions={<Link to="/quote#quote-form" onClick={() => trackCtaClick("quote", "old_house_hero", { destination: "/quote#quote-form" })}>{t.assessment}</Link>} />

      <SchemeASection title={t.introTitle} description={t.intro.join(" ")}>
        <div className="fc-route-tagline">{t.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </SchemeASection>

      <SchemeASection title={t.comparisonsTitle} description={t.comparisonsDescription} className="scheme-a-transformations">
        <div className="scheme-a-transformation-list">
          {t.comparisons.map((comparison, index) => {
            const media = oldHouseComparisonMedia[comparison.id];

            return (
              <article key={comparison.id} className="scheme-a-transformation" data-cinematic-section>
                <header className="scheme-a-transformation__copy">
                  <p className="scheme-a-transformation__index">{String(index + 1).padStart(2, "0")}</p>
                  <div>
                    <h2>{comparison.title}</h2>
                    <p className="scheme-a-transformation__location">{comparison.meta}</p>
                    <p className="scheme-a-transformation__description">{comparison.description}</p>
                  </div>
                </header>

                <ImageComparisonSlider
                  className="scheme-a-transformation__compare"
                  positionVariable="--compare-position"
                  initialValue={index % 2 === 0 ? 52 : 48}
                  min={8}
                  max={92}
                  ariaLabel={t.compareAria(comparison.title)}
                >
                  <DeferredSmartImage
                    src={media.after}
                    alt={comparison.afterAlt}
                    className="scheme-a-transformation__image scheme-a-transformation__image--after"
                    placeholderClassName="scheme-a-transformation__image-shell"
                    width={1600}
                    height={900}
                    sourceWidth={1600}
                    candidateWidths={[360, 560, 720, 900, 1200, 1600]}
                    sizes="(max-width: 767px) 100vw, 88vw"
                    quality={86}
                    rootMargin="900px 0px"
                  />
                  <div className="scheme-a-transformation__before" aria-hidden="true">
                    <DeferredSmartImage
                      src={media.before}
                      alt=""
                      className="scheme-a-transformation__image scheme-a-transformation__image--before"
                      placeholderClassName="scheme-a-transformation__image-shell"
                      width={1600}
                      height={900}
                      sourceWidth={1600}
                      candidateWidths={[360, 560, 720, 900, 1200, 1600]}
                      sizes="(max-width: 767px) 100vw, 88vw"
                      quality={86}
                      rootMargin="900px 0px"
                    />
                  </div>
                  <span className="scheme-a-transformation__label scheme-a-transformation__label--before">{t.before}</span>
                  <span className="scheme-a-transformation__label scheme-a-transformation__label--after">{t.after}</span>
                  <span className="scheme-a-transformation__divider" aria-hidden="true" />
                  <span className="scheme-a-transformation__handle" aria-hidden="true">↔</span>
                </ImageComparisonSlider>
              </article>
            );
          })}
        </div>
      </SchemeASection>

      <SchemeASection title={t.challengesTitle} description={t.challengesDescription}>
        <SchemeANumberList items={t.challenges.map((item) => ({ title: item.title, description: item.desc }))} />
      </SchemeASection>

      <SchemeASection title={t.scopeTitle} description={t.scopeDescription}>
        <SchemeANumberList items={t.scope.map((item) => ({ title: item }))} />
      </SchemeASection>

      <SchemeASection title={t.processTitle} description={t.processDescription}>
        <SchemeANumberList items={t.process.map((item) => ({ title: item.title, description: item.desc }))} />
      </SchemeASection>

      <SchemeASection title={t.priceTitle} description={t.priceDescription}>
        <div className="fc-route-budget-grid">
          {t.prices.map((item, index) => <article key={item.type}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.type}</h3><strong>{item.range}</strong><p>{item.desc}</p></article>)}
        </div>
      </SchemeASection>

      <SchemeASection title={t.resourceTitle} description={t.resourceDescription}>
        <SchemeALinkGrid items={contextLinks} actionLabel={t.resourceAction} />
      </SchemeASection>

      <SchemeASection title={t.faqTitle} description={t.faqDescription}>
        <SchemeAFaqList items={t.faqs.map((item) => ({ question: item.q, answer: item.a }))} />
        <div className="fc-route-action-panel">
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaDescription}</p>
          <div>
            <Link to="/quote#quote-form" onClick={() => trackCtaClick("quote", "old_house_cta", { destination: "/quote#quote-form" })}>{t.assessment}</Link>
            <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "old_house_cta", { destination: "whatsapp" })}><WhatsAppIcon />{t.whatsapp}</a>
          </div>
        </div>
        <nav className="fc-route-related-links" aria-label={t.breadcrumbCurrent}>{t.internalLinks.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}</nav>
      </SchemeASection>
    </main>
  );
};

export default OldHouseRenovation;
