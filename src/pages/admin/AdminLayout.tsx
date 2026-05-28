import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { ChevronDown } from "lucide-react";

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const copy = {
  en: {
    dashboard: "Dashboard",
    todayTasks: "Today's Tasks",
    groupWorkspace: "Workspace",
    groupWebsite: "Website Content",
    groupBusiness: "Business Content",
    groupCustomers: "Customers",
    groupMediaSeo: "Media & SEO",
    groupSystem: "System",
    home: "Home Page",
    about: "About Us",
    faqs: "FAQ",
    beforeAfter: "Before / After",
    brandLogos: "Brand Logos",
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
    media: "Media Library",
    seo: "SEO Settings",
    sitemap: "Sitemap / Robots",
    users: "Admin Users",
    websiteSettings: "Website Settings",
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
    todayTasks: "今日待办",
    groupWorkspace: "工作台",
    groupWebsite: "网站内容",
    groupBusiness: "业务内容",
    groupCustomers: "客户管理",
    groupMediaSeo: "媒体与 SEO",
    groupSystem: "系统设置",
    home: "首页管理",
    about: "关于我们",
    faqs: "FAQ 管理",
    beforeAfter: "Before / After",
    brandLogos: "品牌 Logo",
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
    media: "媒体库",
    seo: "SEO 设置",
    sitemap: "Sitemap / Robots",
    users: "管理员账号",
    websiteSettings: "网站基础设置",
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

const navGroups = [
  {
    key: "groupWorkspace",
    items: [
      { key: "dashboard", path: "/admin/dashboard" },
      { key: "todayTasks", path: "/admin/dashboard#tasks" },
    ],
  },
  {
    key: "groupWebsite",
    items: [
      { key: "home", path: "/admin/home" },
      { key: "about", path: "/admin/about" },
      { key: "faqs", path: "/admin/faqs" },
      { key: "testimonials", path: "/admin/content/testimonials" },
      { key: "brandLogos", path: "/admin/brand-partners" },
      { key: "beforeAfter", path: "/admin/before-after" },
    ],
  },
  {
    key: "groupBusiness",
    items: [
      { key: "services", path: "/admin/services" },
      { key: "projects", path: "/admin/projects" },
      { key: "materials", path: "/admin/materials" },
      { key: "blog", path: "/admin/blog" },
      { key: "serviceAreas", path: "/admin/content/service_areas" },
      { key: "landingPages", path: "/admin/content/landing_pages" },
    ],
  },
  {
    key: "groupCustomers",
    items: [
      { key: "leads", path: "/admin/leads" },
      { key: "quoteRequests", path: "/admin/quotes" },
    ],
  },
  {
    key: "groupMediaSeo",
    items: [
      { key: "media", path: "/admin/media" },
      { key: "seo", path: "/admin/seo" },
      { key: "sitemap", path: "/admin/seo#sitemap" },
    ],
  },
  {
    key: "groupSystem",
    items: [
      { key: "websiteSettings", path: "/admin/settings" },
      { key: "notificationSettings", path: "/admin/notifications" },
      { key: "translationJobs", path: "/admin/content/translation_jobs" },
      { key: "users", path: "/admin/users" },
    ],
  },
];

const NAV_EXPANDED_KEY = "flashcast_admin_nav_expanded_groups";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState<"checking" | "signed-in" | "signed-out" | "denied">("checking");
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];

  const activeGroupKeys = useMemo(() => {
    const pathname = location.pathname;
    return navGroups
      .filter((group) => group.items.some((item) => item.path.split("#")[0] === pathname))
      .map((group) => group.key);
  }, [location.pathname]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(NAV_EXPANDED_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return Object.fromEntries(parsed.map((key) => [key, true]));
    } catch {
      return {};
    }
  });

  useEffect(() => {
    // Always expand the group containing the active route.
    if (!activeGroupKeys.length) return;
    setExpandedGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of activeGroupKeys) {
        if (!next[key]) {
          next[key] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeGroupKeys]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.entries(expandedGroups)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key);
      window.localStorage.setItem(NAV_EXPANDED_KEY, JSON.stringify(keys));
    } catch {
      // ignore
    }
  }, [expandedGroups]);

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
    <main className="min-h-screen bg-muted">
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
      <div className="container-narrow grid gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-xl border border-border bg-card p-3">
          <nav className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.key}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-muted"
                  aria-expanded={Boolean(expandedGroups[group.key])}
                  onClick={() =>
                    setExpandedGroups((prev) => ({
                      ...prev,
                      [group.key]: !prev[group.key],
                    }))
                  }
                >
                  <span>{t[group.key as keyof typeof t]}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedGroups[group.key] ? "rotate-180" : ""}`} />
                </button>
                {expandedGroups[group.key] && (
                  <div className="mt-1 space-y-1">
                    {group.items.map((item) => {
                      const itemPath = item.path.split("#")[0];
                      const isActive = location.pathname === itemPath;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {t[item.key as keyof typeof t]}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
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
