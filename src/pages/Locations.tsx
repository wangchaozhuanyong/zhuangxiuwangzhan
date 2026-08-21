import { useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAListingGrid, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
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
  const { data: locations = [], isLoading, isError, refetch } = usePublishedServiceAreas(language);
  const { data: pageContent } = usePublishedSitePage(language, "locations");
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
    <main className="fc-route-page">
      <PageMeta title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords} canonicalPath="/locations" />
      <JsonLdBreadcrumb items={[{ name: routeText.home, url: "/" }, { name: routeText.locations, url: "/locations" }]} />
      <SchemeARouteHero kind="listing" image={hero.desktop} imageSourceWidth={hero.desktopWidth} tabletImage={hero.tablet} tabletImageSourceWidth={hero.tabletWidth} mobileImage={hero.mobile} mobileImageSourceWidth={hero.mobileWidth} imageAlt={pageContent?.alt || copy.title} label={[pageContent?.subtitle || copy.eyebrow, hero.claimLevel ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")} title={pageContent?.title || copy.title} description={pageContent?.description || copy.intro} />
      <SchemeASection title={routeText.locationsDirectory} description={routeText.locationsDirectoryText}>
        {isLoading ? <SchemeAContentState>{copy.loading}</SchemeAContentState> : null}
        {isError ? <SchemeAContentState action={<button type="button" onClick={() => void refetch()}>{routeText.reload}</button>}>{copy.error}</SchemeAContentState> : null}
        {!isLoading && !isError && !items.length ? <SchemeAContentState>{copy.empty}</SchemeAContentState> : null}
        {!isLoading && !isError && items.length ? <SchemeAListingGrid items={items} actionLabel={copy.view} /> : null}
      </SchemeASection>
    </main>
  );
}
