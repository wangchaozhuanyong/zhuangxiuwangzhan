import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import CTABanner from "@/components/blocks/CTABanner";
import FAQSection from "@/components/blocks/FAQSection";
import SectionHeader from "@/components/blocks/SectionHeader";
import { locationsData } from "@/data/locations";
import { servicesData } from "@/data/services";
import { getPublishedServiceAreaBySlug } from "@/lib/contentApi";
import { useLanguage } from "@/i18n/LanguageContext";
import { withLanguagePrefix } from "@/i18n/routes";
import { siteConfig } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";

const copy = {
  en: {
    notFound: "Location Not Found",
    backHome: "Back to Home",
    breadcrumbHome: "Home",
    breadcrumbLocations: "Locations",
    keywords: (name: string) => `renovation ${name}, interior design ${name}, custom built-in ${name}`,
    heroTitle: (name: string) => `Renovation Services in ${name}`,
    quote: "Get a Free Quote",
    whatsapp: "WhatsApp Us",
    trusted: (name: string) => `Your Trusted Renovation Partner in ${name}`,
    propertyTypes: "Common Property Types:",
    servicesIn: (name: string) => `Our Services in ${name}`,
    commonNeeds: (name: string) => `Common Renovation Needs in ${name}`,
    permitNotes: "Construction & Permit Notes:",
    featuredProjects: (name: string) => `Featured Projects in ${name}`,
    faqTitle: (name: string) => `${name} Renovation FAQ`,
    ctaTitle: (name: string) => `Start Your ${name} Renovation Project`,
    ctaDescription: (name: string) => `Free consultation and site measurement for projects in ${name} and surrounding areas.`,
    internalServices: "Services",
    internalMaterials: "Materials",
    internalProjects: "Projects",
    internalBlog: "Blog",
    internalFaq: "FAQ",
    internalContact: "Contact",
  },
  zh: {
    notFound: "地区页面不存在",
    backHome: "返回首页",
    breadcrumbHome: "首页",
    breadcrumbLocations: "服务地区",
    keywords: (name: string) => `${name} 装修, ${name} 室内设计, ${name} 定制家具`,
    heroTitle: (name: string) => `${name} 装修服务`,
    quote: "获取免费报价",
    whatsapp: "WhatsApp 咨询",
    trusted: (name: string) => `${name} 值得信赖的装修伙伴`,
    propertyTypes: "常见房产类型：",
    servicesIn: (name: string) => `${name} 服务项目`,
    commonNeeds: (name: string) => `${name} 常见装修需求`,
    permitNotes: "施工与准证注意事项：",
    featuredProjects: (name: string) => `${name} 相关案例`,
    faqTitle: (name: string) => `${name} 装修常见问题`,
    ctaTitle: (name: string) => `开始规划你的 ${name} 装修项目`,
    ctaDescription: (name: string) => `${name} 与周边地区可预约免费咨询和现场测量。`,
    internalServices: "服务项目",
    internalMaterials: "材料库",
    internalProjects: "装修案例",
    internalBlog: "装修博客",
    internalFaq: "常见问题",
    internalContact: "联系我们",
  },
};

const serviceNameMap: Record<string, { en: string; zh: string }> = {
  renovation: { en: "Interior Renovation", zh: "室内装修" },
  builtin: { en: "Custom Built-In Furniture", zh: "定制内嵌家具" },
  commercial: { en: "Commercial Renovation", zh: "商业空间装修" },
  "artistic-coating": { en: "Artistic Wall Coating", zh: "艺术墙面涂装" },
  design: { en: "Design Services", zh: "设计服务" },
  exterior: { en: "Exterior Works", zh: "外墙与门面工程" },
  warehouse: { en: "Warehouse & Shelving", zh: "仓库与货架工程" },
};

const LocationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = copy[language];
  const [location, setLocation] = useState(locationsData[slug || ""]);

  useEffect(() => {
    if (!slug) return;
    void getPublishedServiceAreaBySlug(slug, language).then(setLocation);
  }, [slug, language]);

  const servicesList = servicesData.map((service) => ({
    name: serviceNameMap[service.slug]?.[language] || translateDisplayText(service.title, language),
    link: `/services/${service.slug}`,
  }));
  const displayText = (value: string) => translateDisplayText(value, language);
  const localizedFaqs = location.faqs.map((faq) => ({
    q: displayText(faq.q),
    a: displayText(faq.a),
  }));

  if (!location) {
    return (
      <main className="pt-16 section-padding text-center">
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/">{t.backHome}</Link></Button>
      </main>
    );
  }

  return (
    <main className="pt-16">
      <PageMeta
        title={location.metaTitle}
        description={stripHtml(location.description)}
        keywords={t.keywords(location.name)}
        canonicalPath={`/locations/${location.slug}`}
      />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbLocations, url: "/" }, { name: location.name, url: `/locations/${location.slug}` }]} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: settings.company_name,
            description: location.description,
            address: settings.address,
            areaServed: location.name,
            url: `${siteConfig.url}${withLanguagePrefix(`/locations/${location.slug}`, language)}`,
          }),
        }}
      />

      <section className="section-padding bg-surface-dark">
        <div className="container-narrow">
          <div className="flex items-center gap-2 text-steel text-sm mb-4">
            <Link to="/" className="hover:text-accent">{t.breadcrumbHome}</Link>
            <span>/</span>
            <Link to="/" className="hover:text-accent">{t.breadcrumbLocations}</Link>
            <span>/</span>
            <span className="text-steel-light">{location.name}</span>
          </div>
          <div className="accent-line mb-4" />
          <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            {t.heroTitle(location.name)}
          </h1>
                  <p className="text-steel-light max-w-2xl text-lg mb-2">{displayText(location.description)}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
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
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <Reveal direction="left">
              <div>
                <div className="accent-line mb-4" />
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                  {t.trusted(location.name)}
                </h2>
                <div
                  className="text-muted-foreground leading-relaxed mb-6 prose prose-sm max-w-none prose-p:my-3 prose-headings:mb-3 prose-headings:mt-6"
                  dangerouslySetInnerHTML={{
                    __html: isHtmlText(location.intro) ? location.intro : `<p>${location.intro}</p>`,
                  }}
                />
                <div className="bg-muted p-5 rounded-lg border border-border">
                  <h3 className="font-semibold text-sm mb-3">{t.propertyTypes}</h3>
                  <ul className="space-y-2">
                    {location.propertyTypes.map((propertyType: string) => (
                      <li key={propertyType} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span>{displayText(propertyType)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" delay={100}>
              <div>
                <h3 className="font-display font-semibold text-lg mb-4">{t.servicesIn(location.name)}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {servicesList.map((service) => (
                    <Link key={service.link} to={service.link} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <span className="text-sm font-medium group-hover:text-accent transition-colors">{service.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted">
        <div className="container-narrow">
          <SectionHeader title={t.commonNeeds(location.name)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {location.commonNeeds.map((need: string) => (
                    <Reveal key={need}>
                      <div className="flex items-start gap-3 p-4 bg-background border border-border rounded-lg">
                        <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-sm">{displayText(need)}</span>
                      </div>
                    </Reveal>
                  ))}
          </div>
          {location.constructionNotes && (
            <Reveal delay={200}>
              <div className="mt-8 p-5 bg-accent/5 border border-accent/20 rounded-lg max-w-3xl mx-auto">
                <h3 className="font-semibold text-sm mb-2">{t.permitNotes}</h3>
                <div
                  className="text-muted-foreground text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-3 prose-headings:mb-3 prose-headings:mt-6"
                  dangerouslySetInnerHTML={{
                    __html: isHtmlText(location.constructionNotes)
                      ? displayText(location.constructionNotes)
                      : `<p>${displayText(location.constructionNotes)}</p>`,
                  }}
                />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {location.projects.length > 0 && (
        <section className="section-padding bg-background">
          <div className="container-narrow">
            <SectionHeader title={t.featuredProjects(location.name)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {location.projects.map((project: any, index: number) => (
                    <Reveal key={project.title} delay={index * 80}>
                      <div className="rounded-lg overflow-hidden border border-border bg-card hover-lift">
                        <div className="aspect-[4/3] overflow-hidden">
                      <img src={project.image} alt={displayText(project.title)} loading="lazy" width={600} height={450} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <span className="text-accent text-[10px] font-bold uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-sm">{translateProjectType(project.type, language)}</span>
                      <h3 className="font-semibold text-sm mt-2">{displayText(project.title)}</h3>
                    </div>
                      </div>
                    </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <FAQSection title={t.faqTitle(location.name)} faqs={localizedFaqs} />

      <CTABanner
        title={t.ctaTitle(location.name)}
        description={t.ctaDescription(location.name)}
        quoteLabel={t.quote}
        whatsappLabel={t.whatsapp}
      />

      <section className="py-8 bg-background border-t border-border">
        <div className="container-narrow text-center">
          <p className="text-muted-foreground text-sm">
            <Link to="/services" className="text-accent hover:underline">{t.internalServices}</Link>{" / "}
            <Link to="/materials" className="text-accent hover:underline">{t.internalMaterials}</Link>{" / "}
            <Link to="/projects" className="text-accent hover:underline">{t.internalProjects}</Link>{" / "}
            <Link to="/blog" className="text-accent hover:underline">{t.internalBlog}</Link>{" / "}
            <Link to="/faq" className="text-accent hover:underline">{t.internalFaq}</Link>{" / "}
            <Link to="/contact" className="text-accent hover:underline">{t.internalContact}</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default LocationPage;
