import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { notFoundPageText } from "@/i18n/notFoundPageText";



const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const t = notFoundPageText[language];

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="fc-route-page fc-route-not-found">
      <PageMeta
        title={`404 | ${t.title}`}
        description={t.metaDescription}
        canonicalPath={location.pathname.replace(/^\/(zh|en)/, "") || "/404"}
        noIndex
      />

      <section aria-labelledby="not-found-title">
        <div>
            <span>{t.eyebrow}</span>
            <b aria-hidden="true">404</b>
            <h1 id="not-found-title">{t.title}</h1>
            <p>{t.description}</p>
            <div>
                <Link to="/">{t.home}</Link>
                <Link to="/services">{t.services}</Link>
                <Link to="/contact">{t.contact}</Link>
            </div>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
