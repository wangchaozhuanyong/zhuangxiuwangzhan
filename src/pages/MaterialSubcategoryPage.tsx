import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import { getPublishedMaterials } from "@/lib/contentApi";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
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
    whatsapp: "WhatsApp 咨询",
  },
};

const MaterialSubcategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = copy[language];
  const [categories, setCategories] = useState(materialsData);

  const category = categories.find((item) => item.slug === categorySlug);
  const subcategory = category?.subcategories.find((item) => item.slug === subcategorySlug);
  const items = category?.items.filter((item) => item.subcategory === subcategorySlug) || [];
  const displayCategoryName = category ? translateMaterialCategory(category.name, language) : "";
  const displaySubcategoryName = subcategory ? translateMaterialSubcategory(subcategory.name, language) : "";

  useEffect(() => {
    void getPublishedMaterials(language).then(setCategories);
  }, [language]);

  if (!category || !subcategory) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/materials">{t.viewAll}</Link></Button>
      </main>
    );
  }

  return (
    <main className="pt-16">
      <PageMeta
        title={`${displaySubcategoryName} | ${displayCategoryName} | FLASH CAST`}
        description={t.metaDescription(subcategory.description, displaySubcategoryName)}
        keywords={t.metaKeywords(displaySubcategoryName, displayCategoryName)}
        canonicalPath={`/materials/category/${category.slug}/${subcategory.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbMaterials, url: "/materials" }, { name: displayCategoryName, url: `/materials/category/${category.slug}` }, { name: displaySubcategoryName, url: `/materials/category/${category.slug}/${subcategory.slug}` }]} />

      <section className="bg-muted border-b border-border">
        <div className="section-padding !pb-0">
          <div className="container-narrow">
            <Link to={`/materials/category/${category.slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {displayCategoryName}
            </Link>
            <div className="accent-line mb-4" />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 md:text-center">{displaySubcategoryName}</h1>
            <p className="text-muted-foreground max-w-xl md:mx-auto md:text-center pb-12 md:pb-16">{subcategory.description}</p>
          </div>
        </div>
      </section>

      <section className="section-padding-next bg-background">
        <div className="container-narrow">
          {items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((item, index) => (
                <Reveal key={item.id} delay={index * 60} direction="none">
                  <Link to={`/materials/${item.slug}`} className="group block hover-lift">
                    <div className="relative overflow-hidden rounded-lg aspect-square mb-3 bg-muted border border-border img-zoom">
                      <img src={item.image} alt={item.alt || item.name} loading="lazy" width={400} height={400} className="w-full h-full object-cover" />
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

      <section className="section-padding bg-accent text-accent-foreground text-center">
        <Reveal>
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold mb-4">{t.interested(displaySubcategoryName)}</h2>
            <p className="text-accent-foreground/80 mb-6 max-w-lg mx-auto">{t.ctaText}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="secondary" size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">{t.quote} <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsapp}
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
};

export default MaterialSubcategoryPage;
