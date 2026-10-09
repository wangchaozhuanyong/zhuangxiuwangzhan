import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { useParams } from "react-router-dom";

import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import { SmartImage } from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PublishedCmsSection } from "@/lib/homeContentApi";
import { publicContentQueries } from "@/lib/publicContentQueries";
import { isRecord, toRecord, toText } from "@/lib/recordUtils";
import { isSafeContentUrl, sanitizeHtml } from "@/lib/sanitizeHtml";
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
  const content = toRecord(section.content);
  if (typeof content.content === "string") return content.content;
  if (typeof content.description === "string") return content.description;
  if (typeof content.text === "string") return content.text;
  if (typeof content.body === "string") return content.body;
  return "";
};

const renderCmsBody = (body: string) => sanitizeHtml(body.includes("<") ? body : `<p>${body}</p>`);

const firstText = (...values: unknown[]) => values.find((value): value is string => typeof value === "string" && Boolean(value.trim())) || "";

const safeCmsHref = (value: unknown) => {
  if (typeof value !== "string" || !isSafeContentUrl(value)) return undefined;
  const url = new URL(value, "https://cms-content.invalid/");
  const normalized = value.trim().replace(/[\t\r\n]/g, "");
  if (url.origin === "https://cms-content.invalid" && !/^[a-z][a-z\d+.-]*:/i.test(normalized) && !normalized.startsWith("//")) {
    if (normalized.startsWith("#")) return url.hash;
    if (normalized.startsWith("?")) return `${url.search}${url.hash}`;
    return `${url.pathname}${url.search}${url.hash}`;
  }
  return url.href;
};

const CmsActionLink = ({ href, label }: { href?: string; label: string }) => href
  ? <Link to={href}>{label}</Link>
  : <a aria-disabled="true">{label}</a>;

const safeCmsImageSrc = (value: unknown) => {
  if (typeof value !== "string" || !isSafeContentUrl(value, true) || /^[#?]/.test(value.trim())) return undefined;
  return safeCmsHref(value);
};

const CmsActionPanel = ({ title, content }: { title: string; content: Record<string, unknown> }) => {
  const actions = [
    { label: firstText(content.primary_label), href: safeCmsHref(content.primary_url) },
    { label: firstText(content.secondary_label), href: safeCmsHref(content.secondary_url) },
  ].filter((action) => action.label);
  if (!title && !actions.length) return null;
  return (
    <div className="fc-route-action-panel fc-route-cms-action-panel">
      {title && <h2>{title}</h2>}
      {actions.length > 0 && <div>{actions.map((action, index) => <CmsActionLink key={index} {...action} />)}</div>}
    </div>
  );
};

const renderList = (items: unknown[], type: string) => {
  if (!items.length) return null;
  return (
    <div className="fc-route-cms-list">
      {items.map((item, index) => {
        if (typeof item !== "string" && !isRecord(item)) return null;
        const value = typeof item === "string" ? { title: item } : item;
        const title = type === "faq"
          ? firstText(value.question, value.title, value.name)
          : type === "testimonials"
            ? [firstText(value.name, value.title), firstText(value.role)].filter(Boolean).join(" · ")
            : firstText(value.title, value.name, value.heading);
        const description = type === "faq"
          ? firstText(value.answer, value.description, value.content, value.text)
          : firstText(value.quote, value.description, value.content, value.text, value.body);
        const image = safeCmsImageSrc(value.image_url);
        const avatar = type === "testimonials";
        const imageAlt = firstText(value.alt, avatar ? value.name : title, description);
        if (!title && !description && !image) return null;
        const href = safeCmsHref(value.url);
        return (
          <div key={`${title}-${index}`}>
            {image && (
              <div className={avatar ? "fc-route-cms-avatar" : "fc-route-cms-media"}>
                <SmartImage
                  src={image}
                  alt={imageAlt}
                  width={avatar ? 72 : 960}
                  height={avatar ? 72 : 600}
                  targetAspectRatio={avatar ? { width: 1, height: 1 } : { width: 16, height: 10 }}
                  resize="cover"
                  loading={index < 6 ? "eager" : "lazy"}
                  decoding="async"
                  sizes={avatar ? "72px" : "(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 90vw"}
                  showFailureFallback
                />
              </div>
            )}
            <span>{String(index + 1).padStart(2, "0")}</span>
            {title && <h3>{href ? <Link to={href} style={{ font: "inherit", color: "inherit", textDecoration: "inherit" }}>{title}</Link> : title}</h3>}
            {description && <p>{description}</p>}
          </div>
        );
      })}
    </div>
  );
};

const CmsSection = ({ section, pageBody }: { section: PublishedCmsSection; pageBody: string }) => {
  const type = section.section_type.trim().toLowerCase().replace(/-/g, "_");
  if (type.includes("hero")) return null;

  const content = toRecord(section.content);
  const title = section.title || firstText(content.title, content.heading);
  const body = getSectionBody(section);
  // The CMS mapper exposes its first rich-text section as page.content too.
  // Keep the section's title and list, but show identical body text only once.
  const sectionHtml = body ? renderCmsBody(body) : "";
  const visibleBody = pageBody && sectionHtml === renderCmsBody(pageBody) ? "" : sectionHtml;
  const items = Array.isArray(content.items) ? content.items : [];
  const isCta = type === "cta";
  const hasActions = isCta && Boolean(firstText(content.primary_label, content.secondary_label));

  if (!title && !visibleBody && !items.length && !hasActions) return null;

  return (
    <SchemeASection title={!isCta && title ? title : undefined}>
        {visibleBody && (
          <div
            className="fc-route-cms-copy prose prose-neutral"
            dangerouslySetInnerHTML={{ __html: visibleBody }}
          />
        )}
        {isCta && <CmsActionPanel title={title} content={content} />}
        {renderList(items, type)}
    </SchemeASection>
  );
};

export default function CmsDynamicPage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = copy[language];
  const cmsPath = cmsPathFromSplat(params["*"]);
  const { data: page, isInitialError: isError, isLoading, refetch } = useQuery({
    ...publicContentQueries.cmsPage(language, cmsPath),
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
  const hasCtaSection = sections.some((section) => section.section_type.trim().toLowerCase() === "cta");

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
              dangerouslySetInnerHTML={{ __html: renderCmsBody(page.content) }}
            />
            {!hasCtaSection && <CmsActionPanel title={firstText(page.cta_title, t.quote)} content={{ primary_label: firstText(page.cta_title, t.quote), primary_url: "/quote#quote-form", secondary_label: t.fallbackDescription, secondary_url: "/contact" }} />}
        </SchemeASection>
      )}

      {sections.map((section) => <CmsSection key={section.id} section={section} pageBody={page.content} />)}
    </main>
  );
}
