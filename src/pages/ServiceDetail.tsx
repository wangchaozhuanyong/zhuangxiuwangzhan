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
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import CTABanner from "@/components/blocks/CTABanner";
import { JsonLdService, JsonLdBreadcrumb, JsonLdFAQ } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateDisplayText } from "@/i18n/displayLabels";
import { buildQuotePath, quoteProjectTypeFromServiceSlug } from "@/lib/quoteContext";
import { serviceDetailPageText } from "@/i18n/serviceDetailPageText";

const SERVICE_HERO_IMAGE_WIDTHS = [720, 900, 1200];




const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = serviceDetailPageText[language];
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

  if (isServiceLoading && !cmsService && !service) {
    return (
      <PublicLoadingState
        label="FLASH CAST"
        title={t.loadingTitle}
        description={t.loadingDescription}
      />
    );
  }

  if (!service) {
    return (
      <main className="pt-site-header section-padding text-center">
        <PageMeta
          title={t.notFound}
          description={t.notFoundDescription}
          canonicalPath="/services"
          noIndex
        />
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
  })).filter((step: any) => step.title || step.desc);
  const serviceFaqs = service.faqs.map((faq: any) => ({
    q: displayText(faq.q),
    a: displayText(faq.a),
  })).filter((faq: any) => faq.q && faq.a);
  const quotePath = buildQuotePath({
    source: "service",
    title: serviceTitle,
    projectType: quoteProjectTypeFromServiceSlug(service.slug, serviceTitle),
  });

  return (
    <main className="pt-site-header">
      <PageMeta
        title={service.seoTitle || t.metaTitleFallback(serviceTitle, t.metaSuffix)}
        description={service.seoDescription || stripHtml(serviceSummary)}
        keywords={t.metaKeywords(serviceTitle)}
        canonicalPath={`/services/${service.slug}`}
      />
      <JsonLdService name={serviceTitle} description={serviceSummary} />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }, { name: serviceTitle, url: `/services/${service.slug}` }]} />
      {serviceFaqs.length > 0 && <JsonLdFAQ faqs={serviceFaqs.map((faq: any) => ({ question: faq.q, answer: faq.a }))} />}

      <section className="page-hero page-hero--detail">
        <div className="page-hero__media absolute inset-0">
          <SmartImage src={heroImage} alt={serviceTitle} className="page-hero__image h-full w-full object-cover" width={1920} height={800} loading="eager" fetchPriority="high" sizes="100vw" candidateWidths={SERVICE_HERO_IMAGE_WIDTHS} quality={76} />
          <div className="page-hero__overlay absolute inset-0 media-readable-overlay" aria-hidden="true" />
        </div>
        <div className="page-hero__content site-container">
          <Link to="/services" className="page-hero__back mb-6 inline-flex items-center gap-1 text-sm text-on-media-muted transition-colors hover:text-gold">
            <ArrowLeft className="h-3.5 w-3.5" /> {t.allServices}
          </Link>
          <p className="page-hero__label mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{t.services}</p>
          <h1 className="page-hero__title heading-safe mb-4 max-w-2xl text-3xl font-bold text-on-media md:text-5xl">{serviceTitle}</h1>
          <p className="page-hero__description prose-safe mb-8 max-w-2xl text-base text-on-media-muted md:text-lg">{serviceSummary}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={quotePath} className="btn-on-dark-primary min-h-12 justify-center px-8 sm:w-auto">
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
                <div className="subpage-local-heading--balanced">
                  <div className="accent-line mb-4" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold">{t.overview}</h2>
                </div>
                {isHtmlText(serviceDescription) ? (
                  <div className="prose prose-neutral max-w-none text-muted-foreground mb-6" dangerouslySetInnerHTML={{ __html: sanitizeHtml(serviceDescription) }} />
                ) : (
                  <p className="text-muted-foreground leading-relaxed mb-6">{serviceDescription}</p>
                )}
                <h3 className="font-semibold mb-3">{t.suitableFor}</h3>
                <ul className="subpage-copy-list subpage-copy-list--two mb-6">
                  {serviceSuitableFor.map((item: string) => (
                    <li key={item} className="subpage-copy-item">
                      <span className="subpage-copy-icon">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </span>
                      <span className="subpage-copy-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal direction="right" delay={150}>
              <div>
                <h3 className="font-semibold mb-3">{t.offer}</h3>
                <div className="subpage-copy-list">
                  {serviceItems.map((item: string) => (
                    <div key={item} className="subpage-copy-item subpage-copy-item--soft">
                      <span className="subpage-copy-dot" />
                      <span className="subpage-copy-text">{item}</span>
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
          <Reveal>
            <div className="subpage-local-heading">
              <div className="accent-line mb-4" />
              <h2 className="font-display text-2xl font-bold">{t.commonProjects}</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {serviceCommonProjects.map((project: string, index: number) => (
              <Reveal key={project} delay={index * 55} direction="none">
                <div className="text-limit-2 rounded-card border border-border bg-background p-4 text-center text-sm font-medium">
                  {project}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {serviceProcessSteps.length > 0 && (
        <section className="section-padding bg-background">
          <div className="container-narrow max-w-3xl">
            <Reveal>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">{t.process}</h2>
            </Reveal>
            <div className="space-y-6">
              {serviceProcessSteps.map((step: any, index: number) => (
                <Reveal key={`${step.title}-${index}`} delay={index * 75}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/15 text-sm font-bold text-gold">
                      {index + 1}
                    </div>
                    <div className="pt-1">
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {serviceFaqs.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow max-w-3xl">
            <Reveal>
              <h2 className="font-display text-2xl font-bold mb-6 text-center">{t.faq}</h2>
            </Reveal>
            <Reveal delay={100}>
              <Accordion type="single" collapsible className="space-y-2">
                {serviceFaqs.map((faq: any, index: number) => (
                  <AccordionItem key={`${faq.q}-${index}`} value={`faq-${index}`} className="bg-background rounded-card border border-border px-4">
                    <AccordionTrigger className="text-left font-medium text-sm md:text-base">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>
      )}

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <h2 className="font-display text-2xl font-bold mb-6 text-center">{t.relatedServices}</h2>
          </Reveal>
          <div className="card-grid grid-cols-2 gap-4 md:grid-cols-3">
            {services
              .filter((item) => item.slug !== service.slug)
              .slice(0, 3)
              .map((item, index) => (
                <Reveal key={item.slug} delay={index * 70} direction="none">
                  <Link
                    to={`/services/${item.slug}`}
                    className="card-equal group rounded-card border border-border bg-card p-5 text-center transition-colors hover:border-accent/30 hover-lift"
                  >
                    <h3 className="text-limit-2 font-display font-semibold text-sm mb-1 group-hover:text-accent transition-colors">
                      {displayText(item.title)}
                    </h3>
                    <p className="text-limit-2 text-muted-foreground text-xs leading-relaxed">{displayText(item.summary)}</p>
                  </Link>
                </Reveal>
              ))}
          </div>
          <Reveal delay={240}>
            <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
              <Link to="/projects" className="text-accent hover:underline">{t.viewProjects}</Link>
              <span className="text-border">|</span>
              <Link to="/materials" className="text-accent hover:underline">{t.materialLibrary}</Link>
              <span className="text-border">|</span>
              <Link to="/faq" className="text-accent hover:underline">{t.faqLink}</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <CTABanner
        title={t.interested(serviceTitle)}
        description={pageContent?.cta_description || t.ctaText}
        quoteLabel={t.freeQuote}
        quotePath={quotePath}
        whatsappLabel={t.whatsapp}
        whatsappSource="Service Detail CTA"
      />
    </main>
  );
};

export default ServiceDetail;
