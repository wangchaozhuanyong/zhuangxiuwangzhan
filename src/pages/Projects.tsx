import { useRef, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import { usePublishedProjectSummaries, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import CTABanner from "@/components/blocks/CTABanner";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { buildQuotePath } from "@/lib/quoteContext";
import { projectsPageText } from "@/i18n/projectsPageText";

const typeImageMap: Record<string, string> = {
  Residential: "/images/projects/residential-renovation.webp",
  Commercial: "/images/projects/commercial-renovation.webp",
  "Built-In": "/images/projects/kitchen-cabinet.webp",
  Warehouse: "/images/services/warehouse-shelving.webp",
  Exterior: "/images/services/exterior-works.webp",
  Office: "/images/projects/commercial-renovation.webp",
};

const categories = ["All", "Residential", "Commercial", "Built-In", "Warehouse", "Exterior", "Office"] as const;
const PROJECT_INITIAL_EAGER_IMAGES = 4;
const PROJECT_IMAGE_ROOT_MARGIN = "1800px";
const PROJECT_CARD_IMAGE_WIDTHS = [360, 560, 720, 900];
const getProjectRevealDelay = (index: number) => (index % 4) * 60;

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



const Projects = () => {
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const { language } = useLanguage();
  const { data: projects = [] } = usePublishedProjectSummaries(language);
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
  const pageCopy = projectsPageText[language];
  const filtered = filter === "All" ? projects : projects.filter((project) => project.type === filter);
  const displayProjectType = (value: string) => translateProjectType(value, language);
  const displayProjectTitle = (value: string) => translateDisplayText(value, language);
  const displayProjectLocation = (value: string) => translateDisplayText(value, language);
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.projects);
  const displayProjectDescription = (project: any) =>
    translateDisplayText(String(project.description || ""), language);

  const renderProjectImage = (project: any, index: number) => {
    const shouldRenderImmediately = index < PROJECT_INITIAL_EAGER_IMAGES;
    const imageProps = {
      src: project.thumbnail || typeImageMap[project.type] || typeImageMap.Residential,
      alt: project.thumbnailAlt || `${project.title} - ${displayProjectType(project.type)} renovation in ${project.location}`,
      width: 800,
      height: 500,
      sizes: "(max-width: 768px) 92vw, 45vw",
      candidateWidths: PROJECT_CARD_IMAGE_WIDTHS,
      quality: 70,
      loading: "eager" as const,
      fetchPriority: index < 2 ? ("high" as const) : ("auto" as const),
      className: "w-full h-full object-cover",
    };

    if (shouldRenderImmediately) {
      return <SmartImage {...imageProps} />;
    }

    return <DeferredSmartImage {...imageProps} rootMargin={PROJECT_IMAGE_ROOT_MARGIN} />;
  };

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
                aria-label={pageCopy.categoryFilterAria}
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
              <Reveal key={project.id} delay={getProjectRevealDelay(index)}>
                <Link
                  to={`/projects/${project.slug}`}
                  className="card-equal group rounded-card border border-border/80 bg-card p-3 shadow-[0_22px_64px_-52px_rgba(21,18,14,0.42)] hover-lift"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-card img-zoom">
                    {renderProjectImage(project, index)}
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

      <CTABanner
        title={pageContent?.cta_title || pageCopy.ctaTitle}
        description={pageContent?.cta_description || pageCopy.ctaText}
        quoteLabel={pageCopy.quote}
        quotePath={buildQuotePath({ source: "projects" })}
        whatsappLabel={pageCopy.whatsapp}
        whatsappSource="Projects CTA"
      />

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
