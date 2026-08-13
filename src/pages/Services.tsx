import { useMemo, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "@/components/LocalizedLink";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb, JsonLdFAQ } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import CTABanner from "@/components/blocks/CTABanner";
import { ForestContentState, ForestFaqList, ForestFilterNav, ForestSectionHeading } from "@/components/forest/ForestPagePrimitives";
import { servicesData } from "@/data/services";
import { usePublishedServices, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText } from "@/i18n/displayLabels";
import { servicesPageText } from "@/i18n/servicesPageText";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { buildQuotePath } from "@/lib/quoteContext";

type ServiceGroupId = "all" | "residential" | "commercial" | "specialty";
type DisplayService = (typeof servicesData)[number];

const serviceOrder = ["renovation", "old-house", "kitchen", "bathroom", "builtin", "design", "office", "shop", "warehouse", "artistic-coating", "approval"];
const preferredServiceSlugs: Record<string, string[]> = { office: ["office-renovation", "office"], shop: ["shop-renovation", "shoplot", "commercial"] };
const serviceGroups: Array<{ id: Exclude<ServiceGroupId, "all">; keys: string[] }> = [
  { id: "residential", keys: ["renovation", "old-house", "kitchen", "bathroom", "builtin", "design"] },
  { id: "commercial", keys: ["office", "shop", "warehouse"] },
  { id: "specialty", keys: ["artistic-coating", "approval"] },
];

const getServiceKey = (service: { id?: string; slug: string; title: string }) => {
  const code = (service.id || service.slug).toLowerCase();
  const slug = service.slug.toLowerCase();
  const text = `${slug} ${service.title.toLowerCase()}`;
  if (code === "renovation" || slug === "renovation") return "renovation";
  if (code === "old-house" || slug === "old-house" || text.includes("旧屋") || text.includes("old house")) return "old-house";
  if (code === "kitchen" || slug === "kitchen" || text.includes("厨房")) return "kitchen";
  if (code === "bathroom" || slug === "bathroom" || text.includes("浴室")) return "bathroom";
  if (code === "builtin" || slug === "builtin" || text.includes("built-in") || text.includes("收纳")) return "builtin";
  if (code === "design" || slug === "design" || text.includes("设计")) return "design";
  if (code === "office" || slug === "office" || slug === "office-renovation" || text.includes("办公室")) return "office";
  if (code === "shop" || code === "shoplot" || slug === "shoplot" || slug === "shop-renovation" || text.includes("店铺") || text.includes("retail")) return "shop";
  if (code === "warehouse" || slug === "warehouse" || text.includes("仓储") || text.includes("货架")) return "warehouse";
  if (code === "artistic-coating" || slug === "artistic-coating" || text.includes("涂装")) return "artistic-coating";
  if (code === "approval" || slug === "approval" || text.includes("准证") || text.includes("permit")) return "approval";
  return slug;
};

const serviceRank = (key: string) => {
  const index = serviceOrder.indexOf(key);
  return index === -1 ? 999 : index;
};

const normalizeServices = (services: DisplayService[]) => {
  const byKey = new Map<string, DisplayService>();
  services.forEach((service) => {
    const key = getServiceKey(service);
    const current = byKey.get(key);
    const preferred = preferredServiceSlugs[key];
    if (!current || (preferred && (preferred.indexOf(service.slug) === -1 ? 999 : preferred.indexOf(service.slug)) < (preferred.indexOf(current.slug) === -1 ? 999 : preferred.indexOf(current.slug)))) {
      byKey.set(key, service);
    }
  });
  return Array.from(byKey.entries()).sort(([a], [b]) => serviceRank(a) - serviceRank(b)).map(([key, service]) => ({ key, service }));
};

const groupForService = (key: string) => serviceGroups.find((group) => group.keys.includes(key))?.id || "specialty";
const fallbackImageForService = (key: string) => servicesData.find((service) => getServiceKey(service) === key)?.image || "";

