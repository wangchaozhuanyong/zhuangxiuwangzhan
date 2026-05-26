import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdFAQ, JsonLdBreadcrumb } from "@/components/JsonLd";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useLanguage } from "@/i18n/LanguageContext";
import { whatsappUrl } from "@/config/site";
import heroImg from "@/assets/hero-faq.jpg";

const faqContent = {
  en: {
    metaTitle: "FAQ | Renovation Questions Kuala Lumpur | FLASH CAST",
    metaDescription: "Frequently asked questions about renovation services, pricing, materials, custom built-in furniture, and permits in Kuala Lumpur and Selangor by FLASH CAST SDN. BHD.",
    metaKeywords: "renovation FAQ Malaysia, renovation questions KL, built-in furniture FAQ, renovation permit KL",
    breadcrumbHome: "Home",
    breadcrumbFaq: "FAQ",
    heroAlt: "FLASH CAST FAQ",
    eyebrow: "Help Center",
    title: "Frequently Asked Questions",
    intro: "Common questions about our renovation services, process, pricing, and materials.",
    ctaTitle: "Still Have Questions?",
    ctaText: "Reach out to us directly. We are happy to help.",
    contact: "Contact Us",
    whatsapp: "WhatsApp Us",
    categories: [
      {
        category: "General",
        items: [
          { q: "What renovation services does FLASH CAST provide?", a: "We provide full renovation, interior design, custom built-in furniture, kitchen renovation, bathroom renovation, office renovation, shoplot renovation, artistic wall coating (German Remmers), old house renovation, and permit coordination across Kuala Lumpur and Selangor." },
          { q: "Which areas do you serve?", a: "We serve all areas in Kuala Lumpur and Selangor including Mont Kiara, Bangsar, Cheras, Petaling Jaya, Subang Jaya, Shah Alam, Puchong, and surrounding areas." },
          { q: "Is FLASH CAST a registered company?", a: "Yes, FLASH CAST SDN. BHD. is a fully SSM-registered company based in Taman United, Kuala Lumpur." },
        ],
      },
      {
        category: "Process & Pricing",
        items: [
          { q: "How do I get a quotation?", a: "Contact us via WhatsApp, phone, or our online quote form. We will arrange a free site measurement and provide a detailed itemized quotation with no obligation and no hidden charges." },
          { q: "Do you offer free site measurements?", a: "Yes, we provide free on-site measurements for projects in KL and Selangor as part of our quotation process." },
          { q: "How long does a typical renovation take?", a: "Most residential renovations take 6-12 weeks. Kitchen projects take 3-5 weeks. Bathroom renovations take 2-3 weeks. Office and shop lot fit-outs take 4-8 weeks. We provide a detailed timeline with milestones." },
          { q: "Do you provide warranty or after-sales support?", a: "Yes. All renovation works come with workmanship warranty. We also provide after-sales support for any issues that arise after handover." },
        ],
      },
      {
        category: "Kitchen & Bathroom",
        items: [
          { q: "How long does a kitchen renovation take?", a: "A typical kitchen renovation takes 3-5 weeks depending on the scope and whether plumbing changes are needed." },
          { q: "Is waterproofing included in bathroom renovation?", a: "Yes. We apply multiple layers of waterproof membrane and conduct a 48-hour water test before tiling." },
          { q: "Can you install kitchen appliances?", a: "Yes. We integrate ovens, hoods, hobs, dishwashers, and other appliances into the cabinet design." },
        ],
      },
      {
        category: "Custom Built-In & Materials",
        items: [
          { q: "Can you build custom furniture to my exact dimensions?", a: "Yes, all our built-in furniture is made to measure, including wardrobes, kitchen cabinets, TV consoles, shoe cabinets, vanities, and more." },
          { q: "What materials do you use for cabinets?", a: "We use melamine, acrylic, solid wood, laminate, and other premium materials. Soft-close hardware is included as standard for suitable cabinet systems." },
          { q: "Can I see material samples before committing?", a: "Yes. We encourage clients to view material samples such as tiles, boards, countertops, and cabinet finishes before making a decision." },
        ],
      },
      {
        category: "Commercial & Permits",
        items: [
          { q: "Do you handle renovation permits and approvals?", a: "Yes, we assist with condo management office applications, DBKL permits, local council approvals, drawing coordination, and site inspection scheduling." },
          { q: "Can you renovate my shop or office?", a: "Yes, we handle shop lot renovation, office fit-out, F&B interiors, clinic setup, showroom works, and retail displays for commercial clients across KL and Selangor." },
          { q: "Can you work after business hours for office renovation?", a: "Yes. We can arrange night or weekend work to minimize disruption to your operations." },
        ],
      },
    ],
  },
  zh: {
    metaTitle: "常见问题 | 吉隆坡装修问答 | FLASH CAST",
    metaDescription: "FLASH CAST 整理马来西亚装修服务、报价、材料、定制家具和准证申请常见问题，服务 Kuala Lumpur 与 Selangor。",
    metaKeywords: "马来西亚装修常见问题, 吉隆坡装修问答, 定制家具 FAQ, DBKL 装修准证",
    breadcrumbHome: "首页",
    breadcrumbFaq: "常见问题",
    heroAlt: "FLASH CAST 装修常见问题",
    eyebrow: "帮助中心",
    title: "常见问题",
    intro: "关于装修服务、流程、报价、材料和准证的常见问题整理。",
    ctaTitle: "还有其他问题？",
    ctaText: "欢迎直接联系我们，我们会根据你的项目情况给出建议。",
    contact: "联系我们",
    whatsapp: "WhatsApp 咨询",
    categories: [
      {
        category: "一般问题",
        items: [
          { q: "FLASH CAST 提供哪些装修服务？", a: "我们提供全屋装修、室内设计、定制内嵌家具、厨房装修、浴室装修、办公室装修、店铺装修、德国 Remmers 艺术墙面涂装、旧屋翻新和准证协调服务。" },
          { q: "你们服务哪些地区？", a: "我们服务 Kuala Lumpur 与 Selangor，包括 Mont Kiara、Bangsar、Cheras、Petaling Jaya、Subang Jaya、Shah Alam、Puchong 和周边地区。" },
          { q: "FLASH CAST 是注册公司吗？", a: "是的，FLASH CAST SDN. BHD. 是 SSM 注册公司，办公室位于 Taman United, Kuala Lumpur。" },
        ],
      },
      {
        category: "流程与报价",
        items: [
          { q: "如何获取装修报价？", a: "你可以通过 WhatsApp、电话或网站报价表单联系。我们会安排现场测量，并提供清楚的分项报价。" },
          { q: "现场测量是免费的吗？", a: "KL 与 Selangor 项目可安排免费现场测量，作为报价流程的一部分。" },
          { q: "一般装修需要多久？", a: "住宅装修通常需要 6-12 周，厨房约 3-5 周，浴室约 2-3 周，办公室和店铺装修约 4-8 周，实际时间会根据范围确认。" },
          { q: "是否提供保固和售后？", a: "是的，装修工程会提供施工保固，并在交付后提供售后支援。" },
        ],
      },
      {
        category: "厨房与浴室",
        items: [
          { q: "厨房装修一般多久？", a: "一般厨房装修约 3-5 周，取决于橱柜、台面、水电和是否需要更改管线。" },
          { q: "浴室装修包含防水吗？", a: "包含。我们会进行多层防水处理，并在铺砖前进行蓄水测试。" },
          { q: "可以安装厨房电器吗？", a: "可以。我们可配合烤箱、抽油烟机、炉具、洗碗机等电器整合橱柜设计。" },
        ],
      },
      {
        category: "定制家具与材料",
        items: [
          { q: "可以按尺寸定制家具吗？", a: "可以。衣柜、厨房橱柜、电视柜、鞋柜、浴室柜等都可按现场尺寸定制。" },
          { q: "橱柜常用什么材料？", a: "常用材料包括 melamine、acrylic、solid wood、laminate 等，也可根据预算和风格推荐。" },
          { q: "决定前可以看材料样板吗？", a: "可以。我们建议客户先查看瓷砖、板材、台面和门板样板，再确认最终材料。" },
        ],
      },
      {
        category: "商业空间与准证",
        items: [
          { q: "你们会处理装修准证吗？", a: "我们可协助 condo management 申请、DBKL 或地方政府准证、图纸协调和现场检查安排。" },
          { q: "可以装修店铺或办公室吗？", a: "可以。我们承接店铺、办公室、餐饮空间、诊所、展厅和零售空间装修。" },
          { q: "办公室装修可以安排非营业时间施工吗？", a: "可以根据项目安排夜间或周末施工，以减少对业务运作的影响。" },
        ],
      },
    ],
  },
};

