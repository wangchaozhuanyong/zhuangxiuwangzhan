import { ArrowRight } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { SchemeANumberList, SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { promotionsPageText } from "@/i18n/newClientPageText";
import { schemeARouteText } from "@/i18n/schemeAText";
import { trackCtaClick } from "@/lib/analytics";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { toRecord, toText } from "@/lib/recordUtils";

export default function Promotions() {
  const { language } = useLanguage();
  const copy = promotionsPageText[language];
  const routeText = schemeARouteText[language];
  const settings = useSiteSettings();
  const { data: pageContent } = usePublishedSitePage(language, "promotions");
  const hero = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.promotions);
  const cmsOffers = (pageContent?.items || []).map(toRecord).map((item) => ({ title: toText(item.title), description: toText(item.description), terms: toText(item.terms) })).filter((item) => item.title && item.description && item.terms);
  const offers = cmsOffers.length ? cmsOffers : copy.defaultOffers;

  return (
    <main className="fc-route-page">
      <PageMeta title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords} canonicalPath="/promotions" />
      <JsonLdBreadcrumb items={[{ name: routeText.home, url: "/" }, { name: routeText.promotions, url: "/promotions" }]} />
      <SchemeARouteHero kind="listing" image={hero.desktop} mobileImage={hero.mobile} imageAlt={pageContent?.alt || copy.title} label={pageContent?.subtitle || copy.eyebrow} title={pageContent?.title || copy.title} description={pageContent?.description || copy.intro} />
      <SchemeASection title={copy.listTitle} description={copy.offerCount(offers.length)}>
        <SchemeANumberList items={offers.map((offer) => ({ title: offer.title, description: `${offer.description} · ${copy.conditions}：${offer.terms}` }))} />
        <div className="fc-route-action-panel">
          <h2>{copy.actionTitle}</h2>
          <div>
            <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "promotions", { destination: "whatsapp" })}><WhatsAppIcon aria-hidden="true" />{copy.enquire}</a>
            <LocalizedLink to="/quote#quote-form" onClick={() => trackCtaClick("quote", "promotions", { destination: "/quote#quote-form" })}>{copy.quote}<ArrowRight aria-hidden="true" /></LocalizedLink>
          </div>
        </div>
      </SchemeASection>
    </main>
  );
}
