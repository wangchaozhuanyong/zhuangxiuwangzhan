import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clock } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import HeroBanner from "@/components/blocks/HeroBanner";
import { ForestContentState, ForestFilterNav } from "@/components/forest/ForestPagePrimitives";
import { blogPosts } from "@/data/blog";
import { usePublishedBlogPosts, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { blogCategoryFilters, blogPageText } from "@/i18n/blogPageText";
import { translateBlogCategory, translateDisplayText } from "@/i18n/displayLabels";
import { forestUiText } from "@/i18n/forestUiText";
import { formatBlogDate, formatBlogReadTime } from "@/lib/blogMeta";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

const normalizeCategory = (value: string) => value.trim().toLowerCase();
const BLOG_PAGE_SIZE = 9;

const matchesCategory = (postCategory: string, filter: string) => {
  if (filter === "All") return true;
  const selectedCategory = blogCategoryFilters.find((category) => category.value === filter);
  const aliases = [filter, selectedCategory?.en, selectedCategory?.zh, translateBlogCategory(filter, "en"), translateBlogCategory(filter, "zh")]
    .filter(Boolean)
    .map((value) => normalizeCategory(value as string));
  return aliases.includes(normalizeCategory(postCategory));
};

const localizeFallbackPosts = (language: "en" | "zh") => language === "zh"
  ? blogPosts.map((post) => ({ ...post, title: translateDisplayText(post.title, language), excerpt: translateDisplayText(post.excerpt, language), content: translateDisplayText(post.content, language) }))
  : blogPosts;

const mergeWithFallbackCategories = (cmsPosts: typeof blogPosts, fallbackPosts: typeof blogPosts) => {
  if (!cmsPosts.length) return fallbackPosts;
  const merged = [...cmsPosts];
  const existingSlugs = new Set(merged.map((post) => post.slug));
  blogCategoryFilters.filter((category) => category.value !== "All").forEach((category) => {
    if (merged.some((post) => matchesCategory(post.category, category.value))) return;
    fallbackPosts.filter((post) => matchesCategory(post.category, category.value)).forEach((post) => {
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
  const [filter, setFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(BLOG_PAGE_SIZE);
  const { data: pageContent } = usePublishedSitePage(language, "blog");
  const { data: cmsPosts, isLoading, isError, refetch } = usePublishedBlogPosts(language);
  const posts = useMemo(() => {
    const fallbackPosts = localizeFallbackPosts(language);
    return cmsPosts?.length ? mergeWithFallbackCategories(cmsPosts, fallbackPosts) : fallbackPosts;
  }, [cmsPosts, language]);
  const filtered = posts.filter((post) => matchesCategory(post.category, filter));
  const visiblePosts = filtered.slice(0, visibleCount);
  const heroImage = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.blog);

  useEffect(() => setVisibleCount(BLOG_PAGE_SIZE), [filter]);

  return (
    <main className="pt-site-header">
      <PageMeta title={pageContent?.seo_title || t.metaTitle} description={pageContent?.seo_description || t.metaDescription} keywords={pageContent?.seo_keywords || t.metaKeywords} canonicalPath="/blog" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbBlog, url: "/blog" }]} />
      <HeroBanner image={heroImage.desktop} imageMobile={heroImage.mobile} imageAlt={pageContent?.alt || t.heroAlt} label={pageContent?.subtitle || t.eyebrow} title={pageContent?.title || t.title} description={pageContent?.description || t.intro} variant="compact" />

      <section className="forest-chapter forest-journal-chapter">
        <ForestFilterNav items={blogCategoryFilters.map((category) => ({ value: category.value, label: category[language] }))} value={filter} onChange={setFilter} ariaLabel={t.breadcrumbBlog} />
        {!isLoading && !isError ? <div className="forest-listing-meta"><span>{forestUiText[language].resultCount(filtered.length)}</span></div> : null}
        {isLoading ? (
          <ForestContentState variant="loading" compact />
        ) : isError ? (
          <ForestContentState variant="error" compact onRetry={() => void refetch()} />
        ) : visiblePosts.length === 0 ? (
          <ForestContentState variant="empty" compact />
        ) : (
          <div className="forest-journal-list">
            {visiblePosts.map((post, index) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="forest-journal-entry" data-lead={index === 0 && filter === "All" ? "true" : "false"}>
                <div className="forest-journal-entry__media">
                  <SmartImage src={post.image} alt={post.title} loading={index < 2 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} width={960} height={640} sizes="(max-width: 767px) 100vw, 42vw" candidateWidths={[480, 720, 960, 1200]} quality={72} />
                </div>
                <div className="forest-journal-entry__copy">
                  <p className="forest-eyebrow">{translateBlogCategory(post.category, language)}</p>
                  <h2>{translateDisplayText(post.title, language)}</h2>
                  <p>{translateDisplayText(post.excerpt, language)}</p>
                  <div className="forest-journal-entry__meta"><span><Clock aria-hidden="true" />{formatBlogReadTime(post.readTime, language)}</span><span>{formatBlogDate(post.date, language)}</span></div>
                  <span className="forest-listing-card__action">{t.read}<ArrowUpRight aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {visibleCount < filtered.length ? <div className="forest-load-more"><button type="button" className="forest-button forest-button--outline" onClick={() => setVisibleCount((count) => count + BLOG_PAGE_SIZE)}>{t.loadMore}</button></div> : null}
      </section>
    </main>
  );
};

export default Blog;