const FAQ = () => {
  const { language } = useLanguage();
  const t = faqContent[language];

  return (
    <main className="pt-16">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/faq" />
      <JsonLdFAQ faqs={t.categories.flatMap((cat) => cat.items.map((item) => ({ question: item.q, answer: item.a })))} />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbFaq, url: "/faq" }]} />

      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={t.heroAlt} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>{t.eyebrow}</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {t.title}
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            {t.intro}
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          {t.categories.map((category, categoryIndex) => (
            <Reveal key={category.category} delay={categoryIndex * 100}>
              <div className="mb-10">
                <div className="accent-line mb-3" />
                <h2 className="font-display text-xl font-bold mb-4">{category.category}</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.items.map((item, index) => (
                    <AccordionItem key={`${category.category}-${index}`} value={`${category.category}-${index}`} className="bg-card rounded-lg border border-border px-4">
                      <AccordionTrigger className="text-left text-sm font-medium">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-padding bg-surface-dark text-center">
        <Reveal>
          <div className="container-narrow">
            <div className="accent-line mx-auto mb-4" style={{ backgroundColor: "hsl(var(--gold))" }} />
            <h2 className="font-display text-3xl font-bold mb-4 text-primary-foreground">{t.ctaTitle}</h2>
            <p className="text-steel-light mb-6">{t.ctaText}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/contact">{t.contact}</Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsapp}
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
};

export default FAQ;
