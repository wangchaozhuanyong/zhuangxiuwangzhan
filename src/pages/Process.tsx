import { CheckCircle } from "lucide-react";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import CTABanner from "@/components/blocks/CTABanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import heroImg from "@/assets/hero-process.jpg";

const content = {
  en: {
    metaTitle: "Our Process | How We Work | FLASH CAST",
    metaDescription: "Learn how FLASH CAST handles your renovation project from consultation and design to construction and handover. A transparent, step-by-step process.",
    metaKeywords: "renovation process, how renovation works, step by step renovation, KL renovation process",
    breadcrumbHome: "Home",
    breadcrumbProcess: "Our Process",
    imageAlt: "FLASH CAST renovation process and project management",
    label: "How We Work",
    title: "Our Renovation Process",
    description: "A clear, structured approach from first consultation to final handover. Transparent pricing, regular updates, and professional project management at every step.",
    sectionTitle: "6 Steps to Your Dream Space",
    sectionDescription: "Every project follows the same proven process, designed for transparency, efficiency, and client satisfaction.",
    ctaTitle: "Ready to Start?",
    ctaDescription: "Get in touch today. The first step is a simple conversation.",
    quoteLabel: "Get a Free Quote",
    whatsappLabel: "WhatsApp Us",
    steps: [
      { num: "01", title: "Consultation", desc: "We understand your goals, space, style, and budget.", details: ["Submit enquiry via website, WhatsApp, or phone", "Discuss requirements, timeline, and budget", "Receive initial advice and recommendations"] },
      { num: "02", title: "Site Measurement", desc: "We inspect the site and take precise measurements. Free for enquiries in KL and Selangor.", details: ["On-site measurement", "Assess existing conditions and constraints", "Take photos and notes for design reference"] },
      { num: "03", title: "Design Proposal", desc: "We prepare layout ideas and visual direction, including 3D renders when required.", details: ["Space planning and layout design", "3D visualization of proposed design", "Material samples and selection"] },
      { num: "04", title: "Quotation & Material Selection", desc: "We provide a clear breakdown and discuss materials. No hidden costs or lump-sum guesswork.", details: ["Itemized quotation with clear pricing", "Material comparison and recommendations", "Payment schedule discussion"] },
      { num: "05", title: "Construction", desc: "Work is managed by our team with site supervision and progress updates.", details: ["Permit application and coordination", "Trades executed by our team", "Regular progress updates with photos"] },
      { num: "06", title: "Handover", desc: "Final quality check, defect rectification, cleaning, and workmanship warranty handover.", details: ["Final walkthrough and inspection", "Defect list and rectification", "Professional cleaning", "Warranty handover"] },
    ],
  },
  zh: {
    metaTitle: "装修流程 | FLASH CAST 如何执行项目",
    metaDescription: "了解 FLASH CAST 从咨询、测量、设计、报价、施工到交付的装修流程。透明报价、定期汇报、专业项目管理。",
    metaKeywords: "装修流程, 马来西亚装修步骤, 吉隆坡装修流程, FLASH CAST 施工流程",
    breadcrumbHome: "首页",
    breadcrumbProcess: "施工流程",
    imageAlt: "FLASH CAST 装修流程与项目管理",
    label: "如何执行",
    title: "我们的装修流程",
    description: "从第一次咨询到最终交付，我们用清晰流程管理项目：透明报价、定期更新、每一步都有专人跟进。",
    sectionTitle: "6 个步骤完成理想空间",
    sectionDescription: "每个项目都会按照标准流程推进，让预算、工期、材料和施工进度更清楚。",
    ctaTitle: "准备开始？",
    ctaDescription: "今天联系我们，第一步只是简单聊聊你的装修需求。",
    quoteLabel: "获取免费报价",
    whatsappLabel: "WhatsApp 咨询",
    steps: [
      { num: "01", title: "初步咨询", desc: "了解你的目标、空间、风格和预算。", details: ["通过网站、WhatsApp 或电话提交需求", "沟通装修范围、时间和预算", "提供初步建议和方向"] },
      { num: "02", title: "现场测量", desc: "到现场检查并测量尺寸，KL 与 Selangor 项目可安排免费测量。", details: ["现场尺寸测量", "检查现有条件和限制", "拍照记录供设计和报价参考"] },
      { num: "03", title: "设计方案", desc: "整理空间布局和视觉方向，需要时可提供 3D 效果参考。", details: ["空间规划与布局设计", "3D 效果图参考", "材料样板和搭配建议"] },
      { num: "04", title: "报价与材料确认", desc: "提供清楚的分项报价，并一起确认材料和预算。", details: ["分项报价清楚列明", "比较材料选项和价格", "确认付款和施工安排"] },
      { num: "05", title: "施工执行", desc: "由团队负责施工管理、现场监督和进度汇报。", details: ["准证申请与协调", "各工种按计划施工", "定期提供现场照片和进度更新"] },
      { num: "06", title: "交付与保固", desc: "最终检查、缺陷修正、清洁和施工保固交接。", details: ["最终验收和 walkthrough", "缺陷清单与修正", "交付前清洁", "保固资料交接"] },
    ],
  },
};

const Process = () => {
  const { language } = useLanguage();
  const t = content[language];

  return (
    <main className="pt-16">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/process" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbProcess, url: "/process" }]} />

      <HeroBanner image={heroImg} imageAlt={t.imageAlt} label={t.label} title={t.title} description={t.description} />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={t.sectionTitle} description={t.sectionDescription} />

          <div className="max-w-3xl mx-auto space-y-6">
            {t.steps.map((step, index) => (
              <Reveal key={step.num} delay={index * 80}>
                <div className="relative flex gap-5 md:gap-7 p-6 md:p-8 bg-card rounded-lg border border-border hover-lift">
                  <div className="shrink-0">
                    <div className="w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-display font-bold text-lg">
                      {step.num}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">{step.desc}</p>
                    <ul className="space-y-1.5">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 text-muted-foreground text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTABanner title={t.ctaTitle} description={t.ctaDescription} quoteLabel={t.quoteLabel} whatsappLabel={t.whatsappLabel} />
    </main>
  );
};

export default Process;
