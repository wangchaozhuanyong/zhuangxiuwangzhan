import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HeroBanner from "@/components/blocks/HeroBanner";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import { usePublishedMaterials, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { translateDisplayText, translateMaterialCategory, translateMaterialSubcategory } from "@/i18n/displayLabels";

const copy = {
  en: {
    notFound: "Category Not Found",
    viewAll: "View All Materials",
    breadcrumbHome: "Home",
    breadcrumbMaterials: "Materials",
    metaDescription: (description: string, name: string) => `${description} Browse ${name.toLowerCase()} options for your renovation project in Kuala Lumpur and Selangor.`,
    metaKeywords: (name: string) => `${name} KL, ${name.toLowerCase()} renovation Malaysia`,
    allMaterials: "All Materials",
    browseSubcategories: "Browse Subcategories",
    allProducts: (name: string) => `All ${name} Products`,
    color: "Color:",
    suitable: "Suitable:",
    interested: (name: string) => `Interested in ${name}?`,
    ctaText: "Contact us to request samples, check availability, or get a quotation for your project.",
    quote: "Request a Quote",
    whatsapp: "WhatsApp Us",
  },
  zh: {
    notFound: "分类不存在",
    viewAll: "查看全部材料",
    breadcrumbHome: "首页",
    breadcrumbMaterials: "材料库",
    metaDescription: (description: string, name: string) => `${description} 浏览 ${name} 材料选项，适用于吉隆坡与雪兰莪装修项目。`,
    metaKeywords: (name: string) => `${name} 吉隆坡, ${name} 装修材料, 马来西亚装修`,
    allMaterials: "全部材料",
    browseSubcategories: "浏览子分类",
    allProducts: (name: string) => `全部 ${name} 产品`,
    color: "颜色：",
    suitable: "适合：",
    interested: (name: string) => `对 ${name} 感兴趣？`,
    ctaText: "联系我们索取样板、确认供应情况，或获取项目报价。",
    quote: "索取报价",
    whatsapp: "WhatsApp 咨询",
  },
};

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
  const settings = useSiteSettings();
  const t = copy[language];
  const { data: pageContent } = usePublishedSitePage(language, "materials_category");
  const { data: publishedCategories } = usePublishedMaterials(language);
  const categories = publishedCategories?.length ? publishedCategories : materialsData;
  const category = categories.find((item) => item.slug === categorySlug);
  const displayCategoryName = category ? translateMaterialCategory(category.name, language) : "";
  const categoryDescription = category
    ? language === "zh"
      ? categoryDescriptionZh[category.slug] || translateDisplayText(category.description, language)
      : category.description
    : "";

  if (!category) {
    return (
      <main className="pt-site-header section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/materials">{t.viewAll}</Link></Button>
      </main>
    );
  }

  return (
    <main className="pt-site-header">
      <PageMeta
        title={applyPageTemplate(pageContent?.seo_title, { category: displayCategoryName, description: categoryDescription }) || `${displayCategoryName} | ${t.breadcrumbMaterials} | FLASH CAST`}
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
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <h2 className="font-display text-xl md:text-2xl font-bold mb-6">{t.browseSubcategories}</h2>
          </Reveal>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:gap-5">
            {category.subcategories.map((subcategory, index) => (
              <Reveal key={subcategory.slug} delay={index * 60} direction="none">
                <Link to={`/materials/category/${category.slug}/${subcategory.slug}`} className="snap-start shrink-0 w-44 sm:w-48 md:w-auto group block hover-lift">
                  <div className="relative aspect-square overflow-hidden rounded-card border border-border bg-muted">
                    <SmartImage src={subcategory.image} alt={subcategory.alt || translateMaterialSubcategory(subcategory.name, language)} loading="lazy" width={300} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-semibold leading-tight text-on-media">
                        {translateMaterialSubcategory(subcategory.name, language)}
                      </h3>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {category.items.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow">
            <Reveal>
              <h2 className="font-display text-xl md:text-2xl font-bold mb-6">{t.allProducts(displayCategoryName)}</h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {category.items.map((item, index) => (
                <Reveal key={item.id} delay={index * 60} direction="none">
                  <Link to={`/materials/${item.slug}`} className="group block hover-lift">
                    <div className="relative aspect-square overflow-hidden rounded-card mb-3 bg-card border border-border img-zoom">
                      <SmartImage src={item.image} alt={item.alt || translateMaterialDisplay(item.name, language)} loading="lazy" width={400} height={400} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">{translateMaterialDisplay(item.name, language)}</h3>
                    <p className="text-muted-foreground text-xs">{t.color} {translateMaterialDisplay(item.color, language)}</p>
                    <p className="text-muted-foreground text-xs">{t.suitable} {item.suitableSpaces.map((space) => translateMaterialDisplay(space, language)).join(", ")}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-padding relative overflow-hidden bg-surface-dark text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,164,106,0.1),transparent_50%)]" aria-hidden />
        <Reveal>
          <div className="container-narrow relative">
            <h2 className="heading-safe mb-4 font-display text-3xl font-bold text-surface-dark-foreground">
              {applyPageTemplate(pageContent?.cta_title, { category: displayCategoryName, description: categoryDescription }) || t.interested(displayCategoryName)}
            </h2>
            <p className="mx-auto mb-6 max-w-lg text-surface-dark-foreground/75">
              {applyPageTemplate(pageContent?.cta_description, { category: displayCategoryName, description: categoryDescription }) || t.ctaText}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link to="/quote" className="btn-on-dark-primary min-h-12 w-full justify-center px-8 sm:w-auto">
                {t.quote} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={settings.whatsapp_url()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-on-dark-secondary min-h-12 w-full justify-center px-8 sm:w-auto"
              >
                <WhatsAppIcon className="mr-2 h-[18px] w-[18px] text-whatsapp" /> {t.whatsapp}
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
};

export default MaterialCategoryPage;
