import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MapPin, Clock, CheckCircle, Star, Wrench, Layers } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getPublishedProjectBySlug, getPublishedProjects } from "@/lib/contentApi";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { whatsappUrl } from "@/config/site";
import { isHtmlText, stripHtml } from "@/lib/text";

const typeToService: Record<string, { en: string; zh: string; slug: string }> = {
  Residential: { en: "Interior Renovation", zh: "室内装修", slug: "renovation" },
  Commercial: { en: "Commercial Works", zh: "商业空间装修", slug: "commercial" },
  "Built-In": { en: "Custom Built-In Solutions", zh: "定制内嵌家具", slug: "builtin" },
  Warehouse: { en: "Warehouse & Shelving", zh: "仓库与货架工程", slug: "warehouse" },
  Exterior: { en: "Exterior Works", zh: "外墙与门面工程", slug: "exterior" },
  Office: { en: "Commercial Works", zh: "商业空间装修", slug: "commercial" },
};

const copy = {
  en: {
    notFound: "Project Not Found",
    viewAll: "View All Projects",
    breadcrumbHome: "Home",
    breadcrumbProjects: "Projects",
    metaSuffix: "FLASH CAST Renovation",
    metaDescription: (type: string, location: string, need: string) => `${type} renovation project in ${location} by FLASH CAST: ${need}`,
    metaKeywords: (type: string, location: string, title: string) => `${type} renovation ${location}, ${title}, renovation project Malaysia`,
    allProjects: "All Projects",
    summaryLabel: "Project Summary:",
    summary: (title: string, type: string, location: string, duration: string, scope: string[]) =>
      `${title} is a ${type.toLowerCase()} renovation project completed by FLASH CAST SDN. BHD. in ${location}, Malaysia. The project was completed in ${duration} and included ${scope.slice(0, 3).join(", ")}, and more.`,
    overview: "Project Overview",
    clientRequirements: "Client's Requirements",
    solution: "Our Solution & Highlights",
    gallery: "Project Gallery",
    testimonialBy: (location: string) => `Client, ${location}`,
    resultTitle: "Project Result",
    resultIntro: (type: string, location: string, duration: string, scopeCount: number, materialCount: number) =>
      `This ${type.toLowerCase()} project in ${location} was completed in ${duration} by FLASH CAST's in-house team. The scope covered ${scopeCount} work items using ${materialCount} selected materials.`,
    satisfied: "The client was satisfied with the quality and professionalism of the delivery.",
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
    metaDescription: (type: string, location: string, need: string) => `FLASH CAST 在 ${location} 完成的 ${type} 装修案例：${need}`,
    metaKeywords: (type: string, location: string, title: string) => `${location} ${type} 装修案例, ${title}, 马来西亚装修公司`,
    allProjects: "全部案例",
    summaryLabel: "项目摘要：",
    summary: (title: string, type: string, location: string, duration: string, scope: string[]) =>
      `${title} 是 FLASH CAST SDN. BHD. 在 ${location} 完成的 ${type} 项目，工期为 ${duration}，施工内容包括 ${scope.slice(0, 3).join("、")} 等。`,
    overview: "项目概览",
    clientRequirements: "客户需求",
    solution: "解决方案与项目亮点",
    gallery: "项目图片",
    testimonialBy: (location: string) => `${location} 客户`,
    resultTitle: "项目成果",
    resultIntro: (type: string, location: string, duration: string, scopeCount: number, materialCount: number) =>
      `这个位于 ${location} 的 ${type} 项目由 FLASH CAST 自有团队完成，工期 ${duration}，共涵盖 ${scopeCount} 项施工内容，并使用 ${materialCount} 类精选材料。`,
    satisfied: "客户对交付质量和施工专业度表示满意。",
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
    whatsapp: "WhatsApp 咨询",
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
  metaDescription: (type: string, location: string, need: string) => `FLASH CAST 在 ${location} 完成的 ${type} 装修案例：${stripHtml(need)}`,
  metaKeywords: (type: string, location: string, title: string) => `${location} ${type} 装修案例, ${title}, 马来西亚装修公司`,
  allProjects: "全部案例",
  summaryLabel: "项目摘要：",
  summary: (title: string, type: string, location: string, duration: string, scope: string[]) =>
    `${title} 是 FLASH CAST SDN. BHD. 在 ${location} 完成的 ${type} 项目，工期为 ${duration}，施工内容包括 ${scope.slice(0, 3).join("、")} 等。`,
  overview: "项目概览",
  clientRequirements: "客户需求",
  solution: "解决方案与项目亮点",
  gallery: "项目图片",
  testimonialBy: (location: string) => `${location} 客户`,
  resultTitle: "项目成果",
  resultIntro: (type: string, location: string, duration: string, scopeCount: number, materialCount: number) =>
    `这个位于 ${location} 的 ${type} 项目由 FLASH CAST 自有团队完成，工期 ${duration}，共涵盖 ${scopeCount} 项施工内容，并使用 ${materialCount} 类精选材料。`,
  satisfied: "客户对交付质量和施工专业度表示满意。",
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
  whatsapp: "WhatsApp 咨询",
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
  const t = language === "zh" ? zhCopy : copy.en;
  const [project, setProject] = useState<any | null | undefined>(undefined);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const relatedProjects = allProjects.filter((item) => item.slug !== slug && item.type === project?.type).slice(0, 2);
  const otherProjects = allProjects.filter((item) => item.slug !== slug && item.type !== project?.type).slice(0, 1);
  const related = [...relatedProjects, ...otherProjects].slice(0, 3);

  useEffect(() => {
    if (!slug) return;
    void getPublishedProjectBySlug(slug, language).then(setProject);
    void getPublishedProjects(language).then(setAllProjects);
  }, [slug, language]);

  if (project === undefined) {
    return (
      <main className="pt-16 section-padding text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/projects">{t.viewAll}</Link></Button>
      </main>
    );
  }

  const mainImage = project.images[0] || project.thumbnail;
  const mainImageAlt = project.imageAlts?.[0] || project.thumbnailAlt || project.title;
  const relatedService = typeToService[project.type];
  const relatedServiceName = relatedService?.[language];

  return (
    <main className="pt-16">
      <PageMeta
        title={`${project.title} | ${project.location} | ${t.metaSuffix}`}
        description={t.metaDescription(project.type, project.location, project.clientNeed)}
        keywords={t.metaKeywords(project.type, project.location, project.title)}
        canonicalPath={`/projects/${project.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbProjects, url: "/projects" }, { name: project.title, url: `/projects/${project.slug}` }]} />

      <section className="relative min-h-[50vh] flex items-end">
        <div className="absolute inset-0">
          <img src={mainImage} alt={mainImageAlt} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-4 md:px-8 py-12">
          <Link to="/projects" className="inline-flex items-center gap-1 text-steel-light text-sm hover:text-accent transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.allProjects}
          </Link>
          <span className="text-accent text-xs font-medium uppercase tracking-wider block mb-2">{project.type}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2">{project.title}</h1>
          <div className="flex items-center gap-4 text-steel-light text-sm">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {project.location}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {project.duration}</span>
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <Reveal>
                <div className="p-5 bg-muted rounded-lg border border-border mb-8">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong className="text-foreground">{t.summaryLabel}</strong> {t.summary(project.title, project.type, project.location, project.duration, project.scope)}
                  </p>
                </div>
              </Reveal>

              <Reveal>
                <h2 className="font-display text-2xl font-bold mb-4">{t.overview}</h2>
                {isHtmlText(project.description) ? (
                  <div className="prose prose-neutral max-w-none text-muted-foreground mb-8" dangerouslySetInnerHTML={{ __html: project.description }} />
                ) : (
                  <p className="text-muted-foreground leading-relaxed mb-8">{project.description}</p>
                )}
              </Reveal>

              <Reveal delay={100}>
                <h3 className="font-display text-xl font-bold mb-3">{t.clientRequirements}</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">{project.clientNeed}</p>
              </Reveal>

              <Reveal delay={150}>
                <h3 className="font-display text-xl font-bold mb-3">{t.solution}</h3>
                <ul className="space-y-3 mb-8">
                  {project.highlights.map((highlight: string) => (
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
                    <div key={img || index} className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                      <img src={img} alt={project.imageAlts?.[index] || `${project.title} - ${t.imageLabel} ${index + 1}`} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </Reveal>

              {project.testimonial && (
                <Reveal delay={250}>
                  <div className="p-6 bg-muted rounded-lg border border-border mb-8">
                    <Star className="w-5 h-5 text-gold mb-3" />
                    <p className="italic text-foreground mb-3 leading-relaxed">"{project.testimonial}"</p>
                    <p className="text-sm text-muted-foreground font-medium">{t.testimonialBy(project.location)}</p>
                  </div>
                </Reveal>
              )}

              <Reveal delay={300}>
                <div className="p-5 bg-accent/5 rounded-lg border border-accent/20">
                  <h3 className="font-display text-lg font-bold mb-2">{t.resultTitle}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t.resultIntro(project.type, project.location, project.duration, project.scope.length, project.materialsUsed.length)}
                    {project.testimonial && ` ${t.satisfied}`}
                    {relatedService && <> {t.similarPrompt} <Link to={`/services/${relatedService.slug}`} className="text-accent hover:underline font-medium">{relatedServiceName}</Link> {t.serviceWord}</>}
                  </p>
                </div>
              </Reveal>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-4">{t.details}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.type}</span><span className="font-medium text-right">{project.type}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.location}</span><span className="font-medium text-right">{project.location}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.duration}</span><span className="font-medium text-right">{project.duration}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">{t.scopeItems}</span><span className="font-medium text-right">{project.scope.length} {t.items}</span></div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold">{t.scope}</h3>
                </div>
                <ul className="space-y-2">
                  {project.scope.map((scope: string) => (
                    <li key={scope} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />{scope}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold">{t.materials}</h3>
                </div>
                <ul className="space-y-2">
                  {project.materialsUsed.map((material: string) => (
                    <li key={material} className="text-sm text-muted-foreground">{material}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-accent text-accent-foreground rounded-lg p-5 text-center">
                <h3 className="font-semibold mb-2">{t.similarTitle}</h3>
                <p className="text-sm opacity-90 mb-4">{t.similarText}</p>
                <Button variant="secondary" size="sm" className="w-full mb-2 btn-press min-h-[2.75rem] text-sm font-bold tracking-wide rounded-md px-6 py-2.5 justify-center" asChild>
                  <Link to="/quote">{t.quote} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                </Button>
                <Button size="sm" className="w-full bg-white text-neutral-800 hover:bg-white/90 border-0 btn-press shadow-md min-h-[2.75rem] text-sm font-semibold rounded-md px-6 py-2.5 justify-center" asChild>
                  <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="w-4 h-4 mr-1 text-[#25D366]" /> {t.whatsapp}
                  </a>
                </Button>
              </div>

              {relatedService && (
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="font-semibold text-sm mb-2">{t.relatedService}</h3>
                  <Link to={`/services/${relatedService.slug}`} className="text-accent hover:underline text-sm font-medium flex items-center gap-1">
                    {relatedServiceName} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <h2 className="font-display text-2xl font-bold mb-8">{t.moreProjects}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((item) => (
              <Link key={item.id} to={`/projects/${item.slug}`} className="group rounded-lg overflow-hidden bg-card border border-border hover-lift">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={item.images[0] || item.thumbnail} alt={item.imageAlts?.[0] || item.thumbnailAlt || item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <span className="text-accent text-xs font-medium uppercase tracking-wider">{item.type}</span>
                  <h3 className="font-display text-base font-semibold mt-1">{item.title}</h3>
                  <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {item.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-background border-t border-border">
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
