import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { servicesData } from "@/data/services";
import SmartImage from "@/components/SmartImage";
import { usePublishedServices, usePublishedSitePage } from "@/hooks/usePublishedContent";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroImg from "@/assets/hero-services.webp";
import HeroBanner from "@/components/blocks/HeroBanner";
import { translateDisplayText } from "@/i18n/displayLabels";

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
    geoLocation: "Kuala Lumpur and Selangor, Malaysia",
    geoConnector: ",",
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
    metaDescription: "FLASH CAST 提供吉隆坡与雪兰莪装修服务：室内设计、定制家具、商业空间装修、艺术墙面涂装、外墙工程和仓储架系统。",
    metaKeywords: "吉隆坡装修服务, 马来西亚室内设计, 雪兰莪商业装修, 定制家具, Remmers 艺术涂装",
    breadcrumbHome: "首页",
    breadcrumbServices: "服务项目",
    heroAlt: "FLASH CAST 吉隆坡装修服务",
    eyebrow: "服务范围",
    title: "服务项目",
    intro: "覆盖吉隆坡与雪兰莪的装修服务，从室内设计、定制内嵌家具到商业空间装修、艺术墙面涂装和仓储系统。",
    geoPrefix: "FLASH CAST SDN. BHD.",
    geoText: (count: number) => `提供 ${count} 项核心装修服务，服务范围覆盖`,
    geoLocation: "吉隆坡与雪兰莪",
    geoConnector: "，",
    geoEnd: "涵盖住宅、商业空间、工业设施和德国 Remmers 艺术涂装等专业项目。",
    suitableFor: "适合：",
    more: "更多",
    details: "查看详情",
    unsureTitle: "需要确认适合的装修服务？",
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

const applyPageTemplate = (template: string | undefined, values: Record<string, string | number>) => {
  if (!template) return "";
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
};

const Services = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = copy[language];
  const { data: pageContent } = usePublishedSitePage(language, "services");
  const displayText = (value: string) => translateDisplayText(value, language);
  const initialServices = useMemo(() => {
    const localize = (value: string) => translateDisplayText(value, language);
    return language === "zh"
      ? servicesData.map((service) => ({
          ...service,
          title: localize(service.title),
          summary: localize(service.summary),
          description: localize(service.description),
          suitableFor: service.suitableFor.map((item) => localize(item)),
          commonProjects: service.commonProjects.map((item) => localize(item)),
          processSteps: service.processSteps.map((step) => ({ title: localize(step.title), desc: localize(step.desc) })),
          items: service.items.map((item) => localize(item)),
          faqs: service.faqs.map((faq) => ({ q: localize(faq.q), a: localize(faq.a) })),
        }))
      : servicesData;
  }, [language]);
  const { data: services = initialServices } = usePublishedServices(language);
  const geoText = applyPageTemplate(pageContent?.content, { count: services.length });

  return (
    <main className="pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/services"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }]} />

      <HeroBanner
        image={pageContent?.image_url || heroImg}
        imageAlt={pageContent?.alt || t.heroAlt}
        label={pageContent?.subtitle || t.eyebrow}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.intro}
      />

      <section className="py-8 bg-muted border-b border-border">
        <div className="container-narrow">
          <p className="text-muted-foreground text-sm leading-relaxed text-center max-w-3xl mx-auto">
            {geoText || (language === "zh" ? (
              <>
                <strong className="text-foreground">{t.geoPrefix}</strong>
                {t.geoText(services.length)}
                <strong className="text-foreground">{t.geoLocation}</strong>
                {t.geoConnector}
                {t.geoEnd}
              </>
            ) : (
              <>
                <strong className="text-foreground">{t.geoPrefix}</strong> {t.geoText(services.length)}{" "}
                <strong className="text-foreground">{t.geoLocation}</strong>
                {t.geoConnector} {t.geoEnd}
              </>
            ))}
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
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{displayText(service.title)}</h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{displayText(service.summary)}</p>

                  <div className="mb-4">
                    <h3 className="font-semibold text-sm mb-2">{t.suitableFor}</h3>
                    <div className="flex flex-wrap gap-2">
                      {service.suitableFor.slice(0, 4).map((item: string) => (
                        <span key={item} className="text-xs px-3 py-1 bg-accent/10 text-accent rounded-full">{displayText(item)}</span>
                      ))}
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {service.items.slice(0, 8).map((item: string) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                        {displayText(item)}
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
                <div className={`${index % 2 !== 0 ? "lg:order-1" : ""} overflow-hidden rounded-card-lg img-zoom`}>
                  <SmartImage src={service.image} alt={`${displayText(service.title)} service by FLASH CAST in Kuala Lumpur`} loading="lazy" width={800} height={600} className="w-full object-cover aspect-[4/3]" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      <section className="section-padding bg-surface-dark text-center">
        <Reveal>
          <div className="container-narrow">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="heading-safe mb-4 font-display text-3xl font-bold text-surface-dark-foreground">{pageContent?.cta_title || t.unsureTitle}</h2>
            <p className="mb-6 mx-auto max-w-lg text-surface-dark-foreground/75">{pageContent?.cta_description || t.unsureText}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link to="/quote" className="btn-on-dark-primary min-h-12 w-full justify-center px-8 sm:w-auto">
                {t.quote}
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
