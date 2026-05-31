import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { servicesData } from "@/data/services";
import SmartImage from "@/components/SmartImage";
import { usePublishedServices, usePublishedSitePage } from "@/hooks/usePublishedContent";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import HeroBanner from "@/components/blocks/HeroBanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import { translateDisplayText } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

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
    directoryTitle: "Choose the Right Service",
    directoryText: "Browse our renovation services by project type so you can quickly find the scope that fits your home, shop, office, or specialist finish.",
    groupKicker: "Service Category",
    groups: {
      residential: {
        title: "Residential Renovation",
        description: "Core renovation services for condos, landed homes, kitchens, bathrooms, and custom built-in storage.",
        short: "Homes",
        hint: "Condo / Landed / Kitchen",
      },
      commercial: {
        title: "Commercial Spaces",
        description: "Fit-out and construction support for offices, shops, retail spaces, restaurants, and warehouse systems.",
        short: "Business",
        hint: "Office / Shop / Warehouse",
      },
      specialty: {
        title: "Specialist Support",
        description: "Premium finishes, wall coating, permit coordination, drawings, and documentation support.",
        short: "Specialist",
        hint: "Coating / Permit / Drawings",
      },
    },
    scopeTitle: "Core Scope",
    serviceCards: {
      renovation: {
        title: "Full Renovation",
        summary: "Complete renovation for condos and landed homes, covering demolition, electrical, plumbing, carpentry, painting, and finishing.",
        tags: ["Condo", "Landed"],
      },
      "old-house": {
        title: "Old House Renovation",
        summary: "Upgrade aging homes with structural repair, rewiring, replumbing, waterproofing, and full interior renewal.",
        tags: ["Old Homes", "Repair"],
      },
      kitchen: {
        title: "Kitchen Renovation",
        summary: "Cabinet replacement, countertop upgrade, tiling, plumbing, electrical, and appliance integration for modern kitchens.",
        tags: ["Cabinets", "Countertops"],
      },
      bathroom: {
        title: "Bathroom Renovation",
        summary: "Waterproofing, tiling, vanity installation, shower systems, sanitary ware, and plumbing works for clean modern bathrooms.",
        tags: ["Waterproofing", "Tiling"],
      },
      builtin: {
        title: "Custom Built-In Furniture",
        summary: "Made-to-measure wardrobes, kitchen cabinets, TV consoles, vanities, and storage systems for better space usage.",
        tags: ["Wardrobe", "Storage"],
      },
      design: {
        title: "Interior Design",
        summary: "Space planning, concept design, 3D visualization, and construction drawings for residential and commercial projects.",
        tags: ["Layout", "3D Design"],
      },
      office: {
        title: "Office Renovation",
        summary: "Office layout planning, partitions, furniture, data cabling, lighting, flooring, and professional fit-out works.",
        tags: ["Office", "Fit-Out"],
      },
      shop: {
        title: "Shop Renovation",
        summary: "Shopfront design, interior fit-out, display systems, counter setup, signage, and business-ready renovation works.",
        tags: ["Retail", "Signage"],
      },
      warehouse: {
        title: "Warehouse & Industrial Systems",
        summary: "Warehouse shelving, storage layout, industrial support works, and practical upgrades for operational spaces.",
        tags: ["Shelving", "Storage"],
      },
      "artistic-coating": {
        title: "Artistic Wall Coating",
        summary: "German Remmers artistic coatings for feature walls, interiors, showrooms, restaurants, and premium commercial spaces.",
        tags: ["Feature Wall", "Texture"],
      },
      approval: {
        title: "Permit & Drawing Support",
        summary: "Renovation permit applications, management office coordination, drawings, and documentation support.",
        tags: ["Permit", "Drawings"],
      },
    },
    unsureTitle: "Not Sure What You Need?",
    unsureText: "Contact us for a free consultation. We will assess your space and recommend the right approach.",
    quote: "Get a Free Quote",
    whatsapp: "WhatsApp Us",
    internalProjects: "Projects",
    internalMaterials: "Materials",
    internalBlog: "Blog",
    internalFaq: "常见问题",
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
    directoryTitle: "按类型选择服务",
    directoryText: "把住宅、商业空间和专项支持分清楚，客户进来就能快速找到自己需要的服务。",
    groupKicker: "服务分类",
    groups: {
      residential: {
        title: "住宅装修",
        description: "适合公寓、排屋、独立式住宅、厨房、浴室、旧屋翻新和定制收纳。",
        short: "住宅",
        hint: "公寓 / 排屋 / 厨房",
      },
      commercial: {
        title: "商业空间",
        description: "适合办公室、店铺、零售空间、餐饮空间和仓储货架等商业项目。",
        short: "商业",
        hint: "办公室 / 店铺 / 仓库",
      },
      specialty: {
        title: "专项支持",
        description: "包含艺术墙面涂装、装修准证、图纸协调和文件支持等专项服务。",
        short: "专项",
        hint: "涂装 / 准证 / 图纸",
      },
    },
    scopeTitle: "核心范围",
    serviceCards: {
      renovation: {
        title: "全屋装修",
        summary: "适合公寓、排屋和独立式住宅的一站式装修，包含拆除、水电、泥水、木工、油漆和收尾。",
        tags: ["公寓", "排屋"],
      },
      "old-house": {
        title: "旧屋翻新",
        summary: "适合老屋、排屋和独立式住宅翻新，重点处理结构、水电、漏水、防水和整体翻新。",
        tags: ["旧屋", "维修"],
      },
      kitchen: {
        title: "厨房装修",
        summary: "包含厨柜、台面、瓷砖、水电、排烟和电器嵌入，让厨房更耐用也更好用。",
        tags: ["厨柜", "台面"],
      },
      bathroom: {
        title: "浴室装修",
        summary: "包含防水、瓷砖、浴室柜、淋浴区、洁具和管道处理，减少漏水风险，提升日常体验。",
        tags: ["防水", "瓷砖"],
      },
      builtin: {
        title: "定制内嵌家具",
        summary: "定制衣柜、厨柜、电视柜、鞋柜、浴室柜和收纳系统，让空间更整齐、更好收纳。",
        tags: ["衣柜", "收纳"],
      },
      design: {
        title: "室内设计",
        summary: "包含空间规划、风格方案、3D 效果图和施工图，让装修前先看清楚整体效果。",
        tags: ["布局", "3D 设计"],
      },
      office: {
        title: "办公室装修",
        summary: "适合办公室规划、隔间、会议室、前台、灯光、地板、网络布线和整体商业形象升级。",
        tags: ["办公", "隔间"],
      },
      shop: {
        title: "店铺装修",
        summary: "适合零售、餐饮、美容、诊所和服务业店铺，包含门面、动线、柜台、展示和招牌。",
        tags: ["零售", "招牌"],
      },
      warehouse: {
        title: "仓储货架与工业空间",
        summary: "适合仓库货架、储物规划、工业空间整理和实用型施工，让空间更安全、更好管理。",
        tags: ["货架", "仓储"],
      },
      "artistic-coating": {
        title: "艺术墙面涂装",
        summary: "适合背景墙、展示区、餐厅、酒店和商业空间，做出比普通油漆更有质感的墙面效果。",
        tags: ["背景墙", "肌理"],
      },
      approval: {
        title: "装修准证与图纸支持",
        summary: "协助管理处、政府部门、装修准证、图纸和文件流程，减少客户自己跑流程的麻烦。",
        tags: ["准证", "图纸"],
      },
    },
    unsureTitle: "需要确认适合的装修服务？",
    unsureText: "联系我们免费咨询，我们会根据你的空间和预算建议合适方案。",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 联系",
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
                      <Link to={`/services/${service.slug}`} className="service-directory-card__media img-zoom">
                        <SmartImage
                          src={service.image}
                          alt={`${cardTitle} service by FLASH CAST in Kuala Lumpur`}
                          loading="lazy"
                          width={800}
                          height={600}
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
                          <ArrowRight className="h-4 w-4" />
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
