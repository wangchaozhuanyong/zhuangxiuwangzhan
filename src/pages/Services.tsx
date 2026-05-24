import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { servicesData } from "@/data/services";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import heroImg from "@/assets/hero-services.jpg";
// Use images from servicesData directly — no separate map needed

const Services = () => {
  return (
    <main className="pt-16">
      <PageMeta
        title="Renovation Services Kuala Lumpur | Interior, Built-In, Commercial & Artistic Coating"
        description="Explore FLASH CAST's comprehensive renovation services in Kuala Lumpur and Selangor — interior design, custom built-in furniture, commercial fit-out, artistic wall coating (German Remmers), exterior works, and warehouse solutions."
        keywords="renovation services KL, interior design Kuala Lumpur, custom built-in Malaysia, commercial renovation Selangor, artistic wall coating Remmers, shop renovation KL"
        canonicalPath="/services"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }]} />

      {/* Hero Banner */}
      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="FLASH CAST renovation services in Kuala Lumpur" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>What We Do</p>
          <h1
            className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg"
            style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            Our Services
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Comprehensive renovation services across Kuala Lumpur and Selangor — from interior design and custom built-in to commercial fit-out, artistic wall coating, and warehouse systems.
          </p>
        </div>
      </section>

      {/* GEO Summary */}
      <section className="py-8 bg-muted border-b border-border">
        <div className="container-narrow">
          <p className="text-muted-foreground text-sm leading-relaxed text-center max-w-3xl mx-auto">
            <strong className="text-foreground">FLASH CAST SDN. BHD.</strong> provides {servicesData.length} core renovation services in <strong className="text-foreground">Kuala Lumpur</strong> and <strong className="text-foreground">Selangor</strong>, Malaysia — covering residential homes, commercial spaces, industrial facilities, and specialty finishes including German Remmers artistic coatings.
          </p>
        </div>
      </section>

      {servicesData.map((cat, i) => (
        <section key={cat.id} className={`section-padding ${i % 2 === 0 ? "bg-background" : "bg-muted"}`}>
          <div className="container-narrow">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <Reveal direction={i % 2 !== 0 ? "right" : "left"}>
                <div className={i % 2 !== 0 ? "lg:order-2" : ""}>
                  <div className="accent-line mb-4" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{cat.title}</h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{cat.summary}</p>

                  {/* Suitable For */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm mb-2">Suitable For:</h3>
                    <div className="flex flex-wrap gap-2">
                      {cat.suitableFor.slice(0, 4).map((s) => (
                        <span key={s} className="text-xs px-3 py-1 bg-accent/10 text-accent rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {cat.items.slice(0, 8).map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                        {item}
                      </li>
                    ))}
                    {cat.items.length > 8 && (
                      <li className="text-sm text-muted-foreground">+{cat.items.length - 8} more</li>
                    )}
                  </ul>
                  <Button className="btn-press" asChild>
                    <Link to={`/services/${cat.slug}`}>View Full Details <ArrowRight className="ml-2 w-4 h-4" /></Link>
                  </Button>
                </div>
              </Reveal>
              <Reveal direction={i % 2 !== 0 ? "left" : "right"} delay={150}>
                <div className={`${i % 2 !== 0 ? "lg:order-1" : ""} overflow-hidden rounded-lg img-zoom`}>
                  <img src={cat.image} alt={`${cat.title} service by FLASH CAST in Kuala Lumpur`} loading="lazy" width={800} height={600} className="w-full object-cover aspect-[4/3]" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="section-padding bg-surface-dark text-center">
        <Reveal>
          <div className="container-narrow">
            <div className="accent-line mx-auto mb-4" style={{ backgroundColor: "hsl(var(--gold))" }} />
            <h2 className="font-display text-3xl font-bold mb-4 text-primary-foreground">Not Sure What You Need?</h2>
            <p className="text-steel-light mb-6 max-w-lg mx-auto">Contact us for a free consultation. We'll assess your space and recommend the right approach.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">Get a Free Quote</Link>
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

      {/* Internal Links */}
      <section className="py-8 bg-background border-t border-border">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/projects" className="text-accent hover:underline">Projects</Link>{" · "}
            <Link to="/materials" className="text-accent hover:underline">Materials</Link>{" · "}
            <Link to="/blog" className="text-accent hover:underline">Blog</Link>{" · "}
            <Link to="/faq" className="text-accent hover:underline">FAQ</Link>{" · "}
            <Link to="/contact" className="text-accent hover:underline">Contact</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Services;
