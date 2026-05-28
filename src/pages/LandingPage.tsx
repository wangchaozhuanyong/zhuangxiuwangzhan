import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, MapPin, Star } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import CTABanner from "@/components/blocks/CTABanner";
import FAQSection from "@/components/blocks/FAQSection";
import PageMeta from "@/components/PageMeta";
import { landingPages } from "@/data/landings";
import { useLanguage } from "@/i18n/LanguageContext";
import { getPublishedLandingPageBySlug } from "@/lib/contentApi";
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
    whatsapp: "WhatsApp 咨询",
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
  whatsapp: "WhatsApp 咨询",
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
  const fallbackPage = landingPages[slug || ""];
  const [page, setPage] = useState(fallbackPage || null);
  const displayText = (value: string) => translateDisplayText(value, language);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    void getPublishedLandingPageBySlug(slug, language).then((item) => {
      if (active) setPage(item);
    });

    return () => {
      active = false;
    };
  }, [slug, language]);

  if (!page) {
    return (
      <main className="pt-16 section-padding text-center">
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
    <main className="pt-16">
      <PageMeta
        title={landingPage.seoTitle || `${landingPage.title} | ${t.metaSuffix}`}
        description={landingPage.seoDescription || stripHtml(landingPage.description)}
        canonicalPath={`/landing/${slug || ""}`}
      />
      <section className="relative min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <img src={page.heroImage} alt={landingPage.heroAlt || landingPage.title} className="w-full h-full object-cover" loading="eager" width={1920} height={800} />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/40" />
        </div>
        <div className="relative z-10 container-narrow px-4 md:px-8 py-24">
          <div className="max-w-xl">
            <p className="text-accent font-medium text-sm tracking-widest uppercase mb-3">FLASH CAST SDN. BHD.</p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground leading-tight mb-4">{landingPage.title}</h1>
            <p className="text-steel-light text-lg mb-6">{landingPage.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-bold tracking-wide shadow-xl shadow-accent/40 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md px-8 py-3 justify-center" asChild>
                <Link to="/quote">{t.quote} <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" className="btn-press w-full sm:w-auto min-h-[3rem] text-sm font-semibold bg-white text-neutral-800 border-0 hover:bg-white/90 shadow-md rounded-md px-8 py-3 justify-center" asChild>
                <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-[18px] h-[18px] mr-2 text-[#25D366]" /> {t.whatsapp}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Description + Benefits */}
      <section className="section-padding-next bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <Reveal direction="left">
              <div>
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
              <div className="bg-muted p-6 rounded-lg border border-border">
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
                  <div className="rounded-lg overflow-hidden border border-border bg-background hover-lift">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={p.image} alt={p.title} loading="lazy" width={600} height={450} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                      <p className="text-muted-foreground text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <FAQSection
        faqs={landingPage.faqs}
        className={landingPage.relatedProjects.length > 0 ? "section-padding bg-background" : "section-padding-next bg-background"}
      />

      {/* CTA */}
      <CTABanner title={t.ctaTitle} description={t.ctaDescription} quoteLabel={t.quote} whatsappLabel={t.whatsapp} />
    </main>
  );
};

export default LandingPage;
