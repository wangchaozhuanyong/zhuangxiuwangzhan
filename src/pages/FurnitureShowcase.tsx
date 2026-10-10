import "@/lib/furnitureQuerySeed";
import PublicResultsBoundary from "@/components/PublicResultsBoundary";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { MouseEvent } from "react";
import { SmartImage } from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import LocalizedLink from "@/components/LocalizedLink";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeARouteHero } from "@/components/scheme-a/SchemeARoutePrimitives";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedFurnitureCatalog } from "@/hooks/usePublishedContent";
import { furnitureCategoryName, furnitureCategoryPageCopy, furnitureSubcategoryName, furnitureText } from "@/i18n/furnitureText";
import { furnitureCatalog, furnitureProductPath, furnitureShopUrl, getFurnitureCatalogProductsForCategory, getFurnitureListingPage, furnitureListingPagePath, normalizeFurnitureListingPage, localizeFurnitureProduct } from "@/lib/furnitureCatalog";
import { rememberFurnitureNavigationScroll } from "@/lib/publicScrollRestoration";
import { withLanguagePrefix } from "@/i18n/routes";

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
  const categoryCopy = furnitureCategoryPageCopy(categoryKey, language, subcategoryKey);
  const managedQuery = usePublishedFurnitureCatalog(language);
  const managedProducts = managedQuery.data || [];
  const { category, subcategory, validSelection, products, totalPages, page, visibleProducts, currentPath, canonicalPath: resolvedCanonicalPath } =
    getFurnitureListingPage(managedProducts, categoryKey, subcategoryKey, searchParams.get("page"));
  const canonicalPath = managedQuery.data === undefined
    ? furnitureListingPagePath(currentPath, normalizeFurnitureListingPage(searchParams.get("page"))) : resolvedCanonicalPath;
  const categoryLabel = category ? furnitureCategoryName(category.key, language) : copy.title;
  const subcategoryLabel = subcategory ? furnitureSubcategoryName(subcategory.key, language, subcategory.name) : "";
  const metaDescription = categoryCopy?.description || (validSelection && category && category.key !== "new"
    ? `${subcategoryLabel || categoryLabel} · ${copy.metaDescription}` : copy.metaDescription);
  const pagePath = (number: number) => furnitureListingPagePath(currentPath, number);

  return (
    <main className="fc-route-page fc-furniture-page" data-route-pending={managedQuery.isLoading || undefined}>
      <PageMeta ogImage={!categoryKey ? "/images/furniture/assets/7596c932c602dfc05255.webp" : undefined} title={categoryCopy?.title || [subcategoryLabel, categoryKey ? categoryLabel : copy.title].filter(Boolean).join(" | ")} description={metaDescription} canonicalPath={canonicalPath} noIndex={!validSelection} />
      <JsonLdBreadcrumb items={[
        { name: copy.home, url: "/" },
        { name: copy.title, url: "/furniture" },
        ...(categoryKey && category ? [{ name: categoryLabel, url: `/furniture/${category.key}` }] : []),
        ...(subcategory ? [{ name: subcategoryLabel, url: currentPath }] : []),
      ].map((item) => ({ ...item, url: withLanguagePrefix(item.url, language) }))} />
      <SchemeARouteHero
        kind="listing"
        showIntro={false}
        image="/images/heroes/v20261007/furniture-showcase-wide.webp"
        imageSourceWidth={2160}
        imageAlt={copy.heroImageAlt}
        label={copy.title}
        title={categoryCopy?.h1 || subcategoryLabel || (categoryKey ? categoryLabel : copy.title)}
        description={categoryCopy?.intro || copy.intro}
      />
      <div className="scheme-a-frame fc-furniture-body">
        <p className="fc-furniture-detail__note">{categoryCopy?.intro || copy.intro}</p>
        <nav className="fc-furniture-primary" aria-label={copy.title}>
          {furnitureCatalog.taxonomy.map((item) => (
            <LocalizedLink key={item.key} to={item.key === "new" ? "/furniture" : `/furniture/${item.key}`} viewTransition={false} onClick={keepFurnitureScrollPosition} aria-current={category?.key === item.key ? "page" : undefined}>
              <span>{furnitureCategoryName(item.key, language)}</span>
              <small>{getFurnitureCatalogProductsForCategory(managedProducts, item.key).length}</small>
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
        <PublicResultsBoundary query={managedQuery} loading={copy.loadingManagedProducts} error={copy.managedLoadFailed}
          isEmpty={!visibleProducts.length} empty={validSelection ? copy.noProducts : copy.notFound}
          summary={<div className="fc-furniture-list-head"><h2>{subcategoryLabel || categoryLabel}</h2><p>{products.length} {copy.products}</p></div>}>
        {visibleProducts.length ? (
          <div className="fc-furniture-grid">
            {visibleProducts.map((sourceProduct, index) => {
              const product = localizeFurnitureProduct(sourceProduct, language);
              const image = product.images[0] || product.sourceImages[0];
              return (
                <article className={`fc-furniture-card${product.availabilityNote ? " fc-furniture-card--reviewed-display" : ""}`} key={product.sourceUrl}>
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
        ) : null}
        {totalPages > 1 ? (
          <nav className="fc-furniture-pagination" aria-label={copy.page.replace("{page}", String(page)).replace("{total}", String(totalPages))}>
            {page > 1 ? <LocalizedLink to={pagePath(page - 1)}>{copy.previous}</LocalizedLink> : <span />}
            <span>{copy.page.replace("{page}", String(page)).replace("{total}", String(totalPages))}</span>
            {page < totalPages ? <LocalizedLink to={pagePath(page + 1)}>{copy.next}</LocalizedLink> : <span />}
          </nav>
        ) : null}
        </PublicResultsBoundary>
      </div>
    </main>
  );
}
