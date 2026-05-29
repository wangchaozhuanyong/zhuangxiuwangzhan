import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { servicesData } from "@/data/services";
import { usePublishedServiceBySlug, usePublishedServices, usePublishedSitePage } from "@/hooks/usePublishedContent";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import { JsonLdService, JsonLdBreadcrumb, JsonLdFAQ } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateDisplayText } from "@/i18n/displayLabels";

const copy = {
  en: {
    notFound: "Service Not Found",
    viewAll: "View All Services",
    metaSuffix: "FLASH CAST Renovation Services",
    metaKeywords: (title: string) => `${title} KL, ${title} Malaysia, renovation Kuala Lumpur`,
    breadcrumbHome: "Home",
    breadcrumbServices: "Services",
    allServices: "All Services",
    services: "Services",
    getQuote: "Get a Quote",
    whatsapp: "WhatsApp Us",
    overview: "Overview",
    suitableFor: "Suitable For",
    offer: "What We Offer",
    commonProjects: "Common Projects",
    process: "Our Process",
    faq: "Frequently Asked Questions",
    relatedServices: "Related Services",
    viewProjects: "View Projects",
    materialLibrary: "Material Library",
    faqLink: "FAQ",
    interested: (title: string) => `Interested in ${title}?`,
    ctaText: "Contact us for a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.",
    freeQuote: "Get a Free Quote",
  },
  zh: {
    notFound: "服务不存在",
    viewAll: "查看全部服务",
    metaSuffix: "FLASH CAST 装修服务",
    metaKeywords: (title: string) => `${title} 吉隆坡, ${title} 马来西亚, Kuala Lumpur 装修服务`,
    breadcrumbHome: "首页",
    breadcrumbServices: "服务项目",
    allServices: "全部服务",
    services: "服务项目",
    getQuote: "获取报价",
    whatsapp: "WhatsApp 咨询",
    overview: "服务概览",
    suitableFor: "适合空间",
    offer: "我们提供",
    commonProjects: "常见项目",
    process: "服务流程",
    faq: "常见问题",
    relatedServices: "相关服务",
    viewProjects: "查看案例",
    materialLibrary: "材料库",
    faqLink: "常见问题",
    interested: (title: string) => `想了解 ${title}？`,
    ctaText: "联系我们获取免费咨询与报价。我们服务吉隆坡、雪兰莪与周边地区。",
    freeQuote: "获取免费报价",
  },
};

const zhCopy = {
  notFound: "服务不存在",
  viewAll: "查看全部服务",
  metaSuffix: "FLASH CAST 装修服务",
  metaKeywords: (title: string) => `${title} 吉隆坡, ${title} 马来西亚, Kuala Lumpur 装修服务`,
  breadcrumbHome: "首页",
  breadcrumbServices: "服务项目",
  allServices: "全部服务",
  services: "服务项目",
  getQuote: "获取报价",
  whatsapp: "WhatsApp 咨询",
  overview: "服务概览",
  suitableFor: "适合空间",
  offer: "我们提供",
  commonProjects: "常见项目",
  process: "服务流程",
  faq: "常见问题",
  relatedServices: "相关服务",
  viewProjects: "查看案例",
  materialLibrary: "材料库",
  faqLink: "常见问题",
  interested: (title: string) => `想了解 ${title}？`,
  ctaText: "联系我们获取免费咨询与报价。我们服务吉隆坡、雪兰莪与周边地区。",
  freeQuote: "获取免费报价",
};

