import { useEffect, useMemo, useState } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import {
  SchemeAContentState,
  SchemeAFilter,
  SchemeAListingGrid,
  SchemeALoadMore,
  SchemeARouteHero,
  SchemeASection,
  type SchemeAListingItem,
} from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedProjectSummaries, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { projectsPageText } from "@/i18n/projectsPageText";
import { mediaLabels } from "@/i18n/mediaLabels";
import { schemeAProjectsIndexText, schemeARouteText } from "@/i18n/schemeAText";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { isRenderingConceptProject } from "@/lib/projectContentClassification";

const categories = ["All", "Residential", "Commercial", "Built-In", "Warehouse", "Exterior", "Office"] as const;
const PAGE_SIZE = 10;

const categoryLabels = {
  en: { All: "All", Residential: "Residential", Commercial: "Commercial", "Built-In": "Built-In", Warehouse: "Warehouse", Exterior: "Exterior", Office: "Office" },
  zh: { All: "全部", Residential: "住宅装修", Commercial: "商业装修", "Built-In": "定制家具", Warehouse: "仓储工程", Exterior: "外墙工程", Office: "办公室" },
} as const;

const fallbackImages: Record<string, string> = {
  Residential: "/images/projects/residential-renovation.webp",
  Commercial: "/images/projects/commercial-renovation.webp",
  "Built-In": "/images/projects/kitchen-cabinet.webp",
  Warehouse: "/images/services/warehouse-shelving.webp",
  Exterior: "/images/services/exterior-works.webp",
  Office: "/images/projects/commercial-renovation.webp",
};

export default function Projects() {
  const { language } = useLanguage();
  const copy = projectsPageText[language];
  const indexCopy = schemeAProjectsIndexText[language];
  const routeText = schemeARouteText[language];
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: projects = [], isLoading, isError, refetch } = usePublishedProjectSummaries(language);
  const { data: pageContent } = usePublishedSitePage(language, "projects");
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.projects);
  const filtered = filter === "All" ? projects : projects.filter((project) => project.type === filter);
  const visible = filtered.slice(0, visibleCount);

  useEffect(() => setVisibleCount(PAGE_SIZE), [filter]);

  const items = useMemo<SchemeAListingItem[]>(() => visible.map((project) => {
    const title = translateDisplayText(project.title, language);
    const type = translateProjectType(project.type, language);
    return {
      id: String(project.id),
      title,
      meta: [type, isRenderingConceptProject(project) ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · "),
      description: translateDisplayText(String(project.description || ""), language),
      image: project.thumbnail || fallbackImages[project.type] || fallbackImages.Residential,
      imageAlt: copy.projectImageAlt(title, type),
      href: `/projects/${project.slug}`,
    };
  }), [copy, language, visible]);

  return (
    <main className="fc-route-page fc-route-projects-page">
      <PageMeta title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords || copy.metaKeywords} canonicalPath="/projects" />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbProjects, url: "/projects" }]} />
      <SchemeARouteHero
        kind="listing"
        image={heroImage.desktop}
        imageSourceWidth={heroImage.desktopWidth}
        tabletImage={heroImage.tablet}
        tabletImageSourceWidth={heroImage.tabletWidth}
        mobileImage={heroImage.mobile}
        mobileImageSourceWidth={heroImage.mobileWidth}
        imagePosition={heroImage.imagePosition}
        imageAlt={pageContent?.alt || copy.heroAlt}
        label={[pageContent?.subtitle || copy.eyebrow, heroImage.claimLevel ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")}
        title={pageContent?.title || copy.title}
        description={pageContent?.description || copy.intro}
      />
      <SchemeASection title={indexCopy.title} description={indexCopy.description}>
        <SchemeAFilter
          items={categories.map((category) => ({ value: category, label: categoryLabels[language][category] }))}
          value={filter}
          onChange={(value) => setFilter(value as (typeof categories)[number])}
          ariaLabel={copy.categoryFilterAria}
        />
        <p className="fc-route-filter-summary" role="status" aria-live="polite" aria-atomic="true">
          {!isLoading && !isError ? copy.showing(visible.length, filtered.length) : ""}
        </p>
        {isLoading ? <SchemeAContentState>{routeText.projectsLoading}</SchemeAContentState> : null}
        {isError ? <SchemeAContentState action={<button type="button" onClick={() => void refetch()}>{routeText.reload}</button>}>{routeText.projectsError}</SchemeAContentState> : null}
        {!isLoading && !isError && !items.length ? <SchemeAContentState>{copy.empty}</SchemeAContentState> : null}
        {!isLoading && !isError && items.length ? <SchemeAListingGrid items={items} actionLabel={copy.view} /> : null}
        {!isLoading && !isError && visible.length < filtered.length ? (
          <SchemeALoadMore label={copy.loadMore} detail={copy.showing(visible.length, filtered.length)} onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length))} />
        ) : null}
      </SchemeASection>
    </main>
  );
}
