import { ReactNode, useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const copy = {
  en: {
    dashboard: "Dashboard",
    heroSlides: "Hero Slides",
    services: "Services",
    projects: "Projects",
    blog: "Blog",
    materials: "Materials",
    testimonials: "Testimonials",
    serviceAreas: "Service Areas",
    landingPages: "Landing Pages",
    leads: "Leads",
    quoteRequests: "Quote Requests",
    translationJobs: "Translation Jobs",
    notificationSettings: "Notification Settings",
    notConfiguredTitle: "Supabase is not configured",
    notConfiguredBody: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment to enable the admin panel.",
    backToWebsite: "Back to website",
    checking: "Checking admin session...",
    accessRequired: "Admin access required",
    deniedBody: "Your account is signed in, but it is not listed as a FLASH CAST admin.",
    signOut: "Sign out",
    brand: "FLASH CAST Admin",
    title: "Content & Lead Management",
  },
  zh: {
    dashboard: "总览",
    heroSlides: "首屏轮播",
    services: "服务项目",
    projects: "装修案例",
    blog: "博客",
    materials: "材料库",
    testimonials: "客户评价",
    serviceAreas: "服务区域",
    landingPages: "落地页",
    leads: "线索",
    quoteRequests: "报价请求",
    translationJobs: "翻译任务",
    notificationSettings: "通知设置",
    notConfiguredTitle: "Supabase 未配置",
    notConfiguredBody: "请在环境变量中添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 以启用后台。",
    backToWebsite: "返回网站",
    checking: "正在检查管理员状态...",
    accessRequired: "需要管理员权限",
    deniedBody: "当前账号已登录，但未被列为 FLASH CAST 管理员。",
    signOut: "退出登录",
    brand: "FLASH CAST 后台",
    title: "内容与线索管理",
  },
};

const navItems = [
  { key: "dashboard", path: "/admin/dashboard" },
  { key: "heroSlides", path: "/admin/content/hero_slides" },
  { key: "services", path: "/admin/content/services" },
  { key: "projects", path: "/admin/content/projects" },
  { key: "blog", path: "/admin/content/blog_posts" },
  { key: "materials", path: "/admin/content/materials" },
  { key: "testimonials", path: "/admin/content/testimonials" },
  { key: "serviceAreas", path: "/admin/content/service_areas" },
  { key: "landingPages", path: "/admin/content/landing_pages" },
  { key: "leads", path: "/admin/content/leads" },
  { key: "quoteRequests", path: "/admin/content/quote_requests" },
  { key: "translationJobs", path: "/admin/content/translation_jobs" },
  { key: "notificationSettings", path: "/admin/notifications" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState<"checking" | "signed-in" | "signed-out" | "denied">("checking");
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState("signed-in");
      return;
    }

    let active = true;
    void supabase!.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        setAuthState("signed-out");
        return;
      }

      void supabase!.rpc("is_admin").then(({ data: isAdmin, error }) => {
        if (active) setAuthState(!error && isAdmin ? "signed-in" : "denied");
      });
    });

    const { data: listener } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthState("signed-out");
        return;
      }

      void supabase!.rpc("is_admin").then(({ data: isAdmin, error }) => {
        setAuthState(!error && isAdmin ? "signed-in" : "denied");
      });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-muted pt-24 px-4">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold mb-3">{t.notConfiguredTitle}</h1>
          <p className="text-muted-foreground mb-4">
            {t.notConfiguredBody}
          </p>
          <Button asChild><Link to="/en">{t.backToWebsite}</Link></Button>
        </div>
      </main>
    );
  }

  if (authState === "checking") {
    return (
      <main className="min-h-screen bg-muted pt-24 px-4">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t.checking}</p>
        </div>
      </main>
    );
  }

  if (authState === "signed-out") {
    return <Navigate to="/admin" replace />;
  }

  if (authState === "denied") {
    return (
      <main className="min-h-screen bg-muted pt-24 px-4">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold mb-3">{t.accessRequired}</h1>
          <p className="text-muted-foreground mb-5">
            {t.deniedBody}
          </p>
          <Button
            onClick={async () => {
              await supabase?.auth.signOut();
              window.location.href = "/admin";
            }}
          >
            {t.signOut}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted pt-16">
      <div className="border-b border-border bg-background">
        <div className="container-narrow flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{t.brand}</p>
            <h1 className="font-display text-2xl font-bold">{t.title}</h1>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase?.auth.signOut();
              window.location.href = "/admin";
            }}
          >
            {t.signOut}
          </Button>
        </div>
      </div>
      <div className="container-narrow grid gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-border bg-card p-3 h-fit">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t[item.key as keyof typeof t]}
            </Link>
          ))}
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
};

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  return <AdminLayout>{children}</AdminLayout>;
};

export default AdminLayout;
