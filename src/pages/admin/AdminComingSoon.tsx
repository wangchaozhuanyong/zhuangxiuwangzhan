import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getAdminLang } from "@/lib/adminLocale";

const copy = {
  en: {
    title: "Module queued for the next phase",
    body: "This dedicated admin module is part of the CMS upgrade. Until it is completed, use the fallback content editor for existing records.",
    fallback: "Open fallback editor",
  },
  zh: {
    title: "该模块已排入下一阶段",
    body: "这个专业后台模块属于 CMS 升级的一部分。完成前，可先使用旧的内容编辑器管理已有记录。",
    fallback: "打开旧内容编辑器",
  },
};

const fallbackMap: Record<string, string> = {
  "/admin/home": "/admin/content/hero_slides",
  "/admin/about": "/admin/content/landing_pages",
  "/admin/faqs": "/admin/content/landing_pages",
  "/admin/services": "/admin/content/services",
  "/admin/projects": "/admin/content/projects",
  "/admin/materials": "/admin/content/materials",
  "/admin/blog": "/admin/content/blog_posts",
  "/admin/media": "/admin/content/projects",
  "/admin/seo": "/admin/content/landing_pages",
  "/admin/users": "/admin/dashboard",
};

const AdminComingSoon = () => {
  const lang = getAdminLang();
  const t = copy[lang];
  const fallback = fallbackMap[window.location.pathname] || "/admin/dashboard";

  return (
    <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="font-display text-2xl font-bold">{t.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.body}</p>
        <Button asChild className="mt-6">
          <Link to={fallback}>{t.fallback}</Link>
        </Button>
      </div>
  );
};

export default AdminComingSoon;
