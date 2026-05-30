import { Suspense, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FileSearch,
  FileText,
  FolderKanban,
  Globe2,
  Home,
  Image,
  Images,
  Languages,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquareText,
  Moon,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import {
  adminPublicSitePath,
  applyAdminTheme,
  clearAdminTheme,
  getAdminLang,
  getAdminTheme,
  setAdminLang,
  setAdminTheme,
  type AdminLang,
  type AdminTheme,
} from "@/lib/adminLocale";
import { useAdminDefaultContentSeed } from "@/lib/adminDefaultContent";
import { cn } from "@/lib/utils";

type AdminCopy = {
  dashboard: string;
  todayTasks: string;
  groupWorkspace: string;
  groupWebsite: string;
  groupBusiness: string;
  groupCustomers: string;
  groupMediaSeo: string;
  groupSystem: string;
  home: string;
  pages: string;
  about: string;
  faqs: string;
  beforeAfter: string;
  brandLogos: string;
  services: string;
  projects: string;
  blog: string;
  materials: string;
  testimonials: string;
  serviceAreas: string;
  landingPages: string;
  leads: string;
  quoteRequests: string;
  media: string;
  seo: string;
  sitemap: string;
  users: string;
  websiteSettings: string;
  translationJobs: string;
  notificationSettings: string;
  backToWebsite: string;
  seedRunning: string;
  seedDone: (inserted: number, updated: number) => string;
  seedError: (message: string) => string;
  signOut: string;
  brand: string;
  title: string;
  subtitle: string;
  menu: string;
  collapseNav: string;
  expandNav: string;
  language: string;
  theme: string;
  lightTheme: string;
  darkTheme: string;
  contentReady: string;
  currentPage: string;
};

type NavItem = {
  key: keyof AdminCopy;
  path: string;
  icon: LucideIcon;
};

type NavGroup = {
  key: keyof AdminCopy;
  icon: LucideIcon;
  items: NavItem[];
};

const NAV_EXPANDED_KEY = "flashcast_admin_nav_expanded_groups";
const NAV_COLLAPSED_KEY = "flashcast_admin_nav_collapsed";

const copy: Record<AdminLang, AdminCopy> = {
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
    pages: "Page Content",
    about: "About Us",
    faqs: "常见问题",
    beforeAfter: "Before / After",
    brandLogos: "品牌合作",
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
    sitemap: "站点地图 / Robots",
    users: "Admin Users",
    websiteSettings: "Website Settings",
    translationJobs: "Translation Jobs",
    notificationSettings: "Notification Settings",
    backToWebsite: "View website",
    seedRunning: "Checking default CMS content...",
    seedDone: (inserted, updated) => `Default CMS content ready. Added ${inserted}, filled ${updated}.`,
    seedError: (message) => `Default CMS content sync failed: ${message}`,
    signOut: "Sign out",
    brand: "FLASH CAST Admin",
    title: "Content & Lead Management",
    subtitle: "Manage website content, enquiries, media, SEO and settings.",
    menu: "Open admin menu",
    collapseNav: "Collapse navigation",
    expandNav: "Expand navigation",
    language: "Language",
    theme: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    contentReady: "Content status",
    currentPage: "Current page",
  },
  zh: {
    dashboard: "总览",
    todayTasks: "今日待办",
    groupWorkspace: "工作区",
    groupWebsite: "网站内容",
    groupBusiness: "业务内容",
    groupCustomers: "客户管理",
    groupMediaSeo: "媒体与搜索优化",
    groupSystem: "系统设置",
    home: "首页管理",
    pages: "页面内容",
    about: "关于我们",
    faqs: "常见问题",
    beforeAfter: "改造前后",
    brandLogos: "品牌合作",
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
    sitemap: "站点地图 / Robots",
    users: "管理员账户",
    websiteSettings: "网站基础设置",
    translationJobs: "翻译任务",
    notificationSettings: "通知设置",
    backToWebsite: "查看网站",
    seedRunning: "正在检查后台默认内容...",
    seedDone: (inserted, updated) => `后台默认内容已就绪：新增 ${inserted} 条，补齐 ${updated} 条。`,
    seedError: (message) => `后台默认内容同步失败：${message}`,
    signOut: "退出登录",
    brand: "FLASH CAST 后台",
    title: "内容与线索管理",
    subtitle: "管理网站内容、客户咨询、媒体素材、SEO 和系统设置。",
    menu: "打开后台菜单",
    collapseNav: "收起导航",
    expandNav: "展开导航",
    language: "语言",
    theme: "主题",
    lightTheme: "浅色",
    darkTheme: "深色",
    contentReady: "内容状态",
    currentPage: "当前页面",
  },
};