const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = language === "zh" ? zhCopy : copy.en;
  const { data: pageContent } = usePublishedSitePage(language, "service_detail");
  const { data: cmsService, isLoading: isServiceLoading } = usePublishedServiceBySlug(slug, language);
  const displayText = (value: string) => translateDisplayText(value, language);
  const initialServices = language === "zh"
    ? servicesData.map((service) => ({
        ...service,
        title: displayText(service.title),
        summary: displayText(service.summary),
        description: displayText(service.description),
        suitableFor: service.suitableFor.map((item) => displayText(item)),
        commonProjects: service.commonProjects.map((item) => displayText(item)),
        processSteps: service.processSteps.map((step) => ({ title: displayText(step.title), desc: displayText(step.desc) })),
        items: service.items.map((item) => displayText(item)),
        faqs: service.faqs.map((faq) => ({ q: displayText(faq.q), a: displayText(faq.a) })),
      }))
    : servicesData;
  const { data: cmsServices } = usePublishedServices(language);
  const services = useMemo(
    () => (cmsServices?.length ? cmsServices : initialServices),
    [cmsServices, initialServices],
  );

  const service = cmsService || services.find((item) => item.slug === slug);

  if (isServiceLoading && !cmsService) {
    return (
      <main className="pt-site-header section-padding text-center">
        <p className="text-sm text-muted-foreground">{language === "zh" ? "正在加载服务内容..." : "Loading service content..."}</p>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="pt-site-header section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/services">{t.viewAll}</Link></Button>
      </main>
    );
  }

  const heroImage = service.image;
  const serviceTitle = displayText(service.title);
  const serviceSummary = displayText(service.summary);
  const serviceDescription = displayText(service.description);
  const serviceSuitableFor = service.suitableFor.map((item: string) => displayText(item));
  const serviceItems = service.items.map((item: string) => displayText(item));
  const serviceCommonProjects = service.commonProjects.map((item: string) => displayText(item));
  const serviceProcessSteps = service.processSteps.map((step: any) => ({
    title: displayText(step.title),
    desc: displayText(step.desc),
  }));
  const serviceFaqs = service.faqs.map((faq: any) => ({
    q: displayText(faq.q),
    a: displayText(faq.a),
  }));

  return (
    <main className="pt-site-header">
      <PageMeta
        title={service.seoTitle || `${serviceTitle} Kuala Lumpur | ${t.metaSuffix}`}
        description={service.seoDescription || stripHtml(serviceSummary)}
        keywords={t.metaKeywords(serviceTitle)}
        canonicalPath={`/services/${service.slug}`}
      />
      <JsonLdService name={serviceTitle} description={serviceSummary} />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }, { name: serviceTitle, url: `/services/${service.slug}` }]} />
      <JsonLdFAQ faqs={serviceFaqs.map((faq: any) => ({ question: faq.q, answer: faq.a }))} />

      <section className="page-hero">
        <div className="absolute inset-0">
          <SmartImage src={heroImage} alt={serviceTitle} className="h-full w-full object-cover" width={1920} height={800} loading="eager" fetchPriority="high" />
          <div className="absolute inset-0 media-readable-overlay" aria-hidden="true" />
        </div>
        <div className="page-hero__content site-container">
          <Link to="/services" className="mb-6 inline-flex items-center gap-1 text-sm text-on-media-muted transition-colors hover:text-gold">
            <ArrowLeft className="h-3.5 w-3.5" /> {t.allServices}
          </Link>
          <p className="mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{t.services}</p>
          <h1 className="heading-safe mb-4 max-w-2xl text-3xl font-bold text-on-media md:text-5xl">{serviceTitle}</h1>
          <p className="prose-safe mb-8 max-w-2xl text-base text-on-media-muted md:text-lg">{serviceSummary}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/quote" className="btn-on-dark-primary min-h-12 justify-center px-8 sm:w-auto">
              {t.getQuote} <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={settings.whatsapp_url()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-on-dark-secondary min-h-12 justify-center px-8 sm:w-auto"
            >
              <WhatsAppIcon className="mr-2 h-[18px] w-[18px] text-whatsapp" /> {t.whatsapp}
            </a>
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Reveal direction="left">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{t.overview}</h2>
                {isHtmlText(serviceDescription) ? (
                  <div className="prose prose-neutral max-w-none text-muted-foreground mb-6" dangerouslySetInnerHTML={{ __html: sanitizeHtml(serviceDescription) }} />
                ) : (
                  <p className="text-muted-foreground leading-relaxed mb-6">{serviceDescription}</p>
                )}
                <h3 className="font-semibold mb-3">{t.suitableFor}</h3>
                <ul className="space-y-2 mb-6">
                  {serviceSuitableFor.map((item: string) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal direction="right" delay={150}>
              <div>
                <h3 className="font-semibold mb-3">{t.offer}</h3>
                <div className="grid grid-cols-1 gap-2">
                  {serviceItems.map((item: string) => (
                    <div key={item} className="flex items-center gap-2 py-2.5 px-4 bg-muted rounded-md text-sm transition-colors hover:bg-accent/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <h2 className="font-display text-2xl font-bold mb-6">{t.commonProjects}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {serviceCommonProjects.map((project: string) => (
              <div key={project} className="rounded-card border border-border bg-background p-4 text-center text-sm font-medium">
                {project}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">{t.process}</h2>
          <div className="space-y-6">
            {serviceProcessSteps.map((step: any, index: number) => (
              <div key={`${step.title}-${index}`} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/15 text-sm font-bold text-gold">
                  {index + 1}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow max-w-3xl">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">{t.faq}</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {serviceFaqs.map((faq: any, index: number) => (
              <AccordionItem key={`${faq.q}-${index}`} value={`faq-${index}`} className="bg-background rounded-card border border-border px-4">
                <AccordionTrigger className="text-left font-medium text-sm md:text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">{t.relatedServices}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {services
              .filter((item) => item.slug !== service.slug)
              .slice(0, 3)
              .map((item) => (
                <Link
                  key={item.slug}
                  to={`/services/${item.slug}`}
                  className="group p-5 rounded-card border border-border bg-card hover-lift text-center block transition-colors hover:border-accent/30"
                >
                  <h3 className="font-display font-semibold text-sm mb-1 group-hover:text-accent transition-colors">
                    {displayText(item.title)}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{displayText(item.summary)}</p>
                </Link>
              ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
            <Link to="/projects" className="text-accent hover:underline">{t.viewProjects}</Link>
            <span className="text-border">|</span>
            <Link to="/materials" className="text-accent hover:underline">{t.materialLibrary}</Link>
            <span className="text-border">|</span>
            <Link to="/faq" className="text-accent hover:underline">{t.faqLink}</Link>
          </div>
        </div>
      </section>

      <section className="section-padding relative overflow-hidden bg-surface-dark text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,164,106,0.1),transparent_50%)]" aria-hidden />
        <div className="container-narrow relative">
          <h2 className="heading-safe mb-4 font-display text-3xl font-bold text-surface-dark-foreground">{t.interested(serviceTitle)}</h2>
          <p className="mb-6 text-surface-dark-foreground/75">{pageContent?.cta_description || t.ctaText}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/quote" className="btn-on-dark-primary min-h-12 w-full justify-center px-8 sm:w-auto">
              {t.freeQuote}
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
      </section>
    </main>
  );
};

export default ServiceDetail;
