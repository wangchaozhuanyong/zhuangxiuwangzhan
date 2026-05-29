import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { servicesData } from "@/data/services";
import { usePublishedServices } from "@/hooks/usePublishedContent";
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
    ctaText: "联系我们获取免费咨询与报价。我们服务 Kuala Lumpur、Selangor 与周边地区。",
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
  ctaText: "联系我们获取免费咨询与报价。我们服务 Kuala Lumpur、Selangor 与周边地区。",
  freeQuote: "获取免费报价",
};

const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = language === "zh" ? zhCopy : copy.en;
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

  const service = services.find((item) => item.slug === slug);

  if (!service) {
    return (
      <main className="pt-16 section-padding text-center">
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
    <main className="pt-16">
      <PageMeta
        title={`${serviceTitle} Kuala Lumpur | ${t.metaSuffix}`}
        description={stripHtml(serviceSummary)}
        keywords={t.metaKeywords(serviceTitle)}
        canonicalPath={`/services/${service.slug}`}
      />
      <JsonLdService name={serviceTitle} description={serviceSummary} />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }, { name: serviceTitle, url: `/services/${service.slug}` }]} />
      <JsonLdFAQ faqs={serviceFaqs.map((faq: any) => ({ question: faq.q, answer: faq.a }))} />

      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <SmartImage src={heroImage} alt={serviceTitle} className="w-full h-full object-cover scale-105 animate-[scale-up_1.2s_ease-out_forwards]" width={1920} height={800} loading="eager" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-4 md:px-8 py-20">
          <Link to="/services" className="inline-flex items-center gap-1 text-sm hover:text-accent transition-colors mb-6" style={{ color: "rgba(255,255,255,0.8)" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> {t.allServices}
          </Link>
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>{t.services}</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4 max-w-lg" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{serviceTitle}</h1>
          <p className="max-w-2xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{serviceSummary}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button size="lg" className="btn-press bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 px-8" asChild>
              <Link to="/quote">{t.getQuote} <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white text-neutral-800 hover:bg-white/90 border-0 btn-press h-12 px-8 font-semibold shadow-md" asChild>
              <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsapp}
              </a>
            </Button>
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
              <div key={project} className="p-4 bg-background rounded-lg text-center text-sm font-medium border border-border">
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
                <div className="shrink-0 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
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
              <AccordionItem key={`${faq.q}-${index}`} value={`faq-${index}`} className="bg-background rounded-lg border border-border px-4">
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
                  className="group p-5 rounded-lg border border-border bg-card hover-lift text-center block transition-colors hover:border-accent/30"
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

      <section className="section-padding bg-accent text-accent-foreground text-center">
        <div className="container-narrow">
          <h2 className="font-display text-3xl font-bold mb-4">{t.interested(serviceTitle)}</h2>
          <p className="mb-6 opacity-90">{t.ctaText}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button size="lg" variant="secondary" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
              <Link to="/quote">{t.freeQuote}</Link>
            </Button>
            <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
              <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsapp}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ServiceDetail;
