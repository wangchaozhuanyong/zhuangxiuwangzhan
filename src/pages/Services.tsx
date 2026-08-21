import { useMemo, useState } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import {
  SchemeAContentState,
  SchemeAFilter,
  SchemeAFaqList,
  SchemeAListingGrid,
  SchemeARouteHero,
  SchemeASection,
  type SchemeAListingItem,
} from "@/components/scheme-a/SchemeARoutePrimitives";
import { servicesData } from "@/data/services";
import { usePublishedServices, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";
import { servicesPageText } from "@/i18n/servicesPageText";
import { schemeARouteText } from "@/i18n/schemeAText";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

type ServiceGroup = "all" | "residential" | "commercial" | "specialty";

const groupForService = (slug: string): Exclude<ServiceGroup, "all"> => {
  if (/office|shop|warehouse|commercial|retail|clinic/.test(slug)) return "commercial";
  if (/design|approval|coating|permit|drawing/.test(slug)) return "specialty";
  return "residential";
};

export default function Services() {
  const { language } = useLanguage();
  const copy = servicesPageText[language];
  const routeText = schemeARouteText[language];
  const [group, setGroup] = useState<ServiceGroup>("all");
  const { data: pageContent } = usePublishedSitePage(language, "services");
  const { data: publishedServices, isLoading, isError, refetch } = usePublishedServices(language);
  const services = publishedServices?.length ? publishedServices : servicesData;
  const visible = group === "all" ? services : services.filter((service) => groupForService(service.slug) === group);
  const hero = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.services);

  const items = useMemo<SchemeAListingItem[]>(() => visible.map((service) => ({
    id: String(service.id || service.slug),
    title: translateDisplayText(service.title, language),
    description: translateDisplayText(service.summary || service.description || "", language),
    meta: copy.groups[groupForService(service.slug)].short,
    image: service.image || servicesData.find((fallback) => fallback.slug === service.slug)?.image || pageHeroImages.services.desktop,
    imageAlt: translateDisplayText(service.title, language),
    href: `/services/${service.slug}`,
  })), [copy.groups, language, visible]);

  return (
    <main className="fc-route-page">
      <PageMeta title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords || copy.metaKeywords} canonicalPath="/services" />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbServices, url: "/services" }]} />
      <SchemeARouteHero
        kind="listing"
        image={hero.desktop}
        mobileImage={hero.mobile}
        imageAlt={pageContent?.alt || copy.heroAlt}
        label={pageContent?.subtitle || copy.eyebrow}
        title={pageContent?.title || copy.title}
        description={pageContent?.description || copy.intro}
      />
      <SchemeASection title={copy.directoryTitle} description={copy.directoryText}>
        <SchemeAFilter
          items={[
            { value: "all", label: copy.allServices },
            { value: "residential", label: copy.groups.residential.short },
            { value: "commercial", label: copy.groups.commercial.short },
            { value: "specialty", label: copy.groups.specialty.short },
          ]}
          value={group}
          onChange={(value) => setGroup(value as ServiceGroup)}
          ariaLabel={copy.directoryTitle}
        />
        {isLoading ? <SchemeAContentState>{routeText.servicesLoading}</SchemeAContentState> : null}
        {isError ? <SchemeAContentState action={<button type="button" onClick={() => void refetch()}>{routeText.reload}</button>}>{routeText.servicesError}</SchemeAContentState> : null}
        {!isLoading && !isError ? <SchemeAListingGrid items={items} actionLabel={copy.details} /> : null}
      </SchemeASection>
      <SchemeASection title={copy.selectorTitle} description={copy.selectorText}>
        <ol className="fc-route-number-list">
          {copy.selectorItems.map((item, index) => <li key={item.title}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{item.title}</strong><span>{item.desc}</span></div></li>)}
        </ol>
      </SchemeASection>
      <SchemeASection title={copy.faqTitle}>
        <SchemeAFaqList items={copy.faqs.map((faq) => ({ question: faq.q, answer: faq.a }))} />
      </SchemeASection>
    </main>
  );
}
