import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Link from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from "@/components/PageMeta";

const copy = {
  en: {
    message: "Oops! Page not found",
    action: "Return to Home",
  },
  zh: {
    message: "抱歉，页面不存在",
    action: "返回首页",
  },
};

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const t = copy[language];

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-5 text-center">
      <PageMeta title={`404 | ${t.message}`} description={t.message} canonicalPath={location.pathname.replace(/^\/(zh|en)/, "") || "/404"} />
      <div>
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t.message}</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          {t.action}
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
