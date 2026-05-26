import { MapPin, CheckCircle } from "lucide-react";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import CTABanner from "@/components/blocks/CTABanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import IconCardGrid from "@/components/blocks/IconCardGrid";
import { companyMilestones, coreValues, teamHighlights, companyStats } from "@/data/siteContent";
import { useLanguage } from "@/i18n/LanguageContext";
import heroImg from "@/assets/hero-about.jpg";

const aboutCopy = {
  en: {
    metaTitle: "About FLASH CAST | Renovation Company in Kuala Lumpur",
    metaDescription: "FLASH CAST SDN. BHD. is a registered renovation and interior design company based in Kuala Lumpur, Malaysia.",
    metaKeywords: "about FLASH CAST, renovation company KL, interior design company Malaysia",
    breadcrumbHome: "Home",
    breadcrumbAbout: "About",
    imageAlt: "FLASH CAST renovation company office and team in Kuala Lumpur",
    label: "About Us",
    title: "Building Spaces, Building Trust",
    description: "FLASH CAST SDN. BHD. is a registered renovation and interior design company based in Kuala Lumpur, providing complete design-and-build solutions for residential, commercial, and industrial spaces across KL and Selangor since 2015.",
    introTitle: "Who We Are",
    intro: [
      "Founded in 2015, FLASH CAST SDN. BHD. has grown from a small residential renovation team into a full-service design and build company serving clients across Kuala Lumpur and Selangor.",
      "We are SSM-registered and operate from our office at 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur. Our team handles every aspect of the renovation process.",
      "As an authorized applicator for German Remmers artistic coatings, we also bring European-quality decorative wall finishes to Malaysian homes and commercial spaces.",
    ],
    tags: ["SSM Registered", "Remmers Authorized", "In-House Team", "10+ Years"],
    valuesTitle: "Our Core Values",
    valuesDescription: "These principles guide every project we take on.",
    teamTitle: "Our Team",
    teamDescription: "A dedicated in-house team of professionals with coordinated project delivery.",
    journeyTitle: "Our Journey",
    journeyDescription: "From a small residential renovation team to a full-service design-and-build company serving Kuala Lumpur and Selangor.",
    officeTitle: "Visit Our Office",
    officeDescription: "Located in Taman United, Kuala Lumpur.",
    hours: "Mon-Sat: 9:00 AM - 6:00 PM",
    mapTitle: "FLASH CAST office location in Kuala Lumpur",
    ctaTitle: "Work With Us",
    ctaDescription: "Whether you are renovating a home, fitting out an office, or setting up a warehouse, we are ready to help.",
    quoteLabel: "Get a Free Quote",
    whatsappLabel: "WhatsApp Us",
  },
  zh: {
    metaTitle: "关于 FLASH CAST | 吉隆坡装修与室内设计公司",
    metaDescription: "FLASH CAST SDN. BHD. 是位于吉隆坡的注册装修与室内设计公司，服务住宅、商业和工业空间。",
    metaKeywords: "FLASH CAST 关于我们, 吉隆坡装修公司, 马来西亚室内设计公司",
    breadcrumbHome: "首页",
    breadcrumbAbout: "关于我们",
    imageAlt: "FLASH CAST 吉隆坡装修公司办公室与团队",
    label: "关于我们",
    title: "打造空间，也建立信任",
    description: "FLASH CAST SDN. BHD. 是位于吉隆坡的注册装修与室内设计公司，自 2015 年起为吉隆坡和雪兰莪客户提供住宅、商业和工业空间的一站式设计施工服务。",
    introTitle: "我们是谁",
    intro: [
      "FLASH CAST SDN. BHD. 成立于 2015 年，从住宅装修团队逐步发展为服务吉隆坡与雪兰莪的设计施工公司。",
      "公司已在 SSM 注册，办公室位于 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur。团队可统筹装修流程中的设计、预算、材料、施工和交付。",
      "我们也是德国 Remmers 艺术涂料授权施工团队，可为住宅和商业空间提供高品质艺术墙面效果。",
    ],
    tags: ["SSM 注册公司", "Remmers 授权", "自有团队", "10 年以上经验"],
    valuesTitle: "我们的核心价值",
    valuesDescription: "这些原则帮助我们把每个装修项目做得更清楚、更可靠。",
    teamTitle: "我们的团队",
    teamDescription: "由设计、项目管理、木工和专业施工人员组成的协作团队。",
    journeyTitle: "公司发展",
    journeyDescription: "从住宅装修团队，发展为覆盖吉隆坡与雪兰莪的一站式设计施工公司。",
    officeTitle: "欢迎到访办公室",
    officeDescription: "办公室位于 Taman United, Kuala Lumpur。",
    hours: "星期一至星期六：上午 9:00 - 下午 6:00",
    mapTitle: "FLASH CAST 吉隆坡办公室位置",
    ctaTitle: "让我们一起规划你的项目",
    ctaDescription: "无论是住宅翻新、办公室装修或仓储空间规划，我们都可以协助评估并提供报价。",
    quoteLabel: "获取免费报价",
    whatsappLabel: "WhatsApp 咨询",
  },
};

