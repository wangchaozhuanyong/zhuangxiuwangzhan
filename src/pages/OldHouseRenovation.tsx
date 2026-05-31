import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, AlertTriangle, Wrench, Droplets, Home } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import FAQSection from "@/components/blocks/FAQSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import beforeAfterImg from "@/assets/old-house-before-after.webp";
import oldHouseServiceImg from "@/assets/services/old-house-renovation.webp";
import { pageHeroImages } from "@/lib/pageHeroImages";

const content = {
  en: {
    metaTitle: "Old House Renovation KL | Terrace House, Bungalow & Semi-D | FLASH CAST",
    metaDescription: "Professional old house renovation in Kuala Lumpur with structural repair, rewiring, replumbing, waterproofing, and full interior makeover.",
    metaKeywords: "old house renovation KL, terrace house renovation Malaysia, bungalow renovation Kuala Lumpur, house rewiring KL, old property renovation Selangor",
    breadcrumbHome: "Home",
    breadcrumbServices: "Services",
    breadcrumbCurrent: "Old House Renovation",
    label: "Old House Renovation",
    title: "Breathe New Life Into Your Old Property",
    description: "Complete renovation for aging terrace houses, bungalows, and semi-detached homes, from structural repair and rewiring to full interior makeover.",
    heroAlt: "Beautifully renovated old terrace house in Kuala Lumpur",
    assessment: "Get Free Assessment",
    whatsapp: "WhatsApp Us",
    introTitle: "Why Renovate Your Old House?",
    intro: [
      "Many Malaysian homes built from the 1970s to 1990s face cracked walls, outdated wiring, old plumbing, water damage, termite risk, and interiors that no longer fit modern living.",
      "FLASH CAST starts with a practical site assessment, then plans the repair scope, budget, materials, and finishing sequence so the renovation improves both safety and comfort.",
    ],
    tags: ["Structural Assessment", "Full Rewiring", "Waterproofing", "Interior Makeover"],
    challengesTitle: "Common Issues in Old Houses",
    challengesDescription: "These are the problems we normally check before starting an old house renovation.",
    challenges: [
      { icon: AlertTriangle, title: "Cracked Walls & Structure", desc: "Settlement cracks and weakened plaster need proper inspection before finishing work begins." },
      { icon: Wrench, title: "Old Wiring & Plumbing", desc: "Aging electrical and plumbing systems should be upgraded for safety and long-term reliability." },
      { icon: Droplets, title: "Water Leaks & Dampness", desc: "Roof leaks, bathroom seepage, and damp walls can damage finishes and structure if ignored." },
      { icon: Home, title: "Termite & Timber Damage", desc: "Early inspection and treatment help avoid costly damage after renovation." },
    ],
    scopeTitle: "What We Cover",
    scopeDescription: "From repair works to final interior finishing.",
    scope: ["Structural repair", "Roof repair and waterproofing", "Electrical rewiring", "Plumbing replacement", "Termite treatment", "Wall crack repair", "Kitchen and bathroom renovation", "Flooring replacement", "Ceiling and lighting", "Built-in furniture", "Interior and exterior painting", "Door and window replacement"],
    processTitle: "Our Renovation Process",
    processDescription: "A safe, staged approach for older Malaysian properties.",
    process: [
      { num: "01", title: "Site Assessment", desc: "Inspect structure, leaks, termites, wiring, and plumbing." },
      { num: "02", title: "Repair Plan", desc: "Confirm repair scope, layout direction, budget, and timeline." },
      { num: "03", title: "Quotation", desc: "Prepare itemized pricing for repairs, materials, and finishing." },
      { num: "04", title: "Construction", desc: "Complete demolition, repair, waterproofing, electrical, plumbing, and fit-out." },
      { num: "05", title: "Handover", desc: "Final inspection, cleaning, defect discussion, and handover notes." },
    ],
    priceTitle: "Pricing Guide",
    priceDescription: "Old house renovation cost should be confirmed after reviewing site condition, structure, and scope.",
    prices: [
      { type: "Partial Renovation", range: "Scope-based", desc: "Kitchen, bathroom, flooring, painting, or partial rewiring." },
      { type: "Full Interior Renovation", range: "Site-based", desc: "Whole-house interior upgrade with electrical, plumbing, carpentry, and finishing." },
      { type: "Structural + Full Renovation", range: "Assessment needed", desc: "Major repair, roof, waterproofing, full M&E, and complete interior transformation." },
    ],
    faqTitle: "Old House Renovation FAQ",
    faqDescription: "Common questions about old house renovation budget, timeline, and work scope in Malaysia.",
    faqs: [
      { q: "How much does an old house renovation cost in KL?", a: "Old house renovation cost depends on property size, structure, wiring, plumbing, waterproofing, materials, and confirmed scope. We provide an itemized quotation after site assessment." },
      { q: "How long does it take?", a: "A complete terrace house renovation usually takes 10-16 weeks, depending on structural repairs, approvals, and interior scope." },
      { q: "Do old houses need rewiring?", a: "Older houses often need wiring inspection or replacement to meet modern safety and power requirements." },
    ],
    ctaTitle: "Ready to Transform Your Old House?",
    ctaDescription: "Get a free site assessment and renovation quotation for your property in KL or Selangor.",
    internalLinks: ["All Services", "Projects", "Free Quote", "Contact"],
  },
  zh: {
    metaTitle: "吉隆坡旧屋翻新 | 排屋、半独立与独立式住宅 | FLASH CAST",
    metaDescription: "FLASH CAST 提供吉隆坡旧屋翻新服务，包括结构修复、电线水管更新、防水、白蚁处理、厨房浴室和全屋室内装修。",
    metaKeywords: "吉隆坡旧屋翻新, 马来西亚排屋翻新, 旧屋电线更换, 旧屋防水, 雪兰莪房屋翻新",
    breadcrumbHome: "首页",
    breadcrumbServices: "服务项目",
    breadcrumbCurrent: "旧屋翻新",
    label: "旧屋翻新",
    title: "让旧屋重新变成舒适、安全、现代的家",
    description: "为老排屋、半独立和独立式住宅提供完整翻新，从结构修复、电线水管、防水，到厨房浴室和室内设计施工。",
    heroAlt: "吉隆坡旧排屋翻新完成效果",
    assessment: "获取免费评估",
    whatsapp: "WhatsApp 联系",
    introTitle: "为什么旧屋需要系统化翻新？",
    intro: [
      "许多马来西亚旧屋建于 1970-1990 年代，常见问题包括墙裂、漏水、电线老旧、水管生锈、白蚁和空间布局不符合现代生活。",
      "我们会先评估屋况，再规划维修范围、预算、材料和施工顺序，避免只做表面美化却忽略安全与耐用性。",
    ],
    tags: ["结构评估", "全屋电线更新", "防水处理", "室内改造"],
    challengesTitle: "旧屋常见问题",
    challengesDescription: "这些问题如果在装修前没有处理，后续往往会影响安全、预算和使用体验。",
    challenges: [
      { icon: AlertTriangle, title: "墙身裂缝与结构老化", desc: "旧屋常见沉降、墙裂或批荡老化，需要先评估再修复。" },
      { icon: Wrench, title: "电线与水管老旧", desc: "旧电线、旧配电箱和老化水管会影响安全与长期使用。" },
      { icon: Droplets, title: "漏水与潮湿问题", desc: "屋顶漏水、浴室渗水和墙身潮湿如果不处理，会破坏结构和饰面。" },
      { icon: Home, title: "白蚁与木作损坏", desc: "装修前检查和处理白蚁，可以避免后续大额维修。" },
    ],
    scopeTitle: "服务范围",
    scopeDescription: "从基础维修到完工交付，帮助旧屋完成系统化升级。",
    scope: ["结构修复", "屋顶维修与防水", "全屋电线更新", "水管更换", "白蚁检查与处理", "墙裂修补", "厨房与浴室翻新", "地板更换", "天花与灯光", "定制家具", "内外墙油漆", "门窗更换"],
    processTitle: "旧屋翻新流程",
    processDescription: "先解决结构与安全，再完成空间设计和饰面施工。",
    process: [
      { num: "01", title: "现场评估", desc: "检查结构、漏水、白蚁、电线和水管状况。" },
      { num: "02", title: "维修规划", desc: "确认维修范围、空间方向、预算和工期。" },
      { num: "03", title: "清楚报价", desc: "按项目拆分维修、材料和装修范围报价。" },
      { num: "04", title: "施工执行", desc: "完成拆除、修复、防水、电水更新和室内装修。" },
      { num: "05", title: "检查交付", desc: "完成品质检查、清洁、瑕疵修补和保修交接。" },
    ],
    priceTitle: "预算参考",
    priceDescription: "旧屋翻新费用需要看屋况、结构、电水、防水和确认后的施工范围。",
    prices: [
      { type: "局部翻新", range: "按范围评估", desc: "厨房、浴室、地板、油漆或局部电水更新。" },
      { type: "全屋室内翻新", range: "按现场评估", desc: "全屋室内升级，包括电水、木工、地板、天花和饰面。" },
      { type: "结构 + 全屋翻新", range: "需现场评估", desc: "结构维修、屋顶、防水、全屋电水和完整室内装修。" },
    ],
    faqTitle: "旧屋翻新常见问题",
    faqDescription: "关于马来西亚旧屋翻新预算、工期和施工范围的常见问题。",
    faqs: [
      { q: "吉隆坡旧屋翻新费用受什么影响？", a: "旧屋翻新费用取决于面积、结构、电水、防水、材料和确认后的施工范围。我们会现场评估后提供分项报价。" },
      { q: "旧屋翻新需要多久？", a: "排屋完整翻新通常需要 10-16 周，实际时间取决于结构修复、审批和室内施工范围。" },
      { q: "旧屋一定要换电线吗？", a: "较早建成的房屋通常建议检查或更换电线，以提升安全性并符合现代用电需求。" },
    ],
    ctaTitle: "准备翻新你的旧屋？",
    ctaDescription: "联系我们安排现场评估和免费报价，服务吉隆坡与雪兰莪主要区域。",
    internalLinks: ["全部服务", "项目案例", "免费报价", "联系我们"],
  },
};