const Services = () => {
  const { language } = useLanguage();
  const t = servicesPageText[language];
  const [activeGroup, setActiveGroup] = useState<ServiceGroupId>("all");
  const { data: pageContent } = usePublishedSitePage(language, "services");
  const initialServices = useMemo(() => {
    const localize = (value: string) => translateDisplayText(value, language);
    return language === "zh" ? servicesData.map((service) => ({
      ...service,
      title: service.titleZh || localize(service.title),
      summary: service.summaryZh || localize(service.summary),
      description: service.descriptionZh || localize(service.description),
      suitableFor: service.suitableForZh || service.suitableFor.map(localize),
      commonProjects: service.commonProjectsZh || service.commonProjects.map(localize),
      processSteps: service.processStepsZh || service.processSteps.map((step) => ({ title: localize(step.title), desc: localize(step.desc) })),
      items: service.itemsZh || service.items.map(localize),
      faqs: service.faqsZh || service.faqs.map((faq) => ({ q: localize(faq.q), a: localize(faq.a) })),
    })) : servicesData;
  }, [language]);
  const { data: services = initialServices, isLoading, isError, refetch } = usePublishedServices(language);
  const normalized = useMemo(() => normalizeServices(services as DisplayService[]), [services]);
  const visible = activeGroup === "all" ? normalized : normalized.filter(({ key }) => groupForService(key) === activeGroup);
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.services);
  const filterItems = [
    { value: "all", label: t.allServices },
    ...serviceGroups.map((group) => ({ value: group.id, label: t.groups[group.id].short })),
  ];
  const directoryDescription = (pageContent?.content || t.directoryText).replace("{count}", String(normalized.length));

  return (
    <main className="pt-site-header">
      <PageMeta title={pageContent?.seo_title || t.metaTitle} description={pageContent?.seo_description || t.metaDescription} keywords={pageContent?.seo_keywords || t.metaKeywords} canonicalPath="/services" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }]} />
      <HeroBanner image={heroImage.desktop} imageMobile={heroImage.mobile} imageAlt={pageContent?.alt || t.heroAlt} label={pageContent?.subtitle || t.eyebrow} title={pageContent?.title || t.title} description={pageContent?.description || t.intro} />

      <section className="forest-chapter forest-service-index">
        <ForestSectionHeading eyebrow={t.eyebrow} title={t.directoryTitle} description={directoryDescription} />
        <ForestFilterNav items={filterItems} value={activeGroup} onChange={(value) => setActiveGroup(value as ServiceGroupId)} ariaLabel={t.directoryTitle} />
        {isLoading ? (
          <ForestContentState variant="loading" compact />
        ) : isError ? (
          <ForestContentState variant="error" compact onRetry={() => void refetch()} />
        ) : visible.length === 0 ? (
          <ForestContentState variant="empty" compact />
        ) : (
          <div className="forest-service-list">
            {visible.map(({ key, service }, index) => {
              const cardCopy = t.serviceCards[key as keyof typeof t.serviceCards];
              const title = cardCopy?.title || translateDisplayText(service.title, language);
              const summary = cardCopy?.summary || translateDisplayText(service.summary, language);
              const tags = cardCopy?.tags || service.suitableFor.slice(0, 3).map((item: string) => translateDisplayText(item, language));
              return (
                <Link key={`${key}-${service.slug}`} to={`/services/${service.slug}`} className="forest-service-row" data-reverse={index % 2 ? "true" : "false"}>
                  <div className="forest-service-row__media">
                    <SmartImage src={service.image || fallbackImageForService(key)} alt={title} loading={index < 2 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} width={960} height={720} sizes="(max-width: 767px) 100vw, 50vw" candidateWidths={[480, 720, 960]} quality={72} />
                  </div>
                  <div className="forest-service-row__copy">
                    <p className="forest-eyebrow">{t.groups[groupForService(key)].short}</p>
                    <h2>{title}</h2>
                    <p>{summary}</p>
                    <div className="forest-service-row__tags">{tags.map((tag: string) => <span key={tag}><Check aria-hidden="true" />{tag}</span>)}</div>
                    <span className="forest-listing-card__action">{t.details}<ArrowUpRight aria-hidden="true" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="forest-chapter forest-chapter--raised">
        <ForestSectionHeading title={t.selectorTitle} description={t.selectorText} />
        <div className="forest-principle-grid">
          {t.selectorItems.map((item) => <article key={item.title}><h2>{item.title}</h2><p>{item.desc}</p></article>)}
        </div>
        <div className="forest-concept-note"><h2>{t.conceptTitle}</h2><p>{t.conceptText}</p></div>
      </section>

      <section className="forest-chapter">
        <ForestSectionHeading title={t.faqTitle} />
        <ForestFaqList items={t.faqs.map((faq) => ({ question: faq.q, answer: faq.a }))} />
      </section>
      <JsonLdFAQ faqs={t.faqs.map((faq) => ({ question: faq.q, answer: faq.a }))} />
      <CTABanner title={pageContent?.cta_title || t.unsureTitle} description={pageContent?.cta_description || t.unsureText} quoteLabel={t.quote} quotePath={buildQuotePath({ source: "services" })} whatsappLabel={t.whatsapp} whatsappSource="Services CTA" />
    </main>
  );
};

export default Services;
