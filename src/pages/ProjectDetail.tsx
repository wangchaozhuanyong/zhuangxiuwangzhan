import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MapPin, Clock, CheckCircle, Star, Wrench, Layers } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { projectsData } from "@/data/projects";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
// Project images come from projectsData directly

/* Map project type to related service slug */
const typeToService: Record<string, { name: string; slug: string }> = {
  "Residential": { name: "Interior Renovation", slug: "renovation" },
  "Commercial": { name: "Commercial Works", slug: "commercial" },
  "Built-In": { name: "Custom Built-In Solutions", slug: "builtin" },
  "Warehouse": { name: "Warehouse & Shelving", slug: "warehouse" },
  "Exterior": { name: "Exterior Works", slug: "exterior" },
  "Office": { name: "Commercial Works", slug: "commercial" },
};

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const project = projectsData.find((p) => p.slug === slug);
  const relatedProjects = projectsData.filter((p) => p.slug !== slug && p.type === project?.type).slice(0, 2);
  const otherProjects = projectsData.filter((p) => p.slug !== slug && p.type !== project?.type).slice(0, 1);
  const related = [...relatedProjects, ...otherProjects].slice(0, 3);

  if (!project) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Project Not Found</h1>
        <Button asChild><Link to="/projects">View All Projects</Link></Button>
      </main>
    );
  }

  const mainImage = project.images[0];
  const relatedService = typeToService[project.type];

  return (
    <main className="pt-16">
      <PageMeta
        title={`${project.title} | ${project.location} | FLASH CAST Renovation`}
        description={`${project.type} renovation project in ${project.location} by FLASH CAST — ${project.clientNeed}`}
        keywords={`${project.type} renovation ${project.location}, ${project.title}, renovation project Malaysia`}
        canonicalPath={`/projects/${project.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Projects", url: "/projects" }, { name: project.title, url: `/projects/${project.slug}` }]} />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end">
        <div className="absolute inset-0">
          <img src={mainImage} alt={project.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        </div>
        <div className="relative z-10 container-narrow px-4 md:px-8 py-12">
          <Link to="/projects" className="inline-flex items-center gap-1 text-steel-light text-sm hover:text-accent transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> All Projects
          </Link>
          <span className="text-accent text-xs font-medium uppercase tracking-wider block mb-2">{project.type}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2">{project.title}</h1>
          <div className="flex items-center gap-4 text-steel-light text-sm">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {project.location}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {project.duration}</span>
          </div>
        </div>
      </section>

      {/* Case Study Content */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* AI-readable summary */}
              <Reveal>
                <div className="p-5 bg-muted rounded-lg border border-border mb-8">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong className="text-foreground">Project Summary:</strong> {project.title} is a {project.type.toLowerCase()} renovation project completed by FLASH CAST SDN. BHD. in {project.location}, Malaysia. The project was completed in {project.duration} and included {project.scope.slice(0, 3).join(", ")}, and more.
                  </p>
                </div>
              </Reveal>

              <Reveal>
                <h2 className="font-display text-2xl font-bold mb-4">Project Overview</h2>
                <p className="text-muted-foreground leading-relaxed mb-8">{project.description}</p>
              </Reveal>

              <Reveal delay={100}>
                <h3 className="font-display text-xl font-bold mb-3">Client's Requirements</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">{project.clientNeed}</p>
              </Reveal>

              <Reveal delay={150}>
                <h3 className="font-display text-xl font-bold mb-3">Our Solution & Highlights</h3>
                <ul className="space-y-3 mb-8">
                  {project.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              {/* Gallery */}
              <Reveal delay={200}>
                <h3 className="font-display text-xl font-bold mb-4">Project Gallery</h3>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {project.images.map((img, i) => (
                    <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                      <img src={img} alt={`${project.title} - Image ${i + 1}`} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* Testimonial */}
              {project.testimonial && (
                <Reveal delay={250}>
                  <div className="p-6 bg-muted rounded-lg border border-border mb-8">
                    <Star className="w-5 h-5 text-gold mb-3" />
                    <p className="italic text-foreground mb-3 leading-relaxed">"{project.testimonial}"</p>
                    <p className="text-sm text-muted-foreground font-medium">— Client, {project.location}</p>
                  </div>
                </Reveal>
              )}

              {/* Result Summary */}
              <Reveal delay={300}>
                <div className="p-5 bg-accent/5 rounded-lg border border-accent/20">
                  <h3 className="font-display text-lg font-bold mb-2">Project Result</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    This {project.type.toLowerCase()} project in {project.location} was completed in {project.duration} by FLASH CAST's in-house team. The scope covered {project.scope.length} work items using {project.materialsUsed.length} selected materials.
                    {project.testimonial && " The client was satisfied with the quality and professionalism of the delivery."}
                    {relatedService && <> Looking for a similar project? Explore our <Link to={`/services/${relatedService.slug}`} className="text-accent hover:underline font-medium">{relatedService.name}</Link> service.</>}
                  </p>
                </div>
              </Reveal>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-4">Project Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{project.type}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{project.location}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{project.duration}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Scope Items</span><span className="font-medium">{project.scope.length} items</span></div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold">Scope of Work</h3>
                </div>
                <ul className="space-y-2">
                  {project.scope.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold">Materials Used</h3>
                </div>
                <ul className="space-y-2">
                  {project.materialsUsed.map((m) => (
                    <li key={m} className="text-sm text-muted-foreground">{m}</li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="bg-accent text-accent-foreground rounded-lg p-5 text-center">
                <h3 className="font-semibold mb-2">Want Something Similar?</h3>
                <p className="text-sm opacity-90 mb-4">Get a free consultation and quotation for your project.</p>
                <Button variant="secondary" size="sm" className="w-full mb-2 btn-press min-h-[2.75rem] text-sm font-bold tracking-wide rounded-md px-6 py-2.5 justify-center" asChild>
                  <Link to="/quote">Get a Free Quote <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                </Button>
                <Button size="sm" className="w-full bg-white text-neutral-800 hover:bg-white/90 border-0 btn-press shadow-md min-h-[2.75rem] text-sm font-semibold rounded-md px-6 py-2.5 justify-center" asChild>
                  <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="w-4 h-4 mr-1 text-[#25D366]" /> WhatsApp Us
                  </a>
                </Button>
              </div>

              {/* Related Service Link */}
              {relatedService && (
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="font-semibold text-sm mb-2">Related Service</h3>
                  <Link to={`/services/${relatedService.slug}`} className="text-accent hover:underline text-sm font-medium flex items-center gap-1">
                    {relatedService.name} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <h2 className="font-display text-2xl font-bold mb-8">More Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {related.map((p) => (
              <Link key={p.id} to={`/projects/${p.slug}`} className="group rounded-lg overflow-hidden bg-card border border-border hover-lift">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={p.images[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <span className="text-accent text-xs font-medium uppercase tracking-wider">{p.type}</span>
                  <h3 className="font-display text-base font-semibold mt-1">{p.title}</h3>
                  <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {p.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
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

export default ProjectDetail;
