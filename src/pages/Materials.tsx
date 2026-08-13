import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { ArrowUpRight } from "lucide-react";
import { materialsData } from "@/data/materials";
import { usePublishedMaterials, usePublishedSitePage } from "@/hooks/usePublishedContent";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import CTABanner from "@/components/blocks/CTABanner";
import { translateDisplayText, translateMaterialCategory } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { buildQuotePath } from "@/lib/quoteContext";
import { materialsPageText } from "@/i18n/materialsPageText";
import { ForestSectionHeading } from "@/components/forest/ForestPagePrimitives";

const MATERIAL_CARD_IMAGE_WIDTHS = [360, 560, 720, 900];


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
    <main className="forest-material-library-page pt-site-header">
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

      <section className="forest-chapter forest-chapter--raised forest-material-library">
          <ForestSectionHeading eyebrow={pageContent?.subtitle || t.eyebrow} title={t.choose} description={t.chooseText} />

          <div className="forest-listing-grid forest-material-category-grid">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/materials/category/${category.slug}`}
                className="forest-listing-card forest-material-category-card"
              >
                <div className="forest-listing-card__media">
                  <SmartImage
                    src={category.image}
                    alt={category.alt || displayCategoryName(category.name)}
                    loading="lazy"
                    width={720}
                    height={450}
                    sizes="46vw"
                    candidateWidths={MATERIAL_CARD_IMAGE_WIDTHS}
                    quality={72}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="forest-listing-card__body">
                  <h2>{displayCategoryName(category.name)}</h2>
                  <p>
                    {displayCategoryDescription(category.description)}
                  </p>
                  <span className="forest-listing-card__action">{t.view}<ArrowUpRight aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
      </section>

      <CTABanner
        className="forest-material-cta"
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
