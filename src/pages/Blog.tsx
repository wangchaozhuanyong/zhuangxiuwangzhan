import { useMemo, useState } from "react";
import SmartImage from "@/components/SmartImage";
import Link from "@/components/LocalizedLink";
import { Clock } from "lucide-react";
import { blogPosts } from "@/data/blog";
import { usePublishedBlogPosts, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import { translateBlogCategory, translateDisplayText, translateKeywordLabel } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { formatBlogDate, formatBlogReadTime } from "@/lib/blogMeta";

const categories = [
  { value: "All", en: "All", zh: "全部" },
  { value: "Guides", en: "Guides", zh: "装修指南" },
  { value: "Materials", en: "Materials", zh: "材料知识" },
  { value: "Inspiration", en: "Inspiration", zh: "设计灵感" },
];

const normalizeCategory = (value: string) => value.trim().toLowerCase();

const matchesCategory = (postCategory: string, filter: string) => {
  if (filter === "All") return true;

  const selectedCategory = categories.find((category) => category.value === filter);
  const aliases = [
    filter,
    selectedCategory?.en,
    selectedCategory?.zh,
    translateBlogCategory(filter, "en"),
    translateBlogCategory(filter, "zh"),
  ]
    .filter(Boolean)
    .map((value) => normalizeCategory(value as string));

  return aliases.includes(normalizeCategory(postCategory));
};

const localizeFallbackPosts = (language: "en" | "zh") =>
  language === "zh"
    ? blogPosts.map((post) => ({
        ...post,
        title: translateDisplayText(post.title, language),
        excerpt: translateDisplayText(post.excerpt, language),
        content: translateDisplayText(post.content, language),
      }))
    : blogPosts;

const mergeWithFallbackCategories = (cmsPosts: typeof blogPosts, fallbackPosts: typeof blogPosts) => {
  if (!cmsPosts.length) return fallbackPosts;

  const merged = [...cmsPosts];
  const existingSlugs = new Set(merged.map((post) => post.slug));

  categories
    .filter((category) => category.value !== "All")
    .forEach((category) => {
      if (merged.some((post) => matchesCategory(post.category, category.value))) return;

      fallbackPosts
        .filter((post) => matchesCategory(post.category, category.value))
        .forEach((post) => {
          if (existingSlugs.has(post.slug)) return;
          existingSlugs.add(post.slug);
          merged.push(post);
        });
    });

  return merged;
};

const copy = {
  en: {
    metaTitle: "Renovation Blog & Insights | Tips & Guides | FLASH CAST Kuala Lumpur",
    metaDescription: "Renovation guides, material comparisons, design tips, and industry insights for homeowners and businesses in Kuala Lumpur and Malaysia by FLASH CAST.",
    metaKeywords: "renovation blog Malaysia, interior design tips KL, renovation guide Kuala Lumpur",
    breadcrumbHome: "Home",
    breadcrumbBlog: "Blog",
    heroAlt: "FLASH CAST renovation blog and design planning desk",
    eyebrow: "Renovation Insights",
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
    metaDescription: "FLASH CAST 分享马来西亚装修预算、材料比较、设计灵感和施工注意事项，帮助吉隆坡与雪兰莪业主更好规划装修。",
    metaKeywords: "马来西亚装修博客, 吉隆坡装修指南, 装修材料比较, 雪兰莪装修知识",
    breadcrumbHome: "首页",
    breadcrumbBlog: "装修博客",
    heroAlt: "FLASH CAST 装修博客与设计规划",
    eyebrow: "装修知识",
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
  const { data: pageContent } = usePublishedSitePage(language, "blog");
  const [filter, setFilter] = useState("All");
  const displayText = (value: string) => translateDisplayText(value, language);
  const displayReadTime = (value: string) => formatBlogReadTime(value, language);
  const displayDate = (value: string) => formatBlogDate(value, language);
  const { data: cmsPosts } = usePublishedBlogPosts(language);
  const posts = useMemo(() => {
    const fallbackPosts = localizeFallbackPosts(language);
    if (!cmsPosts?.length) return fallbackPosts;
    return mergeWithFallbackCategories(cmsPosts, fallbackPosts);
  }, [cmsPosts, language]);
  const filtered = posts.filter((post) => matchesCategory(post.category, filter));
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.blog);

  return (
    <main className="pt-site-header">
      <PageMeta
        title={pageContent?.seo_title || t.metaTitle}
        description={pageContent?.seo_description || t.metaDescription}
        keywords={pageContent?.seo_keywords || t.metaKeywords}
        canonicalPath="/blog"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbBlog, url: "/blog" }]} />

      <HeroBanner
        image={heroImage.desktop}
        imageMobile={heroImage.mobile}
        imageAlt={pageContent?.alt || t.heroAlt}
        label={pageContent?.subtitle || t.eyebrow}
        title={pageContent?.title || t.title}
        description={pageContent?.description || t.intro}
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="subpage-filter-bar">
            {categories.map((category) => (
              <button
                type="button"
                key={category.value}
                onClick={() => setFilter(category.value)}
                data-active={filter === category.value}
                className="subpage-filter-button"
              >
                {category[language]}
              </button>
            ))}
          </div>

          {filter === "All" && filtered[0] && (
            <Link to={`/blog/${filtered[0].slug}`} className="group block mb-10">
              <div className="luxury-card grid grid-cols-1 items-center gap-6 overflow-hidden hover-lift md:grid-cols-2">
                <div className="aspect-[16/10] overflow-hidden">
                  <SmartImage src={filtered[0].image} alt={filtered[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" width={800} height={500} />
                </div>
                <div className="p-6">
                  <span className="text-accent text-xs font-medium uppercase tracking-wider">{translateBlogCategory(filtered[0].category, language)}</span>
                  <h2 className="font-display text-2xl font-bold mt-2 mb-3 group-hover:text-accent transition-colors">{displayText(filtered[0].title)}</h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{displayText(filtered[0].excerpt)}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {displayReadTime(filtered[0].readTime)}</span>
                    <span>{displayDate(filtered[0].date)}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filter === "All" ? filtered.slice(1) : filtered).map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group luxury-card overflow-hidden hover-lift">
                <div className="aspect-[16/10] overflow-hidden">
                  <SmartImage src={post.image} alt={post.title} loading="lazy" width={600} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-accent text-xs font-medium uppercase tracking-wider">{translateBlogCategory(post.category, language)}</span>
                    <span className="text-muted-foreground text-xs">{displayReadTime(post.readTime)}</span>
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

      <section className="subpage-link-band py-8">
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
