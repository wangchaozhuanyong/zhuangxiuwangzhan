import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAFacts, SchemeAFaqList, SchemeAListingGrid, SchemeANumberList, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { locationsData } from "@/data/locations";
import { usePublishedServiceAreaBySlug } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { withLanguagePrefix } from "@/i18n/routes";
import { locationPageText } from "@/i18n/locationPageText";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";
import { pageHeroImages } from "@/lib/pageHeroImages";
import { siteConfig } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { stripHtml } from "@/lib/text";

export default function LocationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const copy = locationPageText[language];
  const fallback = slug ? locationsData[slug] : undefined;
  const { data: cmsLocation, isPending } = usePublishedServiceAreaBySlug(slug, language);
  const location = useMemo(() => cmsLocation || fallback, [cmsLocation, fallback]);

  if (isPending && !location) return <main className="fc-route-page"><SchemeAContentState>{copy.loadingDescription}</SchemeAContentState></main>;
  if (!location) return <main className="fc-route-page"><PageMeta title={copy.notFound} description={copy.notFound} canonicalPath={`/locations/${slug || ""}`} noIndex /><SchemeAContentState action={<Link to="/locations">{copy.backHome}</Link>}>{copy.notFound}</SchemeAContentState></main>;

  const display = (value: string) => stripHtml(translateDisplayText(value || "", language));
  const faqs = location.faqs.map((faq) => ({ question: display(faq.q), answer: display(faq.a) }));
  const projectItems: SchemeAListingItem[] = location.projects.map((project, index) => ({ id: `${project.title}-${index}`, title: display(project.title), meta: translateProjectType(project.type, language), image: project.image, imageAlt: display(project.title), href: "/projects" }));

  return (
    <main className="fc-route-page">
      <PageMeta title={location.metaTitle} description={display(location.description)} keywords={copy.keywords(location.name)} canonicalPath={`/locations/${location.slug}`} />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbLocations, url: "/locations" }, { name: location.name, url: `/locations/${location.slug}` }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "LocalBusiness", name: settings.company_name, description: location.description, address: settings.address, areaServed: location.name, url: `${siteConfig.url}${withLanguagePrefix(`/locations/${location.slug}`, language)}` }) }} />
      <SchemeARouteHero kind="detail" image={pageHeroImages.services.desktop} mobileImage={pageHeroImages.services.mobile} imageAlt={`${location.name} renovation services`} label={copy.breadcrumbLocations} title={copy.heroTitle(location.name)} description={display(location.description)} />
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
      {faqs.length ? <SchemeASection title={copy.faqTitle(location.name)}><SchemeAFaqList items={faqs} /></SchemeASection> : null}
    </main>
  );
}
