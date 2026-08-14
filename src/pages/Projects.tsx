import { useState } from "react";
import Link from "@/components/LocalizedLink";
import { ArrowUpRight, MapPin } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import DeferredSmartImage from "@/components/DeferredSmartImage";
import { usePublishedProjectSummaries, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import CTABanner from "@/components/blocks/CTABanner";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { buildQuotePath } from "@/lib/quoteContext";
import type { PublishedProjectSummary } from "@/lib/contentApi";
import { projectsPageText } from "@/i18n/projectsPageText";
import { ForestContentState, ForestFilterNav } from "@/components/forest/ForestPagePrimitives";
import { forestUiText } from "@/i18n/forestUiText";

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
  const { data: projects = [], isLoading, isError, refetch } = usePublishedProjectSummaries(language);
  const { data: pageContent } = usePublishedSitePage(language, "projects");
  const pageCopy = projectsPageText[language];
  const filtered = filter === "All" ? projects : projects.filter((project) => project.type === filter);
  const displayProjectType = (value: string) => translateProjectType(value, language);
  const displayProjectTitle = (value: string) => translateDisplayText(value, language);
  const displayProjectLocation = (value: string) => translateDisplayText(value, language);
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.projects);
  const displayProjectDescription = (project: PublishedProjectSummary) =>
    translateDisplayText(String(project.description || ""), language);

  const renderProjectImage = (project: PublishedProjectSummary, index: number) => {
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

      <section className="forest-chapter forest-listing-chapter">
          <ForestFilterNav
            items={categories.map((category) => ({ value: category, label: categoryLabels[language][category] }))}
            value={filter}
            onChange={(value) => setFilter(value as (typeof categories)[number])}
            ariaLabel={pageCopy.categoryFilterAria}
          />
          {!isLoading && !isError ? (
            <div className="forest-listing-meta"><span>{forestUiText[language].resultCount(filtered.length)}</span></div>
          ) : null}

          {isLoading ? (
            <ForestContentState variant="loading" compact />
          ) : isError ? (
            <ForestContentState variant="error" compact onRetry={() => void refetch()} />
          ) : filtered.length === 0 ? (
            <ForestContentState variant="empty" compact description={pageCopy.empty} />
          ) : (
          <div className="forest-listing-grid forest-project-listing">
            {filtered.map((project, index) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.slug}`}
                  className={`forest-listing-card forest-project-row${index === 0 ? " forest-project-row--wide" : ""}`}
                  style={{ animationDelay: `${getProjectRevealDelay(index)}ms` }}
                >
                  <div className="forest-listing-card__media">
                    {renderProjectImage(project, index)}
                  </div>
                  <div className="forest-listing-card__body">
                    <p className="forest-listing-card__meta">{displayProjectType(project.type)}</p>
                    <h2>{displayProjectTitle(project.title)}</h2>
                    <p><MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />{displayProjectLocation(project.location)}</p>
                    <p>{displayProjectDescription(project)}</p>
                    <span className="forest-listing-card__action">{pageCopy.view}<ArrowUpRight aria-hidden="true" /></span>
                  </div>
                </Link>
            ))}
          </div>
          )}
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
