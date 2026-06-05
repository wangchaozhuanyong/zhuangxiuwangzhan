import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HeroBanner from "@/components/blocks/HeroBanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import CTABanner from "@/components/blocks/CTABanner";
import { usePublishedMaterials } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { translateDisplayText, translateMaterialCategory, translateMaterialSubcategory, translateSpaceLabel } from "@/i18n/displayLabels";
import { mergeMaterialCategoriesWithFallback } from "@/lib/materialCatalog";
import { materialSubcategoryPageText } from "@/i18n/materialSubcategoryPageText";

const MATERIAL_TILE_IMAGE_WIDTHS = [360, 560, 720];


const MaterialSubcategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug: string }>();
  const { language } = useLanguage();
  const t = materialSubcategoryPageText[language];
  const { data: publishedCategories, isPending: materialsPending } = usePublishedMaterials(language);
  const categories = mergeMaterialCategoriesWithFallback(publishedCategories);

  const category = categories.find((item) => item.slug === categorySlug);
  const subcategory = category?.subcategories.find((item) => item.slug === subcategorySlug);
  const items = category?.items.filter((item) => item.subcategory === subcategorySlug) || [];
  const displayCategoryName = category ? translateMaterialCategory(category.name, language) : "";
  const displaySubcategoryName = subcategory ? translateMaterialSubcategory(subcategory.name, language) : "";
  const displaySubcategoryDescription = subcategory ? translateDisplayText(subcategory.description, language) : "";

  if (materialsPending && (!category || !subcategory)) {
    return (
      <PublicLoadingState
        label="FLASH CAST"
        title={t.loadingTitle}
        description={t.loadingDescription}
      />
    );
  }

  if (!category || !subcategory) {
    return (
      <main className="pt-site-header section-padding text-center">
        <PageMeta title={t.notFound} description={t.notFound} canonicalPath={`/materials/category/${categorySlug || ""}/${subcategorySlug || ""}`} noIndex />
        <div className="container-narrow mx-auto max-w-lg">
          <div className="subpage-form-panel p-6 md:p-8">
            <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
            <Button asChild className="btn-brand-primary"><Link to="/materials">{t.viewAll}</Link></Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-site-header">
      <PageMeta
        title={t.metaTitle(displaySubcategoryName, displayCategoryName)}
        description={t.metaDescription(displaySubcategoryDescription, displaySubcategoryName)}
        keywords={t.metaKeywords(displaySubcategoryName, displayCategoryName)}
        canonicalPath={`/materials/category/${category.slug}/${subcategory.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbMaterials, url: "/materials" }, { name: displayCategoryName, url: `/materials/category/${category.slug}` }, { name: displaySubcategoryName, url: `/materials/category/${category.slug}/${subcategory.slug}` }]} />

      <HeroBanner
        image={subcategory.image}
        imageAlt={subcategory.alt || displaySubcategoryName}
        title={displaySubcategoryName}
        description={displaySubcategoryDescription}
        backTo={`/materials/category/${category.slug}`}
        backLabel={displayCategoryName}
        variant="detail"
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={t.products(displaySubcategoryName)} description={displaySubcategoryDescription} />
          {items.length > 0 ? (
            <div className="card-grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {items.map((item, index) => (
                <Reveal key={item.id} delay={index * 60} direction="none">
                  <article className="material-depth-card luxury-card group hover-lift">
                    <div className="material-depth-card__media img-zoom">
                      <SmartImage src={item.image} alt={item.alt || translateDisplayText(item.name, language)} loading="lazy" width={400} height={400} sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 23vw" candidateWidths={MATERIAL_TILE_IMAGE_WIDTHS} quality={72} className="w-full h-full object-cover" />
                    </div>
                    <div className="material-depth-card__body">
                      <h3 className="material-depth-card__title">{translateDisplayText(item.name, language)}</h3>
                      <p className="material-depth-card__meta">{t.color} {translateDisplayText(item.color, language)}</p>
                      <p className="material-depth-card__meta">{t.suitable} {item.suitableSpaces.map((space: string) => translateSpaceLabel(space, language)).join(", ")}</p>
                      <div className="material-depth-card__actions">
                        <Link to={`/materials/${item.slug}`} className="material-card-action">
                          {t.view} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="subpage-form-panel mx-auto max-w-xl p-6 text-center md:p-8">
              <p className="text-muted-foreground mb-2">{t.comingSoon}</p>
              <p className="text-sm text-muted-foreground mb-6">{t.enquireText(displaySubcategoryName)}</p>
              <Button asChild className="btn-brand-primary">
                <Link to="/quote">{t.quote} <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <CTABanner
        title={t.interested(displaySubcategoryName)}
        description={t.ctaText}
        quoteLabel={t.quote}
        whatsappLabel={t.whatsapp}
        whatsappSource="Material Subcategory CTA"
      />
    </main>
  );
};

export default MaterialSubcategoryPage;
