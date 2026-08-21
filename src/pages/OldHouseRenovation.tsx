import Link from "@/components/LocalizedLink";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import {
  SchemeAFaqList,
  SchemeAGallery,
  SchemeANumberList,
  SchemeARouteHero,
  SchemeASection,
} from "@/components/scheme-a/SchemeARoutePrimitives";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import beforeAfterImg from "@/assets/old-house-before-after.webp";
import { trackCtaClick } from "@/lib/analytics";
import { pageHeroImages } from "@/lib/pageHeroImages";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";

const oldHouseServiceImg = "/images/services/old-house-renovation.webp";

const OldHouseRenovation = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = oldHouseRenovationPageText[language];

  return (
    <main className="fc-route-page">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/services/old-house" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }, { name: t.breadcrumbCurrent, url: "/services/old-house" }]} />

      <SchemeARouteHero kind="detail" image={pageHeroImages.oldHouse.desktop} mobileImage={pageHeroImages.oldHouse.mobile} imageAlt={t.heroAlt} label={t.label} title={t.title} description={t.description} />

      <SchemeASection title={t.introTitle} description={t.intro.join(" ")}>
        <SchemeAGallery images={[{ src: beforeAfterImg, alt: t.beforeAfterAlt }, { src: oldHouseServiceImg, alt: t.serviceAlt }]} />
        <div className="fc-route-tagline">{t.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
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

      <SchemeASection title={t.faqTitle} description={t.faqDescription}>
        <SchemeAFaqList items={t.faqs.map((item) => ({ question: item.q, answer: item.a }))} />
        <div className="fc-route-action-panel">
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaDescription}</p>
          <div>
            <Link to="/quote" onClick={() => trackCtaClick("quote", "old_house_cta", { destination: "/quote" })}>{t.assessment}</Link>
            <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "old_house_cta", { destination: "whatsapp" })}><WhatsAppIcon />{t.whatsapp}</a>
          </div>
        </div>
        <nav className="fc-route-related-links" aria-label={t.breadcrumbCurrent}>{t.internalLinks.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}</nav>
      </SchemeASection>
    </main>
  );
};

export default OldHouseRenovation;
