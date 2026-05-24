import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Shield, Clock, Wrench, Home, AlertTriangle, Droplets } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import FAQSection from "@/components/templates/FAQSection";
import heroImg from "@/assets/old-house-hero.jpg";
import beforeAfterImg from "@/assets/old-house-before-after.jpg";
import oldHouseServiceImg from "@/assets/services/old-house-renovation.jpg";

import beforeKitchen from "@/assets/before-after/before-kitchen.jpg";
import afterKitchen from "@/assets/before-after/after-kitchen.jpg";
import beforeLiving from "@/assets/before-after/before-living.jpg";
import afterLiving from "@/assets/before-after/after-living.jpg";
import beforeBathroom from "@/assets/before-after/before-bathroom.jpg";
import afterBathroom from "@/assets/before-after/after-bathroom.jpg";

const challenges = [
  { icon: AlertTriangle, title: "Cracked Walls & Foundation", desc: "Structural cracks from settling or poor original construction need professional assessment and repair." },
  { icon: Wrench, title: "Outdated Wiring & Plumbing", desc: "Old aluminium wiring and galvanized pipes are safety hazards — full rewiring and replumbing is essential." },
  { icon: Droplets, title: "Water Damage & Leaks", desc: "Roof leaks, bathroom seepage, and rising dampness cause long-term structural damage if not addressed." },
  { icon: Home, title: "Termite Damage", desc: "Malaysian homes are highly susceptible to termite infestations — early detection and treatment saves thousands." },
];

const scope = [
  "Structural Repair & Reinforcement",
  "Roof Repair & Waterproofing",
  "Complete Electrical Rewiring",
  "Plumbing & Pipe Replacement",
  "Termite Treatment & Prevention",
  "Wall Crack Repair & Plastering",
  "Window & Door Replacement",
  "Kitchen & Bathroom Overhaul",
  "Flooring Replacement",
  "Ceiling & Lighting Upgrade",
  "Built-In Furniture & Carpentry",
  "Interior & Exterior Painting",
  "Grille & Security Upgrades",
  "Landscape & Porch Works",
];

const process = [
  { num: "01", title: "Structural Assessment", desc: "We inspect the property for structural issues, termite damage, water damage, and electrical/plumbing condition." },
  { num: "02", title: "Renovation Plan", desc: "We create a detailed renovation plan addressing both structural repairs and interior design upgrades." },
  { num: "03", title: "Cost Estimation", desc: "Transparent itemized quotation covering all repair works, materials, and finishing." },
  { num: "04", title: "Demolition & Repair", desc: "We handle all demolition, structural repairs, waterproofing, rewiring, and replumbing." },
  { num: "05", title: "Interior Fit-Out", desc: "New flooring, ceiling, painting, built-in furniture, kitchen, bathroom, and all finishing works." },
  { num: "06", title: "Final Handover", desc: "Complete inspection, defect rectification, cleaning, and warranty handover." },
];

const faqs = [
  { q: "How much does an old house renovation cost in KL?", a: "A full old house renovation in Kuala Lumpur typically ranges from RM 80,000 to RM 300,000+ depending on the property size, condition, and scope. We provide a detailed quotation after a thorough site assessment." },
  { q: "How long does it take to renovate an old house?", a: "A full renovation of an old terrace house usually takes 10-16 weeks. The timeline depends on the extent of structural repairs needed and the scope of interior works." },
  { q: "Do you handle termite issues?", a: "Yes. We conduct termite inspections and arrange professional termite treatment before renovation begins. We also install termite barriers to prevent future infestations." },
  { q: "Can you renovate while I'm living in the house?", a: "For major renovations, we recommend moving out temporarily. For partial renovations, we can work in phases to minimize disruption." },
  { q: "Do old houses need rewiring?", a: "Houses built before 1990 almost always need rewiring for safety and compliance. Old aluminium wiring and outdated panels should be replaced with modern copper wiring and circuit breakers." },
  { q: "Can you keep the original character of the house?", a: "Absolutely. If you want to preserve heritage features like original tiles, timber beams, or architectural details, we can work around them while modernizing the rest of the house." },
];

