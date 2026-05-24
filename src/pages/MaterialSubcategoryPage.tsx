import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

const MaterialSubcategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug: string }>();

  const category = materialsData.find((c) => c.slug === categorySlug);
  const subcategory = category?.subcategories.find((s) => s.slug === subcategorySlug);
  const items = category?.items.filter((item) => item.subcategory === subcategorySlug) || [];

  if (!category || !subcategory) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Subcategory Not Found</h1>
        <Button asChild><Link to="/materials">View All Materials</Link></Button>
      </main>
    );
  }

  return (
    <main className="pt-16">
      <PageMeta
        title={`${subcategory.name} | ${category.name} | FLASH CAST`}
        description={`${subcategory.description} Browse ${subcategory.name.toLowerCase()} for your renovation project in Kuala Lumpur.`}
        keywords={`${subcategory.name} KL, ${subcategory.name.toLowerCase()} Malaysia, ${category.name.toLowerCase()} renovation`}
        canonicalPath={`/materials/category/${category.slug}/${subcategory.slug}`}
      />
      <JsonLdBreadcrumb items={[
        { name: "Home", url: "/" },
        { name: "Materials", url: "/materials" },
        { name: category.name, url: `/materials/category/${category.slug}` },
        { name: subcategory.name, url: `/materials/category/${category.slug}/${subcategory.slug}` },
      ]} />

      {/* Hero */}
      <section className="bg-muted border-b border-border">
        <div className="section-padding !pb-0">
          <div className="container-narrow">
            <Link to={`/materials/category/${category.slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {category.name}
            </Link>
            <div className="accent-line mb-4" />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 md:text-center">{subcategory.name}</h1>
            <p className="text-muted-foreground max-w-xl md:mx-auto md:text-center pb-12 md:pb-16">{subcategory.description}</p>
          </div>
        </div>
      </section>

      {/* Items Grid */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          {items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((item, i) => (
                <Reveal key={item.id} delay={i * 60} direction="none">
                  <Link to={`/materials/${item.slug}`} className="group block hover-lift">
                    <div className="relative overflow-hidden rounded-lg aspect-square mb-3 bg-muted border border-border img-zoom">
                      <img src={item.image} alt={item.name} loading="lazy" width={400} height={400} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">{item.name}</h3>
                    <p className="text-muted-foreground text-xs">Color: {item.color}</p>
                    <p className="text-muted-foreground text-xs">Suitable: {item.suitableSpaces.join(", ")}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-2">Products coming soon for this category.</p>
              <p className="text-sm text-muted-foreground mb-6">Contact us to enquire about {subcategory.name.toLowerCase()} options.</p>
              <Button asChild>
                <Link to="/quote">Request a Quote <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-accent text-accent-foreground text-center">
        <Reveal>
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold mb-4">Interested in {subcategory.name}?</h2>
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

export default MaterialSubcategoryPage;
