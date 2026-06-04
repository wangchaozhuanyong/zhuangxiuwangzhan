import Reveal from "@/components/Reveal";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb } from "@/components/JsonLd";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { privacyPageText } from "@/i18n/privacyPageText";



const Privacy = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = privacyPageText[language];
  const contactLabel = language === "zh" ? "联系信息" : "Contact";
  const emailLabel = language === "zh" ? "邮箱：" : "Email:";
  const phoneLabel = language === "zh" ? "电话：" : "Phone:";

  return (
    <main className="pt-site-header">
      <PageMeta title={t.metaTitle} description={t.metaDescription} keywords={t.metaKeywords} canonicalPath="/privacy" />
      <JsonLdBreadcrumb items={[{ name: t.breadcrumbHome, url: "/" }, { name: t.breadcrumbCurrent, url: "/privacy" }]} />

      <section className="legal-hero section-padding">
        <div className="container-narrow max-w-3xl text-center">
          <Reveal>
            <div className="accent-line mb-4 mx-auto" />
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold">{t.breadcrumbCurrent}</p>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">{t.title}</h1>
            <p className="text-sm text-surface-dark-foreground/70">{t.updated}</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-narrow max-w-3xl">
          <Reveal>
            <article className="legal-document subpage-form-panel">
              {t.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="font-display text-xl font-bold mb-3">{section.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{section.body}</p>
                  {"items" in section && section.items ? (
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                      {section.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                  {section.title.endsWith("Contact Us") || section.title.endsWith("联系我们") ? (
                    <div className="luxury-card-muted p-5 mt-3 text-sm text-muted-foreground space-y-1">
                      <p><strong className="text-foreground">{contactLabel}</strong></p>
                      <p>{settings.company_name}</p>
                      <p>{settings.address}</p>
                      <p>{emailLabel} {settings.email}</p>
                      <p>{phoneLabel} {settings.phone_display}</p>
                    </div>
                  ) : null}
                </section>
              ))}
            </article>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default Privacy;
