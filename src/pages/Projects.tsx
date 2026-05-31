import { useRef, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import SmartImage from "@/components/SmartImage";
import { usePublishedProjects, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import residentialImg from "@/assets/residential-renovation.webp";
import commercialImg from "@/assets/commercial-renovation.webp";
import kitchenImg from "@/assets/kitchen-cabinet.webp";
import warehouseImg from "@/assets/warehouse-shelving.webp";
import exteriorImg from "@/assets/exterior-works.webp";
import HeroBanner from "@/components/blocks/HeroBanner";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

const typeImageMap: Record<string, string> = {
  Residential: residentialImg,
  Commercial: commercialImg,
  "Built-In": kitchenImg,
  Warehouse: warehouseImg,
  Exterior: exteriorImg,
  Office: commercialImg,
};

const categories = ["All", "Residential", "Commercial", "Built-In", "Warehouse", "Exterior", "Office"] as const;

const categoryLabels = {
  en: {
    All: "All",
    Residential: "Residential",
    Commercial: "Commercial",
    "Built-In": "Built-In",
    Warehouse: "Warehouse",
    Exterior: "Exterior",
    Office: "Office",
  },
  zh: {
    All: "全部",
    Residential: "住宅装修",
    Commercial: "商业装修",
    "Built-In": "定制家具",
    Warehouse: "仓储工程",
    Exterior: "外墙工程",
    Office: "办公室",
  },
};

const copy = {
  en: {
    metaTitle: "Renovation Projects Kuala Lumpur & Selangor | FLASH CAST Portfolio",
    metaDescription: "Explore renovation project references by FLASH CAST across Kuala Lumpur and Selangor - residential condos, commercial offices, custom kitchens, warehouses, and shopfront works.",
    metaKeywords: "renovation projects KL, condo renovation Kuala Lumpur, office fit-out Selangor, kitchen renovation Malaysia",
    breadcrumbHome: "Home",
    breadcrumbProjects: "Projects",
    heroAlt: "FLASH CAST renovation projects portfolio",
    eyebrow: "Portfolio",
    title: "Our Projects",
    intro: "Renovation project references across Kuala Lumpur and Selangor - from residential homes to commercial spaces and warehouses.",
    empty: "No projects found in this category.",
    ctaTitle: "Have a Similar Project?",
    ctaText: "Share your requirements and we'll provide a tailored proposal with accurate pricing.",
    quote: "Get a Free Quote",
    whatsapp: "WhatsApp Us",
    links: {
      services: "Services",
      materials: "Materials",
      blog: "Blog",
      faq: "FAQ",
      contact: "Contact",
    },
  },
  zh: {
    metaTitle: "吉隆坡与雪兰莪装修案例 | FLASH CAST 项目作品",
    metaDescription: "浏览 FLASH CAST 在吉隆坡和雪兰莪发布的装修项目参考，包括公寓、住宅、办公室、厨房、仓储和店铺装修。",
    metaKeywords: "吉隆坡装修案例, 雪兰莪装修项目, 马来西亚室内装修, 店铺装修 KL",
    breadcrumbHome: "首页",
    breadcrumbProjects: "装修案例",
    heroAlt: "FLASH CAST 装修案例作品",
    eyebrow: "案例作品",
    title: "装修案例",
    intro: "查看我们在吉隆坡和雪兰莪发布的住宅、商业空间、定制家具和仓储装修项目参考。",
    empty: "这个分类暂时没有项目案例。",
    ctaTitle: "也想做类似项目？",
    ctaText: "告诉我们您的装修需求，我们会根据空间、预算和工期提供合适方案。",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 联系",
    links: {
      services: "服务项目",
      materials: "材料库",
      blog: "装修博客",
      faq: "常见问题",
      contact: "联系我们",
    },
  },
};

const Projects = () => {
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const { data: projects = [] } = usePublishedProjects(language);
  const { data: pageContent } = usePublishedSitePage(language, "projects");
  const categoryBarRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRefs = useRef<Record<(typeof categories)[number], HTMLButtonElement | null>>({
    All: null,
    Residential: null,
    Commercial: null,
    "Built-In": null,
    Warehouse: null,
    Exterior: null,
    Office: null,
  });
  const pageCopy = copy[language];
  const filtered = filter === "All" ? projects : projects.filter((project) => project.type === filter);
  const displayProjectType = (value: string) => translateProjectType(value, language);
  const displayProjectTitle = (value: string) => translateDisplayText(value, language);
  const displayProjectLocation = (value: string) => translateDisplayText(value, language);
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.projects);
  const displayProjectDescription = (project: any) =>
    translateDisplayText(String(project.description || ""), language);

  const scrollCategoryIntoView = (category: (typeof categories)[number]) => {
    const bar = categoryBarRef.current;
    const target = categoryButtonRefs.current[category];
    if (!bar || !target) return;

    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";

    const barRect = bar.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const currentLeft = bar.scrollLeft;
    const offsetWithinBar = targetRect.left - barRect.left;
    const nextLeft = currentLeft + offsetWithinBar - (barRect.width - targetRect.width) / 2;

    bar.scrollTo({ left: Math.max(0, nextLeft), behavior });
  };

  return (
    <main className="pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || pageCopy.metaTitle}
        description={pageContent?.seo_description || pageCopy.metaDescription}
        keywords={pageContent?.seo_keywords || pageCopy.metaKeywords}
        canonicalPath="/projects"
      />
      <JsonLdBreadcrumb items={[{ name: pageCopy.breadcrumbHome, url: "/" }, { name: pageCopy.breadcrumbProjects, url: "/projects" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || pageCopy.heroAlt}
        label={pageContent?.subtitle || pageCopy.eyebrow}
        title={pageContent?.title || pageCopy.title}
        description={pageContent?.description || pageCopy.intro}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <div>
              <div
                ref={categoryBarRef}
                className="subpage-filter-bar md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:[mask-image:none] md:[-webkit-mask-image:none]"
                role="tablist"
                aria-label={language === "zh" ? "项目分类筛选" : "Project category filter"}
              >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setFilter(category);
                    requestAnimationFrame(() => scrollCategoryIntoView(category));
                  }}
                  ref={(node) => {
                    categoryButtonRefs.current[category] = node;
                  }}
                  role="tab"
                  aria-selected={filter === category}
                  data-active={filter === category}
                  className="subpage-filter-button btn-press"
                >
                  {categoryLabels[language][category]}
                </button>
              ))}
              </div>
            </div>
          </Reveal>

          <div className="card-grid grid-cols-1 gap-6 md:grid-cols-2">
            {filtered.map((project, index) => (
              <Reveal key={project.id} delay={index * 80}>
                <Link
                  to={`/projects/${project.slug}`}
                  className="card-equal group rounded-card border border-border/80 bg-card p-3 shadow-[0_22px_64px_-52px_rgba(21,18,14,0.42)] hover-lift"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-card img-zoom">
                    <SmartImage
                      src={project.thumbnail || typeImageMap[project.type] || residentialImg}
                      alt={project.thumbnailAlt || `${project.title} - ${displayProjectType(project.type)} renovation in ${project.location}`}
                      width={800}
                      height={500}
                      sizes="(max-width: 768px) 92vw, 45vw"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-accent/90 text-accent-foreground text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">{displayProjectType(project.type)}</span>
                    </div>
                  </div>
                  <div className="card-equal-body px-1 pb-2 pt-4">
                  <h3 className="text-limit-2 font-display text-lg font-semibold mb-1 group-hover:text-accent transition-colors">{displayProjectTitle(project.title)}</h3>
                    <span className="mb-2 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0" /> <span className="min-w-0 truncate">{displayProjectLocation(project.location)}</span>
                  </span>
                  <p className="text-limit-2 text-muted-foreground text-sm">{displayProjectDescription(project)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">{pageCopy.empty}</p>
          )}
        </div>
      </section>

      <section className="section-padding relative overflow-hidden bg-surface-dark text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,164,106,0.1),transparent_50%)]" aria-hidden />
        <Reveal>
          <div className="container-narrow relative">
            <h2 className="heading-safe mb-4 font-display text-3xl font-bold text-surface-dark-foreground">{pageContent?.cta_title || pageCopy.ctaTitle}</h2>
            <p className="mx-auto mb-6 max-w-lg text-surface-dark-foreground/75">{pageContent?.cta_description || pageCopy.ctaText}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link to="/quote" className="btn-on-dark-primary min-h-12 w-full justify-center px-8 sm:w-auto">
                {pageCopy.quote} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={settings.whatsapp_url()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-on-dark-secondary min-h-12 w-full justify-center px-8 sm:w-auto"
              >
                <WhatsAppIcon className="mr-2 h-[18px] w-[18px] text-whatsapp" /> {pageCopy.whatsapp}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="subpage-link-band py-8">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">{pageCopy.links.services}</Link>{" / "}
            <Link to="/materials" className="text-accent hover:underline">{pageCopy.links.materials}</Link>{" / "}
            <Link to="/blog" className="text-accent hover:underline">{pageCopy.links.blog}</Link>{" / "}
            <Link to="/faq" className="text-accent hover:underline">{pageCopy.links.faq}</Link>{" / "}
            <Link to="/contact" className="text-accent hover:underline">{pageCopy.links.contact}</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Projects;
