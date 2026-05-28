import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { blogPosts } from "@/data/blog";
import { getPublishedBlogPostBySlug, getPublishedBlogPosts } from "@/lib/contentApi";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateBlogCategory, translateKeywordLabel, translateDisplayText } from "@/i18n/displayLabels";

const copy = {
  en: {
    notFound: "Article Not Found",
    backToBlog: "Back to Blog",
    breadcrumbHome: "Home",
    breadcrumbBlog: "Blog",
    metaSuffix: "FLASH CAST Renovation Blog",
    readSuffix: "read",
    ctaTitle: "Ready to Start Your Project?",
    ctaText: "Get a free consultation and quotation from FLASH CAST.",
    quote: "Get a Free Quote",
    whatsapp: "WhatsApp Us",
    internalServices: "Our Services",
    internalProjects: "Projects",
    internalMaterials: "Materials",
    internalFaq: "FAQ",
    internalContact: "Contact",
    moreArticles: "More Articles",
  },
  zh: {
    notFound: "文章不存在",
    backToBlog: "返回装修博客",
    breadcrumbHome: "首页",
    breadcrumbBlog: "装修博客",
    metaSuffix: "FLASH CAST 装修博客",
    readSuffix: "阅读",
    ctaTitle: "准备开始你的装修项目？",
    ctaText: "联系 FLASH CAST 获取免费装修咨询与报价。",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 咨询",
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
  readSuffix: "阅读",
  ctaTitle: "准备开始你的装修项目？",
  ctaText: "联系 FLASH CAST 获取免费装修咨询与报价。",
  quote: "获取免费报价",
  whatsapp: "WhatsApp 咨询",
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
  const [post, setPost] = useState(initialPosts.find((item) => item.slug === slug));
  const [otherPosts, setOtherPosts] = useState(initialPosts.filter((item) => item.slug !== slug).slice(0, 3));

  useEffect(() => {
    if (!slug) return;
    void getPublishedBlogPostBySlug(slug, language).then(setPost);
    void getPublishedBlogPosts(language).then((posts) => setOtherPosts(posts.filter((item) => item.slug !== slug).slice(0, 3)));
  }, [slug, language]);

  if (!post) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/blog">{t.backToBlog}</Link></Button>
      </main>
    );
  }

  const readTime = post.readTime.includes("read") || post.readTime.includes("阅读")
    ? post.readTime
    : `${post.readTime} ${t.readSuffix}`;

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
    <main className="pt-16">
      <PageMeta
        title={`${displayText(post.title)} | ${t.metaSuffix}`}
        description={displayText(post.excerpt)}
        keywords={post.tags.join(", ")}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbBlog, url: "/blog" }, { name: displayText(post.title), url: `/blog/${post.slug}` }]} />

      <section className="section-padding bg-surface-dark">
        <div className="container-narrow max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-steel text-sm hover:text-accent transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.backToBlog}
          </Link>
          <span className="text-accent text-xs font-medium uppercase tracking-wider block mb-3">{translateBlogCategory(post.category, language)}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">{displayText(post.title)}</h1>
          <div className="flex items-center gap-4 text-sm text-steel-light">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {readTime}</span>
            <span>{post.date}</span>
          </div>
        </div>
      </section>

      <div className="container-narrow max-w-3xl px-4 md:px-8 -mt-4">
        <img src={post.image} alt={displayText(post.title)} className="w-full rounded-lg aspect-[2/1] object-cover" />
      </div>

      <section className="section-padding-next bg-background">
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

          <div className="mt-10 p-6 bg-muted rounded-lg text-center">
            <h3 className="font-display text-xl font-bold mb-2">{t.ctaTitle}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t.ctaText}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">{t.quote} <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsapp}
                </a>
              </Button>
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
              <Link key={item.id} to={`/blog/${item.slug}`} className="group rounded-lg overflow-hidden bg-card border border-border hover-lift">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
