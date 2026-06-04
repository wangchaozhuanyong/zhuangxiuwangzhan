import { useEffect } from "react";
import { ArrowRight, Home, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
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
    <main className="public-main--subpage min-h-screen pt-site-header">
      <PageMeta
        title={`404 | ${t.title}`}
        description={t.metaDescription}
        canonicalPath={location.pathname.replace(/^\/(zh|en)/, "") || "/404"}
        noIndex
      />

      <section className="section-padding" aria-labelledby="not-found-title">
        <div className="container-narrow mx-auto max-w-3xl">
          <div className="subpage-form-panel p-6 text-center md:p-10">
            <div className="accent-line mx-auto mb-5" />
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-gold">{t.eyebrow}</p>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
              <Search className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 id="not-found-title" className="font-display text-3xl font-bold text-foreground md:text-5xl">
              {t.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {t.description}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Button asChild size="lg" className="btn-brand-primary h-12">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t.home}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-gold/30 bg-white/70">
                <Link to="/services">
                  {t.services}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-gold/30 bg-white/70">
                <Link to="/contact">
                  {t.contact}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
