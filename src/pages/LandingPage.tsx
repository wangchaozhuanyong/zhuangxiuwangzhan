import { useParams } from "react-router-dom";
import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, MapPin, Star } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import FAQSection from "@/components/blocks/FAQSection";
import CTABanner from "@/components/blocks/CTABanner";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import PageMeta from "@/components/PageMeta";
import SmartImage from "@/components/SmartImage";
import { landingPages } from "@/data/landings";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedLandingPageBySlug } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateDisplayText } from "@/i18n/displayLabels";
import { toArray, toRecord, toText } from "@/lib/recordUtils";
import { landingPageText } from "@/i18n/landingPageText";





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
    return (
      <PublicLoadingState
        label="FLASH CAST"
        title={t.loadingTitle}
        description={t.loadingDescription}
      />
    );
  }

  if (!page) {
    return (
      <main className="pt-site-header section-padding text-center">
        <PageMeta title={`${t.notFound} | ${t.metaSuffix}`} description={t.notFound} canonicalPath={`/landing/${slug || ""}`} noIndex />
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/">{t.backHome}</Link></Button>
      </main>
    );
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
          return {
            ...project,
            title: displayText(toText(project.title)),
            location: displayText(toText(project.location)),
          };
        }),
        faqs: toArray(page.faqs).map((item) => {
          const faq = toRecord(item);
          return {
            q: displayText(toText(faq.q)),
            a: displayText(toText(faq.a)),
          };
        }),
        seoTitle: displayText(page.seoTitle || ""),
        seoDescription: displayText(page.seoDescription || ""),
      }
    : page;
  const landingBenefits = toArray(landingPage.benefits).map((item) => toText(item)).filter(Boolean);
  const landingRelatedProjects = toArray(landingPage.relatedProjects).map((item) => {
    const project = toRecord(item);
    return {
      title: toText(project.title),
      location: toText(project.location),
      image: toText(project.image),
    };
  });
  const landingFaqs = toArray(landingPage.faqs).map((item) => {
    const faq = toRecord(item);
    return {
      q: toText(faq.q),
      a: toText(faq.a),
    };
  });

  return (
    <main className="pt-site-header">
      <PageMeta
        title={landingPage.seoTitle || `${landingPage.title} | ${t.metaSuffix}`}
        description={landingPage.seoDescription || stripHtml(landingPage.description)}
        canonicalPath={`/landing/${slug || ""}`}
      />
      <section className="page-hero page-hero--detail">
        <div className="page-hero__media absolute inset-0">
          <SmartImage src={page.heroImage} alt={landingPage.heroAlt || landingPage.title} className="page-hero__image h-full w-full object-cover" loading="eager" width={1920} height={800} fetchPriority="high" />
          <div className="page-hero__overlay absolute inset-0 media-readable-overlay" aria-hidden="true" />
        </div>
        <div className="page-hero__content site-container">
          <div className="max-w-xl min-w-0">
            <p className="page-hero__label mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">FLASH CAST SDN. BHD.</p>
            <h1 className="page-hero__title heading-safe mb-4 text-3xl font-bold leading-tight text-on-media md:text-5xl">{landingPage.title}</h1>
            <p className="page-hero__description prose-safe mb-6 text-lg text-on-media-muted">{landingPage.subtitle}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link to="/quote" className="btn-on-dark-primary min-h-12 w-full justify-center px-8 sm:w-auto">
                {t.quote} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={settings.whatsapp_url()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-on-dark-secondary min-h-12 w-full justify-center px-8 sm:w-auto"
              >
                <WhatsAppIcon className="mr-2 h-[18px] w-[18px] text-whatsapp" /> {t.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Description + Benefits */}
      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <Reveal direction="left">
              <div className="subpage-side-panel p-5 md:p-7">
                <div className="subpage-local-heading--balanced">
                  <div className="accent-line mb-4" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold">{t.overview}</h2>
                </div>
                {isHtmlText(landingPage.description) ? (
                  <div className="prose prose-neutral max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHtml(landingPage.description) }} />
                ) : (
                  <p className="text-muted-foreground leading-relaxed">{landingPage.description}</p>
                )}
              </div>
            </Reveal>
            <Reveal direction="right" delay={100}>
              <div className="subpage-side-panel p-5 md:p-7">
                <h3 className="font-semibold text-base mb-4">{t.whyChoose}</h3>
                <ul className="subpage-copy-list">
                  {landingBenefits.map((b) => (
                    <li key={b} className="subpage-copy-item">
                      <span className="subpage-copy-icon">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </span>
                      <span className="subpage-copy-text">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      {landingRelatedProjects.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow">
            <Reveal>
              <div className="text-center mb-10">
                <div className="accent-line mx-auto mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{t.relatedProjects}</h2>
              </div>
            </Reveal>
            <div className="card-grid mx-auto max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
              {landingRelatedProjects.map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <div className="material-depth-card luxury-card overflow-hidden hover-lift">
                    <div className="material-depth-card__media img-zoom aspect-[4/3]">
                      <SmartImage src={p.image} alt={p.title} loading="lazy" width={600} height={450} className="w-full h-full object-cover" />
                    </div>
                    <div className="material-depth-card__body">
                      <h3 className="material-depth-card__title">{p.title}</h3>
                      <p className="material-depth-card__meta flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> <span className="min-w-0 truncate">{p.location}</span></p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <FAQSection title={t.faqTitle} faqs={landingFaqs} className="section-padding bg-background" />

      <CTABanner
        title={t.ctaTitle}
        description={t.ctaDescription}
        quoteLabel={t.quote}
        whatsappLabel={t.whatsapp}
      />
    </main>
  );
};

export default LandingPage;
