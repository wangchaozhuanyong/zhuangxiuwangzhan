import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { blogPosts } from "@/data/blog";
import { usePublishedBlogPostBySlug, usePublishedBlogPosts } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import { Button } from "@/components/ui/button";
import SmartImage from "@/components/SmartImage";
import { JsonLdBlogPosting, JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { SchemeAListingGrid, SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import { isHtmlText } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateBlogCategory, translateKeywordLabel, translateDisplayText } from "@/i18n/displayLabels";
import { trackCtaClick } from "@/lib/analytics";
import { formatBlogDate, formatBlogReadTime } from "@/lib/blogMeta";
import { blogDetailPageText } from "@/i18n/blogDetailPageText";
import { pageHeroImages, resolveEditorialHeroImage } from "@/lib/pageHeroImages";
import { resolveBlogTopic } from "@/lib/blogTopics";

const EDITORIAL_STORY_IMAGES = [
  "/images/projects/generated-portfolio/mont-kiara-luxury-condo-renovation.webp",
  "/images/projects/generated-portfolio/bukit-jalil-family-condo-upgrade.webp",
  "/images/materials/art-lime-wash.webp",
] as const;

const splitEditorialSections = (content: string) =>
  content
    .replace(/\s+##\s+/g, "\n\n## ")
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

const splitSanitizedHtmlSections = (html: string) => {
  if (typeof DOMParser === "undefined") return [html];
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  const sections: string[] = [];
  let current: string[] = [];

  Array.from(documentNode.body.children).forEach((element) => {
    if (/^H[2-4]$/.test(element.tagName) && current.length) {
      sections.push(current.join(""));
      current = [];
    }
    current.push(element.outerHTML);
  });
  if (current.length) sections.push(current.join(""));
  return sections.length ? sections : [html];
};

const renderPlainParagraph = (block: string, key: string) => {
  const listParts = block.split(/\s+-\s+/).filter(Boolean);
  if (listParts.length > 2) {
    const [lead, ...items] = listParts;
    return (
      <div key={key} className="blog-editorial-copy">
        {lead ? <p>{lead}</p> : null}
        <ul>
          {items.map((item, index) => <li key={`${key}-${index}`}>{item}</li>)}
        </ul>
      </div>
    );
  }
  return <p key={key} className="blog-editorial-copy">{block}</p>;
};
const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = blogDetailPageText[language];
  const displayText = (value: string) => translateDisplayText(value, language);
  const initialPosts = language === "zh"
    ? blogPosts.map((item) => ({
        ...item,
        title: displayText(item.title),
        excerpt: displayText(item.excerpt),
        content: displayText(item.content),
      }))
    : blogPosts;
  const fallbackPost = initialPosts.find((item) => item.slug === slug);
  const {
    data: cmsPost,
    isPending: postPending,
    isError: postError,
    isFetching: postFetching,
    refetch: refetchPost,
  } = usePublishedBlogPostBySlug(slug, language);
  const { data: cmsPosts } = usePublishedBlogPosts(language);
  const post = useMemo(
    () => cmsPost ?? fallbackPost,
    [cmsPost, fallbackPost],
  );
  const otherPosts = useMemo(() => {
    const source = cmsPosts?.length ? cmsPosts : initialPosts;
    const currentTopic = post ? resolveBlogTopic(post.category, post.slug) : null;
    return source
      .filter((item) => item.slug !== slug)
      .sort((left, right) => Number(resolveBlogTopic(right.category, right.slug) === currentTopic) - Number(resolveBlogTopic(left.category, left.slug) === currentTopic))
      .slice(0, 3);
  }, [cmsPosts, initialPosts, post, slug]);

  if (postPending && !fallbackPost) {
    return (
      <PublicLoadingState
        label="FLASH CAST"
        title={t.loadingTitle}
        description={t.loadingDescription}
      />
    );
  }

  if (postError && !fallbackPost) {
    return (
      <main className="fc-route-page fc-route-missing">
        <PageMeta
          title={t.errorTitle}
          description={t.errorDescription}
          canonicalPath={`/blog/${slug || ""}`}
          noIndex
        />
        <section>
          <div role="alert">
            <div className="mb-4 flex items-start gap-3">
              <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <h1>{t.errorTitle}</h1>
                <p>{t.errorDescription}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button type="button" variant="outline" disabled={postFetching} onClick={() => void refetchPost()}>
                <RefreshCw className={`h-4 w-4 ${postFetching ? "animate-spin" : ""}`} />
                {t.retry}
              </Button>
              <Link to="/blog">{t.backToBlog}</Link>
              <Link to="/contact">{t.contact}</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="fc-route-page fc-route-missing">
        <PageMeta title={t.notFound} description={t.notFound} canonicalPath={`/blog/${slug || ""}`} noIndex />
        <div><h1>{t.notFound}</h1><Link to="/blog">{t.backToBlog}</Link></div>
      </main>
    );
  }

  const readTime = formatBlogReadTime(post.readTime, language);
  const publishDate = formatBlogDate(post.date, language);
  const articleTitle = displayText(post.title);
  const articleDescription = displayText(post.seoDescription || post.excerpt);
  const articleImageAlt = displayText(post.imageAlt || post.title);
  const articleHeroImage = resolveEditorialHeroImage(post.image, pageHeroImages.blog);

  const renderContent = (content: string) => {
    if (isHtmlText(content)) {
      const htmlSections = splitSanitizedHtmlSections(sanitizeHtml(content));
      return (
        <div className="blog-editorial-html">
          {htmlSections.map((section, index) => (
            <div key={index} className="blog-editorial-html-section" data-cinematic-section>
              <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: section }} />
              {(index + 1) % 2 === 0 ? (
                <figure className="blog-editorial-figure blog-editorial-figure--wide" data-cinematic-media>
                  <SmartImage src={EDITORIAL_STORY_IMAGES[index % EDITORIAL_STORY_IMAGES.length]} alt={t.editorialImageAlt} width={1200} height={760} sizes="(max-width: 900px) 100vw, 1100px" candidateWidths={[720, 900, 1200]} quality={78} className="h-full w-full object-cover" revealOnLoad />
                </figure>
              ) : null}
            </div>
          ))}
        </div>
      );
    }

    return splitEditorialSections(content).map((block, index) => {
      const isSection = block.startsWith("## ");
      const cleanBlock = isSection ? block.replace(/^##\s+/, "") : block;
      if (block.startsWith("- [ ] ")) {
        const items = block.split("\n").filter(Boolean);
        return (
          <ul key={index} className="blog-editorial-checklist">
            {items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <span aria-hidden="true" />
                <span>{item.replace("- [ ] ", "")}</span>
              </li>
            ))}
          </ul>
        );
      }
      return (
        <div key={index} className={`blog-editorial-section ${isSection ? "blog-editorial-section--chapter" : "blog-editorial-section--lead"}`} data-cinematic-section>
          {renderPlainParagraph(cleanBlock, `blog-block-${index}`)}
          {isSection && index % 2 === 0 ? (
            <figure className="blog-editorial-figure blog-editorial-figure--wide" data-cinematic-media>
              <SmartImage
                src={EDITORIAL_STORY_IMAGES[(index / 2) % EDITORIAL_STORY_IMAGES.length]}
                alt={t.editorialImageAlt}
                width={1200}
                height={760}
                sizes="(max-width: 900px) 100vw, 1100px"
                candidateWidths={[720, 900, 1200]}
                quality={78}
                className="h-full w-full object-cover"
                revealOnLoad
              />
            </figure>
          ) : null}
        </div>
      );
    });
  };

  return (
    <main className="fc-route-page fc-route-article-page">
      <PageMeta
        title={displayText(post.seoTitle || `${post.title} | ${t.metaSuffix}`)}
        description={articleDescription}
        keywords={post.tags.join(", ")}
        canonicalPath={`/blog/${post.slug}`}
        ogImage={post.image}
        ogType="article"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbBlog, url: "/blog" }, { name: articleTitle, url: `/blog/${post.slug}` }]} />
      <JsonLdBlogPosting
        headline={articleTitle}
        description={articleDescription}
        image={post.image}
        imageAlt={articleImageAlt}
        datePublished={post.date}
        dateModified={post.updatedAt || post.date}
        canonicalPath={`/blog/${post.slug}`}
        keywords={post.tags}
      />

      <SchemeARouteHero kind="article" image={articleHeroImage.desktop} mobileImage={articleHeroImage.mobile} imageAlt={articleImageAlt} label={`${translateBlogCategory(resolveBlogTopic(post.category, post.slug), language)} / ${publishDate} / ${readTime}`} title={articleTitle} description={displayText(post.excerpt)} />

      <SchemeASection className="fc-route-editorial">
        <div className="blog-editorial-layout">
            <header className="blog-editorial-prologue">
              <span>{t.articleLead}</span>
              <p>{displayText(post.excerpt)}</p>
            </header>

            <div className="blog-editorial-judgements" aria-label={t.designJudgements}>
              <p>{t.designJudgements}</p>
              <ol>
                {t.editorialPrinciples.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ol>
            </div>

            <article className="blog-editorial-article">
              {renderContent(displayText(post.content))}
            </article>

            <div className="blog-editorial-tags">
              <div>
                {post.tags.map((tag) => (
                  <span key={tag}>#{translateKeywordLabel(tag, language)}</span>
                ))}
              </div>
            </div>

            <div className="fc-route-action-panel">
              <h2>{t.ctaTitle}</h2>
              <p>{t.ctaText}</p>
              <div>
                <Link
                  to="/quote#quote-form"
                  onClick={() => trackCtaClick("quote", "blog_detail_cta", { destination: "/quote#quote-form" })}
                >
                  {t.quote} <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={settings.whatsapp_url()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCtaClick("whatsapp", "blog_detail_cta", { destination: "whatsapp" })}
                >
                  <WhatsAppIcon /> {t.whatsapp}
                </a>
              </div>
            </div>

            <nav className="fc-route-related-links">
              <Link to="/services" className="text-accent hover:underline">{t.internalServices}</Link>
              <Link to="/projects" className="text-accent hover:underline">{t.internalProjects}</Link>
              <Link to="/materials" className="text-accent hover:underline">{t.internalMaterials}</Link>
              <Link to="/faq" className="text-accent hover:underline">{t.internalFaq}</Link>
              <Link to="/contact" className="text-accent hover:underline">{t.internalContact}</Link>
            </nav>
        </div>
      </SchemeASection>

      <SchemeASection title={t.moreArticles}>
        <SchemeAListingGrid actionLabel={t.backToBlog} items={otherPosts.map((item) => ({ id: String(item.id), title: displayText(item.title), meta: translateBlogCategory(resolveBlogTopic(item.category, item.slug), language), image: item.image, imageAlt: item.imageAlt || item.title, href: `/blog/${item.slug}` }))} />
      </SchemeASection>
    </main>
  );
};

export default BlogDetail;
