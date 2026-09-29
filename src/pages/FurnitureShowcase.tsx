import { useParams, useSearchParams } from "react-router-dom";
import { SmartImage } from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import LocalizedLink from "@/components/LocalizedLink";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { furnitureCategoryName, furnitureSubcategoryName, furnitureText } from "@/i18n/furnitureText";
import { furnitureCatalog, furnitureProductPath, furnitureShopUrl, getFurnitureCategory, getFurnitureProducts, getFurnitureSubcategory, localizeFurnitureProduct } from "@/lib/furnitureCatalog";

const pageSize = 18;

export default function FurnitureShowcase() {
  const { category: categoryKey, subcategory: subcategoryKey } = useParams<{ category?: string; subcategory?: string }>();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const copy = furnitureText[language];
  const settings = useSiteSettings();
  const category = getFurnitureCategory(categoryKey || "new");
  const subcategory = category && subcategoryKey ? getFurnitureSubcategory(category, subcategoryKey) : undefined;
  const validSelection = Boolean(category && (!subcategoryKey || subcategory));
  const urls = validSelection ? (subcategory?.productUrls || category?.productUrls || []) : [];
  const products = getFurnitureProducts(urls);
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const requestedPage = Number(searchParams.get("page") || 1);
  const page = Number.isInteger(requestedPage) ? Math.min(totalPages, Math.max(1, requestedPage)) : 1;
  const visibleProducts = products.slice((page - 1) * pageSize, page * pageSize);
  const categoryLabel = category ? furnitureCategoryName(category.key, language) : copy.title;
  const subcategoryLabel = subcategory ? furnitureSubcategoryName(subcategory.key, language, subcategory.name) : "";
  const currentPath = subcategory
    ? `/furniture/${category?.key}/${subcategory.key}`
    : category && category.key !== "new" ? `/furniture/${category.key}` : "/furniture";
  const pagePath = (number: number) => `${currentPath}${number > 1 ? `?page=${number}` : ""}`;

  return (
    <main className="fc-route-page fc-furniture-page">
      <PageMeta title={[subcategoryLabel, categoryKey ? categoryLabel : copy.title].filter(Boolean).join(" | ")} description={copy.metaDescription} canonicalPath={currentPath} noIndex={!validSelection} />
      <JsonLdBreadcrumb items={[
        { name: copy.home, url: "/" },
        { name: copy.title, url: "/furniture" },
        ...(categoryKey && category ? [{ name: categoryLabel, url: `/furniture/${category.key}` }] : []),
        ...(subcategory ? [{ name: subcategoryLabel, url: currentPath }] : []),
      ]} />
      <header className="fc-furniture-intro">
        <div className="fc-furniture-intro__inner">
          <div className="fc-furniture-intro__copy">
            <h1>{copy.title}</h1>
            <p>{copy.intro}</p>
          </div>
          <div className="fc-furniture-intro__media">
            <SmartImage src="/images/furniture/assets/7596c932c602dfc05255.webp" alt={copy.heroImageAlt} width={1080} height={1080} sizes="(max-width: 760px) 100vw, 48vw" loading="eager" fetchPriority="high" />
          </div>
        </div>
      </header>
      <div className="fc-furniture-body">
        <nav className="fc-furniture-primary" aria-label={copy.title}>
          {furnitureCatalog.taxonomy.map((item) => (
            <LocalizedLink key={item.key} to={item.key === "new" ? "/furniture" : `/furniture/${item.key}`} aria-current={category?.key === item.key ? "page" : undefined}>
              <span>{furnitureCategoryName(item.key, language)}</span>
              <small>{item.productUrls.length}</small>
            </LocalizedLink>
          ))}
        </nav>
        {category?.subcategories.length ? (
          <nav className="fc-furniture-secondary" aria-label={categoryLabel}>
            <LocalizedLink to={`/furniture/${category.key}`} aria-current={!subcategory ? "page" : undefined}>{copy.allProducts}</LocalizedLink>
            {category.subcategories.map((item) => (
              <LocalizedLink key={item.key} to={`/furniture/${category.key}/${item.key}`} aria-current={subcategory?.key === item.key ? "page" : undefined}>
                {furnitureSubcategoryName(item.key, language, item.name)}
              </LocalizedLink>
            ))}
          </nav>
        ) : null}
        <div className="fc-furniture-list-head">
          <span>{subcategoryLabel || categoryLabel}</span>
          <h2>{products.length} {copy.products}</h2>
        </div>
        {visibleProducts.length ? (
          <div className="fc-furniture-grid">
            {visibleProducts.map((sourceProduct, index) => {
              const product = localizeFurnitureProduct(sourceProduct, language);
              const image = product.images[0] || product.sourceImages[0];
              return (
                <article className="fc-furniture-card" key={product.sourceUrl}>
                  <LocalizedLink className="fc-furniture-card__image" to={furnitureProductPath(product)} aria-label={`${copy.viewDetails}: ${product.name}`}>
                    {image ? <SmartImage src={image} alt={product.name} width={480} height={480} sizes="(max-width: 680px) 48vw, (max-width: 1024px) 33vw, 25vw" loading={index < 4 ? "eager" : "lazy"} fetchPriority={index < 2 ? "high" : "auto"} /> : <span>{product.name}</span>}
                  </LocalizedLink>
                  <div className="fc-furniture-card__body">
                    <h3><LocalizedLink to={furnitureProductPath(product)}>{product.name}</LocalizedLink></h3>
                    <p className="fc-furniture-card__description">{(product.shortDescription || product.description || copy.descriptionUnavailable).replace(/\s+/g, " ")}</p>
                    <p className="fc-furniture-card__price">{product.price || copy.priceOnRequest}</p>
                    <div className="fc-furniture-card__actions">
                      <LocalizedLink to={furnitureProductPath(product)}>{copy.viewDetails}</LocalizedLink>
                      <a href={settings.whatsapp_url(copy.enquiryMessage.replace("{name}", product.name))} target="_blank" rel="noopener noreferrer" aria-label={`${copy.enquire}: ${product.name}`}><WhatsAppIcon />{copy.enquire}</a>
                      <a href={furnitureShopUrl} target="_blank" rel="noopener noreferrer" aria-label={`${copy.buyNow}: ${product.name}`}>{copy.buyNow}</a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="fc-furniture-empty">{validSelection ? copy.noProducts : copy.notFound}</div>}
        {totalPages > 1 ? (
          <nav className="fc-furniture-pagination" aria-label={copy.page.replace("{page}", String(page)).replace("{total}", String(totalPages))}>
            {page > 1 ? <LocalizedLink to={pagePath(page - 1)}>{copy.previous}</LocalizedLink> : <span />}
            <span>{copy.page.replace("{page}", String(page)).replace("{total}", String(totalPages))}</span>
            {page < totalPages ? <LocalizedLink to={pagePath(page + 1)}>{copy.next}</LocalizedLink> : <span />}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
