import Reveal from "@/components/Reveal";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import { usePublishedBrandPartners } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSectionText } from "@/i18n/homeSectionsText";
import type { PublishedBrandPartner } from "@/lib/homeContentApi";

const brandCategories = [
  { test: /blum/i, key: "blum" },
  { test: /h[aä]fele|hafele/i, key: "hafele" },
  { test: /hettich/i, key: "hettich" },
  { test: /remmers/i, key: "remmers" },
  { test: /nippon|jotun|dulux/i, key: "paint" },
  { test: /grohe/i, key: "grohe" },
  { test: /kohler|toto/i, key: "bathroom" },
  { test: /bosch|makita|hilti/i, key: "tools" },
] as const;

const getBrandCategory = (name: string, language: "en" | "zh", fallback: string) => {
  const match = brandCategories.find((item) => item.test.test(name));
  return match ? homeSectionText.brandLogos[language].categories[match.key] : fallback;
};

type BrandLogosSectionProps = {
  brandPartners?: PublishedBrandPartner[];
};

const BrandLogosSection = ({ brandPartners: providedBrands }: BrandLogosSectionProps) => {
  const { language } = useLanguage();
  const { data: fetchedBrands } = usePublishedBrandPartners({ enabled: providedBrands === undefined });
  const publishedBrands = providedBrands === undefined ? fetchedBrands : providedBrands;
  const items = publishedBrands?.filter((item) => item.logo_url && item.name) ?? [];
  const t = homeSectionText.brandLogos[language];

  if (!items.length) return null;

  return (
    <section className="section-padding brand-board-section" id="brand-partners">
      <div className="container-narrow brand-board-inner">
        <Reveal>
          <div className="brand-board-header">
            <span className="brand-board-mark" aria-hidden />
            <p className="brand-board-eyebrow">{t.eyebrow}</p>
            <h2 className="brand-board-title font-display">{t.title}</h2>
            <p className="brand-board-subtitle">{t.subtitle}</p>
          </div>
        </Reveal>

        <div className="brand-board-grid">
          {items.map((item, index) => {
            const category = getBrandCategory(item.name, language, t.fallbackCategory);
            const logo = (
              <div className="brand-board-card">
                <div className="brand-board-logo-frame">
                  <DeferredSmartImage
                    src={item.logo_url}
                    alt={item.name}
                    className="brand-board-logo"
                    width={260}
                    height={120}
                    loading="lazy"
                    resize="contain"
                    rootMargin="1200px"
                  />
                </div>
                <div className="brand-board-copy">
                  <p className="brand-board-name">{item.name}</p>
                  <p className="brand-board-category">{category}</p>
                </div>
              </div>
            );

            return (
              <Reveal key={item.id || item.name} delay={index * 40} className="brand-board-item">
                {item.website_url ? (
                  <a className="brand-board-link" href={item.website_url} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BrandLogosSection;
