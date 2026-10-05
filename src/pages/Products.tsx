import PublicResultsBoundary from "@/components/PublicResultsBoundary";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAFilter, SchemeAListingGrid, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedMaterials, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory } from "@/i18n/displayLabels";
import { productsPageText } from "@/i18n/newClientPageText";
import { mediaLabels } from "@/i18n/mediaLabels";
import { schemeARouteText } from "@/i18n/schemeAText";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { stripHtml } from "@/lib/text";

export default function Products() {
  const { language } = useLanguage();
  const copy = productsPageText[language];
  const routeText = schemeARouteText[language];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const resultsQuery = usePublishedMaterials(language);
  const { data: categories = [] } = resultsQuery;
  const { data: pageContent } = usePublishedSitePage(language, "products");
  const hero = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.products);
  const display = (value: string) => stripHtml(translateDisplayText(value, language));

  const products = useMemo(() => {
    const unique = new Map<string, (typeof categories)[number]["items"][number] & { categorySlug: string }>();
    categories.forEach((group) => group.items.forEach((product) => {
      if (!unique.has(product.slug)) unique.set(product.slug, { ...product, categorySlug: group.slug });
    }));
    return Array.from(unique.values());
  }, [categories]);

  const filtered = products.filter((product) => {
    const inCategory = category === "all" || product.categorySlug === category;
    const query = search.trim().toLowerCase();
    const haystack = [product.name, product.category, product.type, product.color, product.texture].join(" ").toLowerCase();
    return inCategory && (!query || haystack.includes(query));
  });

  const items: SchemeAListingItem[] = filtered.map((product) => ({
    id: `${product.categorySlug}-${product.slug}`,
    title: display(product.name),
    description: display(product.excerpt || product.description),
    meta: [translateMaterialCategory(product.category, language), product.referencePrice].filter(Boolean).join(" / "),
    image: product.image,
    imageAlt: product.alt || display(product.name),
    href: `/products/${product.slug}`,
  }));

  return (
    <main className="fc-route-page">
      <PageMeta title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords} canonicalPath="/products" />
      <JsonLdBreadcrumb items={[{ name: routeText.home, url: "/" }, { name: routeText.products, url: "/products" }]} />
      <SchemeARouteHero kind="listing" image={hero.desktop} imageSourceWidth={hero.desktopWidth} tabletImage={hero.tablet} tabletImageSourceWidth={hero.tabletWidth} mobileImage={hero.mobile} mobileImageSourceWidth={hero.mobileWidth} imagePosition={hero.imagePosition} imageAlt={pageContent?.alt || copy.title} label={[pageContent?.subtitle || copy.eyebrow, hero.claimLevel ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")} title={pageContent?.title || copy.title} description={pageContent?.description || copy.intro} />
      <SchemeASection title={routeText.productsDirectory} description={routeText.productsDirectoryText}>
        <label className="fc-route-search">
          <span className="sr-only">{copy.searchLabel}</span>
          <Search aria-hidden="true" />
          <input data-ui="input" aria-label={copy.searchPlaceholder} type="search" value={search} placeholder={copy.searchPlaceholder} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <SchemeAFilter items={[{ value: "all", label: copy.all }, ...categories.map((item) => ({ value: item.slug, label: translateMaterialCategory(item.name, language) }))]} value={category} onChange={setCategory} ariaLabel={copy.searchLabel} />
        <PublicResultsBoundary query={resultsQuery} loading={copy.loading} error={copy.error} isEmpty={!items.length} empty={copy.empty}>
          <SchemeAListingGrid items={items} actionLabel={copy.view} />
        </PublicResultsBoundary>
      </SchemeASection>
    </main>
  );
}
