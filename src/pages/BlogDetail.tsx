import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { blogPosts } from "@/data/blog";
import { usePublishedBlogPostBySlug, usePublishedBlogPosts } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import SmartImage from "@/components/SmartImage";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateBlogCategory, translateKeywordLabel, translateDisplayText } from "@/i18n/displayLabels";
import { formatBlogDate, formatBlogReadTime } from "@/lib/blogMeta";

const copy = {
  en: {
    notFound: "Article Not Found",
    backToBlog: "Back to Blog",
    breadcrumbHome: "Home",
    breadcrumbBlog: "Blog",
    metaSuffix: "FLASH CAST Renovation Blog",
    ctaTitle: "Ready to Start Your Project?",
    ctaText: "Get a free consultation and quotation from FLASH CAST.",
    quote: "Get a Free Quote",
    whatsapp: "WhatsApp Us",
    internalServices: "Our Services",
    internalProjects: "Projects",
    internalMaterials: "Materials",
    internalFaq: "常见问题",
    internalContact: "Contact",
    moreArticles: "More Articles",
  },
  zh: {
    notFound: "文章不存在",
    backToBlog: "返回装修博客",
    breadcrumbHome: "首页",
    breadcrumbBlog: "装修博客",
    metaSuffix: "FLASH CAST 装修博客",
    ctaTitle: "准备开始你的装修项目？",
    ctaText: "联系 FLASH CAST 获取免费装修咨询与报价。",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 联系",
    internalServices: "服务项目",
    internalProjects: "装修案例",
    internalMaterials: "材料库",
    internalFaq: "常见问题",
    internalContact: "联系我们",
    moreArticles: "更多文章",
  },
};

