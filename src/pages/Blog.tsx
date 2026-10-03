import { useMemo } from "react";
import { usePublicListingState } from "@/hooks/usePublicListingState";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAFilter, SchemeAListingGrid, SchemeALoadMore, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { blogPosts } from "@/data/blog";
import { usePublishedBlogPosts, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { mediaLabels } from "@/i18n/mediaLabels";
import { blogCategoryFilters, blogPageText, blogTopicText } from "@/i18n/blogPageText";
import { schemeARouteText } from "@/i18n/schemeAText";
import { translateBlogCategory, translateDisplayText } from "@/i18n/displayLabels";
import { formatBlogDate, formatBlogReadTime } from "@/lib/blogMeta";
import { BLOG_TOPIC_KEYS, BLOG_TOPIC_SERVICE_PATHS, getBlogTopicGuides, resolveBlogTopic } from "@/lib/blogTopics";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";
import { getBlogEditorialMedia } from "@/lib/blogEditorialMedia";
import Link from "@/components/LocalizedLink";
import "@/styles/routes/blog.css";

const PAGE_SIZE = 9;
const matchesCategory = (postCategory: string, slug: string, filter: string) =>
  filter === "all" || resolveBlogTopic(postCategory, slug) === filter;

export default function Blog() {
  const { language } = useLanguage();
  const copy = blogPageText[language];
  const routeText = schemeARouteText[language];
  const topicCopy = blogTopicText[language];
  const { filter, setFilter, visibleCount, setVisibleCount } = usePublicListingState(blogCategoryFilters.map((item) => item.value), "all", PAGE_SIZE);
  const { data: pageContent, isLoading: pageLoading } = usePublishedSitePage(language, "blog");
  const { data: cmsPosts, isLoading, isInitialError: isError, refetch } = usePublishedBlogPosts(language);
  const posts = cmsPosts?.length ? cmsPosts : blogPosts;
  const filtered = posts.filter((post) => matchesCategory(post.category, post.slug, filter));
  const hero = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.blog);


  const selectTopic = (topic: (typeof BLOG_TOPIC_KEYS)[number]) => {
    setFilter(topic, "blog-articles");
  };

  const items = useMemo<SchemeAListingItem[]>(() => filtered.slice(0, visibleCount).map((post) => ({
    id: post.slug,
    title: translateDisplayText(post.title, language),
    description: translateDisplayText(post.excerpt, language),
    meta: [translateBlogCategory(resolveBlogTopic(post.category, post.slug), language), formatBlogReadTime(post.readTime, language), formatBlogDate(post.date, language)].filter(Boolean).join(" / "),
    image: post.image,
    imageAlt: post.imageAlt || post.title,
    mediaDisclosure: getBlogEditorialMedia(post.slug)?.cmsCover === post.image
      ? getBlogEditorialMedia(post.slug)?.disclosure[language] : undefined,
    href: `/blog/${post.slug}`,
  })), [filtered, language, visibleCount]);

  return (
    <main className="fc-route-page fc-blog-page" data-route-pending={pageLoading || isLoading || undefined}>
      <PageMeta title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords || copy.metaKeywords} canonicalPath="/blog" />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbBlog, url: "/blog" }]} />
      <SchemeARouteHero kind="listing" image={hero.desktop} imageSourceWidth={hero.desktopWidth} tabletImage={hero.tablet} tabletImageSourceWidth={hero.tabletWidth} mobileImage={hero.mobile} mobileImageSourceWidth={hero.mobileWidth} imagePosition={hero.imagePosition} imageAlt={pageContent?.alt || copy.heroAlt} label={[pageContent?.subtitle || copy.eyebrow, hero.claimLevel ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")} title={pageContent?.title || copy.title} description={pageContent?.description || copy.intro} />
      <SchemeASection title={routeText.blogLatest} description={routeText.blogLatestText} className="fc-blog-articles">
        <div id="blog-articles" tabIndex={-1} role="region" aria-label={routeText.blogLatest}>
          <SchemeAFilter items={blogCategoryFilters.map((category) => ({ value: category.value, label: category[language] }))} value={filter} onChange={setFilter} ariaLabel={copy.breadcrumbBlog} />
          <div data-public-results>
          {isLoading ? <SchemeAContentState>{routeText.blogLoading}</SchemeAContentState> : null}
          {isError ? <SchemeAContentState action={<button type="button" onClick={() => void refetch()}>{routeText.reload}</button>}>{routeText.blogError}</SchemeAContentState> : null}
          {!isLoading && !isError && !items.length ? <SchemeAContentState>{routeText.blogEmpty}</SchemeAContentState> : null}
          {!isLoading && !isError && items.length ? <SchemeAListingGrid items={items} actionLabel={copy.read} /> : null}
          {visibleCount < filtered.length ? <SchemeALoadMore label={copy.loadMore} onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} /> : null}
          </div>
        </div>
      </SchemeASection>
      <SchemeASection title={topicCopy.heading} description={topicCopy.description} className="fc-blog-topics">
        <div className="fc-blog-topics__grid">
          {BLOG_TOPIC_KEYS.map((topicKey) => {
            const topicPosts = getBlogTopicGuides(posts, topicKey);
            const topic = topicCopy.topics[topicKey];
            return (
              <article key={topicKey} className="fc-blog-topic-card">
                <button type="button" onClick={() => selectTopic(topicKey)} aria-controls="blog-articles" aria-pressed={filter === topicKey}>
                  <span>{String(BLOG_TOPIC_KEYS.indexOf(topicKey) + 1).padStart(2, "0")}</span>
                  <strong>{topic.label}</strong>
                  <span>{topic.description}</span>
                </button>
                <div>
                  <b>{topicCopy.articlesLabel}</b>
                  {topicPosts.map((post) => <Link key={post.slug} to={`/blog/${post.slug}`}>{translateDisplayText(post.title, language)}</Link>)}
                </div>
                <Link className="fc-blog-topic-card__service" to={BLOG_TOPIC_SERVICE_PATHS[topicKey]}>{topicCopy.serviceLabel}</Link>
              </article>
            );
          })}
        </div>
      </SchemeASection>
    </main>
  );
}
