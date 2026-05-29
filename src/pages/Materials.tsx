import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import { usePublishedMaterials, usePublishedSitePage } from "@/hooks/usePublishedContent";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroImg from "@/assets/hero-materials.webp";
import HeroBanner from "@/components/blocks/HeroBanner";
import { translateMaterialCategory } from "@/i18n/displayLabels";

const copy = {
  en: {
    metaTitle: "Renovation Materials Library | Flooring, Cabinets, Bathroom | Kuala Lumpur",
    metaDescription: "Browse FLASH CAST's curated material library for custom cabinets, furniture, bathroom fittings, flooring, doors, windows, and wall panels for renovation projects in Kuala Lumpur.",
    metaKeywords: "renovation materials KL, kitchen cabinets Malaysia, bathroom fittings KL, flooring Kuala Lumpur, custom wardrobe Selangor",
    breadcrumbHome: "Home",
    breadcrumbMaterials: "Materials",
    heroAlt: "FLASH CAST material library",
    eyebrow: "Browse & Select",
    title: "Material Library",
    intro: "Browse our curated selection for your renovation project, from custom cabinetry to furniture, bathroom fittings, flooring, and more.",
    choose: "Choose by Category",
    chooseText: "Select a category to explore options for your project",
    subcategories: "subcategories",
    ctaTitle: "Interested in a Material?",
    ctaText: "Contact us to request samples, check availability, or get a quotation for your project.",
    quote: "Request a Quote",
    whatsapp: "WhatsApp Us",
  },
  zh: {
    metaTitle: "装修材料库 | 地板、橱柜、浴室 | FLASH CAST",
    metaDescription: "浏览 FLASH CAST 精选材料库，了解定制橱柜、家具、浴室配件、地板、门窗与墙板等马来西亚装修常用材料。",
    metaKeywords: "吉隆坡装修材料, 马来西亚厨房橱柜, 浴室配件 KL, 地板 吉隆坡, 定制衣柜 雪兰莪",
    breadcrumbHome: "首页",
    breadcrumbMaterials: "材料库",
    heroAlt: "FLASH CAST 装修材料库",
    eyebrow: "浏览与选择",
    title: "装修材料库",
    intro: "浏览适合您装修项目的精选材料，从定制橱柜、家具到浴室配件、地板等，一站式查看。",
    choose: "按分类浏览",
    chooseText: "选择一个分类，查看适合您项目的材料选项",
    subcategories: "个子分类",
    ctaTitle: "对某种材料感兴趣？",
    ctaText: "欢迎联系我们索取样板、确认库存，或获取项目报价。",
    quote: "索取报价",
    whatsapp: "WhatsApp 咨询",
  },
};

const Materials = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = copy[language];
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
        image={pageContent?.image_url || heroImg}
        imageAlt={pageContent?.alt || t.heroAlt}
        label={pageContent?.subtitle || t.eyebrow}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.intro}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <div className="mb-10 text-center">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="mb-2 font-display text-2xl font-bold md:text-3xl">{t.choose}</h2>
              <p className="text-sm text-muted-foreground">{t.chooseText}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {categories.map((category, index) => (
              <Reveal key={category.slug} delay={index * 80}>
                <Link to={`/materials/category/${category.slug}`} className="group block hover-lift">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-card-lg border border-border bg-muted img-zoom">
                    <SmartImage
                      src={category.image}
                      alt={category.alt || displayCategoryName(category.name)}
                      loading="lazy"
                      width={400}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display text-sm font-bold leading-tight text-on-media md:text-base">
                        {displayCategoryName(category.name)}
                      </h3>
                      <p className="mt-1.5 text-[10px] text-on-media-muted md:text-xs">
                        {category.subcategories.length} {t.subcategories}
                      </p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding relative overflow-hidden bg-surface-dark text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,164,106,0.1),transparent_50%)]" aria-hidden />
        <Reveal>
          <div className="container-narrow relative">
            <h2 className="heading-safe mb-4 font-display text-3xl font-bold text-surface-dark-foreground">{pageContent?.cta_title || t.ctaTitle}</h2>
            <p className="mx-auto mb-6 max-w-lg text-surface-dark-foreground/75">{pageContent?.cta_description || t.ctaText}</p>
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

export default Materials;