const zhCopy = {
  notFound: "文章不存在",
  backToBlog: "返回装修博客",
  breadcrumbHome: "首页",
  breadcrumbBlog: "装修博客",
  metaSuffix: "FLASH CAST 装修博客",
  ctaTitle: "准备开始你的装修项目？",
  ctaText: "联系 FLASH CAST 获取免费装修咨询与报价。",
  quote: "获取免费报价",
  whatsapp: "WhatsApp 联系",
  internalServices: "服务项目",
  internalProjects: "装修案例",
  internalMaterials: "材料库",
  internalFaq: "常见问题",
  internalContact: "联系我们",
  moreArticles: "更多文章",
};

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = language === "zh" ? zhCopy : copy.en;
  const displayText = (value: string) => translateDisplayText(value, language);
  const initialPosts = language === "zh"
    ? blogPosts.map((item) => ({
        ...item,
        title: displayText(item.title),
        excerpt: displayText(item.excerpt),
        content: displayText(item.content),
      }))
    : blogPosts;
  const { data: cmsPost } = usePublishedBlogPostBySlug(slug, language);
  const { data: cmsPosts } = usePublishedBlogPosts(language);
  const post = useMemo(
    () => cmsPost ?? initialPosts.find((item) => item.slug === slug),
    [cmsPost, initialPosts, slug],
  );
  const otherPosts = useMemo(() => {
    const source = cmsPosts?.length ? cmsPosts : initialPosts;
    return source.filter((item) => item.slug !== slug).slice(0, 3);
  }, [cmsPosts, initialPosts, slug]);

  if (!post) {
    return (
      <main className="pt-site-header section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/blog">{t.backToBlog}</Link></Button>
      </main>
    );
  }

  const readTime = formatBlogReadTime(post.readTime, language);
  const publishDate = formatBlogDate(post.date, language);

  const renderContent = (content: string) => {
    if (isHtmlText(content)) {
      return <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />;
    }

    return content.split("\n\n").map((block, index) => {
      if (block.startsWith("## ")) {
        return <h2 key={index} className="font-display text-xl md:text-2xl font-bold mt-8 mb-3">{block.replace("## ", "")}</h2>;
      }
      if (block.startsWith("- [ ] ")) {
        const items = block.split("\n").filter(Boolean);
        return (
          <ul key={index} className="space-y-2 my-4">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex items-start gap-2 text-muted-foreground">
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
          <div key={index} className="my-4 space-y-1">
            {parts.map((line, lineIndex) => {
              const boldMatch = line.match(/^\*\*(.*?)\*\*\s*(.*)/);
              if (boldMatch) {
                return (
                  <p key={lineIndex} className="text-muted-foreground">
                    <strong className="text-foreground">{boldMatch[1]}</strong> {boldMatch[2]}
                  </p>
                );
              }
              return <p key={lineIndex} className="text-muted-foreground">{line}</p>;
            })}
          </div>
        );
      }
      return <p key={index} className="text-muted-foreground leading-relaxed my-4">{block}</p>;
    });
  };

  return (
    <main className="pt-site-header">
      <PageMeta
        title={`${displayText(post.title)} | ${t.metaSuffix}`}
        description={displayText(post.excerpt)}
        keywords={post.tags.join(", ")}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbBlog, url: "/blog" }, { name: displayText(post.title), url: `/blog/${post.slug}` }]} />

      <section className="page-hero">
        <div className="page-hero__media absolute inset-0">
          <SmartImage src={post.image} alt={displayText(post.title)} className="page-hero__image h-full w-full object-cover" width={1920} height={800} loading="eager" fetchPriority="high" />
          <div className="page-hero__overlay absolute inset-0 media-readable-overlay" aria-hidden="true" />
        </div>
        <div className="page-hero__content site-container max-w-3xl">
          <Link to="/blog" className="page-hero__back mb-6 inline-flex items-center gap-1.5 text-sm text-on-media-muted transition-colors hover:text-gold">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.backToBlog}
          </Link>
          <span className="page-hero__label mb-3 block font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{translateBlogCategory(post.category, language)}</span>
          <h1 className="page-hero__title heading-safe mb-4 max-w-3xl font-display text-3xl font-bold text-on-media md:text-5xl">{displayText(post.title)}</h1>
          <div className="flex items-center gap-4 text-sm text-on-media-muted">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {readTime}</span>
            <span>{publishDate}</span>
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          <div className="prose-sm">
            {renderContent(displayText(post.content))}
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 bg-muted rounded-full text-muted-foreground">#{translateKeywordLabel(tag, language)}</span>
              ))}
            </div>
          </div>

          <div className="luxury-card-muted mt-10 p-6 text-center">
            <h3 className="heading-safe mb-2 font-display text-xl font-bold">{t.ctaTitle}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{t.ctaText}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link to="/quote" className="btn-brand-primary min-h-12 w-full justify-center px-8 sm:w-auto">
                {t.quote} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={settings.whatsapp_url()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-brand-secondary min-h-12 w-full justify-center px-8 sm:w-auto"
              >
                <WhatsAppIcon className="mr-2 h-[18px] w-[18px] text-whatsapp" /> {t.whatsapp}
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-center text-sm">
            <Link to="/services" className="text-accent hover:underline">{t.internalServices}</Link>
            <span className="text-border">/</span>
            <Link to="/projects" className="text-accent hover:underline">{t.internalProjects}</Link>
            <span className="text-border">/</span>
            <Link to="/materials" className="text-accent hover:underline">{t.internalMaterials}</Link>
            <span className="text-border">/</span>
            <Link to="/faq" className="text-accent hover:underline">{t.internalFaq}</Link>
            <span className="text-border">/</span>
            <Link to="/contact" className="text-accent hover:underline">{t.internalContact}</Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <h2 className="font-display text-2xl font-bold mb-8">{t.moreArticles}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {otherPosts.map((item) => (
              <Link key={item.id} to={`/blog/${item.slug}`} className="group luxury-card overflow-hidden hover-lift">
                <div className="aspect-[16/10] overflow-hidden">
                  <SmartImage src={item.image} alt={item.title} loading="lazy" width={400} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <span className="text-accent text-xs font-medium">{item.category}</span>
                <h3 className="font-semibold text-sm mt-1 line-clamp-2">{displayText(item.title)}</h3>
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