const navGroups: NavGroup[] = [
  {
    key: "groupWorkspace",
    icon: LayoutDashboard,
    items: [
      { key: "dashboard", path: "/admin/dashboard", icon: BarChart3 },
    ],
  },
  {
    key: "groupWebsite",
    icon: Globe2,
    items: [
      { key: "home", path: "/admin/home", icon: Home },
      { key: "pages", path: "/admin/pages", icon: FileText },
      { key: "about", path: "/admin/about", icon: Building2 },
      { key: "faqs", path: "/admin/faqs", icon: MessageSquareText },
      { key: "testimonials", path: "/admin/content/testimonials", icon: Star },
      { key: "brandLogos", path: "/admin/brand-partners", icon: Sparkles },
      { key: "beforeAfter", path: "/admin/before-after", icon: Images },
    ],
  },
  {
    key: "groupBusiness",
    icon: BriefcaseBusiness,
    items: [
      { key: "services", path: "/admin/services", icon: Wrench },
      { key: "projects", path: "/admin/projects", icon: FolderKanban },
      { key: "materials", path: "/admin/materials", icon: BookOpen },
      { key: "blog", path: "/admin/blog", icon: Newspaper },
      { key: "serviceAreas", path: "/admin/content/service_areas", icon: MapPinned },
      { key: "landingPages", path: "/admin/content/landing_pages", icon: Globe2 },
    ],
  },
  {
    key: "groupCustomers",
    icon: Users,
    items: [
      { key: "leads", path: "/admin/leads", icon: Users },
      { key: "quoteRequests", path: "/admin/quotes", icon: ClipboardList },
    ],
  },
  {
    key: "groupMediaSeo",
    icon: Image,
    items: [
      { key: "media", path: "/admin/media", icon: Image },
      { key: "seo", path: "/admin/seo", icon: Search },
      { key: "sitemap", path: "/admin/seo#sitemap", icon: FileSearch },
    ],
  },
  {
    key: "groupSystem",
    icon: Settings,
    items: [
      { key: "websiteSettings", path: "/admin/settings", icon: Settings },
      { key: "notificationSettings", path: "/admin/notifications", icon: Bell },
      { key: "translationJobs", path: "/admin/content/translation_jobs", icon: Languages },
      { key: "users", path: "/admin/users", icon: UserCog },
    ],
  },
];

const readNavCollapsed = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(NAV_COLLAPSED_KEY) === "1";
};

const readExpandedGroups = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(NAV_EXPANDED_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Object.fromEntries(parsed.map((key) => [key, true]));
  } catch {
    return {};
  }
};

