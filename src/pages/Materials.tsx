import PublicResultsBoundary from "@/components/PublicResultsBoundary";
import { isReviewedMaterialConceptImage } from "@/lib/reviewedContentMedia.mjs";
import { useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAListingGrid, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { materialsData } from "@/data/materials";
import { reviewMaterialImages } from "@/lib/materialCatalog";
import { usePublishedMaterials, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory } from "@/i18n/displayLabels";
import { materialsPageText } from "@/i18n/materialsPageText";
import { mediaLabels } from "@/i18n/mediaLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

export default function Materials() {
  const { language } = useLanguage();
  const copy = materialsPageText[language];
  const resultsQuery = usePublishedMaterials(language);
  const { data: publishedCategories, isLoading } = resultsQuery;
  const { data: pageContent, isLoading: pageLoading } = usePublishedSitePage(language, "materials");
  const categories = useMemo(() => reviewMaterialImages(publishedCategories?.length ? publishedCategories : materialsData), [publishedCategories]);
  const hero = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.materials);

  const items = useMemo<SchemeAListingItem[]>(() => categories.map((category) => ({
    id: category.slug,
    title: translateMaterialCategory(category.name, language),
    description: translateDisplayText(category.description || "", language),
    image: category.image,
    mediaDisclosure: isReviewedMaterialConceptImage(category.image) ? mediaLabels[language].materialPalette : undefined,
    imageAlt: category.alt || translateMaterialCategory(category.name, language),
    href: `/materials/category/${category.slug}`,
  })), [categories, language]);

  return (
    <main className="fc-route-page" data-route-pending={pageLoading || isLoading || undefined}>
      <PageMeta title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords || copy.metaKeywords} canonicalPath="/materials" />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbMaterials, url: "/materials" }]} />
      <SchemeARouteHero kind="listing" image={hero.desktop} imageSourceWidth={hero.desktopWidth} tabletImage={hero.tablet} tabletImageSourceWidth={hero.tabletWidth} mobileImage={hero.mobile} mobileImageSourceWidth={hero.mobileWidth} imagePosition={hero.imagePosition} imageAlt={pageContent?.alt || copy.heroAlt} label={[pageContent?.subtitle || copy.eyebrow, hero.claimLevel ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")} title={pageContent?.title || copy.title} description={pageContent?.description || copy.intro} />
      <SchemeASection title={copy.choose} description={copy.chooseText}>
        <PublicResultsBoundary query={resultsQuery} keepFallback>
          <SchemeAListingGrid items={items} actionLabel={copy.view} />
        </PublicResultsBoundary>
      </SchemeASection>
    </main>
  );
}
