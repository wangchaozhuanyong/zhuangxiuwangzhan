import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import { Button } from "@/components/ui/button";
import { SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import { useLanguage } from "@/i18n/LanguageContext";
import { getPublishedCmsPageByPath, type PublishedCmsSection } from "@/lib/homeContentApi";
import { toText } from "@/lib/recordUtils";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import NotFound from "@/pages/NotFound";
import { pageHeroImages } from "@/lib/pageHeroImages";

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
    <div className="fc-route-cms-list">
      {items.map((item, index) => {
        const value = typeof item === "string" ? { title: item } : (item as Record<string, unknown>);
        const title = String(value.title || value.name || `Item ${index + 1}`);
        const description = String(value.description || value.content || value.text || "");
        return (
          <div key={`${title}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
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
    <SchemeASection title={title || undefined}>
        {body && (
          <div
            className="fc-route-cms-copy prose prose-neutral"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(body.includes("<") ? body : `<p>${body}</p>`) }}
          />
        )}
        {renderList(items)}
    </SchemeASection>
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
      <main className="fc-route-page">
        <PublicLoadingState label={t.loading} title={t.loadingTitle} description={t.loadingDescription} />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="fc-route-page fc-route-missing">
        <PageMeta title={t.errorTitle} description={t.errorDescription} canonicalPath={cmsPath} />
        <section>
          <div>
            <div role="alert">
              <div className="mb-4 flex items-start gap-3">
                <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <h1>{t.errorTitle}</h1>
                  <p>{t.errorDescription}</p>
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
    <main className="fc-route-page">
      <PageMeta
        title={page.seo_title || page.title}
        description={page.seo_description || page.description || t.fallbackDescription}
        keywords={page.seo_keywords}
        ogImage={heroImage}
        canonicalPath={page.path}
      />

      <SchemeARouteHero kind="content" image={heroImage || pageHeroImages.about.desktop} imageAlt={heroAlt} label="FLASH CAST SDN. BHD." title={page.title} description={page.description || t.fallbackDescription} />

      {page.content && (
        <SchemeASection>
            <div
              className="fc-route-cms-copy prose prose-neutral"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content.includes("<") ? page.content : `<p>${page.content}</p>`) }}
            />
            <div className="fc-route-action-panel"><h2>{page.cta_title || t.quote}</h2><div><Link to="/quote">{page.cta_title || t.quote}</Link><Link to="/contact">{t.fallbackDescription}</Link></div></div>
        </SchemeASection>
      )}

      {sections.map((section) => <CmsSection key={section.id} section={section} />)}
    </main>
  );
}
