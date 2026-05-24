import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { materialsData } from "@/data/materials";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

const MaterialDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  // Find material across all categories
  let material = null;
  let category = null;
  for (const cat of materialsData) {
    const found = cat.items.find((m) => m.slug === slug);
    if (found) {
      material = found;
      category = cat;
      break;
    }
  }

  if (!material || !category) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Material Not Found</h1>
        <Button asChild><Link to="/materials">View All Materials</Link></Button>
      </main>
    );
  }

  const otherMaterials = category.items.filter((m) => m.slug !== slug);

  return (
    <main className="pt-16">
      <PageMeta
        title={`${material.name} | Renovation Material in Kuala Lumpur`}
        description={`${material.description} Suitable for: ${material.suitableSpaces.join(", ")}. Available at FLASH CAST, Kuala Lumpur.`}
        keywords={`${material.name}, ${material.category} KL, renovation material Malaysia`}
        canonicalPath={`/materials/${material.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Materials", url: "/materials" }, { name: category.name, url: `/materials/category/${category.slug}` }, { name: material.name, url: `/materials/${material.slug}` }]} />
      {/* Breadcrumb */}
      <section className="bg-muted px-4 md:px-8 py-3">
        <div className="container-narrow flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/materials" className="hover:text-accent">Materials</Link>
          <span>/</span>
          <Link to={`/materials/category/${category.slug}`} className="hover:text-accent">{category.name}</Link>
          <span>/</span>
          <span className="text-foreground">{material.name}</span>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image */}
            <div>
              <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                <img src={material.image} alt={material.name} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Info */}
            <div>
              <span className="text-accent text-xs font-medium uppercase tracking-wider">{material.category}</span>
              <h1 className="font-display text-2xl md:text-3xl font-bold mt-2 mb-4">{material.name}</h1>
              <p className="text-muted-foreground leading-relaxed mb-6">{material.description}</p>

              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">Type</span>
                    <span className="text-sm font-medium">{material.type}</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">Color</span>
                    <span className="text-sm font-medium">{material.color}</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">Texture</span>
                    <span className="text-sm font-medium">{material.texture}</span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">Category</span>
                    <span className="text-sm font-medium">{material.category}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Suitable Spaces</h3>
                <div className="flex flex-wrap gap-2">
                  {material.suitableSpaces.map((s) => (
                    <span key={s} className="text-xs px-3 py-1 bg-muted rounded-full text-muted-foreground">{s}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Recommended Pairing</h3>
                <p className="text-muted-foreground text-sm">{material.recommendedPairing}</p>
              </div>

              {material.note && (
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground mb-6">
                  <strong className="text-foreground">Note:</strong> {material.note}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link to="/quote">Enquire About This Material <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More from category */}
      {otherMaterials.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow">
            <h2 className="font-display text-2xl font-bold mb-6">More {category.name}</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
              {otherMaterials.map((m) => (
                <Link key={m.id} to={`/materials/${m.slug}`} className="snap-start shrink-0 w-[180px] md:w-[220px] group">
                  <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-card border border-border">
                    <img src={m.image} alt={m.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <h3 className="font-semibold text-sm">{m.name}</h3>
                  <p className="text-muted-foreground text-xs">{m.type} · {m.color}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default MaterialDetail;
