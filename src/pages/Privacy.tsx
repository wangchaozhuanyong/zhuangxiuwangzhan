import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { privacyPageText } from "@/i18n/privacyPageText";
import { mediaLabels } from "@/i18n/mediaLabels";
import { SchemeARouteHero } from "@/components/scheme-a/SchemeARoutePrimitives";
import { pageHeroImages } from "@/lib/pageHeroImages";



const Privacy = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = privacyPageText[language];
  const contactLabel = language === "zh" ? "联系信息" : "Contact";
  const emailLabel = language === "zh" ? "邮箱：" : "Email:";
  const phoneLabel = language === "zh" ? "电话：" : "Phone:";

  return (
    <main className="fc-route-page">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/privacy" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbCurrent, url: "/privacy" }]} />

      <SchemeARouteHero
        kind="legal"
        image={pageHeroImages.contact.desktop}
        imageSourceWidth={pageHeroImages.contact.desktopWidth}
        tabletImage={pageHeroImages.contact.tablet}
        tabletImageSourceWidth={pageHeroImages.contact.tabletWidth}
        mobileImage={pageHeroImages.contact.mobile}
        mobileImageSourceWidth={pageHeroImages.contact.mobileWidth}
        imagePosition={pageHeroImages.contact.imagePosition}
        imageAlt={t.imageAlt}
        label={`${t.breadcrumbCurrent} · ${mediaLabels[language].renderingConcept}`}
        title={t.title}
        description={t.updated}
      />

      <div className="fc-route-legal-layout">
        <nav className="fc-route-legal-toc" aria-label={t.breadcrumbCurrent}>
          <span>{t.breadcrumbCurrent}</span>
          {t.sections.map((section, index) => <a key={section.title} href={`#legal-section-${index + 1}`}>{String(index + 1).padStart(2, "0")} {section.title}</a>)}
        </nav>
        <article className="fc-route-legal-document">
              {t.sections.map((section, index) => (
                <section key={section.title} id={`legal-section-${index + 1}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                  {"items" in section && section.items ? (
                    <ul>
                      {section.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                  {section.title.endsWith("Contact Us") || section.title.endsWith("联系我们") ? (
                    <address className="fc-route-legal-contact">
                      <strong>{contactLabel}</strong>
                      <p>{settings.company_name}</p>
                      <p>{settings.address}</p>
                      <p>{emailLabel} {settings.email}</p>
                      <p>{phoneLabel} {settings.phone_display}</p>
                    </address>
                  ) : null}
                </section>
              ))}
        </article>
      </div>
    </main>
  );
};

export default Privacy;
