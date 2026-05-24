import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import heroImg from "@/assets/hero-materials.jpg";

const Materials = () => {
  return (
    <main className="pt-16">
      <PageMeta
        title="Renovation Materials Library | Flooring, Cabinets, Bathroom | Kuala Lumpur"
        description="Browse FLASH CAST's curated material library — whole house custom cabinets, furniture, bathroom fittings, flooring, doors & windows, and wall panels for your renovation project in Kuala Lumpur."
        keywords="renovation materials KL, kitchen cabinets Malaysia, bathroom fittings KL, flooring Kuala Lumpur, custom wardrobe Selangor"
        canonicalPath="/materials"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Materials", url: "/materials" }]} />

      {/* Hero Banner */}
      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="FLASH CAST material library" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>Browse & Select</p>
          <h1
            className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg"
            style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            Material Library
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Browse our curated selection for your renovation project — from custom cabinetry to furniture, bathroom fittings, flooring, and more.
          </p>
        </div>
      </section>

      {/* Category Grid */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10">
              <div className="accent-line mb-4 mx-auto" />
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Choose by Category</h2>
              <p className="text-muted-foreground text-sm">Select a category to explore options for your project</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {materialsData.map((cat, i) => (
              <Reveal key={cat.slug} delay={i * 80}>
                <Link
                  to={`/materials/category/${cat.slug}`}
                  className="group block hover-lift"
                >
                  <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-muted border border-border">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      width={400}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display font-bold text-sm md:text-base leading-tight" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                        {cat.name}
                      </h3>
                      <p className="text-[10px] md:text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                        {cat.subcategories.length} subcategories
                      </p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-accent text-accent-foreground text-center">
        <Reveal>
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold mb-4">Interested in a Material?</h2>
            <p className="text-accent-foreground/80 mb-6 max-w-lg mx-auto">Contact us to request samples, check availability, or get a quotation for your project.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="secondary" size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">Request a Quote <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button
                size="lg"
                className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center"
                asChild
              >
                <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
};

export default Materials;
