import { useEffect, useMemo, useState } from "react";
import SmartImage from "@/components/SmartImage";
import Link from "@/components/LocalizedLink";
import { Clock } from "lucide-react";
import { blogPosts } from "@/data/blog";
import { usePublishedBlogPosts, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import Reveal from "@/components/Reveal";
import { translateBlogCategory, translateDisplayText, translateKeywordLabel } from "@/i18n/displayLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { formatBlogDate, formatBlogReadTime } from "@/lib/blogMeta";
import { blogCategoryFilters, blogPageText } from "@/i18n/blogPageText";

const normalizeCategory = (value: string) => value.trim().toLowerCase();
const BLOG_PAGE_SIZE = 9;
const BLOG_FEATURED_IMAGE_WIDTHS = [560, 720, 900, 1200];
const BLOG_CARD_IMAGE_WIDTHS = [360, 560, 720];

const matchesCategory = (postCategory: string, filter: string) => {
  if (filter === "All") return true;

  const selectedCategory = blogCategoryFilters.find((category) => category.value === filter);
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

  blogCategoryFilters
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



const Blog = () => {
  const { language } = useLanguage();
  const t = blogPageText[language];
  const { data: pageContent } = usePublishedSitePage(language, "blog");
  const [filter, setFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(BLOG_PAGE_SIZE);
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
  const gridPosts = filter === "All" ? filtered.slice(1) : filtered;
  const visiblePosts = gridPosts.slice(0, visibleCount);
  const hasMorePosts = visibleCount < gridPosts.length;
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.blog);

  useEffect(() => {
    setVisibleCount(BLOG_PAGE_SIZE);
  }, [filter]);

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
          <Reveal direction="none">
            <div className="subpage-filter-bar">
              {blogCategoryFilters.map((category) => (
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
          </Reveal>

          {filter === "All" && filtered[0] && (
            <Reveal delay={80}>
              <Link to={`/blog/${filtered[0].slug}`} className="group block mb-10">
                <div className="luxury-card grid grid-cols-1 items-center gap-6 overflow-hidden hover-lift md:grid-cols-2">
                  <div className="aspect-[16/10] overflow-hidden img-zoom">
                    <SmartImage src={filtered[0].image} alt={filtered[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" width={800} height={500} sizes="(max-width: 768px) 92vw, 45vw" candidateWidths={BLOG_FEATURED_IMAGE_WIDTHS} quality={72} />
                  </div>
                  <div className="p-6">
                    <span className="text-accent text-xs font-medium uppercase tracking-wider">{translateBlogCategory(filtered[0].category, language)}</span>
                    <h2 className="text-limit-2 font-display text-2xl font-bold mt-2 mb-3 group-hover:text-accent transition-colors">{displayText(filtered[0].title)}</h2>
                    <p className="text-limit-3 text-muted-foreground text-sm mb-4">{displayText(filtered[0].excerpt)}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {displayReadTime(filtered[0].readTime)}</span>
                      <span>{displayDate(filtered[0].date)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          )}

          <div className="card-grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post, index) => (
              <Reveal key={post.id} delay={index * 70} direction="none">
                <Link to={`/blog/${post.slug}`} className="card-equal group luxury-card hover-lift">
                  <div className="aspect-[16/10] overflow-hidden img-zoom">
                    <SmartImage src={post.image} alt={post.title} loading="lazy" width={600} height={400} sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw" candidateWidths={BLOG_CARD_IMAGE_WIDTHS} quality={72} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="card-equal-body p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-accent text-xs font-medium uppercase tracking-wider">{translateBlogCategory(post.category, language)}</span>
                      <span className="text-muted-foreground text-xs">{displayReadTime(post.readTime)}</span>
                    </div>
                    <h3 className="text-limit-2 font-display text-base font-semibold mb-2 group-hover:text-accent transition-colors">{displayText(post.title)}</h3>
                    <p className="text-limit-2 text-muted-foreground text-sm">{displayText(post.excerpt)}</p>
                    <div className="module-card-footer flex flex-wrap gap-1 pt-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">#{translateKeywordLabel(tag, language)}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {hasMorePosts ? (
            <Reveal delay={120}>
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  className="btn-brand-secondary min-h-12 px-8"
                  onClick={() => setVisibleCount((count) => count + BLOG_PAGE_SIZE)}
                >
                  {t.loadMore}
                </button>
              </div>
            </Reveal>
          ) : null}
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
