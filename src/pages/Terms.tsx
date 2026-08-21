import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { termsPageText } from "@/i18n/termsPageText";



const Terms = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = termsPageText[language];
  const contactLabel = language === "zh" ? "联系信息" : "Contact";
  const emailLabel = language === "zh" ? "邮箱：" : "Email:";
  const phoneLabel = language === "zh" ? "电话：" : "Phone:";

  return (
    <main className="fc-route-page fc-route-legal-page">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/terms" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbCurrent, url: "/terms" }]} />

      <header className="fc-route-legal-intro">
        <div>
          <span className="fc-route-kicker">{t.breadcrumbCurrent}</span>
          <h1>{t.title}</h1>
          <p>{t.updated}</p>
        </div>
      </header>

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
                  {"body" in section && section.body ? <p>{section.body}</p> : null}
                  {"items" in section && section.items ? (
                    <ul>
                      {section.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                  {section.title.endsWith("Contact") || section.title.endsWith("联系") ? (
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

export default Terms;
