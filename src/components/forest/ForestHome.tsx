import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  Check,
  MapPin,
  Ruler,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import LocalizedLink from "@/components/LocalizedLink";
import SmartImage from "@/components/SmartImage";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { usePublishedProductHighlights } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { homeSectionText } from "@/i18n/homeSectionsText";
import { translateDisplayText, translateMaterialCategory } from "@/i18n/displayLabels";
import type { PublishedHomeContentBundle } from "@/lib/homeContentApi";

type ForestHomeProps = {
  content: PublishedHomeContentBundle | undefined;
};

const fallbackCopy = {
  zh: {
    heroTitle: "吉隆坡住宅与商业空间装修",
    heroDescription: "从空间规划、定制家具到施工交付。",
    whatsapp: "WhatsApp 联系",
    quote: "获取免费报价",
    trust: [
      "Kuala Lumpur、Selangor 与 Klang Valley",
      "先规划，再确定材料与施工范围",
      "住宅、商业与定制家具统一协调",
      "按现场条件和交付节点推进",
    ],
    companyTitle: "我们把设计、材料与施工放在同一张图里",
    companyBody: "FLASH CAST 立足本地现场条件，服务住宅、商业与定制家具项目。我们先把需求和边界说清楚，再进入选材、报价与施工。",
    about: "了解公司",
    servicesTitle: "从一间房，到完整商业空间",
    servicesBody: "按空间需求展开，不把不同服务塞进同一套标准套餐。",
    details: "了解详情",
    projectsTitle: "精选装修案例",
    projectsBody: "住宅、办公、餐饮与定制项目使用同一套清晰的案例叙事。",
    projectsAll: "查看装修案例",
    compareTitle: "先看清问题，再决定怎么改",
    compareBody: "拖动画面查看空间更新。实际方案会根据结构、机电、预算和使用方式调整。",
    before: "改造前",
    after: "改造后",
    compareLabel: "拖动查看改造前后",
    productsTitle: "装修商品，不是普通商城",
    productsBody: "展示衣柜、家具、橱柜、地板、门窗和涂料的做法、材质与参考价格。",
    productsAll: "浏览装修商品",
    productView: "查看商品",
    offers: ["免费基础上门沟通", "免费空间规划建议", "定制商品优惠展示"],
    processTitle: "从沟通到交付",
    processBody: "每一步解决一个明确问题，让设计判断和现场执行保持一致。",
    whyTitle: "为什么选择 FLASH CAST",
    testimonialsTitle: "客户怎样评价合作过程",
    brandsTitle: "常用材料与五金品牌",
    faqTitle: "开始前常见的问题",
    faqAll: "查看全部问题",
  },
  en: {
    heroTitle: "Renovation for homes and commercial spaces in Kuala Lumpur",
    heroDescription: "From space planning and custom furniture to site delivery.",
    whatsapp: "Contact on WhatsApp",
    quote: "Get a free quote",
    trust: [
      "Kuala Lumpur, Selangor and Klang Valley",
      "Plan first, then confirm materials and scope",
      "One team for homes, businesses and built-ins",
      "Delivery follows site conditions and milestones",
    ],
    companyTitle: "Design, materials and site delivery on one plan",
    companyBody: "FLASH CAST works around local site conditions across residential, commercial and custom furniture projects. We define needs and boundaries before materials, quotation and construction.",
    about: "About the company",
    servicesTitle: "From one room to a complete commercial interior",
    servicesBody: "Services unfold around the space, not a one-size-fits-all package.",
    details: "View details",
    projectsTitle: "Selected renovation projects",
    projectsBody: "Residential, office, hospitality and custom work presented through one clear project narrative.",
    projectsAll: "View renovation projects",
    compareTitle: "See the problem clearly before deciding the change",
    compareBody: "Drag to compare the space. The actual proposal responds to structure, services, budget and use.",
    before: "Before",
    after: "After",
    compareLabel: "Drag to compare before and after",
    productsTitle: "Renovation products, not a conventional online shop",
    productsBody: "Compare wardrobes, furniture, cabinets, flooring, doors, windows and finishes with material and indicative price guidance.",
    productsAll: "Browse renovation products",
    productView: "View product",
    offers: ["Complimentary first site discussion", "Complimentary space planning advice", "Selected custom product offers"],
    processTitle: "From first conversation to handover",
    processBody: "Each step resolves one clear question so design decisions stay aligned with site delivery.",
    whyTitle: "Why clients choose FLASH CAST",
    testimonialsTitle: "What clients say about the process",
    brandsTitle: "Materials and hardware brands we work with",
    faqTitle: "Questions before you begin",
    faqAll: "View all questions",
  },
} as const;

