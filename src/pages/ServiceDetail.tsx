import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { servicesData } from "@/data/services";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdService, JsonLdBreadcrumb, JsonLdFAQ } from "@/components/JsonLd";
// Images are now stored in servicesData directly

const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const service = servicesData.find((s) => s.slug === slug);

  if (!service) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Service Not Found</h1>
        <Button asChild><Link to="/services">View All Services</Link></Button>
      </main>
    );
  }

  const heroImage = service.image;

  return (
    <main className="pt-16">
      <PageMeta
        title={`${service.title} Kuala Lumpur | FLASH CAST Renovation Services`}
        description={service.summary}
        keywords={`${service.title} KL, ${service.title} Malaysia, renovation Kuala Lumpur`}
        canonicalPath={`/services/${service.slug}`}
      />
      <JsonLdService name={service.title} description={service.summary} />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: service.title, url: `/services/${service.slug}` }]} />
      <JsonLdFAQ faqs={service.faqs.map(f => ({ question: f.q, answer: f.a }))} />
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt={service.title} className="w-full h-full object-cover scale-105 animate-[scale-up_1.2s_ease-out_forwards]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-4 md:px-8 py-20">
          <Link to="/services" className="inline-flex items-center gap-1 text-sm hover:text-accent transition-colors mb-6" style={{ color: "rgba(255,255,255,0.8)" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> All Services
          </Link>
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>Services</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4 max-w-lg" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{service.title}</h1>
          <p className="max-w-2xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{service.summary}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button size="lg" className="btn-press bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 px-8" asChild>
              <Link to="/quote">Get a Quote <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-neutral-800 hover:bg-white/90 border-0 btn-press h-12 px-8 font-semibold shadow-md"
              asChild
            >
              <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Reveal direction="left">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Overview</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">{service.description}</p>
                <h3 className="font-semibold mb-3">Suitable For</h3>
                <ul className="space-y-2 mb-6">
                  {service.suitableFor.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal direction="right" delay={150}>
              <div>
                <h3 className="font-semibold mb-3">What We Offer</h3>
                <div className="grid grid-cols-1 gap-2">
                  {service.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 py-2.5 px-4 bg-muted rounded-md text-sm transition-colors hover:bg-accent/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Common Projects */}
      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <h2 className="font-display text-2xl font-bold mb-6">Common Projects</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {service.commonProjects.map((proj) => (
              <div key={proj} className="p-4 bg-background rounded-lg text-center text-sm font-medium border border-border">
                {proj}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">Our Process</h2>
          <div className="space-y-6">
            {service.processSteps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-muted">
        <div className="container-narrow max-w-3xl">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {service.faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-background rounded-lg border border-border px-4">
                <AccordionTrigger className="text-left font-medium text-sm md:text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Related Services */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Related Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {servicesData
              .filter((s) => s.slug !== service.slug)
              .slice(0, 3)
              .map((s) => (
                <Link
                  key={s.slug}
                  to={`/services/${s.slug}`}
                  className="group p-5 rounded-lg border border-border bg-card hover-lift text-center block transition-colors hover:border-accent/30"
                >
                  <h3 className="font-display font-semibold text-sm mb-1 group-hover:text-accent transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{s.summary}</p>
                </Link>
              ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
            <Link to="/projects" className="text-accent hover:underline">View Projects →</Link>
            <span className="text-border">|</span>
            <Link to="/materials" className="text-accent hover:underline">Material Library →</Link>
            <span className="text-border">|</span>
            <Link to="/faq" className="text-accent hover:underline">FAQ →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-accent text-accent-foreground text-center">
        <div className="container-narrow">
          <h2 className="font-display text-3xl font-bold mb-4">Interested in {service.title}?</h2>
          <p className="mb-6 opacity-90">Contact us for a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button size="lg" variant="secondary" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
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
      </section>
    </main>
  );
};

export default ServiceDetail;
