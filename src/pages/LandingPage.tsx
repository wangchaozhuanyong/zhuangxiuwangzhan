import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, CheckCircle, MapPin } from "lucide-react";
import Link from "@/components/LocalizedLink";
import ImmersiveHero from "@/components/ImmersiveHero";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LandingQuoteForm from "@/components/landing/LandingQuoteForm";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import PageMeta from "@/components/PageMeta";
import SmartImage from "@/components/SmartImage";
import { SchemeAFaqList, SchemeANumberList } from "@/components/scheme-a/SchemeARoutePrimitives";
import { landingPages } from "@/data/landings";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedLandingPageBySlug } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateDisplayText } from "@/i18n/displayLabels";
import { trackCtaClick } from "@/lib/analytics";
import { toArray, toRecord, toText } from "@/lib/recordUtils";
import { landingPageText } from "@/i18n/landingPageText";
import {
  anonymizeLandingProjectCards,
  isPrivacyProtectedLanding,
} from "@/lib/landingContentPrivacy";

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = landingPageText[language];
  const fallbackPage = slug ? landingPages[slug] : undefined;
  const { data: cmsPage, isPending: pagePending } = usePublishedLandingPageBySlug(slug, language);
  const page = useMemo(() => cmsPage ?? fallbackPage ?? null, [cmsPage, fallbackPage]);
  const displayText = (value: string) => translateDisplayText(value, language);

  if (pagePending && !fallbackPage) {
    return <PublicLoadingState label="FLASH CAST" title={t.loadingTitle} description={t.loadingDescription} />;
  }

  if (!page) {
    return <main className="fc-route-page fc-route-missing"><PageMeta title={`${t.notFound} | ${t.metaSuffix}`} description={t.notFound} canonicalPath={`/landing/${slug || ""}`} noIndex /><div><h1>{t.notFound}</h1><Link to="/">{t.backHome}</Link></div></main>;
  }

  const landingPage = language === "zh"
    ? {
        ...page,
        title: displayText(page.title),
        subtitle: displayText(page.subtitle),
        heroAlt: displayText(page.heroAlt || page.title),
        description: displayText(page.description),
        benefits: toArray(page.benefits).map((item) => displayText(toText(item))),
        relatedProjects: toArray(page.relatedProjects).map((item) => {
          const project = toRecord(item);
          return { ...project, title: displayText(toText(project.title)), location: displayText(toText(project.location)) };
        }),
        faqs: toArray(page.faqs).map((item) => {
          const faq = toRecord(item);
          return { q: displayText(toText(faq.q)), a: displayText(toText(faq.a)) };
        }),
        seoTitle: displayText(page.seoTitle || ""),
        seoDescription: displayText(page.seoDescription || ""),
      }
    : page;
  const benefits = toArray(landingPage.benefits).map((item) => toText(item)).filter(Boolean);
  const rawProjects = toArray(landingPage.relatedProjects).map((item) => {
    const project = toRecord(item);
    return { title: toText(project.title), location: toText(project.location), image: toText(project.image) };
  }).filter((item) => item.title && item.image);
  const projects = anonymizeLandingProjectCards(slug, language, rawProjects);
  const projectPrivacyCopy = isPrivacyProtectedLanding(slug) ? t.projectPrivacy : null;
  const faqs = toArray(landingPage.faqs).map((item) => {
    const faq = toRecord(item);
    return { question: toText(faq.q), answer: toText(faq.a) };
  }).filter((item) => item.question && item.answer);

  return (
    <main className="fc-c-page">
      <PageMeta title={landingPage.seoTitle || `${landingPage.title} | ${t.metaSuffix}`} description={landingPage.seoDescription || stripHtml(landingPage.description)} canonicalPath={`/landing/${slug || ""}`} />

      <ImmersiveHero className="fc-c-hero" id="campaign-hero">
        <div className="fc-c-hero__media" data-cinematic-media><SmartImage src={landingPage.heroImage} alt={landingPage.heroAlt || landingPage.title} loading="eager" width={1920} height={1080} fetchPriority="high" sizes="100vw" quality={86} /></div>
        <div className="fc-c-hero__copy">
          <span className="fc-c-kicker">Kuala Lumpur / Selangor / Klang Valley</span>
          <h1>{landingPage.title}</h1>
          <p>{landingPage.subtitle}</p>
          <span className="fc-c-area"><MapPin aria-hidden="true" />{t.heroSupport}</span>
          <div className="fc-c-actions">
            <a href="#landing-quote">{t.quote}<ArrowRight aria-hidden="true" /></a>
            <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "landing_hero", { destination: "whatsapp" })}><WhatsAppIcon aria-hidden="true" /><span>{t.whatsapp}</span></a>
          </div>
        </div>
      </ImmersiveHero>

      <section className="fc-c-trust" aria-label={t.whyChoose}>{t.trustItems.slice(0, 3).map((item) => <p key={item}><CheckCircle aria-hidden="true" /><strong>{item}</strong></p>)}</section>

      <section className="fc-c-form-section">
        <LandingQuoteForm landingTitle={landingPage.title} />
        <a className="fc-c-whatsapp-band" href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "landing_form", { destination: "whatsapp" })}><WhatsAppIcon /><span><strong>{t.whatsapp}</strong><small>{t.formSubtitle}</small></span><ArrowRight /></a>
      </section>

      <section className="fc-c-section fc-c-overview">
        <header><span>{t.overview}</span><h2>{t.whyChoose}</h2></header>
        <div className="fc-c-overview__grid">
          <div className="fc-c-overview__copy">{isHtmlText(landingPage.description) ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(landingPage.description) }} /> : <p>{landingPage.description}</p>}</div>
          <ol>{benefits.map((benefit, index) => <li key={benefit}><span>{String(index + 1).padStart(2, "0")}</span><strong>{benefit}</strong></li>)}</ol>
        </div>
      </section>

      <section className="fc-c-section fc-c-process"><header><span>{t.processIntro}</span><h2>{t.processTitle}</h2></header><SchemeANumberList items={t.processSteps} /></section>

      {projects.length ? <section className="fc-c-section fc-c-projects"><header><span>{projectPrivacyCopy?.eyebrow || t.relatedProjects}</span><h2>{projectPrivacyCopy?.title || projects[0].title}</h2></header>{projectPrivacyCopy ? <p className="fc-c-projects__privacy-note">{projectPrivacyCopy.note}</p> : null}<div className="fc-c-project-grid">{projects.map((project) => <article key={`${project.title}-${project.image}`}><SmartImage src={project.image} alt={project.title} width={900} height={620} quality={84} /><div><strong>{project.title}</strong><span>{project.location}</span></div></article>)}</div></section> : null}

      <section className="fc-c-section fc-c-faq"><header><span>{t.faqTitle}</span><h2>{t.ctaTitle}</h2></header><SchemeAFaqList items={faqs} /></section>
      <section className="fc-c-final"><span>{t.ctaDescription}</span><h2>{t.ctaTitle}</h2><a href="#landing-quote">{t.quote}<ArrowRight /></a></section>
    </main>
  );
};

export default LandingPage;
