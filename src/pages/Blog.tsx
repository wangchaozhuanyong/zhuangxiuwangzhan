import { useEffect, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Clock } from "lucide-react";
import { blogPosts } from "@/data/blog";
import { getPublishedBlogPosts } from "@/lib/contentApi";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { translateBlogCategory, translateDisplayText, translateKeywordLabel } from "@/i18n/displayLabels";

const categories = [
  { value: "All", en: "All", zh: "全部" },
  { value: "Guides", en: "Guides", zh: "装修指南" },
  { value: "Materials", en: "Materials", zh: "材料知识" },
  { value: "Inspiration", en: "Inspiration", zh: "设计灵感" },
];

const copy = {
  en: {
    metaTitle: "Renovation Blog & Insights | Tips & Guides | FLASH CAST Kuala Lumpur",
    metaDescription: "Renovation guides, material comparisons, design tips, and industry insights for homeowners and businesses in Kuala Lumpur and Malaysia by FLASH CAST.",
    metaKeywords: "renovation blog Malaysia, interior design tips KL, renovation guide Kuala Lumpur",
    breadcrumbHome: "Home",
    breadcrumbBlog: "Blog",
    title: "Blog & Insights",
    intro: "Renovation guides, material comparisons, design tips, and industry insights for homeowners and businesses in Malaysia.",
    internalServices: "Services",
    internalProjects: "Projects",
    internalMaterials: "Materials",
    internalFaq: "FAQ",
    internalContact: "Contact",
    internalQuote: "Get a Quote",
  },
  zh: {
    metaTitle: "装修博客与指南 | 吉隆坡装修知识 | FLASH CAST",
    metaDescription: "FLASH CAST 分享马来西亚装修预算、材料比较、设计灵感和施工注意事项，帮助 KL 与 Selangor 业主更好规划装修。",
    metaKeywords: "马来西亚装修博客, 吉隆坡装修指南, 装修材料比较, 雪兰莪装修知识",
    breadcrumbHome: "首页",
    breadcrumbBlog: "装修博客",
    title: "装修博客与指南",
    intro: "整理装修预算、材料比较、设计灵感和施工注意事项，帮助你更清楚规划马来西亚装修项目。",
    internalServices: "服务项目",
    internalProjects: "装修案例",
    internalMaterials: "材料库",
    internalFaq: "常见问题",
    internalContact: "联系我们",
    internalQuote: "免费报价",
  },
};

const Blog = () => {
  const { language } = useLanguage();
  const t = copy[language];
  const [filter, setFilter] = useState("All");
  const displayText = (value: string) => translateDisplayText(value, language);
  const initialPosts = language === "zh"
    ? blogPosts.map((post) => ({
        ...post,
        title: displayText(post.title),
        excerpt: displayText(post.excerpt),
        content: displayText(post.content),
      }))
    : blogPosts;
  const [posts, setPosts] = useState(initialPosts);
  const filtered = filter === "All" ? posts : posts.filter((post) => post.category === filter);

  useEffect(() => {
    void getPublishedBlogPosts(language).then(setPosts);
  }, [language]);

  return (
    <main className="pt-16">
      <PageMeta
        title={t.metaTitle}
        description={t.metaDescription}
        keywords={t.metaKeywords}
        canonicalPath="/blog"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbBlog, url: "/blog" }]} />

      <section className="section-padding bg-surface-dark">
        <div className="container-narrow">
          <div className="accent-line mb-4" />
          <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-4">{t.title}</h1>
          <p className="text-steel-light max-w-2xl text-lg">{t.intro}</p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 -mx-4 px-4">
            {categories.map((category) => (
              <button
                type="button"
                key={category.value}
                onClick={() => setFilter(category.value)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === category.value ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category[language]}
              </button>
            ))}
          </div>

          {filter === "All" && filtered[0] && (
            <Link to={`/blog/${filtered[0].slug}`} className="group block mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-card border border-border rounded-lg overflow-hidden hover-lift">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={filtered[0].image} alt={filtered[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <span className="text-accent text-xs font-medium uppercase tracking-wider">{translateBlogCategory(filtered[0].category, language)}</span>
                  <h2 className="font-display text-2xl font-bold mt-2 mb-3 group-hover:text-accent transition-colors">{displayText(filtered[0].title)}</h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{displayText(filtered[0].excerpt)}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {filtered[0].readTime}</span>
                    <span>{filtered[0].date}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filter === "All" ? filtered.slice(1) : filtered).map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group rounded-lg overflow-hidden bg-card border border-border hover-lift">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={post.image} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-accent text-xs font-medium uppercase tracking-wider">{translateBlogCategory(post.category, language)}</span>
                    <span className="text-muted-foreground text-xs">{post.readTime}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold mb-2 group-hover:text-accent transition-colors line-clamp-2">{displayText(post.title)}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{displayText(post.excerpt)}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">#{translateKeywordLabel(tag, language)}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-muted border-t border-border">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">{t.internalServices}</Link>{" / "}
            <Link to="/projects" className="text-accent hover:underline">{t.internalProjects}</Link>{" / "}
            <Link to="/materials" className="text-accent hover:underline">{t.internalMaterials}</Link>{" / "}
            <Link to="/faq" className="text-accent hover:underline">{t.internalFaq}</Link>{" / "}
            <Link to="/contact" className="text-accent hover:underline">{t.internalContact}</Link>{" / "}
            <Link to="/quote" className="text-accent hover:underline">{t.internalQuote}</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Blog;
