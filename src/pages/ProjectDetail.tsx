import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MapPin, Clock, CheckCircle, Star, Wrench, Layers } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { projectsData } from "@/data/projects";
import { usePublishedProjectBySlug, usePublishedProjectSummaries } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";

const typeToService: Record<string, { en: string; zh: string; slug: string }> = {
  Residential: { en: "Interior Renovation", zh: "室内装修", slug: "renovation" },
  Commercial: { en: "Shop Renovation", zh: "店铺装修", slug: "shop-renovation" },
  "Built-In": { en: "Custom Built-In Solutions", zh: "定制内嵌家具", slug: "builtin" },
  Warehouse: { en: "Warehouse & Shelving", zh: "仓库与货架工程", slug: "warehouse" },
  Exterior: { en: "Shop Renovation", zh: "店铺装修", slug: "shop-renovation" },
  Office: { en: "Office Renovation", zh: "办公室装修", slug: "office-renovation" },
};

const copy = {
  en: {
    notFound: "Project Not Found",
    viewAll: "View All Projects",
    breadcrumbHome: "Home",
    breadcrumbProjects: "Projects",
    metaSuffix: "FLASH CAST Renovation",
    metaDescription: (type: string, location: string, need: string) => `${type} renovation project reference in ${location} by FLASH CAST: ${need}`,
    metaKeywords: (type: string, location: string, title: string) => `${type} renovation ${location}, ${title}, renovation project Malaysia`,
    allProjects: "All Projects",
    summaryLabel: "Project Summary:",
    summary: (title: string, type: string, location: string, duration: string, scope: string[]) =>
      `${title} is a ${type.toLowerCase()} renovation project reference by FLASH CAST SDN. BHD. in ${location}, Malaysia. The listed scope includes ${scope.slice(0, 3).join(", ")}, and more.`,
    overview: "Project Overview",
    clientRequirements: "Client's Requirements",
    solution: "Our Solution & Highlights",
    gallery: "Project Gallery",
    testimonialBy: (location: string) => `Client, ${location}`,
    resultTitle: "Project Result",
    resultIntro: (type: string, location: string, duration: string, scopeCount: number, materialCount: number) =>
      `This ${type.toLowerCase()} project page outlines the renovation scope in ${location}, with ${scopeCount} work items and ${materialCount} selected material categories.`,
    satisfied: "The client feedback shown above is linked to this published project record.",
    similarPrompt: "Looking for a similar project? Explore our",
    serviceWord: "service.",
    details: "Project Details",
    type: "Type",
    location: "Location",
    duration: "Duration",
    scopeItems: "Scope Items",
    items: "items",
    scope: "Scope of Work",
    materials: "Materials Used",
    similarTitle: "Want Something Similar?",
    similarText: "Get a free consultation and quotation for your project.",
    quote: "Get a Free Quote",
    whatsapp: "WhatsApp Us",
    relatedService: "Related Service",
    moreProjects: "More Projects",
    internalServices: "Services",
    internalMaterials: "Materials",
    internalBlog: "Blog",
    internalFaq: "FAQ",
    internalContact: "Contact",
    imageLabel: "Image",
  },
  zh: {
    notFound: "案例不存在",
    viewAll: "查看全部案例",
    breadcrumbHome: "首页",
    breadcrumbProjects: "装修案例",
    metaSuffix: "FLASH CAST 装修案例",
    metaDescription: (type: string, location: string, need: string) => `FLASH CAST 在 ${location} 的 ${type} 装修项目参考：${need}`,
    metaKeywords: (type: string, location: string, title: string) => `${location} ${type} 装修案例, ${title}, 马来西亚装修公司`,
    allProjects: "全部案例",
    summaryLabel: "项目摘要：",
    summary: (title: string, type: string, location: string, duration: string, scope: string[]) =>
      `${title} 是 FLASH CAST SDN. BHD. 在 ${location} 发布的 ${type} 项目参考，施工内容包括 ${scope.slice(0, 3).join("、")} 等。`,
    overview: "项目概览",
    clientRequirements: "客户需求",
    solution: "解决方案与项目亮点",
    gallery: "项目图片",
    testimonialBy: (location: string) => `${location} 客户`,
    resultTitle: "项目成果",
    resultIntro: (type: string, location: string, duration: string, scopeCount: number, materialCount: number) =>
      `这个位于 ${location} 的 ${type} 项目页面说明了装修范围，共涵盖 ${scopeCount} 项施工内容，并使用 ${materialCount} 类材料。`,
    satisfied: "上方客户反馈来自该已发布项目记录。",
    similarPrompt: "想做类似项目？可以先了解我们的",
    serviceWord: "服务。",
    details: "项目资料",
    type: "类型",
    location: "地区",
    duration: "工期",
    scopeItems: "施工项目",
    items: "项",
    scope: "施工内容",
    materials: "使用材料",
    similarTitle: "想做类似装修？",
    similarText: "联系我们获取免费咨询和项目报价。",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 联系",
    relatedService: "相关服务",
    moreProjects: "更多案例",
    internalServices: "服务项目",
    internalMaterials: "材料库",
    internalBlog: "装修博客",
    internalFaq: "常见问题",
    internalContact: "联系我们",
    imageLabel: "图片",
  },
};

