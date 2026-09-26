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
import { buildQuotePath, quoteProjectTypeFromServiceSlug } from "@/lib/quoteContext";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";
import { getServiceContextLinks } from "@/i18n/serviceContextLinks";

const OldHouseRenovation = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = oldHouseRenovationPageText[language];
  const contextLinks = getServiceContextLinks("old-house", language);
  const quotePath = buildQuotePath({
    source: "service",
    title: t.title,
    projectType: quoteProjectTypeFromServiceSlug("old-house", t.title),
  });

  return (
    <main className="fc-route-page scheme-a-old-house-route">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/services/old-house" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }, { name: t.breadcrumbCurrent, url: "/services/old-house" }]} />
      <JsonLdService name={t.title} description={t.description} />
      <JsonLdFAQ faqs={t.faqs.map((item) => ({ question: item.q, answer: item.a }))} />

      <SchemeARouteHero kind="detail" image={pageHeroImages.oldHouse.desktop} imageSourceWidth={pageHeroImages.oldHouse.desktopWidth} tabletImage={pageHeroImages.oldHouse.tablet} tabletImageSourceWidth={pageHeroImages.oldHouse.tabletWidth} mobileImage={pageHeroImages.oldHouse.mobile} mobileImageSourceWidth={pageHeroImages.oldHouse.mobileWidth} imagePosition={pageHeroImages.oldHouse.imagePosition} imageAlt={t.heroAlt} label={[t.label, mediaLabels[language].renderingConcept].join(" · ")} title={t.title} description={t.description} actions={<Link to={quotePath} onClick={() => trackCtaClick("quote", "old_house_hero", { destination: quotePath })}>{t.assessment}</Link>} />

      <SchemeASection title={t.introTitle} description={t.intro.join(" ")}>
        <div className="fc-route-tagline">{t.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </SchemeASection>

      <SchemeASection title={t.comparisonsTitle} description={t.comparisonsDescription} className="scheme-a-transformations">
        <SchemeANumberList items={t.comparisons.map((comparison) => ({ title: comparison.title, description: comparison.description }))} />
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
          {t.prices.map((item) => (
            <article key={item.type} className="fc-route-budget-card">
              <header className="fc-route-budget-card__head">
                <h3>{item.type}</h3>
                <span className="fc-route-budget-card__tag">{item.range}</span>
              </header>
              <p>{item.desc}</p>
            </article>
          ))}
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
            <Link to={quotePath} onClick={() => trackCtaClick("quote", "old_house_cta", { destination: quotePath })}>{t.assessment}</Link>
            <a href={settings.whatsapp_url(t.whatsappMessage)} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "old_house_cta", { destination: "whatsapp" })}><WhatsAppIcon />{t.whatsapp}</a>
          </div>
        </div>
        <nav className="fc-route-related-links" aria-label={t.breadcrumbCurrent}>{t.internalLinks.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}</nav>
      </SchemeASection>
    </main>
  );
};

export default OldHouseRenovation;
