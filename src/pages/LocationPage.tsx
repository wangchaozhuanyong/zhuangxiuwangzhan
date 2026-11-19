import { isMalayContentReady } from "@/i18n/localizedContent";
import { malayText, malayFormat } from "@/i18n/malayText";
import PublicReadError from "@/components/PublicReadError";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb, JsonLdFAQ } from "@/components/JsonLd";
import CTABanner from "@/components/blocks/CTABanner";
import {
  SchemeAContentState,
  SchemeAFacts,
  SchemeAFaqList,
  SchemeALinkGrid,
  SchemeAListingGrid,
  SchemeAFeatureList,
  SchemeARouteHero,
  SchemeASection,
  type SchemeAListingItem,
} from "@/components/scheme-a/SchemeARoutePrimitives";
import { locationsData } from "@/data/locations";
import { usePublishedServiceAreaBySlug } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { mediaLabels } from "@/i18n/mediaLabels";
import { withLanguagePrefix } from "@/i18n/routes";
import { locationPageText } from "@/i18n/locationPageText";
import { getLocationContextLinks } from "@/i18n/locationContextLinks";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";
import { pageHeroImages } from "@/lib/pageHeroImages";
import { siteConfig } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildQuotePath } from "@/lib/quoteContext";
import { isHtmlText, splitContentParagraphs, stripHtml } from "@/lib/text";
import { sanitizeServiceOverviewHtml } from "@/lib/serviceOverviewHtml";
import { findSelangorWarehouseIntroLink, type WarehouseIntroLink } from "@/lib/selangorWarehouseIntroLink";

const renderIntroHtml = (html: string) => <span dangerouslySetInnerHTML={{ __html: html }} />;

function renderLinkedIntro(html: string, link: WarehouseIntroLink) {
  if (html) {
    const paragraph = document.createElement("span");
    paragraph.innerHTML = html;
    const match = (paragraph.textContent || "").match(new RegExp(
      link.anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"),
    ));
    if (match?.index !== undefined) {
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      const anchorRange = document.createRange();
      let offset = 0;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const end = offset + (node.textContent?.length || 0);
        if (match.index >= offset && match.index < end) anchorRange.setStart(node, match.index - offset);
        const endOfAnchor = match.index + match[0].length;
        if (endOfAnchor > offset && endOfAnchor <= end) {
          anchorRange.setEnd(node, endOfAnchor - offset);
          break;
        }
        offset = end;
      }
      const before = document.createRange();
      before.selectNodeContents(paragraph);
      before.setEnd(anchorRange.startContainer, anchorRange.startOffset);
      const after = document.createRange();
      after.selectNodeContents(paragraph);
      after.setStart(anchorRange.endContainer, anchorRange.endOffset);
      const renderPart = (part: Range) => {
        const span = document.createElement("span");
        let content: Node = part.cloneContents();
        const common = part.commonAncestorContainer;
        let ancestor = common instanceof Element ? common : common.parentElement;
        while (ancestor && ancestor !== paragraph) {
          const wrapper = ancestor.cloneNode(false);
          wrapper.appendChild(content);
          content = wrapper;
          ancestor = ancestor.parentElement;
        }
        span.append(content);
        return renderIntroHtml(span.innerHTML);
      };
      return <>{renderPart(before)}<Link to={link.to} className="underline underline-offset-4">{renderPart(anchorRange)}</Link>{renderPart(after)}</>;
    }
  }
  return <>{link.before}<Link to={link.to} className="underline underline-offset-4">{link.anchor}</Link>{link.after}</>;
}

