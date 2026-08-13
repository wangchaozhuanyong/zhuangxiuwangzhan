import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import SmartImage from "@/components/SmartImage";
import HeroBanner from "@/components/blocks/HeroBanner";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { usePublishedMaterials, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory } from "@/i18n/displayLabels";
import { productsPageText } from "@/i18n/newClientPageText";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { stripHtml } from "@/lib/text";
import { ForestContentState, ForestFilterNav } from "@/components/forest/ForestPagePrimitives";
import { forestUiText } from "@/i18n/forestUiText";

const INITIAL_PRODUCT_LIMIT = 18;

const Products = () => {
  const { language } = useLanguage();
  const t = productsPageText[language];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_PRODUCT_LIMIT);
  const { data: categories = [], isLoading, isError, refetch } = usePublishedMaterials(language);
  const { data: pageContent } = usePublishedSitePage(language, "products");
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.products);

  const products = useMemo(() => {
    const uniqueProducts = new Map<string, (typeof categories)[number]["items"][number] & { categorySlug: string }>();
    categories.forEach((item) => item.items.forEach((product) => {
      if (!uniqueProducts.has(product.slug)) uniqueProducts.set(product.slug, { ...product, categorySlug: item.slug });
    }));
    return Array.from(uniqueProducts.values());
  }, [categories]);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = useMemo(
    () => products.filter((product) => {
      const matchesCategory = category === "all" || product.categorySlug === category;
      const searchTarget = [product.name, product.category, product.type, product.color, product.texture]
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!normalizedSearch || searchTarget.includes(normalizedSearch));
    }),
    [category, normalizedSearch, products],
  );

  const displayText = (value: string) => stripHtml(language === "zh" ? translateDisplayText(value, language) : value);

  return (
    <main className="forest-products-page pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords}
        canonicalPath="/products"
      />
      <JsonLdBreadcrumb items={[{ name: language === "zh" ? "首页" : "Home", url: "/" }, { name: language === "zh" ? "装修商品" : "Products", url: "/products" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.title}
        label={pageContent?.subtitle || t.eyebrow}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.intro}
      />

      <section className="forest-chapter forest-product-directory">
        <div className="forest-product-toolbar" aria-label={t.searchLabel}>
          <label className="forest-product-search">
            <span className="sr-only">{t.searchLabel}</span>
            <Search aria-hidden="true" />
            <input
              type="search"
              value={search}
              placeholder={t.searchPlaceholder}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleLimit(INITIAL_PRODUCT_LIMIT);
              }}
            />
          </label>
        </div>
        <ForestFilterNav
          items={[{ value: "all", label: t.all }, ...categories.map((item) => ({ value: item.slug, label: translateMaterialCategory(item.name, language) }))]}
          value={category}
          onChange={(value) => { setCategory(value); setVisibleLimit(INITIAL_PRODUCT_LIMIT); }}
          ariaLabel={t.searchLabel}
        />
        {!isLoading && !isError ? <div className="forest-listing-meta"><span>{forestUiText[language].resultCount(filteredProducts.length)}</span></div> : null}

        {isLoading ? (
          <ForestContentState variant="loading" compact description={t.loading} />
        ) : isError ? (
          <ForestContentState variant="error" compact description={t.error} onRetry={() => void refetch()} />
        ) : filteredProducts.length === 0 ? (
          <ForestContentState variant="empty" compact description={t.empty} />
        ) : (
          <>
            <div className="forest-listing-grid forest-product-catalog-grid">
              {filteredProducts.slice(0, visibleLimit).map((product) => (
                <LocalizedLink key={`${product.categorySlug}-${product.slug}`} to={`/products/${product.slug}`} className="forest-listing-card forest-product-catalog-card">
                    <div className="forest-listing-card__media">
                      <SmartImage
                        src={product.image}
                        alt={product.alt || displayText(product.name)}
                        loading="lazy"
                        width={720}
                        height={450}
                        sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                        candidateWidths={[480, 720, 960]}
                      />
                    </div>
                    <div className="forest-listing-card__body">
                      <p className="forest-listing-card__meta">{translateMaterialCategory(product.category, language)}</p>
                      <h2>{displayText(product.name)}</h2>
                      <p className="forest-product-catalog-card__description">{displayText(product.description)}</p>
                      {product.referencePrice ? (
                        <p className="forest-product-catalog-card__price">
                          <span>{t.priceLabel}</span>
                          <strong>{product.referencePrice}</strong>
                        </p>
                      ) : null}
                      <span className="forest-listing-card__action">
                        {t.view} <ArrowUpRight aria-hidden="true" />
                      </span>
                    </div>
                </LocalizedLink>
              ))}
            </div>
            {filteredProducts.length > visibleLimit ? (
              <div className="forest-load-more">
                <button type="button" className="forest-button forest-button--outline" onClick={() => setVisibleLimit((limit) => limit + INITIAL_PRODUCT_LIMIT)}>
                  {t.loadMore}
                </button>
              </div>
            ) : null}
            {filteredProducts.some((product) => Boolean(product.referencePrice)) ? (
              <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">{t.priceNotice}</p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
};

export default Products;