const localizedValues = {
  en: coreValues,
  zh: coreValues.map((item, index) => ({
    ...item,
    title: ["品质工艺", "透明沟通", "按时交付", "以客户需求为先"][index],
    desc: [
      "每个项目都重视细节、材料和施工方法，让空间不只好看，也经得起长期使用。",
      "报价清楚、过程透明，施工期间保持进度沟通，减少预算和时间上的不确定。",
      "通过项目管理和节点安排，让装修进度更容易被跟踪和控制。",
      "我们会先理解你的生活方式、预算和目标，再给出适合项目的专业建议。",
    ][index],
  })),
};

const localizedTeam = {
  en: teamHighlights,
  zh: teamHighlights.map((item, index) => ({
    ...item,
    title: ["专业木工团队", "设计顾问", "项目经理", "艺术涂料施工人员"][index],
    desc: [
      "负责定制柜、衣柜、电视柜、储物和木作细节。",
      "把需求转化为空间布局、风格方向和实用设计方案。",
      "协调准证、材料、工种和现场品质检查。",
      "接受 Remmers 艺术涂料施工培训，负责特色墙和高级墙面效果。",
    ][index],
  })),
};

const localizedMilestones = {
  en: companyMilestones,
  zh: [
    { year: "2015", title: "公司成立", desc: "FLASH CAST SDN. BHD. 于吉隆坡成立，初期专注住宅装修项目。" },
    { year: "2017", title: "拓展商业项目", desc: "开始承接商业空间、办公室装修和企业客户项目。" },
    { year: "2019", title: "Remmers 合作", desc: "成为德国 Remmers 艺术墙面涂料在马来西亚的授权施工团队。" },
    { year: "2021", title: "工业空间服务", desc: "新增仓储架与工业空间规划服务，支持制造与物流客户。" },
    { year: "2023", title: "完成 200+ 项目", desc: "住宅、商业和工业类别累计完成超过 200 个项目。" },
    { year: "2025", title: "区域覆盖扩大", desc: "服务范围覆盖吉隆坡与雪兰莪主要区域。" },
  ],
};

const localizedStats = {
  en: companyStats,
  zh: [
    { value: "200+", label: "完成项目" },
    { value: "10+", label: "行业经验" },
    { value: "50+", label: "团队成员" },
    { value: "98%", label: "客户满意度" },
  ],
};

const About = () => {
  const { language } = useLanguage();
  const t = aboutCopy[language];

  return (
    <main className="pt-16">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/about" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbAbout, url: "/about" }]} />

      <HeroBanner image={heroImg} imageAlt={t.imageAlt} label={t.label} title={t.title} description={t.description} />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Reveal direction="left">
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{t.introTitle}</h2>
                {t.intro.map((paragraph) => (
                  <p key={paragraph} className="text-muted-foreground mb-4">{paragraph}</p>
                ))}
                <div className="flex flex-wrap gap-3">
                  {t.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" delay={150}>
              <div className="grid grid-cols-2 gap-5">
                {localizedStats[language].map((stat) => (
                  <div key={stat.label} className="text-center p-6 bg-card rounded-lg border border-border group hover-lift">
                    <span className="font-display text-2xl md:text-3xl font-bold text-accent block mb-1">{stat.value}</span>
                    <span className="text-muted-foreground text-xs leading-relaxed">{stat.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <SectionHeader title={t.valuesTitle} description={t.valuesDescription} />
          <IconCardGrid items={localizedValues[language]} columns={2} layout="horizontal" />
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={t.teamTitle} description={t.teamDescription} />
          <IconCardGrid items={localizedTeam[language]} columns={4} layout="horizontal" />
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <SectionHeader title={t.journeyTitle} description={t.journeyDescription} />
          <div className="max-w-2xl mx-auto">
            {localizedMilestones[language].map((milestone, i) => (
              <Reveal key={milestone.year} delay={i * 60}>
                <div className="flex gap-5 mb-6 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {milestone.year.slice(2)}
                    </div>
                    {i < localizedMilestones[language].length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-accent font-bold text-sm">{milestone.year}</span>
                      <h3 className="font-display font-semibold text-sm md:text-base">{milestone.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{milestone.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <Reveal>
          <div className="container-narrow">
            <SectionHeader title={t.officeTitle} description={t.officeDescription} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto">
              <div className="bg-card p-8 rounded-lg text-center hover-lift flex flex-col items-center justify-center border border-border">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <p className="font-semibold mb-1">FLASH CAST SDN. BHD.</p>
                <p className="text-muted-foreground text-sm mb-3">94, Jalan Mega Mendung, Taman United,<br />58200 Kuala Lumpur, Malaysia</p>
                <p className="text-muted-foreground text-xs">{t.hours}</p>
              </div>
              <div className="rounded-lg overflow-hidden bg-background border border-border min-h-[220px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3984.0!2d101.68!3d3.11!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMDYnMzYuMCJOIDEwMcKwNDAnNDguMCJF!5e0!3m2!1sen!2smy!4v1600000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "220px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t.mapTitle}
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <CTABanner title={t.ctaTitle} description={t.ctaDescription} quoteLabel={t.quoteLabel} whatsappLabel={t.whatsappLabel} />
    </main>
  );
};

export default About;