export default function LocationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const copy = locationPageText[language];
  const fallback = useMemo(() => {
    if (!slug || !locationsData[slug]) return undefined;
    const loc = locationsData[slug];
    if (language !== "zh") return loc;
    return {
      ...loc,
      name: loc.nameZh || loc.name,
      metaTitle: loc.metaTitleZh || loc.metaTitle,
      description: loc.descriptionZh || loc.description,
      intro: loc.introZh || loc.intro,
      propertyTypes: loc.propertyTypesZh || loc.propertyTypes,
      commonNeeds: loc.commonNeedsZh || loc.commonNeeds,
      constructionNotes: loc.constructionNotesZh || loc.constructionNotes,
      projects: loc.projectsZh || loc.projects,
      faqs: loc.faqsZh || loc.faqs,
    };
  }, [slug, language]);
  const { data: cmsLocation, isPending, isInitialError, refetch } = usePublishedServiceAreaBySlug(slug, language);
  const location = useMemo(() => cmsLocation || fallback, [cmsLocation, fallback]);

  if (isPending && !location) return <main className="fc-route-page" data-route-pending="true"><SchemeAContentState variant="loading">{copy.loadingDescription}</SchemeAContentState></main>;
  if (isInitialError && !location) return <PublicReadError onRetry={() => void refetch()} />;
  if (!location) return <main className="fc-route-page"><PageMeta title={copy.notFound} description={copy.notFound} canonicalPath={`/locations/${slug || ""}`} noIndex /><SchemeAContentState action={<Link to="/locations">{copy.backHome}</Link>}>{copy.notFound}</SchemeAContentState></main>;

  const display = (value: string) => stripHtml(translateDisplayText(value || "", language));
  const introParagraphs = splitContentParagraphs(translateDisplayText(location.intro || "", language)).flatMap((paragraph) => {
    if (typeof document === "undefined" || !isHtmlText(paragraph)) {
      const text = stripHtml(paragraph);
      return text ? [{ text, html: "" }] : [];
    }
    const html = sanitizeServiceOverviewHtml(paragraph, language, { emphasisOnly: true });
    const fragment = document.createElement("template");
    fragment.innerHTML = html;
    const text = (fragment.content.textContent || "").replace(/\s+/g, " ").trim();
    return text ? [{ text, html }] : [];
  });
  const warehouseLink = findSelangorWarehouseIntroLink(introParagraphs.map(({ text }) => text), location.slug, language);
  const introContent = introParagraphs.map(({ text, html }, index) => warehouseLink?.paragraphIndex === index
    ? renderLinkedIntro(html, warehouseLink)
    : html ? renderIntroHtml(html) : text);
  const faqs = location.faqs.map((faq) => ({ question: display(faq.q), answer: display(faq.a) }));
  const projectItems: SchemeAListingItem[] = location.projects.map((project, index) => ({
    id: `${project.title}-${index}`,
    title: `${display(project.title)} — ${mediaLabels[language].renderingConcept}`,
    meta: `${translateProjectType(project.type, language)} · ${mediaLabels[language].renderingConcept}`,
    image: project.image,
    imageAlt: `${display(project.title)} · ${mediaLabels[language].renderingConcept}`,
    href: project.href || (project.slug ? `/projects/${project.slug}` : "/projects"),
  }));
  const contextLinks = getLocationContextLinks(location.slug, language);
  const usesReviewedLocalityContext = ["balakong", "klang", "sungai-buloh", "desa-parkcity", "semenyih", "putrajaya", "taman-tun-dr-ismail", "rawang", "seri-kembangan"].includes(location.slug);
  const quotePath = buildQuotePath({
    source: "location",
    title: location.name,
    location: location.name,
  });

  return (
    <main className="fc-route-page">
      <PageMeta malayReady={isMalayContentReady(location)} title={location.metaTitle} description={display(location.description)} keywords={copy.keywords(location.name)} canonicalPath={`/locations/${location.slug}`} />
      <JsonLdBreadcrumb items={[{ name: copy.breadcrumbHome, url: "/" }, { name: copy.breadcrumbLocations, url: "/locations" }, { name: location.name, url: `/locations/${location.slug}` }]} />
      {faqs.length ? <JsonLdFAQ faqs={faqs} /> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "LocalBusiness", name: settings.company_name, description: location.description, address: settings.address, areaServed: location.name, url: `${siteConfig.url}${withLanguagePrefix(`/locations/${location.slug}`, language)}` }) }} />
      <SchemeARouteHero
        kind="detail"
        image={pageHeroImages.locations.desktop}
        imageSourceWidth={pageHeroImages.locations.desktopWidth}
        tabletImage={pageHeroImages.locations.tablet}
        tabletImageSourceWidth={pageHeroImages.locations.tabletWidth}
        mobileImage={pageHeroImages.locations.mobile}
        mobileImageSourceWidth={pageHeroImages.locations.mobileWidth}
        imagePosition={pageHeroImages.locations.imagePosition}
        imageAlt={language === "ms" ? malayFormat("__FC0__ renovation service area planning concept", [location.name]) : (language === "zh" ? `${location.name} 装修服务范围规划示意` : `${location.name} renovation service area planning concept`)}
        label={[copy.breadcrumbLocations, mediaLabels[language].renderingConcept].join(" · ")}
        title={copy.heroTitle(location.name)}
        description={display(location.description)}
        actions={<Link to={quotePath}>{copy.quote}<ArrowUpRight aria-hidden="true" /></Link>}
      />
      <SchemeAFacts items={[
        { label: language === "ms" ? malayText("Area") : (language === "zh" ? "地区" : "Area"), value: location.name },
        { label: location.slug === "bangsar" ? copy.bangsarProjectTypes : usesReviewedLocalityContext ? copy.propertyTypeExamples : copy.propertyTypes, value: location.propertyTypes.slice(0, 2).map(display).join(" / ") },
        { label: language === "ms" ? malayText("Service") : (language === "zh" ? "服务" : "Service"), value: language === "ms" ? malayText("Design / Build") : (language === "zh" ? "设计 / 装修" : "Design / Build") },
        { label: language === "ms" ? malayText("Coordination") : (language === "zh" ? "协调" : "Coordination"), value: language === "ms" ? malayText("Management approval") : (language === "zh" ? "管理处申请" : "Management approval") },
      ]} />
      <SchemeASection title={copy.trusted(location.name)} description={introContent}>
        <SchemeAFeatureList items={location.commonNeeds.map(display)} />
      </SchemeASection>
      {location.constructionNotes ? <SchemeASection title={copy.permitNotes} description={display(location.constructionNotes)}><SchemeAFeatureList items={location.propertyTypes.map(display)} /></SchemeASection> : null}
      {projectItems.length ? <SchemeASection title={location.slug === "bangsar" ? copy.bangsarReferences : copy.featuredProjects(location.name)}><SchemeAListingGrid items={projectItems} actionLabel={copy.internalProjects} /></SchemeASection> : null}
      {contextLinks.length ? (
        <SchemeASection title={copy.resourceTitle(location.name)} description={copy.resourceDescription}>
          <SchemeALinkGrid items={contextLinks} actionLabel={copy.resourceAction} />
        </SchemeASection>
      ) : null}
      {faqs.length ? <SchemeASection title={copy.faqTitle(location.name)}><SchemeAFaqList items={faqs} /></SchemeASection> : null}
      <CTABanner
        title={copy.ctaTitle(location.name)}
        description={copy.ctaDescription(location.name)}
        quoteLabel={copy.quote}
        quotePath={quotePath}
        whatsappLabel={copy.whatsapp}
        whatsappSource={`Location Page CTA - ${location.name}`}
        whatsappMessage={usesReviewedLocalityContext ? copy.consultationMessage(location.name) : undefined}
      />
    </main>
  );
}
