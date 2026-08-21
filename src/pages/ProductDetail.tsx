import { useParams } from "react-router-dom";
import LocalizedLink from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAFacts, SchemeAGallery, SchemeAListingGrid, SchemeANumberList, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedMaterialBySlug } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory, translateMaterialType, translateSpaceLabel } from "@/i18n/displayLabels";
import { productDetailPageText } from "@/i18n/newClientPageText";
import { stripHtml } from "@/lib/text";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const copy = productDetailPageText[language];
  const { data, isPending } = usePublishedMaterialBySlug(slug, language);
  const product = data?.material;
  const category = data?.category;

  if (isPending) return <main className="fc-route-page"><SchemeAContentState>{copy.loadingDescription}</SchemeAContentState></main>;
  if (!product || !category) return <main className="fc-route-page"><PageMeta title={copy.notFound} description={copy.notFound} canonicalPath={`/products/${slug || ""}`} noIndex /><SchemeAContentState action={<LocalizedLink to="/products">{copy.viewAll}</LocalizedLink>}>{copy.notFound}</SchemeAContentState></main>;

  const display = (value?: string) => translateDisplayText(value || "", language);
  const name = display(product.name);
  const description = stripHtml(display(product.description));
  const categoryName = translateMaterialCategory(category.name, language);
  const related = category.items.filter((item) => item.slug !== product.slug).slice(0, 4);
  const relatedItems: SchemeAListingItem[] = related.map((item) => ({ id: String(item.id), title: display(item.name), description: display(item.description), meta: [categoryName, item.referencePrice].filter(Boolean).join(" / "), image: item.image, imageAlt: item.alt || item.name, href: `/products/${item.slug}` }));
  const gallery = product.gallery?.map((item) => ({ src: item.image, alt: display(item.alt || name) })) || [];
  const detailItems = [
    ...product.suitableSpaces.map((space) => ({ title: translateSpaceLabel(space, language), description: copy.suitableSpaces })),
    ...(product.pros || []).map((item) => ({ title: display(item), description: copy.advantages })),
    ...(product.cons || []).map((item) => ({ title: display(item), description: copy.notes })),
  ];

  return (
    <main className="fc-route-page">
      <PageMeta title={`${name} | ${copy.metaTitleSuffix}`} description={`${description} ${copy.metaDescriptionSuffix}`} keywords={`${name}, ${categoryName}`} canonicalPath={`/products/${product.slug}`} />
      <JsonLdBreadcrumb items={[{ name: copy.home, url: "/" }, { name: copy.products, url: "/products" }, { name, url: `/products/${product.slug}` }]} />
      <SchemeARouteHero kind="detail" image={gallery[0]?.src || product.image} imageAlt={gallery[0]?.alt || product.alt || name} label={categoryName} title={name} description={description} />
      <SchemeAFacts items={[
        { label: copy.referencePrice, value: product.referencePrice || copy.confirmWithTeam },
        { label: copy.type, value: translateMaterialType(product.type || "", language) || "-" },
        { label: copy.color, value: display(product.color) || "-" },
        { label: copy.texture, value: display(product.texture) || "-" },
      ]} />
      <SchemeASection title={copy.detailsTitle} description={copy.detailsIntro}><SchemeANumberList items={detailItems} /></SchemeASection>
      <SchemeASection title={copy.galleryLabel} description={display(product.recommendedPairing) || display(product.note) || copy.confirmWithTeam}>
        <SchemeAGallery images={gallery.length ? gallery : [{ src: product.image, alt: product.alt || name }, { src: related[0]?.image || product.image, alt: related[0]?.alt || name }]} />
      </SchemeASection>
      {relatedItems.length ? <SchemeASection title={copy.relatedTitle} description={copy.relatedIntro}><SchemeAListingGrid items={relatedItems} actionLabel={copy.view} /></SchemeASection> : null}
    </main>
  );
}
