import { useEffect, useMemo } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdFAQ, JsonLdLocalBusiness, JsonLdOrganization } from "@/components/JsonLd";
import SchemeAHome from "@/components/scheme-a/SchemeAHome";
import PublicContentNotice from "@/components/PublicContentNotice";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedHomeContentBundle } from "@/hooks/usePublishedContent";
import { indexPageText } from "@/i18n/indexPageText";
import { siteConfig } from "@/config/site";
import { withLanguagePrefix } from "@/i18n/routes";
import { syncHomeFaqStructuredData } from "@/lib/homeFaqSchemaSync";



const Index = () => {
  const { language } = useLanguage();
  const copy = indexPageText[language];
  const {
    data: homeContentResult,
    isLoading,
    refetch: retryHomeContent,
  } = usePublishedHomeContentBundle(language);
  const homeContent = homeContentResult?.data;
  const pageContent = homeContent?.pageContent ?? null;
  const metaTitle = pageContent?.seo_title || pageContent?.title || copy.title;
  const metaDescription = pageContent?.seo_description || pageContent?.description || copy.description;
  const metaKeywords = pageContent?.seo_keywords || copy.keywords;
  const homeFaqSchemaItems = useMemo(() => (homeContent?.faqs ?? [])
    .map((faq) => ({ question: faq.question, answer: faq.answer }))
    .filter((faq) => faq.question.trim() && faq.answer.trim()), [homeContent?.faqs]);

  useEffect(() => {
    if (!homeContent || homeContentResult?.source !== "remote") return;
    const script = document.querySelector<HTMLScriptElement>(
      'script[data-flashcast-edge-schema][type="application/ld+json"]',
    );
    if (!script) return;
    try {
      const canonical = new URL(withLanguagePrefix("/", language), siteConfig.url).toString();
      const next = syncHomeFaqStructuredData(
        JSON.parse(script.textContent || "null") as unknown,
        homeFaqSchemaItems, `${canonical}#faq`,
      );
      if (next) script.textContent = JSON.stringify(next);
    } catch {
      // A malformed server document is left intact rather than replaced with guesses.
    }
  }, [homeContent, homeContentResult?.source, homeFaqSchemaItems, language]);

  return (
    <main className="scheme-a-home-page" data-route-pending={isLoading || undefined}>
      <PageMeta ogImage={pageContent?.seoImage || undefined}
        title={metaTitle}
        description={metaDescription}
        keywords={metaKeywords}
        canonicalPath={pageContent?.path || "/"}
      />
      <JsonLdLocalBusiness />
      <JsonLdOrganization />
      {homeFaqSchemaItems.length > 0 && <JsonLdFAQ faqs={homeFaqSchemaItems} />}
      <PublicContentNotice result={homeContentResult} onRetry={() => void retryHomeContent()} />
      <SchemeAHome content={homeContent} faqItems={homeFaqSchemaItems} />
    </main>
  );
};

export default Index;
