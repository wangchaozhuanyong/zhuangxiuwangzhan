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

const Index = () => {
  return (
    <main>
      <PageMeta
        title="Renovation Company Kuala Lumpur | Condo, Landed & Commercial | FLASH CAST"
        description="FLASH CAST SDN. BHD. — Professional renovation, interior design, custom built-in furniture, and commercial fit-out in Kuala Lumpur and Selangor. Free quotation. SSM registered."
        keywords="renovation company Kuala Lumpur, interior design KL, custom built-in furniture Malaysia, commercial renovation Selangor, kitchen renovation KL, bathroom renovation, office renovation, condo renovation"
        canonicalPath="/"
      />
      <JsonLdLocalBusiness />
      <JsonLdOrganization />
      {/* 1. Hero — who we are, what we do */}
      <HeroSection />
      {/* 2. Trust — credibility and stats */}
      <StatsSection />
      {/* 3. Services — what we offer */}
      <ServicesSection />
      {/* 4. Projects — what we've done */}
      <ProjectsSection />
      {/* 5. Why us — differentiation */}
      <WhyChooseUsSection />
      {/* 6. Process — how we work */}
      <ProcessSection />
      {/* 7. Before/After — transformation proof */}
      <BeforeAfterSection />
      {/* 8. Testimonials — client trust */}
      <TestimonialsSection />
      {/* 9. FAQ — common questions */}
      <HomeFAQSection />
      {/* 10. CTA — next step */}
      <CTASection />
    </main>
  );
};

export default Index;
