import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HeroBanner from "@/components/blocks/HeroBanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import CTABanner from "@/components/blocks/CTABanner";
import { usePublishedMaterials, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { translateDisplayText, translateMaterialCategory, translateMaterialSubcategory } from "@/i18n/displayLabels";
import { mergeMaterialCategoriesWithFallback } from "@/lib/materialCatalog";
import { materialCategoryPageText } from "@/i18n/materialCategoryPageText";



const applyPageTemplate = (template: string | undefined, values: Record<string, string>) => {
  if (!template) return "";
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
};

const categoryDescriptionZh: Record<string, string> = {
  "kitchen-cabinets": "提供美耐板、亚克力、烤漆与实木等厨房橱柜选择，适合不同预算与装修风格。",
  "whole-house-custom": "定制厨房橱柜、衣柜、电视柜与收纳系统，根据现场尺寸规划，提升空间使用效率。",
  furniture: "沙发、床、餐桌与搭配家具，适合住宅装修后期软装与空间完善。",
  bathroom: "浴缸、洗手盆、马桶、淋浴系统与浴室柜，适合完整浴室装修和局部升级。",
  "countertops-stone-surfaces": "石英石、岩板、人造石与大板瓷砖台面，适合厨房、岛台、浴室柜和商业柜台。",
  flooring: "SPC 地板、复合地板、工程木地板与 PVC 地板，适合住宅和商业空间使用。",
  "doors-windows": "实木门、复合门、谷仓门、铝合金推拉门与无框玻璃门，适合不同房间与商业空间。",
  "wall-panels": "格栅板、木饰面、背景墙砖与装饰墙板，适合电视墙、卧室和商业空间重点墙面。",
  "art-paint": "艺术涂料、微水泥、金属漆与纹理漆，适合特色墙、天花和高级室内空间。",
};

const materialTextZh: Record<string, string> = {
  "High Gloss White": "高光白",
  "Natural Teak": "天然柚木",
  "Grey Oak": "灰橡木",
  Cabinet: "橱柜",
  Cabinets: "橱柜",
  White: "白色",
  Teak: "柚木",
};

const translateMaterialDisplay = (value: string, language: "en" | "zh") => {
  const translated = translateDisplayText(value, language);
  if (language !== "zh") return translated;
  return Object.entries(materialTextZh).reduce(
    (text, [source, replacement]) => text.replace(new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), replacement),
    translated,
  );
};

const MaterialCategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { language } = useLanguage();
  const t = materialCategoryPageText[language];
  const { data: pageContent } = usePublishedSitePage(language, "materials_category");
  const { data: publishedCategories, isPending: materialsPending } = usePublishedMaterials(language);
  const categories = mergeMaterialCategoriesWithFallback(publishedCategories);
  const category = categories.find((item) => item.slug === categorySlug);
  const displayCategoryName = category ? translateMaterialCategory(category.name, language) : "";
  const categoryDescription = category
    ? language === "zh"
      ? categoryDescriptionZh[category.slug] || translateDisplayText(category.description, language)
      : category.description
    : "";

  if (materialsPending && !category) {
    return (
      <PublicLoadingState
        label="FLASH CAST"
        title={t.loadingTitle}
        description={t.loadingDescription}
      />
    );
  }

  if (!category) {
    return (
      <main className="pt-site-header section-padding text-center">
        <PageMeta title={t.notFound} description={t.notFound} canonicalPath={`/materials/category/${categorySlug || ""}`} noIndex />
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
        title={applyPageTemplate(pageContent?.seo_title, { category: displayCategoryName, description: categoryDescription }) || t.metaTitle(displayCategoryName, t.breadcrumbMaterials)}
        description={applyPageTemplate(pageContent?.seo_description || pageContent?.description, { category: displayCategoryName, description: categoryDescription }) || t.metaDescription(categoryDescription, displayCategoryName)}
        keywords={applyPageTemplate(pageContent?.seo_keywords, { category: displayCategoryName, description: categoryDescription }) || t.metaKeywords(displayCategoryName)}
        canonicalPath={`/materials/category/${category.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbMaterials, url: "/materials" }, { name: displayCategoryName, url: `/materials/category/${category.slug}` }]} />

      <HeroBanner
        image={category.image}
        imageAlt={category.alt || displayCategoryName}
        title={displayCategoryName}
        description={categoryDescription}
        backTo="/materials"
        backLabel={t.allMaterials}
        variant="detail"
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={t.browseSubcategories} description={categoryDescription} />

          <div className="card-grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {category.subcategories.map((subcategory, index) => (
              <Reveal key={subcategory.slug} delay={index * 60} direction="none">
                <article className="material-depth-card luxury-card-muted group hover-lift">
                  <div className="material-depth-card__media img-zoom">
                    <SmartImage src={subcategory.image} alt={subcategory.alt || translateMaterialSubcategory(subcategory.name, language)} loading="lazy" width={360} height={360} className="h-full w-full object-cover" />
                  </div>
                  <div className="material-depth-card__body">
                    <h3 className="material-depth-card__title">{translateMaterialSubcategory(subcategory.name, language)}</h3>
                    <p className="material-depth-card__meta">{translateDisplayText(subcategory.description, language)}</p>
                    <div className="material-depth-card__actions">
                      <Link to={`/materials/category/${category.slug}/${subcategory.slug}`} className="material-card-action">
                        {t.view} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {category.items.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow">
            <SectionHeader title={t.allProducts(displayCategoryName)} />
            <div className="card-grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {category.items.map((item, index) => (
                <Reveal key={item.id} delay={index * 60} direction="none">
                  <article className="material-depth-card luxury-card group hover-lift">
                    <div className="material-depth-card__media img-zoom">
                      <SmartImage src={item.image} alt={item.alt || translateMaterialDisplay(item.name, language)} loading="lazy" width={400} height={400} className="w-full h-full object-cover" />
                    </div>
                    <div className="material-depth-card__body">
                      <h3 className="material-depth-card__title">{translateMaterialDisplay(item.name, language)}</h3>
                      <p className="material-depth-card__meta">{t.color} {translateMaterialDisplay(item.color, language)}</p>
                      <p className="material-depth-card__meta">{t.suitable} {item.suitableSpaces.map((space) => translateMaterialDisplay(space, language)).join(", ")}</p>
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
          </div>
        </section>
      )}

      <CTABanner
        title={applyPageTemplate(pageContent?.cta_title, { category: displayCategoryName, description: categoryDescription }) || t.interested(displayCategoryName)}
        description={applyPageTemplate(pageContent?.cta_description, { category: displayCategoryName, description: categoryDescription }) || t.ctaText}
        quoteLabel={t.quote}
        whatsappLabel={t.whatsapp}
        whatsappSource="Material Category CTA"
      />
    </main>
  );
};

export default MaterialCategoryPage;
