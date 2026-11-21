import { SchemeASection } from "@/components/scheme-a/SchemeASection";
import PublicReadError from "@/components/PublicReadError";
import { useRef } from "react";
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
import { localizeMalayContent } from "@/i18n/malayContentRuntime";
import { isMalayContentReady } from "@/i18n/localizedContent";
import {
  anonymizeLandingProjectCards,
  isPrivacyProtectedLanding,
} from "@/lib/landingContentPrivacy";

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = landingPageText[language];
  const fallbackPage = slug ? language === "ms" ? localizeMalayContent(landingPages[slug]) : landingPages[slug] : undefined;
  const { data: cmsPage, isPending: pagePending, isInitialError, refetch } = usePublishedLandingPageBySlug(slug, language);
  const confirmedPage = useRef<{ slug: string | undefined; page: NonNullable<typeof cmsPage> } | null>(null);
  if (confirmedPage.current?.slug !== slug) confirmedPage.current = null;
  if (cmsPage) confirmedPage.current = { slug, page: cmsPage };
  else if (!pagePending && !isInitialError && cmsPage === null) confirmedPage.current = null;
  // A language query must not unmount an already displayed campaign form.
  // Retain only this slug's confirmed content while the new read is pending or
  // failed; a successful missing record still follows the existing not-found path.
  const page = cmsPage ?? fallbackPage ?? ((pagePending || isInitialError) ? confirmedPage.current?.page : null) ?? null;
  const displayText = (value: string) => translateDisplayText(value, language);

  if (pagePending && !page) {
    return <PublicLoadingState label="FLASH CAST" title={t.loadingTitle} description={t.loadingDescription} />;
  }

  if (isInitialError && !page) return <PublicReadError onRetry={() => void refetch()} />;
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
      <PageMeta malayReady={isMalayContentReady(page)} title={landingPage.seoTitle || `${landingPage.title} | ${t.metaSuffix}`} description={landingPage.seoDescription || stripHtml(landingPage.description)} canonicalPath={`/landing/${slug || ""}`} />

      <ImmersiveHero className="fc-c-hero" id="campaign-hero">
        <div className="fc-c-hero__media" data-cinematic-media><SmartImage src={landingPage.heroImage} alt={landingPage.heroAlt || landingPage.title} loading="eager" width={1920} height={1080} fetchPriority="high" sizes="100vw" quality={86} revealOnLoad critical /></div>
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
        <LandingQuoteForm
          landingTitle={landingPage.title}
          secondaryAction={
            <a className="scheme-a-button scheme-a-button--glass" href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "landing_form", { destination: "whatsapp" })}>
              <WhatsAppIcon />{t.whatsapp}
            </a>
          }
        />
      </section>

      {(landingPage.description || benefits.length > 0) && (
        <SchemeASection className="fc-c-overview" title={benefits.length ? t.whyChoose : t.overview}>
          <div className="fc-c-overview__grid">
            {landingPage.description && (
              <div className="fc-c-overview__copy">
                {isHtmlText(landingPage.description)
                  ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(landingPage.description) }} />
                  : <p>{landingPage.description}</p>}
              </div>
            )}
            {benefits.length > 0 && (
              <ol>{benefits.map((benefit, index) => (
                <li key={benefit}><span>{String(index + 1).padStart(2, "0")}</span><strong>{benefit}</strong></li>
              ))}</ol>
            )}
          </div>
        </SchemeASection>
      )}

      <SchemeASection className="fc-c-process" title={t.processTitle} description={t.processIntro}>
        <SchemeANumberList items={t.processSteps} />
      </SchemeASection>

      {projects.length > 0 && (
        <SchemeASection
          className="fc-c-projects"
          title={projectPrivacyCopy?.title || t.relatedProjects}
          description={projectPrivacyCopy?.note}
        >
          <div className="fc-c-project-grid">
            {projects.map((project) => (
              <article key={`${project.title}-${project.image}`}>
                <SmartImage src={project.image} alt={project.title} width={900} height={620} quality={84} revealOnLoad />
                <div><strong>{project.title}</strong>{project.location && <span>{project.location}</span>}</div>
              </article>
            ))}
          </div>
        </SchemeASection>
      )}

      {faqs.length > 0 && (
        <SchemeASection className="fc-c-faq" title={t.faqTitle}>
          <SchemeAFaqList items={faqs} />
        </SchemeASection>
      )}
      <section className="fc-c-final">
        <div className="scheme-a-frame fc-c-final__inner">
          <div><h2>{t.ctaTitle}</h2><p>{t.ctaDescription}</p></div>
          <a className="scheme-a-button scheme-a-button--paper" href="#landing-quote">{t.quote}<ArrowRight aria-hidden="true" /></a>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
