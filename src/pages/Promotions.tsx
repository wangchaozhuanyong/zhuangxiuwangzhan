import { ArrowRight, BadgePercent, ShieldCheck } from "lucide-react";
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
    <main className="pt-site-header">
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
      />

      <section className="forest-chapter forest-offers-chapter">
        <div className="forest-offer-stack">
          {offers.map((offer, index) => (
            <article key={`${offer.title}-${index}`} className="forest-offer-panel" style={{ top: `calc(6rem + ${index * 1.25}rem)` }}>
              <div className="forest-offer-panel__icon">
                <BadgePercent aria-hidden="true" />
              </div>
              <div className="forest-offer-panel__copy">
                <p className="forest-eyebrow">{t.available}</p>
                <h2>{offer.title}</h2>
                <p>{offer.description}</p>
              </div>
              <div className="forest-offer-panel__terms">
                <p><ShieldCheck aria-hidden="true" />{t.conditions}</p>
                <span>{offer.terms}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="forest-offer-actions">
          <p>{pageContent?.cta_description || t.intro}</p>
          <div>
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
        </div>
      </section>
    </main>
  );
};

export default Promotions;
