import { ArrowUpRight } from "lucide-react";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import LocalizedLink from "@/components/LocalizedLink";
import PublicResultsBoundary from "@/components/PublicResultsBoundary";
import { usePublishedHomeFurniture } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { furnitureCategoryName, furnitureText } from "@/i18n/furnitureText";
import { homeFurnitureText } from "@/i18n/homeFurnitureText";
import { furnitureShopUrl } from "@/lib/furnitureCatalogConfig";

export default function SchemeAHomeFurniture() {
  const { language } = useLanguage();
  const copy = homeFurnitureText[language];
  const furnitureCopy = furnitureText[language];
  // Read the bounded homepage cache immediately; only media loading is deferred.
  const query = usePublishedHomeFurniture(language);
  const products = query.data || [];

  return (
    <section className="home-furniture" data-home-section="furniture" aria-labelledby="home-furniture-title" data-cinematic-section>
      <div className="scheme-a-frame">
        <header className="home-furniture__intro">
          <p className="scheme-a-eyebrow">{furnitureCopy.title}</p>
          <h2 id="home-furniture-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </header>
        <div className="home-furniture__layout">
          <figure className="home-furniture__scene" data-cinematic-media>
            <DeferredSmartImage
              src="/images/heroes/v20260930/furniture-showcase.webp"
              alt={furnitureCopy.heroImageAlt}
              width={1536}
              height={1024}
              sourceWidth={1536}
              candidateWidths={[560, 720, 960, 1200, 1536]}
              sizes="(max-width: 767px) 100vw, 50vw"
              rootMargin="1200px 0px"
              loading="lazy"
              fetchPriority="auto"
            />
            <figcaption>{copy.sceneCaption}</figcaption>
          </figure>
          <div className="home-furniture__catalog">
            <PublicResultsBoundary query={query} loading={copy.loading} error={copy.loadFailed} empty={copy.empty} isEmpty={!products.length}>
              <div className="home-furniture__products">
                {products.map((product) => (
                  <article className="home-furniture__product" key={product.slug}>
                    <LocalizedLink className="home-furniture__product-link" to={`/furniture/product/${encodeURIComponent(decodeURIComponent(product.slug))}`} aria-label={`${furnitureCopy.viewDetails}: ${product.name}`}>
                      <div className="home-furniture__product-image">
                        <DeferredSmartImage
                          src={product.image}
                          alt={product.name}
                          width={540}
                          height={540}
                          sizes="(max-width: 767px) 76vw, (max-width: 1023px) 24vw, 22vw"
                          rootMargin="1200px 0px"
                          loading="lazy"
                          fetchPriority="auto"
                        />
                      </div>
                      <div className="home-furniture__product-copy">
                        <p>{furnitureCategoryName(product.categoryKey, language)}</p>
                        <h3>{product.name}</h3>
                        <ArrowUpRight aria-hidden="true" />
                      </div>
                    </LocalizedLink>
                  </article>
                ))}
              </div>
            </PublicResultsBoundary>
          </div>
        </div>
        <div className="home-furniture__actions scheme-a-actions">
          <LocalizedLink className="scheme-a-button" to="/furniture">
            {copy.allFurniture}<ArrowUpRight aria-hidden="true" />
          </LocalizedLink>
          <a className="scheme-a-text-link" href={furnitureShopUrl} target="_blank" rel="noopener noreferrer" aria-label={furnitureCopy.floatingShop}>
            {copy.shop}<ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
