import { ArrowUpRight } from "lucide-react";
import { useParams } from "react-router-dom";
import { JsonLdBreadcrumb, JsonLdFAQ, JsonLdService } from "@/components/JsonLd";
import Link from "@/components/LocalizedLink";
import LandingQuoteForm from "@/components/landing/LandingQuoteForm";
import PageMeta from "@/components/PageMeta";
import { SchemeAFaqList, SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import pageText from "@/components/services/serviceAreaPageText.json";
import { ANZHE_SHOWROOM_ORIGIN, anzheShowroomModelUrl } from "@/config/anzheShowroom";
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

  const localizedCopy = pageText[route.path];
  const page = language === "ms"
    ? ("ms" in localizedCopy ? localizedCopy.ms : null)
    : localizedCopy[language];
  if (!page) return <NotFound />;
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
  const faqs = "faqs" in page ? page.faqs : [{ question: page.question, answer: page.answer }];
  const quotePath = buildQuotePath({
    source: "service",
    title: page.heading,
    projectType: quoteProjectTypeFromServiceSlug(route.parentService, page.service),
    location: page.area,
  });

  return (
    <main className="fc-route-page">
      <PageMeta title={page.title} description={page.description} canonicalPath={route.path} keywords={page.keywords} malayReady={"ms" in localizedCopy} />
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
      {"sections" in page ? <>
        {page.sections.map(section => (
          <SchemeASection key={section.heading} title={section.heading} description={section.paragraphs}>
            {section.checks.length > 0 || section.topics.length > 0 ? (
              <div className="fc-route-service-overview-copy">
                {section.checks.length > 0 && <ul className="list-disc space-y-2 pl-5">
                  {section.checks.map(check => <li key={check}>{check}</li>)}
                </ul>}
                {section.topics.map(topic => (
                  <div key={topic.heading}>
                    <h3>{topic.heading}</h3>
                    {topic.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                ))}
              </div>
            ) : null}
          </SchemeASection>
        ))}
        <SchemeASection title={page.modelHeading} description={page.modelIntro}>
          <div className="fc-route-service-overview-copy">
            <ul className="list-disc space-y-2 pl-5">
              {page.models.map(model => (
                <li key={model.slug}>
                  <a href={anzheShowroomModelUrl(language, model.slug)}>{model.name}</a>
                  {" "}{model.description}
                </li>
              ))}
            </ul>
          </div>
        </SchemeASection>
        <SchemeASection title={page.areasHeading} description={page.areasDescription}>
          <Link className="font-medium text-accent underline" to="/locations">{page.areasLink}</Link>
        </SchemeASection>
      </> : <SchemeASection title={page.bodyHeading} description={page.body.map(stripHtml)} children={null} />}
      <SchemeASection title={copy.faqTitle(page.area)}>
        <SchemeAFaqList items={faqs} />
      </SchemeASection>
      <SchemeASection className="fc-service-area-enquiry">
        <LandingQuoteForm key={route.path} landingTitle={page.heading} serviceEnquiry />
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
          {"showroomLink" in page && typeof page.showroomLink === "string" && (
            <a href={`${ANZHE_SHOWROOM_ORIGIN}/${language}/`}>{page.showroomLink}</a>
          )}
        </nav>
      </SchemeASection>
    </main>
  );
}
