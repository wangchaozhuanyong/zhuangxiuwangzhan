import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAListingGrid, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedMaterials } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory, translateMaterialSubcategory, translateSpaceLabel } from "@/i18n/displayLabels";
import { materialSubcategoryPageText } from "@/i18n/materialSubcategoryPageText";
import { mergeMaterialCategoriesWithFallback } from "@/lib/materialCatalog";

export default function MaterialSubcategoryPage() {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug: string }>();
  const { language } = useLanguage();
  const copy = materialSubcategoryPageText[language];
  const { data: published, isPending } = usePublishedMaterials(language);
  const category = mergeMaterialCategoriesWithFallback(published).find((item) => item.slug === categorySlug);
  const subcategory = category?.subcategories.find((item) => item.slug === subcategorySlug);
  const materials = category?.items.filter((item) => item.subcategory === subcategorySlug) || [];
  if (isPending && !subcategory) return <main className="fc-route-page"><SchemeAContentState>{copy.loadingDescription}</SchemeAContentState></main>;
  if (!category || !subcategory) return <main className="fc-route-page"><PageMeta title={copy.notFound} description={copy.notFound} canonicalPath={`/materials/category/${categorySlug || ""}/${subcategorySlug || ""}`} noIndex /><SchemeAContentState action={<Link to="/materials">{copy.viewAll}</Link>}>{copy.notFound}</SchemeAContentState></main>;
  const categoryName = translateMaterialCategory(category.name, language);
  const name = translateMaterialSubcategory(subcategory.name, language);
  const description = translateDisplayText(subcategory.description, language);
  const items: SchemeAListingItem[] = materials.map((item) => ({ id: String(item.id), title: translateDisplayText(item.name, language), description: item.suitableSpaces.map((space) => translateSpaceLabel(space, language)).join(" / "), meta: translateDisplayText(item.color || categoryName, language), image: item.image, imageAlt: item.alt || item.name, href: `/materials/${item.slug}` }));
  return <main className="fc-route-page">
    <PageMeta title={copy.metaTitle(name, categoryName)} description={copy.metaDescription(description, name)} keywords={copy.metaKeywords(name, categoryName)} canonicalPath={`/materials/category/${category.slug}/${subcategory.slug}`} />
    <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbMaterials, url: "/materials" }, { name: categoryName, url: `/materials/category/${category.slug}` }, { name, url: `/materials/category/${category.slug}/${subcategory.slug}` }]} />
    <SchemeARouteHero kind="listing" image={subcategory.image} imageAlt={subcategory.alt || name} label={categoryName} title={name} description={description} />
    <SchemeASection title={copy.products(name)} description={description}>{items.length ? <SchemeAListingGrid items={items} actionLabel={copy.view} /> : <SchemeAContentState action={<Link to="/quote">{copy.quote}</Link>}>{copy.comingSoon}</SchemeAContentState>}</SchemeASection>
  </main>;
}
