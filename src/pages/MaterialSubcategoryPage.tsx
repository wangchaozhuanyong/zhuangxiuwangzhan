import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HeroBanner from "@/components/blocks/HeroBanner";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import { usePublishedMaterials } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { translateMaterialCategory, translateMaterialSubcategory } from "@/i18n/displayLabels";

const copy = {
  en: {
    notFound: "Subcategory Not Found",
    viewAll: "View All Materials",
    breadcrumbHome: "Home",
    breadcrumbMaterials: "Materials",
    metaDescription: (description: string, name: string) => `${description} Browse ${name.toLowerCase()} for your renovation project in Kuala Lumpur.`,
    metaKeywords: (name: string, category: string) => `${name} KL, ${name.toLowerCase()} Malaysia, ${category.toLowerCase()} renovation`,
    color: "Color:",
    suitable: "Suitable:",
    comingSoon: "Products coming soon for this category.",
    enquireText: (name: string) => `Contact us to enquire about ${name.toLowerCase()} options.`,
    quote: "Request a Quote",
    interested: (name: string) => `Interested in ${name}?`,
    ctaText: "Contact us to request samples, check availability, or get a quotation for your project.",
    whatsapp: "WhatsApp Us",
  },
  zh: {
    notFound: "子分类不存在",
    viewAll: "查看全部材料",
    breadcrumbHome: "首页",
    breadcrumbMaterials: "材料库",
    metaDescription: (description: string, name: string) => `${description} 浏览 ${name} 材料选项，适用于吉隆坡装修项目。`,
    metaKeywords: (name: string, category: string) => `${name} 吉隆坡, ${name} 马来西亚, ${category} 装修材料`,
    color: "颜色：",
    suitable: "适合：",
    comingSoon: "此分类的产品即将更新。",
    enquireText: (name: string) => `欢迎联系我们咨询 ${name} 材料选项。`,
    quote: "索取报价",
    interested: (name: string) => `对 ${name} 感兴趣？`,
    ctaText: "联系我们索取样板、确认供应情况，或获取项目报价。",
    whatsapp: "WhatsApp 联系",
  },
};

const MaterialSubcategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = copy[language];
  const { data: publishedCategories } = usePublishedMaterials(language);
  const categories = publishedCategories?.length ? publishedCategories : materialsData;

  const category = categories.find((item) => item.slug === categorySlug);
  const subcategory = category?.subcategories.find((item) => item.slug === subcategorySlug);
  const items = category?.items.filter((item) => item.subcategory === subcategorySlug) || [];
  const displayCategoryName = category ? translateMaterialCategory(category.name, language) : "";
  const displaySubcategoryName = subcategory ? translateMaterialSubcategory(subcategory.name, language) : "";

  if (!category || !subcategory) {
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
        title={`${displaySubcategoryName} | ${displayCategoryName} | FLASH CAST`}
        description={t.metaDescription(subcategory.description, displaySubcategoryName)}
        keywords={t.metaKeywords(displaySubcategoryName, displayCategoryName)}
        canonicalPath={`/materials/category/${category.slug}/${subcategory.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbMaterials, url: "/materials" }, { name: displayCategoryName, url: `/materials/category/${category.slug}` }, { name: displaySubcategoryName, url: `/materials/category/${category.slug}/${subcategory.slug}` }]} />

      <HeroBanner
        image={subcategory.image}
        imageAlt={subcategory.alt || displaySubcategoryName}
        title={displaySubcategoryName}
        description={subcategory.description}
        backTo={`/materials/category/${category.slug}`}
        backLabel={displayCategoryName}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          {items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((item, index) => (
                <Reveal key={item.id} delay={index * 60} direction="none">
                  <Link to={`/materials/${item.slug}`} className="group block hover-lift">
                    <div className="relative aspect-square overflow-hidden rounded-card mb-3 bg-muted border border-border img-zoom">
                      <SmartImage src={item.image} alt={item.alt || item.name} loading="lazy" width={400} height={400} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">{item.name}</h3>
                    <p className="text-muted-foreground text-xs">{t.color} {item.color}</p>
                    <p className="text-muted-foreground text-xs">{t.suitable} {item.suitableSpaces.join(", ")}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-2">{t.comingSoon}</p>
              <p className="text-sm text-muted-foreground mb-6">{t.enquireText(displaySubcategoryName)}</p>
              <Button asChild>
                <Link to="/quote">{t.quote} <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="section-padding relative overflow-hidden bg-surface-dark text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,164,106,0.1),transparent_50%)]" aria-hidden />
        <Reveal>
          <div className="container-narrow relative">
            <h2 className="heading-safe mb-4 font-display text-3xl font-bold text-surface-dark-foreground">{t.interested(displaySubcategoryName)}</h2>
            <p className="mx-auto mb-6 max-w-lg text-surface-dark-foreground/75">{t.ctaText}</p>
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

export default MaterialSubcategoryPage;
