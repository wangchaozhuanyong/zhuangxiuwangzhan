import PageMeta from "@/components/PageMeta";
import { JsonLdFAQ, JsonLdLocalBusiness, JsonLdOrganization } from "@/components/JsonLd";
import ForestHome from "@/components/forest/ForestHome";
import PublicContentNotice from "@/components/PublicContentNotice";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedHomeContentBundle } from "@/hooks/usePublishedContent";
import { indexPageText } from "@/i18n/indexPageText";



const Index = () => {
  const { language } = useLanguage();
  const copy = indexPageText[language];
  const {
    data: homeContentResult,
    refetch: retryHomeContent,
  } = usePublishedHomeContentBundle(language);
  const homeContent = homeContentResult?.data;
  const pageContent = homeContent?.pageContent ?? null;
  const metaTitle = pageContent?.seo_title || pageContent?.title || copy.title;
  const metaDescription = pageContent?.seo_description || pageContent?.description || copy.description;
  const metaKeywords = pageContent?.seo_keywords || copy.keywords;
  const homeFaqSchemaItems = (homeContent?.faqs ?? [])
    .map((faq) => ({ question: faq.question, answer: faq.answer }))
    .filter((faq) => faq.question && faq.answer);

  return (
    <main className="home-page overflow-x-hidden">
      <PageMeta
        title={metaTitle}
        description={metaDescription}
        keywords={metaKeywords}
        canonicalPath={pageContent?.path || "/"}
      />
      <JsonLdLocalBusiness />
      <JsonLdOrganization />
      {homeFaqSchemaItems.length > 0 && <JsonLdFAQ faqs={homeFaqSchemaItems} />}
      <PublicContentNotice result={homeContentResult} onRetry={() => void retryHomeContent()} />
      <ForestHome content={homeContent} />
    </main>
  );
};

export default Index;
