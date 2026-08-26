import { useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeANumberList, SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import { usePublishedProcessSteps, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { mediaLabels } from "@/i18n/mediaLabels";
import { processPageText } from "@/i18n/processPageText";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

const Process = () => {
  const { language } = useLanguage();
  const t = processPageText[language];
  const { data: publishedSteps } = usePublishedProcessSteps(language);
  const { data: pageContent } = usePublishedSitePage(language, "process");
  const steps = useMemo(() => {
    if (!publishedSteps?.length) return t.steps;
    return publishedSteps.map((row, index) => ({
      num: String(row.step_number || index + 1).padStart(2, "0"),
      title: row.title,
      desc: row.description,
      details: t.steps[index]?.details?.length ? t.steps[index].details : row.description ? [row.description] : [],
    }));
  }, [publishedSteps, t.steps]);
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.process);

  return (
    <main className="fc-route-page">
      <PageMeta title={pageContent?.seo_title || t.metaTitle} description={pageContent?.seo_description || t.metaDescription} keywords={pageContent?.seo_keywords || t.metaKeywords} canonicalPath="/process" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbProcess, url: "/process" }]} />
      <SchemeARouteHero kind="content" image={heroImage.desktop} imageSourceWidth={heroImage.desktopWidth} tabletImage={heroImage.tablet} tabletImageSourceWidth={heroImage.tabletWidth} mobileImage={heroImage.mobile} mobileImageSourceWidth={heroImage.mobileWidth} imagePosition={heroImage.imagePosition} imageAlt={pageContent?.alt || t.imageAlt} label={[pageContent?.subtitle || t.label, heroImage.claimLevel ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")} title={pageContent?.title || t.title} description={pageContent?.description || t.description} />

      <SchemeASection title={t.sectionTitle} description={pageContent?.content || t.sectionDescription}>
        <SchemeANumberList items={steps.map((step) => ({ title: step.title, description: [step.desc, ...step.details].filter(Boolean).join(" · ") }))} />
      </SchemeASection>
    </main>
  );
};

export default Process;