const SectionHeading = ({ title, body }: { title: string; body?: string }) => (
  <header className="forest-section-heading">
    <h2>{title}</h2>
    {body ? <p>{body}</p> : null}
  </header>
);

const ForestHome = ({ content }: ForestHomeProps) => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const copy = fallbackCopy[language];
  const ariaCopy = homeSectionText.forestAria[language];
  const [activeService, setActiveService] = useState(0);
  const [activeProcess, setActiveProcess] = useState(0);
  const [comparePosition, setComparePosition] = useState(58);
  const [openFaq, setOpenFaq] = useState(0);
  const { data: products = [] } = usePublishedProductHighlights(language, 4);

  const hero = content?.heroSlides[0];
  const heroTitle = hero?.title || content?.pageContent?.title || copy.heroTitle;
  const heroDescription = hero?.excerpt || content?.pageContent?.description || copy.heroDescription;
  const heroImage = hero?.image || content?.pageContent?.image_url || "/images/heroes/hero-luxury-living.webp";
  const heroAlt = hero?.alt || content?.pageContent?.alt || heroTitle;
  const services = content?.services.slice(0, 5) || [];
  const projects = content?.projects.slice(0, 6) || [];
  const processSteps = content?.processSteps.slice(0, 6) || [];
  const faqs = content?.faqs.slice(0, 4) || [];
  const beforeAfter = content?.beforeAfterItems[0];
  const beforeImage = beforeAfter?.before_image_url || "/images/before-after/before-living.webp";
  const afterImage = beforeAfter?.after_image_url || "/images/before-after/after-living.webp";
  const activeServiceItem = services[activeService] || services[0];
  const activeProcessItem = processSteps[activeProcess] || processSteps[0];
  const introImage = projects[0]?.images[1] || projects[0]?.thumbnail || "/images/projects/proj1-condo-2.webp";
  const displayText = (value: string) => language === "zh" ? translateDisplayText(value, language) : value;

  const whyItems = useMemo(() => {
    const items = content?.whyChooseUsSection?.items || [];
    return items
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const title = String(record.title || record.name || "");
        const description = String(record.description || record.content || "");
        return title ? { title, description } : null;
      })
      .filter((item): item is { title: string; description: string } => Boolean(item));
  }, [content?.whyChooseUsSection?.items]);

  return (
    <div className="forest-home">
      <section className="forest-home-hero" aria-labelledby="forest-home-title">
        <div className="forest-home-hero__copy">
          <span className="forest-kicker">FLASH CAST SDN. BHD.</span>
          <h1 id="forest-home-title">{heroTitle}</h1>
          <p>{heroDescription}</p>
          <div className="forest-home-hero__actions">
            <a className="forest-button forest-button--light" href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" /> {copy.whatsapp}
            </a>
            <LocalizedLink className="forest-button forest-button--outline" to="/quote">
              {copy.quote} <ArrowRight className="h-4 w-4" />
            </LocalizedLink>
          </div>
        </div>
        <figure className="forest-home-hero__media">
          <SmartImage src={heroImage} alt={heroAlt} width={1600} height={1100} loading="eager" fetchPriority="high" />
        </figure>
      </section>

      <section className="forest-trust-rail" aria-label={ariaCopy.serviceHighlights}>
        {copy.trust.map((item, index) => {
          const icons = [MapPin, Ruler, Wrench, ShieldCheck];
          const Icon = icons[index];
          return <div key={item}><Icon aria-hidden="true" /><span>{item}</span></div>;
        })}
      </section>

      <section className="forest-chapter forest-company-intro">
        <figure>
          <DeferredSmartImage src={introImage} alt={projects[0]?.thumbnailAlt || copy.companyTitle} width={1200} height={900} loading="lazy" />
        </figure>
        <div>
          <SectionHeading title={copy.companyTitle} body={copy.companyBody} />
          <LocalizedLink className="forest-text-link" to="/about">{copy.about}<ArrowRight /></LocalizedLink>
        </div>
      </section>

      {services.length ? (
        <section className="forest-chapter forest-chapter--band forest-services">
          <div className="forest-content-frame">
            <SectionHeading title={copy.servicesTitle} body={copy.servicesBody} />
            <div className="forest-browser">
              <div className="forest-browser__list" role="tablist" aria-label={copy.servicesTitle}>
                {services.map((service, index) => (
                  <button
                    key={service.slug}
                    type="button"
                    role="tab"
                    aria-selected={activeService === index}
                    className={activeService === index ? "is-active" : ""}
                    onClick={() => setActiveService(index)}
                  >
                    <span>{service.title}</span>
                    <small>{service.summary}</small>
                  </button>
                ))}
                {activeServiceItem ? (
                  <LocalizedLink className="forest-text-link" to={`/services/${activeServiceItem.slug}`}>
                    {copy.details}<ArrowRight />
                  </LocalizedLink>
                ) : null}
              </div>
              {activeServiceItem ? (
                <figure className="forest-browser__stage" role="tabpanel">
                  <SmartImage key={activeServiceItem.slug} src={activeServiceItem.image} alt={activeServiceItem.title} width={1200} height={1000} loading="lazy" />
                </figure>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {projects.length ? (
        <section className="forest-chapter forest-projects">
          <SectionHeading title={copy.projectsTitle} body={copy.projectsBody} />
          <div className="forest-project-bento">
            {projects.map((project, index) => (
              <LocalizedLink key={project.slug} to={`/projects/${project.slug}`} className={`forest-project-cell forest-project-cell--${index + 1}`}>
                <DeferredSmartImage src={project.thumbnail} alt={project.thumbnailAlt || project.title} width={1100} height={820} loading="lazy" />
                <span><small>{project.type}</small><strong>{project.title}</strong><em>{project.location}</em></span>
              </LocalizedLink>
            ))}
          </div>
          <LocalizedLink className="forest-button forest-button--outline forest-chapter-action" to="/projects">
            {copy.projectsAll}<ArrowRight />
          </LocalizedLink>
        </section>
      ) : null}

      <section className="forest-chapter forest-transformation">
        <SectionHeading title={copy.compareTitle} body={copy.compareBody} />
        <div className="forest-before-after">
          <SmartImage src={afterImage} alt={beforeAfter?.alt || copy.after} width={1200} height={800} loading="lazy" />
          <div className="forest-before-after__before" style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}>
            <SmartImage src={beforeImage} alt={beforeAfter?.alt || copy.before} width={1200} height={800} loading="lazy" />
          </div>
          <span className="forest-before-after__label forest-before-after__label--before">{copy.before}</span>
          <span className="forest-before-after__label forest-before-after__label--after">{copy.after}</span>
          <span className="forest-before-after__handle" style={{ left: `${comparePosition}%` }} aria-hidden="true" />
          <input
            type="range"
            min="0"
            max="100"
            value={comparePosition}
            aria-label={copy.compareLabel}
            onChange={(event) => setComparePosition(Number(event.target.value))}
          />
        </div>
      </section>

      {products.length ? (
        <section className="forest-chapter forest-chapter--band forest-products">
          <div className="forest-content-frame">
            <SectionHeading title={copy.productsTitle} body={copy.productsBody} />
            <div className="forest-product-grid">
              {products.map((product) => (
                <LocalizedLink key={product.slug} to={`/products/${product.slug}`} className="forest-product">
                  <span className="forest-product__media">
                    <DeferredSmartImage src={product.image} alt={product.alt || displayText(product.name)} width={720} height={450} loading="lazy" />
                  </span>
                  <span className="forest-product__copy">
                    <small>{translateMaterialCategory(product.category, language)}</small>
                    <strong>{displayText(product.name)}</strong>
                    {product.referencePrice ? <em>{product.referencePrice}</em> : null}
                    <b>{copy.productView}<ArrowRight /></b>
                  </span>
                </LocalizedLink>
              ))}
            </div>
            <LocalizedLink className="forest-button forest-button--light forest-chapter-action" to="/products">
              {copy.productsAll}<ArrowRight />
            </LocalizedLink>
          </div>
        </section>
      ) : null}

      <section className="forest-promo-band" aria-label={ariaCopy.currentOffers}>
        {copy.offers.map((item) => <LocalizedLink key={item} to="/promotions"><BadgePercent /><span>{item}</span></LocalizedLink>)}
      </section>

      {processSteps.length ? (
        <section className="forest-chapter forest-process">
          <SectionHeading title={copy.processTitle} body={copy.processBody} />
          <div className="forest-browser forest-browser--process">
            <div className="forest-browser__list" role="tablist" aria-label={copy.processTitle}>
              {processSteps.map((step, index) => (
                <button
                  key={step.id || `${step.step_number}-${step.title}`}
                  type="button"
                  role="tab"
                  aria-selected={activeProcess === index}
                  className={activeProcess === index ? "is-active" : ""}
                  onClick={() => setActiveProcess(index)}
                >
                  <span><b>{String(step.step_number || index + 1).padStart(2, "0")}</b>{step.title}</span>
                  <small>{step.description}</small>
                </button>
              ))}
            </div>
            {activeProcessItem ? (
              <figure className="forest-process-stage" role="tabpanel">
                <SmartImage src={projects[activeProcess % Math.max(projects.length, 1)]?.thumbnail || introImage} alt={activeProcessItem.title} width={1200} height={900} loading="lazy" />
                <figcaption><span>{String(activeProcessItem.step_number || activeProcess + 1).padStart(2, "0")}</span><h3>{activeProcessItem.title}</h3><p>{activeProcessItem.description}</p></figcaption>
              </figure>
            ) : null}
          </div>
        </section>
      ) : null}

      {whyItems.length ? (
        <section className="forest-chapter forest-why">
          <SectionHeading title={content?.whyChooseUsSection?.title || copy.whyTitle} body={content?.whyChooseUsSection?.content} />
          <div className="forest-feature-list">
            {whyItems.map((item, index) => <article key={`${item.title}-${index}`}><Check /><h3>{item.title}</h3><p>{item.description}</p></article>)}
          </div>
        </section>
      ) : null}

      {content?.brandPartnersEnabled && content.brandPartners.length ? (
        <section className="forest-brand-rail" aria-labelledby="forest-brands-title">
          <h2 id="forest-brands-title">{copy.brandsTitle}</h2>
          <div>{content.brandPartners.map((brand) => <span key={brand.id}><SmartImage src={brand.logo_url} alt={brand.name} width={160} height={80} loading="lazy" /><small>{brand.name}</small></span>)}</div>
        </section>
      ) : null}

      {content?.testimonials.length ? (
        <section className="forest-chapter forest-testimonials">
          <SectionHeading title={copy.testimonialsTitle} />
          <div>
            {content.testimonials.slice(0, 3).map((item) => <blockquote key={item.id}><p>“{item.text}”</p><footer><strong>{item.client}</strong><span>{[item.type, item.location].filter(Boolean).join(" · ")}</span></footer></blockquote>)}
          </div>
        </section>
      ) : null}

      {faqs.length ? (
        <section className="forest-chapter forest-faq">
          <SectionHeading title={copy.faqTitle} />
          <div className="forest-faq-list">
            {faqs.map((faq, index) => (
              <article key={faq.id}>
                <h3><button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{faq.question}</span><b aria-hidden="true">{openFaq === index ? "−" : "+"}</b></button></h3>
                {openFaq === index ? <p>{faq.answer}</p> : null}
              </article>
            ))}
          </div>
          <LocalizedLink className="forest-text-link forest-chapter-action" to="/faq">{copy.faqAll}<ArrowRight /></LocalizedLink>
        </section>
      ) : null}
    </div>
  );
};

export default ForestHome;
