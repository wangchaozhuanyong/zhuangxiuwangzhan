import { ArrowUpRight } from "lucide-react";
import { useParams } from "react-router-dom";
import { JsonLdBreadcrumb, JsonLdFAQ, JsonLdService } from "@/components/JsonLd";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { SchemeAFaqList, SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import pageText from "@/components/services/serviceAreaPageText.json";
import { usePublishedServiceAreaBySlug, usePublishedServiceBySlug } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { isMalayContentReady } from "@/i18n/localizedContent";
import { locationPageText } from "@/i18n/locationPageText";
import { mediaLabels } from "@/i18n/mediaLabels";
import { isLanguage } from "@/i18n/routes";
import { pageHeroImages } from "@/lib/pageHeroImages";
import { buildQuotePath, quoteProjectTypeFromServiceSlug } from "@/lib/quoteContext";
import { findServiceAreaRoute } from "@/lib/serviceAreaRoutes";
import { stripHtml } from "@/lib/text";
import NotFound from "@/pages/NotFound";

const hero = pageHeroImages.services;

export default function ServiceAreaPage() {
  const { lang, area, service } = useParams();
  const route = isLanguage(lang) ? findServiceAreaRoute(area, service) : null;
  const { language } = useLanguage();
  const { data: parentArea } = usePublishedServiceAreaBySlug(route ? area : undefined, language);
  const { data: parentService } = usePublishedServiceBySlug(route?.parentService, language);

  if (!route || !area) return <NotFound />;

  const page = pageText[route.path][language];
  const copy = locationPageText[language];
  const areaPath = `/locations/${area}`;
  const servicePath = `/services/${route.parentService}`;
  const parentServiceName = language !== "ms" || isMalayContentReady(parentService)
    ? stripHtml(parentService?.title || "")
    : "";
  const areaName = language === "en" ? stripHtml(parentArea?.name || "") || page.area : page.area;
  const breadcrumbs = [
    { name: copy.breadcrumbHome, url: "/" },
    { name: copy.breadcrumbLocations, url: "/locations" },
    { name: areaName, url: areaPath },
    { name: page.service, url: route.path },
  ];
  const faqs = [{ question: page.question, answer: page.answer }];
  const quotePath = buildQuotePath({
    source: "service",
    title: page.heading,
    projectType: quoteProjectTypeFromServiceSlug(route.parentService, page.service),
    location: page.area,
  });

  return (
    <main className="fc-route-page">
      <PageMeta title={page.title} description={page.description} canonicalPath={route.path} keywords={page.keywords} />
      <JsonLdService name={page.entityName} description={page.description} areaServed={page.area} />
      <JsonLdFAQ faqs={faqs} />
      <JsonLdBreadcrumb items={breadcrumbs} />
      <SchemeARouteHero
        kind="detail"
        image={hero.desktop}
        imageSourceWidth={hero.desktopWidth}
        tabletImage={hero.tablet}
        tabletImageSourceWidth={hero.tabletWidth}
        mobileImage={hero.mobile}
        mobileImageSourceWidth={hero.mobileWidth}
        imagePosition={hero.imagePosition}
        imageAlt={mediaLabels[language].renderingConcept}
        imageCaption={mediaLabels[language].renderingConcept}
        label={copy.breadcrumbLocations}
        title={page.heading}
        description={page.description}
        actions={<Link to={quotePath}>{copy.quote}<ArrowUpRight aria-hidden="true" /></Link>}
      />
      <SchemeASection title={copy.faqTitle(page.area)}>
        <SchemeAFaqList items={faqs} />
      </SchemeASection>
      <SchemeASection>
        <nav className="fc-route-related-links" aria-label={copy.resourceTitle(page.area)}>
          <ol className="flex flex-wrap items-center gap-2">
            {breadcrumbs.slice(0, -1).map((item) => (
              <li key={item.url}>
                <Link to={item.url}>{item.name}</Link>
                <span aria-hidden="true" className="ml-2">›</span>
              </li>
            ))}
            <li aria-current="page">{page.service}</li>
          </ol>
          <Link to={servicePath}>{parentServiceName || copy.internalServices}</Link>
        </nav>
      </SchemeASection>
    </main>
  );
}
