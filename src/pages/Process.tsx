import { useMemo } from "react";
import { Check } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import { ForestSectionHeading } from "@/components/forest/ForestPagePrimitives";
import { usePublishedProcessSteps, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
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
    <main className="pt-site-header">
      <PageMeta title={pageContent?.seo_title || t.metaTitle} description={pageContent?.seo_description || t.metaDescription} keywords={pageContent?.seo_keywords || t.metaKeywords} canonicalPath="/process" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbProcess, url: "/process" }]} />
      <HeroBanner image={heroImage.desktop} imageMobile={heroImage.mobile} imageAlt={pageContent?.alt || t.imageAlt} label={pageContent?.subtitle || t.label} title={pageContent?.title || t.title} description={pageContent?.description || t.description} variant="compact" />

      <section className="forest-chapter forest-process-story">
        <div className="forest-process-story__heading">
          <ForestSectionHeading eyebrow={pageContent?.subtitle || t.label} title={t.sectionTitle} description={pageContent?.content || t.sectionDescription} />
        </div>
        <div className="forest-process-story__list">
          {steps.map((step) => (
            <article key={step.num} className="forest-process-step">
              <span className="forest-process-step__number">{step.num}</span>
              <div>
                <h2>{step.title}</h2>
                <p>{step.desc}</p>
                {step.details.length ? <ul>{step.details.map((detail) => <li key={detail}><Check aria-hidden="true" />{detail}</li>)}</ul> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Process;
