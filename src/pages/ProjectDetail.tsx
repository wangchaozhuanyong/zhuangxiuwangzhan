import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAFacts, SchemeAGallery, SchemeAListingGrid, SchemeANumberList, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { projectsData } from "@/data/projects";
import { usePublishedProjectBySlug, usePublishedProjectSummaries } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";
import { projectDetailPageText } from "@/i18n/projectDetailPageText";
import { mediaLabels } from "@/i18n/mediaLabels";
import { stripHtml } from "@/lib/text";

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const copy = projectDetailPageText[language];
  const fallback = projectsData.find((item) => item.slug === slug);
  const { data: publishedProject, isPending } = usePublishedProjectBySlug(slug, language);
  const { data: publishedProjects = [] } = usePublishedProjectSummaries(language);
  const project = publishedProject || fallback;
  const allProjects = publishedProjects.length ? publishedProjects : projectsData;

  const relatedItems = useMemo<SchemeAListingItem[]>(() => allProjects.filter((item) => item.slug !== slug).slice(0, 3).map((item) => ({
    id: String(item.id),
    title: translateDisplayText(item.title, language),
    description: translateDisplayText(String(item.description || ""), language),
    meta: translateProjectType(item.type, language),
    image: item.images?.[0] || item.thumbnail,
    imageAlt: translateDisplayText(item.title, language),
    href: `/projects/${item.slug}`,
  })), [allProjects, language, slug]);

  if (isPending && !project) return <main className="fc-route-page"><SchemeAContentState>{copy.loadingDescription}</SchemeAContentState></main>;
  if (!project) return <main className="fc-route-page fc-route-not-found"><PageMeta title={copy.notFound} description={copy.notFoundDescription} canonicalPath="/projects" noIndex /><SchemeAContentState action={<Link to="/projects">{copy.viewAll}</Link>}>{copy.notFound}</SchemeAContentState></main>;

  const title = translateDisplayText(project.title, language);
  const type = translateProjectType(project.type, language);
  const description = stripHtml(translateDisplayText(project.description || "", language));
  const clientNeed = stripHtml(translateDisplayText(project.clientNeed || "", language));
  const scope = project.scope.map((item: string) => translateDisplayText(item, language));
  const highlights = project.highlights.map((item: string) => translateDisplayText(item, language));
  const materials = project.materialsUsed.map((item: string) => translateDisplayText(item, language));
  const images = (project.images.length ? project.images : [project.thumbnail]).filter(Boolean);
  const usesRenderingConcept = images.some((src) => src.includes("/generated-portfolio/"));

  return (
    <main className="fc-route-page">
      <PageMeta title={`${title} | ${copy.metaSuffix}`} description={copy.metaDescription(type)} keywords={copy.metaKeywords(type, title)} canonicalPath={`/projects/${project.slug}`} />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbProjects, url: "/projects" }, { name: title, url: `/projects/${project.slug}` }]} />
      <SchemeARouteHero kind="detail" image={images[0]} imageAlt={`${title} - ${copy.imageLabel} 1`} label={[type, usesRenderingConcept ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")} title={title} description={description} />
      <SchemeAFacts items={[
        { label: copy.type, value: type },
        { label: copy.duration, value: translateDisplayText(project.duration, language) },
        { label: copy.scopeItems, value: `${scope.length} ${copy.items}` },
        { label: copy.materials, value: String(materials.length) },
      ]} />
      <SchemeASection title={copy.overview} description={description}>
        <SchemeANumberList items={[
          { title: copy.clientRequirements, description: clientNeed },
          ...highlights.map((item) => ({ title: item })),
          ...scope.map((item) => ({ title: item })),
        ]} />
      </SchemeASection>
      <SchemeASection title={copy.gallery} description={copy.galleryDescription}>
        <SchemeAGallery images={images.map((src, index) => ({ src, alt: `${title} - ${copy.imageLabel} ${index + 1}` }))} />
      </SchemeASection>
      <SchemeASection title={copy.moreProjects}>
        <SchemeAListingGrid items={relatedItems} actionLabel={copy.viewAll} />
      </SchemeASection>
    </main>
  );
}
