import { useMemo } from "react";
import { MapPin } from "lucide-react";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { SchemeAFacts, SchemeANumberList, SchemeARouteHero, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import { coreValues, teamHighlights } from "@/data/siteContent";
import { usePublishedAboutSection, usePublishedSitePage } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { aboutCopy, aboutMilestoneCopy, aboutStatCopy, aboutTeamCopy, aboutValueCopy } from "@/i18n/aboutContent";
import { mediaLabels } from "@/i18n/mediaLabels";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

const localizedValues = {
  en: coreValues.map((item, index) => ({ ...item, title: aboutValueCopy.en[index]?.title || item.title, desc: aboutValueCopy.en[index]?.desc || item.desc })),
  zh: coreValues.map((item, index) => ({ ...item, title: aboutValueCopy.zh[index]?.title || item.title, desc: aboutValueCopy.zh[index]?.desc || item.desc })),
};
const localizedTeam = {
  en: teamHighlights.map((item, index) => ({ ...item, title: aboutTeamCopy.en[index]?.title || item.title, desc: aboutTeamCopy.en[index]?.desc || item.desc })),
  zh: teamHighlights.map((item, index) => ({ ...item, title: aboutTeamCopy.zh[index]?.title || item.title, desc: aboutTeamCopy.zh[index]?.desc || item.desc })),
};
type AboutCard = { title: string; desc: string };

const normalizeCards = (items: unknown, fallback: AboutCard[]) => {
  if (!Array.isArray(items) || !items.length) return null;
  const normalized = items.map((item, index) => {
    const record = item as Record<string, unknown>;
    return { title: String(record.title || record.title_zh || record.title_en || fallback[index]?.title || "").trim(), desc: String(record.desc || record.desc_zh || record.desc_en || fallback[index]?.desc || "").trim() };
  }).filter((item) => item.title && item.desc);
  return normalized.length ? normalized : null;
};

const About = () => {
  const { language } = useLanguage();
  const t = aboutCopy[language];
  const settings = useSiteSettings();
  const { data: heroSection } = usePublishedAboutSection(language, "hero");
  const { data: statsSection } = usePublishedAboutSection(language, "stats");
  const { data: valuesSection } = usePublishedAboutSection(language, "core_values");
  const { data: pageContent } = usePublishedSitePage(language, "about");

  const introParagraphs: readonly string[] = t.intro;
  const stats = useMemo(() => {
    const items = statsSection?.items;
    if (!Array.isArray(items)) return aboutStatCopy[language];
    const values = items.map((item) => { const record = item as Record<string, unknown>; return { value: String(record.value || ""), label: String(record.label || "") }; }).filter((item) => item.value && item.label);
    return values.length ? values : aboutStatCopy[language];
  }, [statsSection?.items, language]);
  const milestones = aboutMilestoneCopy[language];
  const values = useMemo(() => normalizeCards(valuesSection?.items, localizedValues[language]) || localizedValues[language], [valuesSection?.items, language]);
  const team = localizedTeam[language];
  const heroImage = resolvePageHeroImage(pageContent?.image_url || (heroSection?.image_url as string | undefined), pageHeroImages.about);
  const officeDescription = settings.address ? t.officeAddress.replace("{address}", settings.address) : t.officeDescription;

  return (
    <main className="fc-route-page">
      <PageMeta title={pageContent?.seo_title || t.metaTitle} description={pageContent?.seo_description || t.metaDescription} keywords={pageContent?.seo_keywords || t.metaKeywords} canonicalPath="/about" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbAbout, url: "/about" }]} />
      <SchemeARouteHero kind="content" image={heroImage.desktop} imageSourceWidth={heroImage.desktopWidth} tabletImage={heroImage.tablet} tabletImageSourceWidth={heroImage.tabletWidth} mobileImage={heroImage.mobile} mobileImageSourceWidth={heroImage.mobileWidth} imageAlt={pageContent?.alt || t.imageAlt} label={[t.label, heroImage.claimLevel ? mediaLabels[language].renderingConcept : ""].filter(Boolean).join(" · ")} title={(heroSection?.title as string) || t.title} description={t.description} />

      <SchemeASection title={t.introTitle} description={introParagraphs.join(" ")}>
        <SchemeAFacts items={stats} />
        <div className="fc-route-tagline" aria-label={t.label}>{t.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </SchemeASection>

      <SchemeASection title={(valuesSection?.title as string) || t.valuesTitle} description={(valuesSection?.content as string) || t.valuesDescription}>
        <SchemeANumberList items={values.map((item) => ({ title: item.title, description: item.desc }))} />
      </SchemeASection>

      <SchemeASection title={t.teamTitle} description={t.teamDescription}>
        <SchemeANumberList items={team.map((item) => ({ title: item.title, description: item.desc }))} />
      </SchemeASection>

      <SchemeASection title={t.journeyTitle} description={t.journeyDescription}>
        <ol className="fc-route-history">{milestones.map((item) => <li key={`${item.year}-${item.title}`}><span className="fc-route-history-index">{item.year}</span><div><strong>{item.title}</strong><p>{item.desc}</p></div></li>)}</ol>
      </SchemeASection>

      <SchemeASection title={t.officeTitle} description={officeDescription} className="fc-route-office">
        <div className="fc-route-office-grid">
          <div className="fc-route-office-copy"><MapPin aria-hidden="true" /><h2>{settings.company_name}</h2><address>{settings.address}</address><p>{t.visitNote}</p></div>
          <GoogleMapEmbed title={t.mapTitle} addressLabel={settings.address} latitude={settings.map_latitude} longitude={settings.map_longitude} height={360} className="min-h-[360px]" />
        </div>
      </SchemeASection>
    </main>
  );
};

export default About;
