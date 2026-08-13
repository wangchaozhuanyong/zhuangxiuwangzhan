import { ArrowRight } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import Reveal from "@/components/Reveal";
import { usePublishedProductHighlights } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateMaterialCategory } from "@/i18n/displayLabels";
import { homeNewModulesText } from "@/i18n/newClientPageText";

const HomeProductsSection = () => {
  const { language } = useLanguage();
  const t = homeNewModulesText[language];
  const { data: products = [] } = usePublishedProductHighlights(language, 4);
  const displayText = (value: string) => language === "zh" ? translateDisplayText(value, language) : value;

  if (!products.length) return null;

  return (
    <section className="home-products-section section-padding" id="products">
      <div className="site-container">
        <Reveal>
          <div className="home-new-section-heading">
            <div>
              <p className="new-client-page__eyebrow">{t.productsEyebrow}</p>
              <h2>{t.productsTitle}</h2>
            </div>
            <div>
              <p>{t.productsIntro}</p>
              <LocalizedLink to="/products">
                {t.productsViewAll} <ArrowRight className="h-4 w-4" />
              </LocalizedLink>
            </div>
          </div>
        </Reveal>

        <div className="home-products-grid">
          {products.map((product, index) => (
            <Reveal key={product.slug} delay={index * 70}>
              <LocalizedLink to={`/materials/${product.slug}`} className="home-product-card group">
                <div className="home-product-card__media">
                  <DeferredSmartImage
                    src={product.image}
                    alt={product.alt || displayText(product.name)}
                    width={720}
                    height={560}
                    loading="lazy"
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                    candidateWidths={[420, 640, 820]}
                    rootMargin="1000px"
                  />
                </div>
                <div className="home-product-card__body">
                  <p>{translateMaterialCategory(product.category, language)}</p>
                  <h3>{displayText(product.name)}</h3>
                  <span>{t.productsView} <ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </LocalizedLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeProductsSection;
