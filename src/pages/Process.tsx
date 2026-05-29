import { useMemo } from "react";
import { CheckCircle } from "lucide-react";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import CTABanner from "@/components/blocks/CTABanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedProcessSteps } from "@/hooks/usePublishedContent";
import heroImg from "@/assets/hero-process.webp";

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
      { num: "04", title: "Quotation & Material Selection", desc: "We provide a clear breakdown and discuss materials based on the confirmed scope.", details: ["Itemized quotation with clear pricing", "Material comparison and recommendations", "Payment schedule discussion"] },
      { num: "05", title: "Construction", desc: "Work is managed by our team with site supervision and progress updates.", details: ["Permit application and coordination", "Trades executed by our team", "Regular progress updates with photos"] },
      { num: "06", title: "Handover", desc: "Final quality check, defect discussion, cleaning, and handover notes based on the confirmed scope.", details: ["Final walkthrough and inspection", "Defect list and rectification", "Professional cleaning", "After-sales terms confirmed in project documents"] },
    ],
  },
  zh: {
    metaTitle: "施工流程 | FLASH CAST 如何执行项目",
    metaDescription: "了解 FLASH CAST 如何从咨询、设计、施工到交付，全流程透明管理您的装修项目。",
    metaKeywords: "装修流程, 马来西亚装修步骤, 吉隆坡装修流程, FLASH CAST 施工流程",
    breadcrumbHome: "首页",
    breadcrumbProcess: "施工流程",
    imageAlt: "FLASH CAST 装修流程与项目管理",
    label: "我们的做法",
    title: "装修施工流程",
    description: "从第一次咨询到最终交付，我们用清晰、结构化的方式管理每个项目。报价透明、进度稳定、每一步都有专业团队跟进。",
    sectionTitle: "6 个步骤完成理想空间",
    sectionDescription: "每个项目都遵循同一套成熟流程，确保透明、高效，并让客户安心。",
    ctaTitle: "准备开始了吗？",
    ctaDescription: "立即联系我们，第一步只是一次简单沟通。",
    quoteLabel: "获取免费报价",
    whatsappLabel: "WhatsApp 咨询",
    steps: [
      { num: "01", title: "初步咨询", desc: "了解您的目标、空间、风格与预算。", details: ["通过网站、WhatsApp 或电话提交咨询", "沟通需求、时间安排与预算", "获取初步建议与方向"] },
      { num: "02", title: "上门测量", desc: "我们会到现场进行精确测量。吉隆坡与雪兰莪咨询可享免费上门测量。", details: ["现场测量", "评估现有条件与限制", "拍照记录，供设计参考"] },
      { num: "03", title: "设计方案", desc: "根据空间规划与视觉方向制作方案，必要时提供 3D 效果图。", details: ["空间规划与布局设计", "3D 方案可视化", "材料样板与搭配建议"] },
      { num: "04", title: "报价与材料确认", desc: "提供清晰的分项报价，并讨论材料选择，费用透明不含隐藏项。", details: ["分项报价，价格清晰", "材料对比与建议", "付款安排说明"] },
      { num: "05", title: "施工执行", desc: "由团队统一管理，现场监督并持续汇报进度。", details: ["申请与协调所需许可", "由我们团队执行各工种", "定期发送现场进度照片"] },
      { num: "06", title: "交付验收", desc: "最终质量检查、缺陷修正、清洁与保固交付。", details: ["最终巡检与验收", "缺陷清单与修正", "专业清洁", "保固资料交付"] },
    ],
  },
};

const Process = () => {
  const { language } = useLanguage();
  const t = content[language];
  const { data: publishedSteps } = usePublishedProcessSteps(language);
  const steps = useMemo(() => {
    if (!publishedSteps?.length) return t.steps;
    return publishedSteps.map((row, index) => ({
      num: String(row.step_number || index + 1).padStart(2, "0"),
      title: row.title,
      desc: row.description,
      details: t.steps[index]?.details?.length ? t.steps[index].details : row.description ? [row.description] : [],
    }));
  }, [publishedSteps, t.steps]);

  return (
    <main className="pt-site-header">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/process" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbProcess, url: "/process" }]} />

      <HeroBanner image={heroImg} imageAlt={t.imageAlt} label={t.label} title={t.title} description={t.description} />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={t.sectionTitle} description={t.sectionDescription} />

          <div className="mx-auto max-w-3xl space-y-6">
            {steps.map((step, index) => (
              <Reveal key={step.num} delay={index * 80}>
                <div className="luxury-card hover-lift relative flex gap-5 p-6 md:gap-7 md:p-8">
                  <div className="shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-accent-foreground">
                      {step.num}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 font-display text-lg font-semibold">{step.title}</h3>
                    <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                    <ul className="space-y-1.5">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
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
