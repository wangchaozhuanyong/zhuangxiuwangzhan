import { Link } from "react-router-dom";
import { MapPin, CheckCircle } from "lucide-react";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/templates/HeroBanner";
import CTABanner from "@/components/templates/CTABanner";
import SectionHeader from "@/components/templates/SectionHeader";
import IconCardGrid from "@/components/templates/IconCardGrid";
import { companyMilestones, coreValues, teamHighlights, companyStats } from "@/data/siteContent";
import heroImg from "@/assets/hero-about.jpg";

const About = () => {
  return (
    <main className="pt-16">
      <PageMeta
        title="About FLASH CAST | Renovation Company in Kuala Lumpur"
        description="FLASH CAST SDN. BHD. is a registered renovation and interior design company based in Kuala Lumpur, Malaysia."
        keywords="about FLASH CAST, renovation company KL, interior design company Malaysia"
        canonicalPath="/about"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "About", url: "/about" }]} />

      <HeroBanner
        image={heroImg}
        imageAlt="FLASH CAST renovation company office and team in Kuala Lumpur"
        label="About Us"
        title="Building Spaces, Building Trust"
        description="FLASH CAST SDN. BHD. — a registered renovation and interior design company based in Kuala Lumpur, providing complete design-and-build solutions for residential, commercial, and industrial spaces across KL and Selangor since 2015."
      />

      {/* Company Introduction */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Reveal direction="left">
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Who We Are</h2>
                <p className="text-muted-foreground mb-4">
                  Founded in 2015, FLASH CAST SDN. BHD. has grown from a small residential renovation team into a full-service design and build company serving clients across Kuala Lumpur and Selangor.
                </p>
                <p className="text-muted-foreground mb-4">
                  We are SSM-registered and operate from our office at 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur. Our team handles every aspect of the renovation process.
                </p>
                <p className="text-muted-foreground mb-6">
                  As an authorized applicator for German Remmers artistic coatings, we also bring European-quality decorative wall finishes to Malaysian homes and commercial spaces.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["SSM Registered", "Remmers Authorized", "In-House Team", "10+ Years"].map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" delay={150}>
              <div className="grid grid-cols-2 gap-5">
                {companyStats.map((stat) => (
                  <div key={stat.label} className="text-center p-6 bg-card rounded-lg border border-border group hover-lift">
                    <span className="font-display text-2xl md:text-3xl font-bold text-accent block mb-1">{stat.value}</span>
                    <span className="text-muted-foreground text-xs leading-relaxed">{stat.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <SectionHeader title="Our Core Values" description="These principles guide every project we take on." />
          <IconCardGrid items={coreValues} columns={2} layout="horizontal" />
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <SectionHeader title="Our Team" description="A dedicated in-house team of professionals — no outsourced labour." />
          <IconCardGrid items={teamHighlights} columns={4} layout="horizontal" />
        </div>
      </section>

      {/* Milestones */}
      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <SectionHeader title="Our Journey" description="From a small residential renovation team to a full-service design-and-build company serving Kuala Lumpur and Selangor." />
          <div className="max-w-2xl mx-auto">
            {companyMilestones.map((milestone, i) => (
              <Reveal key={milestone.year} delay={i * 60}>
                <div className="flex gap-5 mb-6 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {milestone.year.slice(2)}
                    </div>
                    {i < companyMilestones.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-accent font-bold text-sm">{milestone.year}</span>
                      <h3 className="font-display font-semibold text-sm md:text-base">{milestone.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{milestone.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="section-padding bg-background">
        <Reveal>
          <div className="container-narrow">
            <SectionHeader title="Visit Our Office" description="Located in Taman United, Kuala Lumpur." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto">
              <div className="bg-card p-8 rounded-lg text-center hover-lift flex flex-col items-center justify-center border border-border">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <p className="font-semibold mb-1">FLASH CAST SDN. BHD.</p>
                <p className="text-muted-foreground text-sm mb-3">94, Jalan Mega Mendung, Taman United,<br />58200 Kuala Lumpur, Malaysia</p>
                <p className="text-muted-foreground text-xs">Mon–Sat: 9:00 AM – 6:00 PM</p>
              </div>
              <div className="rounded-lg overflow-hidden bg-background border border-border min-h-[220px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3984.0!2d101.68!3d3.11!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMDYnMzYuMCJOIDEwMcKwNDAnNDguMCJF!5e0!3m2!1sen!2smy!4v1600000000000"
                  width="100%" height="100%" style={{ border: 0, minHeight: "220px" }}
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  title="FLASH CAST office location in Kuala Lumpur"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <CTABanner title="Work With Us" description="Whether you're renovating a home, fitting out an office, or setting up a warehouse — we're ready to help." />
    </main>
  );
};

export default About;
