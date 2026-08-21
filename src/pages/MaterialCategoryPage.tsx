import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAListingGrid, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedMaterials } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory, translateMaterialSubcategory, translateSpaceLabel } from "@/i18n/displayLabels";
import { materialCategoryPageText } from "@/i18n/materialCategoryPageText";
import { mergeMaterialCategoriesWithFallback } from "@/lib/materialCatalog";

export default function MaterialCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { language } = useLanguage();
  const copy = materialCategoryPageText[language];
  const { data: published, isPending } = usePublishedMaterials(language);
  const category = mergeMaterialCategoriesWithFallback(published).find((item) => item.slug === categorySlug);
  if (isPending && !category) return <main className="fc-route-page"><SchemeAContentState>{copy.loadingDescription}</SchemeAContentState></main>;
  if (!category) return <main className="fc-route-page"><PageMeta title={copy.notFound} description={copy.notFound} canonicalPath={`/materials/category/${categorySlug || ""}`} noIndex /><SchemeAContentState action={<Link to="/materials">{copy.viewAll}</Link>}>{copy.notFound}</SchemeAContentState></main>;

  const name = translateMaterialCategory(category.name, language);
  const description = translateDisplayText(category.description, language);
  const subcategoryItems: SchemeAListingItem[] = category.subcategories.map((item) => ({ id: item.slug, title: translateMaterialSubcategory(item.name, language), description: translateDisplayText(item.description, language), meta: name, image: item.image, imageAlt: item.alt || item.name, href: `/materials/category/${category.slug}/${item.slug}` }));
  const productItems: SchemeAListingItem[] = category.items.map((item) => ({ id: String(item.id), title: translateDisplayText(item.name, language), description: item.suitableSpaces.map((space) => translateSpaceLabel(space, language)).join(" / "), meta: translateDisplayText(item.color || name, language), image: item.image, imageAlt: item.alt || item.name, href: `/materials/${item.slug}` }));

  return <main className="fc-route-page">
    <PageMeta title={copy.metaTitle(name, copy.breadcrumbMaterials)} description={copy.metaDescription(description, name)} keywords={copy.metaKeywords(name)} canonicalPath={`/materials/category/${category.slug}`} />
    <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbMaterials, url: "/materials" }, { name, url: `/materials/category/${category.slug}` }]} />
    <SchemeARouteHero kind="listing" image={category.image} imageAlt={category.alt || name} label={copy.breadcrumbMaterials} title={name} description={description} />
    {subcategoryItems.length ? <SchemeASection title={copy.browseSubcategories} description={description}><SchemeAListingGrid items={subcategoryItems} actionLabel={copy.view} /></SchemeASection> : null}
    {productItems.length ? <SchemeASection title={copy.allProducts(name)}><SchemeAListingGrid items={productItems} actionLabel={copy.view} /></SchemeASection> : null}
  </main>;
}
