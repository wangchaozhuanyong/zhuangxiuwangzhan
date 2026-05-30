import { MapPin, CheckCircle } from "lucide-react";
import { Layers, MessageCircle, Paintbrush, ShieldCheck, Target, Users, Wrench } from "lucide-react";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import IconCardGrid from "@/components/blocks/IconCardGrid";
import { companyMilestones, coreValues, teamHighlights, companyStats } from "@/data/siteContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroImg from "@/assets/hero-about.webp";
import { usePublishedAboutSection, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useMemo } from "react";

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
      "We also discuss artistic wall coating options for homes and commercial spaces when this finish suits the project.",
    ],
    tags: ["SSM Registered", "Local Office", "Design & Build", "Project Coordination"],
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
    tags: ["SSM 注册公司", "本地办公室", "设计施工协调", "项目范围沟通"],
    valuesTitle: "我们的核心价值",
    valuesDescription: "这些原则帮助我们把每个装修项目做得更清楚、更可靠。",
    teamTitle: "我们的团队",
    teamDescription: "由设计、项目管理、木工和专业施工人员组成的协作团队。",
    journeyTitle: "公司发展",
    journeyDescription: "从住宅装修团队，发展为覆盖吉隆坡与雪兰莪的一站式设计施工公司。",
    officeTitle: "欢迎到访办公室",
    officeDescription: "办公室位于 Taman United，吉隆坡。",
    hours: "星期一至星期六：上午 9:00 - 下午 6:00",
    mapTitle: "FLASH CAST 吉隆坡办公室位置",
    ctaTitle: "让我们一起规划你的项目",
    ctaDescription: "无论是住宅翻新、办公室装修或仓储空间规划，我们都可以协助评估并提供报价。",
    quoteLabel: "获取免费报价",
    whatsappLabel: "WhatsApp 联系",
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
      "熟悉部分装饰墙面做法，负责特色墙和墙面效果沟通。",
    ][index],
  })),
};

const localizedMilestones = {
  en: companyMilestones,
  zh: [
    { year: "2015", title: "公司成立", desc: "FLASH CAST SDN. BHD. 于吉隆坡成立，初期专注住宅装修项目。" },
    { year: "2017", title: "拓展商业项目", desc: "开始承接商业空间、办公室装修和企业客户项目。" },
    { year: "2019", title: "艺术墙面服务", desc: "增加艺术墙面涂装选项，用于部分特色墙项目。" },
    { year: "2021", title: "工业空间服务", desc: "新增仓储架与工业空间规划服务，支持制造与物流客户。" },
    { year: "2023", title: "项目范围扩大", desc: "持续扩展住宅、商业和部分工业空间的装修服务范围。" },
    { year: "2025", title: "区域覆盖扩大", desc: "服务范围覆盖吉隆坡与雪兰莪主要区域。" },
  ],
};

const localizedStats = {
  en: companyStats,
  zh: [
    { value: "范围", label: "清楚规划范围" },
    { value: "吉隆坡与雪兰莪", label: "本地服务区域" },
    { value: "住宅", label: "住宅项目沟通" },
    { value: "商业", label: "商业项目沟通" },
  ],
};

const aboutIconMap = {
  check: CheckCircle,
  checkcircle: CheckCircle,
  layers: Layers,
  messagecircle: MessageCircle,
  paintbrush: Paintbrush,
  shieldcheck: ShieldCheck,
  target: Target,
  users: Users,
  wrench: Wrench,
};

const normalizeIconCardItems = (items: unknown, fallback: Array<{ icon: any; title: string; desc: string }>) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const normalized = items
    .map((item: any, index) => {
      const iconKey = String(item?.icon || "").toLowerCase().replace(/[\s_-]+/g, "");
      return {
        icon: aboutIconMap[iconKey as keyof typeof aboutIconMap] || fallback[index]?.icon || CheckCircle,
        title: String(item?.title || item?.title_zh || item?.title_en || "").trim(),
        desc: String(item?.desc || item?.desc_zh || item?.desc_en || "").trim(),
      };
    })
    .filter((item) => item.title && item.desc);
  return normalized.length ? normalized : null;
};

