import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdFAQ, JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedFaqs, usePublishedSitePage } from "@/hooks/usePublishedContent";
import HeroBanner from "@/components/blocks/HeroBanner";
import CTABanner from "@/components/blocks/CTABanner";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { faqPageText } from "@/i18n/faqPageText";



const FAQ = () => {
  const { language } = useLanguage();
  const t = faqPageText[language];
  const { data: pageContent } = usePublishedSitePage(language, "faq");
  const { data: generalFaqs } = usePublishedFaqs(language, "general");
  const { data: homeFaqs } = usePublishedFaqs(language, "home");
  const categories = useMemo(() => {
    const publishedFaqs = [...(generalFaqs || []), ...(homeFaqs || [])].filter(
      (item, index, list) => list.findIndex((faq) => faq.question === item.question) === index,
    );
    if (!publishedFaqs?.length) return t.categories;
    return [
      {
        category: language === "zh" ? "常见问题" : "General",
        items: publishedFaqs.map((item) => ({ q: item.question, a: item.answer })),
      },
    ];
  }, [generalFaqs, homeFaqs, t.categories, language]);
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.faq);

  return (
    <main className="pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/faq"
      />
      <JsonLdFAQ faqs={categories.flatMap((cat) => cat.items.map((item) => ({ question: item.q, answer: item.a })))} />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbFaq, url: "/faq" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.heroAlt}
        label={pageContent?.subtitle || t.eyebrow}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.intro}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          {categories.map((category, categoryIndex) => (
            <Reveal key={category.category} delay={categoryIndex * 100}>
              <div className="mb-10">
                <div className="subpage-local-heading">
                  <div className="accent-line mb-3" />
                  <h2 className="font-display text-xl font-bold">{category.category}</h2>
                </div>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.items.map((item, index) => (
                    <AccordionItem key={`${category.category}-${index}`} value={`${category.category}-${index}`} className="rounded-card border border-border bg-card px-4 data-[state=open]:border-accent/25">
                      <AccordionTrigger className="text-left text-sm font-medium">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <CTABanner
        title={pageContent?.cta_title || t.ctaTitle}
        description={pageContent?.cta_description || t.ctaText}
        quoteLabel={t.contact}
        quotePath="/contact"
        whatsappLabel={t.whatsapp}
        whatsappSource="FAQ CTA"
      />
    </main>
  );
};

export default FAQ;
