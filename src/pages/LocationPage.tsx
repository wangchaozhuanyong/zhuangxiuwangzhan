import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb, JsonLdFAQ } from "@/components/JsonLd";
import CTABanner from "@/components/blocks/CTABanner";
import {
  SchemeAContentState,
  SchemeAFacts,
  SchemeAFaqList,
  SchemeALinkGrid,
  SchemeAListingGrid,
  SchemeANumberList,
  SchemeARouteHero,
  SchemeASection,
  type SchemeAListingItem,
} from "@/components/scheme-a/SchemeARoutePrimitives";
import { locationsData } from "@/data/locations";
import { usePublishedServiceAreaBySlug } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { mediaLabels } from "@/i18n/mediaLabels";
import { withLanguagePrefix } from "@/i18n/routes";
import { locationPageText } from "@/i18n/locationPageText";
import { getLocationContextLinks } from "@/i18n/locationContextLinks";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";
import { pageHeroImages } from "@/lib/pageHeroImages";
import { siteConfig } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildQuotePath } from "@/lib/quoteContext";
import { stripHtml } from "@/lib/text";

export default function LocationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const copy = locationPageText[language];
  const fallback = useMemo(() => {
    if (!slug || !locationsData[slug]) return undefined;
    const loc = locationsData[slug];
    if (language !== "zh") return loc;
    return {
      ...loc,
      name: loc.nameZh || loc.name,
      metaTitle: loc.metaTitleZh || loc.metaTitle,
      description: loc.descriptionZh || loc.description,
      intro: loc.introZh || loc.intro,
      propertyTypes: loc.propertyTypesZh || loc.propertyTypes,
      commonNeeds: loc.commonNeedsZh || loc.commonNeeds,
      constructionNotes: loc.constructionNotesZh || loc.constructionNotes,
      projects: loc.projects,
      faqs: loc.faqsZh || loc.faqs,
    };
  }, [slug, language]);
  const { data: cmsLocation, isPending } = usePublishedServiceAreaBySlug(slug, language);
  const location = useMemo(() => cmsLocation || fallback, [cmsLocation, fallback]);

  if (isPending && !location) return <main className="fc-route-page"><SchemeAContentState>{copy.loadingDescription}</SchemeAContentState></main>;
  if (!location) return <main className="fc-route-page"><PageMeta title={copy.notFound} description={copy.notFound} canonicalPath={`/locations/${slug || ""}`} noIndex /><SchemeAContentState action={<Link to="/locations">{copy.backHome}</Link>}>{copy.notFound}</SchemeAContentState></main>;

  const display = (value: string) => stripHtml(translateDisplayText(value || "", language));
  const faqs = location.faqs.map((faq) => ({ question: display(faq.q), answer: display(faq.a) }));
  const projectItems: SchemeAListingItem[] = location.projects.map((project, index) => ({
    id: `${project.title}-${index}`,
    title: `${display(project.title)} — ${mediaLabels[language].renderingConcept}`,
    meta: `${translateProjectType(project.type, language)} · ${mediaLabels[language].renderingConcept}`,
    image: project.image,
    imageAlt: `${display(project.title)} · ${mediaLabels[language].renderingConcept}`,
    href: project.href || (project.slug ? `/projects/${project.slug}` : "/projects"),
  }));
  const contextLinks = getLocationContextLinks(location.slug, language);
  const quotePath = buildQuotePath({
    source: "location",
    title: location.name,
    location: location.name,
  });

  return (
    <main className="fc-route-page">
      <PageMeta title={location.metaTitle} description={display(location.description)} keywords={copy.keywords(location.name)} canonicalPath={`/locations/${location.slug}`} />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbLocations, url: "/locations" }, { name: location.name, url: `/locations/${location.slug}` }]} />
      {faqs.length ? <JsonLdFAQ faqs={faqs} /> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "LocalBusiness", name: settings.company_name, description: location.description, address: settings.address, areaServed: location.name, url: `${siteConfig.url}${withLanguagePrefix(`/locations/${location.slug}`, language)}` }) }} />
      {faqs.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      ) : null}
      <SchemeARouteHero
        kind="detail"
        image={pageHeroImages.locations.desktop}
        imageSourceWidth={pageHeroImages.locations.desktopWidth}
        tabletImage={pageHeroImages.locations.tablet}
        tabletImageSourceWidth={pageHeroImages.locations.tabletWidth}
        mobileImage={pageHeroImages.locations.mobile}
        mobileImageSourceWidth={pageHeroImages.locations.mobileWidth}
        imagePosition={pageHeroImages.locations.imagePosition}
        imageAlt={language === "zh" ? `${location.name} 装修服务范围规划示意` : `${location.name} renovation service area planning concept`}
        label={[copy.breadcrumbLocations, mediaLabels[language].renderingConcept].join(" · ")}
        title={copy.heroTitle(location.name)}
        description={display(location.description)}
        actions={<Link to={quotePath}>{copy.quote}<ArrowUpRight aria-hidden="true" /></Link>}
      />
      <SchemeAFacts items={[
        { label: language === "zh" ? "地区" : "Area", value: location.name },
        { label: copy.propertyTypes, value: location.propertyTypes.slice(0, 2).map(display).join(" / ") },
        { label: language === "zh" ? "服务" : "Service", value: language === "zh" ? "设计 / 装修" : "Design / Build" },
        { label: language === "zh" ? "协调" : "Coordination", value: language === "zh" ? "管理处申请" : "Management approval" },
      ]} />
      <SchemeASection title={copy.trusted(location.name)} description={display(location.intro)}>
        <SchemeANumberList items={location.commonNeeds.map((item) => ({ title: display(item) }))} />
      </SchemeASection>
      {location.constructionNotes ? <SchemeASection title={copy.permitNotes} description={display(location.constructionNotes)}><SchemeANumberList items={location.propertyTypes.map((item) => ({ title: display(item) }))} /></SchemeASection> : null}
      {projectItems.length ? <SchemeASection title={copy.featuredProjects(location.name)}><SchemeAListingGrid items={projectItems} actionLabel={copy.internalProjects} /></SchemeASection> : null}
      {contextLinks.length ? (
        <SchemeASection title={copy.resourceTitle(location.name)} description={copy.resourceDescription}>
          <SchemeALinkGrid items={contextLinks} actionLabel={copy.resourceAction} />
        </SchemeASection>
      ) : null}
      {faqs.length ? <SchemeASection title={copy.faqTitle(location.name)}><SchemeAFaqList items={faqs} /></SchemeASection> : null}
      <CTABanner
        title={copy.ctaTitle(location.name)}
        description={copy.ctaDescription(location.name)}
        quoteLabel={copy.quote}
        quotePath={quotePath}
        whatsappLabel={copy.whatsapp}
        whatsappSource={`Location Page CTA - ${location.name}`}
      />
    </main>
  );
}
