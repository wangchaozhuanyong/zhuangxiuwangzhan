import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { blogPosts } from "@/data/blog";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

const categories = ["All", "Guides", "Materials", "Inspiration"];

import { useState } from "react";

const Blog = () => {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? blogPosts : blogPosts.filter((p) => p.category === filter);

  return (
    <main className="pt-16">
      <PageMeta
        title="Renovation Blog & Insights | Tips & Guides | FLASH CAST Kuala Lumpur"
        description="Renovation guides, material comparisons, design tips, and industry insights for homeowners and businesses in Kuala Lumpur and Malaysia by FLASH CAST."
        keywords="renovation blog Malaysia, interior design tips KL, renovation guide Kuala Lumpur"
        canonicalPath="/blog"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }]} />
      <section className="section-padding bg-surface-dark">
        <div className="container-narrow">
          <div className="accent-line mb-4" />
          <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-4">Blog & Insights</h1>
          <p className="text-steel-light max-w-2xl text-lg">
            Renovation guides, material comparisons, design tips, and industry insights for homeowners and businesses in Malaysia.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === cat ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured Post */}
          {filter === "All" && (
            <Link to={`/blog/${filtered[0].slug}`} className="group block mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-card border border-border rounded-lg overflow-hidden hover-lift">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={filtered[0].image} alt={filtered[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <span className="text-accent text-xs font-medium uppercase tracking-wider">{filtered[0].category}</span>
                  <h2 className="font-display text-2xl font-bold mt-2 mb-3 group-hover:text-accent transition-colors">{filtered[0].title}</h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{filtered[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {filtered[0].readTime}</span>
                    <span>{filtered[0].date}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filter === "All" ? filtered.slice(1) : filtered).map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group rounded-lg overflow-hidden bg-card border border-border hover-lift">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={post.image} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-accent text-xs font-medium uppercase tracking-wider">{post.category}</span>
                    <span className="text-muted-foreground text-xs">{post.readTime}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold mb-2 group-hover:text-accent transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-8 bg-muted border-t border-border">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">Services</Link>{" · "}
            <Link to="/projects" className="text-accent hover:underline">Projects</Link>{" · "}
            <Link to="/materials" className="text-accent hover:underline">Materials</Link>{" · "}
            <Link to="/faq" className="text-accent hover:underline">FAQ</Link>{" · "}
            <Link to="/contact" className="text-accent hover:underline">Contact</Link>{" · "}
            <Link to="/quote" className="text-accent hover:underline">Get a Quote</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Blog;
