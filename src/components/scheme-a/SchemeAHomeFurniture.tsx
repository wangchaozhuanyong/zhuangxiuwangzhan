import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <header className="scheme-a-heading home-section-heading home-furniture__intro">
          <p className="scheme-a-eyebrow">{furnitureCopy.title}</p>
          <h2 id="home-furniture-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </header>
        <div className="home-furniture__layout">
          <figure className="home-furniture__scene" data-cinematic-media>
            <DeferredSmartImage
              src="/images/heroes/hero-luxury-living.webp"
              alt={copy.sceneAlt}
              width={1920}
              height={1080}
              sourceWidth={1920}
              candidateWidths={[560, 720, 960, 1200, 1536]}
              sizes="(max-width: 767px) 100vw, 85vw"
              rootMargin="1200px 0px"
              loading="lazy"
              fetchPriority="auto"
            />
            <figcaption><strong>{copy.sceneTitle}</strong><span>{copy.sceneCaption}</span></figcaption>
          </figure>
          <div className="home-furniture__catalog">
            <PublicResultsBoundary query={query} loading={copy.loading} error={copy.loadFailed} empty={copy.empty} isEmpty={!products.length}>
              <p className="home-furniture__swipe-hint">{copy.swipeHint}</p>
              <div className="home-furniture__products" tabIndex={0} role="region" aria-label={copy.allFurniture}>
                {products.map((product) => (
                  <article className="home-furniture__product" key={product.slug}>
                    <LocalizedLink className="home-furniture__product-link" to={`/furniture/product/${encodeURIComponent(decodeURIComponent(product.slug))}`} aria-label={`${furnitureCopy.viewDetails}: ${product.name}`}>
                      <div className="home-furniture__product-image">
                        <DeferredSmartImage
                          src={product.image}
                          alt={product.name}
                          width={540}
                          height={540}
                          sizes="(max-width: 767px) 45vw, 22vw"
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
        <div className="home-furniture__actions">
          <Button asChild size="lg"><LocalizedLink to="/furniture">
            {copy.allFurniture}<ArrowUpRight aria-hidden="true" />
          </LocalizedLink></Button>
          <Button asChild variant="outline" size="lg"><a href={furnitureShopUrl} target="_blank" rel="noopener noreferrer" aria-label={furnitureCopy.floatingShop}>
            {copy.shop}<ArrowUpRight aria-hidden="true" />
          </a></Button>
        </div>
      </div>
    </section>
  );
}
