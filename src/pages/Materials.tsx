import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { materialsData } from "@/data/materials";
import { usePublishedMaterials, usePublishedSitePage } from "@/hooks/usePublishedContent";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import CTABanner from "@/components/blocks/CTABanner";
import { translateDisplayText, translateMaterialCategory } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { buildQuotePath } from "@/lib/quoteContext";
import { materialsPageText } from "@/i18n/materialsPageText";



const Materials = () => {
  const { language } = useLanguage();
  const t = materialsPageText[language];
  const { data: publishedCategories } = usePublishedMaterials(language);
  const { data: pageContent } = usePublishedSitePage(language, "materials");
  const categories = useMemo(() => {
    const items = publishedCategories ?? [];
    const hasCountertopCategory = items.some(
      (category) => category.slug === "countertops-stone-surfaces" || /countertop|stone surface/i.test(category.name),
    );
    const countertopCategory = materialsData.find((category) => category.slug === "countertops-stone-surfaces");

    if (items.length < 8 && !hasCountertopCategory && countertopCategory) {
      return [...items, countertopCategory];
    }
    if (!items.length) return materialsData;
    return items;
  }, [publishedCategories]);
  const displayCategoryName = (value: string) => translateMaterialCategory(value, language);
  const displayCategoryDescription = (value?: string) =>
    language === "zh" ? translateDisplayText(value || "", language) : value || "";
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.materials);

  return (
    <main className="pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/materials"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbMaterials, url: "/materials" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.heroAlt}
        label={pageContent?.subtitle || t.eyebrow}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.intro}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={t.choose} description={t.chooseText} />

          <div className="material-directory-grid">
            {categories.map((category) => (
              <article
                key={category.slug}
                className="material-directory-card luxury-card group hover-lift"
              >
                <div className="material-directory-card__media img-zoom">
                  <SmartImage
                    src={category.image}
                    alt={category.alt || displayCategoryName(category.name)}
                    loading="lazy"
                    width={400}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="material-directory-card__body">
                  <h3 className="material-directory-card__title">{displayCategoryName(category.name)}</h3>
                  <p className="material-directory-card__text">
                    {displayCategoryDescription(category.description)}
                  </p>
                  <div className="material-directory-card__footer">
                    <Link
                      to={`/materials/category/${category.slug}`}
                      className="material-card-action"
                      aria-label={`${t.view} ${displayCategoryName(category.name)}`}
                    >
                      {t.view} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title={pageContent?.cta_title || t.ctaTitle}
        description={pageContent?.cta_description || t.ctaText}
        quoteLabel={t.quote}
        quotePath={buildQuotePath({ source: "materials" })}
        whatsappLabel={t.whatsapp}
        whatsappSource="Materials CTA"
      />
    </main>
  );
};

export default Materials;
