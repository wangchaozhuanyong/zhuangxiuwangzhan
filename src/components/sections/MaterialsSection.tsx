import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/Reveal";
import { materialsData } from "@/data/materials";

const MaterialsSection = () => {
  return (
    <section className="section-padding bg-muted" id="materials">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mb-4 mx-auto" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Material Library</h2>
            <p className="text-muted-foreground text-sm md:text-base">Browse quality materials — then request a quote</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
          {materialsData.map((cat, i) => (
            <Reveal key={cat.slug} delay={i * 60}>
              <Link
                to={`/materials/category/${cat.slug}`}
                className="group block h-full"
              >
                <div className="rounded-lg overflow-hidden bg-card border border-border hover-lift h-full transition-colors hover:border-accent/30">
                  <div className="aspect-square overflow-hidden img-zoom">
                    <img src={cat.image} alt={cat.name} loading="lazy" className="w-full h-full object-cover" width={200} height={200} />
                  </div>
                  <div className="p-4 md:p-5">
                    <p className="font-medium text-xs md:text-sm text-center group-hover:text-accent transition-colors leading-tight">{cat.name}</p>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="text-center mt-10">
            <Button variant="outline" className="btn-press" asChild>
              <Link to="/materials">View All Materials <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default MaterialsSection;
