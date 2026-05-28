import { Suspense, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, Menu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
const NAV_COLLAPSED_KEY = "flashcast_admin_nav_collapsed";

const AdminLayout = () => {
  const location = useLocation();
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(NAV_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

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
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(NAV_COLLAPSED_KEY, navCollapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [navCollapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, []);

  const activeNavLabel = useMemo(() => {
    const pathname = location.pathname;
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.path.split("#")[0] === pathname) return t[item.key as keyof typeof t];
      }
    }
    return t.title;
  }, [location.pathname, t]);

  const websitePath = lang === "zh" ? "/zh" : "/en";

  const Nav = ({ variant }: { variant: "desktop" | "mobile" }) => (
    <aside
      className={[
        "h-full border-border bg-card",
        variant === "desktop" ? "hidden lg:block" : "block",
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">{t.brand}</p>
          <p className={`truncate text-sm font-semibold ${navCollapsed ? "max-w-[120px]" : "max-w-[220px]"}`}>{t.title}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="hidden lg:inline-flex"
          onClick={() => setNavCollapsed((v) => !v)}
        >
          {navCollapsed ? "»" : "«"}
        </Button>
      </div>
      <nav className={`space-y-4 p-3 ${navCollapsed ? "w-[72px]" : "w-[260px]"}`}>
        {navGroups.map((group) => (
          <div key={group.key}>
            <button
              type="button"
              className={[
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-muted",
                navCollapsed ? "justify-center px-2" : "",
              ].join(" ")}
              aria-expanded={Boolean(expandedGroups[group.key])}
              onClick={() =>
                setExpandedGroups((prev) => ({
                  ...prev,
                  [group.key]: !prev[group.key],
                }))
              }
            >
              <span className={navCollapsed ? "sr-only" : ""}>{t[group.key as keyof typeof t]}</span>
              <ChevronDown
                className={[
                  "h-4 w-4 transition-transform",
                  expandedGroups[group.key] ? "rotate-180" : "",
                  navCollapsed ? "hidden" : "",
                ].join(" ")}
              />
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
                      className={[
                        "block rounded-lg px-3 py-2 text-sm font-medium",
                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
                        navCollapsed ? "px-2 text-center" : "",
                      ].join(" ")}
                      title={t[item.key as keyof typeof t]}
                    >
                      <span className={navCollapsed ? "sr-only" : ""}>{t[item.key as keyof typeof t]}</span>
                      <span className={navCollapsed ? "text-[11px] font-semibold" : "hidden"}>{t[item.key as keyof typeof t].slice(0, 1)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-muted">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <div className="p-4">
                  <SheetTitle className="sr-only">{t.brand}</SheetTitle>
                </div>
                <Nav variant="mobile" />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{activeNavLabel}</p>
              <p className="text-xs text-muted-foreground">{t.brand}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to={websitePath}>{t.backToWebsite}</Link>
            </Button>
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
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[auto_1fr]">
        <div className="sticky top-[64px] hidden h-[calc(100vh-64px)] lg:block">
          <Nav variant="desktop" />
        </div>
        <section className="min-w-0">
          <div className="mx-auto w-full max-w-5xl">
            <Suspense
              fallback={
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminLayout;
