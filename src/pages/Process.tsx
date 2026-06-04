import { useMemo } from "react";
import { CheckCircle } from "lucide-react";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedProcessSteps, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { processPageText } from "@/i18n/processPageText";



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
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/process"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbProcess, url: "/process" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.imageAlt}
        label={pageContent?.subtitle || t.label}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.description}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title={t.sectionTitle} description={pageContent?.content || t.sectionDescription} />

          <div className="mx-auto max-w-3xl space-y-6">
            {steps.map((step, index) => (
              <Reveal key={step.num} delay={index * 80}>
                <div className="luxury-card hover-lift relative flex gap-5 p-6 md:gap-7 md:p-8">
                  <div className="shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-accent-foreground">
                      {step.num}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 font-display text-lg font-semibold">{step.title}</h3>
                    <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                    <ul className="space-y-1.5">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Process;