const caseStudies = [
  { before: beforeKitchen, after: afterKitchen, title: "Kitchen — Taman Tun, KL", desc: "30-year-old kitchen with water damage, replaced with modern cabinets, quartz countertop, and new plumbing." },
  { before: beforeLiving, after: afterLiving, title: "Living Room — Bangsar, KL", desc: "Complete overhaul of a 1980s living room — new flooring, built-in TV wall, recessed lighting." },
  { before: beforeBathroom, after: afterBathroom, title: "Bathroom — PJ Old Town", desc: "Mouldy bathroom with rusty fixtures transformed into a luxury marble wet room with rain shower." },
];

const OldHouseRenovation = () => {
  return (
    <main className="pt-16">
      <PageMeta
        title="Old House Renovation KL | Terrace House, Bungalow & Semi-D | FLASH CAST"
        description="Professional old house renovation in Kuala Lumpur — structural repair, rewiring, replumbing, waterproofing, and full interior makeover for terrace houses, bungalows, and semi-detached homes."
        keywords="old house renovation KL, terrace house renovation Malaysia, bungalow renovation Kuala Lumpur, house rewiring KL, old property renovation Selangor"
        canonicalPath="/services/old-house"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: "Old House Renovation", url: "/services/old-house" }]} />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Beautifully renovated old terrace house in Kuala Lumpur" className="w-full h-full object-cover" width={1920} height={720} fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-32">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>
            Old House Renovation
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-5 max-w-2xl" style={{ color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            Breathe New Life Into Your Old Property
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
            Comprehensive renovation for aging terrace houses, bungalows, and semi-detached homes — from structural repair and rewiring to full interior makeover.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold bg-white text-foreground hover:bg-white/90 rounded-md px-8 py-3 justify-center" asChild>
              <Link to="/quote"><ArrowRight className="w-4 h-4 mr-2" /> Get Free Assessment</Link>
            </Button>
            <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-transparent text-white border border-white/40 hover:bg-white/10 rounded-md px-8 py-3 justify-center" asChild>
              <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <Reveal direction="left">
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Why Renovate Your Old House?</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Many Malaysian homeowners inherit or purchase older properties that need major upgrading. Houses built in the 1970s-1990s often face issues like cracked walls, outdated wiring, old plumbing, termite damage, and worn-out interiors.
                </p>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Our team has extensive experience with Malaysian terrace houses, semi-detached homes, and bungalows. We understand the common issues and know how to solve them efficiently — transforming aging houses into modern, comfortable homes.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Structural Assessment", "Full Rewiring", "Termite Treatment", "Interior Design"].map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" delay={150}>
              <div className="rounded-lg overflow-hidden">
                <img src={beforeAfterImg} alt="Before and after old house renovation in Kuala Lumpur" loading="lazy" width={1280} height={640} className="w-full object-cover rounded-lg" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Common Challenges */}
      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10 md:mb-14">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Common Issues in Old Houses</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
                These are the most frequent problems we encounter — and solve — in older Malaysian properties.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {challenges.map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className="flex gap-4 p-5 bg-card rounded-lg border border-border hover-lift">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Full Scope */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <Reveal direction="left">
              <div className="rounded-lg overflow-hidden img-zoom">
                <img src={oldHouseServiceImg} alt="Old house renovation in progress" loading="lazy" width={960} height={720} className="w-full object-cover aspect-[4/3]" />
              </div>
            </Reveal>
            <Reveal direction="right" delay={150}>
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">What We Cover</h2>
                <p className="text-muted-foreground mb-6">Complete renovation scope — from foundation to finishing.</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {scope.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-gold shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding bg-surface-dark">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10 md:mb-14">
              <div className="accent-line mx-auto mb-4" style={{ backgroundColor: "hsl(var(--gold))" }} />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: "hsl(var(--surface-dark-foreground))" }}>
                Our Old House Renovation Process
              </h2>
              <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: "hsl(var(--steel))" }}>
                A structured approach to transform aging properties safely and beautifully.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {process.map((step, i) => (
              <Reveal key={step.num} delay={i * 100}>
                <div className="text-center p-5 md:p-6 rounded-lg border border-white/10 bg-white/[0.03] h-full group">
                  <span className="text-gold font-display text-3xl font-bold inline-block group-hover:scale-110 transition-transform duration-300">{step.num}</span>
                  <h3 className="font-semibold mt-2 mb-1.5 text-sm md:text-base" style={{ color: "hsl(var(--surface-dark-foreground))" }}>{step.title}</h3>
                  <p className="text-xs md:text-sm leading-relaxed" style={{ color: "hsl(var(--steel))" }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10 md:mb-14">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Transformation Gallery</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
                Real before-and-after results from our old house renovation projects.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {caseStudies.map((item, i) => (
              <Reveal key={item.title} delay={i * 120}>
                <div className="bg-card rounded-lg border border-border overflow-hidden hover-lift">
                  <div className="grid grid-cols-2">
                    <div className="relative aspect-square">
                      <img src={item.before} alt={`Before: ${item.title}`} className="w-full h-full object-cover" loading="lazy" />
                      <span className="absolute bottom-1 left-1 bg-foreground/70 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm">Before</span>
                    </div>
                    <div className="relative aspect-square">
                      <img src={item.after} alt={`After: ${item.title}`} className="w-full h-full object-cover" loading="lazy" />
                      <span className="absolute bottom-1 right-1 bg-white/80 text-foreground text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm">After</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Guide */}
      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Pricing Guide</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">Indicative pricing for old house renovation in Kuala Lumpur and Selangor.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { type: "Partial Renovation", range: "RM 30K – 80K", desc: "Kitchen & bathroom replacement, rewiring, painting, flooring", scope: "1-2 rooms" },
              { type: "Full Interior Renovation", range: "RM 80K – 180K", desc: "Complete interior overhaul including all built-in furniture, new electrical, plumbing, and finishing", scope: "Whole house interior" },
              { type: "Full Structural + Interior", range: "RM 150K – 300K+", desc: "Structural repair, roof works, complete rewiring/replumbing, plus full interior design and fit-out", scope: "Complete transformation" },
            ].map((item, i) => (
              <Reveal key={item.type} delay={i * 100}>
                <div className="bg-card p-6 rounded-lg border border-border hover-lift text-center h-full flex flex-col">
                  <h3 className="font-display text-lg font-semibold mb-2">{item.type}</h3>
                  <p className="text-gold font-display text-2xl font-bold mb-3">{item.range}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3 flex-1">{item.desc}</p>
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full inline-block">{item.scope}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={300}>
            <p className="text-center text-muted-foreground text-xs mt-6">* Prices are estimates. Actual cost depends on property condition, size, and scope. Free site assessment available.</p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection
        title="Old House Renovation FAQ"
        description="Common questions about renovating older properties in Malaysia."
        faqs={faqs}
      />

      {/* CTA */}
      <section className="section-padding bg-surface-dark text-center">
        <Reveal>
          <div className="container-narrow">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: "hsl(var(--surface-dark-foreground))" }}>
              Ready to Transform Your Old House?
            </h2>
            <p className="mb-8 max-w-md mx-auto text-sm md:text-base" style={{ color: "hsl(var(--steel))" }}>
              Get a free structural assessment and renovation quotation. We serve all areas in KL and Selangor.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold bg-white text-foreground hover:bg-white/90 rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">Get Free Assessment <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-transparent border border-white/30 hover:bg-white/10 rounded-md px-8 py-3 justify-center" style={{ color: "hsl(var(--surface-dark-foreground))" }} asChild>
                <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Internal Links */}
      <section className="py-8 bg-background border-t border-border">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">All Services</Link>{" · "}
            <Link to="/services/renovation" className="text-accent hover:underline">Renovation Works</Link>{" · "}
            <Link to="/projects" className="text-accent hover:underline">Projects</Link>{" · "}
            <Link to="/quote" className="text-accent hover:underline">Get Quote</Link>{" · "}
            <Link to="/contact" className="text-accent hover:underline">Contact</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default OldHouseRenovation;
