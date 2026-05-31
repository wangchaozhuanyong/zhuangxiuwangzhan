import { useParams } from "react-router-dom";
import { useMemo } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, MapPin, Star } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import FAQSection from "@/components/blocks/FAQSection";
import CTABanner from "@/components/blocks/CTABanner";
import PageMeta from "@/components/PageMeta";
import SmartImage from "@/components/SmartImage";
import { landingPages } from "@/data/landings";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedLandingPageBySlug } from "@/hooks/usePublishedContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateDisplayText } from "@/i18n/displayLabels";

const shellCopy = {
  en: {
    notFound: "Page Not Found",
    backHome: "Back to Home",
    quote: "Get a Free Quote",
    whatsapp: "WhatsApp Us",
    overview: "Overview",
    whyChoose: "Why Choose Us",
    relatedProjects: "Related Projects",
    ctaTitle: "Ready to Get Started?",
    ctaDescription: "Contact us today for a free consultation and quotation.",
    metaSuffix: "FLASH CAST SDN. BHD.",
  },
  zh: {
    notFound: "页面不存在",
    backHome: "返回首页",
    quote: "获取免费报价",
    whatsapp: "WhatsApp 联系",
    overview: "服务概览",
    whyChoose: "为什么选择我们",
    relatedProjects: "相关案例",
    ctaTitle: "准备开始规划项目？",
    ctaDescription: "欢迎联系我们，获取免费咨询和装修报价。",
    metaSuffix: "FLASH CAST SDN. BHD.",
  },
};

const zhShellCopy = {
  notFound: "页面不存在",
  backHome: "返回首页",
  quote: "获取免费报价",
  whatsapp: "WhatsApp 联系",
  overview: "服务概览",
  whyChoose: "为什么选择我们",
  relatedProjects: "相关案例",
  ctaTitle: "准备开始规划项目？",
  ctaDescription: "欢迎联系我们，获取免费咨询和装修报价。",
  metaSuffix: "FLASH CAST SDN. BHD.",
};

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = language === "zh" ? zhShellCopy : shellCopy.en;
  const fallbackPage = slug ? landingPages[slug] : undefined;
  const { data: cmsPage } = usePublishedLandingPageBySlug(slug, language);
  const page = useMemo(() => cmsPage ?? fallbackPage ?? null, [cmsPage, fallbackPage]);
  const displayText = (value: string) => translateDisplayText(value, language);

  if (!page) {
    return (
      <main className="pt-site-header section-padding text-center">
        <PageMeta title={`${t.notFound} | ${t.metaSuffix}`} description={t.notFound} canonicalPath={`/landing/${slug || ""}`} />
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
        benefits: page.benefits.map((item) => displayText(item)),
        relatedProjects: page.relatedProjects.map((item) => ({
          ...item,
          title: displayText(item.title),
          location: displayText(item.location),
        })),
        faqs: page.faqs.map((faq) => ({ q: displayText(faq.q), a: displayText(faq.a) })),
        seoTitle: displayText(page.seoTitle || ""),
        seoDescription: displayText(page.seoDescription || ""),
      }
    : page;

  return (
    <main className="pt-site-header">
      <PageMeta
        title={landingPage.seoTitle || `${landingPage.title} | ${t.metaSuffix}`}
        description={landingPage.seoDescription || stripHtml(landingPage.description)}
        canonicalPath={`/landing/${slug || ""}`}
      />
      <section className="page-hero">
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
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{t.overview}</h2>
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
                <ul className="space-y-3">
                  {landingPage.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <span className="text-sm">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      {landingPage.relatedProjects.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-narrow">
            <Reveal>
              <div className="text-center mb-10">
                <div className="accent-line mx-auto mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">{t.relatedProjects}</h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {landingPage.relatedProjects.map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <div className="material-depth-card luxury-card overflow-hidden hover-lift">
                    <div className="material-depth-card__media img-zoom aspect-[4/3]">
                      <SmartImage src={p.image} alt={p.title} loading="lazy" width={600} height={450} className="w-full h-full object-cover" />
                    </div>
                    <div className="material-depth-card__body">
                      <h3 className="material-depth-card__title">{p.title}</h3>
                      <p className="material-depth-card__meta flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <FAQSection faqs={landingPage.faqs} className="section-padding bg-background" />

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