const OldHouseRenovation = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = content[language];

  return (
    <main className="pt-site-header">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/services/old-house" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }, { name: t.breadcrumbCurrent, url: "/services/old-house" }]} />

      <section className="page-hero page-hero--detail">
        <div className="page-hero__media absolute inset-0">
          <picture className="block h-full w-full">
            <source media="(max-width: 767px)" srcSet={pageHeroImages.oldHouse.mobile} />
            <SmartImage src={pageHeroImages.oldHouse.desktop} alt={t.heroAlt} className="page-hero__image h-full w-full object-cover" width={1920} height={720} loading="eager" fetchPriority="high" />
          </picture>
          <div className="page-hero__overlay absolute inset-0 media-readable-overlay" aria-hidden="true" />
        </div>
        <div className="page-hero__content site-container">
          <p className="page-hero__label mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{t.label}</p>
          <h1 className="page-hero__title heading-safe mb-5 max-w-2xl text-3xl font-bold text-on-media md:text-5xl">{t.title}</h1>
          <p className="page-hero__description prose-safe mb-8 max-w-xl text-base text-on-media-muted md:text-lg">{t.description}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link to="/quote" className="btn-on-dark-primary min-h-12 w-full justify-center px-8 sm:w-auto">
              <ArrowRight className="h-4 w-4" /> {t.assessment}
            </Link>
            <a
              href={settings.whatsapp_url()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-on-dark-secondary min-h-12 w-full justify-center px-8 sm:w-auto"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-whatsapp" /> {t.whatsapp}
            </a>
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal direction="left">
            <div>
              <div className="subpage-local-heading--balanced">
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold">{t.introTitle}</h2>
              </div>
              {t.intro.map((paragraph) => <p key={paragraph} className="text-muted-foreground mb-4 leading-relaxed">{paragraph}</p>)}
              <div className="flex flex-wrap gap-3 mt-6">
                {t.tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent/10 text-accent px-3 py-1.5 rounded-full"><CheckCircle className="w-3 h-3" /> {tag}</span>)}
              </div>
            </div>
          </Reveal>
          <Reveal direction="right" delay={120}>
            <div className="img-zoom overflow-hidden rounded-card-lg">
              <SmartImage src={beforeAfterImg} alt={language === "zh" ? "旧屋翻新前后对比" : "Before and after old house renovation"} loading="lazy" width={1280} height={640} className="w-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10 md:mb-14">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t.challengesTitle}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">{t.challengesDescription}</p>
            </div>
          </Reveal>
          <div className="card-grid grid-cols-1 gap-5 sm:grid-cols-2">
            {t.challenges.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="flex h-full min-w-0 gap-4 overflow-hidden rounded-card border border-border bg-card p-5 hover-lift">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0"><item.icon className="w-5 h-5 text-destructive" /></div>
                  <div className="min-w-0"><h3 className="text-limit-2 font-semibold text-sm md:text-base mb-1">{item.title}</h3><p className="text-limit-3 text-muted-foreground text-sm leading-relaxed">{item.desc}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal direction="left">
            <div className="img-zoom overflow-hidden rounded-card-lg">
              <SmartImage src={oldHouseServiceImg} alt={language === "zh" ? "旧屋翻新施工现场" : "Old house renovation in progress"} loading="lazy" width={960} height={720} className="aspect-[4/3] w-full object-cover" />
            </div>
          </Reveal>
          <Reveal direction="right" delay={120}>
            <div>
              <div className="subpage-local-heading--balanced">
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold">{t.scopeTitle}</h2>
              </div>
              <p className="text-muted-foreground mb-6">{t.scopeDescription}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {t.scope.map((item) => <li key={item} className="flex items-center gap-2 text-sm"><CheckCircle className="w-3.5 h-3.5 text-gold shrink-0" /> {item}</li>)}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-surface-dark">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10 md:mb-14">
              <div className="accent-line mx-auto mb-4 bg-gold" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-surface-dark-foreground">{t.processTitle}</h2>
              <p className="text-sm md:text-base max-w-2xl mx-auto text-steel">{t.processDescription}</p>
            </div>
          </Reveal>
          <div className="card-grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {t.process.map((step, i) => (
              <Reveal key={step.num} delay={i * 80}>
                <div className="h-full rounded-card border border-white/10 bg-white/[0.03] p-5 text-center">
                  <span className="text-gold font-display text-3xl font-bold">{step.num}</span>
                  <h3 className="text-limit-2 font-semibold mt-2 mb-1.5 text-sm md:text-base text-surface-dark-foreground">{step.title}</h3>
                  <p className="text-limit-3 text-xs md:text-sm leading-relaxed text-steel">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t.priceTitle}</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">{t.priceDescription}</p>
            </div>
          </Reveal>
          <div className="card-grid mx-auto max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
            {t.prices.map((item, i) => (
              <Reveal key={item.type} delay={i * 80}>
                <div className="bg-card p-6 rounded-card border border-border hover-lift text-center h-full flex flex-col">
                  <h3 className="text-limit-2 font-display text-lg font-semibold mb-2">{item.type}</h3>
                  <p className="text-limit-1 text-gold font-display text-2xl font-bold mb-3">{item.range}</p>
                  <p className="text-limit-4 text-muted-foreground text-sm leading-relaxed flex-1">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FAQSection title={t.faqTitle} description={t.faqDescription} faqs={t.faqs} />

      <section className="subpage-link-band py-8">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">{t.internalLinks[0]}</Link>{" / "}
            <Link to="/projects" className="text-accent hover:underline">{t.internalLinks[1]}</Link>{" / "}
            <Link to="/quote" className="text-accent hover:underline">{t.internalLinks[2]}</Link>{" / "}
            <Link to="/contact" className="text-accent hover:underline">{t.internalLinks[3]}</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default OldHouseRenovation;