const About = () => {
  const { language } = useLanguage();
  const t = aboutCopy[language];
  const settings = useSiteSettings();

  const { data: heroSection } = usePublishedAboutSection(language, "hero");
  const { data: introSection } = usePublishedAboutSection(language, "intro");
  const { data: statsSection } = usePublishedAboutSection(language, "stats");
  const { data: valuesSection } = usePublishedAboutSection(language, "core_values");
  const { data: teamSection } = usePublishedAboutSection(language, "team");
  const { data: milestonesSection } = usePublishedAboutSection(language, "milestones");
  const { data: officeSection } = usePublishedAboutSection(language, "office");
  const { data: pageContent } = usePublishedSitePage(language, "about");

  const dynamicIntroParagraphs = useMemo<string[] | null>(() => {
    const items = introSection?.items;
    if (!Array.isArray(items) || items.length === 0) return null;
    const asStrings = items.filter((x: any) => typeof x === "string");
    return asStrings.length ? asStrings : null;
  }, [introSection?.items]);

  const dynamicStats = useMemo<Array<{ value: string; label: string }> | null>(() => {
    const items = statsSection?.items;
    if (!Array.isArray(items) || items.length === 0) return null;
    const normalized = items
      .map((x: any) => ({
        value: String(x?.value ?? ""),
        label: String(x?.label ?? ""),
      }))
      .filter((x: any) => x.value && x.label);
    return normalized.length ? normalized : null;
  }, [statsSection?.items]);

  const dynamicMilestones = useMemo<Array<{ year: string; title: string; desc: string }> | null>(() => {
    const items = milestonesSection?.items;
    if (!Array.isArray(items) || items.length === 0) return null;
    const normalized = items
      .map((x: any) => ({
        year: String(x?.year ?? ""),
        title: String(x?.title ?? ""),
        desc: String(x?.desc ?? ""),
      }))
      .filter((x: any) => x.year && x.title && x.desc);
    return normalized.length ? normalized : null;
  }, [milestonesSection?.items]);

  const dynamicValues = useMemo(() => normalizeIconCardItems(valuesSection?.items, localizedValues[language]), [valuesSection?.items, language]);
  const dynamicTeam = useMemo(() => normalizeIconCardItems(teamSection?.items, localizedTeam[language]), [teamSection?.items, language]);
  const displayedMilestones = dynamicMilestones || localizedMilestones[language];

  return (
    <main className="pt-site-header overflow-x-hidden">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/about"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbAbout, url: "/about" }]} />

      <HeroBanner
        image={(heroSection?.image_url as string) || heroImg}
        imageAlt={t.imageAlt}
        label={t.label}
        title={(heroSection?.title as string) || t.title}
        description={(heroSection?.content as string) || (heroSection?.subtitle as string) || t.description}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Reveal direction="left">
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{(introSection?.title as string) || t.introTitle}</h2>
                {(dynamicIntroParagraphs || t.intro).map((paragraph) => (
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
                {(dynamicStats || localizedStats[language]).map((stat: any) => (
                  <div key={stat.label} className="text-center luxury-card p-6 group hover-lift">
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
          <SectionHeader title={(valuesSection?.title as string) || t.valuesTitle} description={(valuesSection?.content as string) || t.valuesDescription} />
          <IconCardGrid items={dynamicValues || localizedValues[language]} columns={2} layout="horizontal" />
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={(teamSection?.title as string) || t.teamTitle} description={(teamSection?.content as string) || t.teamDescription} />
          <IconCardGrid items={dynamicTeam || localizedTeam[language]} columns={4} layout="horizontal" />
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <SectionHeader title={(milestonesSection?.title as string) || t.journeyTitle} description={(milestonesSection?.content as string) || t.journeyDescription} />
          <div className="max-w-2xl mx-auto">
            {displayedMilestones.map((milestone: any, i: number) => (
              <Reveal key={milestone.year} delay={i * 60}>
                <div className="flex gap-5 mb-6 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/15 text-xs font-bold text-gold">
                      {milestone.year.slice(2)}
                    </div>
                    {i < displayedMilestones.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
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
            <SectionHeader title={(officeSection?.title as string) || t.officeTitle} description={(officeSection?.content as string) || t.officeDescription} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto">
              <div className="luxury-card flex flex-col items-center justify-center p-8 text-center hover-lift">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <p className="font-semibold mb-1">{settings.company_name}</p>
                <p className="text-muted-foreground text-sm mb-3 whitespace-pre-line">{settings.address}</p>
                <p className="text-muted-foreground text-xs">{t.hours}</p>
              </div>
              <GoogleMapEmbed title={t.mapTitle} addressLabel={settings.address} height={220} className="min-h-[220px]" />
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
};

export default About;
