import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAFacts, SchemeAGallery, SchemeAListingGrid, SchemeANumberList, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedMaterialBySlug } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory, translateMaterialType, translateSpaceLabel } from "@/i18n/displayLabels";
import { materialDetailPageText } from "@/i18n/materialDetailPageText";
import { schemeARouteText } from "@/i18n/schemeAText";
import { mergeMaterialCategoriesWithFallback } from "@/lib/materialCatalog";
import { stripHtml } from "@/lib/text";

const format = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, String(value)), text);

export default function MaterialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const copy = materialDetailPageText[language];
  const routeText = schemeARouteText[language];
  const { data: published, isPending } = usePublishedMaterialBySlug(slug, language);
  const categories = mergeMaterialCategoriesWithFallback(published?.category ? [published.category] : undefined);
  const category = categories.find((item) => item.items.some((material) => material.slug === slug));
  const material = category?.items.find((item) => item.slug === slug);

  if (isPending && !material) return <main className="fc-route-page"><SchemeAContentState>{copy.loadingDescription}</SchemeAContentState></main>;
  if (!material || !category) return <main className="fc-route-page"><PageMeta title={copy.notFound} description={copy.notFound} canonicalPath={`/materials/${slug || ""}`} noIndex /><SchemeAContentState action={<Link to="/materials">{copy.viewAll}</Link>}>{copy.notFound}</SchemeAContentState></main>;

  const name = translateDisplayText(material.name, language);
  const categoryName = translateMaterialCategory(category.name, language);
  const description = stripHtml(translateDisplayText(material.description, language));
  const related = category.items.filter((item) => item.slug !== slug);
  const relatedItems: SchemeAListingItem[] = related.slice(0, 4).map((item) => ({ id: String(item.id), title: translateDisplayText(item.name, language), description: translateDisplayText(item.description, language), meta: translateMaterialType(item.type, language), image: item.image, imageAlt: item.alt || item.name, href: `/materials/${item.slug}` }));
  const judgementItems = [
    ...material.suitableSpaces.map((space: string) => ({ title: translateSpaceLabel(space, language), description: copy.suitableSpaces })),
    ...(material.pros || []).map((item: string) => ({ title: translateDisplayText(item, language), description: copy.pros })),
    ...(material.cons || []).map((item: string) => ({ title: translateDisplayText(item, language), description: copy.cons })),
  ];

  return (
    <main className="fc-route-page">
      <PageMeta title={format(copy.metaTitle, { name })} description={format(copy.metaDescription, { description, spaces: material.suitableSpaces.map((space: string) => translateSpaceLabel(space, language)).join(language === "zh" ? "、" : ", ") })} keywords={format(copy.metaKeywords, { name, category: categoryName })} canonicalPath={`/materials/${material.slug}`} />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbMaterials, url: "/materials" }, { name: categoryName, url: `/materials/category/${category.slug}` }, { name, url: `/materials/${material.slug}` }]} />
      <SchemeARouteHero kind="detail" image={material.image} imageAlt={material.alt || name} label={categoryName} title={name} description={description} />
      <SchemeAFacts items={[
        { label: copy.type, value: translateMaterialType(material.type || "", language) || "-" },
        { label: copy.color, value: translateDisplayText(material.color || "-", language) },
        { label: copy.texture, value: translateDisplayText(material.texture || "-", language) },
        { label: copy.category, value: categoryName },
      ]} />
      <SchemeASection title={routeText.materialConsiderations} description={description}>
        <SchemeANumberList items={judgementItems} />
      </SchemeASection>
      <SchemeASection title={routeText.materialContext} description={translateDisplayText(material.recommendedPairing || material.note || description, language)}>
        <SchemeAGallery images={[{ src: material.image, alt: material.alt || name }, { src: related[0]?.image || material.image, alt: related[0]?.alt || name }]} />
      </SchemeASection>
      {relatedItems.length ? <SchemeASection title={format(copy.more, { name: categoryName })}><SchemeAListingGrid items={relatedItems} actionLabel={copy.view} /></SchemeASection> : null}
    </main>
  );
}
