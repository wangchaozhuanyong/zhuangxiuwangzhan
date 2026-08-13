import { useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdFAQ, JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import CTABanner from "@/components/blocks/CTABanner";
import { ForestFaqList, ForestSectionHeading } from "@/components/forest/ForestPagePrimitives";
import { usePublishedFaqs, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { faqPageText } from "@/i18n/faqPageText";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

const FAQ = () => {
  const { language } = useLanguage();
  const t = faqPageText[language];
  const { data: pageContent } = usePublishedSitePage(language, "faq");
  const { data: generalFaqs } = usePublishedFaqs(language, "general");
  const { data: homeFaqs } = usePublishedFaqs(language, "home");
  const categories = useMemo(() => {
    const publishedFaqs = [...(generalFaqs || []), ...(homeFaqs || [])].filter((item, index, list) => list.findIndex((faq) => faq.question === item.question) === index);
    if (!publishedFaqs.length) return t.categories;
    return [{ category: language === "zh" ? "常见问题" : "General", items: publishedFaqs.map((item) => ({ q: item.question, a: item.answer })) }];
  }, [generalFaqs, homeFaqs, t.categories, language]);
  const allFaqs = categories.flatMap((category) => category.items.map((item) => ({ question: item.q, answer: item.a })));
  const showCategoryHeadings = categories.length > 1;
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.faq);

  return (
    <main className="pt-site-header">
      <PageMeta title={pageContent?.seo_title || t.metaTitle} description={pageContent?.seo_description || t.metaDescription} keywords={pageContent?.seo_keywords || t.metaKeywords} canonicalPath="/faq" />
      <JsonLdFAQ faqs={allFaqs} />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbFaq, url: "/faq" }]} />
      <HeroBanner image={heroImage.desktop} imageMobile={heroImage.mobile} imageAlt={pageContent?.alt || t.heroAlt} label={pageContent?.subtitle || t.eyebrow} title={pageContent?.title || t.title} description={pageContent?.description || t.intro} />

      <section className="forest-chapter forest-faq-page">
        {categories.map((category) => (
          <div key={category.category} className="forest-faq-group">
            {showCategoryHeadings ? <ForestSectionHeading title={category.category} /> : null}
            <ForestFaqList items={category.items.map((item) => ({ question: item.q, answer: item.a }))} />
          </div>
        ))}
      </section>
      <CTABanner title={pageContent?.cta_title || t.ctaTitle} description={pageContent?.cta_description || t.ctaText} quoteLabel={t.contact} quotePath="/contact" whatsappLabel={t.whatsapp} whatsappSource="FAQ CTA" />
    </main>
  );
};

export default FAQ;
