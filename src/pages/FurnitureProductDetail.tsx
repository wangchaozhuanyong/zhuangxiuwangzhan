import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { SmartImage } from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import LocalizedLink from "@/components/LocalizedLink";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedManagedFurnitureProductBySlug } from "@/hooks/usePublishedContent";
import { furnitureCategoryName, furnitureText } from "@/i18n/furnitureText";
import { furnitureShopUrl, getFurnitureProduct, getFurnitureProductCategory, localizeFurnitureProduct } from "@/lib/furnitureCatalog";
import { getFurnitureListingOrigin, LISTING_SCROLL_INTENT } from "@/lib/publicScrollRestoration";

export default function FurnitureProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const origin = getFurnitureListingOrigin(useLocation().state);
  const returnState = origin ? { scrollIntent: LISTING_SCROLL_INTENT, scrollTop: origin.top } : undefined;
  const copy = furnitureText[language];
  const settings = useSiteSettings();
  const staticProduct = getFurnitureProduct(slug);
  const managedQuery = usePublishedManagedFurnitureProductBySlug(staticProduct ? undefined : slug, language);
  const product = staticProduct || managedQuery.data;
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => setSelectedImage(0), [slug]);

  if (!product && managedQuery.isFetching) return (
    <main className="fc-route-page fc-furniture-page">
      <PageMeta title={copy.title} description={copy.metaDescription} canonicalPath={`/furniture/product/${slug || ""}`} noIndex />
      <div className="fc-furniture-not-found" role="status">{copy.loadingManagedProducts}</div>
    </main>
  );

  if (!product && managedQuery.isError) return (
    <main className="fc-route-page fc-furniture-page">
      <PageMeta title={copy.title} description={copy.metaDescription} canonicalPath={`/furniture/product/${slug || ""}`} noIndex />
      <div className="fc-furniture-not-found" role="alert">
        <h1>{copy.managedLoadFailed}</h1>
        <button type="button" onClick={() => void managedQuery.refetch()}>{copy.retry}</button>
      </div>
    </main>
  );

  if (!product) return (
    <main className="fc-route-page fc-furniture-page">
      <PageMeta title={copy.notFound} description={copy.notFound} canonicalPath={`/furniture/product/${slug || ""}`} noIndex />
      <div className="fc-furniture-not-found"><h1>{copy.notFound}</h1><LocalizedLink to={origin ? origin.pathname + origin.search : "/furniture"} state={returnState}>{copy.backToCatalog}</LocalizedLink></div>
    </main>
  );

  const category = getFurnitureProductCategory(product);
  const localizedProduct = localizeFurnitureProduct(product, language);
  const images = product.images.length ? product.images : product.sourceImages;
  const currentImage = images[selectedImage] || images[0];
  const displaySku = language === "en" && /[\u3400-\u9fff]/.test(product.sku)
    ? product.sku.match(/^[A-Za-z0-9-]+/)?.[0] || ""
    : product.sku;
  const message = copy.enquiryMessage.replace("{name}", localizedProduct.name)
    + (displaySku && displaySku !== "N/A" ? ` (${displaySku})` : "");
  const description = localizedProduct.description || localizedProduct.shortDescription;

  return (
    <main className="fc-route-page fc-furniture-page">
      <PageMeta title={product.seoTitle || localizedProduct.name} description={product.seoDescription || copy.detailMeta.replace("{name}", localizedProduct.name)} canonicalPath={`/furniture/product/${encodeURIComponent(decodeURIComponent(product.slug))}`} ogImage={currentImage} />
      <JsonLdBreadcrumb items={[
        { name: copy.home, url: "/" },
        { name: copy.title, url: "/furniture" },
        ...(category ? [{ name: furnitureCategoryName(category.key, language), url: `/furniture/${category.key}` }] : []),
        { name: localizedProduct.name, url: `/furniture/product/${encodeURIComponent(decodeURIComponent(product.slug))}` },
      ]} />
      <div className="fc-furniture-detail">
        <LocalizedLink className="fc-furniture-back" to={origin ? origin.pathname + origin.search : category ? `/furniture/${category.key}` : "/furniture"} state={returnState}>← {copy.backToCatalog}</LocalizedLink>
        <div className="fc-furniture-detail__layout">
          <div className="fc-furniture-gallery">
            <div className="fc-furniture-gallery__main">
              {currentImage ? <SmartImage src={currentImage} alt={`${localizedProduct.name} ${selectedImage + 1}`} width={1000} height={1000} sizes="(max-width: 900px) 92vw, 48vw" loading="eager" fetchPriority="high" /> : <span>{localizedProduct.name}</span>}
            </div>
            {images.length > 1 ? (
              <div className="fc-furniture-gallery__thumbs" aria-label={copy.gallery}>
                {images.map((image, index) => (
                  <button type="button" key={`${image}-${index}`} onClick={() => setSelectedImage(index)} aria-label={`${copy.gallery} ${index + 1}`} aria-pressed={selectedImage === index}>
                    <SmartImage src={image} alt="" width={96} height={96} sizes="96px" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="fc-furniture-detail__info">
            <span className="fc-furniture-eyebrow">{category ? furnitureCategoryName(category.key, language) : copy.title}</span>
            <h1>{localizedProduct.name}</h1>
            <p className="fc-furniture-detail__price">{product.price || copy.priceOnRequest}</p>
            {localizedProduct.shortDescription ? <p className="fc-furniture-detail__summary">{localizedProduct.shortDescription.split("\n").slice(0, 2).join("\n")}</p> : null}
            <div className="fc-furniture-detail__actions">
              <a className="is-whatsapp" href={settings.whatsapp_url(message)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon />{copy.enquire}</a>
              <a className="is-shop" href={furnitureShopUrl} target="_blank" rel="noopener noreferrer" aria-label={`${copy.buyNow} · ${copy.shopLabel}`}>{copy.buyNow}</a>
            </div>
            <p className="fc-furniture-detail__note">{copy.note}</p>
            {displaySku && displaySku !== "N/A" ? <dl><dt>{copy.sku}</dt><dd>{displaySku}</dd></dl> : null}
          </div>
        </div>
        <section className="fc-furniture-description">
          <h2>{copy.description}</h2>
          {description ? description.split("\n").map((line, index) => <p key={`${index}-${line.slice(0, 12)}`}>{line}</p>) : <p>{copy.descriptionUnavailable}</p>}
        </section>
      </div>
    </main>
  );
}
