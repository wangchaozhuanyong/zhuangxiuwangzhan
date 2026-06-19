import PageMeta from "@/components/PageMeta";
import { JsonLdFAQ, JsonLdLocalBusiness, JsonLdOrganization } from "@/components/JsonLd";
import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import BrandLogosSection from "@/components/sections/BrandLogosSection";
import ServicesSection from "@/components/sections/ServicesSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import WhyChooseUsSection from "@/components/sections/WhyChooseUsSection";
import ProcessSection from "@/components/sections/ProcessSection";
import BeforeAfterSection from "@/components/sections/BeforeAfterSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import HomeFAQSection from "@/components/sections/HomeFAQSection";
import CTASection from "@/components/sections/CTASection";
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
      <HeroSection pageContent={pageContent} heroSlides={homeContent?.heroSlides ?? []} />
      <PublicContentNotice result={homeContentResult} onRetry={() => void retryHomeContent()} />
      <div className="home-art-canvas">
        <StatsSection section={homeContent?.statsSection ?? null} />
        <ProjectsSection projects={homeContent?.projects ?? []} />
        <BrandLogosSection brandPartners={homeContent?.brandPartners ?? []} />
        <ServicesSection services={homeContent?.services ?? []} />
        <WhyChooseUsSection section={homeContent?.whyChooseUsSection ?? null} />
        <ProcessSection processSteps={homeContent?.processSteps ?? []} />
        <BeforeAfterSection items={homeContent?.beforeAfterItems ?? []} />
        <TestimonialsSection testimonials={homeContent?.testimonials ?? []} />
        <HomeFAQSection faqs={homeContent?.faqs ?? []} />
        <CTASection ctaBlock={homeContent?.ctaBlock ?? null} />
      </div>
    </main>
  );
};

export default Index;
