import { useEffect, useMemo, useState } from "react";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAContentState, SchemeAFilter, SchemeAListingGrid, SchemeALoadMore, SchemeARouteHero, SchemeASection, type SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";
import { blogPosts } from "@/data/blog";
import { usePublishedBlogPosts, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { mediaLabels } from "@/i18n/mediaLabels";
import { blogCategoryFilters, blogPageText } from "@/i18n/blogPageText";
import { schemeARouteText } from "@/i18n/schemeAText";
import { translateBlogCategory, translateDisplayText } from "@/i18n/displayLabels";
import { formatBlogDate, formatBlogReadTime } from "@/lib/blogMeta";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

const PAGE_SIZE = 9;
const normalize = (value: string) => value.trim().toLowerCase();
const matchesCategory = (postCategory: string, filter: string) => filter === "All" || [filter, translateBlogCategory(filter, "en"), translateBlogCategory(filter, "zh")].map(normalize).includes(normalize(postCategory));

export default function Blog() {
  const { language } = useLanguage();
  const copy = blogPageText[language];
  const routeText = schemeARouteText[language];
  const [filter, setFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: pageContent } = usePublishedSitePage(language, "blog");
  const { data: cmsPosts, isLoading, isError, refetch } = usePublishedBlogPosts(language);
  const posts = cmsPosts?.length ? cmsPosts : blogPosts;
  const filtered = posts.filter((post) => matchesCategory(post.category, filter));
  const hero = resolvePageHeroImage(pageContent?.image_url, pageHeroImages.blog);

  useEffect(() => setVisibleCount(PAGE_SIZE), [filter]);

  const items = useMemo<SchemeAListingItem[]>(() => filtered.slice(0, visibleCount).map((post) => ({
    id: post.slug,
    title: translateDisplayText(post.title, language),
    description: translateDisplayText(post.excerpt, language),
    meta: [translateBlogCategory(post.category, language), formatBlogReadTime(post.readTime, language), formatBlogDate(post.date, language)].filter(Boolean).join(" / "),
    image: post.image,
    imageAlt: post.imageAlt || post.title,
    href: `/blog/${post.slug}`,
  })), [filtered, language, visibleCount]);

  return (
    <main className="fc-route-page">
      <PageMeta title={pageContent?.seo_title || copy.metaTitle} description={pageContent?.seo_description || copy.metaDescription} keywords={pageContent?.seo_keywords || copy.metaKeywords} canonicalPath="/blog" />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbBlog, url: "/blog" }]} />
      <SchemeARouteHero kind="listing" image={hero.desktop} imageSourceWidth={hero.desktopWidth} tabletImage={hero.tablet} tabletImageSourceWidth={hero.tabletWidth} mobileImage={hero.mobile} mobileImageSourceWidth={hero.mobileWidth} imageAlt={pageContent?.alt || copy.heroAlt} label={[pageContent?.subtitle || copy.eyebrow, hero.claimLevel ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")} title={pageContent?.title || copy.title} description={pageContent?.description || copy.intro} />
      <SchemeASection title={routeText.blogLatest} description={routeText.blogLatestText}>
        <SchemeAFilter items={blogCategoryFilters.map((category) => ({ value: category.value, label: category[language] }))} value={filter} onChange={setFilter} ariaLabel={copy.breadcrumbBlog} />
        {isLoading ? <SchemeAContentState>{routeText.blogLoading}</SchemeAContentState> : null}
        {isError ? <SchemeAContentState action={<button type="button" onClick={() => void refetch()}>{routeText.reload}</button>}>{routeText.blogError}</SchemeAContentState> : null}
        {!isLoading && !isError && !items.length ? <SchemeAContentState>{routeText.blogEmpty}</SchemeAContentState> : null}
        {!isLoading && !isError && items.length ? <SchemeAListingGrid items={items} actionLabel={copy.read} /> : null}
        {visibleCount < filtered.length ? <SchemeALoadMore label={copy.loadMore} onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} /> : null}
      </SchemeASection>
    </main>
  );
}
