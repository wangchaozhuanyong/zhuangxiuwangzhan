import { useEffect, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import { getPublishedMaterials } from "@/lib/contentApi";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { whatsappUrl } from "@/config/site";
import heroImg from "@/assets/hero-materials.jpg";

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
    metaTitle: "装修材料库 | 地板、橱柜、浴室材料 | FLASH CAST",
    metaDescription: "浏览 FLASH CAST 装修材料库，了解定制橱柜、家具、浴室配件、地板、门窗和墙板等马来西亚装修常用材料。",
    metaKeywords: "吉隆坡装修材料, 马来西亚厨房橱柜, 浴室配件 KL, 雪兰莪定制衣柜, 装修材料库",
    breadcrumbHome: "首页",
    breadcrumbMaterials: "材料库",
    heroAlt: "FLASH CAST 装修材料库",
    eyebrow: "浏览与选择",
    title: "装修材料库",
    intro: "浏览适合马来西亚装修项目的常用材料，从定制橱柜、家具、浴室配件到地板和墙板。",
    choose: "按分类选择",
    chooseText: "选择一个材料分类，进一步查看适合项目的材料选项",
    subcategories: "个子分类",
    ctaTitle: "对某种材料感兴趣？",
    ctaText: "联系我们索取样板、确认供应情况，或获取项目报价。",
    quote: "索取报价",
    whatsapp: "WhatsApp 咨询",
  },
};

const Materials = () => {
  const { language } = useLanguage();
  const t = copy[language];
  const [categories, setCategories] = useState(materialsData);

  useEffect(() => {
    void getPublishedMaterials(language).then(setCategories);
  }, [language]);

  return (
    <main className="pt-16">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/materials" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbMaterials, url: "/materials" }]} />

      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={t.heroAlt} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>{t.eyebrow}</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {t.title}
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            {t.intro}
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10">
              <div className="accent-line mb-4 mx-auto" />
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">{t.choose}</h2>
              <p className="text-muted-foreground text-sm">{t.chooseText}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <Reveal key={category.slug} delay={index * 80}>
                <Link to={`/materials/category/${category.slug}`} className="group block hover-lift">
                  <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-muted border border-border">
                    <img src={category.image} alt={category.alt || category.name} loading="lazy" width={400} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display font-bold text-sm md:text-base leading-tight" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                        {category.name}
                      </h3>
                      <p className="text-[10px] md:text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
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

      <section className="section-padding bg-accent text-accent-foreground text-center">
        <Reveal>
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold mb-4">{t.ctaTitle}</h2>
            <p className="text-accent-foreground/80 mb-6 max-w-lg mx-auto">{t.ctaText}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="secondary" size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">{t.quote} <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
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

export default Materials;
