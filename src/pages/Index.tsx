import PageMeta from "@/components/PageMeta";
import { JsonLdLocalBusiness, JsonLdOrganization } from "@/components/JsonLd";
import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import ServicesSection from "@/components/sections/ServicesSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import WhyChooseUsSection from "@/components/sections/WhyChooseUsSection";
import ProcessSection from "@/components/sections/ProcessSection";
import BeforeAfterSection from "@/components/sections/BeforeAfterSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import HomeFAQSection from "@/components/sections/HomeFAQSection";
import CTASection from "@/components/sections/CTASection";
import { useLanguage } from "@/i18n/LanguageContext";

const pageCopy = {
  en: {
    title: "Renovation Company Kuala Lumpur | Condo, Landed & Commercial | FLASH CAST",
    description: "FLASH CAST SDN. BHD. provides professional renovation, interior design, custom built-in furniture, and commercial fit-out services in Kuala Lumpur and Selangor.",
    keywords: "renovation company Kuala Lumpur, interior design KL, custom built-in furniture Malaysia, commercial renovation Selangor, kitchen renovation KL, bathroom renovation, office renovation, condo renovation",
  },
  zh: {
    title: "吉隆坡装修公司 | 住宅、商业空间与定制家具 | FLASH CAST",
    description: "FLASH CAST SDN. BHD. 提供吉隆坡与雪兰莪住宅装修、室内设计、定制家具、厨房浴室翻新和商业空间装修服务。",
    keywords: "吉隆坡装修公司, KL 室内设计, 马来西亚定制家具, 雪兰莪商业装修, 厨房装修, 浴室翻新, 办公室装修, 公寓装修",
  },
};

const Index = () => {
  const { language } = useLanguage();
  const copy = pageCopy[language];

  return (
    <main>
      <PageMeta
        title={copy.title}
        description={copy.description}
        keywords={copy.keywords}
        canonicalPath="/"
      />
      <JsonLdLocalBusiness />
      <JsonLdOrganization />
      <HeroSection />
      <StatsSection />
      <ServicesSection />
      <ProjectsSection />
      <WhyChooseUsSection />
      <ProcessSection />
      <BeforeAfterSection />
      <TestimonialsSection />
      <HomeFAQSection />
      <CTASection />
    </main>
  );
};

export default Index;
