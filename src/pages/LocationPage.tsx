import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import CTABanner from "@/components/templates/CTABanner";
import FAQSection from "@/components/templates/FAQSection";
import SectionHeader from "@/components/templates/SectionHeader";
import HeroBanner from "@/components/templates/HeroBanner";
import { useParams } from "react-router-dom";
import { locationsData } from "@/data/locations";
import { servicesData } from "@/data/services";
import heroImg from "@/assets/hero-renovation-hd.jpg";

const servicesList = servicesData.map(s => ({ name: s.title, link: `/services/${s.slug}` }));

const LocationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = locationsData[slug || ""];

  if (!location) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Location Not Found</h1>
        <Button asChild><Link to="/">Back to Home</Link></Button>
      </main>
    );
  }

  return (
    <main className="pt-16">
      <PageMeta
        title={location.metaTitle}
        description={location.description}
        keywords={`renovation ${location.name}, interior design ${location.name}, custom built-in ${location.name}`}
        canonicalPath={`/locations/${location.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Locations", url: "/" }, { name: location.name, url: `/locations/${location.slug}` }]} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "FLASH CAST SDN. BHD.",
            description: location.description,
            address: { "@type": "PostalAddress", streetAddress: "94, Jalan Mega Mendung, Taman United", addressLocality: "Kuala Lumpur", postalCode: "58200", addressCountry: "MY" },
            areaServed: location.name,
            url: `https://flashcast.com.my/locations/${location.slug}`,
          }),
        }}
      />

      {/* Hero */}
      <section className="section-padding bg-surface-dark">
        <div className="container-narrow">
          <div className="flex items-center gap-2 text-steel text-sm mb-4">
            <Link to="/" className="hover:text-accent">Home</Link>
            <span>/</span>
            <Link to="/" className="hover:text-accent">Locations</Link>
            <span>/</span>
            <span className="text-steel-light">{location.name}</span>
          </div>
          <div className="accent-line mb-4" />
          <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            Renovation Services in {location.name}
          </h1>
          <p className="text-steel-light max-w-2xl text-lg mb-2">{location.description}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
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
      </section>

      {/* Intro + Services */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <Reveal direction="left">
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                  Your Trusted Renovation Partner in {location.name}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">{location.intro}</p>
                <div className="bg-muted p-5 rounded-lg border border-border">
                  <h3 className="font-semibold text-sm mb-3">Common Property Types:</h3>
                  <ul className="space-y-2">
                    {location.propertyTypes.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" delay={100}>
              <div>
                <h3 className="font-display font-semibold text-lg mb-4">Our Services in {location.name}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {servicesList.map((s) => (
                    <Link key={s.name} to={s.link} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <span className="text-sm font-medium group-hover:text-accent transition-colors">{s.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Common Needs */}
      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <SectionHeader title={`Common Renovation Needs in ${location.name}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {location.commonNeeds.map((need) => (
              <Reveal key={need}>
                <div className="flex items-start gap-3 p-4 bg-background border border-border rounded-lg">
                  <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-sm">{need}</span>
                </div>
              </Reveal>
            ))}
          </div>
          {location.constructionNotes && (
            <Reveal delay={200}>
              <div className="mt-8 p-5 bg-accent/5 border border-accent/20 rounded-lg max-w-3xl mx-auto">
                <h3 className="font-semibold text-sm mb-2">Construction & Permit Notes:</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{location.constructionNotes}</p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Projects */}
      {location.projects.length > 0 && (
        <section className="section-padding bg-background">
          <div className="container-narrow">
            <SectionHeader title={`Featured Projects in ${location.name}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {location.projects.map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <div className="rounded-lg overflow-hidden border border-border bg-card hover-lift">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={p.image} alt={p.title} loading="lazy" width={600} height={450} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <span className="text-accent text-[10px] font-bold uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-sm">{p.type}</span>
                      <h3 className="font-semibold text-sm mt-2">{p.title}</h3>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <FAQSection
        title={`${location.name} Renovation FAQ`}
        faqs={location.faqs}
      />

      {/* CTA */}
      <CTABanner
        title={`Start Your ${location.name} Renovation Project`}
        description={`Free consultation and site measurement for projects in ${location.name} and surrounding areas.`}
      />

      {/* Internal Links */}
      <section className="py-8 bg-background border-t border-border">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">Services</Link>{" · "}
            <Link to="/materials" className="text-accent hover:underline">Materials</Link>{" · "}
            <Link to="/projects" className="text-accent hover:underline">Projects</Link>{" · "}
            <Link to="/blog" className="text-accent hover:underline">Blog</Link>{" · "}
            <Link to="/faq" className="text-accent hover:underline">FAQ</Link>{" · "}
            <Link to="/contact" className="text-accent hover:underline">Contact</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default LocationPage;
