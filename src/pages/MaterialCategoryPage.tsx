import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
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
    metaDescription: (description: string, name: string) => `${description} 浏览 ${name} 材料选项，适用于 Kuala Lumpur 与 Selangor 装修项目。`,
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

const MaterialCategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = copy[language];
  const { data: publishedCategories } = usePublishedMaterials(language);
  const categories = publishedCategories?.length ? publishedCategories : materialsData;
  const category = categories.find((item) => item.slug === categorySlug);
  const displayCategoryName = category ? translateMaterialCategory(category.name, language) : "";

  if (!category) {
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
        title={`${displayCategoryName} | ${t.breadcrumbMaterials} | FLASH CAST`}
        description={t.metaDescription(category.description, displayCategoryName)}
        keywords={t.metaKeywords(displayCategoryName)}
        canonicalPath={`/materials/category/${category.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbMaterials, url: "/materials" }, { name: displayCategoryName, url: `/materials/category/${category.slug}` }]} />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <SmartImage src={category.image} alt={category.alt || displayCategoryName} className="w-full h-full object-cover" width={1200} height={500} loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        </div>
        <div className="relative z-10 section-padding">
          <div className="container-narrow">
            <Link to="/materials" className="inline-flex items-center gap-1.5 text-sm hover:text-accent mb-6 transition-colors" style={{ color: "rgba(255,255,255,0.75)" }}>
              <ArrowLeft className="w-4 h-4" /> {t.allMaterials}
            </Link>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 md:text-center" style={{ color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>
              {displayCategoryName}
            </h1>
            <p className="max-w-xl md:mx-auto md:text-center" style={{ color: "rgba(255,255,255,0.75)" }}>{category.description}</p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <h2 className="font-display text-xl md:text-2xl font-bold mb-6">{t.browseSubcategories}</h2>
          </Reveal>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:gap-5">
            {category.subcategories.map((subcategory, index) => (
              <Reveal key={subcategory.slug} delay={index * 60} direction="none">
                <Link to={`/materials/category/${category.slug}/${subcategory.slug}`} className="snap-start shrink-0 w-44 sm:w-48 md:w-auto group block hover-lift">
                  <div className="relative overflow-hidden rounded-xl aspect-square bg-muted border border-border">
                    <SmartImage src={subcategory.image} alt={subcategory.alt || translateMaterialSubcategory(subcategory.name, language)} loading="lazy" width={300} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-sm leading-tight" style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
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
                    <div className="relative overflow-hidden rounded-lg aspect-square mb-3 bg-card border border-border img-zoom">
                      <SmartImage src={item.image} alt={item.alt || item.name} loading="lazy" width={400} height={400} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">{item.name}</h3>
                    <p className="text-muted-foreground text-xs">{t.color} {item.color}</p>
                    <p className="text-muted-foreground text-xs">{t.suitable} {item.suitableSpaces.join(", ")}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-padding bg-accent text-accent-foreground text-center">
        <Reveal>
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold mb-4">{t.interested(displayCategoryName)}</h2>
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

export default MaterialCategoryPage;
