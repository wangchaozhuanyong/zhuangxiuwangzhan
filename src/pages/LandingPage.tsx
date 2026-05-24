import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, MapPin, Star } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import CTABanner from "@/components/templates/CTABanner";
import FAQSection from "@/components/templates/FAQSection";
import { landingPages } from "@/data/landings";

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = landingPages[slug || ""];

  if (!page) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Page Not Found</h1>
        <Button asChild><Link to="/">Back to Home</Link></Button>
      </main>
    );
  }

  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <img src={page.heroImage} alt={page.title} className="w-full h-full object-cover" loading="eager" width={1920} height={800} />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/40" />
        </div>
        <div className="relative z-10 container-narrow px-4 md:px-8 py-24">
          <div className="max-w-xl">
            <p className="text-accent font-medium text-sm tracking-widest uppercase mb-3">FLASH CAST SDN. BHD.</p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground leading-tight mb-4">{page.title}</h1>
            <p className="text-steel-light text-lg mb-6">{page.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide shadow-xl shadow-accent/40 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">Get a Free Quote <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Description + Benefits */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <Reveal direction="left">
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">{page.description}</p>
              </div>
            </Reveal>
            <Reveal direction="right" delay={100}>
              <div className="bg-muted p-6 rounded-lg border border-border">
                <h3 className="font-semibold text-base mb-4">Why Choose Us</h3>
                <ul className="space-y-3">
                  {page.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <span className="text-sm">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      {page.relatedProjects.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow">
            <Reveal>
              <div className="text-center mb-10">
                <div className="accent-line mx-auto mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Related Projects</h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {page.relatedProjects.map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <div className="rounded-lg overflow-hidden border border-border bg-background hover-lift">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={p.image} alt={p.title} loading="lazy" width={600} height={450} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                      <p className="text-muted-foreground text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <FAQSection faqs={page.faqs} className="section-padding bg-background" />

      {/* CTA */}
      <CTABanner title="Ready to Get Started?" description="Contact us today for a free consultation and quotation." />
    </main>
  );
};

export default LandingPage;
