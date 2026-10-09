import PublicResultsBoundary from "@/components/PublicResultsBoundary";
import { useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAListingGrid, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedServiceAreas, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { mediaLabels } from "@/i18n/mediaLabels";
import { locationsPageText } from "@/i18n/newClientPageText";
import { schemeARouteText } from "@/i18n/schemeAText";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

export default function Locations() {
  const { language } = useLanguage();
  const copy = locationsPageText[language];
  const routeText = schemeARouteText[language];
  const resultsQuery = usePublishedServiceAreas(language);
  const { data: locations = [], isLoading } = resultsQuery;
  const { data: pageContent, isLoading: pageLoading } = usePublishedSitePage(language, "locations");
  const hero = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.locations);

  const items = useMemo<SchemeAListingItem[]>(() => locations.map((location, index) => ({
    id: location.slug,
    title: location.name,
    description: location.description,
    meta: location.propertyTypes.slice(0, 3).join(" / "),
    image: index % 2 === 0 ? pageHeroImages.projects.desktop : pageHeroImages.services.desktop,
    imageAlt: location.name,
    href: `/locations/${location.slug}`,
  })), [locations]);

  return (
    <main className="fc-route-page" data-route-pending={pageLoading || isLoading || undefined}>
      <PageMeta ogImage={pageContent?.seoImage || undefined} title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords} canonicalPath="/locations" />
      <JsonLdBreadcrumb items={[{ name: routeText.home, url: "/" }, { name: routeText.locations, url: "/locations" }]} />
      <SchemeARouteHero kind="listing" image={hero.desktop} imageSourceWidth={hero.desktopWidth} tabletImage={hero.tablet} tabletImageSourceWidth={hero.tabletWidth} mobileImage={hero.mobile} mobileImageSourceWidth={hero.mobileWidth} imagePosition={hero.imagePosition} imageAlt={pageContent?.alt || copy.title} label={[pageContent?.subtitle || copy.eyebrow, hero.claimLevel ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")} title={pageContent?.title || copy.title} description={pageContent?.description || copy.intro} />
      <SchemeASection title={routeText.locationsDirectory} description={routeText.locationsDirectoryText}>
        <PublicResultsBoundary query={resultsQuery} loading={copy.loading} error={copy.error} isEmpty={!items.length} empty={copy.empty}>
          <SchemeAListingGrid items={items} actionLabel={copy.view} />
        </PublicResultsBoundary>
      </SchemeASection>
    </main>
  );
}
