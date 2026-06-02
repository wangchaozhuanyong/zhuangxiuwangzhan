import PageMeta from "@/components/PageMeta";
import { JsonLdLocalBusiness, JsonLdOrganization } from "@/components/JsonLd";
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
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedSitePage } from "@/hooks/usePublishedContent";

const pageCopy = {
  en: {
    title: "Renovation Company Kuala Lumpur | Condo, Landed & Commercial | FLASH CAST",
    description: "FLASH CAST SDN. BHD. provides professional renovation, interior design, custom built-in furniture, and commercial fit-out services in Kuala Lumpur and Selangor.",
    keywords: "renovation company Kuala Lumpur, interior design KL, custom built-in furniture Malaysia, commercial renovation Selangor, kitchen renovation KL, bathroom renovation, office renovation, condo renovation",
  },
  zh: {
    title: "吉隆坡装修公司 | 住宅商业装修与定制家具 | FLASH CAST",
    description: "FLASH CAST 服务吉隆坡、雪兰莪与巴生谷，提供住宅装修、商业空间装修、厨房翻新、旧屋翻新、定制家具、材料建议与项目管理。",
    keywords: "吉隆坡装修公司, KL 室内设计, 马来西亚定制家具, 雪兰莪商业装修, 厨房装修, 浴室翻新, 办公室装修, 公寓装修",
  },
};

const Index = () => {
  const { language } = useLanguage();
  const copy = pageCopy[language];
  const { data: pageContent } = usePublishedSitePage(language, "home");
  const metaTitle = pageContent?.seo_title || pageContent?.title || copy.title;
  const metaDescription = pageContent?.seo_description || pageContent?.description || copy.description;
  const metaKeywords = pageContent?.seo_keywords || copy.keywords;

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
      <HeroSection pageContent={pageContent} />
      <div className="home-art-canvas">
        <StatsSection />
        <ProjectsSection />
        <BrandLogosSection />
        <ServicesSection />
        <WhyChooseUsSection />
        <ProcessSection />
        <BeforeAfterSection />
        <TestimonialsSection />
        <HomeFAQSection />
        <CTASection />
      </div>
    </main>
  );
};

export default Index;
