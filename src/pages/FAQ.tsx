import { useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdFAQ, JsonLdBreadcrumb } from "@/components/JsonLd";
import Link from "@/components/LocalizedLink";
import { SchemeAFaqList, SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
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
    <main className="fc-route-page">
      <PageMeta title={pageContent?.seo_title || t.metaTitle} description={pageContent?.seo_description || t.metaDescription} keywords={pageContent?.seo_keywords || t.metaKeywords} canonicalPath="/faq" />
      <JsonLdFAQ faqs={allFaqs} />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbFaq, url: "/faq" }]} />
      <SchemeARouteHero kind="content" image={heroImage.desktop} mobileImage={heroImage.mobile} imageAlt={pageContent?.alt || t.heroAlt} label={pageContent?.subtitle || t.eyebrow} title={pageContent?.title || t.title} description={pageContent?.description || t.intro} />

      <SchemeASection title={pageContent?.subtitle || t.eyebrow} description={pageContent?.description || t.intro}>
        {categories.map((category) => (
          <div key={category.category} className="fc-route-faq-group">
            {showCategoryHeadings ? <h2>{category.category}</h2> : null}
            <SchemeAFaqList items={category.items.map((item) => ({ question: item.q, answer: item.a }))} />
          </div>
        ))}
        <div className="fc-route-action-panel">
          <h2>{pageContent?.cta_title || t.ctaTitle}</h2>
          <p>{pageContent?.cta_description || t.ctaText}</p>
          <div><Link to="/contact">{t.contact}</Link><Link to="/quote">{t.whatsapp}</Link></div>
        </div>
      </SchemeASection>
    </main>
  );
};

export default FAQ;
