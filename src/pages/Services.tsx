import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { servicesData } from "@/data/services";
import SmartImage from "@/components/SmartImage";
import { usePublishedServices, usePublishedSitePage } from "@/hooks/usePublishedContent";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import HeroBanner from "@/components/blocks/HeroBanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import CTABanner from "@/components/blocks/CTABanner";
import { translateDisplayText } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { buildQuotePath } from "@/lib/quoteContext";
import { servicesPageText } from "@/i18n/servicesPageText";



const applyPageTemplate = (template: string | undefined, values: Record<string, string | number>) => {
  if (!template) return "";
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
};

type ServiceGroupId = "residential" | "commercial" | "specialty";
type DisplayService = (typeof servicesData)[number];

const serviceOrder = [
  "renovation",
  "old-house",
  "kitchen",
  "bathroom",
  "builtin",
  "design",
  "office",
  "shop",
  "warehouse",
  "artistic-coating",
  "approval",
];

const preferredServiceSlugs: Record<string, string[]> = {
  office: ["office-renovation", "office"],
  shop: ["shop-renovation", "shoplot", "commercial"],
};

const serviceGroups: Array<{ id: ServiceGroupId; keys: string[] }> = [
  { id: "residential", keys: ["renovation", "old-house", "kitchen", "bathroom", "builtin", "design"] },
  { id: "commercial", keys: ["office", "shop", "warehouse"] },
  { id: "specialty", keys: ["artistic-coating", "approval"] },
];
const SERVICE_CARD_IMAGE_WIDTHS = [360, 560, 720];

const getServiceKey = (service: { id?: string; slug: string; title: string }) => {
  const code = (service.id || service.slug).toLowerCase();
  const slug = service.slug.toLowerCase();
  const title = service.title.toLowerCase();

  if (code === "renovation" || slug === "renovation") return "renovation";
  if (code === "old-house" || slug === "old-house") return "old-house";
  if (code === "kitchen" || slug === "kitchen") return "kitchen";
  if (code === "bathroom" || slug === "bathroom") return "bathroom";
  if (code === "builtin" || slug === "builtin") return "builtin";
  if (code === "design" || slug === "design") return "design";
  if (code === "office" || slug === "office" || slug === "office-renovation") return "office";
  if (code === "shop" || code === "shoplot" || slug === "shoplot" || slug === "shop-renovation") return "shop";
  if (code === "warehouse" || slug === "warehouse") return "warehouse";
  if (code === "artistic-coating" || slug === "artistic-coating") return "artistic-coating";
  if (code === "approval" || slug === "approval") return "approval";

  const text = `${slug} ${title}`;

  if (text.includes("office") || text.includes("办公室")) return "office";
  if (text.includes("shop") || text.includes("retail") || text.includes("店铺") || text.includes("零售")) return "shop";
  if (text.includes("warehouse") || text.includes("仓储") || text.includes("货架")) return "warehouse";
  if (text.includes("artistic") || text.includes("coating") || text.includes("remmers") || text.includes("艺术") || text.includes("涂装")) return "artistic-coating";
  if (text.includes("approval") || text.includes("permit") || text.includes("drawing") || text.includes("准证") || text.includes("图纸")) return "approval";
  if (text.includes("old-house") || text.includes("旧屋") || text.includes("old house")) return "old-house";
  if (text.includes("kitchen") || text.includes("厨房")) return "kitchen";
  if (text.includes("bathroom") || text.includes("浴室")) return "bathroom";
  if (text.includes("builtin") || text.includes("built-in") || text.includes("内嵌") || text.includes("收纳")) return "builtin";
  if (text.includes("design") || text.includes("设计")) return "design";
  if (text.includes("renovation") || text.includes("装修")) return "renovation";

  return slug;
};

const serviceRank = (key: string) => {
  const index = serviceOrder.indexOf(key);
  return index === -1 ? 999 : index;
};

const shouldReplaceService = (key: string, current: { slug: string }, next: { slug: string }) => {
  const preferred = preferredServiceSlugs[key];
  if (!preferred) return false;
  const currentRank = preferred.indexOf(current.slug);
  const nextRank = preferred.indexOf(next.slug);
  const currentScore = currentRank === -1 ? 999 : currentRank;
  const nextScore = nextRank === -1 ? 999 : nextRank;
  return nextScore < currentScore;
};

const normalizeServices = (services: DisplayService[]) => {
  const byKey = new Map<string, DisplayService>();

  services.forEach((service) => {
    const key = getServiceKey(service);
    const current = byKey.get(key);
    if (!current || shouldReplaceService(key, current, service)) {
      byKey.set(key, service);
    }
  });

  return Array.from(byKey.entries())
    .sort(([a], [b]) => serviceRank(a) - serviceRank(b))
    .map(([key, service]) => ({ key, service }));
};

const getGroupForService = (key: string): ServiceGroupId => {
  return serviceGroups.find((group) => group.keys.includes(key))?.id || "specialty";
};

