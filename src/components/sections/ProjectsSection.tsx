import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { projectsData } from "@/data/projects";

const featured = projectsData.slice(0, 6);

const ProjectsSection = () => {
  return (
    <section className="section-padding bg-muted" id="projects">
      <div className="container-narrow">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="accent-line mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Our Recent Projects</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
              Completed renovation projects across Kuala Lumpur and Selangor — residential, commercial, and built-in furniture.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <Link
                to={`/projects/${p.slug}`}
                className="group block rounded-lg overflow-hidden bg-card border border-border hover-lift h-full"
              >
                <div className="aspect-[4/3] overflow-hidden img-zoom relative">
                  <img
                    src={p.thumbnail}
                    alt={`${p.title} - ${p.type} renovation in ${p.location}`}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest bg-white/90 text-foreground px-2.5 py-1 rounded-sm">
                    {p.type}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base font-semibold mb-1 group-hover:text-gold transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-2">{p.location}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{p.description}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={500}>
          <div className="text-center mt-10">
            <Button variant="outline" className="btn-press" asChild>
              <Link to="/projects">View All Projects <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ProjectsSection;
