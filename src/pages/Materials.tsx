import { useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAListingGrid, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { materialsData } from "@/data/materials";
import { usePublishedMaterials, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory } from "@/i18n/displayLabels";
import { materialsPageText } from "@/i18n/materialsPageText";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

export default function Materials() {
  const { language } = useLanguage();
  const copy = materialsPageText[language];
  const { data: publishedCategories } = usePublishedMaterials(language);
  const { data: pageContent } = usePublishedSitePage(language, "materials");
  const categories = publishedCategories?.length ? publishedCategories : materialsData;
  const hero = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.materials);

  const items = useMemo<SchemeAListingItem[]>(() => categories.map((category) => ({
    id: category.slug,
    title: translateMaterialCategory(category.name, language),
    description: translateDisplayText(category.description || "", language),
    meta: pageContent?.subtitle || copy.eyebrow,
    image: category.image,
    imageAlt: category.alt || translateMaterialCategory(category.name, language),
    href: `/materials/category/${category.slug}`,
  })), [categories, copy.eyebrow, language, pageContent?.subtitle]);

  return (
    <main className="fc-route-page">
      <PageMeta title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords || copy.metaKeywords} canonicalPath="/materials" />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbMaterials, url: "/materials" }]} />
      <SchemeARouteHero kind="listing" image={hero.desktop} mobileImage={hero.mobile} imageAlt={pageContent?.alt || copy.heroAlt} label={pageContent?.subtitle || copy.eyebrow} title={pageContent?.title || copy.title} description={pageContent?.description || copy.intro} />
      <SchemeASection title={copy.choose} description={copy.chooseText}>
        <SchemeAListingGrid items={items} actionLabel={copy.view} />
      </SchemeASection>
    </main>
  );
}