const Services = () => {
  const { language } = useLanguage();
  const t = servicesPageText[language];
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
  const normalizedServices = useMemo(() => normalizeServices(services as DisplayService[]), [services]);
  const groupedServices = useMemo(() => {
    return serviceGroups.map((group) => ({
      ...group,
      services: normalizedServices.filter(({ key }) => getGroupForService(key) === group.id),
    }));
  }, [normalizedServices]);
  const geoText = applyPageTemplate(pageContent?.content, { count: normalizedServices.length });
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.services);

  return (
    <main className="overflow-x-hidden pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/services"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.heroAlt}
        label={pageContent?.subtitle || t.eyebrow}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.intro}
      />

      <section className="subpage-info-band py-8">
        <div className="container-narrow">
          <p className="text-muted-foreground text-sm leading-relaxed text-center max-w-3xl mx-auto">
            {geoText || (language === "zh" ? (
              <>
                <strong className="text-foreground">{t.geoPrefix}</strong>
                {t.geoText(normalizedServices.length)}
                <strong className="text-foreground">{t.geoLocation}</strong>
                {t.geoConnector}
                {t.geoEnd}
              </>
            ) : (
              <>
                <strong className="text-foreground">{t.geoPrefix}</strong> {t.geoText(normalizedServices.length)}{" "}
                <strong className="text-foreground">{t.geoLocation}</strong>
                {t.geoConnector} {t.geoEnd}
              </>
            ))}
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={t.directoryTitle} description={t.directoryText} />

          <Reveal direction="none">
            <nav className="service-category-nav" aria-label={t.directoryTitle}>
              {groupedServices.map((group, index) => {
                const groupCopy = t.groups[group.id];

                return (
                  <a
                    key={group.id}
                    className="service-category-nav__item"
                    href={`#service-group-${group.id}`}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <span className="service-category-nav__label">{groupCopy.short}</span>
                    <strong>{groupCopy.title}</strong>
                    <span>{groupCopy.hint}</span>
                  </a>
                );
              })}
            </nav>
          </Reveal>
        </div>
      </section>

      {groupedServices.map((group, groupIndex) => {
        const groupCopy = t.groups[group.id];
        if (!group.services.length) return null;

        return (
          <section
            key={group.id}
            id={`service-group-${group.id}`}
            className={`service-directory-section section-padding ${groupIndex % 2 === 0 ? "bg-muted" : "bg-background"}`}
          >
          <div className="container-narrow">
            <Reveal>
              <div className="service-group-heading">
                <span className="service-group-heading__rule" aria-hidden="true" />
                <h2>{groupCopy.title}</h2>
                <span>{groupCopy.description}</span>
              </div>
            </Reveal>

            <div className="service-directory-grid">
              {group.services.map(({ key, service }, index) => {
                const cardCopy = t.serviceCards[key as keyof typeof t.serviceCards];
                const cardTitle = cardCopy?.title || displayText(service.title);
                const cardSummary = cardCopy?.summary || displayText(service.summary);
                const cardTags = cardCopy?.tags || service.suitableFor.slice(0, 2).map((item: string) => displayText(item));

                return (
                  <Reveal key={`${key}-${service.slug}`} delay={index * 70} direction="none">
                    <article className="service-directory-card luxury-card group hover-lift">
                      <Link
                        to={`/services/${service.slug}`}
                        className="service-directory-card__media img-zoom"
                        aria-label={`${t.details}: ${cardTitle}`}
                      >
                        <SmartImage
                          src={service.image}
                          alt={`${cardTitle} service by FLASH CAST in Kuala Lumpur`}
                          loading="lazy"
                          width={800}
                          height={600}
                          sizes="(max-width: 768px) 86vw, (max-width: 1024px) 45vw, 31vw"
                          candidateWidths={SERVICE_CARD_IMAGE_WIDTHS}
                          quality={72}
                          className="h-full w-full object-cover"
                        />
                      </Link>

                      <div className="service-directory-card__body">
                        <span className="service-directory-card__type">{groupCopy.short}</span>
                        <h3>{cardTitle}</h3>
                        <p>{cardSummary}</p>

                        {cardTags.length > 0 ? (
                          <div className="service-directory-card__chips" aria-label={t.suitableFor}>
                            {cardTags.map((item: string) => (
                              <span key={item}>{item}</span>
                            ))}
                          </div>
                        ) : null}

                        <Link to={`/services/${service.slug}`} className="service-directory-card__link">
                          <span>{t.details}</span>
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
        );
      })}

      <CTABanner
        title={pageContent?.cta_title || t.unsureTitle}
        description={pageContent?.cta_description || t.unsureText}
        quoteLabel={t.quote}
        quotePath={buildQuotePath({ source: "services" })}
        whatsappLabel={t.whatsapp}
        whatsappSource="Services CTA"
      />

      <section className="subpage-link-band py-8">
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
