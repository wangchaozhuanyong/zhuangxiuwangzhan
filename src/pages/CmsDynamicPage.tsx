import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import SmartImage from "@/components/SmartImage";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { getPublishedCmsPageByPath, type PublishedCmsSection } from "@/lib/homeContentApi";
import { toText } from "@/lib/recordUtils";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import NotFound from "@/pages/NotFound";

const copy = {
  en: {
    loading: "Loading page...",
    loadingTitle: "Loading content",
    loadingDescription: "Please wait while the page content is loaded.",
    errorTitle: "Page content failed to load",
    errorDescription: "The content service did not respond correctly. You can retry or return to the main site.",
    retry: "Retry",
    quote: "Get a Free Quote",
    fallbackDescription: "Company information and service details.",
  },
  zh: {
    loading: "页面加载中...",
    loadingTitle: "正在加载页面内容",
    loadingDescription: "请稍等，系统正在读取这页的内容。",
    errorTitle: "页面内容加载失败",
    errorDescription: "内容服务暂时没有正确返回结果，可以重试一次，或先返回其它页面。",
    retry: "重新加载",
    quote: "获取免费报价",
    fallbackDescription: "公司介绍和服务内容。",
  },
};

const cmsPathFromSplat = (splat = "") => `/${splat.replace(/^\/+/, "").replace(/\/+$/, "")}`;

const getSectionBody = (section: PublishedCmsSection) => {
  const content = section.content || {};
  if (typeof content.content === "string") return content.content;
  if (typeof content.description === "string") return content.description;
  if (typeof content.text === "string") return content.text;
  return "";
};

const renderList = (items: unknown[]) => {
  if (!items.length) return null;
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const value = typeof item === "string" ? { title: item } : (item as Record<string, unknown>);
        const title = String(value.title || value.name || `Item ${index + 1}`);
        const description = String(value.description || value.content || value.text || "");
        return (
          <div key={`${title}-${index}`} className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-base font-semibold">{title}</h3>
            {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
          </div>
        );
      })}
    </div>
  );
};

const CmsSection = ({ section }: { section: PublishedCmsSection }) => {
  const type = section.section_type.toLowerCase();
  if (type.includes("hero")) return null;

  const content = section.content || {};
  const title = section.title || String(content.title || "");
  const body = getSectionBody(section);
  const items = Array.isArray(content.items) ? content.items : [];

  if (!title && !body && !items.length) return null;

  return (
    <section className="section-padding bg-background">
      <div className="container-narrow">
        {title && (
          <div className="subpage-local-heading">
            <div className="accent-line mb-4" />
            <h2 className="font-display text-2xl font-bold tracking-normal md:text-3xl">{title}</h2>
          </div>
        )}
        {body && (
          <div
            className="prose prose-neutral mt-4 max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(body.includes("<") ? body : `<p>${body}</p>`) }}
          />
        )}
        {renderList(items)}
      </div>
    </section>
  );
};

export default function CmsDynamicPage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = copy[language];
  const cmsPath = cmsPathFromSplat(params["*"]);
  const { data: page, isError, isLoading, refetch } = useQuery({
    queryKey: ["published", "cms_path", language, cmsPath],
    queryFn: () => getPublishedCmsPageByPath(language, cmsPath),
    enabled: cmsPath !== "/",
  });

  if (isLoading) {
    return (
      <main className="pt-site-header">
        <PublicLoadingState label={t.loading} title={t.loadingTitle} description={t.loadingDescription} />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="pt-site-header">
        <PageMeta title={t.errorTitle} description={t.errorDescription} canonicalPath={cmsPath} />
        <section className="section-padding bg-background">
          <div className="container-narrow">
            <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <div className="mb-4 flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <h1 className="font-display text-2xl font-bold">{t.errorTitle}</h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.errorDescription}</p>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={() => void refetch()}>
                <RefreshCw className="h-4 w-4" />
                {t.retry}
              </Button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!page) return <NotFound />;

  const sectionHeroImage = page.sections?.find((section) => section.settings?.image_url)?.settings.image_url;
  const heroImage = page.image_url || toText(sectionHeroImage);
  const heroAlt = page.alt || page.title;
  const sections = page.sections || [];

  return (
    <main className="pt-site-header">
      <PageMeta
        title={page.seo_title || page.title}
        description={page.seo_description || page.description || t.fallbackDescription}
        keywords={page.seo_keywords}
        ogImage={heroImage}
        canonicalPath={page.path}
      />

      <section className="page-hero page-hero--detail">
        {heroImage && (
          <div className="page-hero__media absolute inset-0">
            <SmartImage src={heroImage} alt={heroAlt} className="page-hero__image h-full w-full object-cover" loading="eager" width={1920} height={800} fetchPriority="high" />
            <div className="page-hero__overlay absolute inset-0 media-readable-overlay" aria-hidden="true" />
          </div>
        )}
        <div className="page-hero__content site-container">
          <div className="max-w-2xl min-w-0">
            <p className="page-hero__label mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">FLASH CAST SDN. BHD.</p>
            <h1 className="page-hero__title heading-safe mb-4 text-3xl font-bold leading-tight text-on-media md:text-5xl">{page.title}</h1>
            {page.description && <p className="page-hero__description prose-safe mb-6 text-lg text-on-media-muted">{page.description}</p>}
            <Button asChild className="min-h-12 rounded-full px-7">
              <Link to="/quote">
                {page.cta_title || t.quote} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {page.content && (
        <section className="section-padding bg-background">
          <div className="container-narrow">
            <div
              className="prose prose-neutral max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content.includes("<") ? page.content : `<p>${page.content}</p>`) }}
            />
          </div>
        </section>
      )}

      {sections.map((section) => <CmsSection key={section.id} section={section} />)}
    </main>
  );
}
