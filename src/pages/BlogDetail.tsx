import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Tag, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { blogPosts } from "@/data/blog";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);
  const otherPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 3);

  if (!post) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Article Not Found</h1>
        <Button asChild><Link to="/blog">Back to Blog</Link></Button>
      </main>
    );
  }

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, i) => {
      if (block.startsWith("## ")) {
        return <h2 key={i} className="font-display text-xl md:text-2xl font-bold mt-8 mb-3">{block.replace("## ", "")}</h2>;
      }
      if (block.startsWith("- [ ] ")) {
        const items = block.split("\n").filter(Boolean);
        return (
          <ul key={i} className="space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-muted-foreground">
                <span className="w-4 h-4 mt-0.5 border border-border rounded shrink-0" />
                <span>{item.replace("- [ ] ", "")}</span>
              </li>
            ))}
          </ul>
        );
      }
      if (block.startsWith("**")) {
        const parts = block.split("\n").filter(Boolean);
        return (
          <div key={i} className="my-4 space-y-1">
            {parts.map((line, j) => {
              const boldMatch = line.match(/^\*\*(.*?)\*\*\s*(.*)/);
              if (boldMatch) {
                return (
                  <p key={j} className="text-muted-foreground">
                    <strong className="text-foreground">{boldMatch[1]}</strong> {boldMatch[2]}
                  </p>
                );
              }
              return <p key={j} className="text-muted-foreground">{line}</p>;
            })}
          </div>
        );
      }
      return <p key={i} className="text-muted-foreground leading-relaxed my-4">{block}</p>;
    });
  };

  return (
    <main className="pt-16">
      <PageMeta
        title={`${post.title} | FLASH CAST Renovation Blog`}
        description={post.excerpt}
        keywords={post.tags.join(", ")}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
      />
      <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }, { name: post.title, url: `/blog/${post.slug}` }]} />
      <section className="section-padding bg-surface-dark">
        <div className="container-narrow max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-steel text-sm hover:text-accent transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
          </Link>
          <span className="text-accent text-xs font-medium uppercase tracking-wider block mb-3">{post.category}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-steel-light">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime} read</span>
            <span>{post.date}</span>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <div className="container-narrow max-w-3xl px-4 md:px-8 -mt-4">
        <img src={post.image} alt={post.title} className="w-full rounded-lg aspect-[2/1] object-cover" />
      </div>

      {/* Content */}
      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          <div className="prose-sm">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          <div className="mt-10 pt-6 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 bg-muted rounded-full text-muted-foreground">#{tag}</span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 p-6 bg-muted rounded-lg text-center">
            <h3 className="font-display text-xl font-bold mb-2">Ready to Start Your Project?</h3>
            <p className="text-muted-foreground text-sm mb-4">Get a free consultation and quotation from FLASH CAST.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">Get a Free Quote <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> WhatsApp Us
                </a>
              </Button>
            </div>
          </div>

          {/* Internal Links */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center text-sm">
            <Link to="/services" className="text-accent hover:underline">Our Services</Link>
            <span className="text-border">·</span>
            <Link to="/projects" className="text-accent hover:underline">Projects</Link>
            <span className="text-border">·</span>
            <Link to="/materials" className="text-accent hover:underline">Materials</Link>
            <span className="text-border">·</span>
            <Link to="/faq" className="text-accent hover:underline">FAQ</Link>
            <span className="text-border">·</span>
            <Link to="/contact" className="text-accent hover:underline">Contact</Link>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <h2 className="font-display text-2xl font-bold mb-8">More Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {otherPosts.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group rounded-lg overflow-hidden bg-card border border-border hover-lift">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={p.image} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <span className="text-accent text-xs font-medium">{p.category}</span>
                  <h3 className="font-semibold text-sm mt-1 line-clamp-2">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default BlogDetail;
