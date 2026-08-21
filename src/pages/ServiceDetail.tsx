import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb, JsonLdFAQ, JsonLdService } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAFacts, SchemeAFaqList, SchemeAListingGrid, SchemeANumberList, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { servicesData } from "@/data/services";
import { usePublishedServiceBySlug, usePublishedServices } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";
import { serviceDetailPageText } from "@/i18n/serviceDetailPageText";
import { stripHtml } from "@/lib/text";

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const copy = serviceDetailPageText[language];
  const { data: cmsService, isLoading } = usePublishedServiceBySlug(slug, language);
  const { data: cmsServices } = usePublishedServices(language);
  const fallbackServices = useMemo(() => servicesData.map((service) => language === "zh" ? ({ ...service, title: service.titleZh || translateDisplayText(service.title, language), summary: service.summaryZh || translateDisplayText(service.summary, language), description: service.descriptionZh || translateDisplayText(service.description, language), suitableFor: service.suitableForZh || service.suitableFor.map((item) => translateDisplayText(item, language)), commonProjects: service.commonProjectsZh || service.commonProjects.map((item) => translateDisplayText(item, language)), processSteps: service.processStepsZh || service.processSteps, items: service.itemsZh || service.items, faqs: service.faqsZh || service.faqs, seoTitle: service.seoTitleZh || service.seoTitle, seoDescription: service.seoDescriptionZh || service.seoDescription }) : service), [language]);
  const services = cmsServices?.length ? cmsServices : fallbackServices;
  const service = cmsService || services.find((item) => item.slug === slug);

  if (isLoading && !service) return <main className="fc-route-page"><SchemeAContentState>{copy.loadingDescription}</SchemeAContentState></main>;
  if (!service) return <main className="fc-route-page"><PageMeta title={copy.notFound} description={copy.notFoundDescription} canonicalPath="/services" noIndex /><SchemeAContentState action={<Link to="/services">{copy.viewAll}</Link>}>{copy.notFound}</SchemeAContentState></main>;

  const display = (value: string) => stripHtml(translateDisplayText(value || "", language));
  const title = display(service.title);
  const summary = display(service.summary);
  const description = display(service.description || service.summary);
  const suitable = service.suitableFor.map((item: string) => display(item));
  const offered = service.items.map((item: string) => display(item));
  const process = service.processSteps.map((step) => ({ title: display(step.title), description: display(step.desc) })).filter((step) => step.title || step.description);
  const faqs = service.faqs.map((faq) => ({ question: display(faq.q), answer: display(faq.a) })).filter((faq) => faq.question && faq.answer);
  const related = services.filter((item) => item.slug !== service.slug).slice(0, 3);
  const relatedItems: SchemeAListingItem[] = related.map((item) => ({ id: String(item.id || item.slug), title: display(item.title), description: display(item.summary), image: item.image, imageAlt: display(item.title), href: `/services/${item.slug}` }));

  return (
    <main className="fc-route-page">
      <PageMeta title={service.seoTitle || copy.metaTitleFallback(title, copy.metaSuffix)} description={service.seoDescription || summary} keywords={copy.metaKeywords(title)} canonicalPath={`/services/${service.slug}`} />
      <JsonLdService name={title} description={summary} />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbServices, url: "/services" }, { name: title, url: `/services/${service.slug}` }]} />
      {faqs.length ? <JsonLdFAQ faqs={faqs} /> : null}
      <SchemeARouteHero kind="detail" image={service.image} imageAlt={title} label={copy.services} title={title} description={summary} />
      <SchemeAFacts items={[
        { label: language === "zh" ? "服务地区" : "Service area", value: "Kuala Lumpur / Selangor" },
        { label: language === "zh" ? "咨询方式" : "Consultation", value: language === "zh" ? "现场测量" : "Site review" },
        { label: language === "zh" ? "规划依据" : "Planning basis", value: language === "zh" ? "实际工程范围" : "Confirmed scope" },
        { label: language === "zh" ? "项目衔接" : "Delivery", value: language === "zh" ? "设计与施工" : "Design and build" },
      ]} />
      <SchemeASection title={copy.overview} description={description}>
        <SchemeANumberList items={[...suitable.map((item) => ({ title: item })), ...offered.map((item) => ({ title: item }))]} />
      </SchemeASection>
      {process.length ? <SchemeASection title={copy.process} description={language === "zh" ? "每一步解决一个明确问题，让设计与现场执行保持一致。" : "Each step resolves one clear decision from planning to delivery."}><SchemeANumberList items={process} /></SchemeASection> : null}
      {faqs.length ? <SchemeASection title={copy.faq}><SchemeAFaqList items={faqs} /></SchemeASection> : null}
      <SchemeASection title={copy.relatedServices}><SchemeAListingGrid items={relatedItems} actionLabel={copy.viewProjects} /></SchemeASection>
    </main>
  );
}
