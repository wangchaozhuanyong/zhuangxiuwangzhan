import { ArrowRight, ShieldCheck } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { promotionsPageText } from "@/i18n/newClientPageText";
import { trackCtaClick } from "@/lib/analytics";
import { toRecord, toText } from "@/lib/recordUtils";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import HeroBanner from "@/components/blocks/HeroBanner";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

const Promotions = () => {
  const { language } = useLanguage();
  const t = promotionsPageText[language];
  const settings = useSiteSettings();
  const { data: pageContent } = usePublishedSitePage(language, "promotions");
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.promotions);
  const cmsOffers = (pageContent?.items || [])
    .map(toRecord)
    .map((item) => ({
      title: toText(item.title),
      description: toText(item.description),
      terms: toText(item.terms),
    }))
    .filter((item) => item.title && item.description && item.terms);
  const offers = cmsOffers.length ? cmsOffers : t.defaultOffers;

  return (
    <main className="forest-promotions-page pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords}
        canonicalPath="/promotions"
      />
      <JsonLdBreadcrumb items={[{ name: language === "zh" ? "首页" : "Home", url: "/" }, { name: language === "zh" ? "优惠活动" : "Promotions", url: "/promotions" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.title}
        label={pageContent?.subtitle || t.eyebrow}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.intro}
        variant="compact"
      />

      <section className="forest-chapter forest-offers-chapter" aria-labelledby="promotion-options-heading">
        <div className="forest-offers-sheet">
          <header className="forest-offers-index">
            <div className="forest-offers-index__copy">
              <p className="forest-eyebrow">{t.listEyebrow}</p>
              <h2 id="promotion-options-heading">{t.listTitle}</h2>
            </div>
            <p className="forest-offers-index__count">{t.offerCount(offers.length)}</p>
          </header>

          <div className="forest-offer-list">
            {offers.map((offer, index) => (
              <article
                key={`${offer.title}-${index}`}
                className="forest-offer-row"
                aria-labelledby={`promotion-offer-${index}`}
              >
                <span className="forest-offer-row__number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="forest-offer-row__copy">
                  <h3 id={`promotion-offer-${index}`}>{offer.title}</h3>
                  <p>{offer.description}</p>
                </div>
                <div className="forest-offer-row__terms">
                  <p><ShieldCheck aria-hidden="true" />{t.conditions}</p>
                  <span>{offer.terms}</span>
                </div>
              </article>
            ))}
          </div>

          <footer className="forest-offer-actions" aria-labelledby="promotion-action-heading">
            <h2 id="promotion-action-heading">{t.actionTitle}</h2>
            <div className="forest-offer-actions__buttons">
              <a
                href={settings.whatsapp_url()}
                target="_blank"
                rel="noopener noreferrer"
                className="forest-button forest-button--outline"
                onClick={() => trackCtaClick("whatsapp", "promotions", { destination: "whatsapp" })}
              >
                <WhatsAppIcon className="h-4 w-4" /> {t.enquire}
              </a>
              <LocalizedLink
                to="/quote"
                className="forest-button forest-button--light"
                onClick={() => trackCtaClick("quote", "promotions", { destination: "/quote" })}
              >
                {t.quote} <ArrowRight className="h-4 w-4" />
              </LocalizedLink>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default Promotions;
