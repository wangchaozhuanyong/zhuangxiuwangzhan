import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/templates/HeroBanner";
import CTABanner from "@/components/templates/CTABanner";
import SectionHeader from "@/components/templates/SectionHeader";
import IconCardGrid from "@/components/templates/IconCardGrid";
import { processSteps } from "@/data/siteContent";
import heroImg from "@/assets/hero-process.jpg";

const Process = () => {
  return (
    <main className="pt-16">
      <PageMeta
        title="Our Process | How We Work | FLASH CAST"
        description="Learn how FLASH CAST handles your renovation project — from consultation and design to construction and handover. A transparent, step-by-step process."
        keywords="renovation process, how renovation works, step by step renovation, KL renovation process"
        canonicalPath="/process"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Our Process", url: "/process" }]} />

      <HeroBanner
        image={heroImg}
        imageAlt="FLASH CAST renovation process and project management"
        label="How We Work"
        title="Our Renovation Process"
        description="A clear, structured approach from first consultation to final handover. Transparent pricing, regular updates, and professional project management at every step."
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader
            title="6 Steps to Your Dream Space"
            description="Every project follows the same proven process — designed for transparency, efficiency, and client satisfaction."
          />

          <div className="max-w-3xl mx-auto space-y-6">
            {processSteps.map((step, i) => (
              <Reveal key={step.num} delay={i * 80}>
                <div className="relative flex gap-5 md:gap-7 p-6 md:p-8 bg-card rounded-lg border border-border hover-lift">
                  <div className="shrink-0">
                    <div className="w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-display font-bold text-lg">
                      {step.num}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">{step.desc}</p>
                    <ul className="space-y-1.5">
                      {step.details.map((d) => (
                        <li key={d} className="flex items-start gap-2 text-muted-foreground text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                          <span>{d}</span>
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

      <CTABanner title="Ready to Start?" description="Get in touch today — the first step is a simple conversation." />
    </main>
  );
};

export default Process;
