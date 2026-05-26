import { useEffect, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getPublishedProjects } from "@/lib/contentApi";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { whatsappUrl } from "@/config/site";
import residentialImg from "@/assets/residential-renovation.jpg";
import commercialImg from "@/assets/commercial-renovation.jpg";
import kitchenImg from "@/assets/kitchen-cabinet.jpg";
import warehouseImg from "@/assets/warehouse-shelving.jpg";
import exteriorImg from "@/assets/exterior-works.jpg";
import heroImg from "@/assets/hero-projects.jpg";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";

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
    metaDescription: "Explore completed renovation projects by FLASH CAST across Kuala Lumpur and Selangor - residential condos, commercial offices, custom kitchens, warehouses, and shopfront renovations.",
    breadcrumbHome: "Home",
    breadcrumbProjects: "Projects",
    eyebrow: "Portfolio",
    title: "Our Projects",
    intro: "Completed renovation projects across Kuala Lumpur and Selangor - from residential homes to commercial spaces and warehouses.",
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
    metaDescription: "浏览 FLASH CAST 在吉隆坡和雪兰莪完成的装修案例，包括公寓、住宅、办公室、厨房、仓储和店铺装修。",
    breadcrumbHome: "首页",
    breadcrumbProjects: "装修案例",
    eyebrow: "案例作品",
    title: "装修案例",
    intro: "查看我们在吉隆坡和雪兰莪完成的住宅、商业空间、定制家具和仓储装修项目。",
    empty: "这个分类暂时没有项目案例。",
    ctaTitle: "也想做类似项目？",
    ctaText: "告诉我们您的装修需求，我们会根据空间、预算和工期提供合适方案。",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 咨询",
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
  const [projects, setProjects] = useState<any[]>([]);
  const pageCopy = copy[language];
  const filtered = filter === "All" ? projects : projects.filter((project) => project.type === filter);
  const displayProjectType = (value: string) => translateProjectType(value, language);
  const displayProjectTitle = (value: string) => translateDisplayText(value, language);
  const displayProjectLocation = (value: string) => translateDisplayText(value, language);
  const displayProjectDescription = (project: any) =>
    language === "zh" ? String(project.description || "").replace(new RegExp(String(project.type || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), displayProjectType(project.type)) : project.description;

  useEffect(() => {
    void getPublishedProjects(language).then(setProjects);
  }, [language]);

  return (
    <main className="pt-16">
      <PageMeta
        title={pageCopy.metaTitle}
        description={pageCopy.metaDescription}
        keywords="renovation projects KL, condo renovation Kuala Lumpur, office fit-out Selangor, kitchen renovation Malaysia"
        canonicalPath="/projects"
      />
      <JsonLdBreadcrumb items={[{ name: pageCopy.breadcrumbHome, url: "/" }, { name: pageCopy.breadcrumbProjects, url: "/projects" }]} />

      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="FLASH CAST renovation projects portfolio" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>{pageCopy.eyebrow}</p>
          <h1
            className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg"
            style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            {pageCopy.title}
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            {pageCopy.intro}
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 btn-press ${
                    filter === category
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent/10"
                  }`}
                >
                  {categoryLabels[language][category]}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((project, index) => (
              <Reveal key={project.id} delay={index * 80}>
                <Link to={`/projects/${project.slug}`} className="group hover-lift block">
                  <div className="relative overflow-hidden rounded-lg aspect-[4/3] mb-4 img-zoom">
                    <img
                      src={project.thumbnail || typeImageMap[project.type] || residentialImg}
                      alt={project.thumbnailAlt || `${project.title} - ${displayProjectType(project.type)} renovation in ${project.location}`}
                      loading="lazy"
                      width={800}
                      height={500}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-accent/90 text-accent-foreground text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">{displayProjectType(project.type)}</span>
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-accent transition-colors">{displayProjectTitle(project.title)}</h3>
                    <span className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="w-3 h-3" /> {displayProjectLocation(project.location)}
                  </span>
                  <p className="text-muted-foreground text-sm line-clamp-2">{displayProjectDescription(project)}</p>
                </Link>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">{pageCopy.empty}</p>
          )}
        </div>
      </section>

      <section className="section-padding bg-accent text-accent-foreground text-center">
        <Reveal>
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold mb-4">{pageCopy.ctaTitle}</h2>
            <p className="text-accent-foreground/80 mb-6 max-w-lg mx-auto">{pageCopy.ctaText}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="secondary" size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">{pageCopy.quote} <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {pageCopy.whatsapp}
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="py-8 bg-background border-t border-border">
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
