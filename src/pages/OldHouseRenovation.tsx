import Link from "@/components/LocalizedLink";
import { ArrowRight, CheckCircle, AlertTriangle, Wrench, Droplets, Home } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import FAQSection from "@/components/blocks/FAQSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import beforeAfterImg from "@/assets/old-house-before-after.webp";
import { pageHeroImages } from "@/lib/pageHeroImages";
import { buildLocalResponsiveSrcSet } from "@/lib/localResponsiveImage";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";

const OLD_HOUSE_HERO_IMAGE_WIDTHS = [720, 900, 1200];
const OLD_HOUSE_MOBILE_HERO_IMAGE_WIDTHS = [560, 720, 900];
const OLD_HOUSE_CONTENT_IMAGE_WIDTHS = [560, 720, 900];
const oldHouseServiceImg = "/images/services/old-house-renovation.webp";

const challengeIcons = {
  alert: AlertTriangle,
  wrench: Wrench,
  droplets: Droplets,
  home: Home,
} as const;

const OldHouseRenovation = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = oldHouseRenovationPageText[language];
  const mobileHeroSrcSet =
    buildLocalResponsiveSrcSet(pageHeroImages.oldHouse.mobile, OLD_HOUSE_MOBILE_HERO_IMAGE_WIDTHS) ??
    pageHeroImages.oldHouse.mobile;

  return (
    <main className="pt-site-header">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/services/old-house" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbServices, url: "/services" }, { name: t.breadcrumbCurrent, url: "/services/old-house" }]} />

      <section className="page-hero page-hero--detail">
        <div className="page-hero__media absolute inset-0">
          <picture className="block h-full w-full">
            <source media="(max-width: 767px)" srcSet={mobileHeroSrcSet} sizes="100vw" />
            <SmartImage src={pageHeroImages.oldHouse.desktop} alt={t.heroAlt} className="page-hero__image h-full w-full object-cover" width={1920} height={720} loading="eager" fetchPriority="high" sizes="100vw" candidateWidths={OLD_HOUSE_HERO_IMAGE_WIDTHS} quality={76} />
          </picture>
          <div className="page-hero__overlay absolute inset-0 media-readable-overlay" aria-hidden="true" />
        </div>
        <div className="page-hero__content site-container">
          <p className="page-hero__label mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{t.label}</p>
          <h1 className="page-hero__title heading-safe mb-5 max-w-2xl text-3xl font-bold text-on-media md:text-5xl">{t.title}</h1>
          <p className="page-hero__description prose-safe mb-8 max-w-xl text-base text-on-media-muted md:text-lg">{t.description}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link to="/quote" className="btn-on-dark-primary min-h-12 w-full justify-center px-8 sm:w-auto">
              <ArrowRight className="h-4 w-4" /> {t.assessment}
            </Link>
            <a
              href={settings.whatsapp_url()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-on-dark-secondary min-h-12 w-full justify-center px-8 sm:w-auto"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-whatsapp" /> {t.whatsapp}
            </a>
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal direction="left">
            <div>
              <div className="subpage-local-heading--balanced">
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold">{t.introTitle}</h2>
              </div>
              {t.intro.map((paragraph) => <p key={paragraph} className="text-muted-foreground mb-4 leading-relaxed">{paragraph}</p>)}
              <div className="flex flex-wrap gap-3 mt-6">
                {t.tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent/10 text-accent px-3 py-1.5 rounded-full"><CheckCircle className="w-3 h-3" /> {tag}</span>)}
              </div>
            </div>
          </Reveal>
          <Reveal direction="right" delay={120}>
            <div className="img-zoom overflow-hidden rounded-card-lg">
              <SmartImage src={beforeAfterImg} alt={t.beforeAfterAlt} loading="lazy" width={1280} height={640} className="w-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10 md:mb-14">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t.challengesTitle}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">{t.challengesDescription}</p>
            </div>
          </Reveal>
          <div className="card-grid grid-cols-1 gap-5 sm:grid-cols-2">
            {t.challenges.map((item, i) => {
              const Icon = challengeIcons[item.icon as keyof typeof challengeIcons] || AlertTriangle;
              return (
                <Reveal key={item.title} delay={i * 80}>
                  <div className="flex h-full min-w-0 gap-4 overflow-hidden rounded-card border border-border bg-card p-5 hover-lift">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-destructive" /></div>
                    <div className="min-w-0"><h3 className="text-limit-2 font-semibold text-sm md:text-base mb-1">{item.title}</h3><p className="text-limit-3 text-muted-foreground text-sm leading-relaxed">{item.desc}</p></div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal direction="left">
            <div className="img-zoom overflow-hidden rounded-card-lg">
              <SmartImage src={oldHouseServiceImg} alt={t.serviceAlt} loading="lazy" width={960} height={720} sizes="(max-width: 1024px) 92vw, 45vw" candidateWidths={OLD_HOUSE_CONTENT_IMAGE_WIDTHS} quality={72} className="aspect-[4/3] w-full object-cover" />
            </div>
          </Reveal>
          <Reveal direction="right" delay={120}>
            <div>
              <div className="subpage-local-heading--balanced">
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold">{t.scopeTitle}</h2>
              </div>
              <p className="text-muted-foreground mb-6">{t.scopeDescription}</p>
              <ul className="subpage-copy-list subpage-copy-list--two">
                {t.scope.map((item) => (
                  <li key={item} className="subpage-copy-item">
                    <span className="subpage-copy-icon">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </span>
                    <span className="subpage-copy-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-surface-dark">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10 md:mb-14">
              <div className="accent-line mx-auto mb-4 bg-gold" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-surface-dark-foreground">{t.processTitle}</h2>
              <p className="text-sm md:text-base max-w-2xl mx-auto text-steel">{t.processDescription}</p>
            </div>
          </Reveal>
          <div className="card-grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {t.process.map((step, i) => (
              <Reveal key={step.num} delay={i * 80}>
                <div className="h-full rounded-card border border-white/10 bg-white/[0.03] p-5 text-center">
                  <span className="text-gold font-display text-3xl font-bold">{step.num}</span>
                  <h3 className="text-limit-2 font-semibold mt-2 mb-1.5 text-sm md:text-base text-surface-dark-foreground">{step.title}</h3>
                  <p className="text-limit-3 text-xs md:text-sm leading-relaxed text-steel">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <Reveal>
            <div className="text-center mb-10">
              <div className="accent-line mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t.priceTitle}</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">{t.priceDescription}</p>
            </div>
          </Reveal>
          <div className="card-grid mx-auto max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
            {t.prices.map((item, i) => (
              <Reveal key={item.type} delay={i * 80}>
                <div className="bg-card p-6 rounded-card border border-border hover-lift text-center h-full flex flex-col">
                  <h3 className="text-limit-2 font-display text-lg font-semibold mb-2">{item.type}</h3>
                  <p className="text-limit-1 text-gold font-display text-2xl font-bold mb-3">{item.range}</p>
                  <p className="text-limit-4 text-muted-foreground text-sm leading-relaxed flex-1">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FAQSection title={t.faqTitle} description={t.faqDescription} faqs={t.faqs.map((item) => ({ ...item }))} />

      <section className="subpage-link-band py-8">
        <div className="container-narrow text-center">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {t.internalLinks.map((item) => (
              <Link key={item.to} to={item.to} className="text-accent hover:underline">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default OldHouseRenovation;
