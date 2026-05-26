import { useEffect, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { servicesData } from "@/data/services";
import { getPublishedServices } from "@/lib/contentApi";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { whatsappUrl } from "@/config/site";
import heroImg from "@/assets/hero-services.jpg";

const copy = {
  en: {
    metaTitle: "Renovation Services Kuala Lumpur | Interior, Built-In, Commercial & Artistic Coating",
    metaDescription: "Explore FLASH CAST's comprehensive renovation services in Kuala Lumpur and Selangor: interior design, custom built-in furniture, commercial fit-out, artistic wall coating, exterior works, and warehouse solutions.",
    metaKeywords: "renovation services KL, interior design Kuala Lumpur, custom built-in Malaysia, commercial renovation Selangor, artistic wall coating Remmers, shop renovation KL",
    breadcrumbHome: "Home",
    breadcrumbServices: "Services",
    heroAlt: "FLASH CAST renovation services in Kuala Lumpur",
    eyebrow: "What We Do",
    title: "Our Services",
    intro: "Comprehensive renovation services across Kuala Lumpur and Selangor, from interior design and custom built-in to commercial fit-out, artistic wall coating, and warehouse systems.",
    geoPrefix: "FLASH CAST SDN. BHD.",
    geoText: (count: number) => `provides ${count} core renovation services in`,
    geoEnd: "covering residential homes, commercial spaces, industrial facilities, and specialty finishes including German Remmers artistic coatings.",
    suitableFor: "Suitable For:",
    more: "more",
    details: "View Full Details",
    unsureTitle: "Not Sure What You Need?",
    unsureText: "Contact us for a free consultation. We will assess your space and recommend the right approach.",
    quote: "Get a Free Quote",
    whatsapp: "WhatsApp Us",
    internalProjects: "Projects",
    internalMaterials: "Materials",
    internalBlog: "Blog",
    internalFaq: "FAQ",
    internalContact: "Contact",
  },
  zh: {
    metaTitle: "吉隆坡装修服务 | 室内装修、定制家具、商业空间 | FLASH CAST",
    metaDescription: "FLASH CAST 提供 Kuala Lumpur 与 Selangor 装修服务：室内设计、定制家具、商业空间装修、艺术墙面涂装、外墙工程和仓储架系统。",
    metaKeywords: "吉隆坡装修服务, 马来西亚室内设计, Selangor 商业装修, 定制家具, Remmers 艺术涂装",
    breadcrumbHome: "首页",
    breadcrumbServices: "服务项目",
    heroAlt: "FLASH CAST 吉隆坡装修服务",
    eyebrow: "服务范围",
    title: "服务项目",
    intro: "覆盖 Kuala Lumpur 与 Selangor 的装修服务，从室内设计、定制内嵌家具到商业空间装修、艺术墙面涂装和仓储系统。",
    geoPrefix: "FLASH CAST SDN. BHD.",
    geoText: (count: number) => `在 Kuala Lumpur 与 Selangor 提供 ${count} 项核心装修服务，`,
    geoEnd: "涵盖住宅、商业空间、工业设施和德国 Remmers 艺术涂装等专业项目。",
    suitableFor: "适合：",
    more: "更多",
    details: "查看详情",
    unsureTitle: "不确定需要哪种服务？",
    unsureText: "联系我们免费咨询，我们会根据你的空间和预算建议合适方案。",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 咨询",
    internalProjects: "装修案例",
    internalMaterials: "材料库",
    internalBlog: "装修博客",
    internalFaq: "常见问题",
    internalContact: "联系我们",
  },
};

const Services = () => {
  const { language } = useLanguage();
  const t = copy[language];
  const [services, setServices] = useState(servicesData);

  useEffect(() => {
    void getPublishedServices(language).then(setServices);
  }, [language]);

  return (
    <main className="pt-16">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/services" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }]} />

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

      <section className="py-8 bg-muted border-b border-border">
        <div className="container-narrow">
          <p className="text-muted-foreground text-sm leading-relaxed text-center max-w-3xl mx-auto">
            <strong className="text-foreground">{t.geoPrefix}</strong> {t.geoText(services.length)} <strong className="text-foreground">Kuala Lumpur</strong> and <strong className="text-foreground">Selangor</strong>, Malaysia, {t.geoEnd}
          </p>
        </div>
      </section>

      {services.map((service, index) => (
        <section key={service.id} className={`section-padding ${index % 2 === 0 ? "bg-background" : "bg-muted"}`}>
          <div className="container-narrow">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <Reveal direction={index % 2 !== 0 ? "right" : "left"}>
                <div className={index % 2 !== 0 ? "lg:order-2" : ""}>
                  <div className="accent-line mb-4" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{service.title}</h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{service.summary}</p>

                  <div className="mb-4">
                    <h3 className="font-semibold text-sm mb-2">{t.suitableFor}</h3>
                    <div className="flex flex-wrap gap-2">
                      {service.suitableFor.slice(0, 4).map((item: string) => (
                        <span key={item} className="text-xs px-3 py-1 bg-accent/10 text-accent rounded-full">{item}</span>
                      ))}
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {service.items.slice(0, 8).map((item: string) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                        {item}
                      </li>
                    ))}
                    {service.items.length > 8 && (
                      <li className="text-sm text-muted-foreground">+{service.items.length - 8} {t.more}</li>
                    )}
                  </ul>
                  <Button className="btn-press" asChild>
                    <Link to={`/services/${service.slug}`}>{t.details} <ArrowRight className="ml-2 w-4 h-4" /></Link>
                  </Button>
                </div>
              </Reveal>
              <Reveal direction={index % 2 !== 0 ? "left" : "right"} delay={150}>
                <div className={`${index % 2 !== 0 ? "lg:order-1" : ""} overflow-hidden rounded-lg img-zoom`}>
                  <img src={service.image} alt={`${service.title} service by FLASH CAST in Kuala Lumpur`} loading="lazy" width={800} height={600} className="w-full object-cover aspect-[4/3]" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      <section className="section-padding bg-surface-dark text-center">
        <Reveal>
          <div className="container-narrow">
            <div className="accent-line mx-auto mb-4" style={{ backgroundColor: "hsl(var(--gold))" }} />
            <h2 className="font-display text-3xl font-bold mb-4 text-primary-foreground">{t.unsureTitle}</h2>
            <p className="text-steel-light mb-6 max-w-lg mx-auto">{t.unsureText}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">{t.quote}</Link>
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

      <section className="py-8 bg-background border-t border-border">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/projects" className="text-accent hover:underline">{t.internalProjects}</Link>{" / "}
            <Link to="/materials" className="text-accent hover:underline">{t.internalMaterials}</Link>{" / "}
            <Link to="/blog" className="text-accent hover:underline">{t.internalBlog}</Link>{" / "}
            <Link to="/faq" className="text-accent hover:underline">{t.internalFaq}</Link>{" / "}
            <Link to="/contact" className="text-accent hover:underline">{t.internalContact}</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Services;