const normalizeHash = (hash: string) => hash.replace(/^#/, "");

const navItems = navGroups.flatMap((group) => group.items);

const hasExactHashNavItem = (pathname: string, hash: string) => {
  const activeHash = normalizeHash(hash);
  if (!activeHash) return false;
  return navItems.some((item) => {
    const [path, fragment] = item.path.split("#");
    return path === pathname && fragment === activeHash;
  });
};

const isAdminNavItemActive = (itemPath: string, pathname: string, hash: string) => {
  const [path, fragment] = itemPath.split("#");
  if (pathname !== path) return false;
  if (fragment) return normalizeHash(hash) === fragment;
  return !hasExactHashNavItem(pathname, hash);
};

const ControlButton = ({
  active,
  children,
  onClick,
  label,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    aria-pressed={active}
    aria-label={label}
    onClick={onClick}
    className={cn(
      "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground",
    )}
  >
    {children}
  </button>
);

const AdminLayout = () => {
  const location = useLocation();
  const [adminLang, setAdminLangState] = useState<AdminLang>(() => getAdminLang());
  const [theme, setTheme] = useState<AdminTheme>(() => getAdminTheme());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(() => readNavCollapsed());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => readExpandedGroups());
  const seedSummary = useAdminDefaultContentSeed();
  const t = copy[adminLang];

  const copyText = useMemo(
    () => (key: keyof AdminCopy) => {
      const value = t[key];
      return typeof value === "string" ? value : String(key);
    },
    [t],
  );

  const activeGroupKeys = useMemo(
    () =>
      navGroups
        .filter((group) => group.items.some((item) => item.path.split("#")[0] === location.pathname))
        .map((group) => group.key),
    [location.pathname],
  );

  useEffect(() => {
    applyAdminTheme(theme, adminLang);
    setAdminTheme(theme);

    return () => clearAdminTheme();
  }, [theme, adminLang]);

  useEffect(() => {
    if (!activeGroupKeys.length) return;
    setExpandedGroups({ [activeGroupKeys[0]]: true });
  }, [activeGroupKeys]);

  useEffect(() => {
    const keys = Object.entries(expandedGroups)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);
    window.localStorage.setItem(NAV_EXPANDED_KEY, JSON.stringify(keys));
  }, [expandedGroups]);

  useEffect(() => {
    window.localStorage.setItem(NAV_COLLAPSED_KEY, navCollapsed ? "1" : "0");
  }, [navCollapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash]);

  const activeNavLabel = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isAdminNavItemActive(item.path, location.pathname, location.hash)) return copyText(item.key);
      }
    }
    return copyText("title");
  }, [copyText, location.hash, location.pathname]);

  const websitePath = adminPublicSitePath(adminLang);

  const changeLanguage = (nextLanguage: AdminLang) => {
    setAdminLang(nextLanguage);
    setAdminLangState(nextLanguage);
  };

  const NavLink = ({ item, compact }: { item: NavItem; compact: boolean }) => {
    const isActive = isAdminNavItemActive(item.path, location.pathname, location.hash);
    const label = copyText(item.key);
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        title={label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex min-h-9 min-w-0 items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-sm font-semibold transition-colors",
          isActive
            ? "border border-accent/25 bg-accent/15 text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/76 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          compact && "mx-auto h-10 w-10 justify-center px-0",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-accent" : "text-sidebar-foreground/58 group-hover:text-sidebar-accent-foreground")} />
        <span className={cn("truncate", compact && "sr-only")}>{label}</span>
      </Link>
    );
  };

  const Nav = ({ variant }: { variant: "desktop" | "mobile" }) => {
    const compact = variant === "desktop" && navCollapsed;
    return (
      <aside
        className={cn(
          "flex h-full min-h-0 flex-col border-sidebar-border bg-sidebar text-sidebar-foreground",
          variant === "desktop" ? "border-r transition-[width] duration-200" : "w-full",
          variant === "desktop" && (compact ? "w-[76px]" : "w-[280px]"),
        )}
      >
        <div className={cn("flex min-h-[76px] items-center gap-3 border-b border-sidebar-border px-4", compact && "justify-center px-3")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold tracking-wide text-primary-foreground">
            FC
          </div>
          <div className={cn("min-w-0 flex-1", compact && "sr-only")}>
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{t.brand}</p>
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{t.title}</p>
          </div>
          {variant === "desktop" && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={navCollapsed ? t.expandNav : t.collapseNav}
              title={navCollapsed ? t.expandNav : t.collapseNav}
              className={cn("h-9 w-9 shrink-0 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", compact && "hidden")}
              onClick={() => setNavCollapsed((value) => !value)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {variant === "desktop" && compact && (
          <div className="border-b border-sidebar-border px-3 py-3">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t.expandNav}
              title={t.expandNav}
              className="h-10 w-10 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => setNavCollapsed(false)}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        <nav className={cn("min-h-0 flex-1 overflow-y-auto px-3 py-4", compact ? "space-y-4" : "space-y-2.5")} aria-label={t.menu}>
          {navGroups.map((group) => {
            const groupLabel = copyText(group.key);
            const GroupIcon = group.icon;
            const isExpanded = Boolean(expandedGroups[group.key]);

            if (compact) {
              return (
                <div key={group.key} className="space-y-1 border-t border-sidebar-border/70 pt-4 first:border-t-0 first:pt-0">
                  <p className="sr-only">{groupLabel}</p>
                  {group.items.map((item) => (
                    <NavLink key={item.path} item={item} compact />
                  ))}
                </div>
              );
            }

            return (
              <div
                key={group.key}
                className={cn(
                  "rounded-xl border border-transparent transition-colors",
                  isExpanded && "border-sidebar-border bg-sidebar-accent/35 p-1.5",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isExpanded && "bg-sidebar text-sidebar-foreground shadow-sm",
                  )}
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedGroups((prev) => {
                      if (prev[group.key]) return {};
                      return { [group.key]: true };
                    })
                  }
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GroupIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{groupLabel}</span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                </button>
                {isExpanded && (
                  <div className="ml-5 mt-1.5 space-y-1 border-l border-sidebar-border pl-2">
                    {group.items.map((item) => (
                      <NavLink key={item.path} item={item} compact={false} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen">
          <Nav variant="desktop" />
        </div>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
            <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-lg lg:hidden">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">{t.menu}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] max-w-[88vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
                    <SheetTitle className="sr-only">{t.brand}</SheetTitle>
                    <Nav variant="mobile" />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t.currentPage}</p>
                  <h1 className="truncate text-base font-semibold leading-6 sm:text-lg">{activeNavLabel}</h1>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <div className="hidden h-10 items-center gap-1 rounded-full border border-border bg-muted/60 p-1 sm:inline-flex" aria-label={t.language}>
                  <ControlButton active={adminLang === "zh"} label="中文" onClick={() => changeLanguage("zh")}>
                    中
                  </ControlButton>
                  <ControlButton active={adminLang === "en"} label="英文" onClick={() => changeLanguage("en")}>
                    EN
                  </ControlButton>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  aria-label={theme === "dark" ? t.lightTheme : t.darkTheme}
                  title={theme === "dark" ? t.lightTheme : t.darkTheme}
                  onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                <Button asChild variant="outline" className="hidden h-10 rounded-lg px-4 md:inline-flex">
                  <Link to={websitePath}>
                    <ExternalLink className="h-4 w-4" />
                    {t.backToWebsite}
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="h-10 rounded-lg px-3 sm:px-4"
                  onClick={async () => {
                    await supabase?.auth.signOut();
                    window.location.href = "/admin";
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.signOut}</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1480px] space-y-5">
              {seedSummary.status === "running" && (
                <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  <span className="font-semibold text-foreground">{t.contentReady}</span>
                  <span className="mx-2 text-border">/</span>
                  {t.seedRunning}
                </div>
              )}
              {seedSummary.status === "done" && (seedSummary.inserted > 0 || seedSummary.updated > 0) && (
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                  {t.seedDone(seedSummary.inserted, seedSummary.updated)}
                </div>
              )}
              {seedSummary.status === "error" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {t.seedError(seedSummary.error || "Unknown error")}
                </div>
              )}

              <Suspense
                fallback={
                  <div className="space-y-4">
                    <Skeleton className="h-9 w-64 max-w-full" />
                    <Skeleton className="h-52 w-full rounded-lg" />
                    <Skeleton className="h-52 w-full rounded-lg" />
                  </div>
                }
              >
                <div key={adminLang} className="min-w-0">
                  <Outlet />
                </div>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
