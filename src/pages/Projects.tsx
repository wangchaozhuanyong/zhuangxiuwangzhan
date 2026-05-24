import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { projectsData } from "@/data/projects";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import residentialImg from "@/assets/residential-renovation.jpg";
import commercialImg from "@/assets/commercial-renovation.jpg";
import kitchenImg from "@/assets/kitchen-cabinet.jpg";
import warehouseImg from "@/assets/warehouse-shelving.jpg";
import exteriorImg from "@/assets/exterior-works.jpg";
import heroImg from "@/assets/hero-projects.jpg";

const typeImageMap: Record<string, string> = {
  Residential: residentialImg,
  Commercial: commercialImg,
  "Built-In": kitchenImg,
  Warehouse: warehouseImg,
  Exterior: exteriorImg,
  Office: commercialImg,
};

const categories = ["All", "Residential", "Commercial", "Built-In", "Warehouse", "Exterior", "Office"];

const Projects = () => {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? projectsData : projectsData.filter((p) => p.type === filter);

  return (
    <main className="pt-16">
      <PageMeta
        title="Renovation Projects Kuala Lumpur & Selangor | FLASH CAST Portfolio"
        description="Explore completed renovation projects by FLASH CAST across Kuala Lumpur and Selangor — residential condos, commercial offices, custom kitchens, warehouses, and shopfront renovations."
        keywords="renovation projects KL, condo renovation Kuala Lumpur, office fit-out Selangor, kitchen renovation Malaysia"
        canonicalPath="/projects"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Projects", url: "/projects" }]} />

      {/* Hero Banner */}
      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="FLASH CAST renovation projects portfolio" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-5 md:px-8 py-20 md:py-28">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--gold))" }}>Portfolio</p>
          <h1
            className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-lg"
            style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            Our Projects
          </h1>
          <p className="max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Completed renovation projects across Kuala Lumpur and Selangor — from residential homes to commercial spaces and warehouses.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <Reveal>
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 btn-press ${
                    filter === c
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent/10"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <Link to={`/projects/${p.slug}`} className="group hover-lift block">
                  <div className="relative overflow-hidden rounded-lg aspect-[4/3] mb-4 img-zoom">
                    <img
                      src={typeImageMap[p.type] || residentialImg}
                      alt={`${p.title} - ${p.type} renovation in ${p.location}`}
                      loading="lazy"
                      width={800}
                      height={500}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-accent/90 text-accent-foreground text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">{p.type}</span>
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-accent transition-colors">{p.title}</h3>
                  <span className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="w-3 h-3" /> {p.location}
                  </span>
                  <p className="text-muted-foreground text-sm line-clamp-2">{p.description}</p>
                </Link>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No projects found in this category.</p>
          )}
        </div>
      </section>

      <section className="section-padding bg-accent text-accent-foreground text-center">
        <Reveal>
          <div className="container-narrow">
            <h2 className="font-display text-3xl font-bold mb-4">Have a Similar Project?</h2>
            <p className="text-accent-foreground/80 mb-6 max-w-lg mx-auto">Share your requirements and we'll provide a tailored proposal with accurate pricing.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="secondary" size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">Get a Free Quote <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
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
            <Link to="/services" className="text-accent hover:underline">Services</Link>{" · "}
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

export default Projects;
