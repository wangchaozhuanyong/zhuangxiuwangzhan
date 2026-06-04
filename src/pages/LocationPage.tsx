import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import SmartImage from "@/components/SmartImage";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import FAQSection from "@/components/blocks/FAQSection";
import HeroBanner from "@/components/blocks/HeroBanner";
import SectionHeader from "@/components/blocks/SectionHeader";
import PublicLoadingState from "@/components/blocks/PublicLoadingState";
import { locationsData } from "@/data/locations";
import { servicesData } from "@/data/services";
import { usePublishedServiceAreaBySlug } from "@/hooks/usePublishedContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { withLanguagePrefix } from "@/i18n/routes";
import { siteConfig } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isHtmlText, stripHtml } from "@/lib/text";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { translateDisplayText, translateProjectType } from "@/i18n/displayLabels";
import { pageHeroImages } from "@/lib/pageHeroImages";
import { locationPageText } from "@/i18n/locationPageText";



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
  const t = locationPageText[language];
  const fallbackLocation = slug ? locationsData[slug] : undefined;
  const { data: cmsLocation, isPending: locationPending } = usePublishedServiceAreaBySlug(slug, language);
  const location = useMemo(() => cmsLocation ?? fallbackLocation, [cmsLocation, fallbackLocation]);

  const servicesList = servicesData.map((service) => ({
    name: serviceNameMap[service.slug]?.[language] || translateDisplayText(service.title, language),
    link: `/services/${service.slug}`,
  }));
  const displayText = (value: string) => translateDisplayText(value, language);
  const localizedFaqs = (location?.faqs ?? []).map((faq) => ({
    q: displayText(faq.q),
    a: displayText(faq.a),
  }));

  if (locationPending && !fallbackLocation) {
    return (
      <PublicLoadingState
        label="FLASH CAST"
        title={t.loadingTitle}
        description={t.loadingDescription}
      />
    );
  }

  if (!location) {
    return (
      <main className="pt-site-header section-padding text-center">
        <PageMeta title={t.notFound} description={t.notFound} canonicalPath={`/locations/${slug || ""}`} noIndex />
        <h1 className="font-display text-3xl font-bold mb-4">{t.notFound}</h1>
        <Button asChild><Link to="/">{t.backHome}</Link></Button>
      </main>
    );
  }

  return (
    <main className="pt-site-header">
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

      <HeroBanner
        image={pageHeroImages.services.desktop}
        imageMobile={pageHeroImages.services.mobile}
        imageAlt={`${location.name} renovation services`}
        label={t.breadcrumbLocations}
        title={t.heroTitle(location.name)}
        description={displayText(location.description)}
        variant="detail"
        actions={
          <>
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
          </>
        }
      />

      <section className="section-padding bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <Reveal direction="left">
              <div>
                <div className="subpage-local-heading--balanced">
                  <div className="accent-line mb-4" />
                  <h2 className="font-display text-2xl md:text-3xl font-bold">
                    {t.trusted(location.name)}
                  </h2>
                </div>
                <div
                  className="text-muted-foreground leading-relaxed mb-6 prose prose-sm max-w-none prose-p:my-3 prose-headings:mb-3 prose-headings:mt-6"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(isHtmlText(location.intro) ? location.intro : `<p>${location.intro}</p>`),
                  }}
                />
                <div className="luxury-card-muted p-5">
                  <h3 className="font-semibold text-sm mb-3">{t.propertyTypes}</h3>
                  <ul className="subpage-copy-list">
                    {location.propertyTypes.map((propertyType: string) => (
                      <li key={propertyType} className="subpage-copy-item">
                        <span className="subpage-copy-icon">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </span>
                        <span className="subpage-copy-text">{displayText(propertyType)}</span>
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
                    <Link key={service.link} to={service.link} className="group flex items-center gap-3 rounded-card border border-border bg-card p-3 transition-colors hover:border-accent/30">
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
                      <div className="subpage-copy-item">
                        <span className="subpage-copy-icon">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </span>
                        <span className="subpage-copy-text">{displayText(need)}</span>
                      </div>
                    </Reveal>
                  ))}
          </div>
          {location.constructionNotes && (
            <Reveal delay={200}>
              <div className="luxury-card-muted mx-auto mt-8 max-w-3xl p-5">
                <h3 className="font-semibold text-sm mb-2">{t.permitNotes}</h3>
                <div
                  className="text-muted-foreground text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-3 prose-headings:mb-3 prose-headings:mt-6"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      isHtmlText(location.constructionNotes)
                        ? displayText(location.constructionNotes)
                        : `<p>${displayText(location.constructionNotes)}</p>`
                    ),
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
            <div className="card-grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                  {location.projects.map((project: any, index: number) => (
                    <Reveal key={project.title} delay={index * 80}>
                      <div className="card-equal rounded-card border border-border bg-card hover-lift">
                        <div className="aspect-[4/3] overflow-hidden img-zoom">
                      <SmartImage src={project.image} alt={displayText(project.title)} loading="lazy" width={600} height={450} className="w-full h-full object-cover" />
                    </div>
                    <div className="card-equal-body p-4">
                      <span className="text-limit-1 rounded-sm bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">{translateProjectType(project.type, language)}</span>
                      <h3 className="text-limit-2 mt-2 text-sm font-semibold">{displayText(project.title)}</h3>
                    </div>
                      </div>
                    </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <FAQSection title={t.faqTitle(location.name)} faqs={localizedFaqs} />

      <section className="subpage-link-band py-8">
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