const zhCopy = {
  notFound: "案例不存在",
  viewAll: "查看全部案例",
  breadcrumbHome: "首页",
  breadcrumbProjects: "装修案例",
  metaSuffix: "FLASH CAST 装修案例",
  metaDescription: (type: string, location: string, need: string) => `FLASH CAST 在 ${location} 的 ${type} 装修项目参考：${stripHtml(need)}`,
  metaKeywords: (type: string, location: string, title: string) => `${location} ${type} 装修案例, ${title}, 马来西亚装修公司`,
  allProjects: "全部案例",
  summaryLabel: "项目摘要：",
  summary: (title: string, type: string, location: string, duration: string, scope: string[]) =>
    `${title} 是 FLASH CAST SDN. BHD. 在 ${location} 发布的 ${type} 项目参考，施工内容包括 ${scope.slice(0, 3).join("、")} 等。`,
  overview: "项目概览",
  clientRequirements: "客户需求",
  solution: "解决方案与项目亮点",
  gallery: "项目图片",
  testimonialBy: (location: string) => `${location} 客户`,
  resultTitle: "项目成果",
  resultIntro: (type: string, location: string, duration: string, scopeCount: number, materialCount: number) =>
    `这个位于 ${location} 的 ${type} 项目页面说明了装修范围，共涵盖 ${scopeCount} 项施工内容，并使用 ${materialCount} 类材料。`,
  satisfied: "上方客户反馈来自该已发布项目记录。",
  similarPrompt: "想做类似项目？可以先了解我们的",
  serviceWord: "服务。",
  details: "项目资料",
  type: "类型",
  location: "地区",
  duration: "工期",
  scopeItems: "施工项目",
  items: "项",
  scope: "施工内容",
  materials: "使用材料",
  similarTitle: "想做类似装修？",
  similarText: "联系我们获取免费咨询和项目报价。",
  quote: "获取免费报价",
  whatsapp: "WhatsApp 联系",
  relatedService: "相关服务",
  moreProjects: "更多案例",
  internalServices: "服务项目",
  internalMaterials: "材料库",
  internalBlog: "装修博客",
  internalFaq: "常见问题",
  internalContact: "联系我们",
  imageLabel: "图片",
};

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = language === "zh" ? zhCopy : copy.en;
  const fallbackProject = projectsData.find((item) => item.slug === slug);
  const { data: publishedProject, isPending: projectPending } = usePublishedProjectBySlug(slug, language);
  const { data: publishedProjects = [] } = usePublishedProjectSummaries(language);
  const project = publishedProject ?? fallbackProject;
  const allProjects = publishedProjects.length ? publishedProjects : projectsData;
  const relatedProjects = allProjects.filter((item) => item.slug !== slug && item.type === project?.type).slice(0, 2);
  const otherProjects = allProjects.filter((item) => item.slug !== slug && item.type !== project?.type).slice(0, 1);
  const related = [...relatedProjects, ...otherProjects].slice(0, 3);

  if (projectPending && !fallbackProject) {
    return (
      <PublicLoadingState
        label="FLASH CAST"
        title={language === "zh" ? "正在准备案例内容" : "Loading project"}
        description={language === "zh" ? "案例图片和文字正在载入，马上就好。" : "Project images and details are loading."}
      />
    );
  }

  if (!projectPending && !project) {
    return (
      <main className="pt-site-header section-padding text-center">
        <PageMeta
          title={t.notFound}
          description={language === "zh" ? "这个装修案例页面暂时不存在，请返回案例列表查看已发布内容。" : "This renovation project page is not available. Please return to the project list."}
          canonicalPath="/projects"
          noIndex
        />
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/projects">{t.viewAll}</Link></Button>
      </main>
    );
  }

  const mainImage = project.images[0] || project.thumbnail;
  const mainImageAlt = translateDisplayText(project.imageAlts?.[0] || project.thumbnailAlt || project.title, language);
  const relatedService = typeToService[project.type];
  const relatedServiceName = relatedService?.[language];
  const projectTypeLabel = translateProjectType(project.type, language);
  const projectTitleLabel = translateDisplayText(project.title, language);
  const projectLocationLabel = translateDisplayText(project.location, language);
  const projectDurationLabel = translateDisplayText(project.duration, language);
  const projectDescription = translateDisplayText(project.description, language);
  const projectClientNeed = translateDisplayText(project.clientNeed, language);
  const projectHighlights = project.highlights.map((highlight: string) => translateDisplayText(highlight, language));
  const projectScope = project.scope.map((scope: string) => translateDisplayText(scope, language));
  const projectMaterialsUsed = project.materialsUsed.map((material: string) => translateDisplayText(material, language));
  const projectTestimonial = project.testimonial ? translateDisplayText(project.testimonial, language) : "";

  return (
    <main className="pt-site-header">
      <PageMeta
        title={`${projectTitleLabel} | ${projectLocationLabel} | ${t.metaSuffix}`}
        description={t.metaDescription(projectTypeLabel, projectLocationLabel, projectClientNeed)}
        keywords={t.metaKeywords(projectTypeLabel, projectLocationLabel, projectTitleLabel)}
        canonicalPath={`/projects/${project.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbProjects, url: "/projects" }, { name: projectTitleLabel, url: `/projects/${project.slug}` }]} />

      <section className="page-hero page-hero--detail items-end">
        <div className="page-hero__media absolute inset-0">
          <SmartImage src={mainImage} alt={mainImageAlt} className="page-hero__image h-full w-full object-cover" width={1920} height={800} loading="eager" fetchPriority="high" />
          <div
            className="page-hero__overlay absolute inset-0 bg-gradient-to-t from-[rgba(13,12,9,0.88)] via-[rgba(13,12,9,0.45)] to-[rgba(13,12,9,0.15)]"
            aria-hidden="true"
          />
        </div>
        <div className="page-hero__content site-container pb-12 pt-16">
          <Link to="/projects" className="page-hero__back mb-4 inline-flex items-center gap-1 text-sm text-on-media-muted transition-colors hover:text-gold">
            <ArrowLeft className="h-3.5 w-3.5" /> {t.allProjects}
          </Link>
          <span className="page-hero__label mb-2 block text-xs font-medium uppercase tracking-wider text-gold">{projectTypeLabel}</span>
          <h1 className="page-hero__title heading-safe mb-2 text-3xl font-bold text-on-media md:text-4xl">{projectTitleLabel}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-on-media-muted">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {projectLocationLabel}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {projectDurationLabel}</span>
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <Reveal>
                <div className="p-5 bg-muted rounded-card border border-border mb-8">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong className="text-foreground">{t.summaryLabel}</strong> {t.summary(projectTitleLabel, projectTypeLabel, projectLocationLabel, projectDurationLabel, projectScope)}
                  </p>
                </div>
              </Reveal>

              <Reveal>
                <h2 className="font-display text-2xl font-bold mb-4">{t.overview}</h2>
                {isHtmlText(projectDescription) ? (
                  <div className="prose prose-neutral max-w-none text-muted-foreground mb-8" dangerouslySetInnerHTML={{ __html: sanitizeHtml(projectDescription) }} />
                ) : (
                  <p className="text-muted-foreground leading-relaxed mb-8">{projectDescription}</p>
                )}
              </Reveal>

              <Reveal delay={100}>
                <h3 className="font-display text-xl font-bold mb-3">{t.clientRequirements}</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">{projectClientNeed}</p>
              </Reveal>

              <Reveal delay={150}>
                <h3 className="font-display text-xl font-bold mb-3">{t.solution}</h3>
                <ul className="space-y-3 mb-8">
                  {projectHighlights.map((highlight: string) => (
                    <li key={highlight} className="flex items-start gap-3 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={200}>
                <h3 className="font-display text-xl font-bold mb-4">{t.gallery}</h3>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {project.images.map((img: string, index: number) => (
                    <div key={img || index} className="aspect-[4/3] overflow-hidden rounded-card bg-muted img-zoom">
                      <SmartImage src={img} alt={translateDisplayText(project.imageAlts?.[index] || `${project.title} - ${t.imageLabel} ${index + 1}`, language)} loading="lazy" width={800} height={600} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </Reveal>

              {project.testimonial && (
                <Reveal delay={250}>
                  <div className="p-6 bg-muted rounded-card border border-border mb-8">
                    <Star className="w-5 h-5 text-gold mb-3" />
                    <p className="italic text-foreground mb-3 leading-relaxed">"{projectTestimonial}"</p>
                    <p className="text-sm text-muted-foreground font-medium">{t.testimonialBy(projectLocationLabel)}</p>
                  </div>
                </Reveal>
              )}

              <Reveal delay={300}>
                <div className="rounded-card border border-accent/20 bg-accent/5 p-5">
                  <h3 className="font-display text-lg font-bold mb-2">{t.resultTitle}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t.resultIntro(projectTypeLabel, projectLocationLabel, projectDurationLabel, projectScope.length, projectMaterialsUsed.length)}
                    {project.testimonial && ` ${t.satisfied}`}
                    {relatedService && <> {t.similarPrompt} <Link to={`/services/${relatedService.slug}`} className="text-accent hover:underline font-medium">{relatedServiceName}</Link> {t.serviceWord}</>}
                  </p>
                </div>
              </Reveal>
            </div>

            <div className="space-y-6">
              <Reveal direction="right">
                <div className="rounded-card border border-border bg-card p-5">
                  <h3 className="font-semibold mb-4">{t.details}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.type}</span><span className="font-medium text-right">{projectTypeLabel}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.location}</span><span className="font-medium text-right">{projectLocationLabel}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.duration}</span><span className="font-medium text-right">{projectDurationLabel}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.scopeItems}</span><span className="font-medium text-right">{projectScope.length} {t.items}</span></div>
                  </div>
                </div>
              </Reveal>

              <Reveal direction="right" delay={80}>
                <div className="rounded-card border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-accent" />
                    <h3 className="font-semibold">{t.scope}</h3>
                  </div>
                  <ul className="space-y-2">
                    {projectScope.map((scope: string) => (
                      <li key={scope} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />{scope}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal direction="right" delay={160}>
                <div className="rounded-card border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-accent" />
                    <h3 className="font-semibold">{t.materials}</h3>
                  </div>
                  <ul className="space-y-2">
                    {projectMaterialsUsed.map((material: string) => (
                      <li key={material} className="text-sm text-muted-foreground">{material}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal direction="right" delay={240}>
                <div className="subpage-dark-card rounded-card border border-border/80 bg-surface-dark p-5 text-center">
                  <h3 className="mb-2 font-semibold text-surface-dark-foreground">{t.similarTitle}</h3>
                  <p className="mb-4 text-sm text-surface-dark-foreground/75">{t.similarText}</p>
                  <Link to="/quote" className="btn-on-dark-primary mb-2 w-full min-h-11 justify-center px-6 text-sm">
                    {t.quote} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <a
                    href={settings.whatsapp_url()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-on-dark-secondary w-full min-h-11 justify-center px-6 text-sm"
                  >
                    <WhatsAppIcon className="mr-1 h-4 w-4 text-whatsapp" /> {t.whatsapp}
                  </a>
                </div>
              </Reveal>

              {relatedService && (
                <Reveal direction="right" delay={320}>
                  <div className="rounded-card border border-border bg-card p-5">
                    <h3 className="font-semibold text-sm mb-2">{t.relatedService}</h3>
                    <Link to={`/services/${relatedService.slug}`} className="text-accent hover:underline text-sm font-medium flex items-center gap-1">
                      {relatedServiceName} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <Reveal>
            <div className="subpage-local-heading">
              <div className="accent-line mb-4" />
              <h2 className="font-display text-2xl font-bold">{t.moreProjects}</h2>
            </div>
          </Reveal>
          <div className="card-grid grid-cols-1 gap-5 sm:grid-cols-3">
            {related.map((item, index) => (
              <Reveal key={item.id} delay={index * 80} direction="none">
                <Link to={`/projects/${item.slug}`} className="card-equal group luxury-card hover-lift">
                  <div className="aspect-[4/3] overflow-hidden img-zoom">
                    <SmartImage src={item.images[0] || item.thumbnail} alt={item.imageAlts?.[0] || item.thumbnailAlt || item.title} loading="lazy" width={600} height={450} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="card-equal-body p-4">
                    <span className="text-limit-1 text-accent text-xs font-medium uppercase tracking-wider">{translateProjectType(item.type, language)}</span>
                      <h3 className="text-limit-2 font-display text-base font-semibold mt-1">{translateDisplayText(item.title, language)}</h3>
                    <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" /> <span className="min-w-0 truncate">{translateDisplayText(item.location, language)}</span>
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="subpage-link-band py-8">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">{t.internalServices}</Link>{" / "}
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

export default ProjectDetail;
