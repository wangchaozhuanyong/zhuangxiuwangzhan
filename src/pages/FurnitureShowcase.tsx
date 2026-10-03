import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { MouseEvent } from "react";
import { SmartImage } from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import LocalizedLink from "@/components/LocalizedLink";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeARouteHero } from "@/components/scheme-a/SchemeARoutePrimitives";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedManagedFurnitureProducts } from "@/hooks/usePublishedContent";
import { furnitureCategoryName, furnitureSubcategoryName, furnitureText } from "@/i18n/furnitureText";
import { furnitureCatalog, furnitureProductPath, furnitureShopUrl, getFurnitureCategory, getFurnitureProducts, getFurnitureSubcategory, getManagedFurnitureProductsForCategory, localizeFurnitureProduct } from "@/lib/furnitureCatalog";
import { rememberFurnitureNavigationScroll } from "@/lib/publicScrollRestoration";
import { withLanguagePrefix } from "@/i18n/routes";

const pageSize = 18;

const keepFurnitureScrollPosition = (event: MouseEvent<HTMLAnchorElement>) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  rememberFurnitureNavigationScroll(event.currentTarget.pathname, window.scrollY);
};

export default function FurnitureShowcase() {
  const { category: categoryKey, subcategory: subcategoryKey } = useParams<{ category?: string; subcategory?: string }>();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const openProduct = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(withLanguagePrefix(path, language), {
      state: { furnitureOrigin: { pathname: location.pathname, search: location.search, top: window.scrollY } },
    });
  };
  const copy = furnitureText[language];
  const managedQuery = usePublishedManagedFurnitureProducts(language);
  const managedProducts = managedQuery.data || [];
  const category = getFurnitureCategory(categoryKey || "new");
  const subcategory = category && subcategoryKey ? getFurnitureSubcategory(category, subcategoryKey) : undefined;
  const validSelection = Boolean(category && (!subcategoryKey || subcategory));
  const urls = validSelection ? (subcategory?.productUrls || category?.productUrls || []) : [];
  const products = validSelection
    ? [...getManagedFurnitureProductsForCategory(managedProducts, category!.key, subcategory?.key), ...getFurnitureProducts(urls)]
    : [];
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
      <SchemeARouteHero
        kind="listing"
        showIntro={false}
        image="/images/heroes/v20260930/furniture-showcase.webp"
        imageSourceWidth={1536}
        imagePosition={{ mobile: "center 55%" }}
        imageAlt={copy.heroImageAlt}
        label={copy.title}
        title={subcategoryLabel || (categoryKey ? categoryLabel : copy.title)}
        description={copy.intro}
      />
      <div className="fc-furniture-body">
        <p className="fc-furniture-detail__note">{copy.intro}</p>
        <nav className="fc-furniture-primary" aria-label={copy.title}>
          {furnitureCatalog.taxonomy.map((item) => (
            <LocalizedLink key={item.key} to={item.key === "new" ? "/furniture" : `/furniture/${item.key}`} viewTransition={false} onClick={keepFurnitureScrollPosition} aria-current={category?.key === item.key ? "page" : undefined}>
              <span>{furnitureCategoryName(item.key, language)}</span>
              <small>{item.productUrls.length + getManagedFurnitureProductsForCategory(managedProducts, item.key).length}</small>
            </LocalizedLink>
          ))}
        </nav>
        {category?.subcategories.length ? (
          <nav className="fc-furniture-secondary" aria-label={categoryLabel}>
            <LocalizedLink to={`/furniture/${category.key}`} viewTransition={false} onClick={keepFurnitureScrollPosition} aria-current={!subcategory ? "page" : undefined}>{copy.allProducts}</LocalizedLink>
            {category.subcategories.map((item) => (
              <LocalizedLink key={item.key} to={`/furniture/${category.key}/${item.key}`} viewTransition={false} onClick={keepFurnitureScrollPosition} aria-current={subcategory?.key === item.key ? "page" : undefined}>
                {furnitureSubcategoryName(item.key, language, item.name)}
              </LocalizedLink>
            ))}
          </nav>
        ) : null}
        {managedQuery.isFetching && !managedQuery.data ? <p className="fc-furniture-sync-status" role="status">{copy.loadingManagedProducts}</p> : null}
        {managedQuery.isInitialError ? (
          <div className="fc-furniture-sync-status" role="alert">
            {copy.managedLoadFailed} <button type="button" onClick={() => void managedQuery.refetch()}>{copy.retry}</button>
          </div>
        ) : null}
        <div data-public-results>
        <div className="fc-furniture-list-head">
          <h2>{subcategoryLabel || categoryLabel}</h2>
          <p>{products.length} {copy.products}</p>
        </div>
        {visibleProducts.length ? (
          <div className="fc-furniture-grid">
            {visibleProducts.map((sourceProduct, index) => {
              const product = localizeFurnitureProduct(sourceProduct, language);
              const image = product.images[0] || product.sourceImages[0];
              return (
                <article className="fc-furniture-card" key={product.sourceUrl}>
                  <LocalizedLink className="fc-furniture-card__main" to={furnitureProductPath(product)} onClick={(event) => openProduct(event, furnitureProductPath(product))} aria-label={`${copy.viewDetails}: ${product.name}`}>
                    <div className="fc-furniture-card__image">
                      {image ? <SmartImage src={image} alt={product.name} width={480} height={480} sizes="(max-width: 680px) 48vw, (max-width: 1024px) 33vw, 25vw" loading={index < 4 ? "eager" : "lazy"} fetchPriority={index < 2 ? "high" : "auto"} /> : <span>{product.name}</span>}
                    </div>
                    <div className="fc-furniture-card__body">
                      <h3>{product.name}</h3>
                      <p className="fc-furniture-card__description">{(product.shortDescription || product.description || copy.listingDescriptionUnavailable).replace(/\s+/g, " ")}</p>
                      <p className="fc-furniture-card__price">{product.price || copy.priceOnRequest}</p>
                    </div>
                  </LocalizedLink>
                  <div className="fc-furniture-card__actions">
                    <a href={furnitureShopUrl} target="_blank" rel="noopener noreferrer" aria-label={`${copy.openShopHomepage}: ${product.name}`}>{copy.openShopHomepage}</a>
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
      </div>
    </main>
  );
}
