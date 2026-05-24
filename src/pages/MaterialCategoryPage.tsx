import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

const MaterialCategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const category = materialsData.find((c) => c.slug === categorySlug);

  if (!category) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Category Not Found</h1>
        <Button asChild><Link to="/materials">View All Materials</Link></Button>
      </main>
    );
  }

  return (
    <main className="pt-16">
      <PageMeta
        title={`${category.name} | Renovation Materials | FLASH CAST`}
        description={`${category.description} Browse ${category.name.toLowerCase()} options for your renovation project in Kuala Lumpur and Selangor.`}
        keywords={`${category.name} KL, ${category.name.toLowerCase()} renovation Malaysia`}
        canonicalPath={`/materials/category/${category.slug}`}
      />
      <JsonLdBreadcrumb items={[
        { name: "Home", url: "/" },
        { name: "Materials", url: "/materials" },
        { name: category.name, url: `/materials/category/${category.slug}` },
      ]} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        </div>
        <div className="relative z-10 section-padding">
          <div className="container-narrow">
            <Link to="/materials" className="inline-flex items-center gap-1.5 text-sm hover:text-accent mb-6 transition-colors" style={{ color: "rgba(255,255,255,0.75)" }}>
              <ArrowLeft className="w-4 h-4" /> All Materials
            </Link>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 md:text-center" style={{ color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>
              {category.name}
            </h1>
            <p className="max-w-xl md:mx-auto md:text-center" style={{ color: "rgba(255,255,255,0.75)" }}>{category.description}</p>
          </div>
        </div>
      </section>

      {/* Subcategories Grid */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <h2 className="font-display text-xl md:text-2xl font-bold mb-6">Browse Subcategories</h2>
          </Reveal>

          {/* Mobile: horizontal scroll. Desktop: grid */}
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:gap-5">
            {category.subcategories.map((sub, i) => (
              <Reveal key={sub.slug} delay={i * 60} direction="none">
                <Link
                  to={`/materials/category/${category.slug}/${sub.slug}`}
                  className="snap-start shrink-0 w-44 sm:w-48 md:w-auto group block hover-lift"
                >
                  <div className="relative overflow-hidden rounded-xl aspect-square bg-muted border border-border">
                     <img
                      src={sub.image}
                      alt={sub.name}
                      loading="lazy"
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-sm leading-tight" style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                        {sub.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* All items in this category */}
      {category.items.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow">
            <Reveal>
              <h2 className="font-display text-xl md:text-2xl font-bold mb-6">All {category.name} Products</h2>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {category.items.map((item, i) => (
                <Reveal key={item.id} delay={i * 60} direction="none">
                  <Link to={`/materials/${item.slug}`} className="group block hover-lift">
                    <div className="relative overflow-hidden rounded-lg aspect-square mb-3 bg-card border border-border img-zoom">
                      <img src={item.image} alt={item.name} loading="lazy" width={400} height={400} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">{item.name}</h3>
                    <p className="text-muted-foreground text-xs">Color: {item.color}</p>
                    <p className="text-muted-foreground text-xs">Suitable: {item.suitableSpaces.join(", ")}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section-padding bg-accent text-accent-foreground text-center">
        <Reveal>
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold mb-4">Interested in {category.name}?</h2>
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

export default MaterialCategoryPage;
